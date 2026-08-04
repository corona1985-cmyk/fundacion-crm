const rateLimit = require('express-rate-limit');

/**
 * Rate limiter middleware for login route to prevent brute-force attacks
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiados intentos de inicio de sesión. Por favor, intente nuevamente en 15 minutos.'
    }
  }
});

module.exports = {
  loginLimiter
};
