const { Auditoria } = require('../models');

/**
 * Service to manage Audit Trail entries
 */
class AuditService {
  static getClientIp(req) {
    if (!req) return '127.0.0.1';
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || req.ip || '127.0.0.1';
  }

  static async logCreate({ usuarioId, entidad, entidadId, datosNuevos, req }) {
    try {
      await Auditoria.create({
        usuario_id: usuarioId || null,
        accion: 'CREATE',
        entidad,
        entidad_id: entidadId,
        datos_previos: null,
        datos_nuevos: datosNuevos || null,
        ip_origen: this.getClientIp(req),
        fecha_hora: new Date()
      });
    } catch (err) {
      console.error('Failed to log CREATE audit:', err.message);
    }
  }

  static async logUpdate({ usuarioId, entidad, entidadId, datosPrevios, datosNuevos, req }) {
    try {
      await Auditoria.create({
        usuario_id: usuarioId || null,
        accion: 'UPDATE',
        entidad,
        entidad_id: entidadId,
        datos_previos: datosPrevios || null,
        datos_nuevos: datosNuevos || null,
        ip_origen: this.getClientIp(req),
        fecha_hora: new Date()
      });
    } catch (err) {
      console.error('Failed to log UPDATE audit:', err.message);
    }
  }

  static async logDelete({ usuarioId, entidad, entidadId, datosPrevios, req }) {
    try {
      await Auditoria.create({
        usuario_id: usuarioId || null,
        accion: 'DELETE',
        entidad,
        entidad_id: entidadId,
        datos_previos: datosPrevios || null,
        datos_nuevos: null,
        ip_origen: this.getClientIp(req),
        fecha_hora: new Date()
      });
    } catch (err) {
      console.error('Failed to log DELETE audit:', err.message);
    }
  }

  static async logLogin({ usuarioId, username, req, success = true }) {
    try {
      await Auditoria.create({
        usuario_id: usuarioId || null,
        accion: 'LOGIN',
        entidad: 'Usuario',
        entidad_id: usuarioId || null,
        datos_previos: null,
        datos_nuevos: { username, success },
        ip_origen: this.getClientIp(req),
        fecha_hora: new Date()
      });
    } catch (err) {
      console.error('Failed to log LOGIN audit:', err.message);
    }
  }
}

module.exports = AuditService;
