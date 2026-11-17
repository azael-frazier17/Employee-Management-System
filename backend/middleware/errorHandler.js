/** Error carrying an HTTP status code (and optional field-level details). */
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

/** Wraps an async route handler so rejected promises reach errorHandler. */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const notFound = (req, res, next) =>
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));

const DUPLICATE_MESSAGES = [
  ['uq_users_username', 'That username is already taken.'],
  ['uq_departments_name', 'A department with that name already exists.'],
  ['uq_positions_dept_title', 'That position already exists in this department.'],
  ['uq_employees_user', 'That user account is already linked to another employee.'],
  ['uq_employees_code', 'That employee code is already in use.'],
  ['uq_employees_email', 'That email address is already in use.'],
  ['uq_attendance_emp_date', 'An attendance record already exists for this employee on that date.'],
];

const duplicateMessage = (err) => {
  const text = err.sqlMessage || err.message || '';
  const hit = DUPLICATE_MESSAGES.find(([key]) => text.includes(key));
  return hit ? hit[1] : 'A record with the same unique value already exists.';
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  switch (err.code) {
    case 'ER_DUP_ENTRY':
      status = 409;
      message = duplicateMessage(err);
      break;
    case 'ER_ROW_IS_REFERENCED_2': // delete blocked by a foreign key
      status = 409;
      message = 'This record is still in use by other records and cannot be deleted.';
      break;
    case 'ER_NO_REFERENCED_ROW_2': // insert/update points to a missing parent
      status = 400;
      message = 'A referenced record (department, position, employee…) does not exist.';
      break;
    case 'ER_CHECK_CONSTRAINT_VIOLATED':
    case 'ER_CONSTRAINT_FAILED':
      status = 400;
      message = 'The submitted values violate a data rule (check dates and times).';
      break;
    case 'ER_DATA_TOO_LONG':
    case 'ER_TRUNCATED_WRONG_VALUE':
    case 'ER_WRONG_VALUE':
      status = 400;
      message = 'One of the submitted values is invalid or too long.';
      break;
    default:
  }

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON.';
  }

  const isProd = process.env.NODE_ENV === 'production';
  if (status >= 500) {
    console.error(err);
    if (isProd) message = 'Internal server error';
  }

  res.status(status).json({
    success: false,
    message,
    ...(err.details ? { errors: err.details } : {}),
    ...(!isProd && status >= 500 ? { stack: err.stack } : {}),
  });
};

module.exports = { HttpError, asyncHandler, notFound, errorHandler };
