import { Router, Response } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { getBackendProviderById } from './connectorProviders';
import admin from 'firebase-admin';

const router = Router();
const db = admin.firestore();

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
    // Placeholder for real provider session creation logic
    return res.status(200).json({
      success: true,
      status: 'connecting',
      providerId: provider.providerId,
      sessionToken: `session_stub_${Date.now()}`,
      nextAction: 'authenticate_with_provider',
      message: `Session initialized for ${provider.providerName}.`
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return res.status(500).json({ error: 'Failed to create sync session' });
  }
});

/**
 * POST /api/sync/session/callback
 * Handles the redirect callback from OAuth flows
 */
router.post('/session/callback', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.uid;
  const { providerId, authCode } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!providerId || !authCode) return res.status(400).json({ error: 'Missing required parameters' });

  try {
    return res.status(200).json({
      success: true,
      status: 'connected',
      providerId,
      message: 'Provider authorization successful.'
    });
  } catch (error) {
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
    const instDoc = await db.collection('users').doc(userId).collection('connectedInstitutions').doc(institutionId).get();
    
    if (!instDoc.exists) {
      return res.status(404).json({ error: 'Connected institution not found' });
    }

    const instData = instDoc.data();
    if (instData?.ownerId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Update sync status
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
    const instDoc = await db.collection('users').doc(userId).collection('connectedInstitutions').doc(institutionId).get();
    
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
    const instRef = db.collection('users').doc(userId).collection('connectedInstitutions').doc(institutionId);
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
    const accountsSnapshot = await db.collection('users').doc(userId)
      .collection('connectedAccounts')
      .where('institutionId', '==', institutionId)
      .get();

    const batch = db.batch();
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
    return res.status(500).json({ error: 'Failed to disconnect institution' });
  }
});

export default router;
