import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
  BarChart3,
  Briefcase,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Palmtree,
  Printer,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  XCircle,
} from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import useTheme from '../hooks/useTheme';
import { APP_NAME, CHART_PALETTE, COLORS, COMPANY_NAME } from '../utils/constants';
import {
  cleanParams,
  formatDate,
  formatHours,
  longToday,
  monthRange,
  presetRange,
} from '../utils/helpers';
import { stagger } from '../utils/motion';
import PageHeader from '../components/ui/PageHeader';
import Tabs from '../components/ui/Tabs';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import Avatar from '../components/ui/Avatar';
import StatusBadge from '../components/ui/StatusBadge';
import DonutRing, { DonutLegend } from '../components/ui/DonutRing';
import { chartTheme } from '../components/ui/chartTheme';
import { Skeleton, SkeletonTable } from '../components/ui/Skeleton';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import './Reports.css';

const REPORT_TABS = [
  { value: 'headcount', label: 'Headcount', icon: Users },
  { value: 'attendance', label: 'Attendance', icon: CalendarClock },
  { value: 'leaves', label: 'Leaves', icon: CalendarDays },
];

const REPORT_TITLES = {
  headcount: 'Employee Headcount Report',
  attendance: 'Attendance Summary Report',
  leaves: 'Leave Requests & Utilization Report',
};

