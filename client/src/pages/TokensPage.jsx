import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client.js';

export default function TokensPage() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState([]);
  const [label, setLabel] = useState('');
  const [newToken, setNewToken] = useState(null); // raw token shown once after creation
  const [error, setError] = useState('');
  const [createError, setCreateError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Guard: redirect to login if not authenticated
    apiClient.get('/api/auth/me')
      .catch(() => navigate('/login'));

    fetchTokens();
  }, [navigate]);

  async function fetchTokens() {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/tokens');
      setTokens(res.data.tokens);
    } catch {
      setError('Failed to load tokens.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    setNewToken(null);
    setCreating(true);
    try {
      const res = await apiClient.post('/api/tokens', { label });
      setNewToken({ raw: res.data.token, label: res.data.label });
      setLabel('');
      fetchTokens();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create token.');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id) {
    if (!confirm('Revoke this token? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/api/tokens/${id}`);
      fetchTokens();
    } catch {
      alert('Failed to revoke token.');
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Personal Access Tokens</h1>
        <Link to="/dashboard" className="btn-secondary">← Back to Dashboard</Link>
      </header>

      <main className="dashboard-main">

        {/* New token created — show raw token once */}
        {newToken && (
          <div className="token-reveal">
            <strong>⚠ Copy your token now — you won&apos;t see it again</strong>
            <p className="token-label-hint">Token: <em>{newToken.label}</em></p>
            <code className="raw-token">{newToken.raw}</code>
            <p className="token-hint">Store it somewhere safe. After you close this, it&apos;s gone.</p>
          </div>
        )}

        {/* Create token form */}
        <section className="token-create-section">
          <h2>Generate a new token</h2>
          {createError && <div className="error-banner">{createError}</div>}
          <form onSubmit={handleCreate} className="token-form">
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder='e.g. "My laptop" or "CI runner"'
              required
            />
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Generating…' : 'Generate token'}
            </button>
          </form>
        </section>

        {/* Token list */}
        <section className="token-list-section">
          <h2>Existing tokens</h2>
          {error && <div className="error-banner">{error}</div>}

          {loading ? (
            <p>Loading tokens…</p>
          ) : tokens.length === 0 ? (
            <p className="empty-state">No tokens yet. Generate one above.</p>
          ) : (
            <table className="token-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Created</th>
                  <th>Last used</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tokens.map(t => (
                  <tr key={t._id} className={t.revoked ? 'row-revoked' : ''}>
                    <td>{t.label}</td>
                    <td>{formatDate(t.createdAt)}</td>
                    <td>{formatDate(t.lastUsedAt)}</td>
                    <td>
                      <span className={`status-badge ${t.revoked ? 'status-revoked' : 'status-active'}`}>
                        {t.revoked ? 'Revoked' : 'Active'}
                      </span>
                    </td>
                    <td>
                      {!t.revoked && (
                        <button
                          className="btn-danger-sm"
                          onClick={() => handleRevoke(t._id)}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
