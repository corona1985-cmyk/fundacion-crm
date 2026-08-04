'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('materias', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      carrera_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'carreras',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      codigo: {
        type: Sequelize.STRING(30),
        allowNull: false
      },
      nombre: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      creditos: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3
      },
      nivel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
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

    await queryInterface.addIndex('materias', ['carrera_id']);
    await queryInterface.addIndex('materias', ['codigo']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('materias');
  }
};
