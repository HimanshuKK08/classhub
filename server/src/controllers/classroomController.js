import Classroom from '../models/Classroom.js';
import Assignment from '../models/Assignment.js';

// ─── Helper ────────────────────────────────────────────────────────────────────

/**
 * Returns true if userId is the classroom's teacher OR is in studentIds.
 */
function isMember(classroom, userId) {
  const uid = userId.toString();
  return (
    classroom.teacherId.toString() === uid ||
    classroom.studentIds.some((sid) => {
      const sidStr = sid && sid._id ? sid._id.toString() : sid?.toString();
      return sidStr === uid;
    })
  );
}

// ─── POST /api/classrooms ─────────────────────────────────────────────────────

export async function createClassroom(req, res) {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const classroom = await Classroom.create({
      teacherId: req.user.userId,
      name: name.trim(),
      studentIds: [],
    });

    return res.status(201).json({ classroom });
  } catch (err) {
    console.error('createClassroom error:', err);
    return res.status(500).json({ error: 'Server error creating classroom' });
  }
}

// ─── POST /api/classrooms/join ────────────────────────────────────────────────

export async function joinClassroom(req, res) {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode || typeof inviteCode !== 'string' || !inviteCode.trim()) {
      return res.status(400).json({ error: 'inviteCode is required' });
    }

    const classroom = await Classroom.findOne({ inviteCode: inviteCode.trim() });
    if (!classroom) {
      return res.status(404).json({ error: 'No classroom found with that invite code' });
    }

    const studentId = req.user.userId.toString();
    const alreadyJoined = classroom.studentIds.some(
      (sid) => sid.toString() === studentId
    );

    if (alreadyJoined) {
      return res.json({ message: 'Already joined', classroom });
    }

    classroom.studentIds.push(req.user.userId);
    await classroom.save();

    return res.json({ message: 'Joined successfully', classroom });
  } catch (err) {
    console.error('joinClassroom error:', err);
    return res.status(500).json({ error: 'Server error joining classroom' });
  }
}

// ─── GET /api/classrooms/mine ─────────────────────────────────────────────────

export async function getMyClassrooms(req, res) {
  try {
    const classrooms = await Classroom.find({ teacherId: req.user.userId }).sort({
      createdAt: -1,
    });
    return res.json({ classrooms });
  } catch (err) {
    console.error('getMyClassrooms error:', err);
    return res.status(500).json({ error: 'Server error fetching classrooms' });
  }
}

// ─── GET /api/classrooms/joined ───────────────────────────────────────────────

export async function getJoinedClassrooms(req, res) {
  try {
    const classrooms = await Classroom.find({
      studentIds: req.user.userId,
    }).sort({ createdAt: -1 });
    return res.json({ classrooms });
  } catch (err) {
    console.error('getJoinedClassrooms error:', err);
    return res.status(500).json({ error: 'Server error fetching classrooms' });
  }
}

// ─── GET /api/classrooms/:id ──────────────────────────────────────────────────

export async function getClassroomById(req, res) {
  try {
    const classroom = await Classroom.findById(req.params.id).populate(
      'studentIds',
      'name email role'
    );
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    if (!isMember(classroom, req.user.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const isTeacher =
      classroom.teacherId.toString() === req.user.userId.toString();

    // Fetch assignments for this classroom
    const assignments = await Assignment.find({
      classroomId: classroom._id,
    }).sort({ deadline: 1 });

    const payload = {
      _id: classroom._id,
      name: classroom.name,
      teacherId: classroom.teacherId,
      createdAt: classroom.createdAt,
      assignments,
    };

    if (isTeacher) {
      payload.inviteCode = classroom.inviteCode;
      payload.students = classroom.studentIds; // populated: name, email, role
    }

    return res.json({ classroom: payload });
  } catch (err) {
    console.error('getClassroomById error:', err);
    return res.status(500).json({ error: 'Server error fetching classroom' });
  }
}
