const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { HttpError, asyncHandler } = require('./errorHandler');

/**
 * Verifies the "Authorization: Bearer <token>" header, then reloads the user
 * from the database so deactivated accounts and role changes take effect
 * immediately. Sets req.user = { id, username, role, employeeId }.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Authentication required. Please log in.');
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new HttpError(
      401,
      err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid token.'
    );
  }

  const user = await User.findAuthContext(payload.id);
  if (!user || !user.is_active) {
    throw new HttpError(401, 'Account not found or deactivated.');
  }

  req.user = {
    id: user.id,
    username: user.username,
    role: user.role,
    employeeId: user.employee_id || null,
  };
  next();
});

/** Role guard: authorize('Admin') or authorize('Admin', 'Employee'). */
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new HttpError(401, 'Authentication required.'));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission to perform this action.'));
    }
    return next();
  };

/** Requires the logged-in user to be linked to an employee record. */
const requireEmployeeProfile = (req, res, next) => {
  if (!req.user || !req.user.employeeId) {
    return next(new HttpError(403, 'Your account is not linked to an employee profile.'));
  }
  return next();
};

const NON_CLOCK_IN_ROLES = new Set(['admin', 'hr', 'manager']);

/** Rejects admin/management roles from personal clock-in/clock-out endpoints. */
const requireClockInRole = (req, res, next) => {
  if (!req.user) return next(new HttpError(401, 'Authentication required.'));
  const role = String(req.user.role || '').trim().toLowerCase();
  if (NON_CLOCK_IN_ROLES.has(role)) {
    return next(new HttpError(403, 'Admins cannot clock in.'));
  }
  return next();
};

module.exports = { authenticate, authorize, requireEmployeeProfile, requireClockInRole };
