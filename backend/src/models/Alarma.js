const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Alarma = sequelize.define('Alarma', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tipo: {
      type: DataTypes.ENUM('PROMEDIO_BAJO', 'MATERIA_REPROBADA', 'DOCUMENTO_VENCIDO', 'PAGO_VENCIDO', 'APORTE_RETRASADO', 'GRADUACION_PROXIMA'),
      allowNull: false
    },
    nivel: {
      type: DataTypes.ENUM('bajo', 'medio', 'critico'),
      allowNull: false,
      defaultValue: 'medio'
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    entidad_relacionada: {
      type: DataTypes.STRING,
      allowNull: true
    },
    entidad_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'atendida', 'descartada'),
      allowNull: false,
      defaultValue: 'pendiente'
    },
    resolucion_nota: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    atendida_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    fecha_atencion: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'alarmas',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tipo'] },
      { fields: ['nivel'] },
      { fields: ['estado'] },
      { fields: ['entidad_relacionada', 'entidad_id'] }
    ]
  });

  return Alarma;
};
