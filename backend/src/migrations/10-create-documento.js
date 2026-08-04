'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('documentos', {
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
      tipo_documento: {
        type: Sequelize.ENUM('CEDULA', 'ACTA_NACIMIENTO', 'RECORD_NOTAS', 'CERTIFICADO_ESTUDIOS', 'OTRO'),
        allowNull: false,
        defaultValue: 'OTRO'
      },
      nombre_archivo: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      ruta_archivo: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      fecha_subida: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      fecha_vencimiento: {
        type: Sequelize.DATEONLY,
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

    await queryInterface.addIndex('documentos', ['becario_id']);
    await queryInterface.addIndex('documentos', ['tipo_documento']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('documentos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_documentos_tipo_documento";');
  }
};
