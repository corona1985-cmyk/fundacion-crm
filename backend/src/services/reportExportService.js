const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Becario, Persona, Universidad, Carrera, Pago, Aporte, GastoAdministrativo, Presupuesto } = require('../models');

/**
 * Module 6: Executive Reporting Engine (Excel & PDF Generation)
 */
class ReportExportService {
  /**
   * Generate formatted Excel Workbook (.xlsx)
   */
  static async generateExcelReport(tipo = 'becarios') {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Fundación Rompiendo Paradigmas CRM';
    workbook.created = new Date();

    if (tipo === 'becarios') {
      const sheet = workbook.addWorksheet('Becarios');
      sheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Cédula', key: 'cedula', width: 15 },
        { header: 'Nombre', key: 'nombre', width: 20 },
        { header: 'Apellido', key: 'apellido', width: 20 },
        { header: 'Universidad', key: 'universidad', width: 30 },
        { header: 'Carrera', key: 'carrera', width: 30 },
        { header: 'Promedio Acumulado', key: 'promedio', width: 20 },
        { header: 'Estado Beca', key: 'estado', width: 15 }
      ];

      // Format header row
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1890FF' } };

      const becarios = await Becario.findAll({
        include: [
          { model: Persona, as: 'persona' },
          { model: Universidad, as: 'universidad' },
          { model: Carrera, as: 'carrera' }
        ]
      });

      becarios.forEach(b => {
        sheet.addRow({
          id: b.id,
          cedula: b.persona?.cedula || 'N/A',
          nombre: b.persona?.nombre || '',
          apellido: b.persona?.apellido || '',
          universidad: b.universidad?.nombre || 'N/A',
          carrera: b.carrera?.nombre || 'N/A',
          promedio: parseFloat(b.promedio_general || 0).toFixed(2),
          estado: b.estado_beca
        });
      });
    } else if (tipo === 'financiero') {
      const sheet = workbook.addWorksheet('Resumen Financiero');
      sheet.columns = [
        { header: 'Concepto / Categoria', key: 'concepto', width: 35 },
        { header: 'Total (RD$)', key: 'monto', width: 20 }
      ];

      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '52C41A' } };

      const totalAportes = (await Aporte.sum('monto')) || 0;
      const totalPagos = (await Pago.sum('monto', { where: { estado: 'pagado' } })) || 0;
      const totalGastos = (await GastoAdministrativo.sum('monto')) || 0;
      const balance = totalAportes - (totalPagos + totalGastos);

      sheet.addRow({ concepto: 'Ingresos Totales (Aportes Padrinos/Inst)', monto: totalAportes });
      sheet.addRow({ concepto: 'Egresos Pagos Universitarios', monto: totalPagos });
      sheet.addRow({ concepto: 'Egresos Gastos Administrativos', monto: totalGastos });
      sheet.addRow({ concepto: 'BALANCE NETO DISPONIBLE', monto: balance });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Generate Executive PDF Document
   */
  static async generatePdfReport(tipo = 'becarios', res) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    doc.pipe(res);

    // Header Branding
    doc.fillColor('#002140')
       .fontSize(20)
       .text('FUNDACIÓN ROMPIENDO PARADIGMAS', { align: 'center' })
       .fontSize(12)
       .fillColor('#595959')
       .text('Sistema CRM de Gestión de Becas y Padrinazgo', { align: 'center' })
       .moveDown(1.5);

    doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#1890FF').stroke().moveDown(1);

    if (tipo === 'becarios') {
      doc.fontSize(16).fillColor('#1890FF').text('REPORTE EJECUTIVO DE BECARIOS', { underline: true }).moveDown(1);

      const becarios = await Becario.findAll({
        include: [
          { model: Persona, as: 'persona' },
          { model: Universidad, as: 'universidad' }
        ],
        limit: 50
      });

      doc.fontSize(10).fillColor('#000000');
      becarios.forEach((b, index) => {
        const line = `${index + 1}. ${b.persona?.nombre} ${b.persona?.apellido} - Cédula: ${b.persona?.cedula} | Univ: ${b.universidad?.nombre || 'N/A'} | Índice: ${parseFloat(b.promedio_general || 0).toFixed(2)} | Estado: ${b.estado_beca}`;
        doc.text(line).moveDown(0.3);
      });
    } else {
      doc.fontSize(16).fillColor('#52C41A').text('ESTADO FINANCIERO CONSOLIDADO', { underline: true }).moveDown(1);

      const totalAportes = (await Aporte.sum('monto')) || 0;
      const totalPagos = (await Pago.sum('monto', { where: { estado: 'pagado' } })) || 0;
      const totalGastos = (await GastoAdministrativo.sum('monto')) || 0;
      const balance = totalAportes - (totalPagos + totalGastos);

      doc.fontSize(12).fillColor('#262626')
         .text(`• Ingresos Totales por Aportes: RD$ ${totalAportes.toLocaleString()}`)
         .moveDown(0.5)
         .text(`• Egresos por Pagos Universitarios: RD$ ${totalPagos.toLocaleString()}`)
         .moveDown(0.5)
         .text(`• Egresos Gastos Operativos/Admin: RD$ ${totalGastos.toLocaleString()}`)
         .moveDown(1)
         .fontSize(14).fillColor(balance >= 0 ? '#52C41A' : '#F5222D')
         .text(`BALANCE NETO DISPONIBLE: RD$ ${balance.toLocaleString()}`, { bold: true });
    }

    // Footer timestamp
    doc.moveDown(2)
       .fontSize(9)
       .fillColor('#8C8C8C')
       .text(`Generado el: ${new Date().toLocaleString()} | CRM Fundación Rompiendo Paradigmas`, { align: 'center' });

    doc.end();
  }
}

module.exports = ReportExportService;
