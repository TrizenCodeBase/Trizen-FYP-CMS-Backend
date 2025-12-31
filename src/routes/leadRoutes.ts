import { Router } from 'express';
import {
  createLead,
  getAllLeads,
  getLeadById,
  updateLeadStatus,
  deleteLead,
  getLeadStats,
  createProjectFunnelLead,
  getDomains,
  getDomainBySlugController,
  downloadPDF
} from '../controllers/leadController';
import { protect } from '../middleware/auth';

const router = Router();

// Public routes - SPECIFIC routes must come BEFORE parameterized routes
router.post('/project-funnel', createProjectFunnelLead); // Must be before /:leadId
router.get('/domains', getDomains); // Must be before /:slug
router.get('/domains/:slug', getDomainBySlugController);
router.post('/', createLead); // Lead capture from popup

// Protected routes (admin only) - Specific routes first
router.get('/stats', protect, getLeadStats); // Must be before /:id
router.get('/', protect, getAllLeads);

// Parameterized routes - MUST come last to avoid catching specific routes
router.get('/:leadId/pdf', downloadPDF); // Download PDF (public with token)
router.get('/:id', protect, getLeadById);
router.put('/:id/status', protect, updateLeadStatus);
router.delete('/:id', protect, deleteLead);

export default router;
