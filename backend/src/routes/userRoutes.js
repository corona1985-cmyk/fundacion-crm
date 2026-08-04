const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validateMiddleware');

// Enforce admin access for all user management routes
router.use(verifyToken, checkRole('ADMINISTRADOR'));

router.get('/', UserController.list);
router.get('/:id', UserController.getById);
router.put('/:id', validate(schemas.updateUserSchema), UserController.update);
router.delete('/:id', UserController.delete);

module.exports = router;
