const { Universidad, Carrera } = require('../models');
const AuditService = require('../services/auditService');

/**
 * Controller for Universidad catalog management
 */
class UniversidadController {
  static async list(req, res, next) {
    try {
      const universidades = await Universidad.findAll({
        order: [['nombre', 'ASC']]
      });

      return res.status(200).json({
        success: true,
        data: universidades
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { nombre, direccion, telefono, email_contacto } = req.body;

      const universidad = await Universidad.create({
        nombre,
        direccion,
        telefono,
        email_contacto
      });

      await AuditService.logCreate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Universidad',
        entidadId: universidad.id,
        datosNuevos: universidad.toJSON(),
        req
      });

      return res.status(201).json({
        success: true,
        message: 'Universidad creada exitosamente',
        data: universidad
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCarreras(req, res, next) {
    try {
      const { id } = req.params;

      const carreras = await Carrera.findAll({
        where: { universidad_id: id },
        order: [['nombre', 'ASC']]
      });

      return res.status(200).json({
        success: true,
        data: carreras
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UniversidadController;
