import axiosClient from './axiosClient';

export const padrinoApi = {
  // Sponsors (Padrinos)
  getAll: (params) => axiosClient.get('/padrinos', { params }),
  getById: (id) => axiosClient.get(`/padrinos/${id}`),
  create: (data) => axiosClient.post('/padrinos', data),
  update: (id, data) => axiosClient.put(`/padrinos/${id}`, data),
  delete: (id) => axiosClient.delete(`/padrinos/${id}`),
  createAportePadrino: (padrino_id, data) => axiosClient.post(`/padrinos/${padrino_id}/aportes`, data),

  // Public Institutions
  getInstituciones: () => axiosClient.get('/instituciones'),
  createInstitucion: (data) => axiosClient.post('/instituciones', data),
  updateInstitucion: (id, data) => axiosClient.put(`/instituciones/${id}`, data),
  deleteInstitucion: (id) => axiosClient.delete(`/instituciones/${id}`),
  createAporteInstitucion: (inst_id, data) => axiosClient.post(`/instituciones/${inst_id}/aportes`, data),

  // Global Contributions
  getAportes: (params) => axiosClient.get('/aportes', { params }),

  // Student-Sponsor Assignments
  assignPadrinoToBecario: (becario_id, data) => axiosClient.post(`/becarios/${becario_id}/asignar-padrino`, data),
  updateAssignment: (becario_id, padrino_id, data) => axiosClient.put(`/becarios/${becario_id}/padrinos/${padrino_id}`, data),
  decoupleAssignment: (becario_id, padrino_id) => axiosClient.delete(`/becarios/${becario_id}/padrinos/${padrino_id}`)
};
