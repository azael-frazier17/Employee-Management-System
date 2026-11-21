import { useCallback, useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PageTransition from './ui/PageTransition';
import './Layout.css';

/** Logged-in shell: Slim Rail / Split-Panel Sidebar + Navbar + animated content area. */
export default function Layout() {
  const location = useLocation();
  const outlet = useOutlet();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleCloseMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={handleCloseMobile} />
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
