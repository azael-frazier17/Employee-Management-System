const Leave = require('../models/Leave');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');
const {
  clean, toId, requireFields, assertOneOf, assertDate,
  parsePagination, paginationMeta, parseDateRange, currentMonthRange,
} = require('../utils/helpers');

const TYPES = ['Vacation', 'Sick', 'Emergency', 'Maternity', 'Paternity', 'Other'];
const STATUSES = ['Pending', 'Approved', 'Rejected'];

const listFilters = (query) => {
  if (query.status) assertOneOf(query.status, STATUSES, 'status');
  if (query.leave_type) assertOneOf(query.leave_type, TYPES, 'leave_type');
  const { from, to } = parseDateRange(query);
  return { status: query.status, leave_type: query.leave_type, from, to };
};

// ------------------------------ Employee ------------------------------

/** POST /api/leaves { leave_type, start_date, end_date, reason } */
exports.create = asyncHandler(async (req, res) => {
  requireFields(req.body, ['leave_type', 'start_date', 'end_date', 'reason']);
  assertOneOf(req.body.leave_type, TYPES, 'leave_type');
  assertDate(req.body.start_date, 'start_date');
  assertDate(req.body.end_date, 'end_date');
  if (req.body.end_date < req.body.start_date) {
    throw new HttpError(400, 'end_date cannot be before start_date.');
  }
  const reason = clean(req.body.reason);
  if (!reason) throw new HttpError(400, 'reason is required.');
  if (reason.length > 500) throw new HttpError(400, 'reason must be at most 500 characters.');

  const leave = await Leave.create({
    employee_id: req.user.employeeId,
    leave_type: req.body.leave_type,
    start_date: req.body.start_date,
    end_date: req.body.end_date,
    reason,
  });
  res.status(201).json({ success: true, message: 'Leave request submitted.', data: leave });
});

/** GET /api/leaves/my?status=&leave_type=&from=&to=&page=&limit= – own requests + status */
exports.myLeaves = asyncHandler(async (req, res) => {
  const paging = parsePagination(req.query, 20);
  const { rows, total } = await Leave.findByEmployee(req.user.employeeId, listFilters(req.query), paging);
  res.json({ success: true, data: rows, pagination: paginationMeta(total, paging) });
});

/** DELETE /api/leaves/:id – employee cancels their own Pending request */
exports.cancel = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  if (await Leave.cancel(id, req.user.employeeId)) {
    return res.json({ success: true, message: 'Leave request cancelled.' });
  }
  const leave = await Leave.findById(id);
  if (!leave || leave.employee_id !== req.user.employeeId) throw new HttpError(404, 'Leave request not found.');
  throw new HttpError(409, `Only pending requests can be cancelled (this one is ${leave.status.toLowerCase()}).`);
});

/** GET /api/leaves/:id – Admin or the request's owner */
exports.getOne = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(toId(req.params.id));
  if (!leave || (req.user.role !== 'Admin' && leave.employee_id !== req.user.employeeId)) {
    throw new HttpError(404, 'Leave request not found.');
  }
  res.json({ success: true, data: leave });
});

// -------------------------------- Admin --------------------------------

/** GET /api/leaves?status=&employee_id=&department_id=&leave_type=&from=&to=&search=&page=&limit= */
exports.list = asyncHandler(async (req, res) => {
  const paging = parsePagination(req.query, 20);
  const filters = {
    ...listFilters(req.query),
    employee_id: req.query.employee_id ? toId(req.query.employee_id, 'employee_id') : undefined,
    department_id: req.query.department_id ? toId(req.query.department_id, 'department_id') : undefined,
    search: req.query.search ? String(req.query.search).trim() : undefined,
  };
  const { rows, total } = await Leave.findAll(filters, paging);
  res.json({ success: true, data: rows, pagination: paginationMeta(total, paging) });
});

/** PATCH /api/leaves/:id/status { status: "Approved"|"Rejected", admin_remarks? } */
exports.updateStatus = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  requireFields(req.body, ['status']);
  assertOneOf(req.body.status, ['Approved', 'Rejected'], 'status');
  const remarks = clean(req.body.admin_remarks) ?? null;
  if (remarks && remarks.length > 255) throw new HttpError(400, 'admin_remarks must be at most 255 characters.');

  const existing = await Leave.findById(id);
  if (!existing) throw new HttpError(404, 'Leave request not found.');
  if (existing.employee_id === req.user.employeeId) {
    throw new HttpError(403, 'You cannot approve or reject your own leave request.');
  }

  const leave = await Leave.updateStatus(id, req.body.status, req.user.id, remarks);
  res.json({ success: true, message: `Leave request ${req.body.status.toLowerCase()}.`, data: leave });
});

/** GET /api/leaves/reports/summary?from=&to=&department_id= (default: current month) */
exports.report = asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req.query, currentMonthRange());
  const departmentId = req.query.department_id ? toId(req.query.department_id, 'department_id') : null;
  res.json({ success: true, data: await Leave.getSummary({ from, to, department_id: departmentId }) });
});
