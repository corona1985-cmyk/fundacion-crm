const ReportExportService = require('../services/reportExportService');

/**
 * Controller for Module 6 Export Endpoints (Excel & PDF)
 */
class ReporteExportController {
  /**
   * GET /reportes/export/excel?tipo=becarios|financiero
   */
  static async exportExcel(req, res, next) {
    try {
      const { tipo = 'becarios' } = req.query;
      const buffer = await ReportExportService.generateExcelReport(tipo);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=reporte_${tipo}_${Date.now()}.xlsx`);
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /reportes/export/pdf?tipo=becarios|financiero
   */
  static async exportPdf(req, res, next) {
    try {
      const { tipo = 'becarios' } = req.query;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=reporte_${tipo}_${Date.now()}.pdf`);

      await ReportExportService.generatePdfReport(tipo, res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReporteExportController;
