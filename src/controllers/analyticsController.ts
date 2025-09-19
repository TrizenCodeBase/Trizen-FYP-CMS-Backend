import { Request, Response, NextFunction } from 'express';
import { ProblemStatement } from '../models/Problem';
import { User } from '../models/User';
import { createError } from '../middleware/errorHandler';

// @desc    Get dashboard statistics
// @route   GET /api/v1/analytics/dashboard
// @access  Private
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get total problems
    const totalProblems = await ProblemStatement.countDocuments();
    
    // Get active problems (published)
    const activeProblems = await ProblemStatement.countDocuments({ status: 'Active' });
    
    // Get draft problems
    const draftProblems = await ProblemStatement.countDocuments({ status: 'Draft' });
    
    // Get featured problems
    const featuredProblems = await ProblemStatement.countDocuments({ featured: true });

    // Get problems by domain
    const problemsByDomain = await ProblemStatement.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get problems by difficulty
    const problemsByDifficulty = await ProblemStatement.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent problems (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentProblems = await ProblemStatement.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        totalProblems,
        activeProblems,
        draftProblems,
        featuredProblems,
        recentProblems,
        problemsByDomain,
        problemsByDifficulty
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get problem statistics
// @route   GET /api/v1/analytics/problems
// @access  Private
export const getProblemStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { period = '30' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(period));

    // Get problems created in the period
    const problemsInPeriod = await ProblemStatement.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 });

    // Get problems by status
    const problemsByStatus = await ProblemStatement.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get problems by domain
    const problemsByDomain = await ProblemStatement.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get problems by difficulty
    const problemsByDifficulty = await ProblemStatement.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);

    // Get top creators
    const topCreators = await ProblemStatement.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$createdBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'creator'
        }
      },
      { $unwind: '$creator' },
      {
        $project: {
          _id: 1,
          count: 1,
          name: '$creator.name',
          email: '$creator.email'
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: Number(period),
        totalProblems: problemsInPeriod.length,
        problemsInPeriod,
        problemsByStatus,
        problemsByDomain,
        problemsByDifficulty,
        topCreators
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/v1/analytics/users
// @access  Private/Admin/Faculty
export const getUserStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get active users (logged in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }
    });

    // Get inactive users
    const inactiveUsers = await User.countDocuments({
      $or: [
        { lastLogin: { $lt: thirtyDaysAgo } },
        { lastLogin: { $exists: false } }
      ]
    });

    // Get users created in last 30 days
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get recent users
    const recentUsers = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsers,
        usersByRole,
        recentUsers
      }
    });
  } catch (error) {
    next(error);
  }
};
