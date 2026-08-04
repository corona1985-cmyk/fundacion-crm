const { DataTypes } = require('sequelize');

/**
 * BecarioPadrino model definition (Many-to-Many Becario & Padrino assignment relationship)
 */
module.exports = (sequelize) => {
  const BecarioPadrino = sequelize.define('BecarioPadrino', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    becario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'becarios',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    padrino_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'padrinos',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    fecha_asignacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'becario_padrinos',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['becario_id']
      },
      {
        fields: ['padrino_id']
      },
      {
        fields: ['activo']
      }
    ]
  });

  return BecarioPadrino;
};
