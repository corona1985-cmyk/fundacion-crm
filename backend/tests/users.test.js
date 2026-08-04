const request = require('supertest');
const app = require('../src/app');
const { sequelize, Persona, Usuario, Auditoria } = require('../src/models');

describe('Module 1: User Management & Audit Endpoints API Tests', () => {
  let adminToken;
  let coordinatorToken;
  let adminUserId;
  let targetUserId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });

    // Seed Admin
    const adminPersona = await Persona.create({
      nombre: 'System',
      apellido: 'Admin',
      cedula: '402-1111111-1',
      email: 'sysadmin@example.com'
    });

    const adminUser = await Usuario.create({
      persona_id: adminPersona.id,
      username: 'sysadmin',
      password_hash: 'Admin123!',
      rol: 'ADMINISTRADOR',
      activo: true
    });
    adminUserId = adminUser.id;

    // Seed Target User (Coordinador)
    const targetPersona = await Persona.create({
      nombre: 'Maria',
      apellido: 'Santos',
      cedula: '402-2222222-2',
      email: 'maria.santos@example.com'
    });

    const targetUser = await Usuario.create({
      persona_id: targetPersona.id,
      username: 'msantos',
      password_hash: 'Coord123!',
      rol: 'COORDINADOR',
      activo: true
    });
    targetUserId = targetUser.id;

    // Login Admin to get token
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username: 'sysadmin', password: 'Admin123!' });
    adminToken = loginRes.body.data.token;

    // Login Coordinator to get token
    const coordLoginRes = await request(app)
      .post('/auth/login')
      .send({ username: 'msantos', password: 'Coord123!' });
    coordinatorToken = coordLoginRes.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /users', () => {
    it('should allow admin to list users with pagination', async () => {
      const res = await request(app)
        .get('/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.pagination.total_items).toBeGreaterThanOrEqual(2);
    });

    it('should filter users by role', async () => {
      const res = await request(app)
        .get('/users?rol=COORDINADOR')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toHaveLength(1);
      expect(res.body.data.users[0].username).toEqual('msantos');
    });

    it('should deny non-admin users with 403', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toEqual('FORBIDDEN');
    });
  });

  describe('GET /users/:id', () => {
    it('should return user detail for valid ID', async () => {
      const res = await request(app)
        .get(`/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toEqual('msantos');
      expect(res.body.data.persona.nombre).toEqual('Maria');
    });

    it('should return 404 for non-existent user ID', async () => {
      const res = await request(app)
        .get('/users/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /users/:id', () => {
    it('should update user role and persona info', async () => {
      const res = await request(app)
        .put(`/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rol: 'FINANCIERO',
          telefono: '809-555-7777'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rol).toEqual('FINANCIERO');
      expect(res.body.data.persona.telefono).toEqual('809-555-7777');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should prevent admin from deleting self', async () => {
      const res = await request(app)
        .delete(`/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toEqual('SELF_DELETION_DENIED');
    });

    it('should soft delete user (set activo=false and set deleted_at timestamp)', async () => {
      const res = await request(app)
        .delete(`/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      // Verify soft deleted in DB
      const softDeletedUser = await Usuario.findByPk(targetUserId, { paranoid: false });
      expect(softDeletedUser.activo).toBe(false);
      expect(softDeletedUser.deleted_at).not.toBeNull();
    });
  });

  describe('GET /audit', () => {
    it('should return list of audit trail logs for admin', async () => {
      const res = await request(app)
        .get('/audit')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.audit_logs.length).toBeGreaterThan(0);
    });
  });
});
