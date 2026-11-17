const pool = require('../config/db');

const Department = {
  // ------------------------------------------------------------------
  // Departments
  // ------------------------------------------------------------------
  async getAll() {
    const [rows] = await pool.query(
      `SELECT d.id, d.name, d.description, d.created_at, d.updated_at,
              (SELECT COUNT(*) FROM positions p WHERE p.department_id = d.id) AS position_count,
              (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id) AS employee_count
         FROM departments d
        ORDER BY d.name ASC`
    );
    return rows;
  },

  /** Department with its positions (each with an employee count). */
  async getById(id) {
    const [rows] = await pool.query(
      `SELECT d.id, d.name, d.description, d.created_at, d.updated_at,
              (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id) AS employee_count
         FROM departments d WHERE d.id = ? LIMIT 1`,
      [id]
    );
    if (!rows[0]) return null;
    rows[0].positions = await this.getPositions(id);
    return rows[0];
  },

  async create({ name, description = null }) {
    const [result] = await pool.query(
      'INSERT INTO departments (name, description) VALUES (?, ?)',
      [name, description]
    );
    return this.getById(result.insertId);
  },

  async update(id, { name, description }) {
    const sets = [];
    const params = [];
    if (name !== undefined) {
      sets.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      sets.push('description = ?');
      params.push(description);
    }
    if (!sets.length) return this.getById(id);
    params.push(id);
    const [result] = await pool.query(`UPDATE departments SET ${sets.join(', ')} WHERE id = ?`, params);
    return result.affectedRows ? this.getById(id) : null;
  },

  async remove(id) {
    const [result] = await pool.query('DELETE FROM departments WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // ------------------------------------------------------------------
  // Positions
  // ------------------------------------------------------------------
  async getPositions(departmentId) {
    const [rows] = await pool.query(
      `SELECT p.id, p.department_id, d.name AS department_name, p.title, p.description,
              (SELECT COUNT(*) FROM employees e WHERE e.position_id = p.id) AS employee_count
         FROM positions p
         JOIN departments d ON d.id = p.department_id
        WHERE (? IS NULL OR p.department_id = ?)
        ORDER BY d.name ASC, p.title ASC`,
      [departmentId || null, departmentId || null]
    );
    return rows;
  },

  async getPositionById(id) {
    const [rows] = await pool.query(
      `SELECT p.id, p.department_id, d.name AS department_name, p.title, p.description
         FROM positions p JOIN departments d ON d.id = p.department_id
        WHERE p.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async createPosition({ department_id, title, description = null }) {
    const [result] = await pool.query(
      'INSERT INTO positions (department_id, title, description) VALUES (?, ?, ?)',
      [department_id, title, description]
    );
    return this.getPositionById(result.insertId);
  },

  async updatePosition(id, { department_id, title, description }) {
    const sets = [];
    const params = [];
    if (department_id !== undefined) {
      sets.push('department_id = ?');
      params.push(department_id);
    }
    if (title !== undefined) {
      sets.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      sets.push('description = ?');
      params.push(description);
    }
    if (!sets.length) return this.getPositionById(id);
    params.push(id);
    const [result] = await pool.query(`UPDATE positions SET ${sets.join(', ')} WHERE id = ?`, params);
    return result.affectedRows ? this.getPositionById(id) : null;
  },

  async removePosition(id) {
    const [result] = await pool.query('DELETE FROM positions WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = Department;
