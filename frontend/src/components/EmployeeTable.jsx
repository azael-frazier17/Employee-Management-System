import { motion } from 'framer-motion';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { fadeUp, stagger } from '../utils/motion';
import Avatar from './ui/Avatar';
import StatusBadge from './ui/StatusBadge';

/**
 * EmployeeTable
 * Columns: avatar + name + email, code, department, position, date hired, status badge, actions.
 * Clicking a row opens the right-side Drawer; action buttons stop event propagation.
 */
export default function EmployeeTable({ employees = [], currentUserId, onView, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Code</th>
            <th>Department</th>
            <th>Position</th>
            <th>Date hired</th>
            <th>Status</th>
            <th className="right">Actions</th>
          </tr>
        </thead>
        <motion.tbody variants={stagger} initial="hidden" animate="show">
          {employees.map((emp) => {
            const isSelf = currentUserId && emp.user_id === currentUserId;
            return (
              <motion.tr
                key={emp.id}
                variants={fadeUp}
                className="clickable"
                onClick={() => onView(emp)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onView(emp);
                  }
                }}
              >
                <td>
                  <div className="person">
                    <Avatar name={emp.full_name} size={36} />
                    <div style={{ minWidth: 0 }}>
                      <div className="person-name">{emp.full_name}</div>
                      <div className="person-sub">{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td className="num">
                  <span className="chip" style={{ height: 24, padding: '0 8px', fontSize: 11.5 }}>
                    {emp.employee_code}
                  </span>
                </td>
                <td>{emp.department_name || <span className="muted">—</span>}</td>
                <td>{emp.position_title || <span className="muted">—</span>}</td>
                <td className="num">{formatDate(emp.date_hired)}</td>
                <td>
                  <StatusBadge status={emp.status} />
                </td>
                <td className="right" onClick={(e) => e.stopPropagation()}>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => onView(emp)}
                      aria-label={`View ${emp.full_name}`}
                      title="View details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => onEdit(emp)}
                      aria-label={`Edit ${emp.full_name}`}
                      title="Edit employee"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => onDelete(emp)}
                      disabled={isSelf}
                      data-tooltip={isSelf ? 'You cannot delete your own record' : undefined}
                      aria-label={`Delete ${emp.full_name}`}
                      title="Delete employee"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </motion.tbody>
      </table>
    </div>
  );
}
