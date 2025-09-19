import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { createError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: any;
  file?: Express.Multer.File;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      throw createError('Not authorized to access this route', 401);
    }

    try {
      // Verify token
      const secret = process.env.JWT_SECRET || 'trizen_cms_super_secret_jwt_key_2024_secure';
      const decoded = jwt.verify(token, secret) as any;
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        throw createError('No user found with this token', 401);
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('JWT verification error:', error);
      throw createError('Not authorized to access this route', 401);
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError('Not authorized to access this route', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(createError(`User role ${req.user.role} is not authorized to access this route`, 403));
      return;
    }

    next();
  };
};
