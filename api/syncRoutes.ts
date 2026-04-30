import { Router, Response } from 'express';
import { AuthenticatedRequest } from './authMiddleware.js';
import { getBackendProviderById } from './connectorProviders.js';
import { createRequisitionSession, getInstitutionList, getRequisition, getAccountMetadata, getAccountBalances, getAccountTransactions } from './providers/gocardless.js';
import admin, { db } from './firebaseAdmin.js';

const router = Router();
const getDb = () => db;

/**
 * Structured, safe logging for synchronization errors.
 * Excludes sensitive financial data and credentials.
 */
function safeLogError(action: string, error: any, context: { userId?: string; providerId?: string; institutionId?: string }) {
  console.error(`[SyncError] ${action}`, {
    timestamp: new Date().toISOString(),
    userId: context.userId,
    providerId: context.providerId,
    institutionId: context.institutionId,
    errorType: error?.name || 'UnknownError',
    // We log a sanitized snippet of the error message for debugging, but never return it to the client
    message: error?.message ? error.message.substring(0, 150) : 'No details'
  });
}

/**
 * POST /api/sync/session/create
 * Initiates a new connection session (Link Token or Requisition)
 */
router.post('/session/create', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.uid;
  const { providerId } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!providerId) return res.status(400).json({ error: 'Missing providerId' });

  const provider = getBackendProviderById(providerId);
  if (!provider) return res.status(400).json({ error: 'Unsupported provider' });

  try {
    if (providerId === 'gocardless_sandbox') {
      const secretId = process.env.GOCARDLESS_SECRET_ID;
      const secretKey = process.env.GOCARDLESS_SECRET_KEY;

      if (!secretId || !secretKey) {
        return res.status(200).json({
          success: false,
          status: 'not_configured',
          message: 'GoCardless provider is not configured.'
        });
      }

      const { institutionId } = req.body;
      if (!institutionId) {
        return res.status(400).json({ error: 'Missing institutionId for GoCardless' });
      }

      const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:3000';
      const redirectUrl = `${appUrl}/callback`;
      
      const session = await createRequisitionSession(institutionId, redirectUrl);

      return res.status(200).json({
        success: true,
        status: 'connecting',
        providerId: provider.providerId,
        sessionToken: session.requisitionId,
        nextAction: 'authenticate_with_provider',
        redirectUrl: session.link
      });
    }

    // Placeholder for other providers (Demo etc)
    return res.status(200).json({
      success: true,
      status: 'connecting',
      providerId: provider.providerId,
      sessionToken: `session_stub_${Date.now()}`,
      nextAction: 'authenticate_with_provider',
      message: `Session initialized for ${provider.providerName}.`
    });
  } catch (error) {
    safeLogError('session/create', error, { userId, providerId });
    return res.status(500).json({ error: 'Failed to create sync session' });
  }
});

/**
 * POST /api/sync/session/callback
 * Handles the redirect callback from OAuth flows
 */
router.post('/session/callback', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.uid;
  const { providerId, authCode, requisitionId } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!providerId || !authCode) return res.status(400).json({ error: 'Missing required parameters' });

  try {
    if (providerId === 'gocardless_sandbox') {
      const finalReqId = requisitionId || authCode;
      if (!finalReqId) return res.status(400).json({ error: 'Missing requisitionId' });

      const requisition = await getRequisition(finalReqId);
      
      return res.status(200).json({
        success: true,
        status: requisition.status,
        providerId,
        requisitionId: requisition.requisitionId,
        accounts: requisition.accounts,
        message: 'GoCardless authorization verified.'
      });
    }

    return res.status(200).json({
      success: true,
      status: 'connected',
      providerId,
      message: 'Provider authorization successful.'
    });
  } catch (error) {
    safeLogError('session/callback', error, { userId, providerId });
    return res.status(500).json({ error: 'Failed to process provider callback' });
  }
});

/**
 * POST /api/sync/accounts/sync
 * Manually triggers a synchronization of accounts and transactions
 */
