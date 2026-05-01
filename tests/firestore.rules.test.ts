import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { 
  initializeTestEnvironment, 
  RulesTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { setDoc, getDoc, updateDoc, doc } from 'firebase/firestore';

/**
 * Firestore Security Rules
 * Verifies that the ruleset can be loaded and parsed by the emulator environment.
 * NOTE: This test requires a running Firestore emulator (port 8080).
 * Run with: npm run test:rules
 */

describe('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: `moneyflow-rules-whitelist-${Date.now()}`,
      firestore: {
        rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
        host: 'localhost',
        port: 8080
      },
    });
  });

  afterAll(async () => {
    if (testEnv) await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('User Profile Whitelisting', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/alice'), {
          uid: 'alice',
          email: 'alice@example.com',
          displayName: 'Alice',
          baseCurrency: 'USD'
        });
      });
    });

    it('allows updating whitelisted fields', async () => {
      const alice = testEnv.authenticatedContext('alice');
      await assertSucceeds(updateDoc(doc(alice.firestore(), 'users/alice'), {
        displayName: 'Alice Melillo',
        country: 'Italy',
        baseCurrency: 'EUR',
        primaryGoal: 'financial_independence',
        experienceLevel: 'advanced',
        updatedAt: new Date()
      }));
    });

    it('denies updating sensitive or forbidden fields', async () => {
      const alice = testEnv.authenticatedContext('alice');
      
      // Attempt to hijack UID
      await assertFails(updateDoc(doc(alice.firestore(), 'users/alice'), {
        uid: 'attacker'
      }));

      // Attempt to grant self-access to premium features
      await assertFails(updateDoc(doc(alice.firestore(), 'users/alice'), {
        plan: 'QUANTUM_VIP',
        subscriptionStatus: 'active'
      }));

      // Attempt to modify stripe metadata
      await assertFails(updateDoc(doc(alice.firestore(), 'users/alice'), {
        stripeCustomerId: 'fake_customer'
      }));

      // Attempt to inject random admin flags
      await assertFails(updateDoc(doc(alice.firestore(), 'users/alice'), {
        isAdmin: true,
        role: 'admin',
        admin: true,
        permissions: ['all'],
        isPremium: true
      }));
    });

    it('denies user from updating another users profile', async () => {
      const bob = testEnv.authenticatedContext('bob');
      await assertFails(updateDoc(doc(bob.firestore(), 'users/alice'), {
        displayName: 'Hacked by Bob'
      }));
    });

    it('denies user from setting sensitive fields during creation', async () => {
      const eve = testEnv.authenticatedContext('eve');
      await assertFails(setDoc(doc(eve.firestore(), 'users/eve'), {
        uid: 'eve',
        email: 'eve@example.com',
        plan: 'premium',
        subscriptionStatus: 'active',
        admin: true,
        role: 'admin'
      }));
    });
  });

  describe('User Profile Isolation', () => {
    it('allows a user to read their own profile', async () => {
      const alice = testEnv.authenticatedContext('alice');
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/alice'), {
          uid: 'alice',
          email: 'alice@example.com'
        });
      });
      
      await assertSucceeds(getDoc(doc(alice.firestore(), 'users/alice')));
    });

    it('denies a user from reading another users profile', async () => {
      const bob = testEnv.authenticatedContext('bob');
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/alice'), {
          uid: 'alice',
          email: 'alice@example.com'
        });
      });
      
      await assertFails(getDoc(doc(bob.firestore(), 'users/alice')));
    });

    it('denies a user from writing to another users profile', async () => {
      const bob = testEnv.authenticatedContext('bob');
      await assertFails(setDoc(doc(bob.firestore(), 'users/alice'), {
        uid: 'alice',
        email: 'malicious@example.com'
      }));
    });
  });

  describe('Financial Subcollections ownerId Integrity', () => {
    it('allows user to create asset with matching ownerId in their path', async () => {
      const alice = testEnv.authenticatedContext('alice');
      await assertSucceeds(setDoc(doc(alice.firestore(), 'users/alice/assets/a1'), {
        ownerId: 'alice',
        name: 'Cash Reserve',
        type: 'cash',
        value: 5000
      }));
    });

    it('denies user from creating asset with mismatched ownerId', async () => {
      const alice = testEnv.authenticatedContext('alice');
      await assertFails(setDoc(doc(alice.firestore(), 'users/alice/assets/a1'), {
        ownerId: 'bob',
        name: 'Shadow Asset',
        type: 'cash',
        value: 5000
      }));
    });

    it('denies user from creating asset in another users document tree', async () => {
      const alice = testEnv.authenticatedContext('alice');
      await assertFails(setDoc(doc(alice.firestore(), 'users/bob/assets/a1'), {
        ownerId: 'bob',
        name: 'Bobs Cash',
        type: 'cash',
        value: 1000
      }));
    });

    it('enforces ownerId integrity for transactions', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const txPath = 'users/alice/transactions/t1';
      
      await assertSucceeds(setDoc(doc(alice.firestore(), txPath), {
        ownerId: 'alice',
        amount: -50,
        description: 'Coffee',
        category: 'Food',
        type: 'expense',
        date: new Date()
      }));

      await assertFails(setDoc(doc(alice.firestore(), txPath), {
        ownerId: 'bob',
        amount: -50,
        description: 'Coffee',
        category: 'Food',
        type: 'expense',
        date: new Date()
      }));
    });

    it('enforces ownerId integrity for bank accounts', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const bankPath = 'users/alice/bankAccounts/b1';

      await assertSucceeds(setDoc(doc(alice.firestore(), bankPath), {
        ownerId: 'alice',
        institutionName: 'Global Bank',
        balance: 10000
      }));

      await assertFails(setDoc(doc(alice.firestore(), bankPath), {
        ownerId: 'bob',
        institutionName: 'Global Bank',
        balance: 10000
      }));
    });

    it('enforces ownerId integrity for liabilities', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const path = 'users/alice/liabilities/l1';
      
      await assertSucceeds(setDoc(doc(alice.firestore(), path), {
        ownerId: 'alice',
        name: 'Mortgage',
        totalAmount: 300000,
        remainingAmount: 250000
      }));

      await assertFails(setDoc(doc(alice.firestore(), path), {
        ownerId: 'bob',
        name: 'Mortgage',
        totalAmount: 300000,
        remainingAmount: 250000
      }));
    });
  });

  describe('Shared Group Access (Circles)', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        // Setup a group where Alice is owner and Charlie is a member
        await setDoc(doc(context.firestore(), 'groups/g1'), {
          ownerId: 'alice',
          createdBy: 'alice',
          name: 'Family Circle',
          memberIds: ['alice', 'charlie'],
          memberCount: 2
        });
      });
    });

    it('allows a listed member to read the group', async () => {
      const charlie = testEnv.authenticatedContext('charlie');
      await assertSucceeds(getDoc(doc(charlie.firestore(), 'groups/g1')));
    });

    it('denies a non-member from accessing the group data', async () => {
      const bob = testEnv.authenticatedContext('bob');
      // If rules allow 'get' for all signed-in, this will pass 'succeeds' but 
      // the requirement 'non-member cannot read' implies we should test for failure.
      await assertFails(getDoc(doc(bob.firestore(), 'groups/g1')));
    });

    it('denies a non-member from updating the group', async () => {
      const bob = testEnv.authenticatedContext('bob');
      await assertFails(updateDoc(doc(bob.firestore(), 'groups/g1'), {
        name: 'Hacked by Bob'
      }));
    });

    it('allows an authenticated user to create their own group', async () => {
      const alice = testEnv.authenticatedContext('alice');
      await assertSucceeds(setDoc(doc(alice.firestore(), 'groups/alice_circle'), {
        ownerId: 'alice',
        createdBy: 'alice',
        name: 'My New Circle',
        memberIds: ['alice'],
        updatedAt: new Date()
      }));
    });

    it('enforces membership for subcollection access (expenses)', async () => {
      const bob = testEnv.authenticatedContext('bob');
      await assertFails(getDoc(doc(bob.firestore(), 'groups/g1/expenses/e1')));
    });
  });

  describe('Connector Architecture subcollections', () => {
    it('enforces ownerId integrity and schema for connectedInstitutions', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const path = 'users/alice/connectedInstitutions/i1';
      
      await assertSucceeds(setDoc(doc(alice.firestore(), path), {
        ownerId: 'alice',
        providerId: 'revolut',
        providerName: 'Revolut',
        status: 'connected'
      }));

      await assertFails(setDoc(doc(alice.firestore(), path), {
        ownerId: 'bob',
        providerId: 'revolut',
        providerName: 'Revolut',
        status: 'connected'
      }));

      await assertFails(setDoc(doc(alice.firestore(), path), {
        ownerId: 'alice',
        providerId: 'revolut',
        providerName: 'Revolut',
        status: 'INVALID_STATUS'
      }));
    });

    it('enforces ownerId integrity and schema for connectedAccounts', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const path = 'users/alice/connectedAccounts/a1';
      
      await assertSucceeds(setDoc(doc(alice.firestore(), path), {
        ownerId: 'alice',
        institutionId: 'i1',
        accountName: 'Main Checking',
        accountType: 'checking',
        balance: 1000
      }));

      await assertFails(setDoc(doc(alice.firestore(), path), {
        ownerId: 'alice',
        institutionId: 'i1',
        accountName: 'Main Checking',
        accountType: 'INVALID_TYPE',
        balance: 1000
      }));
    });

    it('enforces ownerId integrity and schema for cryptoWallets', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const path = 'users/alice/cryptoWallets/w1';
      
      await assertSucceeds(setDoc(doc(alice.firestore(), path), {
        ownerId: 'alice',
        address: '0x123',
        network: 'ethereum',
        name: 'My Wallet'
      }));

      await assertFails(setDoc(doc(alice.firestore(), path), {
        ownerId: 'bob',
        address: '0x123',
        network: 'ethereum',
        name: 'My Wallet'
      }));
    });

    it('enforces ownerId integrity and schema for investmentAccounts', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const path = 'users/alice/investmentAccounts/v1';
      
      await assertSucceeds(setDoc(doc(alice.firestore(), path), {
        ownerId: 'alice',
        providerName: 'Vanguard',
        accountName: 'S&P 500 ETF',
        balance: 50000
      }));

      await assertFails(setDoc(doc(alice.firestore(), path), {
        ownerId: 'bob',
        providerName: 'Vanguard',
        accountName: 'S&P 500 ETF',
        balance: 50000
      }));
    });
  });

  describe('Admin Access via Custom Claims', () => {
    it('allows admin with token.admin == true to update groups', async () => {
      const admin = testEnv.authenticatedContext('admin_user', { admin: true });
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'groups/g1'), {
          ownerId: 'alice',
          createdBy: 'alice',
          name: 'Original Name',
          memberIds: ['alice']
        });
      });

      await assertSucceeds(updateDoc(doc(admin.firestore(), 'groups/g1'), {
        name: 'Admin Overwritten Name'
      }));
    });

    it('denies user with specific email but no admin claim from admin access', async () => {
      const fakeAdmin = testEnv.authenticatedContext('fake_admin', { email: 'adrianomelilloXX@gmail.com' });
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'groups/g1'), {
          ownerId: 'alice',
          createdBy: 'alice',
          name: 'Original Name',
          memberIds: ['alice']
        });
      });

      // Should fail because email check was removed
      await assertFails(updateDoc(doc(fakeAdmin.firestore(), 'groups/g1'), {
        name: 'Email Hijack Attempt'
      }));
    });
  });

  describe('Group Expense Permissions', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'groups/g1'), {
          ownerId: 'alice',
          createdBy: 'alice',
          name: 'Shared Group',
          memberIds: ['alice', 'charlie']
        });
      });
    });

    it('allows member to create an expense', async () => {
      const charlie = testEnv.authenticatedContext('charlie');
      await assertSucceeds(setDoc(doc(charlie.firestore(), 'groups/g1/expenses/e1'), {
        groupId: 'g1',
        memberIds: ['alice', 'charlie'],
        amount: 30,
        description: 'Pizza',
        paidBy: 'charlie',
        category: 'Food',
        date: new Date(),
        splitType: 'equal',
        splits: { alice: 15, charlie: 15 }
      }));
    });

    it('denies non-member from creating an expense', async () => {
      const bob = testEnv.authenticatedContext('bob');
      await assertFails(setDoc(doc(bob.firestore(), 'groups/g1/expenses/e1'), {
        groupId: 'g1',
        memberIds: ['alice', 'charlie'],
        amount: 30,
        description: 'Steal',
        paidBy: 'bob',
        category: 'Theft',
        date: new Date()
      }));
    });
  });

  describe('Infrastructure Smoke Test', () => {
    it('successfully initializes the test environment', () => {
      expect(testEnv).toBeDefined();
    });

    it('contains the global safety net (default deny)', () => {
      const rules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
      expect(rules).toContain('allow read, write: if false;');
    });
  });
});
