import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client.js';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  async function handleLogout() {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      navigate('/login');
    }
  }

  if (loading) return <div className="page-center">Loading…</div>;
  if (!user) return null;

  const isTeacher = user.role === 'teacher';

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>ClassHub</h1>
        <button className="btn-secondary" onClick={handleLogout}>Log out</button>
      </header>

      <main className="dashboard-main">
        <section className="user-card">
          <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <h2>{user.name}</h2>
            <span className={`role-badge role-${user.role}`}>{user.role}</span>
            <p className="user-email">{user.email}</p>
          </div>
        </section>

        <section className="dashboard-actions">
          {isTeacher ? (
            <>
              <Link to="/classrooms/mine" className="action-card">
                <div className="action-icon">🏫</div>
                <div>
                  <strong>My Classrooms</strong>
                  <p>View and manage classrooms you teach</p>
                </div>
              </Link>
              <Link to="/create-classroom" className="action-card">
                <div className="action-icon">➕</div>
                <div>
                  <strong>Create Classroom</strong>
                  <p>Start a new classroom and generate an invite code</p>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link to="/classrooms/joined" className="action-card">
                <div className="action-icon">📚</div>
                <div>
                  <strong>Joined Classrooms</strong>
                  <p>View classrooms you are enrolled in</p>
                </div>
              </Link>
              <Link to="/join" className="action-card">
                <div className="action-icon">🔗</div>
                <div>
                  <strong>Join a Classroom</strong>
                  <p>Enter an invite code to join a classroom</p>
                </div>
              </Link>
            </>
          )}

          <Link to="/tokens" className="action-card">
            <div className="action-icon">🔑</div>
            <div>
              <strong>Personal Access Tokens</strong>
              <p>Manage tokens for git access</p>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
