import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import { User, IUser } from '../models/User';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Generate JWT Token
const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || 'trizen_cms_super_secret_jwt_key_2024_secure';
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    const { name, email, phone, course, college, password, role = 'student' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
      return;
    }

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      // Database not connected - return mock response for development
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        name,
        email,
        phone,
        course,
        college,
        role,
        avatar: null,
        isActive: true
      };

      const token = generateToken(mockUser._id.toString());

      res.status(201).json({
        success: true,
        message: 'User registered successfully (Development Mode - No Database)',
        data: {
          user: {
            id: mockUser._id.toString(),
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
            avatar: mockUser.avatar,
            isActive: mockUser.isActive
          },
          token
        }
      });
      return;
    }

    // Database is connected - proceed normally
    const user = await User.create({
      name,
      email,
      phone,
      course,
      college,
      password,
      role
    });

    // Generate token
    const token = generateToken((user._id as mongoose.Types.ObjectId).toString());

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: (user._id as mongoose.Types.ObjectId).toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isActive: user.isActive
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    const { email, password } = req.body;

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      // Database not connected - return mock response for development
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        email,
        role: 'student',
        avatar: null,
        isActive: true
      };

      const token = generateToken(mockUser._id.toString());

      res.status(200).json({
        success: true,
        message: 'Login successful (Development Mode - No Database)',
        data: {
          user: {
            id: mockUser._id.toString(),
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
            avatar: mockUser.avatar,
            isActive: mockUser.isActive
          },
          token
        }
      });
      return;
    }

    // Database is connected - proceed normally
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
      return;
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken((user._id as mongoose.Types.ObjectId).toString());

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: (user._id as mongoose.Types.ObjectId).toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isActive: user.isActive,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user?._id,
          name: user?.name,
          email: user?.email,
          role: user?.role,
          avatar: user?.avatar,
          isActive: user?.isActive,
          lastLogin: user?.lastLogin,
          createdAt: user?.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just send a success response
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};
