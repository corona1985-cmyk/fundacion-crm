const { DataTypes } = require('sequelize');

/**
 * Persona model definition
 * Represents personal identity and contact data
 */
module.exports = (sequelize) => {
  const Persona = sequelize.define('Persona', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    apellido: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    cedula: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'personas',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['cedula']
      },
      {
        unique: true,
        fields: ['email']
      }
    ]
  });

  return Persona;
};
