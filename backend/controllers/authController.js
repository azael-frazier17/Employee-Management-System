const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');
const { requireFields, assertOneOf, assertPassword, assertUsername } = require('../utils/helpers');

// Used to keep response time similar whether or not the username exists.
const DUMMY_HASH = '$2a$10$Pwa.trXRmMfdhAiQo0Rmh.jmXyTL92S2W1AvKUDcIVm6bc.Ri4TPe';

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

/** POST /api/auth/login  { username, password } */
exports.login = asyncHandler(async (req, res) => {
  requireFields(req.body, ['username', 'password']);
  const { username, password } = req.body;

  const user = await User.findByUsername(String(username).trim());
  const valid = await User.verifyPassword(String(password), user ? user.password_hash : DUMMY_HASH);
  if (!user || !valid) throw new HttpError(401, 'Invalid username or password.');
  if (!user.is_active) throw new HttpError(403, 'This account is deactivated. Please contact HR.');

  await User.touchLastLogin(user.id);
  const employee = await Employee.findByUserId(user.id);

  res.json({
    success: true,
    message: 'Login successful.',
    data: {
      token: signToken(user),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        employeeId: employee ? employee.id : null,
        fullName: employee ? employee.full_name : user.username,
      },
    },
  });
});

/** GET /api/auth/me  – current account + linked employee profile */
exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const employee = await Employee.findByUserId(req.user.id);
  res.json({ success: true, data: { user, employee } });
});

/** PUT /api/auth/change-password  { current_password, new_password } */
exports.changePassword = asyncHandler(async (req, res) => {
  requireFields(req.body, ['current_password', 'new_password']);
  assertPassword(req.body.new_password);

  const hash = await User.getPasswordHash(req.user.id);
  if (!(await User.verifyPassword(String(req.body.current_password), hash))) {
    throw new HttpError(400, 'Current password is incorrect.');
  }
  await User.updatePassword(req.user.id, req.body.new_password);
  res.json({ success: true, message: 'Password updated.' });
});

/** POST /api/auth/register (Admin) { username, password, role } – e.g. to add another HR admin */
exports.register = asyncHandler(async (req, res) => {
  requireFields(req.body, ['username', 'password']);
  const role = req.body.role || 'Employee';
  assertOneOf(role, ['Admin', 'Employee'], 'role');
  assertUsername(req.body.username);
  assertPassword(req.body.password);

  const user = await User.create({ username: req.body.username, password: req.body.password, role });
  res.status(201).json({ success: true, message: 'Account created.', data: user });
});
