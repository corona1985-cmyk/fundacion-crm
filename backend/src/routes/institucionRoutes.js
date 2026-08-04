const express = require('express');
const router = express.Router();
const InstitucionController = require('../controllers/institucionController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateMiddleware');

router.use(verifyToken);

router.get('/', InstitucionController.list);

router.post('/', checkRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO'), validate(schemas.createInstitucionSchema), InstitucionController.create);
router.put('/:id', checkRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO'), validate(schemas.updateInstitucionSchema), InstitucionController.update);
router.delete('/:id', checkRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO'), InstitucionController.delete);

router.post('/:id/aportes', checkRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO'), validate(schemas.createAporteSubSchema), InstitucionController.createAporte);

module.exports = router;
