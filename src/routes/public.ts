import express from 'express';
import {
  getProblems,
  getProblemByCustomId,
  getFeaturedProblems,
  getProblemsByDomain,
  searchProblems,
  getPopularProblems,
  getProblemStats
} from '../controllers/problemController';

const router = express.Router();

// @route   GET /api/v1/public
// @desc    Public API information
// @access  Public
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TRIZEN CMS Public API',
    version: '1.0.0',
    description: 'Public endpoints for accessing problem statements',
    endpoints: {
      problems: '/api/v1/public/problems',
      featured: '/api/v1/public/problems/featured',
      popular: '/api/v1/public/problems/popular',
      search: '/api/v1/public/problems/search',
      stats: '/api/v1/public/problems/stats',
      domain: '/api/v1/public/problems/domain/:domain',
      problem: '/api/v1/public/problems/:id'
    },
    usage: {
      getAllProblems: 'GET /api/v1/public/problems',
      getFeaturedProblems: 'GET /api/v1/public/problems/featured',
      getPopularProblems: 'GET /api/v1/public/problems/popular',
      searchProblems: 'GET /api/v1/public/problems/search?q=search_term',
      getProblemStats: 'GET /api/v1/public/problems/stats',
      getProblemsByDomain: 'GET /api/v1/public/problems/domain/AI%20%26%20Machine%20Learning',
      getProblemById: 'GET /api/v1/public/problems/AIM001'
    }
  });
});

// @route   GET /api/v1/public/problems
// @desc    Get all active problem statements (for final-frontier-projects)
// @access  Public
router.get('/problems', getProblems);

// @route   GET /api/v1/public/problems/featured
// @desc    Get featured problems
// @access  Public
router.get('/problems/featured', getFeaturedProblems);

// @route   GET /api/v1/public/problems/popular
// @desc    Get popular problems
// @access  Public
router.get('/problems/popular', getPopularProblems);

// @route   GET /api/v1/public/problems/search
// @desc    Search problems
// @access  Public
router.get('/problems/search', searchProblems);

// @route   GET /api/v1/public/problems/domain/:domain
// @desc    Get problems by domain
// @access  Public
router.get('/problems/domain/:domain', getProblemsByDomain);

// @route   GET /api/v1/public/problems/stats
// @desc    Get problem statistics
// @access  Public
router.get('/problems/stats', getProblemStats);

// @route   GET /api/v1/public/problems/:id
// @desc    Get problem by custom ID (AIM001, etc.)
// @access  Public
router.get('/problems/:id', getProblemByCustomId);

export default router;
