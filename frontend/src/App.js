import { Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import useAuth from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import FullScreenLoader from './components/ui/FullScreenLoader';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';

const ADMIN = ['Admin'];

export default function App() {
  const { user, ready } = useAuth();

  // While the saved token is being checked (GET /auth/me) show the branded loader
  if (!ready) return <FullScreenLoader />;

  return (
    // reducedMotion="user": framer-motion respects prefers-reduced-motion
    <MotionConfig reducedMotion="user">
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '13.5px',
            padding: '10px 14px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#F43F5E', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

        {/* Logged-in area (both roles) */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="employees" element={<ProtectedRoute roles={ADMIN}><Employees /></ProtectedRoute>} />
          <Route path="departments" element={<ProtectedRoute roles={ADMIN}><Departments /></ProtectedRoute>} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="leaves" element={<Leaves />} />
          <Route path="profile" element={<Profile />} />
          <Route path="reports" element={<ProtectedRoute roles={ADMIN}><Reports /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </MotionConfig>
  );
}
