import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import './FullScreenLoader.css';

/** Branded loader shown while the saved session is being checked (GET /auth/me). */
export default function FullScreenLoader({ text = 'Loading your workspace…' }) {
  return (
    <div className="fs-loader" role="status" aria-live="polite">
      <motion.div
        className="fs-logo"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Users size={30} />
        <span className="fs-ring" aria-hidden="true" />
      </motion.div>
      <div className="fs-title">EMS</div>
      <div className="fs-bar" aria-hidden="true">
        <span />
      </div>
      <p className="muted small">{text}</p>
    </div>
  );
}
