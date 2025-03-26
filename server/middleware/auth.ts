import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        emailVerified?: boolean;
        fullName?: string;
      };
    }
  }
}

/**
 * Authentication middleware to verify JWT tokens
 * Optional parameter allows routes to be accessible even without authentication
 */
export function authenticate(optional = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (optional) {
        return next();
      }
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      if (optional) {
        return next();
      }
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      if (optional) {
        return next();
      }
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Attach user to request
    req.user = {
      id: payload.userId,
      username: payload.username,
      email: payload.email
    };

    // Continue to the route handler
    next();
  };
}