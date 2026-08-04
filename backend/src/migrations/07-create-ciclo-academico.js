'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ciclos_academicos', {
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
        type: Sequelize.STRING(50),
        allowNull: false
      },
      fecha_inicio: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      fecha_fin: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      fecha_limite_pago: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      ciclo_actual: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    await queryInterface.addIndex('ciclos_academicos', ['universidad_id']);
    await queryInterface.addIndex('ciclos_academicos', ['ciclo_actual']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ciclos_academicos');
  }
};
