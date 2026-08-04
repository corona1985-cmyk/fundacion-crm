const express = require('express');
const router = express.Router();
const PadrinoController = require('../controllers/padrinoController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateMiddleware');

router.use(verifyToken);

router.get('/', PadrinoController.list);
router.get('/:id', PadrinoController.getById);
router.get('/:id/aportes', PadrinoController.getAportes);

// Write endpoints require FINANCIERO, COORDINADOR, or ADMINISTRADOR role
router.post('/', checkRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO'), validate(schemas.createPadrinoSchema), PadrinoController.create);
router.put('/:id', checkRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO'), validate(schemas.updatePadrinoSchema), PadrinoController.update);
router.delete('/:id', checkRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO'), PadrinoController.delete);

router.post('/:id/aportes', checkRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO'), validate(schemas.createAporteSubSchema), PadrinoController.createAporte);

module.exports = router;
