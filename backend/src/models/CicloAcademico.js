const { DataTypes } = require('sequelize');

/**
 * CicloAcademico model definition (Academic Term/Cycle)
 */
module.exports = (sequelize) => {
  const CicloAcademico = sequelize.define('CicloAcademico', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    nombre: {
      type: DataTypes.STRING(50), // e.g. "2026-1", "Enero-Abril 2026"
      allowNull: false
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    fecha_limite_pago: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    ciclo_actual: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'ciclos_academicos',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['universidad_id']
      },
      {
        fields: ['ciclo_actual']
      }
    ]
  });

  return CicloAcademico;
};
