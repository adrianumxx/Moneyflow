import express from 'express';
import { getDb } from '../firebaseAdmin.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/user/purge/dry-run
 * Inspects all user-related data paths and returns counts.
 * Strictly non-destructive.
 */
router.post('/purge/dry-run', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.uid;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Missing UID' });
  }

  try {
    const userRef = getDb().collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    const collections = [
      'assets', 'liabilities', 'goals', 'transactions', 
      'bankAccounts', 'insights', 'connectedInstitutions', 
      'connectedAccounts', 'cryptoWallets', 'investmentAccounts', 
      'palantir_memory'
    ];

    const counts: Record<string, number> = {};
    
    // Fetch all subcollection sizes in parallel
    await Promise.all(collections.map(async (col) => {
      const snap = await userRef.collection(col).get();
      counts[col] = snap.size;
    }));

    // Groups Impact
    const ownedGroupsSnap = await getDb().collection('groups').where('ownerId', '==', userId).get();
    const membershipsSnap = await getDb().collection('groups').where('memberIds', 'array-contains', userId).get();

    res.json({
      profileExists: userSnap.exists,
      collectionCounts: counts,
      groupsImpactSummary: {
        ownedGroupsCount: ownedGroupsSnap.size,
        membershipsCount: membershipsSnap.size
      },
      message: "Dry-run complete. No data has been modified."
    });
  } catch (error: any) {
    console.error(`[userRoutes] Dry-run failed for ${userId}:`, error);
    res.status(500).json({ error: 'Failed to perform data audit.' });
  }
});

/**
 * POST /api/user/purge
 * Permanently deletes all personal user data.
 * Destructive action.
 */
router.post('/purge', async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.uid;
  const { confirmText } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (confirmText !== 'DELETE') return res.status(400).json({ error: 'Invalid confirmation text' });

  try {
    const userRef = getDb().collection('users').doc(userId);
    const collections = [
      'assets', 'liabilities', 'goals', 'transactions', 
      'bankAccounts', 'insights', 'connectedInstitutions', 
      'connectedAccounts', 'cryptoWallets', 'investmentAccounts', 
      'palantir_memory'
    ];

    let deletedDocsCount = 0;
    const deletedCollections: string[] = [];

    // 1. Delete Subcollections
    for (const col of collections) {
      const snap = await userRef.collection(col).get();
      if (!snap.empty) {
        deletedDocsCount += snap.size;
        deletedCollections.push(col);
        // Sequential delete for safety in beta
        const batch = getDb().batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    // 2. Handle Shared Groups
    let groupsUpdatedCount = 0;
    const groupsSnap = await getDb().collection('groups').where('memberIds', 'array-contains', userId).get();
    
    for (const groupDoc of groupsSnap.docs) {
      const groupData = groupDoc.data();
      const isOwner = groupData.ownerId === userId;
      const otherMembers = groupData.memberIds.filter((id: string) => id !== userId);

      if (isOwner && otherMembers.length === 0) {
        // Sole owner, delete group and its subcollections (expenses)
        // Note: Recursive delete would be better, but for now we delete the group doc
        await groupDoc.ref.delete();
        groupsUpdatedCount++;
      } else {
        // Just a member or owner of shared group, remove from memberIds
        await groupDoc.ref.update({
          memberIds: otherMembers,
          updatedAt: new Date()
        });
        groupsUpdatedCount++;
      }
    }

    // 3. Delete Profile (Last step)
    await userRef.delete();

    res.json({
      success: true,
      deletedCollections,
      deletedDocumentsCount: deletedDocsCount,
      groupsUpdatedCount,
      profileDeleted: true,
      message: "Data erasure complete."
    });
  } catch (error: any) {
    console.error(`[userRoutes] Purge failed for ${userId}:`, error);
    res.status(500).json({ error: 'An internal error occurred during data erasure.' });
  }
});

export default router;
