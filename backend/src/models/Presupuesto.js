const { DataTypes } = require('sequelize');

/**
 * Presupuesto model definition (Budget Allocation & Execution)
 */
module.exports = (sequelize) => {
  const Presupuesto = sequelize.define('Presupuesto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    categoria: {
      type: DataTypes.ENUM('becas', 'administrativo', 'operativo', 'otros'),
      allowNull: false,
      defaultValue: 'becas'
    },
    monto_asignado: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    monto_ejecutado: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    anio: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12
      }
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'presupuestos',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['categoria']
      },
      {
        fields: ['anio', 'mes']
      }
    ]
  });

  return Presupuesto;
};
