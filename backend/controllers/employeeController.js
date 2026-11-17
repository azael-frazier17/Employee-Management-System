const Employee = require('../models/Employee');
const Department = require('../models/Department');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');
const {
  clean, toId, requireFields, assertOneOf, assertDate, assertPassword, assertUsername,
  isEmail, isBlank, parsePagination, paginationMeta,
} = require('../utils/helpers');

const STATUSES = ['Active', 'Inactive'];
const GENDERS = ['Male', 'Female', 'Other'];

/**
 * Validates + cleans the request body.
 * partial=true (PUT) only checks the fields that were sent.
 */
const parseBody = (body, { partial }) => {
  if (!partial) requireFields(body, ['first_name', 'last_name', 'email', 'date_hired']);

  const data = {};
  const text = { first_name: 60, last_name: 60, phone: 30, address: 255, employee_code: 20 };
  Object.entries(text).forEach(([field, max]) => {
    if (body[field] === undefined) return;
    const v = clean(body[field]);
    if ((field === 'first_name' || field === 'last_name') && !v) {
      throw new HttpError(400, `${field} cannot be empty.`);
    }
    if (v && v.length > max) throw new HttpError(400, `${field} must be at most ${max} characters.`);
    data[field] = v;
  });

  if (body.email !== undefined) {
    const email = clean(body.email);
    if (!isEmail(email)) throw new HttpError(400, 'A valid email address is required.');
    data.email = email.toLowerCase();
  }
  if (body.date_hired !== undefined) {
    assertDate(body.date_hired, 'date_hired');
    data.date_hired = body.date_hired;
  }
  if (body.birth_date !== undefined) {
    if (isBlank(body.birth_date)) data.birth_date = null;
    else {
      assertDate(body.birth_date, 'birth_date');
      data.birth_date = body.birth_date;
    }
  }
  if (body.gender !== undefined) {
    if (isBlank(body.gender)) data.gender = null;
    else {
      assertOneOf(body.gender, GENDERS, 'gender');
      data.gender = body.gender;
    }
  }
  if (body.status !== undefined) {
    assertOneOf(body.status, STATUSES, 'status');
    data.status = body.status;
  }
  ['department_id', 'position_id'].forEach((field) => {
    if (body[field] === undefined) return;
    data[field] = isBlank(body[field]) ? null : toId(body[field], field);
  });
  return data;
};

/** A position must belong to the selected department. */
const assertPositionMatchesDepartment = async (departmentId, positionId) => {
  if (departmentId) {
    const dept = await Department.getById(departmentId);
    if (!dept) throw new HttpError(400, 'Selected department does not exist.');
  }
  if (positionId) {
    const pos = await Department.getPositionById(positionId);
    if (!pos) throw new HttpError(400, 'Selected position does not exist.');
    if (departmentId && pos.department_id !== departmentId) {
      throw new HttpError(400, 'Selected position does not belong to the selected department.');
    }
  }
};

/** GET /api/employees?search=&department_id=&position_id=&status=&sort=&order=&page=&limit= */
exports.list = asyncHandler(async (req, res) => {
  const paging = parsePagination(req.query);
  const { status, search } = req.query;
  if (status) assertOneOf(status, STATUSES, 'status');

  const { rows, total } = await Employee.search({
    search: search ? String(search).trim() : undefined,
    department_id: req.query.department_id ? toId(req.query.department_id, 'department_id') : undefined,
    position_id: req.query.position_id ? toId(req.query.position_id, 'position_id') : undefined,
    status,
    sort: req.query.sort,
    order: req.query.order,
    limit: paging.limit,
    offset: paging.offset,
  });
  res.json({ success: true, data: rows, pagination: paginationMeta(total, paging) });
});

/** GET /api/employees/me – My Profile */
exports.me = asyncHandler(async (req, res) => {
  const employee = await Employee.findByUserId(req.user.id);
  if (!employee) throw new HttpError(404, 'No employee profile is linked to your account.');
  res.json({ success: true, data: employee });
});

/** GET /api/employees/:id – Admin, or the employee viewing their own record */
exports.getOne = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  if (req.user.role !== 'Admin' && req.user.employeeId !== id) {
    throw new HttpError(403, 'You can only view your own profile.');
  }
  const employee = await Employee.findById(id);
  if (!employee) throw new HttpError(404, 'Employee not found.');
  res.json({ success: true, data: employee });
});

/**
 * POST /api/employees
 * Optional username + password also creates the employee's login account.
 */
exports.create = asyncHandler(async (req, res) => {
  const data = parseBody(req.body, { partial: false });
  if (req.body.username !== undefined || req.body.password !== undefined) {
    requireFields(req.body, ['username', 'password']);
    assertUsername(req.body.username);
    assertPassword(req.body.password);
    data.username = req.body.username;
    data.password = req.body.password;
  }
  await assertPositionMatchesDepartment(data.department_id, data.position_id);

  const employee = await Employee.create(data);
  res.status(201).json({ success: true, message: 'Employee created.', data: employee });
});

/** PUT /api/employees/:id */
exports.update = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  const existing = await Employee.findById(id);
  if (!existing) throw new HttpError(404, 'Employee not found.');

  const data = parseBody(req.body, { partial: true });
  if (existing.user_id === req.user.id && data.status === 'Inactive') {
    throw new HttpError(400, 'You cannot deactivate your own account.');
  }

  const departmentId = data.department_id !== undefined ? data.department_id : existing.department_id;
  const positionId = data.position_id !== undefined ? data.position_id : existing.position_id;
  // Changing the department without picking a new position clears the old one.
  if (data.department_id !== undefined && data.position_id === undefined && positionId) {
    const pos = await Department.getPositionById(positionId);
    if (pos && pos.department_id !== departmentId) data.position_id = null;
  }
  await assertPositionMatchesDepartment(departmentId, data.position_id !== undefined ? data.position_id : positionId);

  const updated = await Employee.update(id, data);
  res.json({ success: true, message: 'Employee updated.', data: updated });
});

/** DELETE /api/employees/:id */
exports.remove = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  if (req.user.employeeId === id) throw new HttpError(400, 'You cannot delete your own employee record.');
  const deleted = await Employee.remove(id);
  if (!deleted) throw new HttpError(404, 'Employee not found.');
  res.json({ success: true, message: 'Employee deleted (attendance and leave records removed).' });
});

/** POST /api/employees/:id/account { username, password } – create a login for an employee */
exports.createAccount = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  requireFields(req.body, ['username', 'password']);
  assertUsername(req.body.username);
  assertPassword(req.body.password);
  const employee = await Employee.createAccount(id, req.body);
  res.status(201).json({ success: true, message: 'Login account created.', data: employee });
});

/** PATCH /api/employees/:id/password { new_password } – admin reset */
exports.resetPassword = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  requireFields(req.body, ['new_password']);
  assertPassword(req.body.new_password);
  await Employee.resetPassword(id, req.body.new_password);
  res.json({ success: true, message: 'Password reset.' });
});

/** GET /api/employees/reports/summary – headcount report */
exports.report = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await Employee.getReport() });
});
