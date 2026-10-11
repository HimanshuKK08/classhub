import { Router } from 'express';
import { gitAuth } from './gitAuth.js';
import { checkDeadline } from './checkDeadline.js';
import { handleGitRequest } from './gitHandler.js';

const router = Router();

/**
 * Git Smart HTTP endpoints:
 * Pattern: /git/:classroomId/:assignmentId/:studentId.git/*
 * Middleware order: gitAuth -> checkDeadline -> handleGitRequest
 */
router.all(
  ['/:classroomId/:assignmentId/:studentId.git/*', '/:classroomId/:assignmentId/:studentId.git'],
  gitAuth,
  checkDeadline,
  handleGitRequest
);

export default router;
