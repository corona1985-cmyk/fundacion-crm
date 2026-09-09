import { loadStore, saveRecord, paginate, ok } from './dataStore';
import { normalizeText, personName } from '../utils/downloadFile';
import {
  buildDocChecklist,
  inferEtapa,
  kanbanCard,
  linkedPadrinos,
  riskBand
} from '../utils/expedienteHelpers';

function matchesSearch(becario, search) {
  if (!search) return true;
  const raw = normalizeText(search);
  const tokens = raw.split(' ').filter((t) => t.length >= 2);
  const blob = normalizeText([
    personName(becario),
    becario.nombre,
    becario.apellido,
    becario.persona?.nombre,
    becario.persona?.apellido,
    becario.persona?.cedula,
    becario.cedula,
    becario.persona?.email,
    becario.email,
    becario.persona?.telefono,
    becario.telefono,
    becario.centro_origen,
    becario.universidad_nombre,
    becario.universidad?.nombre,
    becario.carrera_nombre,
    becario.carrera?.nombre,
    becario.matricula,
    becario.estado_beca,
    becario.estado_graduacion_liceo,
    becario.etapa_operativa
  ].filter(Boolean).join(' '));

  if (!tokens.length) return blob.includes(raw);
  const hits = tokens.filter((t) => blob.includes(t)).length;
  if (hits === tokens.length) return true;
  if (tokens.length >= 3 && hits >= Math.ceil(tokens.length * 0.6)) return true;
  if (tokens.length === 1 && blob.includes(tokens[0])) return true;
  return raw.length >= 3 && blob.includes(raw);
}

