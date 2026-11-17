const router = require('express').Router();
const ctrl = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);
const adminOnly = authorize('Admin');

// Positions (declared before "/:id" so "positions" is not read as an id)
router.get('/positions', ctrl.listPositions);
router.post('/positions', adminOnly, ctrl.createPosition);
router.get('/positions/:id', ctrl.getPosition);
router.put('/positions/:id', adminOnly, ctrl.updatePosition);
router.delete('/positions/:id', adminOnly, ctrl.removePosition);

// Departments
router.get('/', ctrl.list);
router.post('/', adminOnly, ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', adminOnly, ctrl.update);
router.delete('/:id', adminOnly, ctrl.remove);

module.exports = router;
