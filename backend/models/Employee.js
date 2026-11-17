const crypto = require('crypto');
const pool = require('../config/db');
const User = require('./User');
const { HttpError } = require('../middleware/errorHandler');

const BASE_SELECT = `
  SELECT e.id, e.user_id, e.employee_code, e.first_name, e.last_name,
         CONCAT(e.first_name, ' ', e.last_name) AS full_name,
         e.email, e.phone, e.address, e.birth_date, e.gender,
         e.department_id, d.name  AS department_name,
         e.position_id,   p.title AS position_title,
         e.date_hired, e.status,
         u.username, u.role, u.is_active AS account_active,
         e.created_at, e.updated_at
    FROM employees e
    LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN positions   p ON p.id = e.position_id
    LEFT JOIN users       u ON u.id = e.user_id`;

const SORT_COLUMNS = {
  name: 'e.last_name, e.first_name',
  code: 'e.employee_code',
  department: 'd.name',
  position: 'p.title',
  date_hired: 'e.date_hired',
  status: 'e.status',
  created_at: 'e.created_at',
};

const UPDATABLE = [
  'employee_code', 'first_name', 'last_name', 'email', 'phone', 'address',
  'birth_date', 'gender', 'department_id', 'position_id', 'date_hired', 'status',
];

/** Runs fn(conn) inside a transaction; commits on success, rolls back on error. */
const withTransaction = async (fn) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const Employee = {
  async findById(id, conn = pool) {
    const [rows] = await conn.query(`${BASE_SELECT} WHERE e.id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  },

  async findByUserId(userId, conn = pool) {
    const [rows] = await conn.query(`${BASE_SELECT} WHERE e.user_id = ? LIMIT 1`, [userId]);
    return rows[0] || null;
  },

  /**
   * Search + filter + paginate.
   * filters: { search, department_id, position_id, status, sort, order, limit, offset }
   * `search` matches name, employee code, email, phone, position and department.
   */
  async search({ search, department_id, position_id, status, sort, order, limit = 20, offset = 0 } = {}) {
    const where = [];
    const params = [];

    if (search) {
      const like = `%${search}%`;
      where.push(`(e.first_name LIKE ? OR e.last_name LIKE ?
                   OR CONCAT(e.first_name, ' ', e.last_name) LIKE ?
                   OR e.employee_code LIKE ? OR e.email LIKE ? OR e.phone LIKE ?
                   OR p.title LIKE ? OR d.name LIKE ?)`);
      params.push(like, like, like, like, like, like, like, like);
    }
    if (department_id) {
      where.push('e.department_id = ?');
      params.push(department_id);
    }
    if (position_id) {
      where.push('e.position_id = ?');
      params.push(position_id);
    }
    if (status) {
      where.push('e.status = ?');
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderCol = SORT_COLUMNS[sort] || SORT_COLUMNS.name;
    const orderDir = String(order).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM employees e
         LEFT JOIN departments d ON d.id = e.department_id
         LEFT JOIN positions   p ON p.id = e.position_id
         ${whereSql}`,
      params
    );
    const [rows] = await pool.query(
      `${BASE_SELECT} ${whereSql} ORDER BY ${orderCol} ${orderDir}, e.id ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { rows, total };
  },

  /**
   * Creates an employee. If `username` + `password` are supplied, a login
   * account (role Employee) is created and linked in the same transaction.
   */
  async create(data) {
    const id = await withTransaction(async (conn) => {
      let userId = null;
      if (data.username && data.password) {
        const user = await User.create(
          { username: data.username, password: data.password, role: 'Employee' },
          conn
        );
        userId = user.id;
      }

      const tempCode = data.employee_code || `TMP-${crypto.randomBytes(4).toString('hex')}`;
      const [result] = await conn.query(
        `INSERT INTO employees
           (user_id, employee_code, first_name, last_name, email, phone, address,
            birth_date, gender, department_id, position_id, date_hired, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, tempCode, data.first_name, data.last_name, data.email,
          data.phone ?? null, data.address ?? null, data.birth_date ?? null,
          data.gender ?? null, data.department_id ?? null, data.position_id ?? null,
          data.date_hired, data.status || 'Active',
        ]
      );

      if (!data.employee_code) {
        await conn.query("UPDATE employees SET employee_code = CONCAT('EMP-', LPAD(id, 4, '0')) WHERE id = ?", [
          result.insertId,
        ]);
      }
      if (userId && (data.status || 'Active') === 'Inactive') {
        await User.setActive(userId, false, conn);
      }
      return result.insertId;
    });
    return this.findById(id);
  },

  /** Partial update (only whitelisted columns). Keeps the account's is_active in sync with status. */
  async update(id, data) {
    const found = await withTransaction(async (conn) => {
      const [existing] = await conn.query('SELECT id, user_id FROM employees WHERE id = ? FOR UPDATE', [id]);
      if (!existing[0]) return false;

      const sets = [];
      const params = [];
      UPDATABLE.forEach((col) => {
        if (data[col] !== undefined) {
          sets.push(`${col} = ?`);
          params.push(data[col]);
        }
      });
      if (sets.length) {
        params.push(id);
        await conn.query(`UPDATE employees SET ${sets.join(', ')} WHERE id = ?`, params);
      }
      if (data.status !== undefined && existing[0].user_id) {
        await User.setActive(existing[0].user_id, data.status === 'Active', conn);
      }
      return true;
    });
    return found ? this.findById(id) : null;
  },

  /** Deletes the employee, their attendance + leaves (FK cascade) and their login account. */
  async remove(id) {
    return withTransaction(async (conn) => {
      const [rows] = await conn.query('SELECT user_id FROM employees WHERE id = ? FOR UPDATE', [id]);
      if (!rows[0]) return false;
      await conn.query('DELETE FROM employees WHERE id = ?', [id]);
      if (rows[0].user_id) await User.remove(rows[0].user_id, conn);
      return true;
    });
  },

  /** Creates a login for an employee that has none. */
  async createAccount(id, { username, password }) {
    await withTransaction(async (conn) => {
      const [rows] = await conn.query('SELECT user_id, status FROM employees WHERE id = ? FOR UPDATE', [id]);
      if (!rows[0]) throw new HttpError(404, 'Employee not found.');
      if (rows[0].user_id) throw new HttpError(409, 'This employee already has a login account.');
      const user = await User.create({ username, password, role: 'Employee' }, conn);
      await conn.query('UPDATE employees SET user_id = ? WHERE id = ?', [user.id, id]);
      if (rows[0].status === 'Inactive') await User.setActive(user.id, false, conn);
    });
    return this.findById(id);
  },

  /** Admin password reset for an employee's account. */
  async resetPassword(id, newPassword) {
    const emp = await this.findById(id);
    if (!emp) throw new HttpError(404, 'Employee not found.');
    if (!emp.user_id) throw new HttpError(400, 'This employee has no login account yet.');
    await User.updatePassword(emp.user_id, newPassword);
    return true;
  },

  // ------------------------------------------------------------------
  // Reports
  // ------------------------------------------------------------------
  async getReport() {
    const [[totals]] = await pool.query(
      `SELECT COUNT(*) AS total_employees,
              COUNT(CASE WHEN status = 'Active'   THEN 1 END) AS active_employees,
              COUNT(CASE WHEN status = 'Inactive' THEN 1 END) AS inactive_employees,
              COUNT(CASE WHEN department_id IS NULL THEN 1 END) AS unassigned_department
         FROM employees`
    );
    const [byDepartment] = await pool.query(
      `SELECT d.id AS department_id, d.name AS department_name,
              COUNT(e.id) AS total_employees,
              COUNT(CASE WHEN e.status = 'Active' THEN 1 END) AS active_employees
         FROM departments d
         LEFT JOIN employees e ON e.department_id = d.id
        GROUP BY d.id, d.name
        ORDER BY d.name`
    );
    const [byPosition] = await pool.query(
      `SELECT p.id AS position_id, p.title AS position_title, d.name AS department_name,
              COUNT(e.id) AS total_employees
         FROM positions p
         JOIN departments d ON d.id = p.department_id
         LEFT JOIN employees e ON e.position_id = p.id
        GROUP BY p.id, p.title, d.name
        ORDER BY d.name, p.title`
    );
    const [recentHires] = await pool.query(
      `SELECT e.id, e.employee_code, CONCAT(e.first_name, ' ', e.last_name) AS full_name,
              d.name AS department_name, p.title AS position_title, e.date_hired
         FROM employees e
         LEFT JOIN departments d ON d.id = e.department_id
         LEFT JOIN positions   p ON p.id = e.position_id
        ORDER BY e.date_hired DESC, e.id DESC
        LIMIT 5`
    );
    return { totals, by_department: byDepartment, by_position: byPosition, recent_hires: recentHires };
  },
};

module.exports = Employee;
