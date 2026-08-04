'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('padrinos', {
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
      tipo: {
        type: Sequelize.ENUM('natural', 'juridica'),
        allowNull: false,
        defaultValue: 'natural'
      },
      razon_social: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      monto_compromiso: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      frecuencia: {
        type: Sequelize.ENUM('mensual', 'trimestral', 'anual', 'unico'),
        allowNull: false,
        defaultValue: 'mensual'
      },
      forma_pago: {
        type: Sequelize.ENUM('transferencia', 'cheque', 'efectivo'),
        allowNull: false,
        defaultValue: 'transferencia'
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    await queryInterface.addIndex('padrinos', ['persona_id'], { unique: true });
    await queryInterface.addIndex('padrinos', ['tipo']);
    await queryInterface.addIndex('padrinos', ['activo']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('padrinos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_padrinos_tipo";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_padrinos_frecuencia";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_padrinos_forma_pago";');
  }
};
