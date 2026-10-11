import jwt from 'jsonwebtoken';

/**
 * Reads JWT from the `auth_token` HTTP-only cookie, verifies it,
 * and attaches { userId, role } to req.user.
 */
export function requireAuth(req, res, next) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

/**
 * Middleware factory — checks that req.user.role matches the expected role.
 * Must be used after requireAuth.
 * @param {string} role  e.g. 'teacher' or 'student'
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Access restricted to ${role}s` });
    }
    next();
  };
}
