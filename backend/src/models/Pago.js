const { DataTypes } = require('sequelize');

/**
 * Pago model definition (University / Tuition Payment)
 */
module.exports = (sequelize) => {
  const Pago = sequelize.define('Pago', {
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
    concepto: {
      type: DataTypes.ENUM('inscripcion', 'mensualidad', 'matricula', 'otro'),
      allowNull: false,
      defaultValue: 'mensualidad'
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    fecha_pago: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'pagado', 'atrasado'),
      allowNull: false,
      defaultValue: 'pendiente'
    },
    comprobante: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'pagos',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['becario_id']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['fecha_vencimiento']
      }
    ]
  });

  return Pago;
};
