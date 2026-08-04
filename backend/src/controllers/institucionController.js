const { InstitucionPublica, Aporte } = require('../models');
const AuditService = require('../services/auditService');
const PadrinoService = require('../services/padrinoService');

/**
 * Controller for Public Institutions Management
 */
class InstitucionController {
  static async list(req, res, next) {
    try {
      const instituciones = await InstitucionPublica.findAll({
        order: [['nombre', 'ASC']]
      });

      return res.status(200).json({
        success: true,
        data: instituciones
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { nombre, contacto, telefono, email, activo } = req.body;

      const institucion = await InstitucionPublica.create({
        nombre,
        contacto,
        telefono,
        email,
        activo: activo !== undefined ? activo : true
      });

      await AuditService.logCreate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'InstitucionPublica',
        entidadId: institucion.id,
        datosNuevos: institucion.toJSON(),
        req
      });

      return res.status(201).json({
        success: true,
        message: 'Institución pública registrada exitosamente',
        data: institucion
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, contacto, telefono, email, activo } = req.body;

      const institucion = await InstitucionPublica.findByPk(id);
      if (!institucion) {
        return res.status(404).json({
          success: false,
          error: { code: 'INSTITUCION_NOT_FOUND', message: 'Institución no encontrada.' }
        });
      }

      const previousData = institucion.toJSON();

      if (nombre !== undefined) institucion.nombre = nombre;
      if (contacto !== undefined) institucion.contacto = contacto;
      if (telefono !== undefined) institucion.telefono = telefono;
      if (email !== undefined) institucion.email = email;
      if (activo !== undefined) institucion.activo = activo;

      await institucion.save();

      await AuditService.logUpdate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'InstitucionPublica',
        entidadId: institucion.id,
        datosPrevios: previousData,
        datosNuevos: institucion.toJSON(),
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Institución actualizada exitosamente',
        data: institucion
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const institucion = await InstitucionPublica.findByPk(id);
      if (!institucion) {
        return res.status(404).json({
          success: false,
          error: { code: 'INSTITUCION_NOT_FOUND', message: 'Institución no encontrada.' }
        });
      }

      const previousData = institucion.toJSON();

      institucion.activo = false;
      await institucion.save();

      await AuditService.logDelete({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'InstitucionPublica',
        entidadId: institucion.id,
        datosPrevios: previousData,
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Institución desactivada exitosamente (soft delete)'
      });
    } catch (error) {
      next(error);
    }
  }

  static async createAporte(req, res, next) {
    try {
      const { id } = req.params;
      const { monto, fecha_recepcion, medio_pago, referencia, observaciones } = req.body;

      const institucion = await InstitucionPublica.findByPk(id);
      if (!institucion) {
        return res.status(404).json({
          success: false,
          error: { code: 'INSTITUCION_NOT_FOUND', message: 'Institución no encontrada.' }
        });
      }

      if (!institucion.activo) {
        return res.status(400).json({
          success: false,
          error: { code: 'INSTITUCION_INACTIVE', message: 'La institución se encuentra inactiva.' }
        });
      }

      const aporte = await Aporte.create({
        padrino_id: null,
        institucion_id: id,
        monto,
        fecha_recepcion: fecha_recepcion || new Date(),
        medio_pago: medio_pago || 'transferencia',
        referencia,
        observaciones
      });

      await AuditService.logCreate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Aporte',
        entidadId: aporte.id,
        datosNuevos: aporte.toJSON(),
        req
      });

      return res.status(201).json({
        success: true,
        message: 'Aporte institucional registrado exitosamente',
        data: aporte
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InstitucionController;
