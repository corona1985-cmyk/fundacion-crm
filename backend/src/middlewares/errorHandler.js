/**
 * Centralized Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack || err);

  const status = err.status || err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Error interno del servidor';
  let details = err.details || null;

  // Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.details && err.details.length > 0 ? err.details[0].message : 'Validation error',
        details: err.details ? err.details.map(d => d.message) : []
      }
    });
  }

  // Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors && err.errors[0] ? err.errors[0].path : 'campo';
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: `El valor proporcionado para ${field} ya se encuentra registrado.`,
        details: err.errors ? err.errors.map(e => e.message) : []
      }
    });
  }

  // Sequelize Foreign Key Constraint Error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FOREIGN_KEY_ERROR',
        message: 'Referencia a entidad inexistente o relación no válida.'
      }
    });
  }

  // Sequelize General Validation Error
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_VALIDATION_ERROR',
        message: 'Error de validación en la base de datos',
        details: err.errors ? err.errors.map(e => e.message) : []
      }
    });
  }

  // Generic JSON response
  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  });
};

module.exports = errorHandler;
