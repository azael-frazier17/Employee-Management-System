const pool = require('../config/db');
const { HttpError } = require('../middleware/errorHandler');
const { formatDate, formatTime } = require('../utils/helpers');

const HOURS_SQL = 'ROUND(TIME_TO_SEC(TIMEDIFF(a.time_out, a.time_in)) / 3600, 2)';

const BASE_SELECT = `
  SELECT a.id, a.employee_id, e.employee_code,
         CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
         e.department_id, d.name AS department_name,
         a.attendance_date, a.time_in, a.time_out,
         ${HOURS_SQL} AS hours_worked,
         a.status, a.remarks, a.created_at, a.updated_at
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    LEFT JOIN departments d ON d.id = e.department_id`;

const toSeconds = (t) => {
  const [h, m, s = 0] = String(t).split(':').map(Number);
  return h * 3600 + m * 60 + s;
};

/**
 * Late rule (configurable in .env):
 *   time-in later than WORK_START_TIME + LATE_GRACE_MINUTES  =>  "Late"
 */
const computeStatus = (timeIn) => {
  const start = toSeconds(process.env.WORK_START_TIME || '09:00');
  const graceMin = Number.isFinite(Number(process.env.LATE_GRACE_MINUTES))
    ? Number(process.env.LATE_GRACE_MINUTES)
    : 15;
  return toSeconds(timeIn) > start + graceMin * 60 ? 'Late' : 'Present';
};

