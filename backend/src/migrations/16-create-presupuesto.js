'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('presupuestos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      categoria: {
        type: Sequelize.ENUM('becas', 'administrativo', 'operativo', 'otros'),
        allowNull: false,
        defaultValue: 'becas'
      },
      monto_asignado: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      monto_ejecutado: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      anio: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      mes: {
        type: Sequelize.INTEGER,
        allowNull: false
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

    await queryInterface.addIndex('presupuestos', ['categoria']);
    await queryInterface.addIndex('presupuestos', ['anio', 'mes']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('presupuestos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_presupuestos_categoria";');
  }
};
