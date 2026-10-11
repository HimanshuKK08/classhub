import Assignment from '../models/Assignment.js';

/**
 * Checks if incoming Git HTTP request is a push (git-receive-pack) operation.
 * Smart HTTP protocol distinguishing characteristics:
 * - Ref advertisement: GET /info/refs?service=git-receive-pack
 * - RPC pack transfer: POST /git-receive-pack
 */
export function isPushOperation(req) {
  // 1. Initial GET ref advertisement with ?service=git-receive-pack
  if (req.method === 'GET' && req.query?.service === 'git-receive-pack') {
    return true;
  }
  // 2. Data transfer POST to /git-receive-pack
  if (req.method === 'POST') {
    if (req.path?.endsWith('/git-receive-pack') || req.url?.includes('git-receive-pack')) {
      return true;
    }
  }
  return false;
}

/**
 * Middleware that rejects pushes after the assignment deadline has passed,
 * while allowing clone/fetch/pull operations (git-upload-pack) to succeed.
 */
export async function checkDeadline(req, res, next) {
  // Only push operations are subject to the deadline check
  if (!isPushOperation(req)) {
    return next();
  }

  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).send('Assignment not found');
    }

    const now = new Date();
    const deadline = new Date(assignment.deadline);

    if (now > deadline) {
      return res.status(403).send('Submission deadline has passed');
    }

    return next();
  } catch (err) {
    console.error('checkDeadline error:', err);
    return res.status(500).send('Server error validating deadline');
  }
}
