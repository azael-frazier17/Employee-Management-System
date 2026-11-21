import { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Building2,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Minus,
  Moon,
  PanelLeftOpen,
  Plus,
  Sparkles,
  Sun,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import Avatar from './ui/Avatar';
import './Sidebar.css';

const PRIMARY_LINKS_EMPLOYEE = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/attendance', label: 'My Attendance', icon: CalendarClock },
  { to: '/leaves', label: 'My Leaves', icon: CalendarDays },
];

const PRIMARY_LINKS_ADMIN = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/attendance', label: 'Attendance', icon: CalendarClock },
  { to: '/leaves', label: 'Leave Requests', icon: CalendarDays },
];

const RAIL_EXTRA_ADMIN = [
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/departments', label: 'Departments & Positions', icon: Building2 },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

const RAIL_EXTRA_EMPLOYEE = [
  { to: '/profile', label: 'My Profile', icon: UserCircle },
];

/* Framer Motion variants */
const drawerVariants = {
  hidden: { x: '-100%', opacity: 0.6 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 360,
      damping: 34,
      mass: 0.9,
      when: 'beforeChildren',
      staggerChildren: 0.045,
      delayChildren: 0.04,
    },
  },
  exit: {
    x: '-100%',
    opacity: 0.6,
    transition: { duration: 0.24, ease: [0.4, 0, 0.2, 1] },
  },
};

const navListVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.06,
    },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
};

const visualRevealVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const accordionVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.24, ease: [0.4, 0, 0.2, 1] },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
      opacity: { duration: 0.22, delay: 0.05 },
      staggerChildren: 0.035,
      delayChildren: 0.04,
    },
  },
};

