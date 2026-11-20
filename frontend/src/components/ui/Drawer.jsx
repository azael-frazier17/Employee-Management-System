import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { backdrop, slideInRight } from '../../utils/motion';
import './Modal.css';

/** Drawer: panel that slides in from the right (employee details). Esc closes it. */
export default function Drawer({ open, onClose, title, children, footer }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => panelRef.current?.focus(), 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="drawer-root">
          <motion.div
            className="modal-backdrop"
            variants={backdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={onClose}
          />
          <motion.aside
            ref={panelRef}
            className="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            variants={slideInRight}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div className="drawer-head">
              <h3>{title}</h3>
              <button type="button" className="icon-btn" onClick={onClose} aria-label="Close panel">
                <X size={18} />
              </button>
            </div>
            <div className="drawer-body">{children}</div>
            {footer && <div className="drawer-foot">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
