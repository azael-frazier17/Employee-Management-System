const router = require('express').Router();
const ctrl = require('../controllers/leaveController');
const { authenticate, authorize, requireEmployeeProfile } = require('../middleware/authMiddleware');

router.use(authenticate);
const adminOnly = authorize('Admin');

// Employee
router.post('/', requireEmployeeProfile, ctrl.create);
router.get('/my', requireEmployeeProfile, ctrl.myLeaves);

// Admin (fixed paths before "/:id")
router.get('/reports/summary', adminOnly, ctrl.report);
router.get('/', adminOnly, ctrl.list);
router.patch('/:id/status', adminOnly, ctrl.updateStatus);

// Shared / owner-scoped
router.get('/:id', ctrl.getOne); // Admin, or the owner (checked in controller)
router.delete('/:id', requireEmployeeProfile, ctrl.cancel); // cancel own Pending request

module.exports = router;
