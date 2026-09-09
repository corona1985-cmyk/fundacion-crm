import { loadStore } from '../api/dataStore';
import { normalizeText, personName, formatMoney } from './downloadFile';
import { exportPadrinoInvoice } from './facturaPadrino';
import { INDICE_MINIMO } from './academicConstants';

const MEMORY_KEY = 'crm_bot_memory_v1';
const FEEDBACK_KEY = 'crm_bot_feedback_v1';

function defaultMemory() {
  return {
    facts: [], // {q, a, hits, updatedAt}
    aliases: {}, // alias -> canonical name
    notes: []
  };
}

export function loadBotMemory() {
  try {
    return { ...defaultMemory(), ...(JSON.parse(localStorage.getItem(MEMORY_KEY) || '{}')) };
  } catch {
    return defaultMemory();
  }
}

export function saveBotMemory(memory) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  return memory;
}

function learnFact(question, answer) {
  const memory = loadBotMemory();
  const q = normalizeText(question);
  const existing = memory.facts.find((f) => normalizeText(f.q) === q);
  if (existing) {
    existing.a = answer;
    existing.updatedAt = new Date().toISOString();
    existing.hits = (existing.hits || 0) + 1;
  } else {
    memory.facts.push({
      q: question.trim(),
      a: answer.trim(),
      hits: 1,
      updatedAt: new Date().toISOString()
    });
  }
  saveBotMemory(memory);
  return memory;
}

function learnAlias(alias, canonical) {
  const memory = loadBotMemory();
  memory.aliases[normalizeText(alias)] = canonical.trim();
  saveBotMemory(memory);
  return memory;
}

function rememberFeedback(query, reply, useful) {
  try {
    const list = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
    list.unshift({
      query,
      reply: String(reply || '').slice(0, 500),
      useful: !!useful,
      at: new Date().toISOString()
    });
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list.slice(0, 200)));
  } catch {
    // ignore
  }
}

export function markBotUseful(query, reply) {
  rememberFeedback(query, reply, true);
}

export function markBotNotUseful(query, reply) {
  rememberFeedback(query, reply, false);
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = i - 1;
    rows[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = rows[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[j] = Math.min(rows[j] + 1, rows[j - 1] + 1, prev + cost);
      prev = current;
    }
  }
  return rows[b.length];
}

const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'de', 'del', 'un', 'una', 'y', 'o', 'en', 'al', 'a', 'por', 'para',
  'con', 'sin', 'me', 'te', 'se', 'mi', 'tu', 'su', 'es', 'son', 'hay', 'dame', 'das', 'busca',
  'buscar', 'quiero', 'saber', 'cual', 'cuales', 'quien', 'quienes', 'como', 'donde', 'que',
  'info', 'informacion', 'datos', 'lista', 'ver', 'mostrar', 'dime', 'sobre', 'del', 'este',
  'esta', 'estos', 'estas', 'indice', 'promedio', 'estudiante', 'estudiantes', 'becado', 'becados',
  'becaria', 'becarias'
]);

function queryTokens(query) {
  return normalizeText(query)
    .split(' ')
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function tokenHits(haystack, tokens) {
  const text = normalizeText(haystack);
  const parts = text.split(' ').filter(Boolean);
  let hits = 0;
  let score = 0;
  tokens.forEach((token) => {
    if (!token || token.length < 2) return;
    if (text.includes(token)) {
      hits += 1;
      score += token.length + 3;
      // bonus if token matches start of a name part
      if (parts.some((part) => part.startsWith(token))) score += 2;
      return;
    }
    const close = parts.some((part) => {
      if (part.startsWith(token) || token.startsWith(part)) return part.length >= 3 || token.length >= 3;
      const maxDist = token.length <= 4 ? 1 : 2;
      return Math.abs(part.length - token.length) <= maxDist && levenshtein(part, token) <= maxDist;
    });
    if (close) {
      hits += 1;
      score += Math.max(token.length - 1, 1);
    }
  });
  return { hits, score };
}

function resolveAliases(text) {
  const memory = loadBotMemory();
  let out = String(text || '');
  Object.entries(memory.aliases || {}).forEach(([alias, canonical]) => {
    if (!alias) return;
    const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'ig');
    out = out.replace(re, canonical);
  });
  return out;
}

