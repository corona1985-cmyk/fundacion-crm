const request = require('supertest');
const app = require('../src/app');
const { sequelize, Persona, Usuario } = require('../src/models');

describe('Module 4: Budget Allocation & Execution Endpoints API Tests', () => {
  let financieroToken;
  let createdPresupuestoId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });

    const finPersona = await Persona.create({
      nombre: 'Mario',
      apellido: 'Contable',
      cedula: '402-3333333-3',
      email: 'mario.contable@example.com'
    });

    await Usuario.create({
      persona_id: finPersona.id,
      username: 'mariocontable',
      password_hash: 'Financiero123!',
      rol: 'FINANCIERO',
      activo: true
    });

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username: 'mariocontable', password: 'Financiero123!' });
    financieroToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST & GET /presupuesto', () => {
    it('should assign a new monthly budget allocation', async () => {
      const res = await request(app)
        .post('/presupuesto')
        .set('Authorization', `Bearer ${financieroToken}`)
        .send({
          categoria: 'becas',
          monto_asignado: 500000.00,
          anio: 2026,
          mes: 2,
          observaciones: 'Presupuesto becas febrero 2026'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(parseFloat(res.body.data.monto_asignado)).toEqual(500000.00);

      createdPresupuestoId = res.body.data.id;
    });

    it('should list budget allocations filtered by year', async () => {
      const res = await request(app)
        .get('/presupuesto?anio=2026')
        .set('Authorization', `Bearer ${financieroToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toEqual(1);
    });
  });

  describe('PUT /presupuesto/:id', () => {
    it('should update allocated budget amounts', async () => {
      const res = await request(app)
        .put(`/presupuesto/${createdPresupuestoId}`)
        .set('Authorization', `Bearer ${financieroToken}`)
        .send({
          monto_asignado: 550000.00
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(parseFloat(res.body.data.monto_asignado)).toEqual(550000.00);
    });
  });

  describe('GET /presupuesto/ejecucion', () => {
    it('should calculate budget execution comparison report', async () => {
      const res = await request(app)
        .get('/presupuesto/ejecucion?anio=2026')
        .set('Authorization', `Bearer ${financieroToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0]).toHaveProperty('porcentaje_ejecucion');
    });
  });
});
