const { Usuario, Persona, sequelize } = require('../models');
const { Op } = require('sequelize');
const AuditService = require('../services/auditService');

/**
 * Controller for User Management Endpoints (Admin only)
 */
class UserController {
  /**
   * GET /users
   * List users with pagination, filters (rol, activo, search)
   */
  static async list(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);
      const offset = (page - 1) * limit;

      const { rol, activo, search } = req.query;

      const userWhere = {};
      const personaWhere = {};

      if (rol) {
        userWhere.rol = rol;
      }

      if (activo !== undefined && activo !== '') {
        userWhere.activo = activo === 'true' || activo === true;
      }

      if (search) {
        personaWhere[Op.or] = [
          { nombre: { [Op.iLike]: `%${search}%` } },
          { apellido: { [Op.iLike]: `%${search}%` } },
          { cedula: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Usuario.findAndCountAll({
        where: userWhere,
        include: [
          {
            model: Persona,
            as: 'persona',
            where: Object.keys(personaWhere).length > 0 ? personaWhere : undefined
          }
        ],
        attributes: { exclude: ['password_hash'] },
        order: [['created_at', 'DESC']],
        limit,
        offset,
        distinct: true
      });

      return res.status(200).json({
        success: true,
        data: {
          users: rows,
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
   * GET /users/:id
   * Get single user detail by ID
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const usuario = await Usuario.findByPk(id, {
        include: [{ model: Persona, as: 'persona' }],
        attributes: { exclude: ['password_hash'] }
      });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuario no encontrado.'
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: usuario
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /users/:id
   * Update user details, role, status, or persona info
   */
  static async update(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const {
        nombre, apellido, cedula, fecha_nacimiento, telefono, email, direccion,
        username, password, rol, activo
      } = req.body;

      const usuario = await Usuario.findByPk(id, {
        include: [{ model: Persona, as: 'persona' }]
      });

      if (!usuario) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuario no encontrado.'
          }
        });
      }

      const previousData = usuario.toJSON();
      delete previousData.password_hash;

      const persona = usuario.persona;

      // Update Persona details
      if (nombre !== undefined) persona.nombre = nombre;
      if (apellido !== undefined) persona.apellido = apellido;
      if (cedula !== undefined) persona.cedula = cedula;
      if (fecha_nacimiento !== undefined) persona.fecha_nacimiento = fecha_nacimiento;
      if (telefono !== undefined) persona.telefono = telefono;
      if (email !== undefined) persona.email = email;
      if (direccion !== undefined) persona.direccion = direccion;

      await persona.save({ transaction });

      // Update Usuario details
      if (username !== undefined) usuario.username = username;
      if (rol !== undefined) usuario.rol = rol;
      if (activo !== undefined) usuario.activo = activo;
      if (password) usuario.password_hash = password;

      await usuario.save({ transaction });

      await transaction.commit();

      const updatedUser = await Usuario.findByPk(id, {
        include: [{ model: Persona, as: 'persona' }],
        attributes: { exclude: ['password_hash'] }
      });

      await AuditService.logUpdate({
        usuarioId: req.user.id,
        entidad: 'Usuario',
        entidadId: usuario.id,
        datosPrevios: previousData,
        datosNuevos: updatedUser.toJSON(),
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: updatedUser
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * DELETE /users/:id
   * Soft delete user (set activo = false AND paranoid destroy deleted_at)
   */
  static async delete(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;

      const usuario = await Usuario.findByPk(id, {
        include: [{ model: Persona, as: 'persona' }]
      });

      if (!usuario) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuario no encontrado.'
          }
        });
      }

      // Self delete prevention
      if (parseInt(id, 10) === req.user.id) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: {
            code: 'SELF_DELETION_DENIED',
            message: 'No puede eliminar su propia cuenta de usuario.'
          }
        });
      }

      const previousData = usuario.toJSON();
      delete previousData.password_hash;

      // Set active to false
      usuario.activo = false;
      await usuario.save({ transaction });

      // Soft delete row in DB using Sequelize paranoid destroy
      await usuario.destroy({ transaction });

      await transaction.commit();

      await AuditService.logDelete({
        usuarioId: req.user.id,
        entidad: 'Usuario',
        entidadId: usuario.id,
        datosPrevios: previousData,
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente (soft delete)'
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
}

module.exports = UserController;
