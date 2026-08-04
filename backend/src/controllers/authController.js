const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Usuario, Persona, sequelize } = require('../models');
const AuditService = require('../services/auditService');

/**
 * Controller for Auth Endpoints
 */
class AuthController {
  /**
   * POST /auth/register
   * Admin only: Creates Persona and Usuario in a database transaction
   */
  static async register(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const {
        nombre, apellido, cedula, fecha_nacimiento, telefono, email, direccion,
        username, password, rol
      } = req.body;

      // Check for existing cedula, email, or username
      const existingPersona = await Persona.findOne({
        where: { [sequelize.Sequelize.Op.or]: [{ cedula }, { email }] }
      });

      if (existingPersona) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_PERSONA',
            message: 'La cédula o el correo electrónico ya se encuentran registrados.'
          }
        });
      }

      const existingUsuario = await Usuario.findOne({ where: { username } });
      if (existingUsuario) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_USERNAME',
            message: 'El nombre de usuario ya está en uso.'
          }
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

      const usuario = await Usuario.create({
        persona_id: persona.id,
        username,
        password_hash: password, // beforeCreate hook will hash this
        rol: rol || 'CONSULTA',
        activo: true
      }, { transaction });

      await transaction.commit();

      // Audit log
      await AuditService.logCreate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Usuario',
        entidadId: usuario.id,
        datosNuevos: { username, rol: usuario.rol, email, cedula },
        req
      });

      const userWithPersona = await Usuario.findByPk(usuario.id, {
        include: [{ model: Persona, as: 'persona' }],
        attributes: { exclude: ['password_hash'] }
      });

      return res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: userWithPersona
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * POST /auth/login
   * Authenticates user and returns JWT token
   */
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;

      const usuario = await Usuario.findOne({
        where: { username },
        include: [{ model: Persona, as: 'persona' }]
      });

      if (!usuario) {
        await AuditService.logLogin({ usuarioId: null, username, req, success: false });
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Nombre de usuario o contraseña incorrectos.'
          }
        });
      }

      if (!usuario.activo) {
        await AuditService.logLogin({ usuarioId: usuario.id, username, req, success: false });
        return res.status(403).json({
          success: false,
          error: {
            code: 'USER_INACTIVE',
            message: 'La cuenta de usuario se encuentra desactivada.'
          }
        });
      }

      const isValidPassword = await usuario.comparePassword(password);
      if (!isValidPassword) {
        await AuditService.logLogin({ usuarioId: usuario.id, username, req, success: false });
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Nombre de usuario o contraseña incorrectos.'
          }
        });
      }

      // Update last login timestamp
      usuario.ultimo_acceso = new Date();
      await usuario.save();

      // Issue JWT
      const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_rompiendo_paradigmas_2026';
      const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

      const token = jwt.sign(
        { id: usuario.id, username: usuario.username, rol: usuario.rol },
        secret,
        { expiresIn }
      );

      await AuditService.logLogin({ usuarioId: usuario.id, username, req, success: true });

      const userResponse = usuario.toJSON();
      delete userResponse.password_hash;

      return res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          token,
          expires_in: expiresIn,
          user: userResponse
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/me
   * Returns current authenticated user details
   */
  static async me(req, res, next) {
    try {
      const userResponse = req.user.toJSON();
      delete userResponse.password_hash;

      return res.status(200).json({
        success: true,
        data: userResponse
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /auth/me
   * Updates self user profile or password
   */
  static async updateMe(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const usuario = req.user;
      const persona = usuario.persona;
      const { nombre, apellido, telefono, email, direccion, current_password, password } = req.body;

      const previousData = {
        persona: persona.toJSON(),
        usuario: { username: usuario.username, rol: usuario.rol }
      };

      // Update Persona details
      if (nombre !== undefined) persona.nombre = nombre;
      if (apellido !== undefined) persona.apellido = apellido;
      if (telefono !== undefined) persona.telefono = telefono;
      if (email !== undefined) persona.email = email;
      if (direccion !== undefined) persona.direccion = direccion;

      await persona.save({ transaction });

      // Password update handling
      if (password) {
        const isMatch = await usuario.comparePassword(current_password);
        if (!isMatch) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_CURRENT_PASSWORD',
              message: 'La contraseña actual ingresada es incorrecta.'
            }
          });
        }
        usuario.password_hash = password; // beforeUpdate hook hashes it
        await usuario.save({ transaction });
      }

      await transaction.commit();

      const updatedUser = await Usuario.findByPk(usuario.id, {
        include: [{ model: Persona, as: 'persona' }],
        attributes: { exclude: ['password_hash'] }
      });

      await AuditService.logUpdate({
        usuarioId: usuario.id,
        entidad: 'Usuario',
        entidadId: usuario.id,
        datosPrevios: previousData,
        datosNuevos: updatedUser.toJSON(),
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: updatedUser
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * POST /auth/logout
   * Logout confirmation endpoint
   */
  static async logout(req, res, next) {
    return res.status(200).json({
      success: true,
      message: 'Cierre de sesión exitoso'
    });
  }
}

module.exports = AuthController;
