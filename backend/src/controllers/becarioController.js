const {
  Becario, Persona, Universidad, Carrera, MateriaCursada, Materia, CicloAcademico, Documento, sequelize
} = require('../models');
const { Op } = require('sequelize');
const AuditService = require('../services/auditService');
const BecarioService = require('../services/becarioService');

/**
 * Controller for Becarios Management
 */
class BecarioController {
  /**
   * GET /becarios
   * List scholarship recipients with pagination and filters
   */
  static async list(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);
      const offset = (page - 1) * limit;

      const { estado_beca, universidad_id, carrera_id, search } = req.query;

      const becarioWhere = {};
      const personaWhere = {};

      if (estado_beca) {
        becarioWhere.estado_beca = estado_beca;
      }
      if (universidad_id) {
        becarioWhere.universidad_id = universidad_id;
      }
      if (carrera_id) {
        becarioWhere.carrera_id = carrera_id;
      }

      if (search) {
        personaWhere[Op.or] = [
          { nombre: { [Op.iLike]: `%${search}%` } },
          { apellido: { [Op.iLike]: `%${search}%` } },
          { cedula: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Becario.findAndCountAll({
        where: becarioWhere,
        include: [
          {
            model: Persona,
            as: 'persona',
            where: Object.keys(personaWhere).length > 0 ? personaWhere : undefined
          },
          { model: Universidad, as: 'universidad', attributes: ['id', 'nombre'] },
          { model: Carrera, as: 'carrera', attributes: ['id', 'nombre'] }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
        distinct: true
      });

      return res.status(200).json({
        success: true,
        data: {
          becarios: rows,
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
   * GET /becarios/:id
   * Complete detail file of a scholarship recipient
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const becario = await Becario.findByPk(id, {
        include: [
          { model: Persona, as: 'persona' },
          { model: Universidad, as: 'universidad' },
          { model: Carrera, as: 'carrera' },
          { model: Documento, as: 'documentos' },
          {
            model: MateriaCursada,
            as: 'materias_cursadas',
            include: [
              { model: Materia, as: 'materia' },
              { model: CicloAcademico, as: 'ciclo' }
            ]
          }
        ]
      });

      if (!becario) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BECARIO_NOT_FOUND',
            message: 'Becario no encontrado.'
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: becario
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /becarios
   * Register new scholarship recipient (Creates Persona + Becario)
   */
  static async create(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const {
        nombre, apellido, cedula, fecha_nacimiento, telefono, email, direccion,
        universidad_id, carrera_id, centro_origen, fecha_seleccion, estado_beca, ciclo_actual
      } = req.body;

      // Validate existence of Universidad and Carrera
      const universidad = await Universidad.findByPk(universidad_id);
      if (!universidad) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: { code: 'UNIVERSIDAD_NOT_FOUND', message: 'La universidad especificada no existe.' }
        });
      }

      const carrera = await Carrera.findByPk(carrera_id);
      if (!carrera) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: { code: 'CARRERA_NOT_FOUND', message: 'La carrera especificada no existe.' }
        });
      }

      // Check unique Persona identity
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

      const becario = await Becario.create({
        persona_id: persona.id,
        universidad_id,
        carrera_id,
        centro_origen,
        fecha_seleccion: fecha_seleccion || new Date(),
        estado_beca: estado_beca || 'ACTIVA',
        ciclo_actual: ciclo_actual || 1,
        promedio_general: 0.00
      }, { transaction });

      await transaction.commit();

      const createdBecario = await Becario.findByPk(becario.id, {
        include: [
          { model: Persona, as: 'persona' },
          { model: Universidad, as: 'universidad' },
          { model: Carrera, as: 'carrera' }
        ]
      });

      await AuditService.logCreate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Becario',
        entidadId: becario.id,
        datosNuevos: createdBecario.toJSON(),
        req
      });

      return res.status(201).json({
        success: true,
        message: 'Becario registrado exitosamente',
        data: createdBecario
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * PUT /becarios/:id
   * Update scholarship recipient data
   */
  static async update(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const {
        nombre, apellido, cedula, fecha_nacimiento, telefono, email, direccion,
        universidad_id, carrera_id, centro_origen, fecha_seleccion, estado_beca, ciclo_actual
      } = req.body;

      const becario = await Becario.findByPk(id, {
        include: [{ model: Persona, as: 'persona' }]
      });

      if (!becario) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: { code: 'BECARIO_NOT_FOUND', message: 'Becario no encontrado.' }
        });
      }

      const previousData = becario.toJSON();
      const persona = becario.persona;