function findLearnedAnswer(raw) {
  const memory = loadBotMemory();
  const q = normalizeText(raw);
  if (!q) return null;
  let best = null;
  let bestScore = 0;
  for (const fact of memory.facts || []) {
    const fq = normalizeText(fact.q);
    if (!fq) continue;
    if (fq === q || q.includes(fq) || fq.includes(q)) {
      const score = Math.max(fq.length, q.length) + (fact.hits || 0);
      if (score > bestScore) {
        best = fact;
        bestScore = score;
      }
      continue;
    }
    const tokens = fq.split(' ').filter((t) => t.length > 2);
    const { hits, score } = tokenHits(q, tokens);
    if (hits >= Math.max(2, Math.ceil(tokens.length * 0.6)) && score > bestScore) {
      best = fact;
      bestScore = score;
    }
  }
  if (!best) return null;
  best.hits = (best.hits || 0) + 1;
  saveBotMemory(memory);
  return `🧠 *Aprendido*\n\n${best.a}\n\n_Fuente: conocimiento enseñado al bot._`;
}

function helpMenu() {
  const memory = loadBotMemory();
  return `🤖 *ASISTENTE INTELIGENTE CRM — ROMPIENDO PARADIGMAS*\n\n` +
    `Busco dentro de la base de datos y puedo aprender respuestas nuevas.\n\n` +
    `📌 *Pregúntame en lenguaje natural, por ejemplo:*\n` +
    `• ¿Cuál es el índice de Freily?\n` +
    `• ¿Quiénes tienen índice bajo?\n` +
    `• ¿Cuántos becarios activos hay?\n` +
    `• Dame el padrino de Jeili\n` +
    `• Alarmas pendientes\n` +
    `• Resumen financiero\n` +
    `• Itinerario de graduaciones\n` +
    `• Factura Bryan Collado\n` +
    `• Becados del Politécnico Canadá\n\n` +
    `🧠 *Enseñarme:*\n` +
    `• \`aprende: pregunta => respuesta\`\n` +
    `• \`alias: Freylin = Freily Delvion Arias Severino\`\n\n` +
    `📚 He aprendido *${(memory.facts || []).length}* dato(s) y *${Object.keys(memory.aliases || {}).length}* alias.\n` +
    `Escribe *#* para ver este menú.`;
}

function gpaOf(b) {
  const acum = b.promedio_general != null ? Number(b.promedio_general) : null;
  const cuat = b.indice_cuatrimestral != null ? Number(b.indice_cuatrimestral) : null;
  return { acum, cuat };
}

function formatBecarioCard(b, padrinos = []) {
  const { acum, cuat } = gpaOf(b);
  const linked = (padrinos || []).filter((p) => (p.becario_ids || []).map(String).includes(String(b.id)));
  const padrinoTxt = linked.length
    ? linked.map((p) => p.razon_social || personName(p)).join(' / ')
    : 'Por asignar';
  const risk = (acum != null && acum < INDICE_MINIMO) || (cuat != null && cuat < INDICE_MINIMO);
  return `👤 *${personName(b)}*\n` +
    `🏫 Universidad: ${b.universidad_nombre || b.universidad?.nombre || 'N/A'}\n` +
    `📚 Carrera: ${b.carrera_nombre || b.carrera?.nombre || 'N/A'}\n` +
    `🏛️ Centro: ${b.centro_origen || 'N/A'}\n` +
    `📈 Índice acum.: *${acum != null ? acum.toFixed(2) : 'Sin registrar'}*` +
    `${cuat != null ? ` | Cuatr.: *${cuat.toFixed(2)}*` : ''}` +
    `${risk ? ' ⚠️ bajo 3.2' : ''}\n` +
    `🪪 Matrícula: ${b.matricula || 'N/D'} | Cédula: ${b.cedula || b.persona?.cedula || 'N/D'}\n` +
    `📞 Tel: ${b.telefono || b.persona?.telefono || 'N/D'} | ✉️ ${b.email || b.persona?.email || 'N/D'}\n` +
    `🤝 Padrino: ${padrinoTxt}\n` +
    `🟢 Estado: *${b.estado_beca || 'N/A'}* | Grad. liceo: ${b.estado_graduacion_liceo || 'N/A'}` +
    `${b.fecha_seleccion ? ` | Selección: ${b.fecha_seleccion}` : ''}`;
}

