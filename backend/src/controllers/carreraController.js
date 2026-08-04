const { Carrera, Universidad, Materia } = require('../models');
const AuditService = require('../services/auditService');

/**
 * Controller for Carrera & Materia catalog management
 */
class CarreraController {
  static async list(req, res, next) {
    try {
      const { universidad_id } = req.query;
      const where = {};
      if (universidad_id) {
        where.universidad_id = universidad_id;
      }

      const carreras = await Carrera.findAll({
        where,
        include: [{ model: Universidad, as: 'universidad', attributes: ['id', 'nombre'] }],
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

  static async create(req, res, next) {
    try {
      const { universidad_id, nombre, duracion_ciclos } = req.body;

      const universidad = await Universidad.findByPk(universidad_id);
      if (!universidad) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'UNIVERSIDAD_NOT_FOUND',
            message: 'La universidad especificada no existe.'
          }
        });
      }

      const carrera = await Carrera.create({
        universidad_id,
        nombre,
        duracion_ciclos
      });

      await AuditService.logCreate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Carrera',
        entidadId: carrera.id,
        datosNuevos: carrera.toJSON(),
        req
      });

      return res.status(201).json({
        success: true,
        message: 'Carrera creada exitosamente',
        data: carrera
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMaterias(req, res, next) {
    try {
      const { id } = req.params;

      const materias = await Materia.findAll({
        where: { carrera_id: id },
        order: [['nivel', 'ASC'], ['codigo', 'ASC']]
      });

      return res.status(200).json({
        success: true,
        data: materias
      });
    } catch (error) {
      next(error);
    }
  }

  static async addMateria(req, res, next) {
    try {
      const { id } = req.params;
      const { codigo, nombre, creditos, nivel } = req.body;

      const carrera = await Carrera.findByPk(id);
      if (!carrera) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CARRERA_NOT_FOUND',
            message: 'La carrera especificada no existe.'
          }
        });
      }

      const materia = await Materia.create({
        carrera_id: id,
        codigo,
        nombre,
        creditos,
        nivel
      });

      await AuditService.logCreate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Materia',
        entidadId: materia.id,
        datosNuevos: materia.toJSON(),
        req
      });

      return res.status(201).json({
        success: true,
        message: 'Materia agregada al pensum exitosamente',
        data: materia
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CarreraController;
