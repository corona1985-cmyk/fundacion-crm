const request = require('supertest');
const app = require('../src/app');
const { sequelize, Persona, Usuario, InstitucionPublica } = require('../src/models');

describe('Module 3: Public Institutions Endpoints API Tests', () => {
  let financieroToken;
  let createdInstId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });

    const finPersona = await Persona.create({
      nombre: 'Pedro',
      apellido: 'Finanzas',
      cedula: '402-5555555-9',
      email: 'pedro.fin@example.com'
    });

    await Usuario.create({
      persona_id: finPersona.id,
      username: 'pedrofin',
      password_hash: 'Financiero123!',
      rol: 'FINANCIERO',
      activo: true
    });

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username: 'pedrofin', password: 'Financiero123!' });
    financieroToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST & GET /instituciones', () => {
    it('should register a new public institution', async () => {
      const res = await request(app)
        .post('/instituciones')
        .set('Authorization', `Bearer ${financieroToken}`)
        .send({
          nombre: 'Fondo de Desarrollo Provincial',
          contacto: 'Lic. Maria Perez',
          telefono: '809-582-0000',
          email: 'contacto@fondoprovincial.gob.do'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toContain('Fondo de Desarrollo');

      createdInstId = res.body.data.id;
    });

    it('should list all public institutions', async () => {
      const res = await request(app)
        .get('/instituciones')
        .set('Authorization', `Bearer ${financieroToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toEqual(1);
    });
  });

  describe('POST /instituciones/:id/aportes', () => {
    it('should register a financial contribution from a public institution', async () => {
      const res = await request(app)
        .post(`/instituciones/${createdInstId}/aportes`)
        .set('Authorization', `Bearer ${financieroToken}`)
        .send({
          monto: 150000.00,
          fecha_recepcion: '2026-02-05',
          medio_pago: 'transferencia',
          referencia: 'GOB-TRF-998877',
          observaciones: 'Subsidio institucional para becas'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(parseFloat(res.body.data.monto)).toEqual(150000.00);
    });
  });
});
