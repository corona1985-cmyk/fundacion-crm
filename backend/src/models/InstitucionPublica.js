const { DataTypes } = require('sequelize');

/**
 * InstitucionPublica model definition (Public Government Contributing Entity)
 */
module.exports = (sequelize) => {
  const InstitucionPublica = sequelize.define('InstitucionPublica', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true
    },
    contacto: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'instituciones_publicas',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['nombre']
      },
      {
        fields: ['activo']
      }
    ]
  });

  return InstitucionPublica;
};
