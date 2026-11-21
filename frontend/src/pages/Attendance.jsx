import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CalendarClock,
  Clock,
  Palmtree,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  UserCheck,
  UserMinus,
  UserX,
} from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import useAuth from '../hooks/useAuth';
import useDebounce from '../hooks/useDebounce';
import { ATTENDANCE_STATUSES, PAGE_SIZE } from '../utils/constants';
import {
  canClockIn,
  cleanParams,
  formatDate,
  formatHours,
  formatTime,
  longToday,
  monthRange,
  presetRange,
  todayStr,
} from '../utils/helpers';
import { fadeUp, stagger } from '../utils/motion';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';
import Avatar from '../components/ui/Avatar';
import StatusBadge from '../components/ui/StatusBadge';
import Field from '../components/ui/Field';
import { SkeletonTable } from '../components/ui/Skeleton';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import TimeCard from '../components/TimeCard';

/* =========================================================================
   EMPLOYEE ATTENDANCE VIEW
   ========================================================================= */
function EmployeeAttendance({ user }) {
  const defaultMonth = monthRange();
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState(defaultMonth.from);
  const [to, setTo] = useState(defaultMonth.to);
  const [page, setPage] = useState(1);

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [monthCounts, setMonthCounts] = useState({ Present: 0, Late: 0, Absent: 0 });

  const loadMonthSummary = useCallback(async () => {
    try {
      const m = monthRange();
      const res = await api.get('/attendance/my', {
        params: { from: m.from, to: m.to, limit: 100 },
      });
      const rows = res.data.data || [];
      const counts = rows.reduce(
        (acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        },
        { Present: 0, Late: 0, Absent: 0 }
      );
      setMonthCounts(counts);
    } catch {
      // summary is secondary
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = cleanParams({ status, from, to, page, limit: PAGE_SIZE });
      const res = await api.get('/attendance/my', { params });
      setRecords(res.data.data || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, from, to, page]);

  useEffect(() => {
    loadMonthSummary();
  }, [loadMonthSummary]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    setPage(1);
  }, [status, from, to]);

  const applyPreset = (p) => {
    const r = presetRange(p);
    setFrom(r.from);
    setTo(r.to);
  };

  return (
    <div className="stack">
      <PageHeader
        icon={CalendarClock}
        title="My Attendance"
        subtitle="Clock in and out for today and review your daily attendance history."
      />

      {canClockIn(user?.role) && (
        <TimeCard
          onChange={() => {
            loadHistory();
            loadMonthSummary();
          }}
        />
      )}

      <div className="row-wrap">
        <div className="summary-chip">
          <span className="dot-icon tone-success">
            <UserCheck size={18} />
          </span>
          <div>
            <strong>{monthCounts.Present}</strong>
            <span>Present this month</span>
          </div>
        </div>
        <div className="summary-chip">
          <span className="dot-icon tone-warning">
            <Clock size={18} />
          </span>
          <div>
            <strong>{monthCounts.Late}</strong>
            <span>Late this month</span>
          </div>
        </div>
        <div className="summary-chip">
          <span className="dot-icon tone-danger">
            <UserX size={18} />
          </span>
          <div>
            <strong>{monthCounts.Absent}</strong>
            <span>Absent this month</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <select
            className="select"
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {ATTENDANCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="input"
            aria-label="From date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span className="muted small">to</span>
          <input
            type="date"
            className="input"
            aria-label="To date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />

          <div className="row-wrap" style={{ gap: 6 }}>
            <button type="button" className="chip" onClick={() => applyPreset('today')}>
              Today
            </button>
            <button type="button" className="chip" onClick={() => applyPreset('week')}>
              This week
            </button>
            <button type="button" className="chip" onClick={() => applyPreset('month')}>
              This month
            </button>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={loadHistory} />
        ) : loading ? (
          <SkeletonTable rows={6} cols={5} />
        ) : records.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No attendance records found"
            message="Try adjusting the date range or status filter."
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time in</th>
                    <th>Time out</th>
                    <th>Hours worked</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <motion.tbody variants={stagger} initial="hidden" animate="show">
                  {records.map((r) => (
                    <motion.tr key={r.id} variants={fadeUp}>
                      <td className="num">
                        <strong>{formatDate(r.attendance_date)}</strong>
                      </td>
                      <td className="num">{formatTime(r.time_in)}</td>
                      <td className="num">{formatTime(r.time_out)}</td>
                      <td className="num">{formatHours(r.hours_worked)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="wrap muted">{r.remarks || '—'}</td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   ADMIN ATTENDANCE VIEW
   ========================================================================= */
const emptyManual = () => ({
  employee_id: '',
  attendance_date: todayStr(),
  time_in: '08:55',
  time_out: '17:30',
  status: '',
  remarks: '',
});

function AdminAttendance({ user }) {
  const defaultMonth = monthRange();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState(defaultMonth.from);
  const [to, setTo] = useState(defaultMonth.to);
  const [preset, setPreset] = useState('month');
  const [page, setPage] = useState(1);

  const [departments, setDepartments] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summaryTotals, setSummaryTotals] = useState({
    present_days: 0,
    late_days: 0,
    absent_days: 0,
  });
  const [todayOverview, setTodayOverview] = useState({
    present: 0,
    late: 0,
    absent: 0,
    onLeave: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyManual);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [absentOpen, setAbsentOpen] = useState(false);
  const [absentDate, setAbsentDate] = useState(todayStr());
  const [markingAbsent, setMarkingAbsent] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [busyDelete, setBusyDelete] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/departments'),
      api.get('/employees', { params: { status: 'Active', limit: 100, sort: 'name' } }),
    ])
      .then(([dRes, eRes]) => {
        setDepartments(dRes.data.data || []);
        setEmployeeOptions(eRes.data.data || []);
      })
      .catch(() => {});
  }, []);

  const loadTodayOverview = useCallback(async () => {
    try {
      const today = todayStr();
      const [attRes, leaveRes] = await Promise.all([
        api.get('/attendance/reports/summary', { params: { from: today, to: today } }),
        api.get('/leaves/reports/summary', { params: { from: today, to: today } }),
      ]);
      const totals = attRes.data.data?.totals || {};
      const onLeaveToday = leaveRes.data.data?.on_leave_today || [];
      setTodayOverview({
        present: Number(totals.present_days || 0),
        late: Number(totals.late_days || 0),
        absent: Number(totals.absent_days || 0),
        onLeave: onLeaveToday.length,
      });
    } catch {
      // overview strip is secondary
    }
  }, []);

  useEffect(() => {
    loadTodayOverview();
  }, [loadTodayOverview]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const listParams = cleanParams({
        search: debouncedSearch,
        department_id: departmentId,
        status,
        from,
        to,
        page,
        limit: PAGE_SIZE,
      });
      const summaryParams = cleanParams({
        department_id: departmentId,
        from,
        to,
      });
      const [listRes, sumRes] = await Promise.all([
        api.get('/attendance', { params: listParams }),
        api.get('/attendance/reports/summary', { params: summaryParams }),
      ]);
      setRecords(listRes.data.data || []);
      setPagination(listRes.data.pagination || null);
      setSummaryTotals(
        sumRes.data.data?.totals || { present_days: 0, late_days: 0, absent_days: 0 }
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, departmentId, status, from, to, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, departmentId, status, from, to]);

  const applyPreset = (p) => {
    const r = presetRange(p);
    setPreset(p);
    setFrom(r.from);
    setTo(r.to);
  };

  const openAddModal = () => {
    setEditing(null);
    setForm({
      ...emptyManual(),
      employee_id: employeeOptions[0]?.id ? String(employeeOptions[0].id) : '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (rec) => {
    setEditing(rec);
    setForm({
      employee_id: String(rec.employee_id),
      attendance_date: rec.attendance_date,
      time_in: rec.time_in ? rec.time_in.slice(0, 5) : '',
      time_out: rec.time_out ? rec.time_out.slice(0, 5) : '',
      status: rec.status || '',
      remarks: rec.remarks || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!editing && !form.employee_id) errs.employee_id = 'Select an employee.';
    if (!editing && !form.attendance_date) errs.attendance_date = 'Date is required.';
    if (form.time_in && form.time_out && form.time_out < form.time_in) {
      errs.time_out = 'Time out cannot be earlier than time in.';
    }
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      if (editing) {
        const res = await api.put(`/attendance/${editing.id}`, {
          time_in: form.time_in || null,
          time_out: form.time_out || null,
          status: form.status || undefined,
          remarks: form.remarks.trim() || null,
        });
        toast.success(res.data.message || 'Attendance updated.');
      } else {
        const res = await api.post('/attendance', {
          employee_id: Number(form.employee_id),
          attendance_date: form.attendance_date,
          time_in: form.time_in || null,
          time_out: form.time_out || null,
          status: form.status || undefined,
          remarks: form.remarks.trim() || null,
        });
        toast.success(res.data.message || 'Attendance saved.');
      }
      setModalOpen(false);
      loadData();
      loadTodayOverview();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAbsentees = async () => {
    setMarkingAbsent(true);
    try {
      const payload = cleanParams({
        date: absentDate,
        department_id: departmentId ? Number(departmentId) : undefined,
      });
      const res = await api.post('/attendance/mark-absent', payload);
      toast.success(
        res.data.message || `${res.data.data?.marked ?? 0} employee(s) marked Absent.`
      );
      setAbsentOpen(false);
      loadData();
      loadTodayOverview();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMarkingAbsent(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setBusyDelete(true);
    try {
      const res = await api.delete(`/attendance/${deleting.id}`);
      toast.success(res.data.message || 'Attendance record deleted.');
      setDeleting(null);
      loadData();
      loadTodayOverview();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyDelete(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        icon={CalendarClock}
        title="Attendance"
        subtitle="Track daily check-ins, add manual records, and mark daily absentees."
        actions={
          <>
            <Button variant="secondary" icon={UserMinus} onClick={() => setAbsentOpen(true)}>
              Mark absentees
            </Button>
            <Button icon={Plus} onClick={openAddModal}>
              Add record
            </Button>
          </>
        }
      />

      {canClockIn(user?.role) && user?.employeeId ? (
        <TimeCard compact onChange={loadData} />
      ) : (
        <div className="card">
          <div className="card-head">
            <div className="card-title">
              <CalendarClock size={17} /> Today&apos;s Overview
            </div>
            <span className="muted small">{longToday()}</span>
          </div>
          <div className="card-body">
            <div className="row-wrap">
              <div className="summary-chip">
                <span className="dot-icon tone-success">
                  <UserCheck size={18} />
                </span>
                <div>
                  <strong>{todayOverview.present}</strong>
                  <span>Present today</span>
                </div>
              </div>
              <div className="summary-chip">
                <span className="dot-icon tone-warning">
                  <Clock size={18} />
                </span>
                <div>
                  <strong>{todayOverview.late}</strong>
                  <span>Late today</span>
                </div>
              </div>
              <div className="summary-chip">
                <span className="dot-icon tone-danger">
                  <UserX size={18} />
                </span>
                <div>
                  <strong>{todayOverview.absent}</strong>
                  <span>Absent today</span>
                </div>
              </div>
              <div className="summary-chip">
                <span className="dot-icon tone-info">
                  <Palmtree size={18} />
                </span>
                <div>
                  <strong>{todayOverview.onLeave}</strong>
                  <span>On leave today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row-wrap">
        <div className="summary-chip">
          <span className="dot-icon tone-success">
            <UserCheck size={18} />
          </span>
          <div>
            <strong>{summaryTotals.present_days || 0}</strong>
            <span>Present (selected range)</span>
          </div>
        </div>
        <div className="summary-chip">
          <span className="dot-icon tone-warning">
            <Clock size={18} />
          </span>
          <div>
            <strong>{summaryTotals.late_days || 0}</strong>
            <span>Late (selected range)</span>
          </div>
        </div>
        <div className="summary-chip">
          <span className="dot-icon tone-danger">
            <UserX size={18} />
          </span>
          <div>
            <strong>{summaryTotals.absent_days || 0}</strong>
            <span>Absent (selected range)</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search employee name or code…"
            label="Search attendance"
          />

          <select
            className="select"
            aria-label="Filter by department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
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
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {ATTENDANCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="input"
            aria-label="From date"
            value={from}
            onChange={(e) => {
              setPreset('');
              setFrom(e.target.value);
            }}
          />
          <input
            type="date"
            className="input"
            aria-label="To date"
            value={to}
            onChange={(e) => {
              setPreset('');
              setTo(e.target.value);
            }}
          />

          <div className="row-wrap" style={{ gap: 6 }}>
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This week' },
              { id: 'month', label: 'This month' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                className={`chip ${preset === p.id ? 'active' : ''}`}
                onClick={() => applyPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {(search || departmentId || status) && (
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={() => {
                setSearch('');
                setDepartmentId('');
                setStatus('');
              }}
            >
              Reset
            </Button>
          )}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : loading ? (
          <SkeletonTable rows={6} cols={7} />
        ) : records.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No attendance logs for this filter"
            message="Adjust the date range or add a manual attendance record."
            action={
              <Button size="sm" icon={Plus} onClick={openAddModal}>
                Add record
              </Button>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Time in</th>
                    <th>Time out</th>
                    <th>Hours worked</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>
                <motion.tbody variants={stagger} initial="hidden" animate="show">
                  {records.map((r) => (
                    <motion.tr key={r.id} variants={fadeUp}>
                      <td>
                        <div className="person">
                          <Avatar name={r.employee_name} size={34} />
                          <div>
                            <div className="person-name">{r.employee_name}</div>
                            <div className="person-sub num">{r.employee_code}</div>
                          </div>
                        </div>
                      </td>
                      <td>{r.department_name || <span className="muted">—</span>}</td>
                      <td className="num">{formatDate(r.attendance_date)}</td>
                      <td className="num">{formatTime(r.time_in)}</td>
                      <td className="num">{formatTime(r.time_out)}</td>
                      <td className="num">{formatHours(r.hours_worked)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="wrap muted">{r.remarks || '—'}</td>
                      <td className="right">
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => openEditModal(r)}
                            aria-label={`Edit attendance for ${r.employee_name}`}
                            title="Edit record"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => setDeleting(r)}
                            aria-label={`Delete attendance for ${r.employee_name}`}
                            title="Delete record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onChange={setPage} />
          </>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? `Edit attendance · ${editing.employee_name}` : 'Add attendance record'}
        description={
          editing
            ? formatDate(editing.attendance_date)
            : 'Manual entry or overwrite for an employee and date.'
        }
        icon={editing ? Pencil : Plus}
        size="md"
      >
        <form className="stack" style={{ gap: 14 }} onSubmit={handleSaveRecord} noValidate>
          {!editing && (
            <div className="form-grid">
              <Field label="Employee" required error={formErrors.employee_id}>
                {(id, invalid) => (
                  <select
                    id={id}
                    className={`select ${invalid ? 'invalid' : ''}`}
                    value={form.employee_id}
                    onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
                  >
                    <option value="">Select employee…</option>
                    {employeeOptions.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.employee_code})
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <Field label="Date" required error={formErrors.attendance_date}>
                {(id, invalid) => (
                  <input
                    id={id}
                    type="date"
                    className={`input ${invalid ? 'invalid' : ''}`}
                    value={form.attendance_date}
                    onChange={(e) => setForm((f) => ({ ...f, attendance_date: e.target.value }))}
                  />
                )}
              </Field>
            </div>
          )}

          <div className="form-grid">
            <Field label="Time in">
              {(id) => (
                <input
                  id={id}
                  type="time"
                  className="input"
                  value={form.time_in}
                  onChange={(e) => setForm((f) => ({ ...f, time_in: e.target.value }))}
                />
              )}
            </Field>

            <Field label="Time out" error={formErrors.time_out}>
              {(id, invalid) => (
                <input
                  id={id}
                  type="time"
                  className={`input ${invalid ? 'invalid' : ''}`}
                  value={form.time_out}
                  onChange={(e) => setForm((f) => ({ ...f, time_out: e.target.value }))}
                />
              )}
            </Field>
          </div>

          <Field
            label="Status"
            hint="Leave on Auto to let the server compute Present / Late from time-in."
          >
            {(id) => (
              <select
                id={id}
                className="select"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">Auto (computed by server)</option>
                {ATTENDANCE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Remarks">
            {(id) => (
              <input
                id={id}
                className="input"
                value={form.remarks}
                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                maxLength={255}
                placeholder="Optional note…"
              />
            )}
          </Field>

          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" icon={Save} loading={saving}>
              {editing ? 'Update record' : 'Save record'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={absentOpen}
        onClose={() => setAbsentOpen(false)}
        onConfirm={handleMarkAbsentees}
        loading={markingAbsent}
        tone="primary"
        icon={UserMinus}
        title="Mark absentees"
        confirmText="Mark Absent"
        message={
          <div className="stack" style={{ gap: 12 }}>
            <p>
              This marks every active employee who has no attendance record on the selected date
              (and is not on approved leave) as <strong>Absent</strong>.
            </p>
            <Field label="Attendance date">
              {(id) => (
                <input
                  id={id}
                  type="date"
                  className="input"
                  max={todayStr()}
                  value={absentDate}
                  onChange={(e) => setAbsentDate(e.target.value)}
                />
              )}
            </Field>
          </div>
        }
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
        loading={busyDelete}
        title="Delete attendance record?"
        confirmText="Delete record"
        message={
          deleting && (
            <p>
              Delete the attendance log for <strong>{deleting.employee_name}</strong> on{' '}
              <strong>{formatDate(deleting.attendance_date)}</strong>?
            </p>
          )
        }
      />
    </div>
  );
}

export default function Attendance() {
  const { user, isAdmin } = useAuth();
  return isAdmin ? <AdminAttendance user={user} /> : <EmployeeAttendance user={user} />;
}
