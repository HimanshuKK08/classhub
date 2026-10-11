import mongoose from 'mongoose';

const personalAccessTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    tokenHash: {
      type: String,
      required: [true, 'tokenHash is required'],
    },
    label: {
      type: String,
      required: [true, 'Label is required'],
      trim: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const PersonalAccessToken = mongoose.model('PersonalAccessToken', personalAccessTokenSchema);

export default PersonalAccessToken;
