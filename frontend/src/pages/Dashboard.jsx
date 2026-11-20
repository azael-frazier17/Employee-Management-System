import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock,
  Palmtree,
  Sparkles,
  UserCheck,
  UserCircle,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import { CHART_PALETTE, COLORS, leaveTypeMeta } from '../utils/constants';
import {
  firstName,
  formatDate,
  formatShortDate,
  greeting,
  longToday,
  monthRange,
} from '../utils/helpers';
import { fadeUp, stagger } from '../utils/motion';
import StatCard from '../components/ui/StatCard';
import Avatar from '../components/ui/Avatar';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import { Skeleton, SkeletonList } from '../components/ui/Skeleton';
import DonutRing, { DonutLegend } from '../components/ui/DonutRing';
import { chartTheme } from '../components/ui/chartTheme';
import TimeCard from '../components/TimeCard';
import './Dashboard.css';

/* =========================================================================
   ADMIN DASHBOARD
   ========================================================================= */
function AdminDashboard({ user }) {
  const { isDark } = useTheme();
  const cTheme = chartTheme(isDark);

  const [empReport, setEmpReport] = useState(null);
  const [attReport, setAttReport] = useState(null);
  const [leaveReport, setLeaveReport] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, attRes, leaveRes, pendingRes] = await Promise.all([
        api.get('/employees/reports/summary'),
        api.get('/attendance/reports/summary'),
        api.get('/leaves/reports/summary'),
        api.get('/leaves', { params: { status: 'Pending', limit: 5 } }),
      ]);
      setEmpReport(empRes.data.data);
      setAttReport(attRes.data.data);
      setLeaveReport(leaveRes.data.data);
      setPendingLeaves(pendingRes.data.data || []);
      setPendingTotal(pendingRes.data.pagination?.total ?? 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Quick Approve / Reject directly from the dashboard
  const handleQuickReview = async (leave, status) => {
    setActingId(leave.id);
    try {
      const res = await api.patch(`/leaves/${leave.id}/status`, { status });
      toast.success(res.data.message || `Leave ${status.toLowerCase()}.`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActingId(null);
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  const totals = empReport?.totals || {};
  const byDept = empReport?.by_department || [];
  const recentHires = empReport?.recent_hires || [];
  const onLeaveToday = leaveReport?.on_leave_today || [];

  // Attendance donut segments for this month
  const attTotals = attReport?.totals || { present_days: 0, late_days: 0, absent_days: 0, total_records: 0 };
  const attSegments = [
    { label: 'Present', value: attTotals.present_days || 0, color: COLORS.success },
    { label: 'Late', value: attTotals.late_days || 0, color: COLORS.warning },
    { label: 'Absent', value: attTotals.absent_days || 0, color: COLORS.danger },
  ];
  const attendedDays = (attTotals.present_days || 0) + (attTotals.late_days || 0);
  const attRate = attTotals.total_records
    ? `${Math.round((attendedDays / attTotals.total_records) * 100)}%`
    : '0%';

  // Leave requests by status
  const byStatus = leaveReport?.by_status || { Pending: 0, Approved: 0, Rejected: 0 };
  const leaveStatusData = [
    { name: 'Pending', count: byStatus.Pending || 0, color: COLORS.warning },
    { name: 'Approved', count: byStatus.Approved || 0, color: COLORS.success },
    { name: 'Rejected', count: byStatus.Rejected || 0, color: COLORS.danger },
  ];

  return (
    <motion.div className="stack" variants={stagger} initial="hidden" animate="show">
      {/* Greeting Banner */}
      <motion.div className="dash-hero card" variants={fadeUp}>
        <div className="dash-hero-orb" aria-hidden="true" />
        <div className="dash-hero-left">
          <Avatar name={user?.fullName || ''} src={user?.avatar} size={52} ring className="dash-hero-avatar" />
          <div className="dash-hero-text">
            <span className="dash-eyebrow">
              <Sparkles size={13} /> HR Command Center · {longToday()}
            </span>
            <h1>
              {greeting()}, {firstName(user?.fullName)}!
            </h1>
            <p className="muted">
              Here is a live overview of your workforce, attendance, and pending approvals today.
            </p>
          </div>
        </div>
        <div className="dash-hero-actions">
          <Link to="/employees">
            <Button variant="primary" icon={UserPlus}>
              Manage Employees
            </Button>
          </Link>
          <Link to="/reports">
            <Button variant="secondary" iconRight={ArrowRight}>
              View Reports
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* 4 Stat cards */}
      <div className="grid grid-4">
        <StatCard
          icon={Users}
          label="Total employees"
          value={totals.total_employees || 0}
          hint={`${totals.inactive_employees || 0} inactive`}
          tone="primary"
          loading={loading}
        />
        <StatCard
          icon={UserCheck}
          label="Active employees"
          value={totals.active_employees || 0}
          hint={`${byDept.length} departments`}
          tone="success"
          loading={loading}
        />
        <StatCard
          icon={Clock}
          label="Pending leave requests"
          value={pendingTotal}
          hint="Awaiting HR review"
          tone="warning"
          loading={loading}
        />
        <StatCard
          icon={Palmtree}
          label="On leave today"
          value={onLeaveToday.length}
          hint="Approved leave for today"
          tone="accent"
          loading={loading}
        />
      </div>

      {/* 3 Charts */}
      <div className="grid grid-3">
        {/* Employees by department */}
        <motion.div variants={fadeUp}>
          <div className="card card-hover">
            <div className="card-head">
              <div className="card-title">
                <Building2 size={17} /> Employees by department
              </div>
              <Link to="/departments" className="card-link">
                Details <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="card-body">
              {loading ? (
                <Skeleton height={220} radius={12} />
              ) : byDept.length === 0 ? (
                <EmptyState compact title="No departments yet" />
              ) : (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={byDept} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={cTheme.grid} vertical={false} />
                      <XAxis
                        dataKey="department_name"
                        tick={{ fill: cTheme.axis, fontSize: 11.5 }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        tickFormatter={(v) => (v.length > 10 ? `${v.slice(0, 10)}…` : v)}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: cTheme.axis, fontSize: 11.5 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip cursor={{ fill: cTheme.cursor }} {...cTheme.tooltip} />
                      <Bar dataKey="total_employees" name="Employees" radius={[8, 8, 0, 0]} maxBarSize={36}>
                        {byDept.map((entry, idx) => (
                          <Cell key={entry.department_id} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* This month's attendance donut */}
        <motion.div variants={fadeUp}>
          <div className="card card-hover">
            <div className="card-head">
              <div className="card-title">
                <CalendarClock size={17} /> This month&apos;s attendance
              </div>
              <Link to="/attendance" className="card-link">
                All logs <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="card-body">
              {loading ? (
                <Skeleton height={220} radius={12} />
              ) : (
                <div className="dash-donut-wrap">
                  <DonutRing
                    segments={attSegments}
                    centerValue={attRate}
                    centerLabel="Attendance rate"
                  />
                  <DonutLegend segments={attSegments} />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Leave requests by status */}
        <motion.div variants={fadeUp}>
          <div className="card card-hover">
            <div className="card-head">
              <div className="card-title">
                <CalendarDays size={17} /> Leave requests (this month)
              </div>
              <span className="chip num" style={{ height: 26, fontSize: 12 }}>
                {leaveReport?.total_requests || 0} total
              </span>
            </div>
            <div className="card-body">
              {loading ? (
                <Skeleton height={220} radius={12} />
              ) : (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={leaveStatusData}
                      layout="vertical"
                      margin={{ top: 10, right: 16, left: 6, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={cTheme.grid} horizontal={false} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fill: cTheme.axis, fontSize: 11.5 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={72}
                        tick={{ fill: cTheme.axis, fontSize: 12.5, fontWeight: 600 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip cursor={{ fill: cTheme.cursor }} {...cTheme.tooltip} />
                      <Bar dataKey="count" name="Requests" radius={[0, 8, 8, 0]} barSize={24}>
                        {leaveStatusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3 Lists: Pending leave requests, On leave today, Recent hires */}
      <div className="grid grid-3">
        {/* Pending leave requests with quick Approve / Reject */}
        <motion.div variants={fadeUp}>
          <div className="card card-hover">
            <div className="card-head">
              <div className="card-title">
                <Clock size={17} /> Pending leave requests
              </div>
              <Link to="/leaves" className="card-link">
                View all ({pendingTotal}) <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="card-body">
              {loading ? (
                <SkeletonList rows={4} />
              ) : pendingLeaves.length === 0 ? (
                <EmptyState
                  compact
                  icon={CalendarCheck}
                  title="All caught up!"
                  message="No pending leave requests right now."
                />
              ) : (
                <div className="list">
                  {pendingLeaves.map((lv) => {
                    const isOwn = lv.employee_id === user?.employeeId;
                    const busy = actingId === lv.id;
                    return (
                      <div className="list-item" key={lv.id}>
                        <Avatar name={lv.employee_name} size={36} />
                        <div className="grow">
                          <div className="person-name">{lv.employee_name}</div>
                          <div className="person-sub">
                            {lv.leave_type} · {formatShortDate(lv.start_date)}
                            {lv.end_date !== lv.start_date ? ` – ${formatShortDate(lv.end_date)}` : ''} (
                            {lv.total_days}d)
                          </div>
                        </div>
                        <div className="row" style={{ gap: 6 }}>
                          <button
                            type="button"
                            className="icon-btn tone-success"
                            disabled={isOwn || busy}
                            data-tooltip={
                              isOwn ? 'You cannot approve your own request' : 'Approve request'
                            }
                            aria-label={`Approve ${lv.employee_name}'s leave`}
                            onClick={() => handleQuickReview(lv, 'Approved')}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn tone-danger"
                            disabled={isOwn || busy}
                            data-tooltip={
                              isOwn ? 'You cannot reject your own request' : 'Reject request'
                            }
                            aria-label={`Reject ${lv.employee_name}'s leave`}
                            onClick={() => handleQuickReview(lv, 'Rejected')}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Who is on leave today */}
        <motion.div variants={fadeUp}>
          <div className="card card-hover">
            <div className="card-head">
              <div className="card-title">
                <Palmtree size={17} /> On leave today
              </div>
              <span className="chip num" style={{ height: 26, fontSize: 12 }}>
                {onLeaveToday.length} out
              </span>
            </div>
            <div className="card-body">
              {loading ? (
                <SkeletonList rows={4} />
              ) : onLeaveToday.length === 0 ? (
                <EmptyState
                  compact
                  icon={UserCheck}
                  title="Full attendance window"
                  message="Nobody is on approved leave today."
                />
              ) : (
                <div className="list">
                  {onLeaveToday.map((item) => (
                    <div className="list-item" key={`${item.employee_id}-${item.start_date}`}>
                      <Avatar name={item.employee_name} size={36} />
                      <div className="grow">
                        <div className="person-name">{item.employee_name}</div>
                        <div className="person-sub">
                          {item.department_name || 'Unassigned'} · Until {formatShortDate(item.end_date)}
                        </div>
                      </div>
                      <StatusBadge status="Approved" label={item.leave_type} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Recent hires */}
        <motion.div variants={fadeUp}>
          <div className="card card-hover">
            <div className="card-head">
              <div className="card-title">
                <UserPlus size={17} /> Recent hires
              </div>
              <Link to="/employees" className="card-link">
                Directory <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="card-body">
              {loading ? (
                <SkeletonList rows={4} />
              ) : recentHires.length === 0 ? (
                <EmptyState compact title="No employees yet" />
              ) : (
                <div className="list">
                  {recentHires.map((emp) => (
                    <div className="list-item" key={emp.id}>
                      <Avatar name={emp.full_name} size={36} />
                      <div className="grow">
                        <div className="person-name">{emp.full_name}</div>
                        <div className="person-sub">
                          {emp.position_title || 'No position'} · {emp.department_name || 'No dept'}
                        </div>
                      </div>
                      <span className="muted small num">{formatShortDate(emp.date_hired)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* =========================================================================
   EMPLOYEE DASHBOARD
   ========================================================================= */
function EmployeeDashboard({ user }) {
  const [attCounts, setAttCounts] = useState({ Present: 0, Late: 0, Absent: 0, total: 0 });
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = monthRange();
      const [attRes, leavesRes] = await Promise.all([
        api.get('/attendance/my', { params: { from, to, limit: 100 } }),
        api.get('/leaves/my', { params: { limit: 5 } }),
      ]);
      const rows = attRes.data.data || [];
      const counts = rows.reduce(
        (acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          acc.total += 1;
          return acc;
        },
        { Present: 0, Late: 0, Absent: 0, total: 0 }
      );
      setAttCounts(counts);
      setLeaves(leavesRes.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const segments = [
    { label: 'Present', value: attCounts.Present, color: COLORS.success },
    { label: 'Late', value: attCounts.Late, color: COLORS.warning },
    { label: 'Absent', value: attCounts.Absent, color: COLORS.danger },
  ];
  const attended = attCounts.Present + attCounts.Late;
  const rate = attCounts.total ? `${Math.round((attended / attCounts.total) * 100)}%` : '0%';

  return (
    <motion.div className="stack" variants={stagger} initial="hidden" animate="show">
      {/* Greeting Banner + Quick actions */}
      <motion.div className="dash-hero card" variants={fadeUp}>
        <div className="dash-hero-orb" aria-hidden="true" />
        <div className="dash-hero-left">
          <Avatar name={user?.fullName || ''} src={user?.avatar} size={54} ring className="dash-hero-avatar" />
          <div className="dash-hero-text">
            <span className="dash-eyebrow">
              <Sparkles size={13} /> Employee Workspace · {longToday()}
            </span>
            <h1>
              {greeting()}, {firstName(user?.fullName)}!
            </h1>
            <p className="muted">
              Clock in for today, check your monthly attendance, or submit a leave request.
            </p>
          </div>
        </div>
        <div className="dash-hero-actions">
          <Link to="/leaves?new=1">
            <Button variant="primary" icon={CalendarPlus}>
              Request leave
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="secondary" icon={UserCircle}>
              View profile
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Time In / Out + This month's attendance counts (equal-height Bento row) */}
      <div className="grid grid-2">
        <motion.div variants={fadeUp}>
          <TimeCard onChange={load} />
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="card card-hover dash-att-card">
            <div className="card-head">
              <div className="card-title">
                <CalendarClock size={17} /> This month&apos;s attendance
              </div>
              <Link to="/attendance" className="card-link">
                Full history <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="card-body dash-att-body">
              {error ? (
                <ErrorState message={error} onRetry={load} compact />
              ) : loading ? (
                <Skeleton height={180} radius={12} />
              ) : (
                <>
                  <div className="dash-donut-wrap">
                    <DonutRing segments={segments} centerValue={rate} centerLabel="This month" />
                    <DonutLegend segments={segments} />
                  </div>
                  <div className="row-wrap">
                    <div className="summary-chip">
                      <span className="dot-icon tone-success">
                        <UserCheck size={18} />
                      </span>
                      <div>
                        <strong>{attCounts.Present}</strong>
                        <span>Present days</span>
                      </div>
                    </div>
                    <div className="summary-chip">
                      <span className="dot-icon tone-warning">
                        <Clock size={18} />
                      </span>
                      <div>
                        <strong>{attCounts.Late}</strong>
                        <span>Late days</span>
                      </div>
                    </div>
                    <div className="summary-chip">
                      <span className="dot-icon tone-danger">
                        <X size={18} />
                      </span>
                      <div>
                        <strong>{attCounts.Absent}</strong>
                        <span>Absent days</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Latest 5 leave requests */}
      <motion.div className="card card-hover" variants={fadeUp}>
        <div className="card-head">
          <div className="card-title">
            <CalendarDays size={17} /> Latest leave requests
          </div>
          <Link to="/leaves" className="card-link">
            All requests <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="card-body">
          {loading ? (
            <SkeletonList rows={3} />
          ) : leaves.length === 0 ? (
            <EmptyState
              compact
              icon={CalendarDays}
              title="No leave requests yet"
              message="When you submit a leave request, its status will show up here."
              action={
                <Link to="/leaves?new=1">
                  <Button size="sm" icon={CalendarPlus}>
                    Request leave
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="list">
              {leaves.map((lv) => {
                const meta = leaveTypeMeta(lv.leave_type);
                const TypeIcon = meta.icon;
                return (
                  <div className="list-item" key={lv.id}>
                    <span
                      className={`dot-icon tone-${meta.tone}`}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <TypeIcon size={18} />
                    </span>
                    <div className="grow">
                      <div className="row-wrap" style={{ gap: 8 }}>
                        <span className="person-name">{lv.leave_type} Leave</span>
                        <span className="chip num" style={{ height: 22, padding: '0 8px', fontSize: 11 }}>
                          {lv.total_days} {lv.total_days === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                      <div className="person-sub" style={{ marginTop: 3 }}>
                        <Calendar size={12} style={{ verticalAlign: '-1px', marginRight: 5 }} />
                        {formatDate(lv.start_date)} – {formatDate(lv.end_date)} · {lv.reason}
                      </div>
                    </div>
                    <StatusBadge status={lv.status} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard user={user} /> : <EmployeeDashboard user={user} />;
}
