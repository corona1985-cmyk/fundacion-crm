import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5000',
      '/users': 'http://localhost:5000',
      '/auditoria': 'http://localhost:5000',
      '/audit': 'http://localhost:5000',
      '/universidades': 'http://localhost:5000',
      '/carreras': 'http://localhost:5000',
      '/ciclos': 'http://localhost:5000',
      '/becarios': 'http://localhost:5000',
      '/documentos': 'http://localhost:5000',
      '/upload': 'http://localhost:5000',
      '/padrinos': 'http://localhost:5000',
      '/instituciones': 'http://localhost:5000',
      '/aportes': 'http://localhost:5000',
      '/pagos': 'http://localhost:5000',
      '/presupuesto': 'http://localhost:5000',
      '/reportes': 'http://localhost:5000',
    }
  }
});
