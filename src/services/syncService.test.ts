import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createSyncSession, 
  disconnectInstitution, 
  syncAccounts, 
  handleSyncCallback,
  getSyncStatus,
  listInstitutions
} from './syncService';
import * as api from '../utils/api';

vi.mock('../utils/api', () => ({
  authenticatedFetch: vi.fn()
}));

describe('syncService Security & Integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createSyncSession calls /api/sync/session/create and never sends userId', async () => {
    vi.mocked(api.authenticatedFetch).mockResolvedValue({
      json: async () => ({ success: true })
    } as any);

    await createSyncSession('revolut');
    
    const [url, options]: any = vi.mocked(api.authenticatedFetch).mock.calls[0];
    expect(url).toBe('/api/sync/session/create');
    expect(options.method).toBe('POST');
    
    const body = JSON.parse(options.body);
    expect(body).toHaveProperty('providerId', 'revolut');
    expect(body).not.toHaveProperty('userId');
    expect(body).not.toHaveProperty('uid');
  });

  it('disconnectInstitution calls /api/sync/disconnect and never sends userId', async () => {
    vi.mocked(api.authenticatedFetch).mockResolvedValue({
      json: async () => ({ success: true })
    } as any);

    await disconnectInstitution('inst_123');
    
    const [url, options]: any = vi.mocked(api.authenticatedFetch).mock.calls[0];
    expect(url).toBe('/api/sync/disconnect');
    
    const body = JSON.parse(options.body);
    expect(body).toHaveProperty('institutionId', 'inst_123');
    expect(body).not.toHaveProperty('userId');
    expect(body).not.toHaveProperty('uid');
  });

  it('syncAccounts calls /api/sync/accounts/sync and never sends userId', async () => {
    vi.mocked(api.authenticatedFetch).mockResolvedValue({
      json: async () => ({ 
        success: true, 
        status: 'synced', 
        accounts: [{ providerAccountId: 'acc_1', balance: 100 }] 
      })
    } as any);

    const result = await syncAccounts('inst_123');
    expect(result.success).toBe(true);
    expect(result.accounts?.[0]).toHaveProperty('balance', 100);
    
    const [url, options]: any = vi.mocked(api.authenticatedFetch).mock.calls[0];
    expect(url).toBe('/api/sync/accounts/sync');
    
    const body = JSON.parse(options.body);
    expect(body).toHaveProperty('institutionId', 'inst_123');
    expect(body).not.toHaveProperty('userId');
  });

  it('syncAccounts supports syncTransactions option and never sends userId', async () => {
    vi.mocked(api.authenticatedFetch).mockResolvedValue({
      json: async () => ({ success: true, status: 'synced' })
    } as any);

    await syncAccounts('inst_123', { syncTransactions: true });
    
    const [, options]: any = vi.mocked(api.authenticatedFetch).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toEqual({ institutionId: 'inst_123', syncTransactions: true });
    expect(body).not.toHaveProperty('userId');
  });

  it('handleSyncCallback correctly passes provider and authCode without userId', async () => {
    vi.mocked(api.authenticatedFetch).mockResolvedValue({
      json: async () => ({ success: true })
    } as any);

    await handleSyncCallback('binance', 'code_123');
    
    const options: any = vi.mocked(api.authenticatedFetch).mock.calls[0][1];
    const body = JSON.parse(options.body);
    expect(body).toEqual({ providerId: 'binance', authCode: 'code_123' });
  });

  it('getSyncStatus correctly passes institutionId without userId', async () => {
    vi.mocked(api.authenticatedFetch).mockResolvedValue({
      json: async () => ({ success: true })
    } as any);

    await getSyncStatus('inst_123');
    
    const options: any = vi.mocked(api.authenticatedFetch).mock.calls[0][1];
    const body = JSON.parse(options.body);
    expect(body).toEqual({ institutionId: 'inst_123' });
  });

  it('handles API rejection safely with standardized error response', async () => {
    vi.mocked(api.authenticatedFetch).mockRejectedValue(new Error('Network Failure'));

    const result = await createSyncSession('revolut');
    expect(result).toEqual({ success: false, status: 'error', error: 'Connection failed' });
  });

  describe('GoCardless Sandbox Integration', () => {
    it('createSyncSession for gocardless_sandbox does not send userId', async () => {
      vi.mocked(api.authenticatedFetch).mockResolvedValue({
        json: async () => ({ success: true, status: 'connecting' })
      } as any);

      await createSyncSession('gocardless_sandbox');
      
      const options: any = vi.mocked(api.authenticatedFetch).mock.calls[0][1];
      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('providerId', 'gocardless_sandbox');
      expect(body).not.toHaveProperty('userId');
    });

    it('createSyncSession sends providerId and institutionId without userId', async () => {
      vi.mocked(api.authenticatedFetch).mockResolvedValue({
        json: async () => ({ success: true, status: 'connecting' })
      } as any);

      await createSyncSession('gocardless_sandbox', 'bank_123');
      
      const options: any = vi.mocked(api.authenticatedFetch).mock.calls[0][1];
      const body = JSON.parse(options.body);
      expect(body).toEqual({ providerId: 'gocardless_sandbox', institutionId: 'bank_123' });
      expect(body).not.toHaveProperty('userId');
    });

    it('handles not_configured response from backend gracefully', async () => {
      vi.mocked(api.authenticatedFetch).mockResolvedValue({
        json: async () => ({ 
          success: false, 
          status: 'not_configured', 
          message: 'GoCardless provider is not configured.' 
        })
      } as any);

      const result = await createSyncSession('gocardless_sandbox');
      expect(result.success).toBe(false);
      expect(result.status).toBe('not_configured');
    });

    it('handleSyncCallback sends requisitionId for GoCardless', async () => {
      vi.mocked(api.authenticatedFetch).mockResolvedValue({
        json: async () => ({ success: true, status: 'LN' })
      } as any);

      await handleSyncCallback('gocardless_sandbox', { requisitionId: 'req_123' });
      
      const options: any = vi.mocked(api.authenticatedFetch).mock.calls[0][1];
      const body = JSON.parse(options.body);
      expect(body).toEqual({ providerId: 'gocardless_sandbox', requisitionId: 'req_123' });
      expect(body).not.toHaveProperty('userId');
    });
  });

  describe('listInstitutions', () => {
    it('gocardless_sandbox does not send userId', async () => {
      vi.mocked(api.authenticatedFetch).mockResolvedValue({
        json: async () => ({ success: true, institutions: [] })
      } as any);

      await listInstitutions('gocardless_sandbox', 'BE');
      
      const options: any = vi.mocked(api.authenticatedFetch).mock.calls[0][1];
      const body = JSON.parse(options.body);
      expect(body).toEqual({ providerId: 'gocardless_sandbox', countryCode: 'BE' });
      expect(body).not.toHaveProperty('userId');
    });
  });
});
