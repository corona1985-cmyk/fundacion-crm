require('dotenv').config();
const http = require('http');
const express = require('express');
const { resolveDatabase } = require('./bootstrapDb');

const PORT = process.env.PORT || 5000;

const bootApp = express();
bootApp.get('/health', (req, res) => {
  res.status(200).json({ status: 'starting', timestamp: new Date() });
});
bootApp.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'starting', timestamp: new Date() });
});
bootApp.use((req, res) => {
  res.status(503).json({
    success: false,
    error: {
      code: 'STARTING',
      message: 'El servidor está iniciando. Intente de nuevo en unos segundos.'
    }
  });
});

let currentApp = bootApp;
const server = http.createServer((req, res) => currentApp(req, res));

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Puerto ${PORT} abierto. Inicializando base de datos...`);
});

async function startServer() {
  const dialect = await resolveDatabase();

  try {
    require('../scripts/copy-db');
  } catch (error) {
    console.warn('No se pudo inyectar SQLite:', error.message);
  }

  const app = require('./app');
  const { sequelize } = require('./models');

  try {
    await sequelize.authenticate();
    console.log(`Conexión a ${dialect} establecida.`);

    if (dialect === 'sqlite' || process.env.NODE_ENV !== 'production' || process.env.SYNC_ON_START === 'true') {
      await sequelize.sync();
      console.log('Modelos sincronizados.');
    }

    try {
      const ensureAdmin = require('../scripts/ensure-admin');
      await ensureAdmin();
    } catch (adminError) {
      console.warn('No se pudo verificar el usuario administrador:', adminError.message);
    }
  } catch (error) {
    console.error('No se pudo preparar la base de datos:', error.message);
  }

  currentApp = app;
  console.log('CRM backend listo para tráfico.');
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    console.error('Fallo al iniciar el backend:', error);
  });
}
