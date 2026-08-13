const { Alarma, Usuario, Persona } = require('../models');
const AlarmEngineService = require('../services/alarmEngineService');
const AuditService = require('../services/auditService');

/**
 * Controller for Alarms & Notifications Management (Module 5)
 */
class AlarmaController {
  /**
   * GET /alarmas
   * List all alarms with filters (estado, nivel, tipo) and pagination
   */
  static async list(req, res, next) {
    try {
      const { estado, nivel, tipo, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (estado) where.estado = estado;
      if (nivel) where.nivel = nivel;
      if (tipo) where.tipo = tipo;

      const { rows: alarmas, count: total } = await Alarma.findAndCountAll({
        where,
        order: [
          ['estado', 'ASC'],
          ['nivel', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        include: [{
          model: Usuario,
          as: 'atendidaPor',
          attributes: ['id', 'username'],
          include: [{ model: Persona, as: 'persona', attributes: ['nombre', 'apellido'] }]
        }]
      });

      return res.status(200).json({
        success: true,
        data: alarmas,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /alarmas/resumen
   * Summary counters of active alarms by severity
   */
  static async getSummary(req, res, next) {
    try {
      // Trigger evaluation sweep on query
      await AlarmEngineService.evaluateAll();

      const pendientes = await Alarma.count({ where: { estado: 'pendiente' } });
      const criticos = await Alarma.count({ where: { estado: 'pendiente', nivel: 'critico' } });
      const medios = await Alarma.count({ where: { estado: 'pendiente', nivel: 'medio' } });
      const bajos = await Alarma.count({ where: { estado: 'pendiente', nivel: 'bajo' } });

      return res.status(200).json({
        success: true,
        data: {
          pendientes,
          criticos,
          medios,
          bajos
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /alarmas/:id/atender
   * Mark an alarm as resolved with a resolution note
   */
  static async atender(req, res, next) {
    try {
      const { id } = req.params;
      const { resolucion_nota } = req.body;

      const alarma = await Alarma.findByPk(id);
      if (!alarma) {
        return res.status(404).json({
          success: false,
          error: { code: 'ALARMA_NOT_FOUND', message: 'Alarma no encontrada.' }
        });
      }

      const previousData = alarma.toJSON();

      await alarma.update({
        estado: 'atendida',
        resolucion_nota: resolucion_nota || 'Atendida sin observaciones adicionales.',
        atendida_por: req.user ? req.user.id : null,
        fecha_atencion: new Date()
      });

      await AuditService.logUpdate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Alarma',
        entidadId: id,
        datosPrevios: previousData,
        datosNuevos: alarma.toJSON(),
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Alarma marcada como atendida exitosamente',
        data: alarma
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /alarmas/:id/descartar
   * Dismiss an alarm with justification
   */
  static async descartar(req, res, next) {
    try {
      const { id } = req.params;
      const { resolucion_nota } = req.body;

      const alarma = await Alarma.findByPk(id);
      if (!alarma) {
        return res.status(404).json({
          success: false,
          error: { code: 'ALARMA_NOT_FOUND', message: 'Alarma no encontrada.' }
        });
      }

      const previousData = alarma.toJSON();

      await alarma.update({
        estado: 'descartada',
        resolucion_nota: resolucion_nota || 'Descartada por el usuario.',
        atendida_por: req.user ? req.user.id : null,
        fecha_atencion: new Date()
      });

      await AuditService.logUpdate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Alarma',
        entidadId: id,
        datosPrevios: previousData,
        datosNuevos: alarma.toJSON(),
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Alarma descartada exitosamente',
        data: alarma
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /alarmas
   * Manually create a custom alarm/notification (e.g. Graduation Event, Academic Follow-up)
   */
  static async create(req, res, next) {
    try {
      const { tipo, nivel, titulo, descripcion, entidad_relacionada, entidad_id } = req.body;
      const alarma = await Alarma.create({
        tipo: tipo || 'GRADUACION_PROXIMA',
        nivel: nivel || 'medio',
        titulo,
        descripcion,
        entidad_relacionada: entidad_relacionada || 'becario',
        entidad_id: entidad_id || null,
        estado: 'pendiente'
      });

      await AuditService.logCreate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Alarma',
        entidadId: alarma.id,
        datosNuevos: alarma.toJSON(),
        req
      });

      return res.status(201).json({
        success: true,
        message: 'Alarma / Notificación creada exitosamente',
        data: alarma
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /alarmas/evaluar
   * Force manual rule evaluation sweep
   */
  static async evaluar(req, res, next) {
    try {
      const summary = await AlarmEngineService.evaluateAll();
      return res.status(200).json({
        success: true,
        message: 'Evaluación de reglas ejecutada correctamente',
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AlarmaController;
