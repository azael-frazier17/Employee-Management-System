import { Eye, Pencil, Trash2 } from 'lucide-react';
import Avatar from './ui/Avatar';
import StatusBadge from './ui/StatusBadge';
import { formatDate } from '../utils/helpers';

export default function EmployeeTable({ employees, onView, onEdit, onDelete }) {
  return (
    <div className="table-wrap"><table className="table"><thead><tr><th>Employee</th><th>Code</th><th>Department</th><th>Position</th><th>Date hired</th><th>Status</th><th></th></tr></thead><tbody>
      {employees.map(employee=><tr key={employee.id}>
        <td><div className="employee-cell"><Avatar name={employee.full_name} size={38}/><div><strong>{employee.full_name}</strong><span>{employee.email}</span></div></div></td>
        <td>{employee.employee_code || '-'}</td><td>{employee.department_name || '-'}</td><td>{employee.position_title || '-'}</td><td>{formatDate(employee.date_hired)}</td>
        <td><StatusBadge status={employee.status}/></td>
        <td><div className="row-actions touch"><button className="icon-button" aria-label="View employee" onClick={()=>onView(employee)}><Eye size={16}/></button><button className="icon-button" aria-label="Edit employee" onClick={()=>onEdit(employee)}><Pencil size={16}/></button><button className="icon-button" aria-label="Delete employee" onClick={()=>onDelete(employee)}><Trash2 size={16}/></button></div></td>
      </tr>)}
    </tbody></table></div>
  );
}
