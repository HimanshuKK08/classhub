import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client.js';

/**
 * Fetches the current user from /api/auth/me.
 * Redirects to /login if unauthenticated.
 * Optionally redirects away if the user's role doesn't match `requiredRole`.
 *
 * @param {string|null} requiredRole  'teacher' | 'student' | null (any authenticated user)
 * @param {string}      redirectTo    where to redirect if role check fails (default: '/dashboard')
 * @returns {{ user, loading }}
 */
export function useAuth(requiredRole = null, redirectTo = '/dashboard') {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/api/auth/me')
      .then((res) => {
        const u = res.data.user;
        if (requiredRole && u.role !== requiredRole) {
          navigate(redirectTo, { replace: true });
        } else {
          setUser(u);
        }
      })
      .catch(() => navigate('/login', { replace: true }))
      .finally(() => setLoading(false));
  }, [navigate, requiredRole, redirectTo]);

  return { user, loading };
}
