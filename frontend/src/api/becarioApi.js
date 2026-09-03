import { loadStore, saveRecord, paginate, ok } from './dataStore';

function matchesSearch(becario, search) {
  if (!search) return true;
  const term = String(search).toLowerCase();
  const persona = becario.persona || {};
  return [persona.nombre, persona.apellido, persona.cedula, persona.email, becario.centro_origen]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(term));
}

export const becarioApi = {
  getAll: async (params = {}) => {
    const store = await loadStore();
    let rows = store.becarios || [];
    if (params.universidad_id) {
      rows = rows.filter((row) => String(row.universidad_id) === String(params.universidad_id));
    }
    if (params.estado_beca) {
      rows = rows.filter((row) => row.estado_beca === params.estado_beca);
    }
    if (params.search) {
      rows = rows.filter((row) => matchesSearch(row, params.search));
    }
    const { rows: becarios, pagination } = paginate(rows, params);
    return ok({ becarios, pagination });
  },
  getById: async (id) => {
    const store = await loadStore();
    const becario = (store.becarios || []).find((row) => String(row.id) === String(id));
    if (!becario) {
      throw new Error('Becario no encontrado.');
    }
    return ok(becario);
  },
  create: async (data) => {
    const record = {
      ...data,
      id: Date.now(),
      persona: {
        nombre: data.nombre,
        apellido: data.apellido,
        cedula: data.cedula,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion
      },
      estado_beca: data.estado_beca || 'ACTIVA'
    };
    await saveRecord('becarios', record);
    return ok(record, 'Becario registrado correctamente');
  },
  update: async (id, data) => {
    const store = await loadStore();
    const current = (store.becarios || []).find((row) => String(row.id) === String(id)) || { id };
    const record = {
      ...current,
      ...data,
      id,
      persona: {
        ...(current.persona || {}),
        nombre: data.nombre ?? current.persona?.nombre,
        apellido: data.apellido ?? current.persona?.apellido,
        cedula: data.cedula ?? current.persona?.cedula,
        email: data.email ?? current.persona?.email,
        telefono: data.telefono ?? current.persona?.telefono,
        direccion: data.direccion ?? current.persona?.direccion
      }
    };
    await saveRecord('becarios', record);
    return ok(record, 'Becario actualizado correctamente');
  },
  delete: async (id) => {
    const store = await loadStore();
    const current = (store.becarios || []).find((row) => String(row.id) === String(id));
    if (current) {
      current.estado_beca = 'CANCELADA';
      await saveRecord('becarios', current);
    }
    return ok(null, 'Estado del becario actualizado a CANCELADA');
  },
  getUniversidades: async () => {
    const store = await loadStore();
    return ok(store.universidades || []);
  },
  getCarreras: async (universidad_id) => {
    const store = await loadStore();
    const rows = (store.carreras || []).filter((row) => !universidad_id || String(row.universidad_id) === String(universidad_id));
    return ok(rows);
  },
  getCiclos: async () => ok([]),
  getMaterias: async () => ok([]),
  enrollMaterias: async () => ok([]),
  updateCalificacion: async () => ok({}),
  uploadDocument: async () => ok({}),
  getDocumentsByBecario: async () => ok([]),
  deleteDocument: async () => ok({})
};
