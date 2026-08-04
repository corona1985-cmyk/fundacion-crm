const { DataTypes } = require('sequelize');

/**
 * GastoAdministrativo model definition (Administrative & Operational Expense Record)
 */
module.exports = (sequelize) => {
  const GastoAdministrativo = sequelize.define('GastoAdministrativo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    categoria: {
      type: DataTypes.ENUM('becas', 'administrativo', 'operativo', 'otros'),
      allowNull: false,
      defaultValue: 'administrativo'
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    comprobante: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'gastos_administrativos',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['categoria']
      },
      {
        fields: ['fecha']
      }
    ]
  });

  return GastoAdministrativo;
};
