import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';

/** Shows a toast once, then redirects (toasts must not be fired during render). */
function RedirectWithToast({ to, message }) {
  useEffect(() => {
    toast.error(message, { id: 'wrong-role' });
  }, [message]);
  return <Navigate to={to} replace />;
}

/**
 * Guards a route.
 *  - not logged in   -> /login
 *  - wrong role      -> / with a toast
 */
export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (roles && !roles.includes(user.role)) {
    return <RedirectWithToast to="/" message="You do not have access to that page." />;
  }

  return children || <Outlet />;
}
