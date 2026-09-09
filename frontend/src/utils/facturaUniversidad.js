import { downloadBlob, formatMoney, todayStamp } from './downloadFile';
import { SimplePdf } from './simplePdf';
import {
  buildCompromisoMatricula,
  FUNDACION_FISCAL,
  UNI_FISCAL,
  loadPresupuestoConfig
} from './presupuestoEngine';
import { loadStore } from '../api/dataStore';

const NCF_KEY = 'crm_ncf_seq_v1';

function nextNcf() {
  let seq = 1;
  try {
    seq = Number(localStorage.getItem(NCF_KEY) || '1') || 1;
  } catch {
    seq = 1;
  }
  const ncf = `B010000${String(seq).padStart(4, '0')}`;
  try {
    localStorage.setItem(NCF_KEY, String(seq + 1));
  } catch {
    // ignore
  }
  return ncf;
}

function renderUniversidadFiscalPdf(model) {
  const pdf = new SimplePdf({ width: 612, height: 792, margin: 36 });
  pdf.footer = `${FUNDACION_FISCAL.nombre}  |  RNC ${FUNDACION_FISCAL.rnc}  |  ${FUNDACION_FISCAL.telefono}`;

  pdf.text(FUNDACION_FISCAL.nombre.toUpperCase(), { size: 16, bold: true, color: '#C62828' });
  pdf.text('LIQUIDACION / FACTURA DE COMPROMISO DE MATRICULA', { size: 11, bold: true, color: '#1A237E' });
  pdf.text('Documento con valor fiscal de referencia para pago universitario', { size: 9, color: '#616161' });
  pdf.line('#C62828');

  pdf.text(`NCF: ${model.ncf}`, { size: 11, bold: true });
  pdf.text(`Fecha: ${model.fecha}`);
  pdf.text(`Cuatrimestre: ${model.cuatrimestre}`);
  pdf.space(6);

  pdf.text('EMISOR', { size: 10, bold: true, color: '#1A237E' });
  pdf.text(`${FUNDACION_FISCAL.nombre}`);
  pdf.text(`RNC: ${FUNDACION_FISCAL.rnc}`);
  pdf.text(FUNDACION_FISCAL.direccion);
  pdf.text(`Tel: ${FUNDACION_FISCAL.telefono}`);
  pdf.space(6);

  pdf.text('RECEPTOR / UNIVERSIDAD', { size: 10, bold: true, color: '#1A237E' });
  pdf.text(model.universidad);
  pdf.text(`RNC universidad (ref.): ${model.rnc_universidad}`);
  pdf.text(`Estudiantes activos: ${model.estudiantes}`);
  pdf.line('#E0E0E0');

  pdf.text('DETALLE DE ESTUDIANTES', { size: 10, bold: true, color: '#1A237E' });
  model.detalle.slice(0, 45).forEach((row, index) => {
    pdf.text(
      `${index + 1}. ${row.nombre} | Mat: ${row.matricula} | ${row.creditos} cr. | RD$ ${formatMoney(row.subtotal)}`,
      { size: 8 }
    );
  });
  if (model.detalle.length > 45) {
    pdf.text(`... y ${model.detalle.length - 45} estudiantes mas`, { size: 8, color: '#616161' });
  }

  pdf.space(8);
  pdf.line('#1A237E');
  pdf.text(`Subtotal materias + cargos: RD$ ${formatMoney(model.subtotal)}`, { size: 11, bold: true });
  pdf.text(`ITBIS (${(model.itbis_pct * 100).toFixed(0)}%): RD$ ${formatMoney(model.itbis)}`, { size: 11 });
  pdf.text(`TOTAL FISCAL CUATRIMESTRE: RD$ ${formatMoney(model.total_fiscal)}`, {
    size: 13,
    bold: true,
    color: '#C62828'
  });
  pdf.space(4);
  pdf.text(`Equivalente mensual: RD$ ${formatMoney(model.mensual_fiscal)}`, { size: 10 });
  pdf.text(`Proyeccion anual (3 cuatrimestres): RD$ ${formatMoney(model.anual_fiscal)}`, { size: 10 });

  pdf.space(10);
  pdf.text('NOTA FISCAL', { size: 10, bold: true, color: '#1A237E' });
  pdf.text(
    'Esta liquidacion consolida el compromiso de matricula de becarios activos de la Fundacion ante la universidad indicada. El NCF es secuencial interno de control; la factura fiscal formal la emite la universidad al recibir el pago.',
    { size: 8 }
  );
  pdf.space(6);
  pdf.text('DATOS DE PAGO', { size: 10, bold: true, color: '#1A237E' });
  pdf.text(`Beneficiario operativo: ${FUNDACION_FISCAL.nombre}`);
  pdf.text(`${FUNDACION_FISCAL.banco}  |  Cuenta: ${FUNDACION_FISCAL.cuenta}`);
  pdf.text(`RNC: ${FUNDACION_FISCAL.rnc}`);

  return pdf.toBlob();
}

export async function buildUniversidadInvoice(universidadKey, options = {}) {
  const store = await loadStore();
  const config = { ...loadPresupuestoConfig(), ...(options.config || {}) };
  const matricula = buildCompromisoMatricula(store, config);
  const uni = (matricula.por_universidad || []).find((u) => u.universidad_key === universidadKey);
  if (!uni) {
    throw new Error(`No hay becarios activos para ${universidadKey}.`);
  }

  const fiscal = UNI_FISCAL[universidadKey] || { rnc: 'N/D', nombre: uni.universidad };
  const model = {
    ncf: nextNcf(),
    fecha: todayStamp(),
    cuatrimestre: matricula.cuatrimestre,
    universidad_key: universidadKey,
    universidad: uni.universidad,
    rnc_universidad: fiscal.rnc,
    estudiantes: uni.estudiantes,
    detalle: uni.detalle || [],
    subtotal: uni.subtotal_cuatrimestre,
    itbis_pct: uni.itbis_pct,
    itbis: uni.itbis_cuatrimestre,
    total_fiscal: uni.total_fiscal_cuatrimestre,
    mensual_fiscal: uni.mensual_fiscal,
    anual_fiscal: uni.anual_fiscal
  };

  return {
    model,
    blob: renderUniversidadFiscalPdf(model),
    filename: `Factura_Fiscal_${universidadKey}_${model.cuatrimestre}_${todayStamp()}.pdf`,
    summary: {
      text:
        `Factura fiscal ${universidadKey}\n` +
        `NCF ${model.ncf}\n` +
        `Estudiantes: ${model.estudiantes}\n` +
        `Subtotal: RD$ ${formatMoney(model.subtotal)}\n` +
        `ITBIS: RD$ ${formatMoney(model.itbis)}\n` +
        `TOTAL: RD$ ${formatMoney(model.total_fiscal)}`
    }
  };
}

export async function exportUniversidadInvoice(universidadKey, options = {}) {
  const result = await buildUniversidadInvoice(universidadKey, options);
  if (options.download !== false) {
    downloadBlob(result.blob, result.filename);
  }
  return result;
}

export async function exportAllUniversidadInvoices(options = {}) {
  const store = await loadStore();
  const config = { ...loadPresupuestoConfig(), ...(options.config || {}) };
  const matricula = buildCompromisoMatricula(store, config);
  const results = [];
  for (const uni of matricula.por_universidad || []) {
    // eslint-disable-next-line no-await-in-loop
    const result = await exportUniversidadInvoice(uni.universidad_key, { ...options, download: true });
    results.push(result);
  }
  return results;
}
