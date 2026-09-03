import { loadStore, saveRecord, paginate, ok } from './dataStore';

export const financieroApi = {
  getPagos: async (params = {}) => {
    const store = await loadStore();
    let rows = store.pagos || [];
    if (params.estado) {
      rows = rows.filter((row) => row.estado === params.estado);
    }
    const { rows: pagos, pagination } = paginate(rows, params);
    return ok({ pagos, pagination });
  },
  getPagosVencidos: async () => {
    const store = await loadStore();
    const rows = (store.pagos || []).filter((row) => ['atrasado', 'vencido', 'pendiente'].includes(String(row.estado || '').toLowerCase()));
    return ok(rows);
  },
  getPagoById: async (id) => {
    const store = await loadStore();
    return ok((store.pagos || []).find((row) => String(row.id) === String(id)));
  },
  createPago: async (data) => {
    const record = { ...data, id: Date.now(), estado: data.estado || 'pendiente' };
    await saveRecord('pagos', record);
    return ok(record);
  },
  updatePago: async (id, data) => ok({ ...data, id }),
  marcarPagado: async (id, data) => {
    const store = await loadStore();
    const current = (store.pagos || []).find((row) => String(row.id) === String(id));
    if (current) {
      current.estado = 'pagado';
      await saveRecord('pagos', { ...current, ...data });
    }
    return ok(current);
  },
  deletePago: async () => ok({}),
  getPresupuestos: async () => {
    const store = await loadStore();
    return ok(store.presupuestos || []);
  },
  createPresupuesto: async (data) => {
    const record = { ...data, id: Date.now() };
    await saveRecord('presupuestos', record);
    return ok(record);
  },
  updatePresupuesto: async (id, data) => ok({ ...data, id }),
  getEjecucionPresupuesto: async () => ok({}),
  getResumenFinanciero: async () => {
    const store = await loadStore();
    const totalIngresos = (store.aportes || []).reduce((sum, row) => sum + parseFloat(row.monto || 0), 0);
    const totalEgresosBecas = (store.pagos || [])
      .filter((row) => String(row.estado || '').toLowerCase() === 'pagado')
      .reduce((sum, row) => sum + parseFloat(row.monto || 0), 0);
    const totalGastos = (store.gastos || []).reduce((sum, row) => sum + parseFloat(row.monto || 0), 0);
    const totalEgresos = totalEgresosBecas + totalGastos;
    return ok({
      total_ingresos: totalIngresos,
      total_egresos_becas: totalEgresosBecas,
      total_gastos_administrativos: totalGastos,
      total_egresos: totalEgresos,
      saldo_neto: totalIngresos - totalEgresos
    });
  },
  getCuentasPorCobrar: async () => {
    const store = await loadStore();
    return ok(store.padrinos || []);
  },
  getCuentasPorPagar: async () => {
    const store = await loadStore();
    const pagos = (store.pagos || []).filter((row) => ['pendiente', 'atrasado'].includes(String(row.estado || '').toLowerCase()));
    return ok({
      total_pendiente: pagos.reduce((sum, row) => sum + parseFloat(row.monto || 0), 0),
      pagos
    });
  },
  getEvolucion: async () => {
    const resumen = await financieroApi.getResumenFinanciero();
    return ok({ periodo: '2026', resumen_general: resumen.data });
  }
};
