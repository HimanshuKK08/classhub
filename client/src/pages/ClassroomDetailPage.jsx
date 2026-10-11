import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import apiClient from '../api/client.js';

export default function ClassroomDetailPage() {
  const { id } = useParams();
  const { user, loading } = useAuth(); // any authenticated user
  const [classroom, setClassroom] = useState(null);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!user) return;
    apiClient
      .get(`/api/classrooms/${id}`)
      .then((res) => setClassroom(res.data.classroom))
      .catch((err) => {
        setFetchError(
          err.response?.data?.error || 'Failed to load classroom'
        );
      });
  }, [id, user]);

  if (loading) return <div className="page-center">Loading…</div>;
  if (!user) return null;

  if (fetchError) {
    return (
      <div style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
        <p style={{ color: 'red' }}>{fetchError}</p>
        <a href="/dashboard">← Dashboard</a>
      </div>
    );
  }

  if (!classroom) return <div className="page-center">Loading classroom…</div>;

  const isTeacher = user.role === 'teacher';

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
      {/* Back link */}
      <p>
        {isTeacher ? (
          <Link to="/classrooms/mine">← My Classrooms</Link>
        ) : (
          <Link to="/classrooms/joined">← Joined Classrooms</Link>
        )}
      </p>

      <h1>{classroom.name}</h1>

      {/* Invite code — teacher only */}
      {isTeacher && classroom.inviteCode && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: '#f0f8ff',
            border: '1px solid #b0d4f1',
            borderRadius: 4,
            marginBottom: '1.5rem',
          }}
        >
          <strong>Invite Code:</strong> <code>{classroom.inviteCode}</code>
          <span style={{ marginLeft: '1rem', color: '#555', fontSize: '0.875rem' }}>
            Share link:{' '}
            <code>
              {window.location.origin}/join/{classroom.inviteCode}
            </code>
          </span>
        </div>
      )}

      {/* Assignments section */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>Assignments</h2>
          {isTeacher && (
            <Link to={`/classrooms/${id}/create-assignment`}>
              + Create Assignment
            </Link>
          )}
        </div>

        {classroom.assignments && classroom.assignments.length === 0 && (
          <p>No assignments yet.</p>
        )}

        <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.75rem' }}>
          {classroom.assignments &&
            classroom.assignments.map((a) => (
              <li
                key={a._id}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  marginBottom: '0.5rem',
                }}
              >
                <Link to={`/assignments/${a._id}`}>
                  <strong>{a.title}</strong>
                </Link>
                <span style={{ marginLeft: '1rem', color: '#666', fontSize: '0.875rem' }}>
                  Due: {new Date(a.deadline).toLocaleString()}
                </span>
              </li>
            ))}
        </ul>
      </section>

      {/* Enrolled students — teacher only */}
      {isTeacher && classroom.students && (
        <section style={{ marginTop: '2rem' }}>
          <h2>Enrolled Students ({classroom.students.length})</h2>
          {classroom.students.length === 0 && (
            <p>No students have joined yet.</p>
          )}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {classroom.students.map((s) => (
              <li
                key={s._id}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #eee',
                  borderRadius: 4,
                  marginBottom: '0.25rem',
                }}
              >
                {s.name} — <span style={{ color: '#666' }}>{s.email}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
