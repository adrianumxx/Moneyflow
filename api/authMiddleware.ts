import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

/**
 * Custom request interface to include the decoded Firebase user token.
 */
export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

/**
 * Middleware to verify Firebase ID tokens in the Authorization header.
 * Expects format: "Authorization: Bearer <token>"
 */
export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized: Missing or invalid Authorization header. Expected "Bearer <token>".' 
    });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach the verified user to the request object
    req.user = decodedToken;
    
    next();
  } catch (error: any) {
    console.error('[AuthMiddleware] Verification failed:', error.message);
    
    // Check for specific token errors to provide better feedback if needed (internal logging only)
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }
    
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
