import fs from 'fs';
import Assignment from '../models/Assignment.js';
import Classroom from '../models/Classroom.js';
import Submission from '../models/Submission.js';
import { getRepoPath, getCloneUrl, initBareRepo } from '../utils/repoPaths.js';

/**
 * GET /api/assignments/:assignmentId/my-submission
 * Lazy repo creation endpoint for students.
 */
export async function getMySubmission(req, res) {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.userId;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const classroom = await Classroom.findById(assignment.classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    // Verify student is enrolled in the classroom
    const isEnrolled = classroom.studentIds.some((sid) => {
      const sidStr = sid && sid._id ? sid._id.toString() : sid?.toString();
      return sidStr === studentId.toString();
    });

    if (!isEnrolled) {
      return res.status(403).json({ error: 'Access denied: You are not enrolled in this classroom' });
    }

    const repoPath = getRepoPath(classroom._id, assignment._id, studentId);
    const cloneUrl = getCloneUrl(classroom._id, assignment._id, studentId, req);

    let submission = await Submission.findOne({
      assignmentId: assignment._id,
      studentId,
    });

    if (!submission) {
      // Create the bare git repo on disk if not already present
      if (!fs.existsSync(repoPath)) {
        await initBareRepo(repoPath);
      }

      try {
        submission = await Submission.create({
          assignmentId: assignment._id,
          studentId,
          repoPath,
        });
      } catch (err) {
        // If a concurrent request created the record, recover gracefully
        if (err.code === 11000) {
          submission = await Submission.findOne({
            assignmentId: assignment._id,
            studentId,
          });
        } else {
          throw err;
        }
      }
    } else {
      // Ensure the repo folder exists on disk if it was previously removed
      if (!fs.existsSync(repoPath)) {
        await initBareRepo(repoPath);
      }
    }

    return res.json({
      repoPath: submission.repoPath,
      cloneUrl,
    });
  } catch (err) {
    console.error('getMySubmission error:', err);
    return res.status(500).json({ error: 'Server error retrieving submission repo' });
  }
}

/**
 * GET /api/assignments/:assignmentId/submissions
 * Teacher-only endpoint to list all submissions created for an assignment.
 */
export async function getSubmissions(req, res) {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const classroom = await Classroom.findById(assignment.classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    // Verify requesting user is the classroom's teacher
    if (classroom.teacherId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: 'Access denied: Only the classroom teacher can view submissions' });
    }

    const submissions = await Submission.find({ assignmentId: assignment._id })
      .populate('studentId', 'name email role')
      .sort({ createdAt: -1 });

    return res.json({ submissions });
  } catch (err) {
    console.error('getSubmissions error:', err);
    return res.status(500).json({ error: 'Server error retrieving submissions' });
  }
}
