const express = require('express');
const router = express.Router();
const DocumentoController = require('../controllers/documentoController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(verifyToken);

router.post('/upload', checkRole('ADMINISTRADOR', 'COORDINADOR'), upload.single('archivo'), DocumentoController.upload);
router.post('/', checkRole('ADMINISTRADOR', 'COORDINADOR'), upload.single('archivo'), DocumentoController.upload);
router.get('/becario/:becario_id', DocumentoController.listByBecario);
router.get('/:id', DocumentoController.getById);
router.delete('/:id', checkRole('ADMINISTRADOR', 'COORDINADOR'), DocumentoController.delete);

module.exports = router;
