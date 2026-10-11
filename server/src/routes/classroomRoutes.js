import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createClassroom,
  joinClassroom,
  getMyClassrooms,
  getJoinedClassrooms,
  getClassroomById,
} from '../controllers/classroomController.js';
import {
  createAssignment,
  listAssignments,
} from '../controllers/assignmentController.js';

const router = Router();

// All classroom routes require authentication
router.use(requireAuth);

// ─── Classroom routes ─────────────────────────────────────────────────────────

// POST /api/classrooms — teacher creates a classroom
router.post('/', requireRole('teacher'), createClassroom);

// POST /api/classrooms/join — student joins via invite code
// NOTE: must be defined before /:id to avoid 'join' being treated as an id
router.post('/join', requireRole('student'), joinClassroom);

// GET /api/classrooms/mine — teacher lists their classrooms
// NOTE: must be defined before /:id
router.get('/mine', requireRole('teacher'), getMyClassrooms);

// GET /api/classrooms/joined — student lists their joined classrooms
// NOTE: must be defined before /:id
router.get('/joined', requireRole('student'), getJoinedClassrooms);

// GET /api/classrooms/:id — classroom detail (teacher or enrolled student)
router.get('/:id', getClassroomById);

// ─── Assignment sub-routes ────────────────────────────────────────────────────

// POST /api/classrooms/:classroomId/assignments — teacher creates assignment
router.post('/:classroomId/assignments', requireRole('teacher'), createAssignment);

// GET /api/classrooms/:classroomId/assignments — teacher or student lists assignments
router.get('/:classroomId/assignments', listAssignments);

export default router;