      // Update Persona
      if (nombre !== undefined) persona.nombre = nombre;
      if (apellido !== undefined) persona.apellido = apellido;
      if (cedula !== undefined) persona.cedula = cedula;
      if (fecha_nacimiento !== undefined) persona.fecha_nacimiento = fecha_nacimiento;
      if (telefono !== undefined) persona.telefono = telefono;
      if (email !== undefined) persona.email = email;
      if (direccion !== undefined) persona.direccion = direccion;

      await persona.save({ transaction });

      // Update Becario
      if (universidad_id !== undefined) becario.universidad_id = universidad_id;
      if (carrera_id !== undefined) becario.carrera_id = carrera_id;
      if (centro_origen !== undefined) becario.centro_origen = centro_origen;
      if (fecha_seleccion !== undefined) becario.fecha_seleccion = fecha_seleccion;
      if (estado_beca !== undefined) becario.estado_beca = estado_beca;
      if (ciclo_actual !== undefined) becario.ciclo_actual = ciclo_actual;

      await becario.save({ transaction });

      await transaction.commit();

      const updatedBecario = await Becario.findByPk(id, {
        include: [
          { model: Persona, as: 'persona' },
          { model: Universidad, as: 'universidad' },
          { model: Carrera, as: 'carrera' }
        ]
      });

      await AuditService.logUpdate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Becario',
        entidadId: becario.id,
        datosPrevios: previousData,
        datosNuevos: updatedBecario.toJSON(),
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Becario actualizado exitosamente',
        data: updatedBecario
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * DELETE /becarios/:id
   * Soft delete scholarship recipient (sets estado_beca = 'CANCELADA')
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const becario = await Becario.findByPk(id);
      if (!becario) {
        return res.status(404).json({
          success: false,
          error: { code: 'BECARIO_NOT_FOUND', message: 'Becario no encontrado.' }
        });
      }

      const previousData = becario.toJSON();

      becario.estado_beca = 'CANCELADA';
      await becario.save();

      await AuditService.logDelete({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Becario',
        entidadId: becario.id,
        datosPrevios: previousData,
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Estado del becario actualizado a CANCELADA exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /becarios/:id/materias
   * Enroll student in multiple courses for a given cycle
   */
  static async enrollMaterias(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { ciclo_id, materia_ids } = req.body;

      const becario = await Becario.findByPk(id);
      if (!becario) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: { code: 'BECARIO_NOT_FOUND', message: 'Becario no encontrado.' }
        });
      }

      const ciclo = await CicloAcademico.findByPk(ciclo_id);
      if (!ciclo) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: { code: 'CICLO_NOT_FOUND', message: 'Ciclo académico no encontrado.' }
        });
      }

      const createdEntries = [];
      for (const materiaId of materia_ids) {
        const materia = await Materia.findByPk(materiaId);
        if (!materia) continue;

        const [entry] = await MateriaCursada.findOrCreate({
          where: {
            becario_id: id,
            materia_id: materiaId,
            ciclo_id
          },
          defaults: {
            calificacion: null,
            estado: 'EN_CURSO'
          },
          transaction
        });

        createdEntries.push(entry);
      }

      await transaction.commit();

      await AuditService.logCreate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'MateriaCursada',
        entidadId: becario.id,
        datosNuevos: { ciclo_id, materia_ids },
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Materias cargadas/inscritas exitosamente',
        data: createdEntries
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * PUT /becarios/:id/materias/:materia_id
   * Update student course grade & recalculate cumulative GPA
   */
  static async updateCalificacion(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { id, materia_id } = req.params;
      const { calificacion, estado } = req.body;

      const materiaCursada = await MateriaCursada.findOne({
        where: { becario_id: id, materia_id }
      });

      if (!materiaCursada) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: { code: 'MATERIA_CURSADA_NOT_FOUND', message: 'Registro de materia cursada no encontrado para este becario.' }
        });
      }

      const previousData = materiaCursada.toJSON();

      materiaCursada.calificacion = calificacion;
      if (estado) {
        materiaCursada.estado = estado;
      } else {
        // Automatic status inferral based on grade (>= 70 = APROBADA)
        materiaCursada.estado = parseFloat(calificacion) >= 70 ? 'APROBADA' : 'REPROBADA';
      }

      await materiaCursada.save({ transaction });

      // Recalculate cumulative GPA
      const newPromedio = await BecarioService.updatePromedioGeneral(id, transaction);

      await transaction.commit();

      await AuditService.logUpdate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'MateriaCursada',
        entidadId: materiaCursada.id,
        datosPrevios: previousData,
        datosNuevos: { ...materiaCursada.toJSON(), nuevo_promedio_general: newPromedio },
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Calificación actualizada y promedio general recalculado exitosamente',
        data: {
          materia_cursada: materiaCursada,
          promedio_general: newPromedio
        }
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
}

module.exports = BecarioController;
