const Department = require('../models/Department');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');
const { clean, toId, requireFields } = require('../utils/helpers');

const NAME_MAX = 100;

const checkLength = (value, max, label) => {
  if (value && value.length > max) throw new HttpError(400, `${label} must be at most ${max} characters.`);
};

/** Turns a foreign-key delete failure into a clear message. */
const guardDelete = async (fn, message) => {
  try {
    return await fn();
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') throw new HttpError(409, message);
    throw err;
  }
};

// ----------------------------- Departments -----------------------------
exports.list = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await Department.getAll() });
});

exports.getOne = asyncHandler(async (req, res) => {
  const dept = await Department.getById(toId(req.params.id));
  if (!dept) throw new HttpError(404, 'Department not found.');
  res.json({ success: true, data: dept });
});

exports.create = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name']);
  const name = clean(req.body.name);
  const description = clean(req.body.description) ?? null;
  checkLength(name, NAME_MAX, 'Name');
  checkLength(description, 255, 'Description');
  const dept = await Department.create({ name, description });
  res.status(201).json({ success: true, message: 'Department created.', data: dept });
});

exports.update = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  const data = {};
  if (req.body.name !== undefined) {
    requireFields(req.body, ['name']);
    data.name = clean(req.body.name);
    checkLength(data.name, NAME_MAX, 'Name');
  }
  if (req.body.description !== undefined) {
    data.description = clean(req.body.description);
    checkLength(data.description, 255, 'Description');
  }
  const dept = await Department.update(id, data);
  if (!dept) throw new HttpError(404, 'Department not found.');
  res.json({ success: true, message: 'Department updated.', data: dept });
});

exports.remove = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  const deleted = await guardDelete(
    () => Department.remove(id),
    'Cannot delete this department while employees are assigned to it. Reassign them first.'
  );
  if (!deleted) throw new HttpError(404, 'Department not found.');
  res.json({ success: true, message: 'Department deleted.' });
});

// ------------------------------ Positions ------------------------------
exports.listPositions = asyncHandler(async (req, res) => {
  const departmentId = req.query.department_id ? toId(req.query.department_id, 'department_id') : null;
  res.json({ success: true, data: await Department.getPositions(departmentId) });
});

exports.getPosition = asyncHandler(async (req, res) => {
  const pos = await Department.getPositionById(toId(req.params.id));
  if (!pos) throw new HttpError(404, 'Position not found.');
  res.json({ success: true, data: pos });
});

exports.createPosition = asyncHandler(async (req, res) => {
  requireFields(req.body, ['department_id', 'title']);
  const department_id = toId(req.body.department_id, 'department_id');
  const title = clean(req.body.title);
  const description = clean(req.body.description) ?? null;
  checkLength(title, NAME_MAX, 'Title');
  checkLength(description, 255, 'Description');
  if (!(await Department.getById(department_id))) throw new HttpError(404, 'Department not found.');
  const pos = await Department.createPosition({ department_id, title, description });
  res.status(201).json({ success: true, message: 'Position created.', data: pos });
});

exports.updatePosition = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  const data = {};
  if (req.body.department_id !== undefined) data.department_id = toId(req.body.department_id, 'department_id');
  if (req.body.title !== undefined) {
    requireFields(req.body, ['title']);
    data.title = clean(req.body.title);
    checkLength(data.title, NAME_MAX, 'Title');
  }
  if (req.body.description !== undefined) {
    data.description = clean(req.body.description);
    checkLength(data.description, 255, 'Description');
  }
  const pos = await Department.updatePosition(id, data);
  if (!pos) throw new HttpError(404, 'Position not found.');
  res.json({ success: true, message: 'Position updated.', data: pos });
});

exports.removePosition = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  const deleted = await guardDelete(
    () => Department.removePosition(id),
    'Cannot delete this position while employees hold it. Reassign them first.'
  );
  if (!deleted) throw new HttpError(404, 'Position not found.');
  res.json({ success: true, message: 'Position deleted.' });
});
