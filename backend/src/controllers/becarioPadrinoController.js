const { BecarioPadrino, Becario, Padrino, Persona } = require('../models');
const AuditService = require('../services/auditService');

/**
 * Controller for Student-Sponsor Assignment (BecarioPadrino)
 */
class BecarioPadrinoController {
  /**
   * POST /becarios/:id/asignar-padrino
   * Assign a sponsor to a student
   */
  static async assignPadrino(req, res, next) {
    try {
      const { id } = req.params;
      const { padrino_id, fecha_asignacion, observaciones } = req.body;

      const becario = await Becario.findByPk(id);
      if (!becario) {
        return res.status(404).json({
          success: false,
          error: { code: 'BECARIO_NOT_FOUND', message: 'Becario no encontrado.' }
        });
      }

      const padrino = await Padrino.findByPk(padrino_id);
      if (!padrino) {
        return res.status(404).json({
          success: false,
          error: { code: 'PADRINO_NOT_FOUND', message: 'Padrino no encontrado.' }
        });
      }

      if (!padrino.activo) {
        return res.status(400).json({
          success: false,
          error: { code: 'PADRINO_INACTIVE', message: 'El padrino se encuentra inactivo.' }
        });
      }

      // Deactivate any existing active assignment for this pair or recreate
      const [asignacion, created] = await BecarioPadrino.findOrCreate({
        where: {
          becario_id: id,
          padrino_id,
          activo: true
        },
        defaults: {
          fecha_asignacion: fecha_asignacion || new Date(),
          activo: true,
          observaciones
        }
      });

      if (!created) {
        return res.status(409).json({
          success: false,
          error: { code: 'ASSIGNMENT_ALREADY_EXISTS', message: 'El padrino ya se encuentra asignado a este becario.' }
        });
      }

      await AuditService.logCreate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'BecarioPadrino',
        entidadId: asignacion.id,
        datosNuevos: asignacion.toJSON(),
        req
      });

      return res.status(201).json({
        success: true,
        message: 'Padrino asignado exitosamente al becario',
        data: asignacion
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /becarios/:id/padrinos/:padrino_id
   * Update student-sponsor assignment
   */
  static async updateAsignacion(req, res, next) {
    try {
      const { id, padrino_id } = req.params;
      const { fecha_fin, activo, observaciones } = req.body;

      const asignacion = await BecarioPadrino.findOne({
        where: { becario_id: id, padrino_id, activo: true }
      });

      if (!asignacion) {
        return res.status(404).json({
          success: false,
          error: { code: 'ASSIGNMENT_NOT_FOUND', message: 'Asignación activa no encontrada.' }
        });
      }

      const previousData = asignacion.toJSON();

      if (fecha_fin !== undefined) asignacion.fecha_fin = fecha_fin;
      if (activo !== undefined) asignacion.activo = activo;
      if (observaciones !== undefined) asignacion.observaciones = observaciones;

      await asignacion.save();

      await AuditService.logUpdate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'BecarioPadrino',
        entidadId: asignacion.id,
        datosPrevios: previousData,
        datosNuevos: asignacion.toJSON(),
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Asignación actualizada exitosamente',
        data: asignacion
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /becarios/:id/padrinos/:padrino_id
   * Decouple sponsor from student (sets activo = false and fecha_fin = CURRENT_DATE)
   */
  static async unassignPadrino(req, res, next) {
    try {
      const { id, padrino_id } = req.params;

      const asignacion = await BecarioPadrino.findOne({
        where: { becario_id: id, padrino_id, activo: true }
      });

      if (!asignacion) {
        return res.status(404).json({
          success: false,
          error: { code: 'ASSIGNMENT_NOT_FOUND', message: 'Asignación activa no encontrada.' }
        });
      }

      const previousData = asignacion.toJSON();

      asignacion.activo = false;
      asignacion.fecha_fin = new Date();
      await asignacion.save();

      await AuditService.logDelete({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'BecarioPadrino',
        entidadId: asignacion.id,
        datosPrevios: previousData,
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Padrino desvinculado exitosamente del becario (historial mantenido)'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BecarioPadrinoController;