function searchBecarios(store, query) {
  let tokens = queryTokens(query);
  // If only stopwords remained, fall back to raw tokens so short queries still work
  if (!tokens.length) {
    tokens = normalizeText(query).split(' ').filter((t) => t.length >= 2);
  }
  if (!tokens.length) return [];
  const raw = normalizeText(query);
  return (store.becarios || [])
    .map((row) => {
      const blob = [
        personName(row),
        row.nombre,
        row.apellido,
        row.centro_origen,
        row.universidad_nombre,
        row.universidad?.nombre,
        row.carrera_nombre,
        row.carrera?.nombre,
        row.matricula,
        row.cedula,
        row.persona?.cedula,
        row.email,
        row.persona?.email,
        row.telefono,
        row.persona?.telefono,
        row.estado_beca,
        row.estado_graduacion_liceo
      ].filter(Boolean).join(' ');
      const hit = tokenHits(blob, tokens);
      // Also allow full-string contains for multi-word names / matriculas
      if (hit.hits === 0 && raw.length >= 3 && normalizeText(blob).includes(raw)) {
        return { row, hits: 1, score: raw.length };
      }
      // Accept partial single-token match even with typos
      if (hit.hits === 0 && tokens.length === 1) {
        const soft = tokenHits(blob, tokens);
        if (soft.score > 0) return { row, ...soft };
      }
      return { row, ...hit };
    })
    .filter((item) => item.hits > 0 || item.score > 0)
    .sort((a, b) => b.score - a.score || b.hits - a.hits)
    .map((item) => item.row);
}

function searchPadrinos(store, query) {
  let tokens = queryTokens(query);
  if (!tokens.length) {
    tokens = normalizeText(query).split(' ').filter((t) => t.length >= 2);
  }
  if (!tokens.length) return [];
  const raw = normalizeText(query);
  return (store.padrinos || [])
    .map((row) => {
      const blob = [
        personName(row),
        row.razon_social,
        row.nombre,
        row.apellido,
        row.email,
        row.telefono,
        row.tipo,
        row.cedula
      ].filter(Boolean).join(' ');
      const hit = tokenHits(blob, tokens);
      if (hit.hits === 0 && raw.length >= 3 && normalizeText(blob).includes(raw)) {
        return { row, hits: 1, score: raw.length };
      }
      return { row, ...hit };
    })
    .filter((item) => item.hits > 0 || item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.row);
}

async function handleTeach(raw) {
  // aprende: pregunta => respuesta
  const m1 = raw.match(/^\s*(aprende|enseña|ensena|learn)\s*:\s*(.+?)\s*(?:=>|->|=)\s*(.+)\s*$/i);
  if (m1) {
    learnFact(m1[2], m1[3]);
    return `✅ Aprendí esto:\n*Pregunta:* ${m1[2].trim()}\n*Respuesta:* ${m1[3].trim()}\n\nLa próxima vez que pregunten algo similar, lo usaré.`;
  }
  // alias: X = Y
  const m2 = raw.match(/^\s*alias\s*:\s*(.+?)\s*=\s*(.+)\s*$/i);
  if (m2) {
    learnAlias(m2[1], m2[2]);
    return `✅ Alias guardado: *${m2[1].trim()}* → *${m2[2].trim()}*`;
  }
  // olvida: pregunta
  const m3 = raw.match(/^\s*(olvida|borra aprendizaje)\s*:\s*(.+)\s*$/i);
  if (m3) {
    const memory = loadBotMemory();
    const q = normalizeText(m3[2]);
    memory.facts = (memory.facts || []).filter((f) => normalizeText(f.q) !== q && !normalizeText(f.q).includes(q));
    saveBotMemory(memory);
    return `🧹 Eliminé aprendizajes relacionados con *${m3[2].trim()}*.`;
  }
  return null;
}

