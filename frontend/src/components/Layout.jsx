import { useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PageTransition from './ui/PageTransition';
import './Layout.css';

const COLLAPSE_KEY = 'ems-sidebar-collapsed';

/** Logged-in shell: Sidebar + Navbar + animated content area. */
export default function Layout() {
  const location = useLocation();
  const outlet = useOutlet();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = () => {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      return !c;
    });
  };

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="app-main">
        <Navbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="app-content" id="main-content">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>{outlet}</PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
