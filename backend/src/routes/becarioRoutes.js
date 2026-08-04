const express = require('express');
const router = express.Router();
const BecarioController = require('../controllers/becarioController');
const DocumentoController = require('../controllers/documentoController');
const BecarioPadrinoController = require('../controllers/becarioPadrinoController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateMiddleware');

// All Becario management routes require authentication
router.use(verifyToken);

router.get('/', BecarioController.list);
router.get('/:id', BecarioController.getById);
router.get('/:id/documentos', DocumentoController.listByBecario);

// Write endpoints require COORDINADOR or ADMINISTRADOR or FINANCIERO role
router.post('/', checkRole('ADMINISTRADOR', 'COORDINADOR'), validate(schemas.createBecarioSchema), BecarioController.create);
router.put('/:id', checkRole('ADMINISTRADOR', 'COORDINADOR'), validate(schemas.updateBecarioSchema), BecarioController.update);
router.delete('/:id', checkRole('ADMINISTRADOR', 'COORDINADOR'), BecarioController.delete);

router.post('/:id/materias', checkRole('ADMINISTRADOR', 'COORDINADOR'), validate(schemas.enrollMateriasSchema), BecarioController.enrollMaterias);
router.put('/:id/materias/:materia_id', checkRole('ADMINISTRADOR', 'COORDINADOR'), validate(schemas.updateCalificacionSchema), BecarioController.updateCalificacion);

// Student-Sponsor Assignment endpoints
router.post('/:id/asignar-padrino', checkRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO'), validate(schemas.assignPadrinoSchema), BecarioPadrinoController.assignPadrino);
router.put('/:id/padrinos/:padrino_id', checkRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO'), validate(schemas.updateBecarioPadrinoSchema), BecarioPadrinoController.updateAsignacion);
router.delete('/:id/padrinos/:padrino_id', checkRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO'), BecarioPadrinoController.unassignPadrino);

module.exports = router;
