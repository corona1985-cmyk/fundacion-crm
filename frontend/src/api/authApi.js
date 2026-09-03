export const authApi = {
  login: async () => ({
    success: true,
    data: {
      token: 'firebase-local',
      user: {
        id: 1,
        username: 'admin',
        rol: 'ADMINISTRADOR',
        activo: true,
        persona: { nombre: 'Administrador', apellido: 'Sistema' }
      }
    }
  }),
  getProfile: async () => ({
    success: true,
    data: { id: 1, username: 'admin', rol: 'ADMINISTRADOR' }
  }),
  updateProfile: async (data) => ({ success: true, data })
};
