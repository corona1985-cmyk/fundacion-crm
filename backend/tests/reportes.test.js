const request = require('supertest');
const app = require('../src/app');
const { sequelize, Persona, Usuario, Padrino, Aporte, Universidad, Carrera, Becario, Pago } = require('../src/models');

describe('Module 4: Financial Statement & Reporting Endpoints API Tests', () => {
  let financieroToken;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });

    // Seed User
    const finPersona = await Persona.create({
      nombre: 'Elena',
      apellido: 'Tesorera',
      cedula: '402-4444444-4',
      email: 'elena.tes@example.com'
    });

    await Usuario.create({
      persona_id: finPersona.id,
      username: 'elenates',
      password_hash: 'Tesorera123!',
      rol: 'FINANCIERO',
      activo: true
    });

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username: 'elenates', password: 'Tesorera123!' });
    financieroToken = loginRes.body.data.token;

    // Seed Sponsor Income
    const padrinoPersona = await Persona.create({
      nombre: 'Carlos',
      apellido: 'Donante',
      cedula: '031-7777777-7',
      email: 'carlos.donante@example.com'
    });

    const padrino = await Padrino.create({
      persona_id: padrinoPersona.id,
      tipo: 'natural',
      monto_compromiso: 25000.00,
      activo: true
    });

    await Aporte.create({
      padrino_id: padrino.id,
      monto: 25000.00,
      fecha_recepcion: '2026-01-15',
      medio_pago: 'transferencia'
    });

    // Seed Student Expense
    const uni = await Universidad.create({ nombre: 'UASD Test', direccion: 'Santiago' });
    const carrera = await Carrera.create({ universidad_id: uni.id, nombre: 'Contabilidad' });
    const becarioPersona = await Persona.create({
      nombre: 'David',
      apellido: 'Sanchez',
      cedula: '402-7777777-7',
      email: 'david.sanchez@example.com'
    });
    const becario = await Becario.create({
      persona_id: becarioPersona.id,
      universidad_id: uni.id,
      carrera_id: carrera.id,
      estado_beca: 'ACTIVA'
    });

    await Pago.create({
      becario_id: becario.id,
      concepto: 'mensualidad',
      monto: 10000.00,
      fecha_vencimiento: '2026-01-10',
      fecha_pago: '2026-01-09',
      estado: 'pagado'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /reportes/financiero/resumen', () => {
    it('should return financial summary statement (Income vs Expenses vs Balance)', async () => {
      const res = await request(app)
        .get('/reportes/financiero/resumen')
        .set('Authorization', `Bearer ${financieroToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total_ingresos).toEqual(25000.00);
      expect(res.body.data.total_egresos_becas).toEqual(10000.00);
      expect(res.body.data.saldo_neto).toEqual(15000.00);
    });
  });

  describe('GET /reportes/financiero/cuentas-cobrar', () => {
    it('should return accounts receivable report from active sponsors', async () => {
      const res = await request(app)
        .get('/reportes/financiero/cuentas-cobrar')
        .set('Authorization', `Bearer ${financieroToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toEqual(1);
    });
  });

  describe('GET /reportes/financiero/cuentas-pagar', () => {
    it('should return accounts payable report for pending university payments', async () => {
      const res = await request(app)
        .get('/reportes/financiero/cuentas-pagar')
        .set('Authorization', `Bearer ${financieroToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total_pendiente');
    });
  });

  describe('GET /reportes/financiero/evolucion', () => {
    it('should return financial evolution statement', async () => {
      const res = await request(app)
        .get('/reportes/financiero/evolucion')
        .set('Authorization', `Bearer ${financieroToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('resumen_general');
    });
  });
});
