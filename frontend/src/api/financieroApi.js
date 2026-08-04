import axiosClient from './axiosClient';

export const financieroApi = {
  // Pagos Universitarios
  getPagos: (params) => axiosClient.get('/pagos', { params }),
  getPagosVencidos: () => axiosClient.get('/pagos/vencidos'),
  getPagoById: (id) => axiosClient.get(`/pagos/${id}`),
  createPago: (data) => axiosClient.post('/pagos', data),
  updatePago: (id, data) => axiosClient.put(`/pagos/${id}`, data),
  marcarPagado: (id, data) => axiosClient.post(`/pagos/${id}/marcar-pagado`, data),
  deletePago: (id) => axiosClient.delete(`/pagos/${id}`),

  // Presupuesto
  getPresupuestos: (params) => axiosClient.get('/presupuesto', { params }),
  createPresupuesto: (data) => axiosClient.post('/presupuesto', data),
  updatePresupuesto: (id, data) => axiosClient.put(`/presupuesto/${id}`, data),
  getEjecucionPresupuesto: (params) => axiosClient.get('/presupuesto/ejecucion', { params }),

  // Reportes Financieros
  getResumenFinanciero: () => axiosClient.get('/reportes/financiero/resumen'),
  getCuentasPorCobrar: () => axiosClient.get('/reportes/financiero/cuentas-cobrar'),
  getCuentasPorPagar: () => axiosClient.get('/reportes/financiero/cuentas-pagar'),
  getEvolucion: () => axiosClient.get('/reportes/financiero/evolucion')
};
