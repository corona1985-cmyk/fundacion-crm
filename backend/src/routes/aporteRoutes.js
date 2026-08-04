const express = require('express');
const router = express.Router();
const AporteController = require('../controllers/aporteController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateMiddleware');

router.use(verifyToken);

router.get('/', AporteController.list);
router.put('/:id', checkRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO'), validate(schemas.updateAporteSchema), AporteController.update);
router.delete('/:id', checkRole('ADMINISTRADOR'), AporteController.delete);

module.exports = router;
