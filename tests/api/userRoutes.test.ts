import { describe, it, expect, vi, beforeEach } from 'vitest';
import router from '../../server/routes/userRoutes';
import { Response } from 'express';

// Mock Firebase Admin
vi.mock('../../server/firebaseAdmin', () => ({
  getDb: vi.fn(() => ({
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    batch: vi.fn(() => ({
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue({})
    })),
    get: vi.fn().mockResolvedValue({
      exists: true,
      size: 1,
      docs: [{ 
        id: 'test-id', 
        data: () => ({ memberIds: ['test-user-123'], ownerId: 'test-user-123', createdBy: 'test-user-123' }),
        ref: { 
          delete: vi.fn().mockResolvedValue({}), 
          update: vi.fn().mockResolvedValue({}),
          collection: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue({ empty: true, size: 0, docs: [] })
        }
      }]
    }),
    delete: vi.fn().mockResolvedValue({}),
  }))
}));


describe('User Routes - Purge Dry Run', () => {
  let req: any;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      user: { uid: 'test-user-123' }
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    vi.clearAllMocks();
  });

  const getHandler = (method: string, path: string) => {
    const route = (router as any).stack.find((s: any) => s.route && s.route.path === path && s.route.methods[method.toLowerCase()]);
    return route.route.stack[0].handle;
  };

  it('should return counts and profile status for an authenticated user', async () => {
    const handler = getHandler('post', '/purge/dry-run');
    await handler(req, res as any, vi.fn());

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      profileExists: true,
      collectionCounts: expect.any(Object),
      groupsImpactSummary: expect.any(Object)
    }));
  });

  it('should return 401 if req.user is missing', async () => {
    req.user = undefined;
    const handler = getHandler('post', '/purge/dry-run');
    await handler(req, res as any, vi.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Unauthorized')
    }));
  });

  it('should not contain sensitive strings in the response', async () => {
    const handler = getHandler('post', '/purge/dry-run');
    await handler(req, res as any, vi.fn());

    const jsonResponse = vi.mocked(res.json).mock.calls[0][0];
    const bodyStr = JSON.stringify(jsonResponse);
    
    expect(bodyStr).not.toContain('test-id');
    expect(bodyStr).not.toContain('IBAN');
    expect(bodyStr).not.toContain('token');
  });

  describe('Purge Real Deletion', () => {
    it('should return 400 if confirmText is missing or wrong', async () => {
      const handler = getHandler('post', '/purge');
      req.body = { confirmText: 'WRONG' };
      await handler(req, res as any, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid confirmation text' }));
    });

    it('should return safe counts upon successful erasure', async () => {
      const handler = getHandler('post', '/purge');
      req.body = { confirmText: 'DELETE' };
      await handler(req, res as any, vi.fn());

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        deletedDocumentsCount: expect.any(Number),
        profileDeleted: true
      }));
    });
  });
});

