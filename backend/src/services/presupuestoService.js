const { Presupuesto } = require('../models');

/**
 * Business logic service for Budget Execution & Tracking
 */
class PresupuestoService {
  /**
   * Compares assigned vs executed budget for a given year and month
   */
  static async getEjecucionPresupuestaria(anio, mes) {
    const where = {};
    if (anio) where.anio = anio;
    if (mes) where.mes = mes;

    const presupuestos = await Presupuesto.findAll({
      where,
      order: [['anio', 'DESC'], ['mes', 'DESC'], ['categoria', 'ASC']]
    });

    const report = presupuestos.map(p => {
      const asignado = parseFloat(p.monto_asignado);
      const ejecutado = parseFloat(p.monto_ejecutado);
      const disponible = asignado - ejecutado;
      const porcentajeEjecucion = asignado > 0 ? parseFloat(((ejecutado / asignado) * 100).toFixed(2)) : 0.00;

      return {
        ...p.toJSON(),
        disponible,
        porcentaje_ejecucion: porcentajeEjecucion
      };
    });

    return report;
  }
}

module.exports = PresupuestoService;
