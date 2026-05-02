import { doc, collection, addDoc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Injects a 'Starter Horizon' portfolio for new users to eliminate the empty state.
 * Provides immediate value by showing how assets, goals, and transactions interact.
 */
export async function injectStarterHorizon(userId: string, initialBalance: number, currency: string = 'EUR') {
  try {
    // 1. Create a Primary Liquidity Account (Manual but looks connected)
    await addDoc(collection(db, 'users', userId, 'bankAccounts'), {
      institutionName: 'Main Wealth Hub',
      accountName: 'Primary Liquidity',
      balance: initialBalance,
      currency: currency,
      ownerId: userId,
      status: 'manual',
      lastSynced: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 2. Create an Emergency Fund Goal
    const targetAmount = initialBalance * 3; // 3 months of runway as default
    await addDoc(collection(db, 'users', userId, 'goals'), {
      name: 'Emergency Fund',
      targetAmount: targetAmount > 0 ? targetAmount : 15000,
      currentAmount: initialBalance,
      currency: currency,
      category: 'safety',
      ownerId: userId,
      deadline: Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 1 year from now
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 3. Create a 'Welcome' Transaction
    await addDoc(collection(db, 'users', userId, 'transactions'), {
      description: 'Initial Balance Setup',
      amount: initialBalance,
      type: 'income',
      category: 'income',
      date: serverTimestamp(),
      ownerId: userId,
      status: 'completed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('[OnboardingService] Starter Horizon injection failed:', error);
    return false;
  }
}
