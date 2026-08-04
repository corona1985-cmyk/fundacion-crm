const { DataTypes } = require('sequelize');

/**
 * MateriaCursada model definition (Student Enrolled Subject / Grade)
 */
module.exports = (sequelize) => {
  const MateriaCursada = sequelize.define('MateriaCursada', {
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
    materia_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'materias',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    ciclo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ciclos_academicos',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    calificacion: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('EN_CURSO', 'APROBADA', 'REPROBADA', 'RETIRADA'),
      allowNull: false,
      defaultValue: 'EN_CURSO'
    }
  }, {
    tableName: 'materias_cursadas',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['becario_id']
      },
      {
        fields: ['materia_id']
      },
      {
        fields: ['ciclo_id']
      },
      {
        fields: ['estado']
      }
    ]
  });

  return MateriaCursada;
};
