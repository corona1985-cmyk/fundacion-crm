const { Documento, Becario } = require('../models');
const path = require('path');
const AuditService = require('../services/auditService');
const storageService = require('../services/storageService');

/**
 * Controller for Document Upload and Management with Cloud Storage & Presigned URLs
 */
class DocumentoController {
  /**
   * Helper to format document response with presigned/download URL
   */
  static async formatDocumentResponse(documento) {
    const docJson = documento.toJSON ? documento.toJSON() : documento;
    const download_url = await storageService.getSignedUrl(docJson.ruta_archivo);
    return {
      ...docJson,
      download_url
    };
  }

  /**
   * POST /upload
   * Upload file to Cloud Storage (S3 / GCS / Local) and attach to a becario
   */
  static async upload(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'FILE_MISSING', message: 'No se ha adjuntado ningún archivo.' }
        });
      }

      const { becario_id, tipo_documento, fecha_vencimiento } = req.body;

      if (!becario_id) {
        return res.status(400).json({
          success: false,
          error: { code: 'BECARIO_ID_REQUIRED', message: 'El campo becario_id es obligatorio.' }
        });
      }

      const becario = await Becario.findByPk(becario_id);
      if (!becario) {
        return res.status(404).json({
          success: false,
          error: { code: 'BECARIO_NOT_FOUND', message: 'Becario no encontrado.' }
        });
      }

      // Generate storage key
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname);
      const storageKey = `documents/becario-${becario_id}-${uniqueSuffix}${ext}`;

      // Upload file to active storage provider
      const uploadResult = await storageService.uploadFile({
        buffer: req.file.buffer,
        key: storageKey,
        mimetype: req.file.mimetype
      });

      const documento = await Documento.create({
        becario_id,
        tipo_documento: tipo_documento || 'OTRO',
        nombre_archivo: req.file.originalname,
        ruta_archivo: uploadResult.key,
        fecha_subida: new Date(),
        fecha_vencimiento: fecha_vencimiento || null
      });

      await AuditService.logCreate({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Documento',
        entidadId: documento.id,
        datosNuevos: documento.toJSON(),
        req
      });

      const formattedData = await DocumentoController.formatDocumentResponse(documento);

      return res.status(201).json({
        success: true,
        message: 'Documento subido y registrado exitosamente',
        data: formattedData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /documentos/:id
   * Get document metadata with presigned download URL
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const documento = await Documento.findByPk(id, {
        include: [{ model: Becario, as: 'becario' }]
      });

      if (!documento) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCUMENTO_NOT_FOUND', message: 'Documento no encontrado.' }
        });
      }

      const formattedData = await DocumentoController.formatDocumentResponse(documento);

      return res.status(200).json({
        success: true,
        data: formattedData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /documentos/:id
   * Remove document record and delete file from S3 / GCS / Local storage
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const documento = await Documento.findByPk(id);
      if (!documento) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCUMENTO_NOT_FOUND', message: 'Documento no encontrado.' }
        });
      }

      const previousData = documento.toJSON();

      // Delete file from cloud bucket or local disk
      await storageService.deleteFile(documento.ruta_archivo);

      await documento.destroy();

      await AuditService.logDelete({
        usuarioId: req.user ? req.user.id : null,
        entidad: 'Documento',
        entidadId: id,
        datosPrevios: previousData,
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Documento eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /becarios/:id/documentos
   * List all attached documents for a specific scholarship recipient with presigned download URLs
   */
  static async listByBecario(req, res, next) {
    try {
      const { id } = req.params;

      const documentos = await Documento.findAll({
        where: { becario_id: id },
        order: [['fecha_subida', 'DESC']]
      });

      const formattedDocs = await Promise.all(
        documentos.map(doc => DocumentoController.formatDocumentResponse(doc))
      );

      return res.status(200).json({
        success: true,
        data: formattedDocs
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DocumentoController;
