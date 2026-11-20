import { motion } from 'framer-motion';
import { AlertCircle, Inbox, RotateCw } from 'lucide-react';
import Button from './Button';
import './EmptyState.css';

/** Empty state: icon + friendly text + optional action button. */
export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action, compact = false }) {
  return (
    <motion.div
      className={`empty-state ${compact ? 'compact' : ''}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="empty-icon">
        <Icon size={compact ? 20 : 26} />
      </div>
      <h4>{title}</h4>
      {message && <p>{message}</p>}
      {action && <div className="empty-action">{action}</div>}
    </motion.div>
  );
}

/** Error state: message + Retry button. */
export function ErrorState({ message = 'Something went wrong.', onRetry, compact = false }) {
  return (
    <motion.div
      className={`empty-state error ${compact ? 'compact' : ''}`}
      role="alert"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="empty-icon">
        <AlertCircle size={compact ? 20 : 26} />
      </div>
      <h4>Could not load data</h4>
      <p>{message}</p>
      {onRetry && (
        <div className="empty-action">
          <Button variant="secondary" size="sm" icon={RotateCw} onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </motion.div>
  );
}
