import { loadStore, saveRecord, paginate, ok } from './dataStore';

export const padrinoApi = {
  getAll: async (params = {}) => {
    const store = await loadStore();
    const { rows: padrinos, pagination } = paginate(store.padrinos || [], params);
    return ok({ padrinos, pagination });
  },
  getById: async (id) => {
    const store = await loadStore();
    const padrino = (store.padrinos || []).find((row) => String(row.id) === String(id));
    if (!padrino) throw new Error('Padrino no encontrado.');
    const aportes = (store.aportes || []).filter((row) => String(row.padrino_id) === String(id));
    return ok({ ...padrino, aportes });
  },
  create: async (data) => {
    const record = {
      ...data,
      id: Date.now(),
      persona: {
        nombre: data.nombre,
        apellido: data.apellido,
        cedula: data.cedula,
        email: data.email
      }
    };
    await saveRecord('padrinos', record);
    return ok(record, 'Padrino registrado correctamente');
  },
  update: async (id, data) => {
    const record = { ...data, id };
    await saveRecord('padrinos', record);
    return ok(record);
  },
  delete: async () => ok({}),
  createAportePadrino: async (padrino_id, data) => {
    const record = { ...data, id: Date.now(), padrino_id };
    await saveRecord('aportes', record);
    return ok(record);
  },
  getInstituciones: async () => {
    const store = await loadStore();
    return ok(store.instituciones || []);
  },
  createInstitucion: async (data) => {
    const record = { ...data, id: Date.now() };
    await saveRecord('instituciones', record);
    return ok(record);
  },
  updateInstitucion: async (id, data) => ok({ ...data, id }),
  deleteInstitucion: async () => ok({}),
  createAporteInstitucion: async (institucion_id, data) => {
    const record = { ...data, id: Date.now(), institucion_id };
    await saveRecord('aportes', record);
    return ok(record);
  },
  getAportes: async () => {
    const store = await loadStore();
    return ok(store.aportes || []);
  },
  assignPadrinoToBecario: async () => ok({}),
  updateAssignment: async () => ok({}),
  decoupleAssignment: async () => ok({}),
  exportPadrinoCentrosPdf: async () => {
    throw new Error('La exportación PDF se reactivará con el backend Firebase Functions.');
  }
};
