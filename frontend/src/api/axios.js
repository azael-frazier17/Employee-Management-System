import axios from 'axios';

// Base URL of the Express API (see frontend/.env.example)
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const TOKEN_KEY = 'ems-token';
export const USER_KEY = 'ems-user';

export const getStoredToken = () =>
  localStorage.getItem(TOKEN_KEY) || localStorage.getItem('ems_token');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach "Authorization: Bearer <token>" to every request
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// AuthContext registers a function here that clears the session on 401
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLoginCall = error.config?.url?.includes('/auth/login');
    // Any 401 (except a wrong password on the login form) = session is no longer valid
    if (status === 401 && !isLoginCall && onUnauthorized) {
      onUnauthorized(error.response?.data?.message || 'Session expired. Please log in again.');
    }
    return Promise.reject(error);
  }
);

/** Turns any axios error into a message we can show to the user. */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.request && !error?.response) {
    return 'Cannot reach the server. Please check that the backend is running.';
  }
  return error?.message || fallback;
};

export default api;
