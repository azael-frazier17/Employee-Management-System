const router = require('express').Router();
const ctrl = require('../controllers/attendanceController');
const {
  authenticate,
  authorize,
  requireEmployeeProfile,
  requireClockInRole,
} = require('../middleware/authMiddleware');

router.use(authenticate);
const adminOnly = authorize('Admin');

// Own attendance (personal clock-in/out restricted to clock-in roles)
router.post('/time-in', requireClockInRole, requireEmployeeProfile, ctrl.timeIn);
router.post('/time-out', requireClockInRole, requireEmployeeProfile, ctrl.timeOut);
router.get('/today', requireEmployeeProfile, ctrl.today);
router.get('/my', requireEmployeeProfile, ctrl.myHistory);

// Admin
router.get('/reports/summary', adminOnly, ctrl.report);
router.post('/mark-absent', adminOnly, ctrl.markAbsent);
router.get('/', adminOnly, ctrl.list);
router.post('/', adminOnly, ctrl.create);
router.put('/:id', adminOnly, ctrl.update);
router.delete('/:id', adminOnly, ctrl.remove);

module.exports = router;
