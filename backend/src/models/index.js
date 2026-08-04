const { Sequelize } = require('sequelize');
const configEnv = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const config = configEnv[env];

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const db = {};

// Module 1 Models
db.Persona = require('./Persona')(sequelize);
db.Usuario = require('./Usuario')(sequelize);
db.Auditoria = require('./Auditoria')(sequelize);

// Module 2 Models
db.Universidad = require('./Universidad')(sequelize);
db.Carrera = require('./Carrera')(sequelize);
db.Materia = require('./Materia')(sequelize);
db.CicloAcademico = require('./CicloAcademico')(sequelize);
db.Becario = require('./Becario')(sequelize);
db.MateriaCursada = require('./MateriaCursada')(sequelize);
db.Documento = require('./Documento')(sequelize);

// Module 3 Models
db.Padrino = require('./Padrino')(sequelize);
db.InstitucionPublica = require('./InstitucionPublica')(sequelize);
db.Aporte = require('./Aporte')(sequelize);
db.BecarioPadrino = require('./BecarioPadrino')(sequelize);

// Module 4 Models
db.Pago = require('./Pago')(sequelize);
db.Presupuesto = require('./Presupuesto')(sequelize);
db.GastoAdministrativo = require('./GastoAdministrativo')(sequelize);

// Module 5 Models
db.Alarma = require('./Alarma')(sequelize);

// Module 1 Associations
db.Persona.hasOne(db.Usuario, { foreignKey: 'persona_id', as: 'usuario', onDelete: 'CASCADE' });
db.Usuario.belongsTo(db.Persona, { foreignKey: 'persona_id', as: 'persona' });

db.Usuario.hasMany(db.Auditoria, { foreignKey: 'usuario_id', as: 'auditorias', onDelete: 'SET NULL' });
db.Auditoria.belongsTo(db.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Module 2 Associations
db.Universidad.hasMany(db.Carrera, { foreignKey: 'universidad_id', as: 'carreras', onDelete: 'RESTRICT' });
db.Carrera.belongsTo(db.Universidad, { foreignKey: 'universidad_id', as: 'universidad' });

db.Carrera.hasMany(db.Materia, { foreignKey: 'carrera_id', as: 'materias', onDelete: 'CASCADE' });
db.Materia.belongsTo(db.Carrera, { foreignKey: 'carrera_id', as: 'carrera' });

db.Universidad.hasMany(db.CicloAcademico, { foreignKey: 'universidad_id', as: 'ciclos', onDelete: 'RESTRICT' });
db.CicloAcademico.belongsTo(db.Universidad, { foreignKey: 'universidad_id', as: 'universidad' });

db.Persona.hasOne(db.Becario, { foreignKey: 'persona_id', as: 'becario', onDelete: 'CASCADE' });
db.Becario.belongsTo(db.Persona, { foreignKey: 'persona_id', as: 'persona' });

db.Universidad.hasMany(db.Becario, { foreignKey: 'universidad_id', as: 'becarios', onDelete: 'RESTRICT' });
db.Becario.belongsTo(db.Universidad, { foreignKey: 'universidad_id', as: 'universidad' });

db.Carrera.hasMany(db.Becario, { foreignKey: 'carrera_id', as: 'becarios', onDelete: 'RESTRICT' });
db.Becario.belongsTo(db.Carrera, { foreignKey: 'carrera_id', as: 'carrera' });

db.Becario.hasMany(db.MateriaCursada, { foreignKey: 'becario_id', as: 'materias_cursadas', onDelete: 'CASCADE' });
db.MateriaCursada.belongsTo(db.Becario, { foreignKey: 'becario_id', as: 'becario' });

db.Materia.hasMany(db.MateriaCursada, { foreignKey: 'materia_id', as: 'historicos_cursados', onDelete: 'RESTRICT' });
db.MateriaCursada.belongsTo(db.Materia, { foreignKey: 'materia_id', as: 'materia' });

db.CicloAcademico.hasMany(db.MateriaCursada, { foreignKey: 'ciclo_id', as: 'materias_cursadas', onDelete: 'RESTRICT' });
db.MateriaCursada.belongsTo(db.CicloAcademico, { foreignKey: 'ciclo_id', as: 'ciclo' });

db.Becario.hasMany(db.Documento, { foreignKey: 'becario_id', as: 'documentos', onDelete: 'CASCADE' });
db.Documento.belongsTo(db.Becario, { foreignKey: 'becario_id', as: 'becario' });

// Module 3 Associations
db.Persona.hasOne(db.Padrino, { foreignKey: 'persona_id', as: 'padrino', onDelete: 'CASCADE' });
db.Padrino.belongsTo(db.Persona, { foreignKey: 'persona_id', as: 'persona' });

db.Padrino.hasMany(db.Aporte, { foreignKey: 'padrino_id', as: 'aportes', onDelete: 'SET NULL' });
db.Aporte.belongsTo(db.Padrino, { foreignKey: 'padrino_id', as: 'padrino' });

db.InstitucionPublica.hasMany(db.Aporte, { foreignKey: 'institucion_id', as: 'aportes', onDelete: 'SET NULL' });
db.Aporte.belongsTo(db.InstitucionPublica, { foreignKey: 'institucion_id', as: 'institucion' });

db.Becario.belongsToMany(db.Padrino, { through: db.BecarioPadrino, foreignKey: 'becario_id', otherKey: 'padrino_id', as: 'padrinos' });
db.Padrino.belongsToMany(db.Becario, { through: db.BecarioPadrino, foreignKey: 'padrino_id', otherKey: 'becario_id', as: 'becarios' });

db.Becario.hasMany(db.BecarioPadrino, { foreignKey: 'becario_id', as: 'asignaciones_padrinos', onDelete: 'CASCADE' });
db.BecarioPadrino.belongsTo(db.Becario, { foreignKey: 'becario_id', as: 'becario' });

db.Padrino.hasMany(db.BecarioPadrino, { foreignKey: 'padrino_id', as: 'asignaciones_becarios', onDelete: 'CASCADE' });
db.BecarioPadrino.belongsTo(db.Padrino, { foreignKey: 'padrino_id', as: 'padrino' });

// Module 4 Associations
db.Becario.hasMany(db.Pago, { foreignKey: 'becario_id', as: 'pagos', onDelete: 'CASCADE' });
db.Pago.belongsTo(db.Becario, { foreignKey: 'becario_id', as: 'becario' });

// Module 5 Associations
db.Usuario.hasMany(db.Alarma, { foreignKey: 'atendida_por', as: 'alarmas_atendidas' });
db.Alarma.belongsTo(db.Usuario, { foreignKey: 'atendida_por', as: 'atendidaPor' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
