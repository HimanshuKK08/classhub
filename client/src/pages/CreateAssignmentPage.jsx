import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import apiClient from '../api/client.js';

export default function CreateAssignmentPage() {
  const { id: classroomId } = useParams();
  const { user, loading } = useAuth('teacher');
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="page-center">Loading…</div>;
  if (!user) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!title.trim() || !instructions.trim() || !deadline) {
      setError('Title, instructions, and deadline are required.');
      return;
    }

    const selectedDate = new Date(deadline);
    if (isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
      setError('Deadline must be a future date and time.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/api/classrooms/${classroomId}/assignments`, {
        title: title.trim(),
        instructions: instructions.trim(),
        deadline: selectedDate.toISOString(),
      });
      navigate(`/classrooms/${classroomId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 540, margin: '2rem auto', padding: '0 1rem' }}>
      <p>
        <Link to={`/classrooms/${classroomId}`}>← Back to Classroom</Link>
      </p>

      <h1>Create Assignment</h1>

      <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="assignment-title">
            <strong>Title</strong>
          </label>
          <br />
          <input
            id="assignment-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Homework 1: Binary Search Tree"
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="assignment-instructions">
            <strong>Instructions</strong>
          </label>
          <br />
          <textarea
            id="assignment-instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            required
            rows={6}
            placeholder="Provide assignment specifications and instructions..."
            style={{
              width: '100%',
              padding: '0.5rem',
              marginTop: '0.25rem',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="assignment-deadline">
            <strong>Deadline</strong>
          </label>
          <br />
          <input
            id="assignment-deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Assignment'}
        </button>
      </form>
    </div>
  );
}
