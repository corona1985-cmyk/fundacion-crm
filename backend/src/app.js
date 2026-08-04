const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
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

const app = express();

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

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// API Routes Mounting
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/auditoria', auditRoutes);
app.use('/audit', auditRoutes);

// Module 2 Routes
app.use('/universidades', universidadRoutes);
app.use('/carreras', carreraRoutes);
app.use('/ciclos', cicloRoutes);
app.use('/becarios', becarioRoutes);
app.use('/documentos', documentoRoutes);
app.use('/upload', documentoRoutes);

// Module 3 Routes
app.use('/padrinos', padrinoRoutes);
app.use('/instituciones', institucionRoutes);
app.use('/aportes', aporteRoutes);

// Module 4 Routes
app.use('/pagos', pagoRoutes);
app.use('/presupuesto', presupuestoRoutes);
app.use('/reportes/financiero', reporteFinancieroRoutes);

// Module 5 & 6 Routes
app.use('/alarmas', alarmaRoutes);
app.use('/reportes/export', reporteExportRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
