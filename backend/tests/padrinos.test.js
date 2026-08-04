const request = require('supertest');
const app = require('../src/app');
const { sequelize, Persona, Usuario, Padrino, Aporte } = require('../src/models');

describe('Module 3: Padrinos & Contributions Endpoints API Tests', () => {
  let financieroToken;
  let createdPadrinoId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });

    // Seed Financiero User
    const finPersona = await Persona.create({
      nombre: 'Luis',
      apellido: 'Financiero',
      cedula: '402-6666666-6',
      email: 'luis.fin@example.com'
    });

    await Usuario.create({
      persona_id: finPersona.id,
      username: 'luisfin',
      password_hash: 'Financiero123!',
      rol: 'FINANCIERO',
      activo: true
    });

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username: 'luisfin', password: 'Financiero123!' });
    financieroToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /padrinos', () => {
    it('should register a new natural sponsor', async () => {
      const res = await request(app)
        .post('/padrinos')
        .set('Authorization', `Bearer ${financieroToken}`)
        .send({
          nombre: 'Elena',
          apellido: 'Morales',
          cedula: '031-1111111-1',
          email: 'elena.morales@example.com',
          telefono: '809-555-3333',
          tipo: 'natural',
          monto_compromiso: 20000.00,
          frecuencia: 'mensual',
          forma_pago: 'transferencia'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.persona.nombre).toEqual('Elena');

      createdPadrinoId = res.body.data.id;
    });

    it('should register a new corporate sponsor (jurídica)', async () => {
      const res = await request(app)
        .post('/padrinos')
        .set('Authorization', `Bearer ${financieroToken}`)
        .send({
          nombre: 'Representante',
          apellido: 'Corporativo',
          cedula: '031-2222222-2',
          email: 'corp@empresa.com',
          tipo: 'juridica',
          razon_social: 'Banco Cibao S.A.',
          monto_compromiso: 100000.00,
          frecuencia: 'anual',
          forma_pago: 'transferencia'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.razon_social).toEqual('Banco Cibao S.A.');
    });
  });

  describe('GET /padrinos', () => {
    it('should list sponsors with pagination and filters', async () => {
      const res = await request(app)
        .get('/padrinos?page=1&limit=10&tipo=natural')
        .set('Authorization', `Bearer ${financieroToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.padrinos.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST & GET /padrinos/:id/aportes', () => {
    it('should register a financial contribution for a sponsor', async () => {
      const res = await request(app)
        .post(`/padrinos/${createdPadrinoId}/aportes`)
        .set('Authorization', `Bearer ${financieroToken}`)
        .send({
          monto: 20000.00,
          fecha_recepcion: '2026-02-01',
          medio_pago: 'transferencia',
          referencia: 'TRF-00112233',
          observaciones: 'Pago mensual febrero 2026'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(parseFloat(res.body.data.monto)).toEqual(20000.00);
    });

    it('should list contribution history of a sponsor', async () => {
      const res = await request(app)
        .get(`/padrinos/${createdPadrinoId}/aportes`)
        .set('Authorization', `Bearer ${financieroToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toEqual(1);
    });
  });

  describe('GET /padrinos/:id', () => {
    it('should return sponsor detail with total contributed amount', async () => {
      const res = await request(app)
        .get(`/padrinos/${createdPadrinoId}`)
        .set('Authorization', `Bearer ${financieroToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.persona.nombre).toEqual('Elena');
      expect(parseFloat(res.body.data.total_aportado)).toEqual(20000.00);
    });
  });

  describe('DELETE /padrinos/:id', () => {
    it('should soft delete sponsor by setting activo to false', async () => {
      const res = await request(app)
        .delete(`/padrinos/${createdPadrinoId}`)
        .set('Authorization', `Bearer ${financieroToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      const checkRes = await request(app)
        .get(`/padrinos/${createdPadrinoId}`)
        .set('Authorization', `Bearer ${financieroToken}`);

      expect(checkRes.body.data.activo).toBe(false);
    });
  });
});
