import { loadStore, saveRecord, paginate, ok } from './dataStore';
import { exportPadrinoInvoice } from '../utils/facturaPadrino';
import { normalizeText, personName } from '../utils/downloadFile';

function matchesPadrinoSearch(padrino, search) {
  if (!search) return true;
  const raw = normalizeText(search);
  const tokens = raw.split(' ').filter((t) => t.length >= 2);
  const blob = normalizeText([
    personName(padrino),
    padrino.razon_social,
    padrino.nombre,
    padrino.apellido,
    padrino.persona?.nombre,
    padrino.persona?.apellido,
    padrino.email,
    padrino.telefono,
    padrino.cedula,
    padrino.tipo
  ].filter(Boolean).join(' '));
  if (!tokens.length) return blob.includes(raw);
  const hits = tokens.filter((t) => blob.includes(t)).length;
  return hits === tokens.length || (tokens.length >= 3 && hits >= Math.ceil(tokens.length * 0.6)) || (raw.length >= 3 && blob.includes(raw));
}

export const padrinoApi = {
  getAll: async (params = {}) => {
    const store = await loadStore();
    let rows = store.padrinos || [];
    if (params.search) {
      rows = rows.filter((row) => matchesPadrinoSearch(row, params.search));
    }
    const { rows: padrinos, pagination } = paginate(rows, params);
    return ok({ padrinos, pagination });
  },
  getById: async (id) => {
    const store = await loadStore();
    const padrino = (store.padrinos || []).find((row) => String(row.id) === String(id));
    if (!padrino) throw new Error('Padrino no encontrado.');
    const aportes = (store.aportes || []).filter((row) => String(row.padrino_id) === String(id));
    const ids = new Set((padrino.becario_ids || []).map(String));
    const becarios = (store.becarios || []).filter((row) => ids.has(String(row.id)));
    const totalAportado = aportes.reduce((sum, row) => sum + parseFloat(row.monto || 0), 0);
    return ok({ ...padrino, aportes, becarios, total_aportado: totalAportado });
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
  getAportes: async (params = {}) => {
    const store = await loadStore();
    let aportes = store.aportes || [];
    if (params.padrino_id) {
      aportes = aportes.filter((row) => String(row.padrino_id) === String(params.padrino_id));
    }
    return ok({ aportes });
  },
  assignPadrinoToBecario: async () => ok({}),
  updateAssignment: async () => ok({}),
  decoupleAssignment: async () => ok({}),
  exportPadrinoCentrosPdf: async (padrinoId) => {
    const result = await exportPadrinoInvoice(padrinoId, { download: false });
    return { data: result.blob, filename: result.filename };
  }
};
