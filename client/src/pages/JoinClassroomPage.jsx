import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import apiClient from '../api/client.js';

export default function JoinClassroomPage() {
  // Support both /join and /join/:inviteCode
  const { inviteCode: codeFromUrl } = useParams();
  const { user, loading } = useAuth('student');
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState(codeFromUrl || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="page-center">Loading…</div>;
  if (!user) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const res = await apiClient.post('/api/classrooms/join', {
        inviteCode: inviteCode.trim(),
      });
      setMessage(res.data.message);
      // Redirect to joined classrooms after a short delay
      setTimeout(() => navigate('/classrooms/joined'), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join classroom');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Join a Classroom</h1>
      <p>
        <a href="/dashboard">← Dashboard</a>
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="invite-code">Invite Code</label>
          <br />
          <input
            id="invite-code"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
            placeholder="Paste your invite code here"
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message} — redirecting…</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Joining…' : 'Join Classroom'}
        </button>
      </form>
    </div>
  );
}
