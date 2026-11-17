const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const SALT_ROUNDS = 10;

/**
 * Every method accepts an optional `conn` (a pooled connection) as its last
 * argument so it can take part in a transaction started elsewhere.
 */
const User = {
  /** Row used for login (includes the password hash). */
  async findByUsername(username, conn = pool) {
    const [rows] = await conn.query(
      'SELECT id, username, password_hash, role, is_active FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    return rows[0] || null;
  },

  /** Lightweight lookup used by the auth middleware on every request. */
  async findAuthContext(id, conn = pool) {
    const [rows] = await conn.query(
      `SELECT u.id, u.username, u.role, u.is_active, e.id AS employee_id
         FROM users u
         LEFT JOIN employees e ON e.user_id = u.id
        WHERE u.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async findById(id, conn = pool) {
    const [rows] = await conn.query(
      'SELECT id, username, role, is_active, last_login_at, created_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async getRole(id, conn = pool) {
    const [rows] = await conn.query('SELECT role FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? rows[0].role : null;
  },

  async usernameExists(username, conn = pool) {
    const [rows] = await conn.query('SELECT 1 FROM users WHERE username = ? LIMIT 1', [username]);
    return rows.length > 0;
  },

  /** Creates an account; the plain password is hashed here. */
  async create({ username, password, role = 'Employee' }, conn = pool) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await conn.query(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, role]
    );
    return { id: result.insertId, username, role };
  },

  verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },

  async updatePassword(id, newPassword, conn = pool) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const [result] = await conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [
      passwordHash,
      id,
    ]);
    return result.affectedRows > 0;
  },

  async getPasswordHash(id, conn = pool) {
    const [rows] = await conn.query('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? rows[0].password_hash : null;
  },

  async setActive(id, isActive, conn = pool) {
    await conn.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
  },

  async touchLastLogin(id, conn = pool) {
    await conn.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
  },

  async remove(id, conn = pool) {
    const [result] = await conn.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = User;
