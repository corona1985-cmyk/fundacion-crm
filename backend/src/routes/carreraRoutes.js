const express = require('express');
const router = express.Router();
const CarreraController = require('../controllers/carreraController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateMiddleware');

router.get('/', verifyToken, CarreraController.list);
router.get('/:id/materias', verifyToken, CarreraController.getMaterias);

router.post('/', verifyToken, checkRole('ADMINISTRADOR', 'COORDINADOR'), validate(schemas.createCarreraSchema), CarreraController.create);
router.post('/:id/materias', verifyToken, checkRole('ADMINISTRADOR', 'COORDINADOR'), validate(schemas.createMateriaSchema), CarreraController.addMateria);

module.exports = router;
