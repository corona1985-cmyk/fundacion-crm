'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pagos', {
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
      concepto: {
        type: Sequelize.ENUM('inscripcion', 'mensualidad', 'matricula', 'otro'),
        allowNull: false,
        defaultValue: 'mensualidad'
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      fecha_pago: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      fecha_vencimiento: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'pagado', 'atrasado'),
        allowNull: false,
        defaultValue: 'pendiente'
      },
      comprobante: {
        type: Sequelize.STRING(255),
        allowNull: true
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

    await queryInterface.addIndex('pagos', ['becario_id']);
    await queryInterface.addIndex('pagos', ['estado']);
    await queryInterface.addIndex('pagos', ['fecha_vencimiento']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('pagos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pagos_concepto";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pagos_estado";');
  }
};
