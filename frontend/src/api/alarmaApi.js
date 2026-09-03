import { loadStore, saveRecord, ok } from './dataStore';

export const alarmaApi = {
  getAll: async (params = {}) => {
    const store = await loadStore();
    let rows = store.alarmas || [];
    if (params.estado) {
      rows = rows.filter((row) => row.estado === params.estado);
    }
    if (params.nivel) {
      rows = rows.filter((row) => row.nivel === params.nivel);
    }
    return ok(rows);
  },
  getSummary: async () => {
    const store = await loadStore();
    const rows = store.alarmas || [];
    return ok({
      pendientes: rows.filter((row) => row.estado === 'pendiente').length,
      criticos: rows.filter((row) => row.nivel === 'critico').length,
      medios: rows.filter((row) => row.nivel === 'medio').length,
      bajos: rows.filter((row) => row.nivel === 'bajo').length
    });
  },
  create: async (data) => {
    const record = { ...data, id: Date.now(), estado: 'pendiente' };
    await saveRecord('alarmas', record);
    return ok(record);
  },
  evaluar: async () => ok({}),
  atender: async (id, data) => {
    const store = await loadStore();
    const current = (store.alarmas || []).find((row) => String(row.id) === String(id));
    if (current) {
      current.estado = 'atendida';
      await saveRecord('alarmas', { ...current, ...data });
    }
    return ok(current);
  },
  descartar: async (id, data) => {
    const store = await loadStore();
    const current = (store.alarmas || []).find((row) => String(row.id) === String(id));
    if (current) {
      current.estado = 'descartada';
      await saveRecord('alarmas', { ...current, ...data });
    }
    return ok(current);
  },
  getOverduePayments: async () => {
    const store = await loadStore();
    return ok((store.pagos || []).filter((row) => String(row.estado || '').toLowerCase() === 'atrasado'));
  },
  getCuentasPorCobrar: async () => {
    const store = await loadStore();
    return ok(store.padrinos || []);
  },
  getCuentasPorPagar: async () => {
    const store = await loadStore();
    return ok(store.pagos || []);
  }
};
