import { INDICE_MINIMO, INDICE_CRITICO } from './academicConstants';
import { personName } from './downloadFile';

export const ETAPAS_OPERATIVAS = [
  { key: 'postulacion', label: 'Postulación', color: '#8c8c8c' },
  { key: 'inscrito', label: 'Inscrito', color: '#1890ff' },
  { key: 'activo', label: 'Activo', color: '#52c41a' },
  { key: 'riesgo', label: 'Riesgo académico', color: '#fa8c16' },
  { key: 'pago_atrasado', label: 'Pago atrasado', color: '#f5222d' },
  { key: 'graduacion', label: 'Graduación', color: '#722ed1' },
  { key: 'egresado', label: 'Egresado', color: '#13c2c2' },
  { key: 'suspendido', label: 'Suspendido / cancelado', color: '#eb2f96' }
];

export const REQUIRED_DOC_TYPES = [
  { tipo: 'CEDULA', label: 'Cédula de identidad' },
  { tipo: 'CERTIFICADO_ESTUDIOS', label: 'Certificado de estudios' },
  { tipo: 'TITULO_BACHILLER', label: 'Título de bachiller' },
  { tipo: 'RECORD_NOTAS', label: 'Récord de notas' },
  { tipo: 'ACTA_NACIMIENTO', label: 'Acta de nacimiento' }
];

export const BITACORA_TIPOS = [
  { value: 'nota', label: 'Nota' },
  { value: 'llamada', label: 'Llamada' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'visita', label: 'Visita / tutoría' },
  { value: 'reunion', label: 'Reunión' },
  { value: 'documento', label: 'Documento' },
  { value: 'otro', label: 'Otro' }
];

export function etapaMeta(key) {
  return ETAPAS_OPERATIVAS.find((e) => e.key === key) || ETAPAS_OPERATIVAS[2];
}

export function gpaOf(becario) {
  const acum = becario?.promedio_general != null ? Number(becario.promedio_general) : null;
  const cuat = becario?.indice_cuatrimestral != null ? Number(becario.indice_cuatrimestral) : null;
  return { acum, cuat };
}

export function riskBand(becario) {
  const { acum, cuat } = gpaOf(becario);
  const value = acum != null ? acum : cuat;
  if (value == null) return 'sin_indice';
  if (value < INDICE_CRITICO) return 'critico';
  if (value < INDICE_MINIMO) return 'bajo';
  return 'ok';
}

export function riskBandLabel(band) {
  const map = {
    ok: `Índice ≥ ${INDICE_MINIMO}`,
    bajo: `${INDICE_CRITICO} – ${INDICE_MINIMO}`,
    critico: `< ${INDICE_CRITICO}`,
    sin_indice: 'Sin índice'
  };
  return map[band] || band;
}

/** Infiere etapa si el becario aún no tiene etapa_operativa manual. */
export function inferEtapa(becario, ctx = {}) {
  if (becario?.etapa_operativa) return becario.etapa_operativa;

  const estado = String(becario?.estado_beca || '').toUpperCase();
  if (estado === 'FINALIZADA') return 'egresado';
  if (estado === 'SUSPENDIDA' || estado === 'CANCELADA') return 'suspendido';

  const pagos = ctx.pagos || becario?.pagos || [];
  const atrasado = pagos.some((p) => ['atrasado', 'vencido'].includes(String(p.estado || '').toLowerCase()));
  if (atrasado) return 'pago_atrasado';

  const grad = String(becario?.estado_graduacion_liceo || '');
  if (grad && !/^pendiente$/i.test(grad) && !/graduado universitario/i.test(grad)) {
    return 'graduacion';
  }

  const band = riskBand(becario);
  if (estado === 'ACTIVA' && (band === 'bajo' || band === 'critico')) return 'riesgo';
  if (estado === 'ACTIVA') return 'activo';
  if (becario?.matricula) return 'inscrito';
  return 'postulacion';
}

export function buildDocChecklist(documentos = []) {
  const byType = new Map();
  (documentos || []).forEach((doc) => {
    const tipo = String(doc.tipo_documento || doc.tipo || '').toUpperCase();
    if (!tipo) return;
    const prev = byType.get(tipo) || [];
    prev.push(doc);
    byType.set(tipo, prev);
  });

  const items = REQUIRED_DOC_TYPES.map((req) => {
    const docs = byType.get(req.tipo) || [];
    const latest = docs[0] || null;
    const expired = latest?.fecha_vencimiento
      ? new Date(latest.fecha_vencimiento) < new Date()
      : false;
    return {
      ...req,
      presente: docs.length > 0,
      vencido: expired,
      documento: latest,
      cantidad: docs.length
    };
  });

  const completos = items.filter((i) => i.presente && !i.vencido).length;
  return {
    items,
    completos,
    total: items.length,
    incompleto: completos < items.length,
    porcentaje: Math.round((completos / items.length) * 100)
  };
}

export function linkedPadrinos(becario, padrinos = []) {
  const id = String(becario?.id);
  return (padrinos || []).filter((p) => (
    String(p.id) === String(becario?.padrino_id)
    || (p.becario_ids || []).map(String).includes(id)
  ));
}

export function kanbanCard(becario, ctx = {}) {
  const { acum, cuat } = gpaOf(becario);
  const etapa = inferEtapa(becario, ctx);
  const checklist = buildDocChecklist(becario.documentos || ctx.documentos || []);
  return {
    id: becario.id,
    nombre: personName(becario),
    universidad: becario.universidad_nombre || becario.universidad?.nombre || 'N/A',
    carrera: becario.carrera_nombre || becario.carrera?.nombre || 'N/A',
    centro: becario.centro_origen || 'N/A',
    estado_beca: becario.estado_beca,
    etapa,
    risk: riskBand(becario),
    acum,
    cuat,
    matricula: becario.matricula || 'N/D',
    docs_pct: checklist.porcentaje,
    docs_incompleto: checklist.incompleto
  };
}
