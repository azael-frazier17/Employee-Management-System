import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronDown, KeyRound, LogOut, Menu, ShieldCheck, UserCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { longToday } from '../utils/helpers';
import Avatar from './ui/Avatar';
import StatusBadge from './ui/StatusBadge';
import ThemeToggle from './ui/ThemeToggle';
import Modal from './ui/Modal';
import ChangePasswordForm from './ChangePasswordForm';
import './Navbar.css';

// Page title per route (some titles depend on the role)
const pageTitle = (pathname, isAdmin) => {
  const titles = {
    '/': 'Dashboard',
    '/employees': 'Employees',
    '/departments': 'Departments & Positions',
    '/attendance': isAdmin ? 'Attendance' : 'My Attendance',
    '/leaves': isAdmin ? 'Leave Requests' : 'My Leaves',
    '/profile': 'My Profile',
    '/reports': 'Reports',
  };
  return titles[pathname] || 'Page not found';
};

export default function Navbar({ onOpenMenu }) {
  const { user, isAdmin, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the user menu on outside click or Esc
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (e) => !menuRef.current?.contains(e.target) && setMenuOpen(false);
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const title = pageTitle(pathname, isAdmin);

  return (
    <header className="navbar">
      <button type="button" className="icon-btn navbar-burger" onClick={onOpenMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>

      {/* Breadcrumb + title */}
      <div className="navbar-title">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">EMS</Link>
          <span aria-hidden="true">/</span>
          <span>{title}</span>
        </nav>
        <AnimatePresence mode="wait" initial={false}>
          <motion.h2
            key={title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {title}
          </motion.h2>
        </AnimatePresence>
      </div>

      <div className="navbar-actions">
        {/* Subtle date & role status pill on desktop */}
        <div className="navbar-pill">
          <Calendar size={13} />
          <span>{longToday()}</span>
          <span className="navbar-pill-sep" aria-hidden="true" />
          <ShieldCheck size={13} className="navbar-pill-accent" />
          <strong>{user?.role}</strong>
        </div>

        <ThemeToggle />

        {/* User menu */}
        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="user-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Open user menu"
          >
            <Avatar name={user?.fullName || ''} src={user?.avatar} size={32} />
            <span className="user-menu-name">
              <strong>{user?.fullName}</strong>
              <small>{user?.role}</small>
            </span>
            <ChevronDown size={15} className={`chev ${menuOpen ? 'open' : ''}`} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="user-dropdown"
                role="menu"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.16 }}
              >
                <div className="user-dropdown-head">
                  <Avatar name={user?.fullName || ''} src={user?.avatar} size={40} />
                  <div>
                    <strong>{user?.fullName}</strong>
                    <span className="muted small">@{user?.username}</span>
                    <div style={{ marginTop: 6 }}>
                      <StatusBadge status={user?.role} size="sm" />
                    </div>
                  </div>
                </div>
                <Link to="/profile" role="menuitem" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                  <UserCircle size={16} /> My profile
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setPwOpen(true);
                  }}
                >
                  <KeyRound size={16} /> Change password
                </button>
                <button type="button" role="menuitem" className="dropdown-item danger" onClick={logout}>
                  <LogOut size={16} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Modal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        title="Change password"
        description="Use at least 8 characters. A mix of letters, numbers and symbols is best."
        icon={KeyRound}
        size="sm"
      >
        <ChangePasswordForm onDone={() => setPwOpen(false)} />
      </Modal>
    </header>
  );
}
