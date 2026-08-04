const Joi = require('joi');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordMessage = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo';

// Module 1 Schemas
const registerSchema = Joi.object({
  nombre: Joi.string().trim().max(100).required(),
  apellido: Joi.string().trim().max(100).required(),
  cedula: Joi.string().trim().max(20).required(),
  fecha_nacimiento: Joi.string().allow(null, ''),
  telefono: Joi.string().trim().max(20).allow(null, ''),
  email: Joi.string().email().max(150).required(),
  direccion: Joi.string().allow(null, ''),
  username: Joi.string().alphanum().min(3).max(50).required(),
  password: Joi.string().pattern(passwordRegex).required().messages({
    'string.pattern.base': passwordMessage
  }),
  rol: Joi.string().valid('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO', 'CONSULTA').default('CONSULTA')
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const updateUserSchema = Joi.object({
  nombre: Joi.string().trim().max(100),
  apellido: Joi.string().trim().max(100),
  cedula: Joi.string().trim().max(20),
  fecha_nacimiento: Joi.string().allow(null, ''),
  telefono: Joi.string().trim().max(20).allow(null, ''),
  email: Joi.string().email().max(150),
  direccion: Joi.string().allow(null, ''),
  username: Joi.string().alphanum().min(3).max(50),
  password: Joi.string().pattern(passwordRegex).messages({
    'string.pattern.base': passwordMessage
  }),
  rol: Joi.string().valid('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO', 'CONSULTA'),
  activo: Joi.boolean()
});

const updateProfileSchema = Joi.object({
  nombre: Joi.string().trim().max(100),
  apellido: Joi.string().trim().max(100),
  telefono: Joi.string().trim().max(20).allow(null, ''),
  email: Joi.string().email().max(150),
  direccion: Joi.string().allow(null, ''),
  current_password: Joi.string().when('password', { is: Joi.exist(), then: Joi.required() }),
  password: Joi.string().pattern(passwordRegex).messages({
    'string.pattern.base': passwordMessage
  })
});

// Module 2 Schemas
const createUniversidadSchema = Joi.object({
  nombre: Joi.string().trim().max(150).required(),
  direccion: Joi.string().allow(null, ''),
  telefono: Joi.string().trim().max(20).allow(null, ''),
  email_contacto: Joi.string().email().max(150).allow(null, '')
});

const createCarreraSchema = Joi.object({
  universidad_id: Joi.number().integer().required(),
  nombre: Joi.string().trim().max(150).required(),
  duracion_ciclos: Joi.number().integer().min(1).default(12)
});

const createMateriaSchema = Joi.object({
  carrera_id: Joi.number().integer().optional(),
  codigo: Joi.string().trim().max(30).required(),
  nombre: Joi.string().trim().max(150).required(),
  creditos: Joi.number().integer().min(1).default(3),
  nivel: Joi.number().integer().min(1).default(1)
});

const createCicloSchema = Joi.object({
  universidad_id: Joi.number().integer().required(),
  nombre: Joi.string().trim().max(50).required(),
  fecha_inicio: Joi.string().required(),
  fecha_fin: Joi.string().required(),
  fecha_limite_pago: Joi.string().allow(null, ''),
  ciclo_actual: Joi.boolean().default(false)
});

const createBecarioSchema = Joi.object({
  nombre: Joi.string().trim().max(100).required(),
  apellido: Joi.string().trim().max(100).required(),
  cedula: Joi.string().trim().max(20).required(),
  fecha_nacimiento: Joi.string().allow(null, ''),
  telefono: Joi.string().trim().max(20).allow(null, ''),
  email: Joi.string().email().max(150).required(),
  direccion: Joi.string().allow(null, ''),
  universidad_id: Joi.number().integer().required(),
  carrera_id: Joi.number().integer().required(),
  centro_origen: Joi.string().trim().max(150).allow(null, ''),
  fecha_seleccion: Joi.string().allow(null, ''),
  estado_beca: Joi.string().valid('ACTIVA', 'SUSPENDIDA', 'CANCELADA', 'FINALIZADA').default('ACTIVA'),
  ciclo_actual: Joi.number().integer().min(1).default(1)
});

const updateBecarioSchema = Joi.object({
  nombre: Joi.string().trim().max(100),
  apellido: Joi.string().trim().max(100),
  cedula: Joi.string().trim().max(20),
  fecha_nacimiento: Joi.string().allow(null, ''),
  telefono: Joi.string().trim().max(20).allow(null, ''),
  email: Joi.string().email().max(150),
  direccion: Joi.string().allow(null, ''),
  universidad_id: Joi.number().integer(),
  carrera_id: Joi.number().integer(),
  centro_origen: Joi.string().trim().max(150).allow(null, ''),
  fecha_seleccion: Joi.string().allow(null, ''),
  estado_beca: Joi.string().valid('ACTIVA', 'SUSPENDIDA', 'CANCELADA', 'FINALIZADA'),
  ciclo_actual: Joi.number().integer().min(1)
});

const enrollMateriasSchema = Joi.object({
  ciclo_id: Joi.number().integer().required(),
  materia_ids: Joi.array().items(Joi.number().integer()).min(1).required()
});

const updateCalificacionSchema = Joi.object({
  calificacion: Joi.number().min(0).max(100).required(),
  estado: Joi.string().valid('EN_CURSO', 'APROBADA', 'REPROBADA', 'RETIRADA')
});

// Module 3 Schemas
const createPadrinoSchema = Joi.object({
  nombre: Joi.string().trim().max(100).required(),
  apellido: Joi.string().trim().max(100).required(),
  cedula: Joi.string().trim().max(20).required(),
  fecha_nacimiento: Joi.string().allow(null, ''),
  telefono: Joi.string().trim().max(20).allow(null, ''),
  email: Joi.string().email().max(150).required(),
  direccion: Joi.string().allow(null, ''),
  tipo: Joi.string().valid('natural', 'juridica').default('natural'),
  razon_social: Joi.string().trim().max(150).allow(null, ''),
  monto_compromiso: Joi.number().min(0).default(0.00),
  frecuencia: Joi.string().valid('mensual', 'trimestral', 'anual', 'unico').default('mensual'),
  forma_pago: Joi.string().valid('transferencia', 'cheque', 'efectivo').default('transferencia'),
  activo: Joi.boolean().default(true)
});

const updatePadrinoSchema = Joi.object({
  nombre: Joi.string().trim().max(100),
  apellido: Joi.string().trim().max(100),
  cedula: Joi.string().trim().max(20),
  fecha_nacimiento: Joi.string().allow(null, ''),
  telefono: Joi.string().trim().max(20).allow(null, ''),
  email: Joi.string().email().max(150),
  direccion: Joi.string().allow(null, ''),
  tipo: Joi.string().valid('natural', 'juridica'),
  razon_social: Joi.string().trim().max(150).allow(null, ''),
  monto_compromiso: Joi.number().min(0),
  frecuencia: Joi.string().valid('mensual', 'trimestral', 'anual', 'unico'),
  forma_pago: Joi.string().valid('transferencia', 'cheque', 'efectivo'),
  activo: Joi.boolean()
});

const createInstitucionSchema = Joi.object({
  nombre: Joi.string().trim().max(150).required(),
  contacto: Joi.string().trim().max(100).allow(null, ''),
  telefono: Joi.string().trim().max(20).allow(null, ''),
  email: Joi.string().email().max(150).allow(null, ''),
  activo: Joi.boolean().default(true)
});

const updateInstitucionSchema = Joi.object({
  nombre: Joi.string().trim().max(150),
  contacto: Joi.string().trim().max(100).allow(null, ''),
  telefono: Joi.string().trim().max(20).allow(null, ''),
  email: Joi.string().email().max(150).allow(null, ''),
  activo: Joi.boolean()
});

const createAporteSubSchema = Joi.object({
  monto: Joi.number().greater(0).required(),
  fecha_recepcion: Joi.string().allow(null, ''),
  medio_pago: Joi.string().valid('transferencia', 'cheque', 'efectivo').default('transferencia'),
  referencia: Joi.string().trim().max(100).allow(null, ''),
  observaciones: Joi.string().allow(null, '')
});

const createAporteSchema = Joi.object({
  padrino_id: Joi.number().integer().allow(null),
  institucion_id: Joi.number().integer().allow(null),
  monto: Joi.number().greater(0).required(),
  fecha_recepcion: Joi.string().allow(null, ''),
  medio_pago: Joi.string().valid('transferencia', 'cheque', 'efectivo').default('transferencia'),
  referencia: Joi.string().trim().max(100).allow(null, ''),
  observaciones: Joi.string().allow(null, '')
}).xor('padrino_id', 'institucion_id');

const updateAporteSchema = Joi.object({
  referencia: Joi.string().trim().max(100).allow(null, ''),
  observaciones: Joi.string().allow(null, '')
});

const assignPadrinoSchema = Joi.object({
  padrino_id: Joi.number().integer().required(),
  fecha_asignacion: Joi.string().allow(null, ''),
  observaciones: Joi.string().allow(null, '')
});

const updateBecarioPadrinoSchema = Joi.object({
  fecha_fin: Joi.string().allow(null, ''),
  activo: Joi.boolean(),
  observaciones: Joi.string().allow(null, '')
});

// Module 4 Schemas
const createPagoSchema = Joi.object({
  becario_id: Joi.number().integer().required(),
  concepto: Joi.string().valid('inscripcion', 'mensualidad', 'matricula', 'otro').default('mensualidad'),
  monto: Joi.number().greater(0).required(),
  fecha_vencimiento: Joi.string().required(),
  fecha_pago: Joi.string().allow(null, ''),
  estado: Joi.string().valid('pendiente', 'pagado', 'atrasado'),
  comprobante: Joi.string().trim().max(255).allow(null, ''),
  observaciones: Joi.string().allow(null, '')
});

const updatePagoSchema = Joi.object({
  concepto: Joi.string().valid('inscripcion', 'mensualidad', 'matricula', 'otro'),
  monto: Joi.number().greater(0),
  fecha_vencimiento: Joi.string(),
  fecha_pago: Joi.string().allow(null, ''),
  estado: Joi.string().valid('pendiente', 'pagado', 'atrasado'),
  comprobante: Joi.string().trim().max(255).allow(null, ''),
  observaciones: Joi.string().allow(null, '')
});

const marcarPagadoSchema = Joi.object({
  fecha_pago: Joi.string().allow(null, ''),
  comprobante: Joi.string().trim().max(255).allow(null, ''),
  observaciones: Joi.string().allow(null, '')
});

const createPresupuestoSchema = Joi.object({
  categoria: Joi.string().valid('becas', 'administrativo', 'operativo', 'otros').required(),
  monto_asignado: Joi.number().min(0).required(),
  anio: Joi.number().integer().min(2020).max(2100).required(),
  mes: Joi.number().integer().min(1).max(12).required(),
  observaciones: Joi.string().allow(null, '')
});

const updatePresupuestoSchema = Joi.object({
  monto_asignado: Joi.number().min(0),
  monto_ejecutado: Joi.number().min(0),
  observaciones: Joi.string().allow(null, '')
});

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
    if (error) {
      error.isJoi = true;
      return next(error);
    }
    req[property] = value;
    next();
  };
};

module.exports = {
  validate,
  schemas: {
    registerSchema,
    loginSchema,
    updateUserSchema,
    updateProfileSchema,
    createUniversidadSchema,
    createCarreraSchema,
    createMateriaSchema,
    createCicloSchema,
    createBecarioSchema,
    updateBecarioSchema,
    enrollMateriasSchema,
    updateCalificacionSchema,
    createPadrinoSchema,
    updatePadrinoSchema,
    createInstitucionSchema,
    updateInstitucionSchema,
    createAporteSubSchema,
    createAporteSchema,
    updateAporteSchema,
    assignPadrinoSchema,
    updateBecarioPadrinoSchema,
    createPagoSchema,
    updatePagoSchema,
    marcarPagadoSchema,
    createPresupuestoSchema,
    updatePresupuestoSchema
  }
};
