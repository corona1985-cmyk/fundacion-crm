import { loadStore, saveRecord, removeRecord, paginate, ok } from './dataStore';
import {
  buildPresupuestoDetallado,
  loadPresupuestoConfig,
  savePresupuestoConfig,
  DEFAULT_GASTOS_FUNDACION
} from '../utils/presupuestoEngine';
import { exportUniversidadInvoice, exportAllUniversidadInvoices } from '../utils/facturaUniversidad';

async function ensureDefaultGastos(store) {
  const current = store.gastos || [];
  if (current.length > 0) return current;
  const seeded = [];
  for (const gasto of DEFAULT_GASTOS_FUNDACION) {
    const record = { ...gasto };
    await saveRecord('gastos', record);
    seeded.push(record);
  }
  return seeded;
}

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
    const record = {
      id: Date.now(),
      categoria: data.categoria || 'becas',
      monto_asignado: Number(data.monto_asignado ?? data.asignado ?? 0),
      monto_ejecutado: Number(data.monto_ejecutado || 0),
      anio: Number(data.anio || 2026),
      mes: Number(data.mes || new Date().getMonth() + 1),
      observaciones: data.observaciones || data.categoria_label || ''
    };
    await saveRecord('presupuestos', record);
    return ok(record);
  },
  updatePresupuesto: async (id, data) => {
    const record = { ...data, id };
    await saveRecord('presupuestos', record);
    return ok(record);
  },
  getEjecucionPresupuesto: async (params = {}) => {
    const detalle = await financieroApi.getPresupuestoDetallado(params);
    const k = detalle.data?.kpis || {};
    return ok({
      anio: detalle.data?.anio || 2026,
      asignado: k.compromiso_academico || 0,
      ejecutado: (k.pagos_ejecutados || 0) + (k.gastos_fundacion_periodo || 0),
      recaudado: k.aportes_recibidos || 0,
      partidas: (detalle.data?.partidas || []).map((p) => ({
        id: p.id,
        categoria: p.categoria,
        asignado: p.asignado,
        ejecutado: p.ejecutado,
        estado: 'en_ejecucion'
      })),
      ...detalle.data
    });
  },
  getPresupuestoDetallado: async (params = {}) => {
    const store = await loadStore();
    const gastos = await ensureDefaultGastos(store);
    const config = {
      ...loadPresupuestoConfig(),
      ...(params.anio ? { anio: Number(params.anio) } : {}),
      ...(params.meses ? { meses: Number(params.meses) } : {})
    };
    const detailed = buildPresupuestoDetallado(store, config, gastos);
    return ok(detailed);
  },
  exportFacturaUniversidad: async (universidadKey, options = {}) => {
    const result = await exportUniversidadInvoice(universidadKey, options);
    return ok(result, `Factura ${universidadKey} generada`);
  },
  exportFacturasUniversidades: async (options = {}) => {
    const results = await exportAllUniversidadInvoices(options);
    return ok(results, `${results.length} facturas generadas`);
  },
  getPresupuestoConfig: async () => ok(loadPresupuestoConfig()),
  savePresupuestoConfig: async (config) => ok(savePresupuestoConfig(config)),
  getGastos: async () => {
    const store = await loadStore();
    const gastos = await ensureDefaultGastos(store);
    return ok(gastos);
  },
  createGasto: async (data) => {
    const record = {
      id: Date.now(),
      tipo: data.tipo || 'operativo',
      categoria: data.categoria || 'administrativo',
      descripcion: data.descripcion,
      beneficiario: data.beneficiario || '',
      monto: Number(data.monto || 0),
      frecuencia: data.frecuencia || 'mensual',
      fecha: data.fecha || new Date().toISOString().slice(0, 10),
      activo: data.activo !== false
    };
    await saveRecord('gastos', record);
    return ok(record, 'Gasto registrado');
  },
  updateGasto: async (id, data) => {
    const store = await loadStore();
    const current = (store.gastos || []).find((row) => String(row.id) === String(id));
    const record = { ...(current || {}), ...data, id };
    await saveRecord('gastos', record);
    return ok(record);
  },
  deleteGasto: async (id) => {
    await removeRecord('gastos', id);
    return ok({});
  },
  getResumenFinanciero: async () => {
    const store = await loadStore();
    await ensureDefaultGastos(store);
    const refreshed = await loadStore();
    const totalIngresos = (refreshed.aportes || []).reduce((sum, row) => sum + parseFloat(row.monto || 0), 0);
    const totalEgresosBecas = (refreshed.pagos || [])
      .filter((row) => String(row.estado || '').toLowerCase() === 'pagado')
      .reduce((sum, row) => sum + parseFloat(row.monto || 0), 0);
    const totalGastos = (refreshed.gastos || []).reduce((sum, row) => {
      const monto = parseFloat(row.monto || 0);
      const freq = String(row.frecuencia || 'mensual').toLowerCase();
      // Para resumen anual aproximado
      if (freq.includes('anual')) return sum + monto;
      if (freq.includes('cuatrim')) return sum + (monto * 3);
      if (freq.includes('trim')) return sum + (monto * 4);
      return sum + (monto * 12);
    }, 0);
    const totalEgresos = totalEgresosBecas + totalGastos;
    return ok({
      total_ingresos: totalIngresos,
      total_egresos_becas: totalEgresosBecas,
      total_gastos_administrativos: totalGastos,
      total_egresos: totalEgresos,
      saldo_neto: totalIngresos - totalEgresos,
      ingresos_totales: totalIngresos,
      pagos_becas: totalEgresosBecas,
      gastos_admin: totalGastos,
      balance: totalIngresos - totalEgresos
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
