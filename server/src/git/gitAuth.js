import crypto from 'crypto';
import PersonalAccessToken from '../models/PersonalAccessToken.js';
import Classroom from '../models/Classroom.js';
import User from '../models/User.js';

/**
 * Deterministic SHA-256 token hashing matching tokenController.js
 */
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Git HTTP Basic Auth middleware for git-http-backend routes.
 */
export async function gitAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="ClassHub Git"');
    return res.status(401).send('Authentication required');
  }

  let credentials;
  try {
    const base64 = authHeader.slice(6).trim();
    credentials = Buffer.from(base64, 'base64').toString('utf8');
  } catch {
    res.setHeader('WWW-Authenticate', 'Basic realm="ClassHub Git"');
    return res.status(401).send('Malformed authorization header');
  }

  const colonIdx = credentials.indexOf(':');
  if (colonIdx === -1) {
    res.setHeader('WWW-Authenticate', 'Basic realm="ClassHub Git"');
    return res.status(401).send('Invalid credentials format');
  }

  // In HTTP Basic Auth with Git, the password is the personal access token.
  // Support both username:token (standard git prompt) and token:anything.
  const rawToken = credentials.slice(colonIdx + 1) || credentials.slice(0, colonIdx);

  if (!rawToken) {
    res.setHeader('WWW-Authenticate', 'Basic realm="ClassHub Git"');
    return res.status(401).send('Personal access token required');
  }

  try {
    const tokenHash = hashToken(rawToken);
    const pat = await PersonalAccessToken.findOne({
      tokenHash,
      revoked: false,
    });

    if (!pat) {
      res.setHeader('WWW-Authenticate', 'Basic realm="ClassHub Git"');
      return res.status(401).send('Invalid or revoked personal access token');
    }

    const { classroomId, studentId: rawStudentId } = req.params;
    const targetStudentId = (rawStudentId || '').replace(/\.git$/, '');
    const tokenUserId = pat.userId.toString();

    // 1. Direct match: student is accessing their own repository
    if (tokenUserId === targetStudentId) {
      pat.lastUsedAt = new Date();
      await pat.save();
      req.gitUser = { userId: pat.userId, role: 'student' };
      return next();
    }

    // 2. Teacher access check: teachers can clone/fetch student repositories in their classroom
    const user = await User.findById(pat.userId);
    if (user && user.role === 'teacher') {
      const classroom = await Classroom.findById(classroomId);
      if (classroom && classroom.teacherId.toString() === tokenUserId) {
        // Teachers may clone/read, but cannot push to student repositories
        const isPush =
          (req.method === 'GET' && req.query?.service === 'git-receive-pack') ||
          (req.method === 'POST' && (req.path?.endsWith('/git-receive-pack') || req.url?.includes('git-receive-pack')));

        if (!isPush) {
          pat.lastUsedAt = new Date();
          await pat.save();
          req.gitUser = { userId: pat.userId, role: 'teacher' };
          return next();
        }
      }
    }

    // Mismatched user attempting unauthorized repo access
    return res.status(403).send('Access denied: You may only access your own repository');
  } catch (err) {
    console.error('gitAuth error:', err);
    return res.status(500).send('Server authentication error');
  }
}