export default function Reports() {
  const { isDark } = useTheme();
  const cTheme = chartTheme(isDark);

  const [tab, setTab] = useState('headcount');
  const defaultMonth = monthRange();
  const [from, setFrom] = useState(defaultMonth.from);
  const [to, setTo] = useState(defaultMonth.to);
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);

  const [headcount, setHeadcount] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [leaves, setLeaves] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/departments')
      .then((res) => setDepartments(res.data.data || []))
      .catch(() => {});
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filterParams = cleanParams({ from, to, department_id: departmentId });
      if (tab === 'headcount') {
        const res = await api.get('/employees/reports/summary');
        setHeadcount(res.data.data);
      } else if (tab === 'attendance') {
        const res = await api.get('/attendance/reports/summary', { params: filterParams });
        setAttendance(res.data.data);
      } else {
        const res = await api.get('/leaves/reports/summary', { params: filterParams });
        setLeaves(res.data.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab, from, to, departmentId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const applyPreset = (p) => {
    const r = presetRange(p);
    setFrom(r.from);
    setTo(r.to);
  };

  const selectedDeptName =
    departments.find((d) => String(d.id) === String(departmentId))?.name || 'All Departments';

  return (
    <div className="stack">
      <PageHeader
        icon={BarChart3}
        title="Reports"
        subtitle="Company-wide headcount, attendance, and leave analytics ready for printing."
        actions={
          <Button icon={Printer} onClick={() => window.print()}>
            Print report
          </Button>
        }
      />

      <div className="print-only report-print-header">
        <div className="report-print-top">
          <div>
            <h2>{COMPANY_NAME} — {APP_NAME}</h2>
            <h1>{REPORT_TITLES[tab]}</h1>
          </div>
          <div className="report-print-meta">
            <div>
              <strong>Generated:</strong> {longToday()}
            </div>
            {tab !== 'headcount' && (
              <>
                <div>
                  <strong>Period:</strong> {formatDate(from)} – {formatDate(to)}
                </div>
                <div>
                  <strong>Department:</strong> {selectedDeptName}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="row-wrap no-print" style={{ justifyContent: 'space-between' }}>
        <Tabs tabs={REPORT_TABS} value={tab} onChange={setTab} label="Report tabs" />

        {tab !== 'headcount' && (
          <div className="row-wrap">
            <select
              className="select"
              style={{ width: 'auto' }}
              aria-label="Filter report by department"
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

            <input
              type="date"
              className="input"
              style={{ width: 'auto' }}
              aria-label="From date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span className="muted small">to</span>
            <input
              type="date"
              className="input"
              style={{ width: 'auto' }}
              aria-label="To date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />

            <button type="button" className="chip" onClick={() => applyPreset('week')}>
              This week
            </button>
            <button type="button" className="chip" onClick={() => applyPreset('month')}>
              This month
            </button>
          </div>
        )}
      </div>

      {error ? (
        <div className="card">
          <ErrorState message={error} onRetry={loadReport} />
        </div>
      ) : (
        <>
          {tab === 'headcount' && (
            <motion.div className="stack" variants={stagger} initial="hidden" animate="show">
              <div className="grid grid-4">
                <StatCard
                  icon={Users}
                  label="Total employees"
                  value={headcount?.totals?.total_employees || 0}
                  tone="primary"
                  loading={loading}
                />
                <StatCard
                  icon={UserCheck}
                  label="Active employees"
                  value={headcount?.totals?.active_employees || 0}
                  tone="success"
                  loading={loading}
                />
                <StatCard
                  icon={UserX}
                  label="Inactive employees"
                  value={headcount?.totals?.inactive_employees || 0}
                  tone="danger"
                  loading={loading}
                />
                <StatCard
                  icon={Building2}
                  label="Unassigned department"
                  value={headcount?.totals?.unassigned_department || 0}
                  tone="warning"
                  loading={loading}
                />
              </div>

              <div className="grid grid-2">
                <div className="card">
                  <div className="card-head">
                    <div className="card-title">
                      <Building2 size={17} /> Headcount by Department
                    </div>
                  </div>
                  <div className="card-body stack">
                    {loading ? (
                      <Skeleton height={220} radius={12} />
                    ) : (
                      <>
                        <div className="no-print" style={{ width: '100%', height: 220 }}>
                          <ResponsiveContainer>
                            <BarChart
                              data={headcount?.by_department || []}
                              margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={cTheme.grid}
                                vertical={false}
                              />
                              <XAxis
                                dataKey="department_name"
                                tick={{ fill: cTheme.axis, fontSize: 11.5 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                allowDecimals={false}
                                tick={{ fill: cTheme.axis, fontSize: 11.5 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <Tooltip cursor={{ fill: cTheme.cursor }} {...cTheme.tooltip} />
                              <Bar
                                dataKey="total_employees"
                                name="Total"
                                radius={[8, 8, 0, 0]}
                                maxBarSize={38}
                              >
                                {(headcount?.by_department || []).map((d, i) => (
                                  <Cell
                                    key={d.department_id}
                                    fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="table-wrap">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Department</th>
                                <th className="right">Active</th>
                                <th className="right">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(headcount?.by_department || []).map((d) => (
                                <tr key={d.department_id}>
                                  <td>
                                    <strong>{d.department_name}</strong>
                                  </td>
                                  <td className="right num">{d.active_employees}</td>
                                  <td className="right num">
                                    <strong>{d.total_employees}</strong>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-head">
                    <div className="card-title">
                      <Briefcase size={17} /> Headcount by Position
                    </div>
                  </div>
                  <div className="card-body">
                    {loading ? (
                      <SkeletonTable rows={5} cols={3} />
                    ) : (
                      <div className="table-wrap">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Position</th>
                              <th>Department</th>
                              <th className="right">Employees</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(headcount?.by_position || []).map((p) => (
                              <tr key={p.position_id}>
                                <td>
                                  <strong>{p.position_title}</strong>
                                </td>
                                <td>{p.department_name}</td>
                                <td className="right num">
                                  <strong>{p.total_employees}</strong>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <div className="card-title">
                    <UserPlus size={17} /> Recent Hires
                  </div>
                </div>
                <div className="card-body">
                  {loading ? (
                    <SkeletonTable rows={4} cols={5} />
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Employee</th>
                            <th>Department</th>
                            <th>Position</th>
                            <th>Date hired</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(headcount?.recent_hires || []).map((emp) => (
                            <tr key={emp.id}>
                              <td className="num">{emp.employee_code}</td>
                              <td>
                                <strong>{emp.full_name}</strong>
                              </td>
                              <td>{emp.department_name || '—'}</td>
                              <td>{emp.position_title || '—'}</td>
                              <td className="num">{formatDate(emp.date_hired)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'attendance' && (
            <motion.div className="stack" variants={stagger} initial="hidden" animate="show">
              <div className="grid grid-4">
                <StatCard
                  icon={CalendarClock}
                  label="Total records"
                  value={attendance?.totals?.total_records || 0}
                  tone="primary"
                  loading={loading}
                />
                <StatCard
                  icon={UserCheck}
                  label="Present days"
                  value={attendance?.totals?.present_days || 0}
                  tone="success"
                  loading={loading}
                />
                <StatCard
                  icon={Clock}
                  label="Late days"
                  value={attendance?.totals?.late_days || 0}
                  tone="warning"
                  loading={loading}
                />
                <StatCard
                  icon={UserX}
                  label="Absent days"
                  value={attendance?.totals?.absent_days || 0}
                  tone="danger"
                  loading={loading}
                />
              </div>

              <div className="card no-print">
                <div className="card-head">
                  <div className="card-title">
                    <CalendarClock size={17} /> Attendance Breakdown ({formatDate(from)} –{' '}
                    {formatDate(to)})
                  </div>
                </div>
                <div className="card-body">
                  {loading ? (
                    <Skeleton height={180} radius={12} />
                  ) : (
                    (() => {
                      const t = attendance?.totals || {};
                      const segs = [
                        { label: 'Present', value: t.present_days || 0, color: COLORS.success },
                        { label: 'Late', value: t.late_days || 0, color: COLORS.warning },
                        { label: 'Absent', value: t.absent_days || 0, color: COLORS.danger },
                      ];
                      const att = (t.present_days || 0) + (t.late_days || 0);
                      const rate = t.total_records
                        ? `${Math.round((att / t.total_records) * 100)}%`
                        : '0%';
                      return (
                        <div className="dash-donut-wrap" style={{ maxWidth: 480 }}>
                          <DonutRing
                            segments={segs}
                            centerValue={rate}
                            centerLabel="Attendance rate"
                          />
                          <DonutLegend segments={segs} />
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <div className="card-title">
                    <Users size={17} /> Per-Employee Attendance Summary
                  </div>
                  <span className="muted small num">
                    {formatDate(attendance?.from || from)} – {formatDate(attendance?.to || to)}
                  </span>
                </div>
                <div className="card-body">
                  {loading ? (
                    <SkeletonTable rows={6} cols={7} />
                  ) : (attendance?.per_employee || []).length === 0 ? (
                    <EmptyState
                      compact
                      icon={CalendarClock}
                      title="No employees found for this filter"
                    />
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Code</th>
                            <th>Department</th>
                            <th className="right">Present</th>
                            <th className="right">Late</th>
                            <th className="right">Absent</th>
                            <th className="right">Total logs</th>
                            <th className="right">Avg hours / day</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(attendance?.per_employee || []).map((row) => (
                            <tr key={row.employee_id}>
                              <td>
                                <div className="person">
                                  <Avatar name={row.employee_name} size={30} className="no-print" />
                                  <strong>{row.employee_name}</strong>
                                </div>
                              </td>
                              <td className="num">{row.employee_code}</td>
                              <td>{row.department_name || '—'}</td>
                              <td className="right num">{row.present_days}</td>
                              <td className="right num">{row.late_days}</td>
                              <td className="right num">{row.absent_days}</td>
                              <td className="right num">
                                <strong>{row.total_records}</strong>
                              </td>
                              <td className="right num">{formatHours(row.avg_hours_per_day)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'leaves' && (
            <motion.div className="stack" variants={stagger} initial="hidden" animate="show">
              <div className="grid grid-4">
                <StatCard
                  icon={CalendarDays}
                  label="Total requests"
                  value={leaves?.total_requests || 0}
                  tone="primary"
                  loading={loading}
                />
                <StatCard
                  icon={Clock}
                  label="Pending"
                  value={leaves?.by_status?.Pending || 0}
                  tone="warning"
                  loading={loading}
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Approved"
                  value={leaves?.by_status?.Approved || 0}
                  tone="success"
                  loading={loading}
                />
                <StatCard
                  icon={XCircle}
                  label="Rejected"
                  value={leaves?.by_status?.Rejected || 0}
                  tone="danger"
                  loading={loading}
                />
              </div>

              <div className="grid grid-2">
                <div className="card">
                  <div className="card-head">
                    <div className="card-title">
                      <CalendarDays size={17} /> Requests by Leave Type
                    </div>
                  </div>
                  <div className="card-body">
                    {loading ? (
                      <Skeleton height={210} radius={12} />
                    ) : (leaves?.by_type || []).length === 0 ? (
                      <EmptyState compact title="No leave requests in this date range" />
                    ) : (
                      <div style={{ width: '100%', height: 210 }}>
                        <ResponsiveContainer>
                          <BarChart
                            data={leaves?.by_type || []}
                            margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={cTheme.grid}
                              vertical={false}
                            />
                            <XAxis
                              dataKey="leave_type"
                              tick={{ fill: cTheme.axis, fontSize: 12 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fill: cTheme.axis, fontSize: 11.5 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip cursor={{ fill: cTheme.cursor }} {...cTheme.tooltip} />
                            <Bar
                              dataKey="requests"
                              name="Requests"
                              radius={[8, 8, 0, 0]}
                              maxBarSize={38}
                            >
                              {(leaves?.by_type || []).map((t, i) => (
                                <Cell
                                  key={t.leave_type}
                                  fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-head">
                    <div className="card-title">
                      <Palmtree size={17} /> Who is on Leave Today
                    </div>
                    <span className="muted small num">
                      {(leaves?.on_leave_today || []).length} employee(s)
                    </span>
                  </div>
                  <div className="card-body">
                    {loading ? (
                      <SkeletonTable rows={3} cols={4} />
                    ) : (leaves?.on_leave_today || []).length === 0 ? (
                      <EmptyState
                        compact
                        icon={UserCheck}
                        title="No employees on leave today"
                      />
                    ) : (
                      <div className="table-wrap">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Employee</th>
                              <th>Department</th>
                              <th>Type</th>
                              <th>Dates</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(leaves?.on_leave_today || []).map((item) => (
                              <tr key={`${item.employee_id}-${item.start_date}`}>
                                <td>
                                  <strong>{item.employee_name}</strong>
                                </td>
                                <td>{item.department_name || '—'}</td>
                                <td>
                                  <StatusBadge status="Approved" label={item.leave_type} size="sm" />
                                </td>
                                <td className="num">
                                  {formatDate(item.start_date)} – {formatDate(item.end_date)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <div className="card-title">
                    <Users size={17} /> Per-Employee Leave Summary
                  </div>
                  <span className="muted small num">
                    {formatDate(leaves?.from || from)} – {formatDate(leaves?.to || to)}
                  </span>
                </div>
                <div className="card-body">
                  {loading ? (
                    <SkeletonTable rows={6} cols={7} />
                  ) : (leaves?.per_employee || []).length === 0 ? (
                    <EmptyState compact title="No employee leave records in this period" />
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Code</th>
                            <th>Department</th>
                            <th className="right">Requests</th>
                            <th className="right">Pending</th>
                            <th className="right">Approved</th>
                            <th className="right">Rejected</th>
                            <th className="right">Approved days</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(leaves?.per_employee || []).map((row) => (
                            <tr key={row.employee_id}>
                              <td>
                                <strong>{row.employee_name}</strong>
                              </td>
                              <td className="num">{row.employee_code}</td>
                              <td>{row.department_name || '—'}</td>
                              <td className="right num">{row.requests}</td>
                              <td className="right num">{row.pending}</td>
                              <td className="right num">{row.approved}</td>
                              <td className="right num">{row.rejected}</td>
                              <td className="right num">
                                <strong>{row.approved_days}</strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
