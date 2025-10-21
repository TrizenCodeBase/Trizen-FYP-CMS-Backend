import { Router } from 'express';
import {
  createLead,
  getAllLeads,
  getLeadById,
  updateLeadStatus,
  deleteLead,
  getLeadStats
} from '../controllers/leadController';
import { protect } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/', createLead); // Lead capture from popup

// Protected routes (admin only)
router.get('/', protect, getAllLeads);
router.get('/stats', protect, getLeadStats);
router.get('/:id', protect, getLeadById);
router.put('/:id/status', protect, updateLeadStatus);
router.delete('/:id', protect, deleteLead);

export default router;
