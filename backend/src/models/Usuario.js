const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

/**
 * Usuario model definition
 * Handles authentication credentials, role, status, and soft delete (paranoid)
 */
module.exports = (sequelize) => {
  const Usuario = sequelize.define('Usuario', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    persona_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'personas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    rol: {
      type: DataTypes.ENUM('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO', 'CONSULTA'),
      allowNull: false,
      defaultValue: 'CONSULTA'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    ultimo_acceso: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'usuarios',
    timestamps: true,
    paranoid: true, // soft delete via deleted_at column
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['username']
      },
      {
        fields: ['rol']
      },
      {
        fields: ['activo']
      }
    ],
    hooks: {
      beforeCreate: async (usuario) => {
        if (usuario.password_hash && !usuario.password_hash.startsWith('$2a$') && !usuario.password_hash.startsWith('$2b$')) {
          const saltRounds = parseInt(process.env.SALT_ROUNDS || '10', 10);
          usuario.password_hash = await bcrypt.hash(usuario.password_hash, saltRounds);
        }
      },
      beforeUpdate: async (usuario) => {
        if (usuario.changed('password_hash') && !usuario.password_hash.startsWith('$2a$') && !usuario.password_hash.startsWith('$2b$')) {
          const saltRounds = parseInt(process.env.SALT_ROUNDS || '10', 10);
          usuario.password_hash = await bcrypt.hash(usuario.password_hash, saltRounds);
        }
      }
    }
  });

  /**
   * Helper method to compare candidate password with stored hash
   */
  Usuario.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password_hash);
  };

  return Usuario;
};
