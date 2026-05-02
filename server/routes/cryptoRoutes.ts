import express from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { fetchNativeBalance } from '../services/cryptoService.js';
import admin, { getDb } from '../firebaseAdmin.js';

const router = express.Router();

/**
 * POST /api/crypto/sync
 * Fetches live balance for a given wallet address and updates Firestore.
 */
router.post('/sync', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.uid;
  const { address, chain = 'ethereum', label = 'My Wallet' } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!address) {
    return res.status(400).json({ error: 'Wallet address is required.' });
  }

  try {
    const balanceData = await fetchNativeBalance(address, chain);

    if (balanceData.error) {
      return res.status(400).json({ error: balanceData.error });
    }

    const db = getDb();
    
    // We use a composite ID based on chain and address to avoid duplicates
    const walletId = `${chain}_${address.toLowerCase()}`;
    const walletRef = db.collection('users').doc(userId).collection('crypto_wallets').doc(walletId);

    const walletData = {
      id: walletId,
      ownerId: userId,
      address,
      chain,
      label,
      nativeBalance: balanceData.nativeBalance,
      currency: balanceData.symbol,
      status: 'connected',
      lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await walletRef.set(walletData, { merge: true });

    res.json({ success: true, data: walletData });

  } catch (error: any) {
    console.error(`[CryptoRoute] Sync failed for ${userId}:`, error);
    res.status(500).json({ error: 'Internal server error during crypto sync.' });
  }
});

export default router;
