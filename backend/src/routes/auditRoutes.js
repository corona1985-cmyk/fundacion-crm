const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/auditController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Enforce admin access for audit log routes
router.use(verifyToken, checkRole('ADMINISTRADOR'));

router.get('/', AuditController.list);
router.get('/:id', AuditController.getById);

module.exports = router;