router.post('/accounts/sync', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.uid;
  const { institutionId } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!institutionId) return res.status(400).json({ error: 'Missing institutionId' });

  try {
    // Verify ownership of the institution before syncing
    const instDoc = await getDb().collection('users').doc(userId).collection('connectedInstitutions').doc(institutionId).get();
    
    if (!instDoc.exists) {
      return res.status(404).json({ error: 'Connected institution not found' });
    }

    const instData = instDoc.data();
    const providerId = instData?.providerId;

    if (providerId === 'gocardless_sandbox') {
      const requisitionId = instData?.requisitionId;
      if (!requisitionId) {
        return res.status(400).json({ error: 'Missing requisitionId for GoCardless sync' });
      }

      const requisition = await getRequisition(requisitionId);
      const accounts = await Promise.all(
        requisition.accounts.map(async (accId: string) => {
          const metadata = await getAccountMetadata(accId);
          try {
            const balanceData = await getAccountBalances(accId);
            return { ...metadata, ...balanceData };
          } catch (err) {
            console.warn(`[Sync] Could not fetch balance for ${accId}, falling back to metadata only.`);
            return { ...metadata, balance: 0, balanceType: 'unavailable' };
          }
        })
      );

      const { syncTransactions = false } = req.body;

      // Persist discovered accounts to Firestore
      for (const acc of accounts) {
        const accQuery = await getDb().collection('users').doc(userId)
          .collection('connectedAccounts')
          .where('providerAccountId', '==', acc.providerAccountId)
          .get();

        const accData = {
          providerAccountId: acc.providerAccountId,
          institutionId: institutionId,
          providerId: providerId,
          name: acc.name,
          type: acc.type,
          balance: acc.balance,
          currency: acc.currency,
          status: acc.status,
          lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
          ownerId: userId
        };

        if (accQuery.empty) {
          await getDb().collection('users').doc(userId).collection('connectedAccounts').add(accData);
        } else {
          await accQuery.docs[0].ref.update(accData);
        }

        // Handle transaction sync if requested
        if (syncTransactions) {
          try {
            const txs = await getAccountTransactions(acc.providerAccountId);
            const txBatch = getDb().batch();
            
            for (const tx of txs) {
              const txQuery = await getDb().collection('users').doc(userId)
                .collection('transactions')
                .where('providerTransactionId', '==', tx.providerTransactionId)
                .limit(1)
                .get();

              if (txQuery.empty) {
                const txRef = getDb().collection('users').doc(userId).collection('transactions').doc();
                txBatch.set(txRef, {
                  ...tx,
                  description: tx.description.substring(0, 200),
                  date: admin.firestore.Timestamp.fromDate(new Date(tx.bookingDate || new Date())),
                  category: 'other',
                  ownerId: userId,
                  createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
              }
            }
            await txBatch.commit();
          } catch (txErr) {
            console.warn(`[Sync] Transaction fetch failed for ${acc.providerAccountId}`);
          }
        }
      }

      // Update sync status in background
      instDoc.ref.update({
        status: 'synced',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }).catch(err => safeLogError('accounts/sync/update', err, { userId, institutionId }));

      return res.status(200).json({
        success: true,
        status: 'synced',
        providerId,
        institutionId,
        accounts,
        message: `Synced ${accounts.length} accounts with balances.`
      });
    }

    // Update sync status for other providers
    await instDoc.ref.update({
      status: 'syncing',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({
      success: true,
      status: 'syncing',
      institutionId,
      message: 'Account synchronization started in background.'
    });
  } catch (error) {
    safeLogError('accounts/sync', error, { userId, institutionId });
    return res.status(500).json({ error: 'Failed to trigger account sync' });
  }
});

/**
 * POST /api/sync/status
 * Retrieves the current connection status of an institution
 */
router.post('/status', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.uid;
  const { institutionId } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!institutionId) return res.status(400).json({ error: 'Missing institutionId' });

  try {
    const instDoc = await getDb().collection('users').doc(userId).collection('connectedInstitutions').doc(institutionId).get();
    
    if (!instDoc.exists) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const data = instDoc.data();
    return res.status(200).json({
      success: true,
      status: data?.status || 'unknown',
      providerId: data?.providerId,
      lastSyncedAt: data?.lastSyncedAt
    });
  } catch (error) {
    safeLogError('status', error, { userId, institutionId });
    return res.status(500).json({ error: 'Failed to fetch status' });
  }
});

/**
 * POST /api/sync/disconnect
 * Gracefully disconnects a provider and marks records accordingly
 */
router.post('/disconnect', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.uid;
  const { institutionId } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!institutionId) return res.status(400).json({ error: 'Missing institutionId' });

  try {
    const instRef = getDb().collection('users').doc(userId).collection('connectedInstitutions').doc(institutionId);
    const instDoc = await instRef.get();

    if (!instDoc.exists) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    if (instDoc.data()?.ownerId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Mark as disconnected instead of deleting (preserves historical wealth snapshots)
    await instRef.update({
      status: 'disconnected',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Optionally mark associated accounts as disconnected
    const accountsSnapshot = await getDb().collection('users').doc(userId)
      .collection('connectedAccounts')
      .where('institutionId', '==', institutionId)
      .get();

    const batch = getDb().batch();
    accountsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        status: 'disconnected',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();

    return res.status(200).json({
      success: true,
      status: 'disconnected',
      message: 'Institution successfully disconnected. Historical data preserved.'
    });
  } catch (error) {
    safeLogError('disconnect', error, { userId, institutionId });
    return res.status(500).json({ error: 'Failed to disconnect institution' });
  }
});

/**
 * POST /api/sync/institutions/list
 * Lists available banking institutions for a provider (GoCardless sandbox supported)
 */
router.post('/institutions/list', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.uid;
  const { providerId, countryCode = 'BE' } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!providerId) return res.status(400).json({ error: 'Missing providerId' });

  try {
    if (providerId === 'gocardless_sandbox') {
      try {
        const institutions = await getInstitutionList(countryCode);
        return res.status(200).json({
          success: true,
          providerId,
          countryCode,
          institutions
        });
      } catch (error: any) {
        if (error.message === 'GOCARDLESS_NOT_CONFIGURED') {
          return res.status(200).json({
            success: false,
            status: 'not_configured',
            message: 'GoCardless provider is not configured.'
          });
        }
        throw error;
      }
    }

    // Default response for other providers
    return res.status(200).json({
      success: true,
      providerId,
      institutions: []
    });
  } catch (error) {
    safeLogError('institutions/list', error, { userId, providerId });
    return res.status(500).json({ error: 'Failed to fetch institution list' });
  }
});

export default router;
