import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { slideInRight } from '../../utils/motion';

export default function Drawer({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const handler = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence>{open && (
      <motion.div className="overlay drawer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <motion.aside className="drawer" variants={slideInRight} initial="hidden" animate="visible" exit="hidden" role="dialog" aria-modal="true" aria-label={title}>
          <div className="drawer-head"><h2>{title}</h2><button className="icon-button" aria-label="Close drawer" onClick={onClose}><X size={19} /></button></div>
          <div className="drawer-body">{children}</div>
        </motion.aside>
      </motion.div>
    )}</AnimatePresence>, document.body
  );
}
