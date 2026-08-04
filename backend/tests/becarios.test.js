const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');
const { sequelize, Persona, Usuario, Universidad, Carrera, Materia, CicloAcademico } = require('../src/models');

describe('Module 2: Becarios & Documents Endpoints API Tests', () => {
  let coordToken;
  let uniId;
  let carreraId;
  let materiaId;
  let cicloId;
  let createdBecarioId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });

    // Seed Coordinator User
    const coordPersona = await Persona.create({
      nombre: 'Ana',
      apellido: 'Coordinadora',
      cedula: '402-7777777-7',
      email: 'ana.coord@example.com'
    });

    await Usuario.create({
      persona_id: coordPersona.id,
      username: 'anacoord',
      password_hash: 'Coord123!',
      rol: 'COORDINADOR',
      activo: true
    });

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username: 'anacoord', password: 'Coord123!' });
    coordToken = loginRes.body.data.token;

    // Seed Academic setup
    const uni = await Universidad.create({
      nombre: 'PUCMM Test',
      direccion: 'Santiago',
      telefono: '809-580-1962'
    });
    uniId = uni.id;

    const carrera = await Carrera.create({
      universidad_id: uniId,
      nombre: 'Ingeniería en Sistemas',
      duracion_ciclos: 12
    });
    carreraId = carrera.id;

    const materia = await Materia.create({
      carrera_id: carreraId,
      codigo: 'ISC-101',
      nombre: 'Programación I',
      creditos: 4,
      nivel: 1
    });
    materiaId = materia.id;

    const ciclo = await CicloAcademico.create({
      universidad_id: uniId,
      nombre: '2026-1',
      fecha_inicio: '2026-01-10',
      fecha_fin: '2026-04-25',
      ciclo_actual: true
    });
    cicloId = ciclo.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /becarios', () => {
    it('should allow coordinator to register a new becario', async () => {
      const res = await request(app)
        .post('/becarios')
        .set('Authorization', `Bearer ${coordToken}`)
        .send({
          nombre: 'Carlos',
          apellido: 'Rodriguez',
          cedula: '402-5555555-5',
          email: 'carlos.rodriguez@example.com',
          telefono: '809-555-4444',
          direccion: 'Santiago de los Caballeros',
          universidad_id: uniId,
          carrera_id: carreraId,
          centro_origen: 'Liceo Ulises Francisco Espaillat',
          estado_beca: 'ACTIVA',
          ciclo_actual: 1
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.persona.nombre).toEqual('Carlos');

      createdBecarioId = res.body.data.id;
    });

    it('should reject registration if cedula is duplicate', async () => {
      const res = await request(app)
        .post('/becarios')
        .set('Authorization', `Bearer ${coordToken}`)
        .send({
          nombre: 'Carlos Duplicate',
          apellido: 'Rodriguez',
          cedula: '402-5555555-5',
          email: 'carlos.new@example.com',
          universidad_id: uniId,
          carrera_id: carreraId
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /becarios', () => {
    it('should list becarios with pagination and filters', async () => {
      const res = await request(app)
        .get('/becarios?page=1&limit=10&estado_beca=ACTIVA')
        .set('Authorization', `Bearer ${coordToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.becarios.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /becarios/:id', () => {
    it('should return complete becario file', async () => {
      const res = await request(app)
        .get(`/becarios/${createdBecarioId}`)
        .set('Authorization', `Bearer ${coordToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.persona.nombre).toEqual('Carlos');
      expect(res.body.data.universidad.nombre).toEqual('PUCMM Test');
    });
  });

  describe('PUT /becarios/:id', () => {
    it('should update becario information', async () => {
      const res = await request(app)
        .put(`/becarios/${createdBecarioId}`)
        .set('Authorization', `Bearer ${coordToken}`)
        .send({
          telefono: '809-555-0000',
          ciclo_actual: 2
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ciclo_actual).toEqual(2);
      expect(res.body.data.persona.telefono).toEqual('809-555-0000');
    });
  });

  describe('POST & PUT /becarios/:id/materias', () => {
    it('should enroll becario in courses for a cycle', async () => {
      const res = await request(app)
        .post(`/becarios/${createdBecarioId}/materias`)
        .set('Authorization', `Bearer ${coordToken}`)
        .send({
          ciclo_id: cicloId,
          materia_ids: [materiaId]
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toEqual(1);
    });

    it('should update grade for enrolled course and recalculate cumulative GPA', async () => {
      const res = await request(app)
        .put(`/becarios/${createdBecarioId}/materias/${materiaId}`)
        .set('Authorization', `Bearer ${coordToken}`)
        .send({
          calificacion: 92.5,
          estado: 'APROBADA'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(parseFloat(res.body.data.promedio_general)).toEqual(92.5);
    });
  });

  describe('POST /upload & GET & DELETE /documentos', () => {
    let dummyFilePath;
    let createdDocId;

    beforeAll(() => {
      dummyFilePath = path.join(__dirname, 'dummy.pdf');
      fs.writeFileSync(dummyFilePath, 'dummy pdf content for testing');
    });

    afterAll(() => {
      if (fs.existsSync(dummyFilePath)) {
        fs.unlinkSync(dummyFilePath);
      }
    });

    it('should upload a document for a becario', async () => {
      const res = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${coordToken}`)
        .field('becario_id', createdBecarioId)
        .field('tipo_documento', 'CEDULA')
        .attach('archivo', dummyFilePath);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.tipo_documento).toEqual('CEDULA');

      createdDocId = res.body.data.id;
    });

    it('should list documents for a becario', async () => {
      const res = await request(app)
        .get(`/becarios/${createdBecarioId}/documentos`)
        .set('Authorization', `Bearer ${coordToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toEqual(1);
    });

    it('should delete a document and its file from disk', async () => {
      const res = await request(app)
        .delete(`/documentos/${createdDocId}`)
        .set('Authorization', `Bearer ${coordToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /becarios/:id', () => {
    it('should soft delete becario by setting estado_beca to CANCELADA', async () => {
      const res = await request(app)
        .delete(`/becarios/${createdBecarioId}`)
        .set('Authorization', `Bearer ${coordToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      const checkRes = await request(app)
        .get(`/becarios/${createdBecarioId}`)
        .set('Authorization', `Bearer ${coordToken}`);

      expect(checkRes.body.data.estado_beca).toEqual('CANCELADA');
    });
  });
});
