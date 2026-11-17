const router = require('express').Router();
const ctrl = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);
const adminOnly = authorize('Admin');

// Fixed paths first
router.get('/me', ctrl.me); // My Profile (any logged-in user)
router.get('/reports/summary', adminOnly, ctrl.report);

router.get('/', adminOnly, ctrl.list);
router.post('/', adminOnly, ctrl.create);

router.get('/:id', ctrl.getOne); // Admin, or the owner (checked in controller)
router.put('/:id', adminOnly, ctrl.update);
router.delete('/:id', adminOnly, ctrl.remove);
router.post('/:id/account', adminOnly, ctrl.createAccount);
router.patch('/:id/password', adminOnly, ctrl.resetPassword);

module.exports = router;
