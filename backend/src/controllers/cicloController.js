const { CicloAcademico, Universidad } = require('../models');
const AuditService = require('../services/auditService');

/**
 * Controller for CicloAcademico management
 */
class CicloController {
  static async list(req, res, next) {
    try {
      const { universidad_id } = req.query;
      const where = {};
      if (universidad_id) {
        where.universidad_id = universidad_id;
      }

      const ciclos = await CicloAcademico.findAll({
        where,
        include: [{ model: Universidad, as: 'universidad', attributes: ['id', 'nombre'] }],
        order: [['fecha_inicio', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: ciclos
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { universidad_id, nombre, fecha_inicio, fecha_fin, fecha_limite_pago, ciclo_actual } = req.body;

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

      if (ciclo_actual) {
        // Unset previous active cycles for this university
        await CicloAcademico.update(
          { ciclo_actual: false },
          { where: { universidad_id, ciclo_actual: true } }
        );
      }

      const ciclo = await CicloAcademico.create({
        universidad_id,
        nombre,
        fecha_inicio,
        fecha_fin,
        fecha_limite_pago,
        ciclo_actual: ciclo_actual || false
      });

      await AuditService.logCreate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'CicloAcademico',
        entidadId: ciclo.id,
        datosNuevos: ciclo.toJSON(),
        req
      });

      return res.status(201).json({
        success: true,
        message: 'Ciclo académico creado exitosamente',
        data: ciclo
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, fecha_inicio, fecha_fin, fecha_limite_pago, ciclo_actual } = req.body;

      const ciclo = await CicloAcademico.findByPk(id);
      if (!ciclo) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CICLO_NOT_FOUND',
            message: 'Ciclo académico no encontrado.'
          }
        });
      }

      const previousData = ciclo.toJSON();

      if (ciclo_actual) {
        await CicloAcademico.update(
          { ciclo_actual: false },
          { where: { universidad_id: ciclo.universidad_id, ciclo_actual: true } }
        );
      }

      if (nombre !== undefined) ciclo.nombre = nombre;
      if (fecha_inicio !== undefined) ciclo.fecha_inicio = fecha_inicio;
      if (fecha_fin !== undefined) ciclo.fecha_fin = fecha_fin;
      if (fecha_limite_pago !== undefined) ciclo.fecha_limite_pago = fecha_limite_pago;
      if (ciclo_actual !== undefined) ciclo.ciclo_actual = ciclo_actual;

      await ciclo.save();

      await AuditService.logUpdate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'CicloAcademico',
        entidadId: ciclo.id,
        datosPrevios: previousData,
        datosNuevos: ciclo.toJSON(),
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Ciclo académico actualizado exitosamente',
        data: ciclo
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CicloController;
