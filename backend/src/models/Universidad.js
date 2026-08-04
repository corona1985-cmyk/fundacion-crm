const { DataTypes } = require('sequelize');

/**
 * Universidad model definition (Academic Institution Catalog)
 */
module.exports = (sequelize) => {
  const Universidad = sequelize.define('Universidad', {
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
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email_contacto: {
      type: DataTypes.STRING(150),
      allowNull: true,
      validate: {
        isEmail: true
      }
    }
  }, {
    tableName: 'universidades',
    timestamps: true,
    underscored: true
  });

  return Universidad;
};
