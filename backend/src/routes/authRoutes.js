const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateMiddleware');
const { loginLimiter } = require('../middlewares/rateLimit');

// Public login route with rate limiting
router.post('/login', loginLimiter, validate(schemas.loginSchema), AuthController.login);

// Admin-only register user route
router.post('/register', verifyToken, checkRole('ADMINISTRADOR'), validate(schemas.registerSchema), AuthController.register);

// Profile routes (Authenticated users)
router.get('/me', verifyToken, AuthController.me);
router.put('/me', verifyToken, validate(schemas.updateProfileSchema), AuthController.updateMe);
router.post('/logout', verifyToken, AuthController.logout);

module.exports = router;
