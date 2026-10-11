import axios from 'axios';

/**
 * Pre-configured Axios instance for all ClassHub API calls.
 * Points to the Express backend. Set withCredentials so that
 * HTTP-only cookies (for auth tokens) are sent automatically.
 */
const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
