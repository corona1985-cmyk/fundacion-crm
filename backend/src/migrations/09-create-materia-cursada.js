'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('materias_cursadas', {
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
      materia_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'materias',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      ciclo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ciclos_academicos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      calificacion: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      estado: {
        type: Sequelize.ENUM('EN_CURSO', 'APROBADA', 'REPROBADA', 'RETIRADA'),
        allowNull: false,
        defaultValue: 'EN_CURSO'
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

    await queryInterface.addIndex('materias_cursadas', ['becario_id']);
    await queryInterface.addIndex('materias_cursadas', ['materia_id']);
    await queryInterface.addIndex('materias_cursadas', ['ciclo_id']);
    await queryInterface.addIndex('materias_cursadas', ['estado']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('materias_cursadas');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_materias_cursadas_estado";');
  }
};
