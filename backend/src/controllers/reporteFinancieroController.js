const ReporteFinancieroService = require('../services/reporteFinancieroService');

/**
 * Controller for Financial Reports and Statements
 */
class ReporteFinancieroController {
  /**
   * GET /reportes/financiero/resumen
   * Financial summary statement (Income vs Expenses vs Net Balance)
   */
  static async getResumen(req, res, next) {
    try {
      const resumen = await ReporteFinancieroService.getResumenFinanciero();

      return res.status(200).json({
        success: true,
        data: resumen
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /reportes/financiero/cuentas-cobrar
   * Expected contributions from active sponsors
   */
  static async getCuentasPorCobrar(req, res, next) {
    try {
      const cuentasCobrar = await ReporteFinancieroService.getCuentasPorCobrar();

      return res.status(200).json({
        success: true,
        data: cuentasCobrar
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /reportes/financiero/cuentas-pagar
   * Pending and overdue university scholarship payments
   */
  static async getCuentasPorPagar(req, res, next) {
    try {
      const cuentasPagar = await ReporteFinancieroService.getCuentasPorPagar();

      return res.status(200).json({
        success: true,
        data: cuentasPagar
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /reportes/financiero/evolucion
   * Monthly financial breakdown statement
   */
  static async getEvolucion(req, res, next) {
    try {
      const resumen = await ReporteFinancieroService.getResumenFinanciero();

      return res.status(200).json({
        success: true,
        data: {
          periodo: '2026',
          resumen_general: resumen
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReporteFinancieroController;
