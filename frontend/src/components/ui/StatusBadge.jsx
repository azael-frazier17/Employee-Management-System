import { motion } from 'framer-motion';
import { STATUS_TONES } from '../../utils/constants';
import { pop } from '../../utils/motion';
import './StatusBadge.css';

/**
 * Soft tinted pill with a small dot. The dot pulses for "Pending".
 * The badge pops (scale) whenever the status value changes (key = status).
 */
export default function StatusBadge({ status, label, tone, size = 'md' }) {
  if (!status) return null;
  const color = tone || STATUS_TONES[status] || 'info';
  return (
    <motion.span
      key={status}
      className={`badge badge-${color} badge-${size}`}
      variants={pop}
      initial="initial"
      animate="animate"
    >
      <span className={`badge-dot ${status === 'Pending' ? 'pulse' : ''}`} aria-hidden="true" />
      {label || status}
    </motion.span>
  );
}
