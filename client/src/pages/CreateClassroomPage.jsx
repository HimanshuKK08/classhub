import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import apiClient from '../api/client.js';

export default function CreateClassroomPage() {
  const { user, loading } = useAuth('teacher');
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [result, setResult] = useState(null); // { inviteCode, classroomId }
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (loading) return <div className="page-center">Loading…</div>;
  if (!user) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setSubmitting(true);
    try {
      const res = await apiClient.post('/api/classrooms', { name });
      const { classroom } = res.data;
      setResult({ inviteCode: classroom.inviteCode, classroomId: classroom._id });
      setName('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create classroom');
    } finally {
      setSubmitting(false);
    }
  }

  const joinLink = result
    ? `${window.location.origin}/join/${result.inviteCode}`
    : '';

  function handleCopy() {
    navigator.clipboard.writeText(joinLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ maxWidth: 480, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Create a Classroom</h1>
      <p>
        <a href="/dashboard">← Dashboard</a>
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="classroom-name">Classroom Name</label>
          <br />
          <input
            id="classroom-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. CS101 – Introduction to Programming"
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Classroom'}
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: 4,
          }}
        >
          <p>
            <strong>Classroom created!</strong> Share this invite link with your
            students:
          </p>
          <code
            style={{
              display: 'block',
              background: '#f4f4f4',
              padding: '0.5rem',
              wordBreak: 'break-all',
              marginBottom: '0.5rem',
            }}
          >
            {joinLink}
          </code>
          <button onClick={handleCopy}>{copied ? 'Copied!' : 'Copy Link'}</button>
          <span style={{ marginLeft: '1rem' }}>
            Invite code: <strong>{result.inviteCode}</strong>
          </span>
          <p style={{ marginTop: '0.75rem' }}>
            <a href={`/classrooms/${result.classroomId}`}>View Classroom →</a>
          </p>
        </div>
      )}
    </div>
  );
}
