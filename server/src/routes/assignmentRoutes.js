import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getAssignmentById } from '../controllers/assignmentController.js';
import { getMySubmission, getSubmissions } from '../controllers/submissionController.js';

const router = Router();

// GET /api/assignments/:assignmentId/my-submission — student lazy repo creation
router.get('/:assignmentId/my-submission', requireAuth, requireRole('student'), getMySubmission);

// GET /api/assignments/:assignmentId/submissions — teacher submissions list
router.get('/:assignmentId/submissions', requireAuth, requireRole('teacher'), getSubmissions);

// GET /api/assignments/:id — fetch a single assignment (teacher or enrolled student)
router.get('/:id', requireAuth, getAssignmentById);

export default router;
