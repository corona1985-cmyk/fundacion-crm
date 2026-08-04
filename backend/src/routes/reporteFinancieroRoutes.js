const express = require('express');
const router = express.Router();
const ReporteFinancieroController = require('../controllers/reporteFinancieroController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/resumen', ReporteFinancieroController.getResumen);
router.get('/cuentas-cobrar', ReporteFinancieroController.getCuentasPorCobrar);
router.get('/cuentas-pagar', ReporteFinancieroController.getCuentasPorPagar);
router.get('/evolucion', ReporteFinancieroController.getEvolucion);

module.exports = router;