const subItemVariants = {
  collapsed: { opacity: 0, x: -8 },
  expanded: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Sidebar({ user: userProp, mobileOpen = false, onCloseMobile }) {
  const { user: authUser, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [now, setNow] = useState(() => new Date());

  const user = userProp || authUser;
  const displayName = user?.fullName || user?.name || user?.username || 'Employee';
  const userRole = user?.role || 'Employee';
  const userHandle = user?.username || '';
  const userAvatar = user?.avatar || user?.avatarUrl || null;

  const primaryLinks = isAdmin ? PRIMARY_LINKS_ADMIN : PRIMARY_LINKS_EMPLOYEE;
  const railLinks = [...primaryLinks, ...(isAdmin ? RAIL_EXTRA_ADMIN : RAIL_EXTRA_EMPLOYEE)];

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    onCloseMobile?.();
  }, [onCloseMobile]);

  const openDrawer = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Sync mobile hamburger trigger from Layout/Navbar
  useEffect(() => {
    if (mobileOpen) {
      setIsOpen(true);
    }
  }, [mobileOpen]);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
    onCloseMobile?.();
  }, [location.pathname, onCloseMobile]);

  // Close drawer on Escape key
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeDrawer]);

  // Keep live date/time fresh for the left visual banner
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const toggleSection = (sectionId) => {
    setOpenSection((prev) => (prev === sectionId ? null : sectionId));
  };

  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const secondarySections = [
    {
      id: 'my-profile',
      title: 'My Profile',
      items: [
        { type: 'link', to: '/profile', label: 'Profile Overview', icon: UserCircle },
        { type: 'link', to: '/attendance', label: 'Attendance Logs', icon: CalendarClock },
        { type: 'link', to: '/leaves', label: 'Leave Summary', icon: CalendarDays },
      ],
    },
    {
      id: 'account-settings',
      title: 'Account Settings',
      items: [
        { type: 'link', to: '/profile', label: 'Security & Password', icon: KeyRound },
        {
          type: 'action',
          label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
          icon: isDark ? Sun : Moon,
          onClick: () => toggleTheme(),
        },
        {
          type: 'action',
          label: 'Sign Out',
          icon: LogOut,
          danger: true,
          onClick: () => {
            closeDrawer();
            logout();
          },
        },
      ],
    },
    {
      id: 'directory',
      title: 'Directory',
      items: isAdmin
        ? [
            { type: 'link', to: '/employees', label: 'Employees', icon: Users },
            { type: 'link', to: '/departments', label: 'Departments & Positions', icon: Building2 },
            { type: 'link', to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
          ]
        : [
            { type: 'link', to: '/profile', label: 'My Department & Role', icon: Building2 },
            { type: 'link', to: '/', label: 'Workspace Overview', icon: LayoutDashboard, end: true },
          ],
    },
  ];

  return (
    <>
      {/* Closed State: Slim Icon Rail (w-16 / 64px) */}
      <aside className="ems-rail" aria-label="Primary icon navigation">
        <motion.button
          type="button"
          className="ems-rail-brand"
          onClick={openDrawer}
          title="Open navigation drawer"
          aria-label="Open navigation drawer"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 450, damping: 24 }}
        >
          <span className="ems-badge-mark">
            <Users size={19} />
          </span>
        </motion.button>

        <nav className="ems-rail-nav" aria-label="Quick navigation">
          {railLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={Boolean(end)}
              className={({ isActive }) => `ems-rail-link ${isActive ? 'is-active' : ''}`}
              title={label}
              aria-label={label}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="ems-rail-active"
                      className="ems-rail-active-bg"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <motion.span
                    className="ems-rail-icon-wrap"
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <Icon size={20} />
                  </motion.span>
                  <span className="ems-rail-tooltip" role="tooltip">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ems-rail-footer">
          <NavLink
            to="/profile"
            className="ems-rail-avatar-link"
            title={`${displayName} (${userRole})`}
            aria-label="Go to my profile"
          >
            <Avatar name={displayName} src={userAvatar} size={36} />
            <span className="ems-avatar-online-dot" aria-hidden="true" />
          </NavLink>

          <motion.button
            type="button"
            className="ems-rail-expand"
            onClick={openDrawer}
            title="Expand navigation"
            aria-label="Expand navigation drawer"
            aria-expanded={isOpen}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <PanelLeftOpen size={18} />
          </motion.button>
        </div>
      </aside>

      {/* Open State: Backdrop + Split-Panel Overlay Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="ems-drawer-backdrop"
              className="ems-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              onClick={closeDrawer}
              aria-hidden="true"
            />

            <motion.aside
              key="ems-drawer-panel"
              className="ems-drawer"
              aria-label="Expanded navigation drawer"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Left Visual Panel (35%) */}
              <div className="ems-drawer-visual">
                {/* Animated ambient aurora orbs */}
                <div className="ems-aurora-orb ems-aurora-orb-1" aria-hidden="true" />
                <div className="ems-aurora-orb ems-aurora-orb-2" aria-hidden="true" />
                <div className="ems-visual-grid" aria-hidden="true" />

                <motion.div
                  className="ems-visual-top"
                  variants={visualRevealVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.1}
                >
                  <span className="ems-live-pill">
                    <span className="ems-live-dot" aria-hidden="true" />
                    Live
                  </span>
                  <div className="ems-visual-date">
                    <span className="ems-visual-day">{formattedDate}</span>
                    <span className="ems-visual-time tabular">{formattedTime}</span>
                  </div>
                </motion.div>

                <div className="ems-visual-watermark" aria-hidden="true">
                  <motion.span
                    className="ems-visual-watermark-text"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  >
                    EMS
                  </motion.span>
                </div>

                <motion.div
                  className="ems-visual-bottom"
                  variants={visualRevealVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.18}
                >
                  <span className="ems-visual-emblem" aria-hidden="true">
                    <Sparkles size={15} />
                  </span>
                  <span className="ems-visual-kicker">
                    {isAdmin ? 'Admin Console' : 'EMS Workspace'}
                  </span>
                  <strong className="ems-visual-title">Employee Portal</strong>
                </motion.div>
              </div>

              {/* Right Navigation Panel (65%) */}
              <div className="ems-drawer-panel">
                {/* Floating Square Close Button in Top-Right Corner */}
                <motion.button
                  type="button"
                  className="ems-drawer-close"
                  onClick={closeDrawer}
                  aria-label="Collapse navigation drawer"
                  title="Close navigation"
                  whileHover={{ scale: 1.08, rotate: 90 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                >
                  <X size={18} />
                </motion.button>

                <div className="ems-drawer-scroll">
                  {/* Primary Links (Large & Bold, Staggered Entrance) */}
                  <motion.nav
                    className="ems-primary-nav"
                    aria-label="Primary navigation"
                    variants={navListVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {primaryLinks.map(({ to, label, icon: Icon, end }) => (
                      <motion.div className="ems-primary-row" key={to} variants={navItemVariants}>
                        <NavLink
                          to={to}
                          end={Boolean(end)}
                          onClick={closeDrawer}
                          className={({ isActive }) =>
                            `ems-primary-link ${isActive ? 'is-active' : ''}`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <motion.span
                                  layoutId="ems-drawer-active"
                                  className="ems-primary-active-bg"
                                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                />
                              )}
                              <span className="ems-primary-link-inner">
                                <Icon size={20} className="ems-primary-icon" />
                                <span>{label}</span>
                              </span>
                              <ChevronRight size={17} className="ems-primary-arrow" />
                            </>
                          )}
                        </NavLink>
                      </motion.div>
                    ))}
                  </motion.nav>

                  {/* Animated Gradient Divider */}
                  <motion.div
                    className="ems-drawer-divider"
                    role="separator"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  />

                  {/* Accordion Secondary Sections */}
                  <motion.div
                    className="ems-accordion-group"
                    variants={navListVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {secondarySections.map((section) => {
                      const expanded = openSection === section.id;
                      const hasActiveChild = section.items.some(
                        (item) => item.type === 'link' && location.pathname === item.to
                      );

                      return (
                        <motion.div
                          key={section.id}
                          className={`ems-accordion-item ${expanded ? 'is-expanded' : ''}`}
                          variants={navItemVariants}
                        >
                          <button
                            type="button"
                            className={`ems-accordion-trigger ${hasActiveChild ? 'has-active' : ''}`}
                            onClick={() => toggleSection(section.id)}
                            aria-expanded={expanded}
                            aria-controls={`ems-accordion-panel-${section.id}`}
                          >
                            <span className="ems-accordion-title">{section.title}</span>
                            <motion.span
                              className="ems-accordion-icon"
                              aria-hidden="true"
                              animate={{ rotate: expanded ? 180 : 0 }}
                              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            >
                              {expanded ? <Minus size={15} /> : <Plus size={15} />}
                            </motion.span>
                          </button>

                          <AnimatePresence initial={false}>
                            {expanded && (
                              <motion.div
                                id={`ems-accordion-panel-${section.id}`}
                                className="ems-accordion-motion"
                                variants={accordionVariants}
                                initial="collapsed"
                                animate="expanded"
                                exit="collapsed"
                              >
                                <div className="ems-accordion-inner">
                                  {section.items.map((item) => {
                                    const ItemIcon = item.icon;
                                    if (item.type === 'action') {
                                      return (
                                        <motion.button
                                          key={item.label}
                                          type="button"
                                          variants={subItemVariants}
                                          className={`ems-sub-link ${item.danger ? 'is-danger' : ''}`}
                                          onClick={item.onClick}
                                          whileHover={{ x: 4 }}
                                          whileTap={{ scale: 0.98 }}
                                        >
                                          <ItemIcon size={15} />
                                          <span>{item.label}</span>
                                        </motion.button>
                                      );
                                    }

                                    return (
                                      <motion.div
                                        key={`${section.id}-${item.label}`}
                                        variants={subItemVariants}
                                        whileHover={{ x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        <NavLink
                                          to={item.to}
                                          end={Boolean(item.end)}
                                          onClick={closeDrawer}
                                          className={({ isActive }) =>
                                            `ems-sub-link ${isActive ? 'is-active' : ''}`
                                          }
                                        >
                                          <ItemIcon size={15} />
                                          <span>{item.label}</span>
                                        </NavLink>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>

                {/* Anchored User Profile Card */}
                <motion.div
                  className="ems-drawer-footer"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <NavLink to="/profile" className="ems-profile-card" onClick={closeDrawer}>
                    <span className="ems-profile-avatar-wrap">
                      <Avatar name={displayName} src={userAvatar} size={40} ring />
                      <span className="ems-avatar-online-dot" aria-hidden="true" />
                    </span>
                    <div className="ems-profile-meta">
                      <strong>{displayName}</strong>
                      <small>
                        {userRole}
                        {userHandle ? ` · @${userHandle}` : ''}
                      </small>
                    </div>
                    <ChevronRight size={16} className="ems-profile-chevron" />
                  </NavLink>
                </motion.div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