async function answerStats(store) {
  const becarios = store.becarios || [];
  const activos = becarios.filter((b) => String(b.estado_beca || '').toUpperCase() === 'ACTIVA');
  const finalizados = becarios.filter((b) => String(b.estado_beca || '').toUpperCase() === 'FINALIZADA');
  const bajos = activos.filter((b) => {
    const { acum, cuat } = gpaOf(b);
    return (acum != null && acum < INDICE_MINIMO) || (cuat != null && cuat < INDICE_MINIMO);
  });
  const sinIndice = activos.filter((b) => b.promedio_general == null && b.indice_cuatrimestral == null);
  const porUni = {};
  activos.forEach((b) => {
    const key = b.universidad_nombre || b.universidad?.nombre || 'Sin universidad';
    porUni[key] = (porUni[key] || 0) + 1;
  });
  const uniLines = Object.entries(porUni)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `  · ${name}: *${count}*`)
    .join('\n');
  const alarmasPend = (store.alarmas || []).filter((a) => String(a.estado || '').toLowerCase() === 'pendiente').length;
  return `📊 *ESTADÍSTICAS DEL CRM*\n\n` +
    `• Becarios totales: *${becarios.length}*\n` +
    `• Activos: *${activos.length}*\n` +
    `• Egresados / finalizados: *${finalizados.length}*\n` +
    `• Índice bajo (< ${INDICE_MINIMO}): *${bajos.length}*\n` +
    `• Activos sin índice aún: *${sinIndice.length}*\n` +
    `• Padrinos: *${(store.padrinos || []).length}*\n` +
    `• Alarmas totales / pendientes: *${(store.alarmas || []).length}* / *${alarmasPend}*\n` +
    `• Aportes registrados: *${(store.aportes || []).length}*\n` +
    `• Pagos: *${(store.pagos || []).length}* | Gastos: *${(store.gastos || []).length}*\n\n` +
    `🏫 *Activos por universidad*\n${uniLines || '  · Sin datos'}`;
}

async function answerLowGpa(store) {
  const rows = (store.becarios || [])
    .filter((b) => String(b.estado_beca || '').toUpperCase() === 'ACTIVA')
    .map((b) => ({ b, ...gpaOf(b) }))
    .filter(({ acum, cuat }) => (acum != null && acum < INDICE_MINIMO) || (cuat != null && cuat < INDICE_MINIMO))
    .sort((a, b) => (a.acum ?? 99) - (b.acum ?? 99));

  if (!rows.length) return `✅ No hay becarios activos con índice bajo ${INDICE_MINIMO}.`;

  let response = `⚠️ *BECARIOS CON ÍNDICE BAJO (< ${INDICE_MINIMO}) — ${rows.length}*\n\n`;
  rows.forEach((item, index) => {
    response += `${index + 1}. *${personName(item.b)}* — acum ${item.acum != null ? item.acum.toFixed(2) : 'N/D'}` +
      `${item.cuat != null ? ` / cuat ${item.cuat.toFixed(2)}` : ''}` +
      ` | ${item.b.universidad_nombre || 'N/A'} | ${item.b.centro_origen || 'N/A'}\n`;
  });
  return response;
}

