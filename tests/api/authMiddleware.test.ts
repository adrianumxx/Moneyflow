import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authMiddleware, AuthenticatedRequest } from '../../server/middleware/authMiddleware';
import { Response, NextFunction } from 'express';
import admin from 'firebase-admin';

const mockAuth = {
  verifyIdToken: vi.fn()
};

// Mock firebase-admin
vi.mock('firebase-admin', () => ({
  default: {
    auth: vi.fn(() => mockAuth)
  }
}));

describe('authMiddleware', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('returns 401 if Authorization header is missing', async () => {
    await authMiddleware(req as any, res as any, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Missing') }));
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if Authorization header does not start with Bearer', async () => {
    req.headers!.authorization = 'Basic token';
    await authMiddleware(req as any, res as any, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 if token verification fails', async () => {
    req.headers!.authorization = 'Bearer invalid-token';
    const mockAuth = admin.auth();
    vi.mocked(mockAuth.verifyIdToken).mockRejectedValue(new Error('Invalid token'));

    await authMiddleware(req as any, res as any, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Unauthorized: Invalid token' }));
  });

  it('returns 401 and specialized message if token expired', async () => {
    req.headers!.authorization = 'Bearer expired-token';
    const mockAuth = admin.auth();
    const error: any = new Error('Token expired');
    error.code = 'auth/id-token-expired';
    vi.mocked(mockAuth.verifyIdToken).mockRejectedValue(error);

    await authMiddleware(req as any, res as any, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Unauthorized: Token expired' }));
  });

  it('attaches user and calls next if token is valid', async () => {
    req.headers!.authorization = 'Bearer valid-token';
    const mockUser = { uid: 'user123', email: 'test@example.com' };
    const mockAuth = admin.auth();
    vi.mocked(mockAuth.verifyIdToken).mockResolvedValue(mockUser as any);

    await authMiddleware(req as any, res as any, next);
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });
});
