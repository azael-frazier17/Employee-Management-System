const { HttpError } = require('../middleware/errorHandler');

const pad = (n) => String(n).padStart(2, '0');

/** Local date as YYYY-MM-DD. */
const formatDate = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Local time as HH:MM:SS. */
const formatTime = (d = new Date()) =>
  `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

/** First and last day of the current month. */
const currentMonthRange = () => {
  const now = new Date();
  return {
    from: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

const isValidDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

const isValidTime = (value) =>
  typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);

/** "08:30" -> "08:30:00" */
const normalizeTime = (value) => (value && value.length === 5 ? `${value}:00` : value);

const isEmail = (value) =>
  typeof value === 'string' && value.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** Trims strings; turns '' into null so optional columns stay clean. */
const clean = (v) => (typeof v === 'string' ? v.trim() || null : v);

/** Parses a positive integer id from a route param / body field. */
const toId = (value, label = 'id') => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `Invalid ${label}.`);
  return n;
};

/** Throws 400 with a list of the missing required fields. */
const requireFields = (body, fields) => {
  const missing = fields.filter((f) => isBlank(body[f]));
  if (missing.length) {
    throw new HttpError(400, `Missing required field(s): ${missing.join(', ')}`, { missing });
  }
};

/** Throws 400 if value is not one of the allowed enum values. */
const assertOneOf = (value, allowed, label) => {
  if (!allowed.includes(value)) {
    throw new HttpError(400, `${label} must be one of: ${allowed.join(', ')}`);
  }
};

const assertDate = (value, label) => {
  if (!isValidDate(value)) throw new HttpError(400, `${label} must be a valid date (YYYY-MM-DD).`);
};

const assertPassword = (value) => {
  if (typeof value !== 'string' || value.length < 8 || value.length > 72) {
    throw new HttpError(400, 'Password must be between 8 and 72 characters.');
  }
};

const assertUsername = (value) => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9._-]{3,50}$/.test(value)) {
    throw new HttpError(
      400,
      'Username must be 3-50 characters (letters, numbers, dot, underscore, hyphen).'
    );
  }
};

/** page / limit from a query string (limit capped at 100). */
const parsePagination = (query, defaultLimit = 20) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
};

const paginationMeta = (total, { page, limit }) => ({
  total,
  page,
  limit,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

/** Validates optional ?from=&to= query values; returns them (or defaults). */
const parseDateRange = (query, defaults = {}) => {
  const from = query.from || defaults.from;
  const to = query.to || defaults.to;
  if (from) assertDate(from, 'from');
  if (to) assertDate(to, 'to');
  if (from && to && from > to) throw new HttpError(400, '"from" must not be after "to".');
  return { from, to };
};

module.exports = {
  formatDate,
  formatTime,
  currentMonthRange,
  isValidDate,
  isValidTime,
  normalizeTime,
  isEmail,
  isBlank,
  clean,
  toId,
  requireFields,
  assertOneOf,
  assertDate,
  assertPassword,
  assertUsername,
  parsePagination,
  paginationMeta,
  parseDateRange,
};
