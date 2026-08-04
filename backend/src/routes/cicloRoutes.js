const express = require('express');
const router = express.Router();
const CicloController = require('../controllers/cicloController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateMiddleware');

router.get('/', verifyToken, CicloController.list);

router.post('/', verifyToken, checkRole('ADMINISTRADOR', 'COORDINADOR'), validate(schemas.createCicloSchema), CicloController.create);
router.put('/:id', verifyToken, checkRole('ADMINISTRADOR', 'COORDINADOR'), CicloController.update);

module.exports = router;
