const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Shared MySQL connection pool.
 * - dateStrings: DATE/TIME/DATETIME columns come back as plain strings
 *   ("2026-11-17", "08:55:00") so they are never shifted by time zones.
 * - decimalNumbers: DECIMAL results (e.g. hours_worked) arrive as numbers, not strings.
 * - Use pool.query(sql, params) everywhere (client-side escaping) – it also
 *   avoids the LIMIT/OFFSET placeholder problems of prepared statements.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'employee_management',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
  queueLimit: 0,
  dateStrings: true,
  decimalNumbers: true,
  charset: 'utf8mb4',
});

/** Verifies the database is reachable (called once at server start-up). */
pool.testConnection = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
};

module.exports = pool;
