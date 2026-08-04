'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('aportes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      padrino_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'padrinos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      institucion_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'instituciones_publicas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      monto: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      fecha_recepcion: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_DATE')
      },
      medio_pago: {
        type: Sequelize.ENUM('transferencia', 'cheque', 'efectivo'),
        allowNull: false,
        defaultValue: 'transferencia'
      },
      referencia: {
        type: Sequelize.STRING(100),
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

    await queryInterface.addIndex('aportes', ['padrino_id']);
    await queryInterface.addIndex('aportes', ['institucion_id']);
    await queryInterface.addIndex('aportes', ['fecha_recepcion']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('aportes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_aportes_medio_pago";');
  }
};
