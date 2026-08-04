const { Aporte } = require('../models');

/**
 * Business logic service for Sponsors and Financial Contributions
 */
class PadrinoService {
  /**
   * Calculates total contributions received from a specific sponsor
   */
  static async getTotalAportadoPadrino(padrinoId) {
    const result = await Aporte.sum('monto', {
      where: { padrino_id: padrinoId }
    });
    return parseFloat(result || 0).toFixed(2);
  }

  /**
   * Calculates total contributions received from a specific public institution
   */
  static async getTotalAportadoInstitucion(institucionId) {
    const result = await Aporte.sum('monto', {
      where: { institucion_id: institucionId }
    });
    return parseFloat(result || 0).toFixed(2);
  }
}

module.exports = PadrinoService;
