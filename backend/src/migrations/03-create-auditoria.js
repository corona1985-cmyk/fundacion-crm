'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('auditorias', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      accion: {
        type: Sequelize.ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN'),
        allowNull: false
      },
      entidad: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entidad_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      datos_previos: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      datos_nuevos: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      ip_origen: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      fecha_hora: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('auditorias', ['usuario_id', 'fecha_hora']);
    await queryInterface.addIndex('auditorias', ['accion']);
    await queryInterface.addIndex('auditorias', ['entidad']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('auditorias');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_auditorias_accion";');
  }
};
