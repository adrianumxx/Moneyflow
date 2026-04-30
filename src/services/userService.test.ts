import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPurgeDryRun, purgeUserData } from './userService';
import { authenticatedFetch } from '../utils/api';

vi.mock('../utils/api', () => ({
  authenticatedFetch: vi.fn()
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPurgeDryRun', () => {
    it('calls authenticatedFetch with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ profileExists: true, collectionCounts: {}, groupsImpactSummary: {}, message: 'ok' })
      };
      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse as any);

      await getPurgeDryRun();

      expect(authenticatedFetch).toHaveBeenCalledWith('/api/user/purge/dry-run', expect.objectContaining({
        method: 'POST'
      }));
    });

    it('throws error when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({ error: 'Limit reached' })
      };
      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse as any);

      await expect(getPurgeDryRun()).rejects.toThrow('Limit reached');
    });
  });

  describe('purgeUserData', () => {
    it('calls authenticatedFetch with DELETE confirmation', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, deletedDocumentsCount: 10 })
      };
      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse as any);

      const result = await purgeUserData('DELETE');

      expect(authenticatedFetch).toHaveBeenCalledWith('/api/user/purge', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ confirmText: 'DELETE' })
      }));
      expect(result.success).toBe(true);
    });

    it('throws error when purge fails', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({ error: 'Unauthorized' })
      };
      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse as any);

      await expect(purgeUserData('DELETE')).rejects.toThrow('Unauthorized');
    });
  });
});

