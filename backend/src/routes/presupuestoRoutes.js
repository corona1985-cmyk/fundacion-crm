const express = require('express');
const router = express.Router();
const PresupuestoController = require('../controllers/presupuestoController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateMiddleware');

router.use(verifyToken);

router.get('/', PresupuestoController.list);
router.get('/ejecucion', PresupuestoController.getEjecucion);

router.post('/', checkRole('ADMINISTRADOR', 'FINANCIERO'), validate(schemas.createPresupuestoSchema), PresupuestoController.create);
router.put('/:id', checkRole('ADMINISTRADOR', 'FINANCIERO'), validate(schemas.updatePresupuestoSchema), PresupuestoController.update);

module.exports = router;
