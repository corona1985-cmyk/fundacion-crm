const { Auditoria, Usuario, Persona } = require('../models');
const { Op } = require('sequelize');

/**
 * Controller for Audit Trail Endpoints (Module 7 - Admin only)
 */
class AuditController {
  /**
   * GET /audit
   * List audit log records with pagination and filters
   */
  static async list(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const offset = (page - 1) * limit;

      const { usuario_id, accion, entidad, fecha_inicio, fecha_fin } = req.query;

      const where = {};

      if (usuario_id) {
        where.usuario_id = usuario_id;
      }

      if (accion) {
        where.accion = accion;
      }

      if (entidad) {
        where.entidad = entidad;
      }

      if (fecha_inicio || fecha_fin) {
        where.fecha_hora = {};
        if (fecha_inicio) {
          where.fecha_hora[Op.gte] = new Date(fecha_inicio);
        }
        if (fecha_fin) {
          where.fecha_hora[Op.lte] = new Date(fecha_fin);
        }
      }

      const { count, rows } = await Auditoria.findAndCountAll({
        where,
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'username', 'rol'],
            include: [{ model: Persona, as: 'persona', attributes: ['nombre', 'apellido', 'email'] }]
          }
        ],
        order: [['fecha_hora', 'DESC']],
        limit,
        offset
      });

      return res.status(200).json({
        success: true,
        data: {
          audit_logs: rows,
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

  /**
   * GET /audit/:id
   * Get audit log detail with complete change comparison
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const registro = await Auditoria.findByPk(id, {
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'username', 'rol'],
            include: [{ model: Persona, as: 'persona', attributes: ['nombre', 'apellido', 'email'] }]
          }
        ]
      });

      if (!registro) {
        return res.status(404).json({
          success: false,
          error: { code: 'AUDIT_LOG_NOT_FOUND', message: 'Registro de auditoría no encontrado.' }
        });
      }

      return res.status(200).json({
        success: true,
        data: registro
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuditController;
