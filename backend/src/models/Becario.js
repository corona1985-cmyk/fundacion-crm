const { DataTypes } = require('sequelize');

/**
 * Becario model definition
 * Extends Persona 1:1 with scholarship details, university info, status, and GPA
 */
module.exports = (sequelize) => {
  const Becario = sequelize.define('Becario', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    persona_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'personas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    universidad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'universidades',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    carrera_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'carreras',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    centro_origen: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    fecha_seleccion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    estado_beca: {
      type: DataTypes.ENUM('ACTIVA', 'SUSPENDIDA', 'CANCELADA', 'FINALIZADA'),
      allowNull: false,
      defaultValue: 'ACTIVA'
    },
    ciclo_actual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    promedio_general: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      defaultValue: null
    },
    estado_graduacion_liceo: {
      type: DataTypes.STRING(150),
      allowNull: true,
      defaultValue: 'Pendiente'
    },
    documento_solicitud: {
      type: DataTypes.STRING(150),
      allowNull: true,
      defaultValue: 'Documento de solicitud de beca Creado'
    }
  }, {
    tableName: 'becarios',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['persona_id']
      },
      {
        fields: ['universidad_id']
      },
      {
        fields: ['carrera_id']
      },
      {
        fields: ['estado_beca']
      }
    ]
  });

  return Becario;
};
