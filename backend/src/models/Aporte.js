const { DataTypes } = require('sequelize');

/**
 * Aporte model definition (Financial Contribution / Income Record)
 */
module.exports = (sequelize) => {
  const Aporte = sequelize.define('Aporte', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    padrino_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'padrinos',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    institucion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'instituciones_publicas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    fecha_recepcion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    medio_pago: {
      type: DataTypes.ENUM('transferencia', 'cheque', 'efectivo'),
      allowNull: false,
      defaultValue: 'transferencia'
    },
    referencia: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'aportes',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['padrino_id']
      },
      {
        fields: ['institucion_id']
      },
      {
        fields: ['fecha_recepcion']
      }
    ]
  });

  return Aporte;
};
