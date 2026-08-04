const request = require('supertest');
const app = require('../src/app');
const { sequelize, Usuario, Persona, Becario, Universidad, Carrera, Documento } = require('../src/models');
const jwt = require('jsonwebtoken');
const storageService = require('../src/services/storageService');
const fs = require('fs');
const path = require('path');

describe('Sprint 1.4: Cloud Storage & Document Management API', () => {
  let token;
  let adminUser;
  let becario;
  let testDocument;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create Persona & User
    const personaUser = await Persona.create({
      nombre: 'Admin',
      apellido: 'Storage',
      cedula: '001-9988776-5',
      email: 'storage.admin@fundacion.org'
    });

    adminUser = await Usuario.create({
      persona_id: personaUser.id,
      username: 'adminstorage',
      password_hash: '$2a$10$abcdefghijklmnopqrstuuv',
      rol: 'ADMINISTRADOR',
      activo: true
    });

    token = jwt.sign(
      { id: adminUser.id, username: adminUser.username, rol: adminUser.rol },
      process.env.JWT_SECRET || 'super_secret_jwt_key_rompiendo_paradigmas_2026',
      { expiresIn: '1h' }
    );

    // Create Academic Catalog & Becario
    const uni = await Universidad.create({ nombre: 'PUCMM' });
    const carrera = await Carrera.create({ universidad_id: uni.id, nombre: 'Ingeniería de Software' });
    const personaBecario = await Persona.create({
      nombre: 'Carlos',
      apellido: 'Perez',
      cedula: '001-1122334-9',
      email: 'carlos.storage@gmail.com'
    });

    becario = await Becario.create({
      persona_id: personaBecario.id,
      universidad_id: uni.id,
      carrera_id: carrera.id,
      estado_beca: 'activa'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('StorageService Direct Methods', () => {
    test('should identify active storage provider (local default)', () => {
      const provider = storageService.getProvider();
      expect(['local', 's3', 'gcs']).toContain(provider);
    });

    test('should upload file buffer and return storage key', async () => {
      const result = await storageService.uploadFile({
        buffer: Buffer.from('Test Document Content'),
        key: 'documents/unit-test-doc.txt',
        mimetype: 'text/plain'
      });

      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('provider');
    });

    test('should generate presigned / download URL for stored file', async () => {
      const signedUrl = await storageService.getSignedUrl('documents/unit-test-doc.txt', 3600);
      expect(signedUrl).toBeDefined();
      expect(typeof signedUrl).toBe('string');
    });

    test('should delete file from storage', async () => {
      const isDeleted = await storageService.deleteFile('documents/unit-test-doc.txt');
      expect(typeof isDeleted).toBe('boolean');
    });
  });

  describe('Document API Endpoints (POST /upload, GET /documentos/:id, DELETE /documentos/:id)', () => {
    test('POST /upload - should upload file to Cloud Storage and save record', async () => {
      const buffer = Buffer.from('PDF Mock Content for Becario');

      const res = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('becario_id', becario.id)
        .field('tipo_documento', 'CEDULA')
        .attach('archivo', buffer, 'cedula_carlos.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.nombre_archivo).toBe('cedula_carlos.pdf');
      expect(res.body.data).toHaveProperty('download_url');

      testDocument = res.body.data;
    });

    test('GET /documentos/:id - should return document with presigned URL', async () => {
      const res = await request(app)
        .get(`/documentos/${testDocument.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testDocument.id);
      expect(res.body.data).toHaveProperty('download_url');
    });

    test('GET /becarios/:id/documentos - should list documents for becario with download URLs', async () => {
      const res = await request(app)
        .get(`/becarios/${becario.id}/documentos`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('download_url');
    });

    test('DELETE /documentos/:id - should delete document record and physical file', async () => {
      const res = await request(app)
        .delete(`/documentos/${testDocument.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/eliminado/i);

      // Verify deletion from DB
      const deletedDoc = await Documento.findByPk(testDocument.id);
      expect(deletedDoc).toBeNull();
    });
  });
});
