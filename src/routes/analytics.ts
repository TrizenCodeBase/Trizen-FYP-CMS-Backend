import express from 'express';
import { getDashboardStats, getProblemStats, getUserStats } from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/v1/analytics/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard', protect, getDashboardStats);

// @route   GET /api/v1/analytics/problems
// @desc    Get problem statistics
// @access  Private
router.get('/problems', protect, getProblemStats);

// @route   GET /api/v1/analytics/users
// @desc    Get user statistics
// @access  Private/Admin
router.get('/users', protect, authorize('admin', 'faculty'), getUserStats);

export default router;
