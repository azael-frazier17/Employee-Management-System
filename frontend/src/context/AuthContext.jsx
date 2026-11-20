import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, {
  getStoredToken,
  setUnauthorizedHandler,
  TOKEN_KEY,
  USER_KEY,
} from '../api/axios';

export const AuthContext = createContext(null);

const readSavedAvatar = (username) => {
  if (!username) return null;
  try {
    return localStorage.getItem(`ems-avatar-${username}`) || null;
  } catch {
    return null;
  }
};

// Reads the saved user from localStorage (supports both ems-user and ems_user)
const readUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY) || localStorage.getItem('ems_user');
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed) return null;
    return {
      ...parsed,
      avatar: parsed.avatar || readSavedAvatar(parsed.username),
    };
  } catch {
    return null;
  }
};

// Builds the same user shape that POST /auth/login returns, from GET /auth/me
const userFromMe = ({ user, employee }) => ({
  id: user.id,
  username: user.username,
  role: user.role,
  employeeId: employee ? employee.id : null,
  fullName: employee ? employee.full_name : user.username,
  avatar: user.avatar || employee?.avatar || readSavedAvatar(user.username),
});

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(readUser);
  const [employee, setEmployee] = useState(null); // linked employee profile (from /auth/me)
  const [ready, setReady] = useState(false); // true once the saved token was checked

  const saveSession = (newToken, newUser) => {
    const enriched = {
      ...newUser,
      avatar: newUser.avatar || readSavedAvatar(newUser.username),
    };
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem('ems_token', newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(enriched));
    localStorage.setItem('ems_user', JSON.stringify(enriched));
    setToken(newToken);
    setUser(enriched);
  };

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('ems_token');
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('ems_user');
    setToken(null);
    setUser(null);
    setEmployee(null);
  }, []);

  // Refreshes the user + employee profile from the server
  const refreshMe = useCallback(async () => {
    const res = await api.get('/auth/me');
    const fresh = userFromMe(res.data.data);
    localStorage.setItem(USER_KEY, JSON.stringify(fresh));
    localStorage.setItem('ems_user', JSON.stringify(fresh));
    setUser(fresh);
    setEmployee(res.data.data.employee);
    return fresh;
  }, []);

  // Allows the user to update their client-side profile photo
  const updateAvatar = useCallback((dataUrl) => {
    setUser((prev) => {
      if (!prev) return prev;
      try {
        if (dataUrl) localStorage.setItem(`ems-avatar-${prev.username}`, dataUrl);
        else localStorage.removeItem(`ems-avatar-${prev.username}`);
      } catch {
        // ignore quota errors
      }
      const next = { ...prev, avatar: dataUrl || null };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      localStorage.setItem('ems_user', JSON.stringify(next));
      return next;
    });
  }, []);

  // On app load: validate the saved token with GET /auth/me
  useEffect(() => {
    if (!getStoredToken()) {
      setReady(true);
      return;
    }
    refreshMe()
      .catch(() => clearSession()) // 401 is also handled by the interceptor
      .finally(() => setReady(true));
  }, [refreshMe, clearSession]);

  // Any 401 from the API: clear the session, go to /login and show the server message
  useEffect(() => {
    setUnauthorizedHandler((message) => {
      clearSession();
      navigate('/login', { replace: true });
      toast.error(message, { id: 'session-expired' });
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession, navigate]);

  const login = useCallback(
    async (username, password) => {
      const res = await api.post('/auth/login', { username, password });
      const { token: newToken, user: newUser } = res.data.data;
      saveSession(newToken, newUser);
      refreshMe().catch(() => {}); // load the employee profile in the background
      return newUser;
    },
    [refreshMe]
  );

  const logout = useCallback(() => {
    clearSession();
    navigate('/login', { replace: true });
    toast.success('You have been logged out.');
  }, [clearSession, navigate]);

  const value = useMemo(
    () => ({
      user,
      token,
      employee,
      ready,
      loading: !ready,
      isAdmin: user?.role === 'Admin',
      login,
      logout,
      refreshMe,
      updateAvatar,
    }),
    [user, token, employee, ready, login, logout, refreshMe, updateAvatar]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
