const { Pago, Becario, Persona, Universidad, Carrera } = require('../models');
const { Op } = require('sequelize');
const AuditService = require('../services/auditService');
const PagoService = require('../services/pagoService');

/**
 * Controller for University Payment Management
 */
class PagoController {
  /**
   * GET /pagos
   * List payments with pagination, filters, and auto-overdue status update
   */
  static async list(req, res, next) {
    try {
      // Auto-update pending payments past due date
      await PagoService.updateOverduePaymentsStatus();

      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);
      const offset = (page - 1) * limit;

      const { becario_id, estado, fecha_desde, fecha_hasta } = req.query;

      const where = {};
      if (becario_id) where.becario_id = becario_id;
      if (estado) where.estado = estado;

      if (fecha_desde || fecha_hasta) {
        where.fecha_vencimiento = {};
        if (fecha_desde) where.fecha_vencimiento[Op.gte] = fecha_desde;
        if (fecha_hasta) where.fecha_vencimiento[Op.lte] = fecha_hasta;
      }

      const { count, rows } = await Pago.findAndCountAll({
        where,
        include: [
          {
            model: Becario,
            as: 'becario',
            include: [
              { model: Persona, as: 'persona' },
              { model: Universidad, as: 'universidad' }
            ]
          }
        ],
        order: [['fecha_vencimiento', 'ASC']],
        limit,
        offset
      });

      return res.status(200).json({
        success: true,
        data: {
          pagos: rows,
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
   * GET /pagos/vencidos
   * List all overdue payments with calculated days of delay
   */
  static async getOverdue(req, res, next) {
    try {
      await PagoService.updateOverduePaymentsStatus();

      const pagosAtrasados = await Pago.findAll({
        where: { estado: 'atrasado' },
        include: [
          {
            model: Becario,
            as: 'becario',
            include: [
              { model: Persona, as: 'persona' },
              { model: Universidad, as: 'universidad' }
            ]
          }
        ],
        order: [['fecha_vencimiento', 'ASC']]
      });

      const report = pagosAtrasados.map(p => ({
        ...p.toJSON(),
        dias_atraso: PagoService.calculateDaysOverdue(p.fecha_vencimiento)
      }));

      return res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /pagos/:id
   * Get detail for a specific payment
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const pago = await Pago.findByPk(id, {
        include: [
          {
            model: Becario,
            as: 'becario',
            include: [
              { model: Persona, as: 'persona' },
              { model: Universidad, as: 'universidad' },
              { model: Carrera, as: 'carrera' }
            ]
          }
        ]
      });

      if (!pago) {
        return res.status(404).json({
          success: false,
          error: { code: 'PAGO_NOT_FOUND', message: 'Pago no encontrado.' }
        });
      }

      return res.status(200).json({
        success: true,
        data: pago
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /pagos
   * Register a new scholarship payment to a university
   */
  static async create(req, res, next) {
    try {
      const { becario_id, concepto, monto, fecha_vencimiento, fecha_pago, estado, comprobante, observaciones } = req.body;

      const becario = await Becario.findByPk(becario_id);
      if (!becario) {
        return res.status(404).json({
          success: false,
          error: { code: 'BECARIO_NOT_FOUND', message: 'Becario no encontrado.' }
        });
      }

      const today = new Date().toISOString().split('T')[0];
      let initialEstado = estado || 'pendiente';
      if (initialEstado !== 'pagado' && fecha_vencimiento < today) {
        initialEstado = 'atrasado';
      }

      const pago = await Pago.create({
        becario_id,
        concepto: concepto || 'mensualidad',
        monto,
        fecha_vencimiento,
        fecha_pago: initialEstado === 'pagado' ? (fecha_pago || today) : null,
        estado: initialEstado,
        comprobante,
        observaciones
      });

      if (initialEstado === 'pagado') {
        await PagoService.updatePresupuestoEjecutado(monto, pago.fecha_pago);
      }

      await AuditService.logCreate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Pago',
        entidadId: pago.id,
        datosNuevos: pago.toJSON(),
        req
      });

      return res.status(201).json({
        success: true,
        message: 'Pago registrado exitosamente',
        data: pago
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /pagos/:id
   * Update payment details
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { concepto, monto, fecha_vencimiento, fecha_pago, estado, comprobante, observaciones } = req.body;

      const pago = await Pago.findByPk(id);
      if (!pago) {
        return res.status(404).json({
          success: false,
          error: { code: 'PAGO_NOT_FOUND', message: 'Pago no encontrado.' }
        });
      }

      const previousData = pago.toJSON();

      if (concepto !== undefined) pago.concepto = concepto;
      if (monto !== undefined && pago.estado !== 'pagado') pago.monto = monto;
      if (fecha_vencimiento !== undefined) pago.fecha_vencimiento = fecha_vencimiento;
      if (fecha_pago !== undefined) pago.fecha_pago = fecha_pago;
      if (estado !== undefined) pago.estado = estado;
      if (comprobante !== undefined) pago.comprobante = comprobante;
      if (observaciones !== undefined) pago.observaciones = observaciones;

      await pago.save();

      await AuditService.logUpdate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Pago',
        entidadId: pago.id,
        datosPrevios: previousData,
        datosNuevos: pago.toJSON(),
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Pago actualizado exitosamente',
        data: pago
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /pagos/:id/marcar-pagado
   * Mark a payment as paid and update budget execution
   */
  static async marcarPagado(req, res, next) {
    try {
      const { id } = req.params;
      const { fecha_pago, comprobante, observaciones } = req.body;

      const pago = await Pago.findByPk(id);
      if (!pago) {
        return res.status(404).json({
          success: false,
          error: { code: 'PAGO_NOT_FOUND', message: 'Pago no encontrado.' }
        });
      }

      if (pago.estado === 'pagado') {
        return res.status(400).json({
          success: false,
          error: { code: 'PAGO_ALREADY_PAID', message: 'El pago ya fue procesado como pagado previamente.' }
        });
      }

      const previousData = pago.toJSON();
      const actualFechaPago = fecha_pago || new Date().toISOString().split('T')[0];

      pago.estado = 'pagado';
      pago.fecha_pago = actualFechaPago;
      if (comprobante) pago.comprobante = comprobante;
      if (observaciones) pago.observaciones = observaciones;

      await pago.save();

      // Automatically update budget execution
      await PagoService.updatePresupuestoEjecutado(pago.monto, actualFechaPago);

      await AuditService.logUpdate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Pago',
        entidadId: pago.id,
        datosPrevios: previousData,
        datosNuevos: pago.toJSON(),
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Pago marcado como pagado exitosamente',
        data: pago
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /pagos/:id
   * Admin only delete payment record
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const pago = await Pago.findByPk(id);
      if (!pago) {
        return res.status(404).json({
          success: false,
          error: { code: 'PAGO_NOT_FOUND', message: 'Pago no encontrado.' }
        });
      }

      const previousData = pago.toJSON();

      await pago.destroy();

      await AuditService.logDelete({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Pago',
        entidadId: id,
        datosPrevios: previousData,
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Registro de pago eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PagoController;
