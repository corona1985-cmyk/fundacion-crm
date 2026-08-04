const express = require('express');
const router = express.Router();
const PagoController = require('../controllers/pagoController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateMiddleware');

router.use(verifyToken);

router.get('/', PagoController.list);
router.get('/vencidos', PagoController.getOverdue);
router.get('/:id', PagoController.getById);

// Write operations require FINANCIERO or ADMINISTRADOR role
router.post('/', checkRole('ADMINISTRADOR', 'FINANCIERO'), validate(schemas.createPagoSchema), PagoController.create);
router.put('/:id', checkRole('ADMINISTRADOR', 'FINANCIERO'), validate(schemas.updatePagoSchema), PagoController.update);
router.post('/:id/marcar-pagado', checkRole('ADMINISTRADOR', 'FINANCIERO'), validate(schemas.marcarPagadoSchema), PagoController.marcarPagado);
router.delete('/:id', checkRole('ADMINISTRADOR'), PagoController.delete);

module.exports = router;
