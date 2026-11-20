import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useAuth from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';

const titles = {
  '/':'Dashboard','/employees':'Employees','/departments':'Departments & Positions',
  '/attendance':'Attendance','/leaves':'Leave Requests','/profile':'My Profile','/reports':'Reports',
};

function Shell() {
  const [collapsed,setCollapsed] = useState(false);
  const [mobileOpen,setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setMobileOpen(false), [location.pathname]);
  const title = titles[location.pathname] || 'EMS';
  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen}/>
      <div className={`main-shell ${collapsed ? 'collapsed' : ''}`}>
        <Navbar title={title} onMenu={() => setMobileOpen(!mobileOpen)}/>
        <AnimatePresence mode="wait"><Routes location={location} key={location.pathname}>
          <Route path="/" element={<Dashboard/>}/>
          <Route path="*" element={<NotFound/>}/>
          <Route path="/employees" element={<ProtectedRoute roles={['Admin']}/>}><Route index element={<Employees/>}/></Route>
          <Route path="/departments" element={<ProtectedRoute roles={['Admin']}/>}><Route index element={<Departments/>}/></Route>
          <Route path="/attendance" element={<Attendance/>}/>
          <Route path="/leaves" element={<Leaves/>}/>
          <Route path="/profile" element={<Profile/>}/>
          <Route path="/reports" element={<ProtectedRoute roles={['Admin']}/>}><Route index element={<Reports/>}/></Route>
        </Routes></AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="login-page"><div className="login-side"><div className="brand-mark" style={{width:56,height:56}}/><h2 style={{marginTop:14}}>Loading EMS...</h2></div></div>;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace/> : <Login/>}/>
      <Route element={<ProtectedRoute/>}><Route path="/*" element={<Shell/>}/></Route>
    </Routes>
  );
}
