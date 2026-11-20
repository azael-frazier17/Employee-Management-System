import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="brand-loader">Loading EMS...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    toast.error('You do not have permission to access that page.');
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
