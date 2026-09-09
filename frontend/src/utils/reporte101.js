import centrosConfig from '../data/centros101.json';
import ternas2026 from '../data/ternas2026.json';

const STORAGE_KEY = 'crm_reportes_101_guardados';
const META_KEY = 'crm_centros_101_meta';

export function normText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function namesMatch(a, b) {
  const na = normText(a);
  const nb = normText(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return Math.min(na.length, nb.length) >= 10;
  const ta = na.split(' ').filter((t) => t.length > 1);
  const tb = nb.split(' ').filter((t) => t.length > 1);
  if (ta.length < 2 || tb.length < 2) return false;
  const first = ta[0] === tb[0] || ta[0].startsWith(tb[0]) || tb[0].startsWith(ta[0]);
  const last = ta[ta.length - 1] === tb[tb.length - 1]
    || ta[ta.length - 1].startsWith(tb[tb.length - 1])
    || tb[tb.length - 1].startsWith(ta[ta.length - 1]);
  const common = ta.filter((t) => tb.includes(t)).length;
  return (first && last) || (first && common >= 2) || common >= 3;
}

export function canonicalCentro(raw) {
  const clean = String(raw || '').trim().replace(/\.+$/, '');
  if (!clean || /^sin centro$/i.test(clean) || /liceo \/ politecnico afiliado/i.test(clean)) {
    return null;
  }
  const key = normText(clean);
  if (centrosConfig.aliases[key]) return centrosConfig.aliases[key];
  for (const [alias, name] of Object.entries(centrosConfig.aliases)) {
    if (key === alias || key.includes(alias) || alias.includes(key)) return name;
  }
  // match against known terna centers
  for (const name of Object.keys(ternas2026.centros || {})) {
    const nk = normText(name);
    if (key === nk || key.includes(nk) || nk.includes(key)) return name;
  }
  return clean;
}

function fullName(b) {
  return `${b.nombre || ''} ${b.apellido || ''}`.replace(/\s+/g, ' ').trim();
}

function yearOf(value) {
  if (!value) return null;
  const m = String(value).match(/(20\d{2})/);
  return m ? Number(m[1]) : null;
}

function isEgresadoUniversitario(b) {
  if (String(b.estado_beca || '').toUpperCase() === 'FINALIZADA') return true;
  return /graduado universitario/i.test(String(b.estado_graduacion_liceo || ''));
}

function isPremiadoActo(b, year = 2026) {
  if (String(b.estado_beca || '').toUpperCase() === 'CANCELADA') return false;
  if (isEgresadoUniversitario(b)) return false;
  const grad = String(b.estado_graduacion_liceo || '');
  const selYear = yearOf(b.fecha_seleccion);
  if (/graduados?/i.test(grad) && !/universitario/i.test(grad)) return true;
  if (/agendado/i.test(grad) && selYear === year) return true;
  if (selYear === year && /pendiente|graduacion|agendado|graduados/i.test(grad)) return true;
  return selYear === year;
}

function isBecadoActual(b, year = 2026) {
  if (String(b.estado_beca || '').toUpperCase() !== 'ACTIVA') return false;
  if (isEgresadoUniversitario(b)) return false;
  if (isPremiadoActo(b, year)) return false;
  return true;
}

function shortUni(name) {
  const n = String(name || '');
  if (/UTESA/i.test(n)) return 'UTESA';
  if (/PUCMM/i.test(n)) return 'PUCMM';
  if (/O&M|O y M|Dominicana O/i.test(n)) return 'O&M';
  if (/UNEV/i.test(n)) return 'UNEV';
  return n || 'Universidad por definir';
}

function isPlaceholder(value) {
  const v = String(value || '').trim();
  if (!v) return true;
  return /^(por confirmar|pendiente|n\/d|nd|sin dato|a confirmar)$/i.test(v);
}

export function loadSavedMeta() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveCentroMeta(centroName, meta) {
  const all = loadSavedMeta();
  all[centroName] = { ...(all[centroName] || {}), ...meta };
  localStorage.setItem(META_KEY, JSON.stringify(all));
  return all[centroName];
}

export function getCentroMeta(centroName) {
  const defaults = centrosConfig.centros[centroName] || {
    director: '',
    anio_integracion: 'Afiliado Activo',
    fecha_acto: '',
    hora: '4:00 PM',
    lugar: 'Salón Principal del Centro',
    titulo_acto: 'ACTO DE ENTREGA DE RECONOCIMIENTOS Y BECAS 2026',
    becas_acto: '',
    honores: 'Acto de entrega de reconocimientos académicos y becas universitarias 2026.',
    terna: [],
    perfiles: {},
    notas: ''
  };
  const saved = loadSavedMeta()[centroName] || {};
  return {
    ...defaults,
    ...saved,
    terna: Array.isArray(saved.terna) ? saved.terna : (defaults.terna || []),
    perfiles: { ...(defaults.perfiles || {}), ...(saved.perfiles || {}) }
  };
}

/** Fields that are not confirmed yet and may need manual input. */
export function getUnconfirmedFields(meta = {}) {
  const fields = [];
  if (isPlaceholder(meta.director)) fields.push({ key: 'director', label: 'Director(a)' });
  if (isPlaceholder(meta.fecha_acto)) fields.push({ key: 'fecha_acto', label: 'Fecha del acto' });
  if (isPlaceholder(meta.lugar)) fields.push({ key: 'lugar', label: 'Lugar' });
  if (isPlaceholder(meta.hora)) fields.push({ key: 'hora', label: 'Hora' });
  if (isPlaceholder(meta.anio_integracion)) fields.push({ key: 'anio_integracion', label: 'Año / integración' });
  return fields;
}

export function getTernaPostulacion(centroName) {
  const exact = ternas2026.centros?.[centroName];
  if (exact) return exact;
  const key = normText(centroName);
  for (const [name, items] of Object.entries(ternas2026.centros || {})) {
    if (normText(name) === key || namesMatch(name, centroName)) return items;
  }
  return [];
}

export function listCentros(becarios = []) {
  const counts = new Map();
  for (const b of becarios) {
    const name = canonicalCentro(b.centro_origen);
    if (!name) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  for (const name of Object.keys(ternas2026.centros || {})) {
    if (!counts.has(name)) counts.set(name, 0);
  }
  for (const name of Object.keys(centrosConfig.centros || {})) {
    if (!counts.has(name)) counts.set(name, 0);
  }

  return [...counts.entries()]
    .map(([nombre, totalBecarios]) => {
      const terna = getTernaPostulacion(nombre);
      return {
        nombre,
        total: totalBecarios,
        terna_count: terna.length,
        tiene_terna_2026: terna.length > 0
      };
    })
    .sort((a, b) => {
      if (a.tiene_terna_2026 !== b.tiene_terna_2026) return a.tiene_terna_2026 ? -1 : 1;
      return b.total - a.total || a.nombre.localeCompare(b.nombre, 'es');
    });
}

function padrinoLabel(becario, padrinos = []) {
  const ids = new Set((padrinos || [])
    .filter((p) => (p.becario_ids || []).map(String).includes(String(becario.id)))
    .map((p) => p.razon_social || `${p.nombre || ''} ${p.apellido || ''}`.trim()));
  return [...ids].filter(Boolean).join(' / ') || 'Por asignar';
}

function findPostulante(nombre, postulantes) {
  return (postulantes || []).find((p) => namesMatch(p.nombre, nombre)) || null;
}

function enrichBecario(b, meta, padrinos, postulante = null) {
  const nombre = fullName(b);
  const perfil = (meta.perfiles && (meta.perfiles[nombre] || meta.perfiles[normText(nombre)]))
    || postulante?.resumen
    || '';
  return {
    id: b.id,
    nombre,
    cedula: b.cedula || 'N/D',
    telefono: b.telefono || postulante?.telefono || 'N/D',
    email: b.email || postulante?.email || 'N/D',
    carrera: b.carrera_nombre || postulante?.carrera_aspirada || 'Carrera por definir',
    universidad: b.universidad_nombre || 'Universidad por definir',
    universidad_corta: shortUni(b.universidad_nombre),
    matricula: b.matricula || null,
    promedio: b.promedio_general != null ? Number(b.promedio_general) : null,
    cuatrimestral: b.indice_cuatrimestral != null ? Number(b.indice_cuatrimestral) : null,
    promedio_liceo: postulante?.promedio_liceo ?? null,
    estado_beca: b.estado_beca,
    estado_graduacion_liceo: b.estado_graduacion_liceo,
    fecha_seleccion: b.fecha_seleccion,
    padrino: padrinoLabel(b, padrinos),
    perfil,
    fuente: 'crm'
  };
}

export function buildReporte101({ centroName, becarios = [], padrinos = [], year = 2026, metaOverride = null }) {
  const meta = { ...getCentroMeta(centroName), ...(metaOverride || {}) };
  const delCentro = becarios.filter((b) => canonicalCentro(b.centro_origen) === centroName);
  const postulantes = getTernaPostulacion(centroName);

  // Ganadores = confirmados en BD (becarios premiados del centro)
  const premiadosCrm = delCentro
    .filter((b) => isPremiadoActo(b, year))
    .sort((a, b) => String(a.fecha_seleccion || '').localeCompare(String(b.fecha_seleccion || '')));

  const premiados = premiadosCrm.map((b) => {
    const post = findPostulante(fullName(b), postulantes);
    return enrichBecario(b, meta, padrinos, post);
  });

  // Terna restante = postulantes del Excel que NO ganaron (no están en premiados)
  const ternaRestante = postulantes
    .filter((p) => !premiados.some((w) => namesMatch(w.nombre, p.nombre)))
    .map((p) => ({
      nombre: p.nombre,
      resumen: [
        p.carrera_aspirada ? `Aspira a ${p.carrera_aspirada}.` : null,
        p.promedio_liceo != null ? `Promedio liceo: ${p.promedio_liceo}.` : null,
        p.resumen
      ].filter(Boolean).join(' '),
      carrera_aspirada: p.carrera_aspirada,
      promedio_liceo: p.promedio_liceo,
      telefono: p.telefono,
      email: p.email,
      fuente: 'postulacion_2026'
    }));

  // If no CRM winners yet but Excel has terna, leave winners empty (not confirmed)
  // Terna completa for display when there are no winners:
  const ternaCompleta = postulantes.map((p) => ({
    nombre: p.nombre,
    resumen: [
      p.carrera_aspirada ? `Aspira a ${p.carrera_aspirada}.` : null,
      p.promedio_liceo != null ? `Promedio liceo: ${p.promedio_liceo}.` : null,
      p.resumen
    ].filter(Boolean).join(' '),
    carrera_aspirada: p.carrera_aspirada,
    promedio_liceo: p.promedio_liceo,
    fuente: 'postulacion_2026'
  }));

  const terna = premiados.length ? ternaRestante : ternaCompleta;

  // Enrich premiados perfiles from excel when missing
  for (const p of premiados) {
    if (!p.perfil) {
      const post = findPostulante(p.nombre, postulantes);
      if (post?.resumen) p.perfil = post.resumen;
    }
  }

  const actuales = delCentro
    .filter((b) => isBecadoActual(b, year))
    .sort((a, b) => fullName(a).localeCompare(fullName(b), 'es'))
    .map((b) => enrichBecario(b, meta, padrinos));

  const egresados = delCentro
    .filter((b) => isEgresadoUniversitario(b))
    .sort((a, b) => fullName(a).localeCompare(fullName(b), 'es'))
    .map((b) => enrichBecario(b, meta, padrinos));

  const becasActo = (!isPlaceholder(meta.becas_acto) && meta.becas_acto)
    || (premiados.length
      ? `${premiados.length} BECA${premiados.length > 1 ? 'S' : ''} UNIVERSITARIA${premiados.length > 1 ? 'S' : ''} COMPLETA${premiados.length > 1 ? 'S' : ''}`
      : 'Sin ganadores confirmados aún en la base de datos');

  const unconfirmed = getUnconfirmedFields({ ...meta, becas_acto: becasActo });

  return {
    id: `101-${normText(centroName).replace(/\s+/g, '-')}-${year}-${Date.now()}`,
    tipo: 'REPORTE_101',
    year,
    generado_en: new Date().toISOString(),
    centro: centroName,
    meta: {
      ...meta,
      director: isPlaceholder(meta.director) ? 'Por confirmar' : meta.director,
      fecha_acto: isPlaceholder(meta.fecha_acto) ? 'Por confirmar' : meta.fecha_acto,
      becas_acto: becasActo
    },
    totales: {
      del_centro: delCentro.length,
      premiados: premiados.length,
      actuales: actuales.length,
      egresados: egresados.length,
      terna: terna.length,
      postulantes: postulantes.length
    },
    premiados,
    actuales,
    egresados,
    terna,
    postulantes,
    unconfirmed,
    necesita_datos_manuales: unconfirmed.length > 0
  };
}

export function listSavedReportes101() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveReporte101(report) {
  const list = listSavedReportes101().filter((r) => !(r.centro === report.centro && r.year === report.year));
  const next = [{ ...report, guardado_en: new Date().toISOString() }, ...list].slice(0, 100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function deleteSavedReporte101(id) {
  const next = listSavedReportes101().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderReporte101Html(report, { forPrint = true } = {}) {
  const m = report.meta || {};
  const fechaLugar = [m.fecha_acto, m.hora ? `${m.hora}` : null, m.lugar]
    .filter(Boolean)
    .join(' | ');

  const premiadosHtml = report.premiados.length
    ? report.premiados.map((p, idx) => `
        <div class="winner-card">
          <div class="winner-name">${idx + 1}. ${esc(p.nombre)}</div>
          <div class="winner-details">
            • <strong>Asignación:</strong> Beca Universitaria Completa ${report.year} (Ganador/a confirmado/a)<br>
            • <strong>Carrera:</strong> ${esc(p.carrera)} en ${esc(p.universidad_corta)}<br>
            • <strong>Cédula:</strong> ${esc(p.cedula)} | <strong>Teléfono:</strong> ${esc(p.telefono)}<br>
            • <strong>Cortesía / Padrino:</strong> ${esc(p.padrino)}
            ${p.promedio_liceo != null ? `<br>• <strong>Promedio liceo:</strong> ${esc(p.promedio_liceo)}` : ''}
          </div>
          ${p.perfil ? `<div class="profile-box">⭐ <strong>Perfil / Resumen:</strong> ${esc(p.perfil)}</div>` : ''}
        </div>`).join('')
    : `<div class="item-card" style="color:#64748b;font-style:italic;">• Sin ganadores confirmados aún en la base de datos para este centro.</div>`;

  const ternaTitle = report.premiados.length
    ? 'RESTO DE LA TERNA 2026 (POSTULANTES)'
    : 'TERNA COMPLETA DE POSTULANTES 2026';

  const ternaHtml = (report.terna || []).length
    ? report.terna.map((t) => `
        <div class="item-card">
          <strong>• ${esc(t.nombre)}:</strong> ${esc(t.resumen || 'Integrante de la terna del centro.')}
        </div>`).join('')
    : `<div class="item-card" style="color:#64748b;font-style:italic;">• No hay terna de postulación 2026 para este centro en el Excel.</div>`;

  const actualesHtml = report.actuales.length
    ? report.actuales.map((p) => `
        <div class="item-card">
          <strong>• ${esc(p.nombre)}${p.matricula ? ` (Matrícula ${esc(p.matricula)})` : ''}:</strong>
          Becado/a activo/a. Estudia ${esc(p.carrera)} en ${esc(p.universidad_corta)}${p.promedio != null ? ` con índice acumulado <strong>${p.promedio.toFixed(2)}</strong>` : ''}.
          ${p.padrino && p.padrino !== 'Por asignar' ? ` Padrino: ${esc(p.padrino)}.` : ''}
        </div>`).join('')
    : `<div class="item-card" style="color:#64748b;font-style:italic;">• Sin becados universitarios previos registrados para este centro.</div>`;

  const egresadosHtml = report.egresados.length
    ? report.egresados.map((p) => `
        <div class="item-card">
          <strong>• ${esc(p.nombre)}:</strong>
          ${esc(p.estado_graduacion_liceo || 'Egresado/a universitario/a')}.
          Carrera: ${esc(p.carrera)} (${esc(p.universidad_corta)}).
        </div>`).join('')
    : `<div class="item-card" style="color:#64748b;font-style:italic;">• Sin egresados universitarios aún registrados (primeras promociones en curso).</div>`;

  const honoresHtml = m.honores
    ? `<div class="item-card">${esc(m.honores)}</div>`
    : `<div class="item-card" style="color:#64748b;font-style:italic;">• Sin honores adicionales registrados.</div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte 101 - ${esc(report.centro)}</title>
  <style>
    @media print {
      body { margin: 0; padding: 8mm; font-size: 15pt; background: #fff; }
      .no-print { display: none !important; }
      .container { box-shadow: none !important; border-radius: 0 !important; }
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f4f6f9;
      color: #212121;
      padding: 24px;
      line-height: 1.55;
    }
    .container {
      max-width: 920px;
      margin: 0 auto;
      background: #fff;
      padding: 36px 44px;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,.08);
      border-top: 8px solid #E53935;
    }
    .header { border-bottom: 3px solid #E53935; padding-bottom: 12px; margin-bottom: 18px; }
    .brand { color: #E53935; font-size: 34px; font-weight: 900; letter-spacing: 1px; margin: 0; }
    .subbrand { color: #616161; font-size: 16px; font-weight: 700; margin-top: 4px; }
    .title-box {
      text-align: center; margin: 18px 0; background: #eef2f7; padding: 18px;
      border-radius: 12px; border-left: 6px solid #1A237E;
    }
    .event-title { font-size: 22px; font-weight: 800; color: #1A237E; margin: 0; }
    .center-name { font-size: 30px; font-weight: 900; color: #D32F2F; margin: 8px 0 0; text-transform: uppercase; }
    .event-date { font-size: 17px; color: #424242; font-weight: 600; margin-top: 8px; }
    .info-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8f9fa;
      padding: 14px 18px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 18px; font-size: 16px;
    }
    .info-label { font-weight: 800; color: #0D47A1; }
    .box-winners {
      background: #fff8e1; border: 3px solid #ffa000; border-radius: 12px; padding: 20px 22px; margin: 18px 0;
    }
    .box-title {
      font-size: 20px; font-weight: 900; color: #b71c1c; margin: 0 0 12px;
      border-bottom: 2px solid #ffe082; padding-bottom: 6px;
    }
    .winner-card {
      background: #fff; border-radius: 8px; padding: 14px 18px; margin-bottom: 12px;
      border-left: 6px solid #e53935; box-shadow: 0 2px 6px rgba(0,0,0,.04);
    }
    .winner-name { font-size: 22px; font-weight: 900; color: #b71c1c; margin-bottom: 4px; }
    .winner-details { font-size: 16px; color: #212121; line-height: 1.5; }
    .profile-box {
      background: #f1f5f9; border-radius: 6px; padding: 10px 12px; margin-top: 8px;
      font-size: 15px; color: #334155; font-style: italic;
    }
    .section-title {
      font-size: 19px; font-weight: 800; color: #1A237E; margin: 22px 0 10px;
      border-left: 6px solid #1A237E; padding-left: 12px;
    }
    .item-card {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
      padding: 12px 16px; margin-bottom: 10px; font-size: 16px;
    }
    .footer {
      border-top: 2px solid #e0e0e0; margin-top: 28px; padding-top: 14px;
      text-align: center; font-size: 14px; color: #616161; font-weight: 600;
    }
    .stamp { text-align: right; font-size: 12px; color: #94a3b8; margin-top: 8px; }
  </style>
</head>
<body>
  ${forPrint ? `<div class="no-print" style="text-align:center;margin-bottom:16px;">
    <button onclick="window.print()" style="background:#1890ff;color:#fff;border:0;padding:12px 22px;font-size:16px;font-weight:700;border-radius:8px;cursor:pointer;">
      Imprimir / Guardar PDF — Reporte 101
    </button>
  </div>` : ''}
  <div class="container">
    <div class="header">
      <h1 class="brand">ROMPIENDO PARADIGMAS</h1>
      <div class="subbrand">FUNDACIÓN DE BECAS ESTUDIANTILES — REPORTE 101</div>
    </div>

    <div class="title-box">
      <div class="event-title">${esc(m.titulo_acto || 'ACTO DE ENTREGA DE RECONOCIMIENTOS Y BECAS')}</div>
      <div class="center-name">${esc(report.centro)}</div>
      <div class="event-date">${esc(fechaLugar)}</div>
    </div>

    <div class="info-grid">
      <div><span class="info-label">Centro Educativo:</span> ${esc(report.centro)}</div>
      <div><span class="info-label">Director(a):</span> ${esc(m.director || 'Por confirmar')}</div>
      <div><span class="info-label">Integración a la Fundación:</span> ${esc(m.anio_integracion || 'Afiliado Activo')}</div>
      <div><span class="info-label">Fecha / Lugar:</span> ${esc(fechaLugar || 'Por confirmar')}</div>
      <div style="grid-column: span 2;"><span class="info-label">Becas otorgadas en este acto:</span> <strong style="color:#b71c1c;">${esc(m.becas_acto)}</strong></div>
    </div>

    <div class="box-winners">
      <h2 class="box-title">ESTUDIANTE(S) PREMIADO(S) Y BENEFICIADO(S) CON BECA ${report.year}:</h2>
      ${premiadosHtml}
    </div>

    <div class="section-title">${ternaTitle}</div>
    ${ternaHtml}

    <div class="section-title">BECADOS ACTUALES EN LA UNIVERSIDAD (DE ESTE CENTRO)</div>
    ${actualesHtml}

    <div class="section-title">EGRESADOS UNIVERSITARIOS DEL CENTRO</div>
    ${egresadosHtml}

    <div class="section-title">HONORES Y RECONOCIMIENTOS</div>
    ${honoresHtml}

    ${m.notas ? `<div class="section-title">NOTAS DEL ACTO</div><div class="item-card">${esc(m.notas)}</div>` : ''}

    <div class="footer">
      Calle E. León Jiménez #12, Reparto del Este, Santiago • Tel. 809-995-0808 / 809-669-8000 • RNC: 430-28829-2
    </div>
    <div class="stamp">Generado el ${esc(new Date(report.generado_en).toLocaleString('es-DO'))} • Reporte 101 • Ternas desde postulación 2026</div>
  </div>
</body>
</html>`;
}

export function openPrintableReporte101(report) {
  const html = renderReporte101Html(report, { forPrint: true });
  const win = window.open('', '_blank');
  if (!win) throw new Error('El navegador bloqueó la ventana de impresión');
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 400);
}

export function downloadReporte101Html(report) {
  const html = renderReporte101Html(report, { forPrint: true });
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = normText(report.centro).replace(/\s+/g, '_');
  a.href = url;
  a.download = `Reporte_101_${slug}_${report.year}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
