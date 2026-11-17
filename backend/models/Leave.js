const pool = require('../config/db');
const { HttpError } = require('../middleware/errorHandler');

const BASE_SELECT = `
  SELECT l.id, l.employee_id, e.employee_code,
         CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
         e.department_id, d.name AS department_name,
         l.leave_type, l.start_date, l.end_date,
         (DATEDIFF(l.end_date, l.start_date) + 1) AS total_days,
         l.reason, l.status,
         l.reviewed_by, ru.username AS reviewed_by_username, l.reviewed_at, l.admin_remarks,
         l.created_at, l.updated_at
    FROM leaves l
    JOIN employees e ON e.id = l.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN users ru ON ru.id = l.reviewed_by`;

const buildFilters = ({ employee_id, department_id, status, leave_type, from, to, search } = {}) => {
  const where = [];
  const params = [];
  if (employee_id) {
    where.push('l.employee_id = ?');
    params.push(employee_id);
  }
  if (department_id) {
    where.push('e.department_id = ?');
    params.push(department_id);
  }
  if (status) {
    where.push('l.status = ?');
    params.push(status);
  }
  if (leave_type) {
    where.push('l.leave_type = ?');
    params.push(leave_type);
  }
  // Leaves that overlap the [from, to] window
  if (from) {
    where.push('l.end_date >= ?');
    params.push(from);
  }
  if (to) {
    where.push('l.start_date <= ?');
    params.push(to);
  }
  if (search) {
    where.push("(CONCAT(e.first_name, ' ', e.last_name) LIKE ? OR e.employee_code LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
};

const Leave = {
  async findById(id) {
    const [rows] = await pool.query(`${BASE_SELECT} WHERE l.id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  },

  /**
   * All leave requests with filters (Admin view, reports).
   * Pending requests are listed first, then newest first.
   */
  async findAll(filters = {}, { limit = 20, offset = 0 } = {}) {
    const { whereSql, params } = buildFilters(filters);
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM leaves l JOIN employees e ON e.id = l.employee_id
         ${whereSql}`,
      params
    );
    const [rows] = await pool.query(
      `${BASE_SELECT} ${whereSql}
        ORDER BY (l.status = 'Pending') DESC, l.created_at DESC, l.id DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { rows, total };
  },

  /** One employee's leave history. */
  findByEmployee(employeeId, filters = {}, paging = {}) {
    return this.findAll({ ...filters, employee_id: employeeId }, paging);
  },

  /** Submits a new request (status Pending). Rejects overlap with Pending/Approved leave. */
  async create({ employee_id, leave_type, start_date, end_date, reason }) {
    const [overlap] = await pool.query(
      `SELECT id, start_date, end_date, status FROM leaves
        WHERE employee_id = ? AND status IN ('Pending', 'Approved')
          AND start_date <= ? AND end_date >= ?
        LIMIT 1`,
      [employee_id, end_date, start_date]
    );
    if (overlap[0]) {
      throw new HttpError(
        409,
        `You already have a ${overlap[0].status.toLowerCase()} leave request covering ` +
          `${overlap[0].start_date} to ${overlap[0].end_date}.`
      );
    }
    const [result] = await pool.query(
      `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [employee_id, leave_type, start_date, end_date, reason]
    );
    return this.findById(result.insertId);
  },

  /**
   * Approve / reject a Pending request. The status guard in the UPDATE makes
   * it safe if two admins act at the same time.
   */
  async updateStatus(id, status, reviewerUserId, adminRemarks = null) {
    const [result] = await pool.query(
      `UPDATE leaves
          SET status = ?, reviewed_by = ?, reviewed_at = NOW(), admin_remarks = ?
        WHERE id = ? AND status = 'Pending'`,
      [status, reviewerUserId, adminRemarks, id]
    );
    if (!result.affectedRows) {
      const existing = await this.findById(id);
      if (!existing) throw new HttpError(404, 'Leave request not found.');
      throw new HttpError(409, `This request was already ${existing.status.toLowerCase()}.`);
    }
    return this.findById(id);
  },

  /** Employee cancels (deletes) their own request while it is still Pending. */
  async cancel(id, employeeId) {
    const [result] = await pool.query(
      "DELETE FROM leaves WHERE id = ? AND employee_id = ? AND status = 'Pending'",
      [id, employeeId]
    );
    return result.affectedRows > 0;
  },

  /**
   * Report for a date window: counts by status and type, approved leave days
   * per employee (clipped to the window) and who is on approved leave today.
   */
  async getSummary({ from, to, department_id = null }) {
    const deptSql = '(? IS NULL OR e.department_id = ?)';
    const overlapSql = 'l.start_date <= ? AND l.end_date >= ?';

    const [byStatus] = await pool.query(
      `SELECT l.status, COUNT(*) AS requests
         FROM leaves l JOIN employees e ON e.id = l.employee_id
        WHERE ${overlapSql} AND ${deptSql}
        GROUP BY l.status`,
      [to, from, department_id, department_id]
    );
    const [byType] = await pool.query(
      `SELECT l.leave_type, COUNT(*) AS requests
         FROM leaves l JOIN employees e ON e.id = l.employee_id
        WHERE ${overlapSql} AND ${deptSql}
        GROUP BY l.leave_type
        ORDER BY requests DESC`,
      [to, from, department_id, department_id]
    );
    const [perEmployee] = await pool.query(
      `SELECT e.id AS employee_id, e.employee_code,
              CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
              d.name AS department_name,
              COUNT(l.id) AS requests,
              COUNT(CASE WHEN l.status = 'Pending'  THEN 1 END) AS pending,
              COUNT(CASE WHEN l.status = 'Approved' THEN 1 END) AS approved,
              COUNT(CASE WHEN l.status = 'Rejected' THEN 1 END) AS rejected,
              COALESCE(SUM(CASE WHEN l.status = 'Approved'
                   THEN DATEDIFF(LEAST(l.end_date, ?), GREATEST(l.start_date, ?)) + 1 END), 0)
                AS approved_days
         FROM employees e
         LEFT JOIN departments d ON d.id = e.department_id
         JOIN leaves l ON l.employee_id = e.id AND ${overlapSql}
        WHERE ${deptSql}
        GROUP BY e.id, e.employee_code, e.first_name, e.last_name, d.name
        ORDER BY approved_days DESC, e.last_name`,
      [to, from, to, from, department_id, department_id]
    );
    const [onLeaveToday] = await pool.query(
      `SELECT e.id AS employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
              d.name AS department_name, l.leave_type, l.start_date, l.end_date
         FROM leaves l
         JOIN employees e ON e.id = l.employee_id
         LEFT JOIN departments d ON d.id = e.department_id
        WHERE l.status = 'Approved' AND CURDATE() BETWEEN l.start_date AND l.end_date
          AND ${deptSql}
        ORDER BY e.last_name`,
      [department_id, department_id]
    );

    const statusCounts = { Pending: 0, Approved: 0, Rejected: 0 };
    byStatus.forEach((r) => {
      statusCounts[r.status] = r.requests;
    });
    return {
      from,
      to,
      by_status: statusCounts,
      total_requests: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      by_type: byType,
      per_employee: perEmployee.map((r) => ({ ...r, approved_days: Number(r.approved_days) })),
      on_leave_today: onLeaveToday,
    };
  },
};

module.exports = Leave;
