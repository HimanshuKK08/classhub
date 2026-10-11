import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import simpleGit from 'simple-git';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// REPOS_ROOT resolves to the root /repos directory:
// .../classhub/server/src/utils -> ../../../repos -> .../classhub/repos
export const REPOS_ROOT = path.resolve(__dirname, '../../../repos');

/**
 * Computes the absolute path on disk to a student's bare git repository:
 * ${REPOS_ROOT}/${classroomId}/${assignmentId}/${studentId}.git
 */
export function getRepoPath(classroomId, assignmentId, studentId) {
  const cId = classroomId.toString();
  const aId = assignmentId.toString();
  const sId = studentId.toString().replace(/\.git$/, '');
  return path.join(REPOS_ROOT, cId, aId, `${sId}.git`);
}

/**
 * Computes the git clone URL for a student's repository:
 * http://localhost:5000/git/${classroomId}/${assignmentId}/${studentId}.git
 */
export function getCloneUrl(classroomId, assignmentId, studentId, req = null) {
  const cId = classroomId.toString();
  const aId = assignmentId.toString();
  const sId = studentId.toString().replace(/\.git$/, '');
  const port = process.env.PORT || 5000;
  const host = req ? req.get('host') : `localhost:${port}`;
  const protocol = req ? req.protocol : 'http';
  return `${protocol}://${host}/git/${cId}/${aId}/${sId}.git`;
}

/**
 * Initializes a bare git repository on disk at the given repoPath.
 * Ensures parent folders are created recursively and configures http.receivepack=true.
 */
export async function initBareRepo(repoPath) {
  await fs.promises.mkdir(repoPath, { recursive: true });
  const git = simpleGit(repoPath);
  await git.init(true); // git init --bare
  await git.addConfig('http.receivepack', 'true');
}
