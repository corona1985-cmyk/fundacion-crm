'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('becario_padrinos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      becario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'becarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      padrino_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'padrinos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      fecha_asignacion: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_DATE')
      },
      fecha_fin: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true
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

    await queryInterface.addIndex('becario_padrinos', ['becario_id']);
    await queryInterface.addIndex('becario_padrinos', ['padrino_id']);
    await queryInterface.addIndex('becario_padrinos', ['activo']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('becario_padrinos');
  }
};
