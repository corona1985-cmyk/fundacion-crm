import axiosClient from './axiosClient';

export const alarmaApi = {
  getAll: (params) => axiosClient.get('/alarmas', { params }),
  getSummary: () => axiosClient.get('/alarmas/resumen'),
  create: (data) => axiosClient.post('/alarmas', data),
  evaluar: () => axiosClient.post('/alarmas/evaluar'),
  atender: (id, data) => axiosClient.put(`/alarmas/${id}/atender`, data),
  descartar: (id, data) => axiosClient.put(`/alarmas/${id}/descartar`, data),
  getOverduePayments: () => axiosClient.get('/pagos/vencidos'),
  getCuentasPorCobrar: () => axiosClient.get('/reportes/financiero/cuentas-cobrar'),
  getCuentasPorPagar: () => axiosClient.get('/reportes/financiero/cuentas-pagar')
};
