import { STATUS_COLORS } from '../../utils/constants';
export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${STATUS_COLORS[status] || 'info'}`}>
      <span className="status-dot" />{status}
    </span>
  );
}
