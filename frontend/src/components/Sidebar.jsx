import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarClock,
  CalendarDays,
  BarChart3,
  UserCircle,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Avatar from './ui/Avatar';
import './Sidebar.css';

// Menu per role, grouped into sections
const ADMIN_MENU = [
  { section: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    section: 'Management',
    items: [
      { to: '/employees', label: 'Employees', icon: Users },
      { to: '/departments', label: 'Departments & Positions', icon: Building2 },
    ],
  },
  {
    section: 'Time & Leave',
    items: [
      { to: '/attendance', label: 'Attendance', icon: CalendarClock },
      { to: '/leaves', label: 'Leave Requests', icon: CalendarDays },
    ],
  },
  { section: 'Insights', items: [{ to: '/reports', label: 'Reports', icon: BarChart3 }] },
  { section: 'Account', items: [{ to: '/profile', label: 'My Profile', icon: UserCircle }] },
];

const EMPLOYEE_MENU = [
  { section: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    section: 'Time & Leave',
    items: [
      { to: '/attendance', label: 'My Attendance', icon: CalendarClock },
      { to: '/leaves', label: 'My Leaves', icon: CalendarDays },
    ],
  },
  { section: 'Account', items: [{ to: '/profile', label: 'My Profile', icon: UserCircle }] },
];

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { user, isAdmin } = useAuth();
  const menu = isAdmin ? ADMIN_MENU : EMPLOYEE_MENU;

  return (
    <>
      {/* Dark backdrop behind the drawer on small screens */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
          />
        )}
      </AnimatePresence>

      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <span className="logo-mark">
            <Users size={19} />
          </span>
          <span className="logo-text">
            EMS<small>HR Workspace</small>
          </span>
          <button
            type="button"
            className="icon-btn sidebar-close"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation groups */}
        <nav className="sidebar-nav">
          {menu.map((group) => (
            <div className="nav-group" key={group.section}>
              <div className="nav-section">{group.section}</div>
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className="nav-item"
                  onClick={onCloseMobile}
                  data-label={label}
                >
                  {({ isActive }) => (
                    <>
                      {/* The active pill glides between items thanks to layoutId */}
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="nav-active"
                          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                        />
                      )}
                      <span className="nav-icon">
                        <Icon size={19} />
                      </span>
                      <span className="nav-label">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom footer: Signed-in user + Collapse toggle */}
        <div className="sidebar-footer">
          <NavLink
            to="/profile"
            className="sidebar-user"
            onClick={onCloseMobile}
            data-label={`${user?.fullName || user?.username} (${user?.role})`}
          >
            <Avatar name={user?.fullName || user?.username || ''} src={user?.avatar} size={36} />
            <span className="sidebar-user-info">
              <strong>{user?.fullName}</strong>
              <small>
                {user?.role} · @{user?.username}
              </small>
            </span>
          </NavLink>

          <button
            type="button"
            className="sidebar-collapse"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-label={collapsed ? 'Expand sidebar' : undefined}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span className="nav-label">Collapse sidebar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
