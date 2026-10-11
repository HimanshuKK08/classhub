import Assignment from '../models/Assignment.js';
import Classroom from '../models/Classroom.js';

// ─── Helper ────────────────────────────────────────────────────────────────────

/**
 * Looks up a classroom and verifies the requester is the teacher OR an enrolled student.
 * Returns { classroom } on success, or sends an error response and returns null.
 */
async function resolveClassroomAccess(classroomId, userId, res) {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    res.status(404).json({ error: 'Classroom not found' });
    return null;
  }

  const uid = userId.toString();
  const isTeacher = classroom.teacherId.toString() === uid;
  const isStudent = classroom.studentIds.some((sid) => {
    const sidStr = sid && sid._id ? sid._id.toString() : sid?.toString();
    return sidStr === uid;
  });

  if (!isTeacher && !isStudent) {
    res.status(403).json({ error: 'Access denied' });
    return null;
  }

  return classroom;
}

// ─── POST /api/classrooms/:classroomId/assignments ───────────────────────────

export async function createAssignment(req, res) {
  try {
    const { classroomId } = req.params;
    const { title, instructions, deadline } = req.body;

    // Validate inputs
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!instructions || typeof instructions !== 'string' || !instructions.trim()) {
      return res.status(400).json({ error: 'instructions are required' });
    }
    if (!deadline) {
      return res.status(400).json({ error: 'deadline is required' });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ error: 'deadline must be a valid date' });
    }
    if (deadlineDate <= new Date()) {
      return res.status(400).json({ error: 'deadline must be a future date' });
    }

    // Verify classroom exists and requester is its teacher
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    if (classroom.teacherId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        error: 'Only the classroom teacher can create assignments',
      });
    }

    const assignment = await Assignment.create({
      classroomId: classroom._id,
      title: title.trim(),
      instructions: instructions.trim(),
      deadline: deadlineDate,
    });

    return res.status(201).json({ assignment });
  } catch (err) {
    console.error('createAssignment error:', err);
    return res.status(500).json({ error: 'Server error creating assignment' });
  }
}

// ─── GET /api/classrooms/:classroomId/assignments ────────────────────────────

export async function listAssignments(req, res) {
  try {
    const { classroomId } = req.params;

    const classroom = await resolveClassroomAccess(classroomId, req.user.userId, res);
    if (!classroom) return;

    const assignments = await Assignment.find({ classroomId: classroom._id }).sort({
      deadline: 1,
    });

    return res.json({ assignments });
  } catch (err) {
    console.error('listAssignments error:', err);
    return res.status(500).json({ error: 'Server error fetching assignments' });
  }
}

// ─── GET /api/assignments/:id ────────────────────────────────────────────────

export async function getAssignmentById(req, res) {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const classroom = await resolveClassroomAccess(
      assignment.classroomId,
      req.user.userId,
      res
    );
    if (!classroom) return;

    return res.json({ assignment });
  } catch (err) {
    console.error('getAssignmentById error:', err);
    return res.status(500).json({ error: 'Server error fetching assignment' });
  }
}
