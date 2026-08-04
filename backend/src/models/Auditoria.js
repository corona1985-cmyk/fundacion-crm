const { DataTypes } = require('sequelize');

/**
 * Auditoria model definition
 * Audit trail records for tracking all mutations and security logins
 */
module.exports = (sequelize) => {
  const Auditoria = sequelize.define('Auditoria', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    accion: {
      type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN'),
      allowNull: false
    },
    entidad: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    entidad_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    datos_previos: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    datos_nuevos: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    ip_origen: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    fecha_hora: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'auditorias',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['usuario_id', 'fecha_hora']
      },
      {
        fields: ['accion']
      },
      {
        fields: ['entidad']
      }
    ]
  });

  return Auditoria;
};
