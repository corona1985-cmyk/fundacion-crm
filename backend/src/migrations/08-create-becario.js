'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('becarios', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      persona_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'personas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      carrera_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'carreras',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      centro_origen: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      fecha_seleccion: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_DATE')
      },
      estado_beca: {
        type: Sequelize.ENUM('ACTIVA', 'SUSPENDIDA', 'CANCELADA', 'FINALIZADA'),
        allowNull: false,
        defaultValue: 'ACTIVA'
      },
      ciclo_actual: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      promedio_general: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 0.00
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

    await queryInterface.addIndex('becarios', ['persona_id'], { unique: true });
    await queryInterface.addIndex('becarios', ['universidad_id']);
    await queryInterface.addIndex('becarios', ['carrera_id']);
    await queryInterface.addIndex('becarios', ['estado_beca']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('becarios');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_becarios_estado_beca";');
  }
};
