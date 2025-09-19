import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { 
  getProblems, 
  getProblem, 
  createProblem, 
  updateProblem, 
  deleteProblem,
  getProblemsByDomain,
  getFeaturedProblems,
  getProblemByCustomId,
  searchProblems,
  updateProblemStatus,
  toggleFeatured,
  getPopularProblems,
  getProblemStats,
  bulkUploadProblems,
  downloadTemplate
} from '../controllers/problemController';
import { protect, authorize } from '../middleware/auth';

// Configure multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

const router = express.Router();

// @route   GET /api/v1/problems
// @desc    Get all problems
// @access  Public
router.get('/', getProblems);

// @route   GET /api/v1/problems/featured
// @desc    Get featured problems
// @access  Public
router.get('/featured', getFeaturedProblems);

// @route   GET /api/v1/problems/popular
// @desc    Get popular problems
// @access  Public
router.get('/popular', getPopularProblems);

// @route   GET /api/v1/problems/search
// @desc    Search problems
// @access  Public
router.get('/search', searchProblems);

// @route   GET /api/v1/problems/stats
// @desc    Get problem statistics
// @access  Public (temporarily for testing)
router.get('/stats', getProblemStats);

// @route   GET /api/v1/problems/template
// @desc    Download CSV template
// @access  Private
router.get('/template', protect, downloadTemplate);

// @route   POST /api/v1/problems/bulk-upload
// @desc    Bulk upload problems from CSV
// @access  Private/Admin
router.post('/bulk-upload', protect, authorize('admin', 'faculty'), upload.single('file'), bulkUploadProblems);

// @route   GET /api/v1/problems/domain/:domain
// @desc    Get problems by domain
// @access  Public
router.get('/domain/:domain', getProblemsByDomain);

// @route   GET /api/v1/problems/custom/:id
// @desc    Get problem by custom ID (AIM001, etc.)
// @access  Public
router.get('/custom/:id', getProblemByCustomId);

// @route   GET /api/v1/problems/:id
// @desc    Get single problem
// @access  Public
router.get('/:id', getProblem);

// @route   POST /api/v1/problems
// @desc    Create new problem
// @access  Private
router.post('/', protect, authorize('admin', 'faculty'), [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('abstract')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Abstract must be between 50 and 5000 characters'),
  body('domain')
    .isIn([
      'AI & Machine Learning',
      'IoT & Embedded Systems',
      'Cloud Computing',
      'Web & Mobile Applications',
      'Cybersecurity & Blockchain',
      'Data Science & Analytics',
      'Networking & Communication',
      'Mechanical / ECE Projects'
    ])
    .withMessage('Please select a valid domain'),
  body('category')
    .isIn(['Major', 'Minor', 'Capstone'])
    .withMessage('Category must be Major, Minor, or Capstone'),
  body('difficulty')
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Difficulty must be Beginner, Intermediate, or Advanced'),
  body('duration')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Duration is required and must be less than 50 characters'),
  body('deliverables')
    .isArray({ min: 1 })
    .withMessage('At least one deliverable is required'),
  body('technologies')
    .isArray({ min: 1 })
    .withMessage('At least one technology is required'),
  body('prerequisites')
    .optional()
    .isArray()
    .withMessage('Prerequisites must be an array'),
  body('learningOutcomes')
    .optional()
    .isArray()
    .withMessage('Learning outcomes must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
], createProblem);

// @route   PUT /api/v1/problems/:id
// @desc    Update problem
// @access  Private
router.put('/:id', protect, authorize('admin', 'faculty'), updateProblem);

// @route   PUT /api/v1/problems/:id/status
// @desc    Update problem status
// @access  Private
router.put('/:id/status', protect, authorize('admin', 'faculty'), [
  body('status')
    .isIn(['Active', 'Draft', 'Archived'])
    .withMessage('Status must be Active, Draft, or Archived')
], updateProblemStatus);

// @route   PUT /api/v1/problems/:id/featured
// @desc    Toggle featured status
// @access  Private/Admin
router.put('/:id/featured', protect, authorize('admin'), toggleFeatured);

// @route   DELETE /api/v1/problems/:id
// @desc    Delete problem
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), deleteProblem);

export default router;
