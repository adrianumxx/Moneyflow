import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit, 
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Asset, 
  Liability, 
  FinancialGoal, 
  AIInsight, 
  Transaction, 
  BankAccount, 
  UserProfile,
  Group,
  ConnectedInstitution,
  ConnectedAccount,
  CryptoWallet,
  InvestmentAccount,
  Income
} from '../types';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

export interface FinancialData {
  userProfile: UserProfile | null;
  assets: Asset[];
  liabilities: Liability[];
  goals: FinancialGoal[];
  insights: AIInsight[];
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  connectedInstitutions: ConnectedInstitution[];
  connectedAccounts: ConnectedAccount[];
  cryptoWallets: CryptoWallet[];
  investmentAccounts: InvestmentAccount[];
  income: Income[];
  groups: Group[];
  loading: boolean;
  error: string | null;
}

export const useFinancialData = (user: User | null): FinancialData => {
  const [data, setData] = useState<Omit<FinancialData, 'loading' | 'error'>>({
    userProfile: null,
    assets: [],
    liabilities: [],
    goals: [],
    insights: [],
    transactions: [],
    bankAccounts: [],
    connectedInstitutions: [],
    connectedAccounts: [],
    cryptoWallets: [],
    investmentAccounts: [],
    income: [],
    groups: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setData({
        userProfile: null,
        assets: [],
        liabilities: [],
        goals: [],
        insights: [],
        transactions: [],
        bankAccounts: [],
        connectedInstitutions: [],
        connectedAccounts: [],
        cryptoWallets: [],
        investmentAccounts: [],
        income: [],
        groups: []
      });
      setLoading(false);
      return;
    }

    if (user.uid.startsWith('demo-')) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribes: (() => void)[] = [];

    // 1. User Profile Setup & Listener
    const setupProfile = async () => {
      const profileRef = doc(db, 'users', user.uid);
      try {
        const profileSnap = await getDoc(profileRef);
        if (!profileSnap.exists()) {
          await setDoc(profileRef, {
            uid: user.uid,
            displayName: user.displayName || null,
            email: user.email || null,
            photoURL: user.photoURL || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            hasCompletedOnboarding: false,
            plan: 'free',
            subscriptionStatus: 'trialing',
            trialStartDate: new Date().toISOString(),
            trialDays: 15,
            palantirTrialDays: 7,
          });
        }
      } catch (err: any) {
        console.error('Error ensuring user profile exists:', err);
        setError(`Profile Error: ${err.message}`);
      }

      const unsubProfile = onSnapshot(profileRef, (snap) => {
        if (snap.exists()) {
          setData(prev => ({ ...prev, userProfile: { uid: snap.id, ...snap.data() } as UserProfile }));
        }
        setLoading(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        setLoading(false);
      });
      unsubscribes.push(unsubProfile);
    };

    setupProfile();

    // 2. Assets Listener
    const assetsQuery = query(
      collection(db, 'users', user.uid, 'assets'),
      where('ownerId', '==', user.uid)
    );
    unsubscribes.push(onSnapshot(assetsQuery, (snap) => {
      setData(prev => ({ ...prev, assets: snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset)) }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/assets`)));

    // 3. Liabilities Listener
    const liabilitiesQuery = query(
      collection(db, 'users', user.uid, 'liabilities'),
      where('ownerId', '==', user.uid)
    );
    unsubscribes.push(onSnapshot(liabilitiesQuery, (snap) => {
      setData(prev => ({ ...prev, liabilities: snap.docs.map(d => ({ id: d.id, ...d.data() } as Liability)) }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/liabilities`)));

    // 4. Goals Listener
    const goalsQuery = query(
      collection(db, 'users', user.uid, 'goals'),
      where('ownerId', '==', user.uid)
    );
    unsubscribes.push(onSnapshot(goalsQuery, (snap) => {
      setData(prev => ({ ...prev, goals: snap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialGoal)) }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/goals`)));

    // 5. Insights Listener
    const insightsQuery = query(
      collection(db, 'users', user.uid, 'insights'), 
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc'), 
      limit(5)
    );
    unsubscribes.push(onSnapshot(insightsQuery, (snap) => {
      setData(prev => ({ ...prev, insights: snap.docs.map(d => ({ id: d.id, ...d.data() } as AIInsight)) }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/insights`)));

    // 6. Transactions Listener
    const txsQuery = query(
      collection(db, 'users', user.uid, 'transactions'), 
      where('ownerId', '==', user.uid),
      orderBy('date', 'desc'), 
      limit(20)
    );
    unsubscribes.push(onSnapshot(txsQuery, (snap) => {
      setData(prev => ({ ...prev, transactions: snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)) }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/transactions`)));

    // 7. Bank Accounts Listener
    const banksQuery = query(
      collection(db, 'users', user.uid, 'bankAccounts'),
      where('ownerId', '==', user.uid)
    );
    unsubscribes.push(onSnapshot(banksQuery, (snap) => {
      setData(prev => ({ ...prev, bankAccounts: snap.docs.map(d => ({ id: d.id, ...d.data() } as BankAccount)) }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/bankAccounts`)));
    
    // 8. Connected Institutions Listener
    const instQuery = query(
      collection(db, 'users', user.uid, 'connectedInstitutions'),
      where('ownerId', '==', user.uid)
    );
    unsubscribes.push(onSnapshot(instQuery, (snap) => {
      setData(prev => ({ ...prev, connectedInstitutions: snap.docs.map(d => ({ id: d.id, ...d.data() } as ConnectedInstitution)) }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/connectedInstitutions`)));

    // 9. Connected Accounts Listener
    const connAccQuery = query(
      collection(db, 'users', user.uid, 'connectedAccounts'),
      where('ownerId', '==', user.uid)
    );
    unsubscribes.push(onSnapshot(connAccQuery, (snap) => {
      setData(prev => ({ ...prev, connectedAccounts: snap.docs.map(d => ({ id: d.id, ...d.data() } as ConnectedAccount)) }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/connectedAccounts`)));

    // 10. Crypto Wallets Listener
    const walletsQuery = query(
      collection(db, 'users', user.uid, 'cryptoWallets'),
      where('ownerId', '==', user.uid)
    );
    unsubscribes.push(onSnapshot(walletsQuery, (snap) => {
      setData(prev => ({ ...prev, cryptoWallets: snap.docs.map(d => ({ id: d.id, ...d.data() } as CryptoWallet)) }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/cryptoWallets`)));

    // 11. Investment Accounts Listener
    const investQuery = query(
      collection(db, 'users', user.uid, 'investmentAccounts'),
      where('ownerId', '==', user.uid)
    );
    unsubscribes.push(onSnapshot(investQuery, (snap) => {
      setData(prev => ({ ...prev, investmentAccounts: snap.docs.map(d => ({ id: d.id, ...d.data() } as InvestmentAccount)) }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/investmentAccounts`)));

    // 12. Income Listener
    const incomeQuery = query(
      collection(db, 'users', user.uid, 'income'),
      where('ownerId', '==', user.uid)
    );
    unsubscribes.push(onSnapshot(incomeQuery, (snap) => {
      setData(prev => ({ ...prev, income: snap.docs.map(d => ({ id: d.id, ...d.data() } as Income)) }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/income`)));

    // 13. Groups Listener
    const groupsQuery = query(
      collection(db, 'groups'),
      where('memberIds', 'array-contains', user.uid)
    );
    unsubscribes.push(onSnapshot(groupsQuery, (snap) => {
      setData(prev => ({ ...prev, groups: snap.docs.map(d => ({ id: d.id, ...d.data() } as Group)) }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'groups');
      setError(err.message);
    }));

    return () => {
      console.log(`Cleaning up ${unsubscribes.length} listeners for user ${user.uid}`);
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user]);

  return { ...data, loading, error };
};
