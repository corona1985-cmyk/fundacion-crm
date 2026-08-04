const { DataTypes } = require('sequelize');

/**
 * Documento model definition (Scholarship student attached files & certificates)
 */
module.exports = (sequelize) => {
  const Documento = sequelize.define('Documento', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    becario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'becarios',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    tipo_documento: {
      type: DataTypes.ENUM('CEDULA', 'ACTA_NACIMIENTO', 'RECORD_NOTAS', 'CERTIFICADO_ESTUDIOS', 'OTRO'),
      allowNull: false,
      defaultValue: 'OTRO'
    },
    nombre_archivo: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ruta_archivo: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    fecha_subida: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  }, {
    tableName: 'documentos',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['becario_id']
      },
      {
        fields: ['tipo_documento']
      }
    ]
  });

  return Documento;
};