async function answerByCenter(store, query) {
  const q = normalizeText(query)
    .replace(/becad[oa]s?|del|de|la|el|centro|politecnico|liceo|estudiantes?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = q.split(' ').filter((t) => t.length > 2 && !STOPWORDS.has(t));
  const scored = (store.becarios || [])
    .map((b) => {
      const c = normalizeText(b.centro_origen || '');
      if (!c || !tokens.length) return null;
      const hit = tokenHits(c, tokens);
      // Any meaningful token match is enough (more abundant results)
      const ok = tokens.some((t) => c.includes(t)) || hit.hits >= 1;
      if (!ok) return null;
      return { b, score: hit.score + (tokens.every((t) => c.includes(t)) ? 10 : 0) };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || personName(a.b).localeCompare(personName(b.b), 'es'));
  if (!scored.length) {
    return null;
  }
  let response = `🏫 *BECADOS DEL CENTRO (${scored.length})*\n\n`;
  scored.forEach((item, i) => {
    const b = item.b;
    const { acum, cuat } = gpaOf(b);
    response += `${i + 1}. *${personName(b)}* — ${b.estado_beca}` +
      `${acum != null ? ` | índice ${acum.toFixed(2)}` : ''}` +
      `${cuat != null ? ` / ${cuat.toFixed(2)}` : ''}` +
      ` | ${b.universidad_nombre || 'N/A'} | ${b.centro_origen || ''}\n`;
  });
  return response;
}

async function answerAlarmas(store) {
  const rows = (store.alarmas || []).filter((row) => String(row.estado || '').toLowerCase() === 'pendiente');
  if (!rows.length) return '✅ No hay alarmas pendientes.';
  let response = `🚨 *ALARMAS PENDIENTES (${rows.length})*\n\n`;
  rows.forEach((row, index) => {
    response += `${index + 1}. *[${String(row.nivel || 'medio').toUpperCase()}]* ${row.titulo || row.tipo}` +
      `${row.becario_nombre ? ` — ${row.becario_nombre}` : ''}` +
      `${row.descripcion ? `\n   ${String(row.descripcion).slice(0, 120)}` : ''}\n`;
  });
  return response;
}

async function answerResumen(store) {
  const aportes = (store.aportes || []).reduce((sum, row) => sum + parseFloat(row.monto || 0), 0);
  const pagos = (store.pagos || [])
    .filter((row) => String(row.estado || '').toLowerCase() === 'pagado')
    .reduce((sum, row) => sum + parseFloat(row.monto || 0), 0);
  const gastos = (store.gastos || []).reduce((sum, row) => sum + parseFloat(row.monto || 0), 0);
  return `💰 *RESUMEN FINANCIERO*\n\n` +
    `• Aportes: *RD$ ${formatMoney(aportes)}*\n` +
    `• Pagos universitarios: *RD$ ${formatMoney(pagos)}*\n` +
    `• Gastos: *RD$ ${formatMoney(gastos)}*\n` +
    `• Balance neto: *RD$ ${formatMoney(aportes - pagos - gastos)}*\n\n` +
    `Becarios: *${(store.becarios || []).length}* | Padrinos: *${(store.padrinos || []).length}*`;
}

async function answerItinerario(store) {
  const rows = (store.becarios || []).filter((row) => row.estado_graduacion_liceo && !/^pendiente$/i.test(row.estado_graduacion_liceo));
  if (!rows.length) return '🎓 No hay itinerario de graduaciones con fechas/estado distinto de Pendiente.';
  let response = `🎓 *ITINERARIO / ESTADO DE GRADUACIÓN (${rows.length})*\n\n`;
  rows
    .sort((a, b) => personName(a).localeCompare(personName(b), 'es'))
    .forEach((row, index) => {
      response += `${index + 1}. *${personName(row)}* — ${row.estado_graduacion_liceo} | ${row.centro_origen || 'N/A'}` +
        `${row.universidad_nombre ? ` | ${row.universidad_nombre}` : ''}\n`;
    });
  return response;
}

async function answerFactura(store, raw) {
  const name = String(raw || '').replace(/^(factura|invoice|cotizacion|cotización|genera(r)?\s+factura)/i, '').trim();
  const found = name ? searchPadrinos(store, name) : [];
  const padrino = found[0] || (store.padrinos || [])[0];
  if (!padrino) {
    const list = (store.padrinos || []).slice(0, 20).map((row) => `• ${personName(row)}`).join('\n');
    return `❌ No encontré padrino *"${name || 'indicado'}"*.\n\nPrueba con:\n${list}`;
  }
  if (found.length > 1) {
    // still generate for best match, but mention alternatives
    const alts = found.slice(1, 6).map((p) => personName(p)).join(', ');
    const result = await exportPadrinoInvoice(padrino.id, { download: true });
    return `${result.summary.text}\n\n_También coinciden: ${alts}_`;
  }
  const result = await exportPadrinoInvoice(padrino.id, { download: true });
  return result.summary.text;
}

async function answerPadrinoDetail(store, query) {
  const found = searchPadrinos(store, query);
  if (!found.length) return null;
  if (found.length > 1) {
    let response = `🤝 *PADRINOS ENCONTRADOS (${found.length})*\n\n`;
    found.slice(0, 15).forEach((p, i) => {
      const becarios = (store.becarios || []).filter((b) => (p.becario_ids || []).map(String).includes(String(b.id)));
      response += `${i + 1}. *${personName(p)}* — ${p.razon_social || 'N/A'} | becarios: ${becarios.length}\n`;
    });
    if (found.length > 15) response += `\n_…y ${found.length - 15} más. Sé más específico._\n`;
    response += `\n📌 Detalle del mejor match:\n\n`;
    const detail = await answerPadrinoDetailSingle(store, found[0]);
    return response + detail;
  }
  return answerPadrinoDetailSingle(store, found[0]);
}

function answerPadrinoDetailSingle(store, p) {
  const aportes = (store.aportes || []).filter((a) => String(a.padrino_id) === String(p.id));
  const total = aportes.reduce((s, a) => s + parseFloat(a.monto || 0), 0);
  const becarios = (store.becarios || []).filter((b) => (p.becario_ids || []).map(String).includes(String(b.id)));
  let response = `🤝 *PADRINO*\n\n` +
    `• Nombre: *${personName(p)}*\n` +
    `• Razón social: ${p.razon_social || 'N/A'}\n` +
    `• Tipo: ${p.tipo || 'N/A'}\n` +
    `• Tel: ${p.telefono || 'N/D'} | Email: ${p.email || 'N/D'}\n` +
    `• Aportes registrados: *${aportes.length}* (RD$ ${formatMoney(total)})\n` +
    `• Becarios asignados: *${becarios.length}*\n`;
  if (becarios.length) {
    response += `\n🎓 *Becarios:*\n`;
    becarios.forEach((b, i) => {
      const { acum } = gpaOf(b);
      response += `${i + 1}. ${personName(b)} — ${b.estado_beca || 'N/A'}` +
        `${acum != null ? ` | índice ${acum.toFixed(2)}` : ''} | ${b.universidad_nombre || 'N/A'}\n`;
    });
  }
  return response;
}

async function answerStudent(store, query) {
  const cleaned = String(query || '')
    .replace(/^(indice|índice|busca(r)?|quien es|quién es|info(rmacion|rmación)? de|datos de|promedio de|índice de|indice de)\s*/i, '')
    .trim();
  const found = searchBecarios(store, cleaned || query);
  if (!found.length) return null;
  const LIMIT = 12;
  const top = found.slice(0, LIMIT);
  let response = `📊 *RESULTADO EN BASE DE DATOS (${found.length} coincidencia${found.length > 1 ? 's' : ''})*\n\n`;
  top.forEach((b, i) => {
    response += `${i + 1}. ${formatBecarioCard(b, store.padrinos)}\n\n`;
  });
  if (found.length > LIMIT) {
    response += `_…y ${found.length - LIMIT} más. Nombres adicionales:_\n`;
    found.slice(LIMIT, LIMIT + 30).forEach((b, i) => {
      response += `${LIMIT + i + 1}. ${personName(b)} — ${b.centro_origen || 'N/A'}\n`;
    });
    if (found.length > LIMIT + 30) response += `\n_…y ${found.length - LIMIT - 30} adicionales. Sé más específico._`;
  }
  return response;
}

function detectIntent(msg) {
  if (/(cuantos|cuántos|cantidad|total|estadistic|resumen general|dashboard)/.test(msg)) return 'stats';
  if (/(indice bajo|índice bajo|bajo indice|bajo índice|promedio bajo|menos de 3|alarmas? de promedio)/.test(msg)) return 'low_gpa';
  if (/(alarma|alerta|pendiente)/.test(msg)) return 'alarmas';
  if (/(resumen financ|balance|aport|egreso|pago universit)/.test(msg)) return 'resumen';
  if (/(itinerario|graduacion|graduación|acto de grado)/.test(msg)) return 'itinerario';
  if (/(factura|cotizacion|cotización|invoice)/.test(msg)) return 'factura';
  if (/(padrino|patrocin|sponsor)/.test(msg)) return 'padrino';
  if (/(becad|estudiante|indice|índice|promedio|matr[ií]cula|carrera|universid)/.test(msg)
    || /(del|de la|del polit|liceo|centro)/.test(msg)) return 'search';
  return 'search';
}

export async function askIntelligentBot(message) {
  const raw = String(message || '').trim();
  if (!raw || raw === '#' || ['hola', 'menu', 'ayuda', 'help', 'start'].includes(normalizeText(raw))) {
    return helpMenu();
  }

  const taught = await handleTeach(raw);
  if (taught) return taught;

  const learned = findLearnedAnswer(raw);
  // Prefer learned only for non-data lookups; still allow override for pure FAQ
  const resolved = resolveAliases(raw);
  const msg = normalizeText(resolved);

  if (msg === '?' || msg === 'lista' || msg.includes('lista estudiante') || /^\s*(indice|índice)\s*\?\s*$/i.test(raw)) {
    const store = await loadStore();
    const activos = (store.becarios || [])
      .filter((b) => String(b.estado_beca || '').toUpperCase() === 'ACTIVA')
      .sort((a, b) => personName(a).localeCompare(personName(b), 'es'));
    let response = `📋 *ESTUDIANTES ACTIVOS (${activos.length})*\n\n`;
    activos.forEach((row, index) => {
      const { acum, cuat } = gpaOf(row);
      response += `${index + 1}. ${personName(row)}` +
        `${acum != null ? ` | ${acum.toFixed(2)}` : ''}` +
        `${cuat != null ? `/${cuat.toFixed(2)}` : ''}` +
        ` | ${row.universidad_nombre || 'N/A'} | ${row.centro_origen || 'N/A'}\n`;
    });
    response += `\n\n💡 Pregunta: *índice Nombre* o escribe el nombre directamente.`;
    return response;
  }

  if (/^conocimiento$|^lo que sabes$|^aprendido$/i.test(msg)) {
    const memory = loadBotMemory();
    if (!(memory.facts || []).length) return '🧠 Todavía no me han enseñado datos personalizados. Usa `aprende: pregunta => respuesta`.';
    let response = `🧠 *CONOCIMIENTO APRENDIDO (${memory.facts.length})*\n\n`;
    memory.facts.slice(0, 30).forEach((f, i) => {
      response += `${i + 1}. *${f.q}* → ${String(f.a).slice(0, 120)}\n`;
    });
    return response;
  }

  const store = await loadStore();
  const intent = detectIntent(msg);

  if (intent === 'stats') return answerStats(store);
  if (intent === 'low_gpa') return answerLowGpa(store);
  if (intent === 'alarmas') return answerAlarmas(store);
  if (intent === 'resumen') return answerResumen(store);
  if (intent === 'itinerario') return answerItinerario(store);
  if (intent === 'factura') return answerFactura(store, resolved);

  if (intent === 'padrino') {
    // "padrino de X" => student; "padrino Luis" => padrino entity
    if (/padrino de|patrocinador de|quien patrocina|quién patrocina/.test(msg)) {
      const name = resolved.replace(/.*\b(de|patrocina)\b/i, '').trim();
      const student = await answerStudent(store, name);
      if (student) return student;
    }
    const padrino = await answerPadrinoDetail(store, resolved.replace(/padrino|patrocinador|sponsor/ig, '').trim() || resolved);
    if (padrino) return padrino;
  }

  // center-focused
  if (/(politecnico|politécnico|liceo|centro|becados? del|estudiantes del)/.test(msg)) {
    const byCenter = await answerByCenter(store, resolved);
    if (byCenter) return byCenter;
  }

  // explicit indice command
  if (msg.startsWith('indice') || msg.startsWith('índice') || msg.startsWith('promedio')) {
    const rest = resolved.replace(/^(indice|índice|promedio)/i, '').trim();
    const student = await answerStudent(store, rest || resolved);
    if (student) return student;
    return `❌ No encontré ese estudiante en la base.\n\nEscribe *?* para ver la lista o enséñame un alias: \`alias: nombre mal escrito = Nombre correcto\``;
  }

  // natural language student / general search
  const student = await answerStudent(store, resolved);
  if (student && !student.includes('0 coincidencia')) {
    // if search too weak (generic words only), fall through
    const generic = queryTokens(resolved).length === 0;
    if (!generic) return student;
  }

  if (learned) return learned;

  // last chance: padrino search
  const padrino = await answerPadrinoDetail(store, resolved);
  if (padrino) return padrino;

  return `🤔 No encontré una coincidencia clara en la base para: *"${raw}"*.\n\n` +
    `Prueba con:\n` +
    `• un nombre de becario o padrino\n` +
    `• "índice bajo"\n` +
    `• "alarmas"\n` +
    `• "resumen"\n` +
    `• o enséñame: \`aprende: ${raw} => tu respuesta\`\n\n` +
    `Escribe *#* para ver el menú completo.`;
}
