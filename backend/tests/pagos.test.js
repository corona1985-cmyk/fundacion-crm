const request = require('supertest');
const app = require('../src/app');
const { sequelize, Persona, Usuario, Universidad, Carrera, Becario, Pago } = require('../src/models');

describe('Module 4: University Payments Endpoints API Tests', () => {
  let financieroToken;
  let adminToken;
  let becarioId;
  let createdPagoId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });

    // Seed Financiero User
    const finPersona = await Persona.create({
      nombre: 'Rosa',
      apellido: 'Financiera',
      cedula: '402-1112223-4',
      email: 'rosa.fin@example.com'
    });

    await Usuario.create({
      persona_id: finPersona.id,
      username: 'rosafin',
      password_hash: 'Financiero123!',
      rol: 'FINANCIERO',
      activo: true
    });

    const loginFin = await request(app)
      .post('/auth/login')
      .send({ username: 'rosafin', password: 'Financiero123!' });
    financieroToken = loginFin.body.data.token;

    // Seed Admin User
    const adminPersona = await Persona.create({
      nombre: 'Admin',
      apellido: 'Principal',
      cedula: '402-0000000-0',
      email: 'admin.fin@example.com'
    });

    await Usuario.create({
      persona_id: adminPersona.id,
      username: 'adminfin',
      password_hash: 'Admin123!',
      rol: 'ADMINISTRADOR',
      activo: true
    });

    const loginAdmin = await request(app)
      .post('/auth/login')
      .send({ username: 'adminfin', password: 'Admin123!' });
    adminToken = loginAdmin.body.data.token;

    // Seed Student setup
    const uni = await Universidad.create({ nombre: 'PUCMM Test', direccion: 'Santiago' });
    const carrera = await Carrera.create({ universidad_id: uni.id, nombre: 'Medicina' });

    const becarioPersona = await Persona.create({
      nombre: 'Ana',
      apellido: 'Gómez',
      cedula: '402-8888888-8',
      email: 'ana.gomez@example.com'
    });

    const becario = await Becario.create({
      persona_id: becarioPersona.id,
      universidad_id: uni.id,
      carrera_id: carrera.id,
      estado_beca: 'ACTIVA'
    });
    becarioId = becario.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /pagos', () => {
    it('should register a new university payment for a student', async () => {
      const res = await request(app)
        .post('/pagos')
        .set('Authorization', `Bearer ${financieroToken}`)
        .send({
          becario_id: becarioId,
          concepto: 'matricula',
          monto: 18000.00,
          fecha_vencimiento: '2026-03-15',
          observaciones: 'Pago matricula primer trimestre 2026'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.becario_id).toEqual(becarioId);

      createdPagoId = res.body.data.id;
    });

    it('should allow registering or auto-marking overdue payment when past due date', async () => {
      const res = await request(app)
        .post('/pagos')
        .set('Authorization', `Bearer ${financieroToken}`)
        .send({
          becario_id: becarioId,
          concepto: 'mensualidad',
          monto: 9000.00,
          fecha_vencimiento: '2026-01-01',
          estado: 'atrasado',
          observaciones: 'Pago vencido de prueba'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.estado).toEqual('atrasado');
    });
  });

  describe('GET /pagos', () => {
    it('should list payments with pagination and filters', async () => {
      const res = await request(app)
        .get(`/pagos?becario_id=${becarioId}`)
        .set('Authorization', `Bearer ${financieroToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pagos.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /pagos/vencidos', () => {
    it('should list overdue payments with delay days calculated', async () => {
      const res = await request(app)
        .get('/pagos/vencidos')
        .set('Authorization', `Bearer ${financieroToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty('dias_atraso');
    });
  });

  describe('POST /pagos/:id/marcar-pagado', () => {
    it('should mark a payment as paid and set fecha_pago', async () => {
      const res = await request(app)
        .post(`/pagos/${createdPagoId}/marcar-pagado`)
        .set('Authorization', `Bearer ${financieroToken}`)
        .send({
          fecha_pago: '2026-02-01',
          comprobante: 'REC-12345.pdf'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toEqual('pagado');
      expect(res.body.data.fecha_pago).toBeDefined();
    });

    it('should reject re-marking an already paid payment', async () => {
      const res = await request(app)
        .post(`/pagos/${createdPagoId}/marcar-pagado`)
        .set('Authorization', `Bearer ${financieroToken}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /pagos/:id', () => {
    it('should allow admin to delete payment record', async () => {
      const tempPago = await Pago.create({
        becario_id: becarioId,
        concepto: 'otro',
        monto: 5000.00,
        fecha_vencimiento: '2026-04-01',
        estado: 'pendiente'
      });

      const res = await request(app)
        .delete(`/pagos/${tempPago.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });
});
