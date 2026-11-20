import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth() -> { user, token, employee, ready, isAdmin, login(), logout(), refreshMe(), updateAvatar() }
 * user = { id, username, role, employeeId, fullName, avatar }
 */
export default function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
