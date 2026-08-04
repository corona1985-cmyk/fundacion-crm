const { Becario, MateriaCursada } = require('../models');

/**
 * Business logic service for Becarios
 */
class BecarioService {
  /**
   * Recalculates and updates the cumulative GPA (promedio_general) for a becario
   * based on all completed/graded courses (APROBADA, REPROBADA, or with valid numerical grade).
   */
  static async updatePromedioGeneral(becarioId, transaction = null) {
    const materias = await MateriaCursada.findAll({
      where: { becario_id: becarioId },
      transaction
    });

    const gradedMaterias = materias.filter(m => m.calificacion !== null && m.calificacion !== undefined);

    if (gradedMaterias.length === 0) {
      await Becario.update({ promedio_general: 0.00 }, { where: { id: becarioId }, transaction });
      return 0.00;
    }

    const totalSum = gradedMaterias.reduce((acc, curr) => acc + parseFloat(curr.calificacion), 0);
    const average = parseFloat((totalSum / gradedMaterias.length).toFixed(2));

    await Becario.update({ promedio_general: average }, { where: { id: becarioId }, transaction });
    return average;
  }
}

module.exports = BecarioService;
