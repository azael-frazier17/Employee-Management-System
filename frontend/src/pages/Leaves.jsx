import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  CalendarPlus,
  Check,
  MessageSquare,
  RotateCcw,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import useAuth from '../hooks/useAuth';
import useDebounce from '../hooks/useDebounce';
import { LEAVE_TYPES, leaveTypeMeta, PAGE_SIZE } from '../utils/constants';
import {
  cleanParams,
  daysInclusive,
  formatDate,
  formatDateTime,
  todayStr,
} from '../utils/helpers';
import { fadeUp, stagger } from '../utils/motion';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import Tabs from '../components/ui/Tabs';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';
import Avatar from '../components/ui/Avatar';
import StatusBadge from '../components/ui/StatusBadge';
import Field from '../components/ui/Field';
import { SkeletonTable } from '../components/ui/Skeleton';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';

/* =========================================================================
   REQUEST LEAVE MODAL
   ========================================================================= */
const emptyRequest = () => ({
  leave_type: 'Vacation',
  start_date: todayStr(),
  end_date: todayStr(),
  reason: '',
});

function RequestLeaveModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(emptyRequest);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(emptyRequest());
      setErrors({});
    }
  }, [open]);

  const totalDays = daysInclusive(form.start_date, form.end_date);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.leave_type) errs.leave_type = 'Leave type is required.';
    if (!form.start_date) errs.start_date = 'Start date is required.';
    if (!form.end_date) errs.end_date = 'End date is required.';
    else if (form.end_date < form.start_date) {
      errs.end_date = 'End date cannot be earlier than start date.';
    }
    const reason = form.reason.trim();
    if (!reason) errs.reason = 'Reason is required.';
    else if (reason.length > 500) errs.reason = 'Reason must be at most 500 characters.';

    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const res = await api.post('/leaves', {
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        reason,
      });
      toast.success(res.data.message || 'Leave request submitted.');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title="Request leave"
      description="Submit a new leave request for HR approval."
      icon={CalendarPlus}
      size="md"
    >
      <form className="stack" style={{ gap: 14 }} onSubmit={handleSubmit} noValidate>
        <Field label="Leave type" required error={errors.leave_type}>
          {(id) => (
            <select
              id={id}
              className="select"
              value={form.leave_type}
              onChange={(e) => setForm((f) => ({ ...f, leave_type: e.target.value }))}
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.value}
                </option>
              ))}
            </select>
          )}
        </Field>

        <div className="form-grid">
          <Field label="Start date" required error={errors.start_date}>
            {(id, invalid) => (
              <input
                id={id}
                type="date"
                className={`input ${invalid ? 'invalid' : ''}`}
                value={form.start_date}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((f) => ({
                    ...f,
                    start_date: val,
                    end_date: f.end_date < val ? val : f.end_date,
                  }));
                }}
              />
            )}
          </Field>

          <Field label="End date" required error={errors.end_date}>
            {(id, invalid) => (
              <input
                id={id}
                type="date"
                className={`input ${invalid ? 'invalid' : ''}`}
                min={form.start_date}
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              />
            )}
          </Field>
        </div>

        <div
          className="card card-pad row"
          style={{
            background: 'var(--surface-2)',
            borderRadius: 'var(--r-sm)',
            justifyContent: 'space-between',
          }}
        >
          <span className="muted small">Computed duration</span>
          <strong className="num" style={{ color: 'var(--primary)' }}>
            {totalDays > 0 ? `${totalDays} ${totalDays === 1 ? 'day' : 'days'}` : 'Invalid range'}
          </strong>
        </div>

        <Field
          label="Reason"
          required
          error={errors.reason}
          hint={`${form.reason.length} / 500 characters`}
        >
          {(id, invalid) => (
            <textarea
              id={id}
              className={`textarea ${invalid ? 'invalid' : ''}`}
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              maxLength={500}
              placeholder="Briefly explain the reason for your leave…"
            />
          )}
        </Field>

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" icon={Send} loading={saving}>
            Submit request
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* =========================================================================
   EMPLOYEE LEAVES VIEW
   ========================================================================= */
