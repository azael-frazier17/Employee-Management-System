const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');
const {
  clean, toId, requireFields, assertOneOf, assertDate, isValidTime, normalizeTime, isBlank,
  parsePagination, paginationMeta, parseDateRange, formatDate, currentMonthRange,
} = require('../utils/helpers');

const STATUSES = ['Present', 'Late', 'Absent'];

const parseTime = (value, label) => {
  if (isBlank(value)) return null;
  if (!isValidTime(value)) throw new HttpError(400, `${label} must be a time (HH:MM or HH:MM:SS).`);
  return normalizeTime(value);
};

const assertTimeOrder = (timeIn, timeOut) => {
  if (timeIn && timeOut && timeOut < timeIn) {
    throw new HttpError(400, 'time_out cannot be earlier than time_in.');
  }
};

const historyFilters = (query) => {
  if (query.status) assertOneOf(query.status, STATUSES, 'status');
  const { from, to } = parseDateRange(query);
  return { status: query.status, from, to };
};

// ------------------------------ Employee ------------------------------

/** POST /api/attendance/time-in – clocks in the logged-in employee (server time). */
exports.timeIn = asyncHandler(async (req, res) => {
  const record = await Attendance.timeIn(req.user.employeeId);
  res.status(201).json({
    success: true,
    message: record.status === 'Late' ? 'Timed in (marked Late).' : 'Timed in successfully.',
    data: record,
  });
});

/** POST /api/attendance/time-out */
exports.timeOut = asyncHandler(async (req, res) => {
  const record = await Attendance.timeOut(req.user.employeeId);
  res.json({ success: true, message: 'Timed out successfully.', data: record });
});

/** GET /api/attendance/today – today's record for the logged-in employee (null if none) */
exports.today = asyncHandler(async (req, res) => {
  const date = formatDate();
  const record = await Attendance.findByEmployeeAndDate(req.user.employeeId, date);
  res.json({ success: true, data: { date, record } });
});

/** GET /api/attendance/my?status=&from=&to=&page=&limit= – own history (My Profile) */
exports.myHistory = asyncHandler(async (req, res) => {
  const paging = parsePagination(req.query, 31);
  const { rows, total } = await Attendance.findByEmployee(req.user.employeeId, historyFilters(req.query), paging);
  res.json({ success: true, data: rows, pagination: paginationMeta(total, paging) });
});

// -------------------------------- Admin --------------------------------

/** GET /api/attendance?employee_id=&department_id=&status=&from=&to=&search=&page=&limit= */
exports.list = asyncHandler(async (req, res) => {
  const paging = parsePagination(req.query, 20);
  const filters = {
    ...historyFilters(req.query),
    employee_id: req.query.employee_id ? toId(req.query.employee_id, 'employee_id') : undefined,
    department_id: req.query.department_id ? toId(req.query.department_id, 'department_id') : undefined,
    search: req.query.search ? String(req.query.search).trim() : undefined,
  };
  const { rows, total } = await Attendance.findAll(filters, paging);
  res.json({ success: true, data: rows, pagination: paginationMeta(total, paging) });
});

/** POST /api/attendance – manual entry / overwrite for one employee + date */
exports.create = asyncHandler(async (req, res) => {
  requireFields(req.body, ['employee_id', 'attendance_date']);
  const employee_id = toId(req.body.employee_id, 'employee_id');
  assertDate(req.body.attendance_date, 'attendance_date');
  if (req.body.status) assertOneOf(req.body.status, STATUSES, 'status');
  const time_in = parseTime(req.body.time_in, 'time_in');
  const time_out = parseTime(req.body.time_out, 'time_out');
  assertTimeOrder(time_in, time_out);

  if (!(await Employee.findById(employee_id))) throw new HttpError(404, 'Employee not found.');

  const record = await Attendance.manualRecord({
    employee_id,
    attendance_date: req.body.attendance_date,
    time_in,
    time_out,
    status: req.body.status,
    remarks: clean(req.body.remarks) ?? null,
  });
  res.status(201).json({ success: true, message: 'Attendance saved.', data: record });
});

/** PUT /api/attendance/:id */
exports.update = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  const data = {};
  if (req.body.time_in !== undefined) data.time_in = parseTime(req.body.time_in, 'time_in');
  if (req.body.time_out !== undefined) data.time_out = parseTime(req.body.time_out, 'time_out');
  if (req.body.status !== undefined) {
    assertOneOf(req.body.status, STATUSES, 'status');
    data.status = req.body.status;
  }
  if (req.body.remarks !== undefined) data.remarks = clean(req.body.remarks);
  assertTimeOrder(data.time_in, data.time_out);

  const record = await Attendance.update(id, data);
  if (!record) throw new HttpError(404, 'Attendance record not found.');
  res.json({ success: true, message: 'Attendance updated.', data: record });
});

/** DELETE /api/attendance/:id */
exports.remove = asyncHandler(async (req, res) => {
  if (!(await Attendance.remove(toId(req.params.id)))) {
    throw new HttpError(404, 'Attendance record not found.');
  }
  res.json({ success: true, message: 'Attendance record deleted.' });
});

/** POST /api/attendance/mark-absent { date?, department_id? } – flags no-shows as Absent */
exports.markAbsent = asyncHandler(async (req, res) => {
  const date = req.body.date || formatDate();
  assertDate(date, 'date');
  if (date > formatDate()) throw new HttpError(400, 'Cannot mark absences for a future date.');
  const departmentId = req.body.department_id ? toId(req.body.department_id, 'department_id') : null;

  const marked = await Attendance.markAbsentees(date, departmentId);
  res.json({
    success: true,
    message: `${marked} employee(s) marked Absent for ${date}.`,
    data: { date, marked },
  });
});

/** GET /api/attendance/reports/summary?from=&to=&department_id= (defaults: this month so far) */
exports.report = asyncHandler(async (req, res) => {
  const month = currentMonthRange();
  const { from, to } = parseDateRange(req.query, { from: month.from, to: formatDate() });
  const departmentId = req.query.department_id ? toId(req.query.department_id, 'department_id') : null;
  res.json({ success: true, data: await Attendance.getSummary({ from, to, department_id: departmentId }) });
});
