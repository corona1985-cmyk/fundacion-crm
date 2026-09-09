import { loadStore } from '../api/dataStore';
import { downloadBlob, formatMoney, formatDate, personName, todayStamp } from './downloadFile';
import { buildExcelBlob } from './excelXml';
import { reportPdf } from './simplePdf';

function money(value) {
  return Number(parseFloat(value || 0).toFixed(2));
}

function sum(rows, field = 'monto') {
  return rows.reduce((total, row) => total + money(row[field]), 0);
}

function becarioRows(store) {
  return (store.becarios || []).map((row) => ({
    ID: row.id,
    Cedula: row.persona?.cedula || row.cedula || '',
    Nombre: row.persona?.nombre || row.nombre || '',
    Apellido: row.persona?.apellido || row.apellido || '',
    Universidad: row.universidad?.nombre || row.universidad_nombre || '',
    Carrera: row.carrera?.nombre || row.carrera_nombre || '',
    'Centro de origen': row.centro_origen || '',
    'Promedio acumulado': money(row.promedio_general),
    'Estado beca': row.estado_beca || '',
    'Graduacion liceo': row.estado_graduacion_liceo || ''
  }));
}

function padrinoRows(store) {
  return (store.padrinos || []).map((row) => {
    const aportes = (store.aportes || []).filter((item) => String(item.padrino_id) === String(row.id));
    return {
      ID: row.id,
      Nombre: personName(row),
      Tipo: row.tipo || '',
      Cedula: row.persona?.cedula || row.cedula || '',
      Compromiso: money(row.monto_compromiso),
      Frecuencia: row.frecuencia || '',
      'Total aportado': sum(aportes),
      Aportes: aportes.length
    };
  });
}

function aporteRows(store) {
  const padrinos = new Map((store.padrinos || []).map((row) => [String(row.id), row]));
  return (store.aportes || []).map((row) => ({
    ID: row.id,
    Padrino: personName(padrinos.get(String(row.padrino_id)) || {}),
    Monto: money(row.monto),
    Fecha: formatDate(row.fecha_recepcion),
    'Medio de pago': row.medio_pago || '',
    Referencia: row.referencia || '',
    Observaciones: row.observaciones || ''
  }));
}

function pagoRows(store) {
  return (store.pagos || []).map((row) => ({
    ID: row.id,
    Estudiante: personName(row.becario || row),
    Universidad: row.becario?.universidad?.nombre || row.universidad_nombre || '',
    Concepto: row.concepto || '',
    Monto: money(row.monto),
    Estado: row.estado || '',
    Vencimiento: formatDate(row.fecha_vencimiento),
    'Fecha pago': formatDate(row.fecha_pago)
  }));
}

function alarmaRows(store) {
  return (store.alarmas || []).map((row) => ({
    ID: row.id,
    Tipo: row.tipo || '',
    Nivel: row.nivel || '',
    Titulo: row.titulo || '',
    Descripcion: row.descripcion || '',
    Estado: row.estado || '',
    Fecha: formatDate(row.fecha_evento || row.created_at)
  }));
}

function financieroResumen(store) {
  const aportes = sum(store.aportes || []);
  const pagos = sum((store.pagos || []).filter((row) => String(row.estado || '').toLowerCase() === 'pagado'));
  const gastos = sum(store.gastos || []);
  const balance = aportes - (pagos + gastos);
  return [
    { Concepto: 'Ingresos totales (aportes)', 'Total (RD$)': aportes },
    { Concepto: 'Egresos pagos universitarios', 'Total (RD$)': pagos },
    { Concepto: 'Egresos gastos administrativos', 'Total (RD$)': gastos },
    { Concepto: 'Balance neto disponible', 'Total (RD$)': balance }
  ];
}

function buildSheets(tipo, store) {
  if (tipo === 'padrinos') {
    return [
      { name: 'Padrinos', headers: ['ID', 'Nombre', 'Tipo', 'Cedula', 'Compromiso', 'Frecuencia', 'Total aportado', 'Aportes'], rows: padrinoRows(store) },
      { name: 'Aportes', headers: ['ID', 'Padrino', 'Monto', 'Fecha', 'Medio de pago', 'Referencia', 'Observaciones'], rows: aporteRows(store) }
    ];
  }
  if (tipo === 'egresos' || tipo === 'financiero') {
    const sheets = [
      { name: tipo === 'financiero' ? 'Resumen financiero' : 'Egresos', headers: tipo === 'financiero' ? ['Concepto', 'Total (RD$)'] : ['ID', 'Estudiante', 'Universidad', 'Concepto', 'Monto', 'Estado', 'Vencimiento', 'Fecha pago'], rows: tipo === 'financiero' ? financieroResumen(store) : pagoRows(store) }
    ];
    if (tipo === 'financiero') {
      sheets.push({
        name: 'Pagos',
        headers: ['ID', 'Estudiante', 'Universidad', 'Concepto', 'Monto', 'Estado', 'Vencimiento', 'Fecha pago'],
        rows: pagoRows(store)
      });
    }
    return sheets;
  }
  if (tipo === 'alarmas') {
    return [
      { name: 'Alarmas', headers: ['ID', 'Tipo', 'Nivel', 'Titulo', 'Descripcion', 'Estado', 'Fecha'], rows: alarmaRows(store) },
      {
        name: 'Itinerario graduaciones',
        headers: ['ID', 'Cedula', 'Nombre', 'Apellido', 'Universidad', 'Carrera', 'Centro de origen', 'Promedio acumulado', 'Estado beca', 'Graduacion liceo'],
        rows: becarioRows(store)
      }
    ];
  }
  return [{
    name: 'Becarios',
    headers: ['ID', 'Cedula', 'Nombre', 'Apellido', 'Universidad', 'Carrera', 'Centro de origen', 'Promedio acumulado', 'Estado beca', 'Graduacion liceo'],
    rows: becarioRows(store)
  }];
}

