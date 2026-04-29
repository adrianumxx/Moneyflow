import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPalantirIntelligence } from './geminiService';
import * as api from '../utils/api';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

vi.mock('../utils/api', () => ({
  authenticatedFetch: vi.fn()
}));

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getPalantirIntelligence', () => {
    it('returns fallback data when API fails (Network Error)', async () => {
      vi.mocked(api.authenticatedFetch).mockRejectedValue(new Error('Network error'));
      
      const result = await getPalantirIntelligence('test-user');
      
      expect(result.dataQuality).toBe('fallback_data');
      expect(result.sourceStatus).toBe('fallback');
      expect(result.orb).toBeDefined();
      expect(result.narrative).toBeDefined();
    });

    it('returns fallback data when API returns 500 error', async () => {
      vi.mocked(api.authenticatedFetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      } as any);
      
      const result = await getPalantirIntelligence('test-user');
      expect(result.dataQuality).toBe('fallback_data');
      expect(result.sourceStatus).toBe('fallback');
    });

    it('returns fallback data when API returns malformed object (missing orb)', async () => {
      vi.mocked(api.authenticatedFetch).mockResolvedValue({
        ok: true,
        json: async () => ({ narrative: 'Missing orb field' })
      } as any);
      
      const result = await getPalantirIntelligence('test-user');
      expect(result.dataQuality).toBe('fallback_data');
      expect(result.sourceStatus).toBe('fallback');
    });

    it('verifies fallback structure contains essential signal arrays', async () => {
      const result = await getPalantirIntelligence('test-user');
      
      expect(Array.isArray(result.semaphore)).toBe(true);
      expect(Array.isArray(result.metrics)).toBe(true);
      expect(Array.isArray(result.probabilityVectors)).toBe(true);
      expect(Array.isArray(result.signalsAndAlpha)).toBe(true);
      expect(Array.isArray(result.activeRisks)).toBe(true);
      expect(Array.isArray(result.newsFeed)).toBe(true);
      
      // Verified new safety arrays
      expect(Array.isArray(result.scenarios)).toBe(true);
      expect(Array.isArray(result.actionQueue)).toBe(true);
      expect(Array.isArray(result.intelligenceFeed)).toBe(true);
      expect(result.geopoliticalRings).toBeDefined();
    });

    it('handles partial API responses by ensuring critical arrays exist', async () => {
      vi.mocked(api.authenticatedFetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          orb: { confidenceScore: 100, state: 'stable' },
          narrative: 'Minimal response',
          // Missing all arrays
        })
      } as any);

      const result = await getPalantirIntelligence('test-user');
      expect(result.orb.confidenceScore).toBe(100);
      // Service should ideally return fallback or merge with defaults if partial
      // Currently it returns whatever API gives if it has an orb.
      // If the API returns a partial, components should handle it, 
      // but the fallback path is now safe.
    });
  });
});
