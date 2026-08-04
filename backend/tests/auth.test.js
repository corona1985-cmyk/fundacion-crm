const request = require('supertest');
const app = require('../src/app');
const { sequelize, Persona, Usuario, Auditoria } = require('../src/models');

describe('Module 1: Auth Endpoints API Tests', () => {
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });

    // Seed initial admin for testing
    const persona = await Persona.create({
      nombre: 'Admin',
      apellido: 'Test',
      cedula: '402-0000000-1',
      email: 'admin.test@example.com'
    });

    adminUser = await Usuario.create({
      persona_id: persona.id,
      username: 'admin_tester',
      password_hash: 'Admin123!',
      rol: 'ADMINISTRADOR',
      activo: true
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /auth/login', () => {
    it('should authenticate admin user and return JWT token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          username: 'admin_tester',
          password: 'Admin123!'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.username).toEqual('admin_tester');

      adminToken = res.body.data.token;
    });

    it('should reject invalid password with 401', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          username: 'admin_tester',
          password: 'WrongPassword123!'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toEqual('INVALID_CREDENTIALS');
    });

    it('should reject non-existent user with 401', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          username: 'non_existent_user',
          password: 'Password123!'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/register', () => {
    it('should allow admin to register a new user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Juan',
          apellido: 'Perez',
          cedula: '001-1234567-8',
          email: 'juan.perez@example.com',
          username: 'juanperez',
          password: 'Password123!',
          rol: 'COORDINADOR'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toEqual('juanperez');
      expect(res.body.data.persona.nombre).toEqual('Juan');
    });

    it('should reject password that does not meet complexity requirements', async () => {
      const res = await request(app)
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Pedro',
          apellido: 'Gomez',
          cedula: '001-9999999-9',
          email: 'pedro@example.com',
          username: 'pedrog',
          password: 'weakpassword', // missing upper, number, symbol
          rol: 'CONSULTA'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toEqual('VALIDATION_ERROR');
    });

    it('should reject duplicate email or cedula', async () => {
      const res = await request(app)
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Juan Duplicate',
          apellido: 'Perez',
          cedula: '001-1234567-8', // Duplicate cedula
          email: 'juan.different@example.com',
          username: 'juandup',
          password: 'Password123!',
          rol: 'COORDINADOR'
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /auth/me', () => {
    it('should return profile for authenticated user', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toEqual('admin_tester');
    });

    it('should deny access when token is missing', async () => {
      const res = await request(app).get('/auth/me');

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /auth/me', () => {
    it('should allow user to update profile details', async () => {
      const res = await request(app)
        .put('/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          telefono: '809-555-9999',
          direccion: 'Nueva Dirección Actualizada'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.persona.telefono).toEqual('809-555-9999');
    });
  });

  describe('POST /auth/logout', () => {
    it('should return success logout message', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });
});
