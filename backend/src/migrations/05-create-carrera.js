'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('carreras', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      universidad_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'universidades',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      nombre: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      duracion_ciclos: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 12
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

    await queryInterface.addIndex('carreras', ['universidad_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('carreras');
  }
};
