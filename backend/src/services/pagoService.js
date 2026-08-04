const { Pago, Presupuesto, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Business logic service for Payments & Overdue Tracking
 */
class PagoService {
  /**
   * Scans pending payments and updates status to 'atrasado' if past due date
   */
  static async updateOverduePaymentsStatus() {
    const today = new Date().toISOString().split('T')[0];

    const [updatedCount] = await Pago.update(
      { estado: 'atrasado' },
      {
        where: {
          estado: 'pendiente',
          fecha_vencimiento: { [Op.lt]: today }
        }
      }
    );

    return updatedCount;
  }

  /**
   * Calculates days of delay for an overdue payment
   */
  static calculateDaysOverdue(fechaVencimiento) {
    const today = new Date();
    const dueDate = new Date(fechaVencimiento);
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Automatically updates executed budget when a scholarship payment is marked as paid
   */
  static async updatePresupuestoEjecutado(monto, fechaPago, transaction = null) {
    const date = new Date(fechaPago);
    const anio = date.getFullYear();
    const mes = date.getMonth() + 1;

    const [presupuesto] = await Presupuesto.findOrCreate({
      where: { categoria: 'becas', anio, mes },
      defaults: {
        monto_asignado: 0.00,
        monto_ejecutado: 0.00,
        observaciones: `Presupuesto automático generado para ${mes}/${anio}`
      },
      transaction
    });

    const newExecuted = parseFloat(presupuesto.monto_ejecutado) + parseFloat(monto);
    presupuesto.monto_ejecutado = newExecuted;
    await presupuesto.save({ transaction });

    return presupuesto;
  }
}

module.exports = PagoService;
