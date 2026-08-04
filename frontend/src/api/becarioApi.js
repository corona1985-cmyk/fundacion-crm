import axiosClient from './axiosClient';

export const becarioApi = {
  getAll: (params) => axiosClient.get('/becarios', { params }),
  getById: (id) => axiosClient.get(`/becarios/${id}`),
  create: (data) => axiosClient.post('/becarios', data),
  update: (id, data) => axiosClient.put(`/becarios/${id}`, data),
  delete: (id) => axiosClient.delete(`/becarios/${id}`),

  // Academic Catalogs
  getUniversidades: () => axiosClient.get('/universidades'),
  getCarreras: (universidad_id) => axiosClient.get('/carreras', { params: { universidad_id } }),
  getCiclos: (universidad_id) => axiosClient.get('/ciclos', { params: { universidad_id } }),
  getMaterias: (carrera_id) => axiosClient.get('/carreras/materias', { params: { carrera_id } }),

  // Enrollment & Grades
  enrollMaterias: (becario_id, data) => axiosClient.post(`/becarios/${becario_id}/inscripcion`, data),
  updateCalificacion: (materia_cursada_id, data) => axiosClient.put(`/becarios/calificaciones/${materia_cursada_id}`, data),

  // Documents
  uploadDocument: (formData) => axiosClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDocumentsByBecario: (becario_id) => axiosClient.get(`/documentos/becario/${becario_id}`),
  deleteDocument: (id) => axiosClient.delete(`/documentos/${id}`)
};
