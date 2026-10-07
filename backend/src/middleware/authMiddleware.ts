import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types/index.ts';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: UserRole;
    name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'baggagetrack_super_secret_jwt_key_2026';

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired session. Please log in again.' });
  }
}

export function requireStaff(req: AuthRequest, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    if (req.user?.role !== 'STAFF') {
      return res.status(403).json({ message: 'Access denied: Airport Staff role required.' });
    }
    next();
  });
}

export function signToken(payload: { id: number; email: string; role: UserRole; name: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}
