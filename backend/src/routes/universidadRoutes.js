const express = require('express');
const router = express.Router();
const UniversidadController = require('../controllers/universidadController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateMiddleware');

// Public catalog view for authenticated users
router.get('/', verifyToken, UniversidadController.list);
router.get('/:id/carreras', verifyToken, UniversidadController.getCarreras);

// Admin/Coordinador create endpoint
router.post('/', verifyToken, checkRole('ADMINISTRADOR', 'COORDINADOR'), validate(schemas.createUniversidadSchema), UniversidadController.create);

module.exports = router;
