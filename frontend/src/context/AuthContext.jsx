import { createContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ems_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('ems_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const validate = async () => {
      if (!token) { if (active) setLoading(false); return; }
      try {
        const response = await api.get('/auth/me');
        const authUser = response.data.data.user;
        if (active) {
          setUser(authUser);
          localStorage.setItem('ems_user', JSON.stringify(authUser));
        }
      } catch {
        localStorage.removeItem('ems_token');
        localStorage.removeItem('ems_user');
        if (active) { setToken(null); setUser(null); }
      } finally {
        if (active) setLoading(false);
      }
    };
    validate();
    return () => { active = false; };
  }, [token]);

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token: nextToken, user: nextUser } = response.data.data;
    localStorage.setItem('ems_token', nextToken);
    localStorage.setItem('ems_user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    localStorage.removeItem('ems_token');
    localStorage.removeItem('ems_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAdmin: user?.role === 'Admin', login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
