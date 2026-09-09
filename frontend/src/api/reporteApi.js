import { exportExcelBlob, exportExcelReport, exportPdfBlob, exportPdfReport } from '../utils/reportExport';

export const reporteApi = {
  exportExcel: async (tipo = 'becarios') => exportExcelReport(tipo),
  exportPdf: async (tipo = 'becarios') => exportPdfReport(tipo),
  downloadExcel: async (tipo = 'becarios') => exportExcelBlob(tipo),
  downloadPdf: async (tipo = 'becarios') => exportPdfBlob(tipo)
};
