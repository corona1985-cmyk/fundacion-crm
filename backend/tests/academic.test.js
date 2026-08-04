const request = require('supertest');
const app = require('../src/app');
const { sequelize, Persona, Usuario } = require('../src/models');

describe('Module 2: Academic Catalog Endpoints API Tests', () => {
  let adminToken;
  let createdUniId;
  let createdCarreraId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });

    const persona = await Persona.create({
      nombre: 'Admin',
      apellido: 'Academic',
      cedula: '402-8888888-8',
      email: 'admin.academic@example.com'
    });

    const adminUser = await Usuario.create({
      persona_id: persona.id,
      username: 'academic_admin',
      password_hash: 'Admin123!',
      rol: 'ADMINISTRADOR',
      activo: true
    });

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username: 'academic_admin', password: 'Admin123!' });
    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST & GET /universidades', () => {
    it('should create a new university catalog entry', async () => {
      const res = await request(app)
        .post('/universidades')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Universidad Católica Tecnológica del Cibao (UCATECI)',
          direccion: 'La Vega, Rep. Dom.',
          telefono: '809-573-2144',
          email_contacto: 'info@ucateci.edu.do'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.nombre).toContain('UCATECI');

      createdUniId = res.body.data.id;
    });

    it('should list all universities', async () => {
      const res = await request(app)
        .get('/universidades')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST & GET /carreras', () => {
    it('should create a new degree program for a university', async () => {
      const res = await request(app)
        .post('/carreras')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          universidad_id: createdUniId,
          nombre: 'Ingeniería Civil',
          duracion_ciclos: 12
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toEqual('Ingeniería Civil');

      createdCarreraId = res.body.data.id;
    });

    it('should list degree programs filtered by university', async () => {
      const res = await request(app)
        .get(`/carreras?universidad_id=${createdUniId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toEqual(1);
    });
  });

  describe('POST & GET /carreras/:id/materias', () => {
    it('should add a subject to a career curriculum', async () => {
      const res = await request(app)
        .post(`/carreras/${createdCarreraId}/materias`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          codigo: 'CIV-101',
          nombre: 'Introducción a la Ingeniería Civil',
          creditos: 3,
          nivel: 1
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.codigo).toEqual('CIV-101');
    });

    it('should list subjects belonging to a career', async () => {
      const res = await request(app)
        .get(`/carreras/${createdCarreraId}/materias`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toEqual(1);
    });
  });

  describe('POST & GET & PUT /ciclos', () => {
    it('should create an academic term cycle', async () => {
      const res = await request(app)
        .post('/ciclos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          universidad_id: createdUniId,
          nombre: '2026-1',
          fecha_inicio: '2026-01-15',
          fecha_fin: '2026-04-30',
          ciclo_actual: true
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ciclo_actual).toBe(true);
    });

    it('should list academic cycles', async () => {
      const res = await request(app)
        .get(`/ciclos?universidad_id=${createdUniId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toEqual(1);
    });
  });
});
