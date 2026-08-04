const { DataTypes } = require('sequelize');

/**
 * Padrino model definition
 * Extends Persona 1:1 with sponsor details, commitment amount, frequency, and payment method
 */
module.exports = (sequelize) => {
  const Padrino = sequelize.define('Padrino', {
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
    tipo: {
      type: DataTypes.ENUM('natural', 'juridica'),
      allowNull: false,
      defaultValue: 'natural'
    },
    razon_social: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    monto_compromiso: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    frecuencia: {
      type: DataTypes.ENUM('mensual', 'trimestral', 'anual', 'unico'),
      allowNull: false,
      defaultValue: 'mensual'
    },
    forma_pago: {
      type: DataTypes.ENUM('transferencia', 'cheque', 'efectivo'),
      allowNull: false,
      defaultValue: 'transferencia'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'padrinos',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['persona_id']
      },
      {
        fields: ['tipo']
      },
      {
        fields: ['activo']
      }
    ]
  });

  return Padrino;
};
