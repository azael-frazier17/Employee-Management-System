import { Inbox } from 'lucide-react';
import Button from './Button';
export default function EmptyState({ title = 'Nothing here yet', description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Inbox size={25} /></span>
      <h3>{title}</h3>{description && <p>{description}</p>}
      {actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
