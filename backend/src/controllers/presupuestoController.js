const { Presupuesto } = require('../models');
const PresupuestoService = require('../services/presupuestoService');
const AuditService = require('../services/auditService');

/**
 * Controller for Budget Allocation & Execution Management
 */
class PresupuestoController {
  /**
   * GET /presupuesto
   * List budgets with optional year/month/category filters
   */
  static async list(req, res, next) {
    try {
      const { anio, mes, categoria } = req.query;

      const where = {};
      if (anio) where.anio = parseInt(anio, 10);
      if (mes) where.mes = parseInt(mes, 10);
      if (categoria) where.categoria = categoria;

      const presupuestos = await Presupuesto.findAll({
        where,
        order: [['anio', 'DESC'], ['mes', 'DESC'], ['categoria', 'ASC']]
      });

      return res.status(200).json({
        success: true,
        data: presupuestos
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /presupuesto
   * Allocate new budget for a category, year, and month
   */
  static async create(req, res, next) {
    try {
      const { categoria, monto_asignado, anio, mes, observaciones } = req.body;

      const [presupuesto, created] = await Presupuesto.findOrCreate({
        where: { categoria, anio, mes },
        defaults: {
          monto_asignado,
          monto_ejecutado: 0.00,
          observaciones
        }
      });

      if (!created) {
        presupuesto.monto_asignado = monto_asignado;
        if (observaciones) presupuesto.observaciones = observaciones;
        await presupuesto.save();
      }

      await AuditService.logCreate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Presupuesto',
        entidadId: presupuesto.id,
        datosNuevos: presupuesto.toJSON(),
        req
      });

      return res.status(created ? 201 : 200).json({
        success: true,
        message: created ? 'Presupuesto asignado exitosamente' : 'Presupuesto actualizado exitosamente',
        data: presupuesto
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /presupuesto/:id
   * Update budget amounts
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { monto_asignado, monto_ejecutado, observaciones } = req.body;

      const presupuesto = await Presupuesto.findByPk(id);
      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          error: { code: 'PRESUPUESTO_NOT_FOUND', message: 'Presupuesto no encontrado.' }
        });
      }

      const previousData = presupuesto.toJSON();

      if (monto_asignado !== undefined) presupuesto.monto_asignado = monto_asignado;
      if (monto_ejecutado !== undefined) presupuesto.monto_ejecutado = monto_ejecutado;
      if (observaciones !== undefined) presupuesto.observaciones = observaciones;

      await presupuesto.save();

      await AuditService.logUpdate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Presupuesto',
        entidadId: presupuesto.id,
        datosPrevios: previousData,
        datosNuevos: presupuesto.toJSON(),
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Presupuesto actualizado exitosamente',
        data: presupuesto
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /presupuesto/ejecucion
   * Compare assigned vs executed budget report
   */
  static async getEjecucion(req, res, next) {
    try {
      const { anio, mes } = req.query;
      const report = await PresupuestoService.getEjecucionPresupuestaria(
        anio ? parseInt(anio, 10) : null,
        mes ? parseInt(mes, 10) : null
      );

      return res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PresupuestoController;
