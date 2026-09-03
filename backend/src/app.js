const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const errorHandler = require('./middlewares/errorHandler');

// Module 1 Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const auditRoutes = require('./routes/auditRoutes');

// Module 2 Routes
const universidadRoutes = require('./routes/universidadRoutes');
const carreraRoutes = require('./routes/carreraRoutes');
const cicloRoutes = require('./routes/cicloRoutes');
const becarioRoutes = require('./routes/becarioRoutes');
const documentoRoutes = require('./routes/documentoRoutes');

// Module 3 Routes
const padrinoRoutes = require('./routes/padrinoRoutes');
const institucionRoutes = require('./routes/institucionRoutes');
const aporteRoutes = require('./routes/aporteRoutes');

// Module 4 Routes
const pagoRoutes = require('./routes/pagoRoutes');
const presupuestoRoutes = require('./routes/presupuestoRoutes');
const reporteFinancieroRoutes = require('./routes/reporteFinancieroRoutes');

// Module 5 & 6 Routes
const alarmaRoutes = require('./routes/alarmaRoutes');
const reporteExportRoutes = require('./routes/reporteExportRoutes');

const isServerless = Boolean(process.env.FUNCTION_TARGET || process.env.K_SERVICE || process.env.FIREBASE_CONFIG);

const app = express();
app.set('trust proxy', 1);


// Configure CORS and Helmet with cross-origin compatibility
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded documents
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (!isServerless && fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

function mountApi(prefix = '') {
  app.get(`${prefix}/health`, (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
  });

  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/auditoria`, auditRoutes);
  app.use(`${prefix}/universidades`, universidadRoutes);
  app.use(`${prefix}/carreras`, carreraRoutes);
  app.use(`${prefix}/ciclos`, cicloRoutes);
  app.use(`${prefix}/becarios`, becarioRoutes);
  app.use(`${prefix}/documentos`, documentoRoutes);
  app.use(`${prefix}/upload`, documentoRoutes);
  app.use(`${prefix}/padrinos`, padrinoRoutes);
  app.use(`${prefix}/instituciones`, institucionRoutes);
  app.use(`${prefix}/aportes`, aporteRoutes);
  app.use(`${prefix}/pagos`, pagoRoutes);
  app.use(`${prefix}/presupuesto`, presupuestoRoutes);
  app.use(`${prefix}/reportes/financiero`, reporteFinancieroRoutes);
  app.use(`${prefix}/alarmas`, alarmaRoutes);
  app.use(`${prefix}/reportes/export`, reporteExportRoutes);

  if (process.env.ENABLE_WHATSAPP === 'true') {
    const botRoutes = require('./routes/botRoutes');
    app.use(`${prefix}/bot`, botRoutes);
  }
}

mountApi('');
mountApi('/api');

if (!isServerless && fs.existsSync(frontendDistPath)) {
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/uploads') || req.url.startsWith('/bot/qr') || req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
