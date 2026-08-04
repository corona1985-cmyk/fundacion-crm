import axiosClient from './axiosClient';

export const reporteApi = {
  exportExcel: (tipo = 'becarios') => {
    const token = localStorage.getItem('token');
    window.open(`/api/reportes/export/excel?tipo=${tipo}&token=${token}`, '_blank');
  },
  exportPdf: (tipo = 'becarios') => {
    const token = localStorage.getItem('token');
    window.open(`/api/reportes/export/pdf?tipo=${tipo}&token=${token}`, '_blank');
  }
};
