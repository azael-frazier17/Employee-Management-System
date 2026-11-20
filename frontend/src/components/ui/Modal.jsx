import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { backdrop, scaleIn } from '../../utils/motion';
import './Modal.css';

/**
 * Modal: blurred backdrop + panel that springs in.
 * Esc or clicking the backdrop closes it. size: sm | md | lg
 */
export default function Modal({ open, onClose, title, description, icon: Icon, children, footer, size = 'md' }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => {
      const first = panelRef.current?.querySelector('input, select, textarea, button:not(.modal-close)');
      (first || panelRef.current)?.focus();
    }, 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="modal-root">
          <motion.div
            className="modal-backdrop"
            variants={backdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            className={`modal-panel modal-${size}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            variants={scaleIn}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div className="modal-head">
              {Icon && (
                <div className="modal-icon">
                  <Icon size={18} />
                </div>
              )}
              <div className="modal-titles">
                <h3>{title}</h3>
                {description && <p className="muted small">{description}</p>}
              </div>
              <button type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Close dialog">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-foot">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
