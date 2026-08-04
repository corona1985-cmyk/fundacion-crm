const express = require('express');
const router = express.Router();
const ReporteExportController = require('../controllers/reporteExportController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/excel', ReporteExportController.exportExcel);
router.get('/pdf', ReporteExportController.exportPdf);

module.exports = router;
