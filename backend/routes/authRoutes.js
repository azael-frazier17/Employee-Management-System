const router = require('express').Router();
const auth = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/login', auth.login);
router.get('/me', authenticate, auth.me);
router.put('/change-password', authenticate, auth.changePassword);
router.post('/register', authenticate, authorize('Admin'), auth.register);

module.exports = router;
