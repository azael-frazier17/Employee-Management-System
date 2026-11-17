const router = require('express').Router();
const ctrl = require('../controllers/attendanceController');
const { authenticate, authorize, requireEmployeeProfile } = require('../middleware/authMiddleware');

router.use(authenticate);
const adminOnly = authorize('Admin');

// Own attendance (needs a linked employee profile)
router.post('/time-in', requireEmployeeProfile, ctrl.timeIn);
router.post('/time-out', requireEmployeeProfile, ctrl.timeOut);
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
