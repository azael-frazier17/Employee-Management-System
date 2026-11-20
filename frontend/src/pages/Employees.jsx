import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowUpDown,
  Building2,
  Calendar,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import useAuth from '../hooks/useAuth';
import useDebounce from '../hooks/useDebounce';
import { EMPLOYEE_STATUSES, PAGE_SIZE } from '../utils/constants';
import { cleanParams, formatDate, tenure } from '../utils/helpers';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';
import Avatar from '../components/ui/Avatar';
import StatusBadge from '../components/ui/StatusBadge';
import Field, { PasswordInput, StrengthMeter } from '../components/ui/Field';
import { SkeletonTable } from '../components/ui/Skeleton';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import EmployeeTable from '../components/EmployeeTable';
import EmployeeForm from '../components/EmployeeForm';

const SORT_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Employee code' },
  { value: 'department', label: 'Department' },
  { value: 'position', label: 'Position' },
  { value: 'date_hired', label: 'Date hired' },
  { value: 'status', label: 'Status' },
];

export default function Employees() {
  const { user } = useAuth();

  // Filters & sorting
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [departmentId, setDepartmentId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(1);

  // Reference lists
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  // Employee list state
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Drawer state
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [savingForm, setSavingForm] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [busyDelete, setBusyDelete] = useState(false);

  // Account creation modal (POST /employees/:id/account)
  const [accountTarget, setAccountTarget] = useState(null);
  const [accForm, setAccForm] = useState({ username: '', password: '' });
  const [accErrors, setAccErrors] = useState({});
  const [savingAcc, setSavingAcc] = useState(false);

  // Password reset modal (PATCH /employees/:id/password)
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [savingReset, setSavingReset] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/departments'), api.get('/departments/positions')])
      .then(([dRes, pRes]) => {
        setDepartments(dRes.data.data || []);
        setPositions(pRes.data.data || []);
      })
      .catch(() => {});
  }, []);

  const filteredPositions = useMemo(() => {
    if (!departmentId) return positions;
    return positions.filter((p) => Number(p.department_id) === Number(departmentId));
  }, [positions, departmentId]);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = cleanParams({
        search: debouncedSearch,
        department_id: departmentId,
        position_id: positionId,
        status,
        sort,
        order,
        page,
        limit: PAGE_SIZE,
      });
      const res = await api.get('/employees', { params });
      const rows = res.data.data || [];
      setEmployees(rows);
      setPagination(res.data.pagination || null);
      setSelected((prev) => (prev ? rows.find((r) => r.id === prev.id) || prev : null));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, departmentId, positionId, status, sort, order, page]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, departmentId, positionId, status, sort, order]);

  const clearFilters = () => {
    setSearch('');
    setDepartmentId('');
    setPositionId('');
    setStatus('');
    setSort('name');
    setOrder('asc');
    setPage(1);
  };

  const handleSaveEmployee = async (payload) => {
    setSavingForm(true);
    try {
      if (editing?.id) {
        const res = await api.put(`/employees/${editing.id}`, payload);
        toast.success(res.data.message || 'Employee updated.');
        if (selected?.id === editing.id) setSelected(res.data.data);
      } else {
        const res = await api.post('/employees', payload);
        toast.success(res.data.message || 'Employee created.');
      }
      setFormOpen(false);
      setEditing(null);
      loadEmployees();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingForm(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setBusyDelete(true);
    try {
      const res = await api.delete(`/employees/${deleting.id}`);
      toast.success(res.data.message || 'Employee deleted.');
      if (selected?.id === deleting.id) setSelected(null);
      setDeleting(null);
      loadEmployees();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyDelete(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^[A-Za-z0-9._-]{3,50}$/.test(accForm.username.trim())) {
      errs.username = '3–50 characters (letters, numbers, dot, underscore, hyphen).';
    }
    if (accForm.password.length < 8 || accForm.password.length > 72) {
      errs.password = 'Password must be 8 to 72 characters.';
    }
    setAccErrors(errs);
    if (Object.keys(errs).length) return;

    setSavingAcc(true);
    try {
      const res = await api.post(`/employees/${accountTarget.id}/account`, {
        username: accForm.username.trim(),
        password: accForm.password,
      });
      toast.success(res.data.message || 'Login account created.');
      setSelected(res.data.data);
      setAccountTarget(null);
      setAccForm({ username: '', password: '' });
      loadEmployees();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingAcc(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8 || newPassword.length > 72) {
      setResetError('Password must be 8 to 72 characters.');
      return;
    }
    setSavingReset(true);
    try {
      const res = await api.patch(`/employees/${resetTarget.id}/password`, {
        new_password: newPassword,
      });
      toast.success(res.data.message || 'Password reset.');
      setResetTarget(null);
      setNewPassword('');
      setResetError('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingReset(false);
    }
  };

  const hasFilters = Boolean(search || departmentId || positionId || status);

  return (
    <div className="stack">
      <PageHeader
        icon={Users}
        title="Employees"
        subtitle="Manage employee records, department assignments, and user accounts."
        actions={
          <Button
            icon={UserPlus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add Employee
          </Button>
        }
      />

      <div className="card">
        <div className="toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, code, or email…"
            label="Search employees"
          />

          <select
            className="select"
            aria-label="Filter by department"
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setPositionId('');
            }}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            className="select"
            aria-label="Filter by position"
            value={positionId}
            onChange={(e) => setPositionId(e.target.value)}
          >
            <option value="">All positions</option>
            {filteredPositions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <select
            className="select"
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {EMPLOYEE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div className="row" style={{ gap: 6 }}>
            <select
              className="select"
              aria-label="Sort by"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORT_FIELDS.map((s) => (
                <option key={s.value} value={s.value}>
                  Sort: {s.label}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              onClick={() => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
              aria-label={`Sort order ${order === 'asc' ? 'ascending' : 'descending'}`}
              title={`Order: ${order.toUpperCase()}`}
              icon={ArrowUpDown}
            >
              {order.toUpperCase()}
            </Button>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={clearFilters}>
              Reset
            </Button>
          )}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={loadEmployees} />
        ) : loading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title={hasFilters ? 'No matching employees' : 'No employees yet'}
            message={
              hasFilters
                ? 'Try clearing some filters or searching for another name or code.'
                : 'Add your first employee record to get started.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button
                  size="sm"
                  icon={UserPlus}
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  Add Employee
                </Button>
              )
            }
          />
        ) : (
          <>
            <EmployeeTable
              employees={employees}
              currentUserId={user?.id}
              onView={setSelected}
              onEdit={(emp) => {
                setEditing(emp);
                setFormOpen(true);
              }}
              onDelete={setDeleting}
            />
            <Pagination pagination={pagination} onChange={setPage} />
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => {
          if (!savingForm) {
            setFormOpen(false);
            setEditing(null);
          }
        }}
        title={editing ? `Edit ${editing.full_name}` : 'Add new employee'}
        description={
          editing
            ? `Employee code ${editing.employee_code}`
            : 'Fill in the employee profile and optional login credentials.'
        }
        icon={editing ? Pencil : UserPlus}
        size="lg"
      >
        <EmployeeForm
          employee={editing}
          departments={departments}
          positions={positions}
          saving={savingForm}
          onSubmit={handleSaveEmployee}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      </Modal>

      {/* Employee Details Drawer */}
      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Employee Details"
        footer={
          selected && (
            <>
              <Button
                variant="secondary"
                icon={Pencil}
                onClick={() => {
                  setEditing(selected);
                  setFormOpen(true);
                }}
              >
                Edit
              </Button>
              {!selected.user_id ? (
                <Button
                  variant="primary"
                  icon={UserCheck}
                  onClick={() => {
                    setAccForm({ username: '', password: '' });
                    setAccErrors({});
                    setAccountTarget(selected);
                  }}
                >
                  Create login account
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  icon={KeyRound}
                  onClick={() => {
                    setNewPassword('');
                    setResetError('');
                    setResetTarget(selected);
                  }}
                >
                  Reset password
                </Button>
              )}
              <div className="spacer" />
              <Button
                variant="danger"
                icon={Trash2}
                disabled={selected.user_id === user?.id}
                onClick={() => setDeleting(selected)}
              >
                Delete
              </Button>
            </>
          )
        }
      >
        {selected && (
          <div className="stack" style={{ gap: 18 }}>
            <div
              className="card card-pad"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'var(--surface-2)',
              }}
            >
              <Avatar name={selected.full_name} size={56} ring />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="row-wrap" style={{ gap: 8 }}>
                  <h3 style={{ fontSize: 18 }}>{selected.full_name}</h3>
                  <StatusBadge status={selected.status} size="sm" />
                </div>
                <p className="muted small" style={{ marginTop: 2 }}>
                  {selected.position_title || 'No position'} ·{' '}
                  {selected.department_name || 'Unassigned department'}
                </p>
                <span
                  className="chip num"
                  style={{ marginTop: 8, height: 24, padding: '0 10px', fontSize: 11.5 }}
                >
                  {selected.employee_code}
                </span>
              </div>
            </div>

            <div className="form-section-title">Contact &amp; Personal</div>
            <div className="card card-pad stack" style={{ gap: 12 }}>
              <div className="row">
                <Mail size={16} className="muted" />
                <span className="muted small" style={{ width: 90 }}>
                  Email
                </span>
                <strong>{selected.email}</strong>
              </div>
              <div className="row">
                <Phone size={16} className="muted" />
                <span className="muted small" style={{ width: 90 }}>
                  Phone
                </span>
                <strong>{selected.phone || '—'}</strong>
              </div>
              <div className="row">
                <MapPin size={16} className="muted" />
                <span className="muted small" style={{ width: 90 }}>
                  Address
                </span>
                <strong style={{ flex: 1 }}>{selected.address || '—'}</strong>
              </div>
              <div className="row">
                <Calendar size={16} className="muted" />
                <span className="muted small" style={{ width: 90 }}>
                  Birth date
                </span>
                <strong>{formatDate(selected.birth_date)}</strong>
              </div>
              <div className="row">
                <Users size={16} className="muted" />
                <span className="muted small" style={{ width: 90 }}>
                  Gender
                </span>
                <strong>{selected.gender || '—'}</strong>
              </div>
            </div>

            <div className="form-section-title">Employment</div>
            <div className="card card-pad stack" style={{ gap: 12 }}>
              <div className="row">
                <Building2 size={16} className="muted" />
                <span className="muted small" style={{ width: 90 }}>
                  Department
                </span>
                <strong>{selected.department_name || 'Unassigned'}</strong>
              </div>
              <div className="row">
                <Shield size={16} className="muted" />
                <span className="muted small" style={{ width: 90 }}>
                  Position
                </span>
                <strong>{selected.position_title || 'Unassigned'}</strong>
              </div>
              <div className="row">
                <Calendar size={16} className="muted" />
                <span className="muted small" style={{ width: 90 }}>
                  Date hired
                </span>
                <strong>
                  {formatDate(selected.date_hired)} ({tenure(selected.date_hired)})
                </strong>
              </div>
            </div>

            <div className="form-section-title">System Account</div>
            <div className="card card-pad stack" style={{ gap: 10 }}>
              {selected.user_id ? (
                <>
                  <div className="row">
                    <span className="muted small" style={{ width: 105 }}>
                      Username
                    </span>
                    <strong>@{selected.username}</strong>
                  </div>
                  <div className="row">
                    <span className="muted small" style={{ width: 105 }}>
                      Role
                    </span>
                    <StatusBadge status={selected.role} size="sm" />
                  </div>
                  <div className="row">
                    <span className="muted small" style={{ width: 105 }}>
                      Login access
                    </span>
                    <StatusBadge
                      status={selected.account_active ? 'Active' : 'Inactive'}
                      size="sm"
                    />
                  </div>
                </>
              ) : (
                <p className="muted small">
                  No login account is linked to this employee yet. Click{' '}
                  <strong>Create login account</strong> below to let them sign in.
                </p>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Login Account Modal */}
      <Modal
        open={Boolean(accountTarget)}
        onClose={() => !savingAcc && setAccountTarget(null)}
        title="Create login account"
        description={accountTarget ? `For ${accountTarget.full_name}` : ''}
        icon={UserCheck}
        size="sm"
      >
        <form className="stack" style={{ gap: 14 }} onSubmit={handleCreateAccount} noValidate>
          <Field label="Username" required error={accErrors.username}>
            {(id, invalid) => (
              <input
                id={id}
                className={`input ${invalid ? 'invalid' : ''}`}
                value={accForm.username}
                onChange={(e) => setAccForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="e.g. jdelacruz"
              />
            )}
          </Field>
          <Field label="Password" required error={accErrors.password}>
            {(id, invalid) => (
              <>
                <PasswordInput
                  id={id}
                  value={accForm.password}
                  onChange={(e) => setAccForm((f) => ({ ...f, password: e.target.value }))}
                  invalid={invalid}
                  placeholder="8+ characters"
                  autoComplete="new-password"
                />
                <StrengthMeter password={accForm.password} />
              </>
            )}
          </Field>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setAccountTarget(null)} disabled={savingAcc}>
              Cancel
            </Button>
            <Button type="submit" icon={UserCheck} loading={savingAcc}>
              Create account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={Boolean(resetTarget)}
        onClose={() => !savingReset && setResetTarget(null)}
        title="Reset employee password"
        description={
          resetTarget ? `Set a new password for ${resetTarget.full_name} (@${resetTarget.username})` : ''
        }
        icon={KeyRound}
        size="sm"
      >
        <form className="stack" style={{ gap: 14 }} onSubmit={handleResetPassword} noValidate>
          <Field label="New password" required error={resetError}>
            {(id, invalid) => (
              <>
                <PasswordInput
                  id={id}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setResetError('');
                  }}
                  invalid={invalid}
                  placeholder="8+ characters"
                  autoComplete="new-password"
                />
                <StrengthMeter password={newPassword} />
              </>
            )}
          </Field>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setResetTarget(null)} disabled={savingReset}>
              Cancel
            </Button>
            <Button type="submit" icon={KeyRound} loading={savingReset}>
              Reset password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
        loading={busyDelete}
        title="Delete employee record?"
        confirmText="Delete employee"
        message={
          deleting && (
            <>
              <p>
                Are you sure you want to permanently delete{' '}
                <strong>{deleting.full_name}</strong> ({deleting.employee_code})?
              </p>
              <div className="alert alert-danger" style={{ marginTop: 6 }}>
                <span>
                  Warning: All linked attendance logs, leave requests, and their login account will
                  also be permanently deleted.
                </span>
              </div>
            </>
          )
        }
      />
    </div>
  );
}
