const { DataTypes } = require('sequelize');

/**
 * Materia model definition (Curriculum Subject/Course)
 */
module.exports = (sequelize) => {
  const Materia = sequelize.define('Materia', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    carrera_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'carreras',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    codigo: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    creditos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3
    },
    nivel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1 // Ciclo/Semestre del pensum
    }
  }, {
    tableName: 'materias',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['carrera_id']
      },
      {
        fields: ['codigo']
      }
    ]
  });

  return Materia;
};
