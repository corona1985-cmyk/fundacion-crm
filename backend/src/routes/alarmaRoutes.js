const express = require('express');
const router = express.Router();
const AlarmaController = require('../controllers/alarmaController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', AlarmaController.list);
router.get('/resumen', AlarmaController.getSummary);
router.post('/evaluar', AlarmaController.evaluar);
router.put('/:id/atender', AlarmaController.atender);
router.put('/:id/descartar', AlarmaController.descartar);

module.exports = router;
