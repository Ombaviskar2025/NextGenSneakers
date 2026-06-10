import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_access_token_secret_398284729384';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    vendorId?: string;
    storeId?: string;
  };
}

/**
   * Main Auth Verification Middleware
   */
export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      vendorId: decoded.vendorId,
      storeId: decoded.storeId,
    };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired access token.' });
  }
};

/**
 * Require general authentication
 */
export const requireAuth = [verifyToken];

/**
 * Restrict routes to specific user roles
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Current role is '${req.user.role}'` 
      });
    }

    next();
  };
};

// Quick helper middleware references
export const requireAdmin = [verifyToken, requireRole(['admin'])];
export const requireVendor = [verifyToken, requireRole(['vendor'])];
export const requireCustomer = [verifyToken, requireRole(['customer'])];