function pdfTitle(tipo) {
  const titles = {
    becarios: 'REPORTE EJECUTIVO DE BECARIOS',
    financiero: 'ESTADO FINANCIERO CONSOLIDADO',
    padrinos: 'REPORTE DE PADRINOS Y APORTES',
    egresos: 'REPORTE DE EGRESOS Y PAGOS UNIVERSITARIOS',
    alarmas: 'ALARMAS E ITINERARIO DE GRADUACIONES'
  };
  return titles[tipo] || titles.becarios;
}

function pdfLines(tipo, store) {
  if (tipo === 'financiero') {
    return financieroResumen(store).map((row) => `• ${row.Concepto}: RD$ ${formatMoney(row['Total (RD$)'])}`);
  }
  if (tipo === 'padrinos') {
    return padrinoRows(store).map((row, index) => (
      `${index + 1}. ${row.Nombre} | Tipo: ${row.Tipo} | Compromiso: RD$ ${formatMoney(row.Compromiso)} | Aportado: RD$ ${formatMoney(row['Total aportado'])}`
    ));
  }
  if (tipo === 'egresos') {
    return pagoRows(store).map((row, index) => (
      `${index + 1}. ${row.Estudiante} | ${row.Universidad || 'N/A'} | ${row.Concepto || 'Pago'} | RD$ ${formatMoney(row.Monto)} | ${String(row.Estado || '').toUpperCase()}`
    ));
  }
  if (tipo === 'alarmas') {
    const alarmas = alarmaRows(store).map((row, index) => (
      `${index + 1}. [${String(row.Nivel || '').toUpperCase()}] ${row.Titulo} | ${row.Estado}`
    ));
    const itinerario = becarioRows(store)
      .filter((row) => row['Graduacion liceo'])
      .map((row, index) => (
        `${index + 1}. ${row.Nombre} ${row.Apellido} | ${row['Centro de origen'] || 'N/A'} | ${row['Graduacion liceo']}`
      ));
    return [...alarmas, '---', 'Itinerario de graduaciones:', ...itinerario];
  }
  return becarioRows(store).map((row, index) => (
    `${index + 1}. ${row.Nombre} ${row.Apellido} - Cedula: ${row.Cedula || 'N/A'} | Univ: ${row.Universidad || 'N/A'} | Indice: ${Number(row['Promedio acumulado'] || 0).toFixed(2)} | Estado: ${row['Estado beca']}`
  ));
}

export async function exportExcelReport(tipo = 'becarios') {
  const store = await loadStore();
  const blob = buildExcelBlob(buildSheets(tipo, store));
  const filename = `Reporte_${tipo}_${todayStamp()}.xls`;
  downloadBlob(blob, filename);
  return { blob, filename };
}

export async function exportPdfReport(tipo = 'becarios') {
  const store = await loadStore();
  const blob = reportPdf({
    title: pdfTitle(tipo),
    subtitle: `Total de registros: ${pdfLines(tipo, store).filter((line) => line !== '---').length}`,
    lines: pdfLines(tipo, store)
  });
  const filename = `Reporte_${tipo}_${todayStamp()}.pdf`;
  downloadBlob(blob, filename);
  return { blob, filename };
}

export async function exportExcelBlob(tipo = 'becarios') {
  const store = await loadStore();
  return {
    blob: buildExcelBlob(buildSheets(tipo, store)),
    filename: `Reporte_${tipo}_${todayStamp()}.xls`
  };
}

export async function exportPdfBlob(tipo = 'becarios') {
  const store = await loadStore();
  return {
    blob: reportPdf({
      title: pdfTitle(tipo),
      subtitle: `Generado el ${new Date().toLocaleString('es-DO')}`,
      lines: pdfLines(tipo, store)
    }),
    filename: `Reporte_${tipo}_${todayStamp()}.pdf`
  };
}
