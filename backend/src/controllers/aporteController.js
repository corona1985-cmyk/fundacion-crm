const { Aporte, Padrino, Persona, InstitucionPublica } = require('../models');
const { Op } = require('sequelize');
const AuditService = require('../services/auditService');

/**
 * Controller for Financial Contributions (Aportes) Management
 */
class AporteController {
  static async list(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);
      const offset = (page - 1) * limit;

      const { padrino_id, institucion_id, fecha_inicio, fecha_fin } = req.query;

      const where = {};
      if (padrino_id) where.padrino_id = padrino_id;
      if (institucion_id) where.institucion_id = institucion_id;

      if (fecha_inicio || fecha_fin) {
        where.fecha_recepcion = {};
        if (fecha_inicio) where.fecha_recepcion[Op.gte] = fecha_inicio;
        if (fecha_fin) where.fecha_recepcion[Op.lte] = fecha_fin;
      }

      const { count, rows } = await Aporte.findAndCountAll({
        where,
        include: [
          { model: Padrino, as: 'padrino', include: [{ model: Persona, as: 'persona' }] },
          { model: InstitucionPublica, as: 'institucion' }
        ],
        order: [['fecha_recepcion', 'DESC']],
        limit,
        offset
      });

      return res.status(200).json({
        success: true,
        data: {
          aportes: rows,
          pagination: {
            total_items: count,
            total_pages: Math.ceil(count / limit),
            current_page: page,
            limit
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { referencia, observaciones } = req.body;

      const aporte = await Aporte.findByPk(id);
      if (!aporte) {
        return res.status(404).json({
          success: false,
          error: { code: 'APORTE_NOT_FOUND', message: 'Aporte no encontrado.' }
        });
      }

      const previousData = aporte.toJSON();

      if (referencia !== undefined) aporte.referencia = referencia;
      if (observaciones !== undefined) aporte.observaciones = observaciones;

      await aporte.save();

      await AuditService.logUpdate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Aporte',
        entidadId: aporte.id,
        datosPrevios: previousData,
        datosNuevos: aporte.toJSON(),
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Aporte actualizado exitosamente',
        data: aporte
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const aporte = await Aporte.findByPk(id);
      if (!aporte) {
        return res.status(404).json({
          success: false,
          error: { code: 'APORTE_NOT_FOUND', message: 'Aporte no encontrado.' }
        });
      }

      const previousData = aporte.toJSON();

      await aporte.destroy();

      await AuditService.logDelete({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Aporte',
        entidadId: id,
        datosPrevios: previousData,
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Aporte eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AporteController;
