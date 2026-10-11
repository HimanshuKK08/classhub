import mongoose from 'mongoose';
import crypto from 'crypto';

const classroomSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'teacherId is required'],
    },
    name: {
      type: String,
      required: [true, 'Classroom name is required'],
      trim: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(6).toString('base64url').slice(0, 8),
    },
    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

const Classroom = mongoose.model('Classroom', classroomSchema);

export default Classroom;