const buildFilters = ({ employee_id, department_id, status, from, to, search } = {}) => {
  const where = [];
  const params = [];
  if (employee_id) {
    where.push('a.employee_id = ?');
    params.push(employee_id);
  }
  if (department_id) {
    where.push('e.department_id = ?');
    params.push(department_id);
  }
  if (status) {
    where.push('a.status = ?');
    params.push(status);
  }
  if (from) {
    where.push('a.attendance_date >= ?');
    params.push(from);
  }
  if (to) {
    where.push('a.attendance_date <= ?');
    params.push(to);
  }
  if (search) {
    where.push("(CONCAT(e.first_name, ' ', e.last_name) LIKE ? OR e.employee_code LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
};

const Attendance = {
  computeStatus,

  async findById(id) {
    const [rows] = await pool.query(`${BASE_SELECT} WHERE a.id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  },

  async findByEmployeeAndDate(employeeId, date) {
    const [rows] = await pool.query(
      `${BASE_SELECT} WHERE a.employee_id = ? AND a.attendance_date = ? LIMIT 1`,
      [employeeId, date]
    );
    return rows[0] || null;
  },

  /** Attendance history. Filters: employee_id, department_id, status, from, to, search. */
  async findAll(filters = {}, { limit = 20, offset = 0 } = {}) {
    const { whereSql, params } = buildFilters(filters);
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM attendance a
         JOIN employees e ON e.id = a.employee_id
         ${whereSql}`,
      params
    );
    const [rows] = await pool.query(
      `${BASE_SELECT} ${whereSql}
        ORDER BY a.attendance_date DESC, e.last_name ASC, e.first_name ASC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { rows, total };
  },

  /** Employee's own history (same filters minus employee_id). */
  findByEmployee(employeeId, filters = {}, paging = {}) {
    return this.findAll({ ...filters, employee_id: employeeId }, paging);
  },

  /**
   * Employee clock-in using the server clock.
   * Status is set automatically (Present / Late). One record per day.
   */
  async timeIn(employeeId) {
    const now = new Date();
    const date = formatDate(now);
    const time = formatTime(now);
    const status = computeStatus(time);

    const [rows] = await pool.query(
      'SELECT id, time_in FROM attendance WHERE employee_id = ? AND attendance_date = ?',
      [employeeId, date]
    );
    if (rows[0]) {
      if (rows[0].time_in) throw new HttpError(409, `You already timed in today at ${rows[0].time_in}.`);
      // A row exists without time-in (e.g. auto-marked Absent): fill it in.
      await pool.query(
        'UPDATE attendance SET time_in = ?, status = ?, remarks = NULL WHERE id = ?',
        [time, status, rows[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO attendance (employee_id, attendance_date, time_in, status) VALUES (?, ?, ?, ?)',
        [employeeId, date, time, status]
      );
    }
    return this.findByEmployeeAndDate(employeeId, date);
  },

  /** Employee clock-out using the server clock. */
  async timeOut(employeeId) {
    const now = new Date();
    const date = formatDate(now);
    const time = formatTime(now);

    const [rows] = await pool.query(
      'SELECT id, time_in, time_out FROM attendance WHERE employee_id = ? AND attendance_date = ?',
      [employeeId, date]
    );
    if (!rows[0] || !rows[0].time_in) {
      throw new HttpError(400, 'You have not timed in today.');
    }
    if (rows[0].time_out) {
      throw new HttpError(409, `You already timed out today at ${rows[0].time_out}.`);
    }
    await pool.query('UPDATE attendance SET time_out = ? WHERE id = ?', [time, rows[0].id]);
    return this.findByEmployeeAndDate(employeeId, date);
  },

  /**
   * Admin manual entry (insert or overwrite the day's record).
   * If status is omitted: Absent when there is no time_in, otherwise computed.
   */
  async manualRecord({ employee_id, attendance_date, time_in = null, time_out = null, status, remarks = null }) {
    const finalStatus = status || (time_in ? computeStatus(time_in) : 'Absent');
    await pool.query(
      `INSERT INTO attendance (employee_id, attendance_date, time_in, time_out, status, remarks)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         time_in = VALUES(time_in), time_out = VALUES(time_out),
         status = VALUES(status),   remarks  = VALUES(remarks)`,
      [employee_id, attendance_date, time_in, time_out, finalStatus, remarks]
    );
    return this.findByEmployeeAndDate(employee_id, attendance_date);
  },

  /** Admin edit of an existing record. */
  async update(id, data) {
    const [rows] = await pool.query('SELECT * FROM attendance WHERE id = ?', [id]);
    const current = rows[0];
    if (!current) return null;

    const timeIn = data.time_in !== undefined ? data.time_in : current.time_in;
    const timeOut = data.time_out !== undefined ? data.time_out : current.time_out;
    let status = data.status;
    if (!status) {
      status = data.time_in !== undefined && timeIn ? computeStatus(timeIn) : current.status;
    }
    const remarks = data.remarks !== undefined ? data.remarks : current.remarks;

    await pool.query(
      'UPDATE attendance SET time_in = ?, time_out = ?, status = ?, remarks = ? WHERE id = ?',
      [timeIn, timeOut, status, remarks, id]
    );
    return this.findById(id);
  },

  async remove(id) {
    const [result] = await pool.query('DELETE FROM attendance WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Marks "Absent" for every active employee who has no attendance record on
   * `date` and is not on an approved leave. Returns the number of rows added.
   */
  async markAbsentees(date, departmentId = null) {
    const [result] = await pool.query(
      `INSERT INTO attendance (employee_id, attendance_date, status, remarks)
       SELECT e.id, ?, 'Absent', 'Auto-marked absent (no time-in)'
         FROM employees e
        WHERE e.status = 'Active'
          AND e.date_hired <= ?
          AND (? IS NULL OR e.department_id = ?)
          AND NOT EXISTS (SELECT 1 FROM attendance a
                           WHERE a.employee_id = e.id AND a.attendance_date = ?)
          AND NOT EXISTS (SELECT 1 FROM leaves l
                           WHERE l.employee_id = e.id AND l.status = 'Approved'
                             AND ? BETWEEN l.start_date AND l.end_date)`,
      [date, date, departmentId, departmentId, date, date]
    );
    return result.affectedRows;
  },

  /**
   * Report: per-employee counts of Present / Late / Absent between from and to,
   * plus overall totals. Active employees with no records appear with zeros.
   */
  async getSummary({ from, to, department_id = null }) {
    const [rows] = await pool.query(
      `SELECT e.id AS employee_id, e.employee_code,
              CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
              d.name AS department_name,
              COUNT(CASE WHEN a.status = 'Present' THEN 1 END) AS present_days,
              COUNT(CASE WHEN a.status = 'Late'    THEN 1 END) AS late_days,
              COUNT(CASE WHEN a.status = 'Absent'  THEN 1 END) AS absent_days,
              COUNT(a.id) AS total_records,
              ROUND(AVG(TIME_TO_SEC(TIMEDIFF(a.time_out, a.time_in))) / 3600, 2) AS avg_hours_per_day
         FROM employees e
         LEFT JOIN departments d ON d.id = e.department_id
         LEFT JOIN attendance a
                ON a.employee_id = e.id AND a.attendance_date BETWEEN ? AND ?
        WHERE e.status = 'Active' AND (? IS NULL OR e.department_id = ?)
        GROUP BY e.id, e.employee_code, e.first_name, e.last_name, d.name
        ORDER BY e.last_name, e.first_name`,
      [from, to, department_id, department_id]
    );

    const totals = rows.reduce(
      (acc, r) => {
        acc.present_days += r.present_days;
        acc.late_days += r.late_days;
        acc.absent_days += r.absent_days;
        acc.total_records += r.total_records;
        return acc;
      },
      { present_days: 0, late_days: 0, absent_days: 0, total_records: 0 }
    );
    return { from, to, totals, per_employee: rows };
  },
};

module.exports = Attendance;