async function getBecarioOrThrow(id) {
  const store = await loadStore();
  const becario = (store.becarios || []).find((row) => String(row.id) === String(id));
  if (!becario) throw new Error('Becario no encontrado.');
  return { store, becario };
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
    if (params.etapa_operativa) {
      rows = rows.filter((row) => inferEtapa(row, { pagos: store.pagos }) === params.etapa_operativa);
    }
    if (params.risk_band) {
      rows = rows.filter((row) => riskBand(row) === params.risk_band);
    }
    if (params.docs_incompletos === '1' || params.docs_incompletos === true) {
      rows = rows.filter((row) => buildDocChecklist(row.documentos || []).incompleto);
    }
    if (params.search) {
      rows = rows.filter((row) => matchesSearch(row, params.search));
    }
    const { rows: becarios, pagination } = paginate(rows, params);
    return ok({ becarios, pagination });
  },

  getById: async (id) => {
    const { becario } = await getBecarioOrThrow(id);
    return ok(becario);
  },

  /** Expediente 360: becario + padrinos + alarmas + pagos + checklist + etapa. */
  getExpediente: async (id) => {
    const { store, becario } = await getBecarioOrThrow(id);
    const pagos = (store.pagos || []).filter((p) => String(p.becario_id) === String(id));
    const alarmas = (store.alarmas || []).filter((a) => (
      String(a.becario_id) === String(id)
      || normalizeText(a.becario_nombre || '').includes(normalizeText(personName(becario)))
    ));
    const padrinos = linkedPadrinos(becario, store.padrinos);
    const aportes = (store.aportes || []).filter((a) => padrinos.some((p) => String(p.id) === String(a.padrino_id)));
    const documentos = becario.documentos || [];
    const checklist = buildDocChecklist(documentos);
    const etapa = inferEtapa(becario, { pagos });

    return ok({
      ...becario,
      pagos: pagos.length ? pagos : (becario.pagos || []),
      alarmas,
      padrinos,
      aportes_padrinos: aportes,
      documentos,
      checklist,
      etapa_operativa: etapa,
      bitacora: [...(becario.bitacora || [])].sort((a, b) => String(b.fecha || b.createdAt).localeCompare(String(a.fecha || a.createdAt)))
    });
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
      estado_beca: data.estado_beca || 'ACTIVA',
      etapa_operativa: data.etapa_operativa || 'inscrito',
      bitacora: [],
      documentos: []
    };
    await saveRecord('becarios', record);
    return ok(record, 'Becario registrado correctamente');
  },

  update: async (id, data) => {
    const { becario: current } = await getBecarioOrThrow(id);
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

  setEtapa: async (id, etapa_operativa) => {
    const { becario } = await getBecarioOrThrow(id);
    const record = { ...becario, etapa_operativa, updatedAt: new Date().toISOString() };
    await saveRecord('becarios', record);
    return ok(record, 'Etapa actualizada');
  },

  addBitacora: async (id, entry) => {
    const { becario } = await getBecarioOrThrow(id);
    const item = {
      id: Date.now(),
      fecha: entry.fecha || new Date().toISOString().slice(0, 10),
      tipo: entry.tipo || 'nota',
      nota: String(entry.nota || '').trim(),
      autor: entry.autor || 'Equipo FRP',
      createdAt: new Date().toISOString()
    };
    if (!item.nota) throw new Error('La nota de bitácora es obligatoria.');
    const bitacora = [item, ...(becario.bitacora || [])];
    const record = { ...becario, bitacora };
    await saveRecord('becarios', record);
    return ok(item, 'Nota agregada a la bitácora');
  },

  deleteBitacora: async (id, entryId) => {
    const { becario } = await getBecarioOrThrow(id);
    const bitacora = (becario.bitacora || []).filter((b) => String(b.id) !== String(entryId));
    await saveRecord('becarios', { ...becario, bitacora });
    return ok({}, 'Nota eliminada');
  },

  delete: async (id) => {
    const { becario: current } = await getBecarioOrThrow(id);
    current.estado_beca = 'CANCELADA';
    current.etapa_operativa = 'suspendido';
    await saveRecord('becarios', current);
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

  getDocs: async (id) => {
    const { becario } = await getBecarioOrThrow(id);
    return ok(becario.documentos || []);
  },

  uploadDoc: async (formDataOrObject) => {
    // Accept FormData from UI or plain object
    let becarioId;
    let tipo;
    let fechaVencimiento = null;
    let nombreArchivo = 'documento.pdf';

    if (typeof FormData !== 'undefined' && formDataOrObject instanceof FormData) {
      becarioId = formDataOrObject.get('becario_id');
      tipo = formDataOrObject.get('tipo_documento');
      fechaVencimiento = formDataOrObject.get('fecha_vencimiento');
      const file = formDataOrObject.get('archivo');
      if (file && file.name) nombreArchivo = file.name;
    } else {
      becarioId = formDataOrObject.becario_id;
      tipo = formDataOrObject.tipo_documento;
      fechaVencimiento = formDataOrObject.fecha_vencimiento;
      nombreArchivo = formDataOrObject.nombre_archivo || nombreArchivo;
    }

    const { becario } = await getBecarioOrThrow(becarioId);
    const doc = {
      id: Date.now(),
      becario_id: Number(becarioId) || becarioId,
      tipo_documento: String(tipo || 'OTRO').toUpperCase(),
      nombre_archivo: nombreArchivo,
      fecha_subida: new Date().toISOString(),
      fecha_vencimiento: fechaVencimiento || null,
      download_url: null
    };
    const documentos = [doc, ...(becario.documentos || [])];
    await saveRecord('becarios', { ...becario, documentos });
    return ok(doc, 'Documento registrado en el expediente');
  },

  deleteDoc: async (docId) => {
    const store = await loadStore();
    const becario = (store.becarios || []).find((b) => (b.documentos || []).some((d) => String(d.id) === String(docId)));
    if (!becario) throw new Error('Documento no encontrado.');
    const documentos = (becario.documentos || []).filter((d) => String(d.id) !== String(docId));
    await saveRecord('becarios', { ...becario, documentos });
    return ok({}, 'Documento eliminado');
  },

  uploadDocument: async (data) => becarioApi.uploadDoc(data),
  getDocumentsByBecario: async (id) => becarioApi.getDocs(id),
  deleteDocument: async (docId) => becarioApi.deleteDoc(docId),
  enrollSubject: async (id, values) => {
    const { becario } = await getBecarioOrThrow(id);
    const row = {
      id: Date.now(),
      becario_id: becario.id,
      materia_id: values.materia_id,
      ciclo_id: values.ciclo_id,
      calificacion: null,
      estado: 'EN_CURSO',
      materia: {
        id: values.materia_id,
        codigo: values.codigo || `MAT-${values.materia_id}`,
        nombre: values.nombre || `Materia ${values.materia_id}`,
        creditos: Number(values.creditos || 3)
      },
      ciclo: {
        id: values.ciclo_id,
        nombre: values.ciclo_nombre || `Ciclo ${values.ciclo_id}`
      }
    };
    const materias_cursadas = [row, ...(becario.materias_cursadas || [])];
    await saveRecord('becarios', { ...becario, materias_cursadas });
    return ok(row, 'Materia inscrita');
  },

  getKanban: async (params = {}) => {
    const store = await loadStore();
    const pagos = store.pagos || [];
    let rows = store.becarios || [];
    if (params.solo_activos !== '0') {
      rows = rows.filter((b) => {
        const e = String(b.estado_beca || '').toUpperCase();
        return e === 'ACTIVA' || e === 'SUSPENDIDA' || params.incluir_todos === '1';
      });
    }
    if (params.search) {
      rows = rows.filter((b) => matchesSearch(b, params.search));
    }

    const cards = rows.map((b) => {
      const relatedPagos = pagos.filter((p) => String(p.becario_id) === String(b.id));
      return kanbanCard(b, { pagos: relatedPagos, documentos: b.documentos });
    });

    const byEtapa = {};
    const byRisk = { ok: [], bajo: [], critico: [], sin_indice: [] };
    cards.forEach((card) => {
      if (!byEtapa[card.etapa]) byEtapa[card.etapa] = [];
      byEtapa[card.etapa].push(card);
      byRisk[card.risk] = byRisk[card.risk] || [];
      byRisk[card.risk].push(card);
    });

    const docsIncompletos = cards.filter((c) => c.docs_incompleto).length;
    const riesgo = cards.filter((c) => c.risk === 'bajo' || c.risk === 'critico').length;

    return ok({
      cards,
      byEtapa,
      byRisk,
      resumen: {
        total: cards.length,
        riesgo,
        docs_incompletos: docsIncompletos,
        pago_atrasado: (byEtapa.pago_atrasado || []).length,
        graduacion: (byEtapa.graduacion || []).length
      }
    });
  },

  getDashboardShortcuts: async () => {
    const store = await loadStore();
    const activos = (store.becarios || []).filter((b) => String(b.estado_beca || '').toUpperCase() === 'ACTIVA');
    const riesgo = activos.filter((b) => {
      const r = riskBand(b);
      return r === 'bajo' || r === 'critico';
    });
    const docs = activos.filter((b) => buildDocChecklist(b.documentos || []).incompleto);
    const pagosVencidos = (store.pagos || []).filter((p) => ['atrasado', 'vencido', 'pendiente'].includes(String(p.estado || '').toLowerCase()));
    const graduaciones = (store.becarios || []).filter((b) => {
      const g = String(b.estado_graduacion_liceo || '');
      return g && !/^pendiente$/i.test(g) && !/graduado universitario/i.test(g);
    });
    const alarmasPend = (store.alarmas || []).filter((a) => String(a.estado || '').toLowerCase() === 'pendiente');

    return ok({
      activos: activos.length,
      riesgo_academico: riesgo.length,
      docs_incompletos: docs.length,
      pagos_vencidos: pagosVencidos.length,
      graduaciones: graduaciones.length,
      alarmas_pendientes: alarmasPend.length
    });
  }
};
