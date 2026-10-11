import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import apiClient from '../api/client.js';

export default function JoinedClassroomsPage() {
  const { user, loading } = useAuth('student');
  const [classrooms, setClassrooms] = useState([]);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!user) return;
    apiClient
      .get('/api/classrooms/joined')
      .then((res) => setClassrooms(res.data.classrooms))
      .catch(() => setFetchError('Failed to load classrooms'));
  }, [user]);

  if (loading) return <div className="page-center">Loading…</div>;
  if (!user) return null;

  return (
    <div style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Joined Classrooms</h1>
      <p>
        <a href="/dashboard">← Dashboard</a>
        {' · '}
        <Link to="/join">Join a Classroom</Link>
      </p>

      {fetchError && <p style={{ color: 'red' }}>{fetchError}</p>}

      {classrooms.length === 0 && !fetchError && (
        <p>You haven't joined any classrooms yet.</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {classrooms.map((c) => (
          <li
            key={c._id}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #ddd',
              borderRadius: 4,
              marginBottom: '0.5rem',
            }}
          >
            <Link to={`/classrooms/${c._id}`}>
              <strong>{c.name}</strong>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
