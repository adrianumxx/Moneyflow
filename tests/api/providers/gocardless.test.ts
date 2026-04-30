import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getInstitutionList } from '../../../server/providers/gocardless';

// Mock global fetch
global.fetch = vi.fn();

describe('GoCardless Provider Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOCARDLESS_SECRET_ID = 'test_id';
    process.env.GOCARDLESS_SECRET_KEY = 'test_key';
  });

  it('getInstitutionList handles auth and returns normalized data', async () => {
    // Mock Auth Response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access: 'mock_token' })
    } as any);

    // Mock Institutions Response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        { id: 'bank_1', name: 'Mock Bank', bic: 'MOCKBEBB', transaction_total_days: '90' }
      ])
    } as any);

    const result = await getInstitutionList('BE');
    
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'bank_1',
      name: 'Mock Bank',
      bic: 'MOCKBEBB',
      transactionTotalDays: '90',
      logo: undefined,
      countries: undefined
    });
  });

  it('throws GOCARDLESS_NOT_CONFIGURED if env vars are missing', async () => {
    delete process.env.GOCARDLESS_SECRET_ID;
    delete process.env.GOCARDLESS_SECRET_KEY;

    await expect(getInstitutionList('BE')).rejects.toThrow('GOCARDLESS_NOT_CONFIGURED');
  });

  it('handles fetch failures gracefully', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized'
    } as any);

    await expect(getInstitutionList('BE')).rejects.toThrow('Could not retrieve institution list');
  });

  it('createRequisitionSession returns only safe fields', async () => {
    // Mock Auth Response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access: 'mock_token' })
    } as any);

    // Mock Requisition Response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        id: 'req_123', 
        link: 'https://bank.link', 
        status: 'CR', 
        institution_id: 'bank_1',
        secret_data: 'DO_NOT_RETURN' 
      })
    } as any);

    const result = await (await import('../../../server/providers/gocardless')).createRequisitionSession('bank_1', 'https://app.com/callback');
    
    expect(result).toEqual({
      requisitionId: 'req_123',
      link: 'https://bank.link',
      status: 'CR',
      institutionId: 'bank_1'
    });
    expect(result).not.toHaveProperty('secret_data');
  });

  it('createRequisitionSession throws GOCARDLESS_NOT_CONFIGURED if env missing', async () => {
    delete process.env.GOCARDLESS_SECRET_ID;
    delete process.env.GOCARDLESS_SECRET_KEY;
    const { createRequisitionSession } = await import('../../../server/providers/gocardless');
    await expect(createRequisitionSession('bank_1', 'url')).rejects.toThrow('GOCARDLESS_NOT_CONFIGURED');
  });

  it('createRequisitionSession handles fetch failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access: 'mock_token' })
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request'
    } as any);

    const { createRequisitionSession } = await import('../../../server/providers/gocardless');
    await expect(createRequisitionSession('bank_1', 'url')).rejects.toThrow('Could not create requisition session');
  });

  it('getRequisition returns status and accounts', async () => {
    // Mock Auth Response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access: 'mock_token' })
    } as any);

    // Mock Requisition Response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        id: 'req_123', 
        status: 'LN', 
        accounts: ['acc_1', 'acc_2'],
        institution_id: 'bank_1'
      })
    } as any);

    const { getRequisition } = await import('../../../server/providers/gocardless');
    const result = await getRequisition('req_123');
    
    expect(result).toEqual({
      requisitionId: 'req_123',
      status: 'LN',
      accounts: ['acc_1', 'acc_2'],
      institutionId: 'bank_1'
    });
  });

  it('getAccountMetadata returns normalized account info', async () => {
    // Mock Auth Response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access: 'mock_token' })
    } as any);

    // Mock Account Metadata Response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        id: 'acc_123', 
        name: 'Savings', 
        cash_account_type: 'savings',
        currency: 'EUR',
        status: 'READY'
      })
    } as any);

    const { getAccountMetadata } = await import('../../../server/providers/gocardless');
    const result = await getAccountMetadata('acc_123');
    
    expect(result).toEqual({
      providerAccountId: 'acc_123',
      name: 'Savings',
      type: 'savings',
      currency: 'EUR',
      status: 'READY'
    });
  });

  it('getAccountBalances returns normalized balance info', async () => {
    // Mock Auth Response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access: 'mock_token' })
    } as any);

    // Mock Balance Response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        balances: [
          {
            balanceAmount: { amount: '1250.50', currency: 'EUR' },
            balanceType: 'expected',
            referenceDate: '2026-04-29'
          }
        ]
      })
    } as any);

    const { getAccountBalances } = await import('../../../server/providers/gocardless');
    const result = await getAccountBalances('acc_123');
    
    expect(result).toEqual({
      providerAccountId: 'acc_123',
      balance: 1250.50,
      currency: 'EUR',
      balanceType: 'expected',
      referenceDate: '2026-04-29'
    });
  });
 
  it('getAccountTransactions normalizes booked and pending txs with sign detection', async () => {
    // Mock Auth
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access: 'mock_token' })
    } as any);
 
    // Mock Transactions
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        transactions: {
          booked: [
            { 
              transactionId: 'tx_1', 
              transactionAmount: { amount: '-50.00', currency: 'EUR' },
              remittanceInformationUnstructured: 'Starbucks',
              bookingDate: '2026-04-29'
            },
            { 
              transactionId: 'tx_2', 
              transactionAmount: { amount: '1500.00', currency: 'EUR' },
              remittanceInformationUnstructured: 'Salary',
              bookingDate: '2026-04-28'
            }
          ],
          pending: [
            { 
              transactionId: 'tx_3', 
              transactionAmount: { amount: '-20.00', currency: 'EUR' },
              details: 'Amazon',
              valueDate: '2026-04-30'
            }
          ]
        }
      })
    } as any);
 
    const { getAccountTransactions } = await import('../../../server/providers/gocardless');
    const result = await getAccountTransactions('acc_123');
    
    expect(result).toHaveLength(3);
    
    // Expense check
    expect(result[0]).toMatchObject({
      providerTransactionId: 'tx_1',
      amount: 50.00,
      type: 'expense',
      description: 'Starbucks',
      status: 'booked'
    });
 
    // Income check
    expect(result[1]).toMatchObject({
      providerTransactionId: 'tx_2',
      amount: 1500.00,
      type: 'income',
      description: 'Salary',
      status: 'booked'
    });
 
    // Pending check
    expect(result[2]).toMatchObject({
      providerTransactionId: 'tx_3',
      status: 'pending',
      description: 'Amazon'
    });
  });
});