const EMP_TABS = [
  { value: '', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
];

function EmployeeLeaves() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reqOpen, setReqOpen] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [busyCancel, setBusyCancel] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setReqOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = cleanParams({ status, page, limit: PAGE_SIZE });
      const res = await api.get('/leaves/my', { params });
      setLeaves(res.data.data || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const handleConfirmCancel = async () => {
    if (!cancelling) return;
    setBusyCancel(true);
    try {
      const res = await api.delete(`/leaves/${cancelling.id}`);
      toast.success(res.data.message || 'Leave request cancelled.');
      setCancelling(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setCancelling(null);
      load();
    } finally {
      setBusyCancel(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        icon={CalendarDays}
        title="My Leaves"
        subtitle="Submit leave requests and track approval status and HR remarks."
        actions={
          <Button icon={CalendarPlus} onClick={() => setReqOpen(true)}>
            Request leave
          </Button>
        }
      />

      <div>
        <Tabs tabs={EMP_TABS} value={status} onChange={setStatus} label="Filter by leave status" />
      </div>

      <div className="card">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : leaves.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No leave requests here"
            message={
              status
                ? `You have no ${status.toLowerCase()} leave requests.`
                : 'Submit your first leave request when you need time off.'
            }
            action={
              <Button size="sm" icon={CalendarPlus} onClick={() => setReqOpen(true)}>
                Request leave
              </Button>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Review / Remarks</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>
                <motion.tbody variants={stagger} initial="hidden" animate="show">
                  {leaves.map((lv) => {
                    const meta = leaveTypeMeta(lv.leave_type);
                    const TypeIcon = meta.icon;
                    return (
                      <motion.tr key={lv.id} variants={fadeUp}>
                        <td>
                          <div className="row" style={{ gap: 10 }}>
                            <span
                              className={`dot-icon tone-${meta.tone}`}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                display: 'grid',
                                placeItems: 'center',
                              }}
                            >
                              <TypeIcon size={16} />
                            </span>
                            <strong>{lv.leave_type}</strong>
                          </div>
                        </td>
                        <td className="num">
                          <div>{formatDate(lv.start_date)}</div>
                          <div className="muted small">to {formatDate(lv.end_date)}</div>
                        </td>
                        <td className="num">
                          <span className="chip">
                            {lv.total_days} {lv.total_days === 1 ? 'day' : 'days'}
                          </span>
                        </td>
                        <td className="wrap">{lv.reason}</td>
                        <td>
                          <StatusBadge status={lv.status} />
                        </td>
                        <td className="wrap">
                          {lv.reviewed_by_username ? (
                            <div>
                              <div className="small">
                                By <strong>@{lv.reviewed_by_username}</strong> ·{' '}
                                <span className="muted num">{formatDateTime(lv.reviewed_at)}</span>
                              </div>
                              {lv.admin_remarks && (
                                <div className="muted small" style={{ marginTop: 2 }}>
                                  “{lv.admin_remarks}”
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="muted small">Awaiting review</span>
                          )}
                        </td>
                        <td className="right">
                          {lv.status === 'Pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              onClick={() => setCancelling(lv)}
                            >
                              Cancel
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onChange={setPage} />
          </>
        )}
      </div>

      <RequestLeaveModal open={reqOpen} onClose={() => setReqOpen(false)} onSaved={load} />

      <ConfirmDialog
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={handleConfirmCancel}
        loading={busyCancel}
        title="Cancel leave request?"
        confirmText="Cancel request"
        message={
          cancelling && (
            <p>
              Cancel your <strong>{cancelling.leave_type}</strong> leave request from{' '}
              <strong>{formatDate(cancelling.start_date)}</strong> to{' '}
              <strong>{formatDate(cancelling.end_date)}</strong>?
            </p>
          )
        }
      />
    </div>
  );
}

/* =========================================================================
   ADMIN LEAVES VIEW
   ========================================================================= */
function AdminLeaves({ user }) {
  const [status, setStatus] = useState('Pending');
  const [counts, setCounts] = useState({ Pending: 0, Approved: 0, Rejected: 0, All: 0 });

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [departmentId, setDepartmentId] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const [departments, setDepartments] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reviewing, setReviewing] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const [reqOpen, setReqOpen] = useState(false);

  useEffect(() => {
    api
      .get('/departments')
      .then((res) => setDepartments(res.data.data || []))
      .catch(() => {});
  }, []);

  const loadCounts = useCallback(async () => {
    try {
      const [pRes, aRes, rRes, allRes] = await Promise.all([
        api.get('/leaves', { params: { status: 'Pending', limit: 1 } }),
        api.get('/leaves', { params: { status: 'Approved', limit: 1 } }),
        api.get('/leaves', { params: { status: 'Rejected', limit: 1 } }),
        api.get('/leaves', { params: { limit: 1 } }),
      ]);
      setCounts({
        Pending: pRes.data.pagination?.total ?? 0,
        Approved: aRes.data.pagination?.total ?? 0,
        Rejected: rRes.data.pagination?.total ?? 0,
        All: allRes.data.pagination?.total ?? 0,
      });
    } catch {
      // ignore
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = cleanParams({
        status,
        search: debouncedSearch,
        department_id: departmentId,
        leave_type: leaveType,
        from,
        to,
        page,
        limit: PAGE_SIZE,
      });
      const res = await api.get('/leaves', { params });
      setLeaves(res.data.data || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch, departmentId, leaveType, from, to, page]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch, departmentId, leaveType, from, to]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewing) return;
    setSavingReview(true);
    try {
      const res = await api.patch(`/leaves/${reviewing.leave.id}/status`, {
        status: reviewing.action,
        admin_remarks: remarks.trim() || null,
      });
      toast.success(res.data.message || `Leave ${reviewing.action.toLowerCase()}.`);
      setReviewing(null);
      setRemarks('');
      loadList();
      loadCounts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingReview(false);
    }
  };

  const tabs = [
    { value: 'Pending', label: 'Pending', count: counts.Pending },
    { value: 'Approved', label: 'Approved', count: counts.Approved },
    { value: 'Rejected', label: 'Rejected', count: counts.Rejected },
    { value: '', label: 'All', count: counts.All },
  ];

  const hasFilters = Boolean(search || departmentId || leaveType || from || to);

  return (
    <div className="stack">
      <PageHeader
        icon={CalendarDays}
        title="Leave Requests"
        subtitle="Review employee leave applications and record approval remarks."
        actions={
          user?.employeeId && (
            <Button variant="secondary" icon={CalendarPlus} onClick={() => setReqOpen(true)}>
              Request my leave
            </Button>
          )
        }
      />

      <div>
        <Tabs tabs={tabs} value={status} onChange={setStatus} label="Leave status tabs" />
      </div>

      <div className="card">
        <div className="toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search employee name or code…"
            label="Search leave requests"
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
            aria-label="Filter by leave type"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
          >
            <option value="">All types</option>
            {LEAVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.value}
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
          <input
            type="date"
            className="input"
            aria-label="To date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={() => {
                setSearch('');
                setDepartmentId('');
                setLeaveType('');
                setFrom('');
                setTo('');
              }}
            >
              Reset
            </Button>
          )}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={loadList} />
        ) : loading ? (
          <SkeletonTable rows={6} cols={7} />
        ) : leaves.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No leave requests match"
            message={
              status === 'Pending'
                ? 'There are no pending leave requests waiting for review.'
                : 'Try changing the status tab or clearing your filters.'
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
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th className="right">Review</th>
                  </tr>
                </thead>
                <motion.tbody variants={stagger} initial="hidden" animate="show">
                  {leaves.map((lv) => {
                    const meta = leaveTypeMeta(lv.leave_type);
                    const TypeIcon = meta.icon;
                    const isOwn = lv.employee_id === user?.employeeId;
                    return (
                      <motion.tr key={lv.id} variants={fadeUp}>
                        <td>
                          <div className="person">
                            <Avatar name={lv.employee_name} size={34} />
                            <div>
                              <div className="person-name">{lv.employee_name}</div>
                              <div className="person-sub num">{lv.employee_code}</div>
                            </div>
                          </div>
                        </td>
                        <td>{lv.department_name || <span className="muted">—</span>}</td>
                        <td>
                          <div className="row" style={{ gap: 8 }}>
                            <span
                              className={`dot-icon tone-${meta.tone}`}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 9,
                                display: 'grid',
                                placeItems: 'center',
                              }}
                            >
                              <TypeIcon size={15} />
                            </span>
                            <strong>{lv.leave_type}</strong>
                          </div>
                        </td>
                        <td className="num">
                          <div>{formatDate(lv.start_date)}</div>
                          <div className="muted small">to {formatDate(lv.end_date)}</div>
                        </td>
                        <td className="num">
                          <span className="chip">{lv.total_days}d</span>
                        </td>
                        <td className="wrap">
                          <div>{lv.reason}</div>
                          {lv.admin_remarks && (
                            <div className="muted small" style={{ marginTop: 3 }}>
                              Remarks: “{lv.admin_remarks}”
                            </div>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={lv.status} />
                        </td>
                        <td className="right">
                          {lv.status === 'Pending' ? (
                            <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                              <span
                                data-tooltip={
                                  isOwn
                                    ? 'You cannot approve or reject your own leave request'
                                    : undefined
                                }
                              >
                                <Button
                                  size="sm"
                                  variant="soft-success"
                                  icon={Check}
                                  disabled={isOwn}
                                  onClick={() => {
                                    setRemarks('');
                                    setReviewing({ leave: lv, action: 'Approved' });
                                  }}
                                >
                                  Approve
                                </Button>
                              </span>
                              <span
                                data-tooltip={
                                  isOwn
                                    ? 'You cannot approve or reject your own leave request'
                                    : undefined
                                }
                              >
                                <Button
                                  size="sm"
                                  variant="soft-danger"
                                  icon={X}
                                  disabled={isOwn}
                                  onClick={() => {
                                    setRemarks('');
                                    setReviewing({ leave: lv, action: 'Rejected' });
                                  }}
                                >
                                  Reject
                                </Button>
                              </span>
                            </div>
                          ) : (
                            <div className="muted small">
                              {lv.reviewed_by_username ? (
                                <>
                                  @{lv.reviewed_by_username}
                                  <div className="num">{formatDateTime(lv.reviewed_at)}</div>
                                </>
                              ) : (
                                '—'
                              )}
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onChange={setPage} />
          </>
        )}
      </div>

      <Modal
        open={Boolean(reviewing)}
        onClose={() => !savingReview && setReviewing(null)}
        title={
          reviewing ? `${reviewing.action === 'Approved' ? 'Approve' : 'Reject'} leave request` : ''
        }
        description={
          reviewing
            ? `${reviewing.leave.employee_name} · ${reviewing.leave.leave_type} (${reviewing.leave.total_days}d)`
            : ''
        }
        icon={MessageSquare}
        size="sm"
      >
        {reviewing && (
          <form className="stack" style={{ gap: 14 }} onSubmit={handleReviewSubmit}>
            <div
              className="card card-pad stack"
              style={{ gap: 4, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}
            >
              <span className="small muted">
                {formatDate(reviewing.leave.start_date)} – {formatDate(reviewing.leave.end_date)}
              </span>
              <p className="small">“{reviewing.leave.reason}”</p>
            </div>

            <Field
              label="Admin remarks (optional)"
              hint={`${remarks.length} / 255 characters`}
            >
              {(id) => (
                <textarea
                  id={id}
                  className="textarea"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  maxLength={255}
                  placeholder="Optional note for the employee…"
                />
              )}
            </Field>

            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                onClick={() => setReviewing(null)}
                disabled={savingReview}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={reviewing.action === 'Approved' ? 'success' : 'danger'}
                icon={reviewing.action === 'Approved' ? Check : X}
                loading={savingReview}
              >
                {reviewing.action === 'Approved' ? 'Confirm approval' : 'Confirm rejection'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <RequestLeaveModal
        open={reqOpen}
        onClose={() => setReqOpen(false)}
        onSaved={() => {
          loadList();
          loadCounts();
        }}
      />
    </div>
  );
}

export default function Leaves() {
  const { user, isAdmin } = useAuth();
  return isAdmin ? <AdminLeaves user={user} /> : <EmployeeLeaves />;
}
