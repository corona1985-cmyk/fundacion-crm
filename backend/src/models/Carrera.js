const { DataTypes } = require('sequelize');

/**
 * Carrera model definition (Academic Degree Program)
 */
module.exports = (sequelize) => {
  const Carrera = sequelize.define('Carrera', {
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
      type: DataTypes.STRING(150),
      allowNull: false
    },
    duracion_ciclos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12
    }
  }, {
    tableName: 'carreras',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['universidad_id']
      }
    ]
  });

  return Carrera;
};
