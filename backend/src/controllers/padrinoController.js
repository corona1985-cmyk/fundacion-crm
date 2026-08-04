const { Padrino, Persona, Aporte, BecarioPadrino, Becario, sequelize } = require('../models');
const { Op } = require('sequelize');
const AuditService = require('../services/auditService');
const PadrinoService = require('../services/padrinoService');

/**
 * Controller for Sponsor (Padrino) Management
 */
class PadrinoController {
  /**
   * GET /padrinos
   * List sponsors with pagination and filters
   */
  static async list(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);
      const offset = (page - 1) * limit;

      const { tipo, activo, frecuencia, search } = req.query;

      const padrinoWhere = {};
      const personaWhere = {};

      if (tipo) padrinoWhere.tipo = tipo;
      if (frecuencia) padrinoWhere.frecuencia = frecuencia;
      if (activo !== undefined && activo !== '') {
        padrinoWhere.activo = activo === 'true' || activo === true;
      }

      if (search) {
        personaWhere[Op.or] = [
          { nombre: { [Op.iLike]: `%${search}%` } },
          { apellido: { [Op.iLike]: `%${search}%` } },
          { cedula: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Padrino.findAndCountAll({
        where: padrinoWhere,
        include: [
          {
            model: Persona,
            as: 'persona',
            where: Object.keys(personaWhere).length > 0 ? personaWhere : undefined
          }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
        distinct: true
      });

      return res.status(200).json({
        success: true,
        data: {
          padrinos: rows,
          pagination: {
            total_items: count,
            total_pages: Math.ceil(count / limit),
            current_page: page,
            limit
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /padrinos/:id
   * Get single sponsor detail including contributions and assigned students
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const padrino = await Padrino.findByPk(id, {
        include: [
          { model: Persona, as: 'persona' },
          { model: Aporte, as: 'aportes' },
          {
            model: BecarioPadrino,
            as: 'asignaciones_becarios',
            include: [{ model: Becario, as: 'becario', include: [{ model: Persona, as: 'persona' }] }]
          }
        ]
      });

      if (!padrino) {
        return res.status(404).json({
          success: false,
          error: { code: 'PADRINO_NOT_FOUND', message: 'Padrino no encontrado.' }
        });
      }

      const totalAportado = await PadrinoService.getTotalAportadoPadrino(id);

      return res.status(200).json({
        success: true,
        data: {
          ...padrino.toJSON(),
          total_aportado: totalAportado
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /padrinos
   * Register a new sponsor (Creates Persona + Padrino in transaction)
   */
  static async create(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const {
        nombre, apellido, cedula, fecha_nacimiento, telefono, email, direccion,
        tipo, razon_social, monto_compromiso, frecuencia, forma_pago, activo
      } = req.body;

      const existingPersona = await Persona.findOne({
        where: { [Op.or]: [{ cedula }, { email }] }
      });

      if (existingPersona) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_PERSONA', message: 'La cédula o el correo electrónico ya se encuentran registrados.' }
        });
      }

      const persona = await Persona.create({
        nombre,
        apellido,
        cedula,
        fecha_nacimiento,
        telefono,
        email,
        direccion
      }, { transaction });

      const padrino = await Padrino.create({
        persona_id: persona.id,
        tipo: tipo || 'natural',
        razon_social: tipo === 'juridica' ? razon_social : null,
        monto_compromiso: monto_compromiso || 0.00,
        frecuencia: frecuencia || 'mensual',
        forma_pago: forma_pago || 'transferencia',
        activo: activo !== undefined ? activo : true
      }, { transaction });

      await transaction.commit();

      const createdPadrino = await Padrino.findByPk(padrino.id, {
        include: [{ model: Persona, as: 'persona' }]
      });

      await AuditService.logCreate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Padrino',
        entidadId: padrino.id,
        datosNuevos: createdPadrino.toJSON(),
        req
      });

      return res.status(201).json({
        success: true,
        message: 'Padrino registrado exitosamente',
        data: createdPadrino
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * PUT /padrinos/:id
   * Update sponsor details
   */
  static async update(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const {
        nombre, apellido, cedula, fecha_nacimiento, telefono, email, direccion,
        tipo, razon_social, monto_compromiso, frecuencia, forma_pago, activo
      } = req.body;

      const padrino = await Padrino.findByPk(id, {
        include: [{ model: Persona, as: 'persona' }]
      });

      if (!padrino) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: { code: 'PADRINO_NOT_FOUND', message: 'Padrino no encontrado.' }
        });
      }

      const previousData = padrino.toJSON();
      const persona = padrino.persona;

      // Update Persona
      if (nombre !== undefined) persona.nombre = nombre;
      if (apellido !== undefined) persona.apellido = apellido;
      if (cedula !== undefined) persona.cedula = cedula;
      if (fecha_nacimiento !== undefined) persona.fecha_nacimiento = fecha_nacimiento;
      if (telefono !== undefined) persona.telefono = telefono;
      if (email !== undefined) persona.email = email;
      if (direccion !== undefined) persona.direccion = direccion;

      await persona.save({ transaction });

      // Update Padrino
      if (tipo !== undefined) padrino.tipo = tipo;
      if (razon_social !== undefined) padrino.razon_social = razon_social;
      if (monto_compromiso !== undefined) padrino.monto_compromiso = monto_compromiso;
      if (frecuencia !== undefined) padrino.frecuencia = frecuencia;
      if (forma_pago !== undefined) padrino.forma_pago = forma_pago;
      if (activo !== undefined) padrino.activo = activo;

      await padrino.save({ transaction });

      await transaction.commit();

      const updatedPadrino = await Padrino.findByPk(id, {
        include: [{ model: Persona, as: 'persona' }]
      });

      await AuditService.logUpdate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Padrino',
        entidadId: padrino.id,
        datosPrevios: previousData,
        datosNuevos: updatedPadrino.toJSON(),
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Padrino actualizado exitosamente',
        data: updatedPadrino
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * DELETE /padrinos/:id
   * Soft delete sponsor (sets activo = false)
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const padrino = await Padrino.findByPk(id);
      if (!padrino) {
        return res.status(404).json({
          success: false,
          error: { code: 'PADRINO_NOT_FOUND', message: 'Padrino no encontrado.' }
        });
      }

      const previousData = padrino.toJSON();

      padrino.activo = false;
      await padrino.save();

      await AuditService.logDelete({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Padrino',
        entidadId: padrino.id,
        datosPrevios: previousData,
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Padrino desactivado exitosamente (soft delete)'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /padrinos/:id/aportes
   * Register contribution from a sponsor
   */
  static async createAporte(req, res, next) {
    try {
      const { id } = req.params;
      const { monto, fecha_recepcion, medio_pago, referencia, observaciones } = req.body;

      const padrino = await Padrino.findByPk(id);
      if (!padrino) {
        return res.status(404).json({
          success: false,
          error: { code: 'PADRINO_NOT_FOUND', message: 'Padrino no encontrado.' }
        });
      }

      if (!padrino.activo) {
        return res.status(400).json({
          success: false,
          error: { code: 'PADRINO_INACTIVE', message: 'El padrino se encuentra inactivo.' }
        });
      }

      const aporte = await Aporte.create({
        padrino_id: id,
        institucion_id: null,
        monto,
        fecha_recepcion: fecha_recepcion || new Date(),
        medio_pago: medio_pago || padrino.forma_pago || 'transferencia',
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
        message: 'Aporte registrado exitosamente',
        data: aporte
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /padrinos/:id/aportes
   * List contribution history for a sponsor
   */
  static async getAportes(req, res, next) {
    try {
      const { id } = req.params;

      const aportes = await Aporte.findAll({
        where: { padrino_id: id },
        order: [['fecha_recepcion', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: aportes
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PadrinoController;
