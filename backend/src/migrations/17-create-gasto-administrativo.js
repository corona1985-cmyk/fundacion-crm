'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('gastos_administrativos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      categoria: {
        type: Sequelize.ENUM('becas', 'administrativo', 'operativo', 'otros'),
        allowNull: false,
        defaultValue: 'administrativo'
      },
      descripcion: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_DATE')
      },
      comprobante: {
        type: Sequelize.STRING(255),
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

    await queryInterface.addIndex('gastos_administrativos', ['categoria']);
    await queryInterface.addIndex('gastos_administrativos', ['fecha']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('gastos_administrativos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_gastos_administrativos_categoria";');
  }
};
