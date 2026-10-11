import backend from 'git-http-backend';
import zlib from 'zlib';
import { spawn } from 'child_process';
import fs from 'fs';
import { getRepoPath, initBareRepo } from '../utils/repoPaths.js';

/**
 * Express handler that pipes Git smart HTTP requests to git-http-backend.
 */
export async function handleGitRequest(req, res) {
  try {
    const { classroomId, assignmentId, studentId: rawStudentId } = req.params;
    const studentId = (rawStudentId || '').replace(/\.git$/, '');
    const repoPath = getRepoPath(classroomId, assignmentId, studentId);

    // If the bare repo does not exist on disk, ensure it is created
    if (!fs.existsSync(repoPath)) {
      await initBareRepo(repoPath);
    }

    // Git smart HTTP clients may send gzip-compressed request bodies
    const reqStream = req.headers['content-encoding'] === 'gzip'
      ? req.pipe(zlib.createGunzip())
      : req;

    const b = backend(req.url, (err, service) => {
      if (err) {
        console.error('git-http-backend service error:', err);
        if (!res.headersSent) {
          res.status(500).end(err.message + '\n');
        }
        return;
      }

      res.setHeader('content-type', service.type);

      // Invoke git with sub-command ('receive-pack' or 'upload-pack')
      // This is fully cross-platform (Windows, Linux, macOS)
      const subCmd = service.cmd.replace(/^git-/, '');
      const ps = spawn('git', [subCmd, ...service.args, repoPath]);

      ps.on('error', (spawnErr) => {
        console.error(`git spawn error [${subCmd}]:`, spawnErr);
        if (!res.headersSent) {
          res.status(500).end(spawnErr.message);
        }
      });

      ps.stderr.on('data', (data) => {
        console.log(`git [${subCmd}] progress: ${data}`);
      });

      ps.stdout.pipe(service.createStream()).pipe(ps.stdin);
    });

    b.on('error', (backendErr) => {
      console.error('git-http-backend stream error:', backendErr);
      if (!res.headersSent) {
        res.status(500).end(backendErr.message + '\n');
      }
    });

    reqStream.pipe(b).pipe(res);
  } catch (err) {
    console.error('handleGitRequest error:', err);
    if (!res.headersSent) {
      res.status(500).end('Internal git server error');
    }
  }
}
