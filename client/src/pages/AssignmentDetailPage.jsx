import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import apiClient from '../api/client.js';

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const { user, loading } = useAuth(); // any authenticated user
  const [assignment, setAssignment] = useState(null);
  const [fetchError, setFetchError] = useState('');

  // Student submission state
  const [submission, setSubmission] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState('');
  const [copied, setCopied] = useState(false);

  // Teacher submissions list state
  const [submissionsList, setSubmissionsList] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsError, setSubsError] = useState('');

  // 1. Fetch assignment details
  useEffect(() => {
    if (!user) return;
    apiClient
      .get(`/api/assignments/${id}`)
      .then((res) => setAssignment(res.data.assignment))
      .catch((err) => {
        setFetchError(
          err.response?.data?.error || 'Failed to load assignment'
        );
      });
  }, [id, user]);

  // 2. Role-specific data fetching
  useEffect(() => {
    if (!user || !assignment) return;

    if (user.role === 'student') {
      setSubLoading(true);
      setSubError('');
      apiClient
        .get(`/api/assignments/${id}/my-submission`)
        .then((res) => {
          setSubmission(res.data);
        })
        .catch((err) => {
          setSubError(
            err.response?.data?.error || 'Failed to initialize submission repository'
          );
        })
        .finally(() => setSubLoading(false));
    } else if (user.role === 'teacher') {
      setSubsLoading(true);
      setSubsError('');
      apiClient
        .get(`/api/assignments/${id}/submissions`)
        .then((res) => {
          setSubmissionsList(res.data.submissions || []);
        })
        .catch((err) => {
          setSubsError(
            err.response?.data?.error || 'Failed to load student submissions'
          );
        })
        .finally(() => setSubsLoading(false));
    }
  }, [id, user, assignment]);

  if (loading) return <div className="page-center">Loading…</div>;
  if (!user) return null;

  if (fetchError) {
    return (
      <div style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
        <p style={{ color: 'red' }}>{fetchError}</p>
        <Link to="/dashboard">← Dashboard</Link>
      </div>
    );
  }

  if (!assignment) return <div className="page-center">Loading assignment…</div>;

  const isStudent = user.role === 'student';
  const isTeacher = user.role === 'teacher';

  // Construct dynamic clone command with placeholder
  let cloneCommand = '';
  if (submission?.cloneUrl) {
    try {
      const u = new URL(submission.cloneUrl);
      u.username = user.name ? user.name.replace(/\s+/g, '').toLowerCase() : 'student';
      u.password = 'YOUR_TOKEN';
      cloneCommand = `git clone ${u.toString()}`;
    } catch {
      const cleanUrl = submission.cloneUrl.replace(/^https?:\/\//, '');
      const protocol = submission.cloneUrl.startsWith('https://') ? 'https://' : 'http://';
      cloneCommand = `git clone ${protocol}student:YOUR_TOKEN@${cleanUrl}`;
    }
  }

  function handleCopyClone() {
    if (!cloneCommand) return;
    navigator.clipboard.writeText(cloneCommand).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ maxWidth: 740, margin: '2rem auto', padding: '0 1rem' }}>
      <p>
        <Link to={`/classrooms/${assignment.classroomId}`}>← Back to Classroom</Link>
      </p>

      <h1>{assignment.title}</h1>

      <div
        style={{
          margin: '1rem 0',
          padding: '0.75rem 1rem',
          background: '#f9f9f9',
          border: '1px solid #eee',
          borderRadius: 4,
        }}
      >
        <strong>Deadline:</strong> {new Date(assignment.deadline).toLocaleString()}
      </div>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>Instructions</h2>
        <div
          style={{
            whiteSpace: 'pre-wrap',
            padding: '1rem',
            background: '#fafafa',
            border: '1px solid #ddd',
            borderRadius: 4,
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
        >
          {assignment.instructions}
        </div>
      </section>

      {/* ─── STUDENT VIEW: Git Submission Info & Instructions ────────────────── */}
      {isStudent && (
        <section
          style={{
            marginTop: '2rem',
            padding: '1.25rem',
            border: '1px solid #c2e0ff',
            background: '#f4f9ff',
            borderRadius: 6,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Your Submission Repository</h2>

          {subLoading && <p>Setting up your repository…</p>}
          {subError && <p style={{ color: 'red' }}>{subError}</p>}

          {submission && (
            <div>
              <p>
                <strong>Repository URL:</strong>{' '}
                <code style={{ wordBreak: 'break-all' }}>{submission.cloneUrl}</code>
              </p>

              <div style={{ marginTop: '1rem' }}>
                <strong>To submit your work:</strong>
                <ol style={{ paddingLeft: '1.25rem', lineHeight: 1.6, marginTop: '0.5rem' }}>
                  <li>
                    If you don't have a personal access token yet, create one here:{' '}
                    <Link to="/tokens" style={{ fontWeight: 600 }}>Personal Access Tokens</Link>
                  </li>
                  <li style={{ marginTop: '0.5rem' }}>
                    In your terminal, clone your repository:
                    <div
                      style={{
                        margin: '0.5rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <pre
                        style={{
                          background: '#2d3748',
                          color: '#f7fafc',
                          padding: '0.75rem 1rem',
                          borderRadius: 4,
                          margin: 0,
                          overflowX: 'auto',
                          flex: 1,
                          fontSize: '0.875rem',
                        }}
                      >
                        <code>{cloneCommand}</code>
                      </pre>
                      <button
                        type="button"
                        onClick={handleCopyClone}
                        style={{ padding: '0.5rem 0.75rem', cursor: 'pointer' }}
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#555' }}>
                      (Replace <code>YOUR_TOKEN</code> with your actual personal access token)
                    </span>
                  </li>
                  <li style={{ marginTop: '0.75rem' }}>
                    Make your changes, then commit and push:
                    <pre
                      style={{
                        background: '#2d3748',
                        color: '#f7fafc',
                        padding: '0.75rem 1rem',
                        borderRadius: 4,
                        marginTop: '0.5rem',
                        overflowX: 'auto',
                        fontSize: '0.875rem',
                      }}
                    >
                      <code>{`git add .\ngit commit -m "your message"\ngit push origin main`}</code>
                    </pre>
                  </li>
                </ol>
              </div>

              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#4a5568' }}>
                💡 Need a new token or want to revoke an old one? Visit the{' '}
                <Link to="/tokens">Tokens Page</Link> at any time.
              </p>
            </div>
          )}
        </section>
      )}

      {/* ─── TEACHER VIEW: Submissions List ──────────────────────────────────── */}
      {isTeacher && (
        <section
          style={{
            marginTop: '2rem',
            padding: '1.25rem',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            borderRadius: 6,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Student Submissions</h2>

          <p style={{ color: '#666', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '1rem' }}>
            Shows students who have started this assignment. Push activity and commit history will be visible in a future update.
          </p>

          {subsLoading && <p>Loading submissions…</p>}
          {subsError && <p style={{ color: 'red' }}>{subsError}</p>}

          {!subsLoading && !subsError && submissionsList.length === 0 && (
            <p>No students have started this assignment yet.</p>
          )}

          {!subsLoading && !subsError && submissionsList.length > 0 && (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem',
                marginTop: '0.5rem',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid #edf2f7', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Student</th>
                  <th style={{ padding: '0.5rem' }}>Email</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                  <th style={{ padding: '0.5rem' }}>Started At</th>
                </tr>
              </thead>
              <tbody>
                {submissionsList.map((sub) => {
                  const student = sub.studentId || {};
                  return (
                    <tr key={sub._id} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 500 }}>
                        {student.name || 'Unknown Student'}
                      </td>
                      <td style={{ padding: '0.5rem', color: '#4a5568' }}>
                        {student.email || '—'}
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: '#e6fffa',
                            color: '#234e52',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          Repo created
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem', color: '#718096', fontSize: '0.85rem' }}>
                        {new Date(sub.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}
