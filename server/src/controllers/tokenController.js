import crypto from 'crypto';
import PersonalAccessToken from '../models/PersonalAccessToken.js';

/**
 * Hash a raw token with SHA-256 for storage.
 * Using SHA-256 rather than bcrypt here since we need deterministic lookup
 * (hash incoming token → compare hashes, no need to enumerate all tokens).
 */
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// ─── POST /api/tokens ───────────────────────────────────────────────────────

export async function createToken(req, res) {
  try {
    const { label } = req.body;

    if (!label || !label.trim()) {
      return res.status(400).json({ error: 'label is required' });
    }

    // Generate a cryptographically random 32-byte token (hex = 64 chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    const pat = await PersonalAccessToken.create({
      userId: req.user.userId,
      tokenHash,
      label: label.trim(),
    });

    // Return the raw token ONCE — never stored, only hash kept in DB
    return res.status(201).json({
      token: rawToken,
      label: pat.label,
      _id: pat._id,
    });
  } catch (err) {
    console.error('createToken error:', err);
    return res.status(500).json({ error: 'Server error creating token' });
  }
}

// ─── GET /api/tokens ────────────────────────────────────────────────────────

export async function listTokens(req, res) {
  try {
    const tokens = await PersonalAccessToken.find(
      { userId: req.user.userId },
      { _id: 1, label: 1, createdAt: 1, lastUsedAt: 1, revoked: 1 } // never include tokenHash
    ).sort({ createdAt: -1 });

    return res.json({ tokens });
  } catch (err) {
    console.error('listTokens error:', err);
    return res.status(500).json({ error: 'Server error fetching tokens' });
  }
}

// ─── DELETE /api/tokens/:id ─────────────────────────────────────────────────

export async function revokeToken(req, res) {
  try {
    const { id } = req.params;

    const token = await PersonalAccessToken.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    if (token.revoked) {
      return res.status(400).json({ error: 'Token is already revoked' });
    }

    token.revoked = true;
    await token.save();

    return res.json({ message: 'Token revoked successfully' });
  } catch (err) {
    console.error('revokeToken error:', err);
    return res.status(500).json({ error: 'Server error revoking token' });
  }
}

// ─── Token validation utility (for future git-http-backend integration) ─────

/**
 * Validates an incoming raw token string against stored hashes.
 * Finds a non-revoked token, updates lastUsedAt, and returns the token doc.
 * Returns null if no valid match found.
 *
 * @param {string} rawToken  The raw opaque token string from the request
 * @returns {Promise<PersonalAccessToken|null>}
 */
export async function validatePersonalAccessToken(rawToken) {
  const tokenHash = hashToken(rawToken);

  const pat = await PersonalAccessToken.findOne({
    tokenHash,
    revoked: false,
  });

  if (!pat) return null;

  pat.lastUsedAt = new Date();
  await pat.save();

  return pat;
}
