const { Aporte, Pago, GastoAdministrativo, Padrino, Persona, Becario, Universidad, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Service for Financial Reports, Statements & Accounts Payable/Receivable
 */
class ReporteFinancieroService {
  /**
   * Generates global financial summary statement (total income, total expenses, net balance)
   */
  static async getResumenFinanciero() {
    const totalIngresosResult = await Aporte.sum('monto') || 0;
    const totalPagosBecasResult = await Pago.sum('monto', { where: { estado: 'pagado' } }) || 0;
    const totalGastosAdminResult = await GastoAdministrativo.sum('monto') || 0;

    const totalIngresos = parseFloat(totalIngresosResult);
    const totalEgresosBecas = parseFloat(totalPagosBecasResult);
    const totalGastosAdmin = parseFloat(totalGastosAdminResult);
    const totalEgresos = totalEgresosBecas + totalGastosAdmin;
    const saldoNeto = totalIngresos - totalEgresos;

    return {
      total_ingresos: totalIngresos,
      total_egresos_becas: totalEgresosBecas,
      total_gastos_administrativos: totalGastosAdmin,
      total_egresos: totalEgresos,
      saldo_neto: saldoNeto
    };
  }

  /**
   * Accounts Receivable (Cuentas por Cobrar): Active sponsors with monthly/periodic commitments
   */
  static async getCuentasPorCobrar() {
    const padrinosActivos = await Padrino.findAll({
      where: { activo: true },
      include: [{ model: Persona, as: 'persona' }]
    });

    const report = await Promise.all(padrinosActivos.map(async (padrino) => {
      const totalAportadoResult = await Aporte.sum('monto', { where: { padrino_id: padrino.id } }) || 0;
      return {
        padrino_id: padrino.id,
        nombre: padrino.tipo === 'juridica' ? padrino.razon_social : `${padrino.persona.nombre} ${padrino.persona.apellido}`,
        tipo: padrino.tipo,
        monto_compromiso: parseFloat(padrino.monto_compromiso),
        frecuencia: padrino.frecuencia,
        total_aportado: parseFloat(totalAportadoResult)
      };
    }));

    return report;
  }

  /**
   * Accounts Payable (Cuentas por Pagar): Pending or overdue university scholarship payments
   */
  static async getCuentasPorPagar() {
    const pagosPendientes = await Pago.findAll({
      where: {
        estado: { [Op.in]: ['pendiente', 'atrasado'] }
      },
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

    const totalPorPagar = pagosPendientes.reduce((acc, curr) => acc + parseFloat(curr.monto), 0);

    return {
      total_pendiente: parseFloat(totalPorPagar.toFixed(2)),
      pagos: pagosPendientes
    };
  }
}

module.exports = ReporteFinancieroService;
