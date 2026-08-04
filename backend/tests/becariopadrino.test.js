const request = require('supertest');
const app = require('../src/app');
const { sequelize, Persona, Usuario, Universidad, Carrera, Becario, Padrino, BecarioPadrino } = require('../src/models');

describe('Module 3: Student-Sponsor Assignment Endpoints API Tests', () => {
  let coordToken;
  let becarioId;
  let padrinoId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });

    // Seed Coordinator User
    const coordPersona = await Persona.create({
      nombre: 'Marta',
      apellido: 'Coordinadora',
      cedula: '402-9999999-1',
      email: 'marta.coord@example.com'
    });

    await Usuario.create({
      persona_id: coordPersona.id,
      username: 'martacoord',
      password_hash: 'Coord123!',
      rol: 'COORDINADOR',
      activo: true
    });

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username: 'martacoord', password: 'Coord123!' });
    coordToken = loginRes.body.data.token;

    // Seed Academic + Student setup
    const uni = await Universidad.create({ nombre: 'UTESA Test', direccion: 'Santiago' });
    const carrera = await Carrera.create({ universidad_id: uni.id, nombre: 'Derecho' });

    const becarioPersona = await Persona.create({
      nombre: 'Jose',
      apellido: 'Alvarez',
      cedula: '402-4444444-4',
      email: 'jose.alvarez@example.com'
    });

    const becario = await Becario.create({
      persona_id: becarioPersona.id,
      universidad_id: uni.id,
      carrera_id: carrera.id,
      estado_beca: 'ACTIVA'
    });
    becarioId = becario.id;

    // Seed Sponsor setup
    const padrinoPersona = await Persona.create({
      nombre: 'Gabriel',
      apellido: 'Sosa',
      cedula: '031-3333333-3',
      email: 'gabriel.sosa@example.com'
    });

    const padrino = await Padrino.create({
      persona_id: padrinoPersona.id,
      tipo: 'natural',
      monto_compromiso: 10000.00,
      activo: true
    });
    padrinoId = padrino.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /becarios/:id/asignar-padrino', () => {
    it('should assign a sponsor to a scholarship student', async () => {
      const res = await request(app)
        .post(`/becarios/${becarioId}/asignar-padrino`)
        .set('Authorization', `Bearer ${coordToken}`)
        .send({
          padrino_id: padrinoId,
          fecha_asignacion: '2026-02-01',
          observaciones: 'Asignación directa para beca de Derecho'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.padrino_id).toEqual(padrinoId);
    });

    it('should reject duplicate active assignment', async () => {
      const res = await request(app)
        .post(`/becarios/${becarioId}/asignar-padrino`)
        .set('Authorization', `Bearer ${coordToken}`)
        .send({
          padrino_id: padrinoId
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /becarios/:id/padrinos/:padrino_id', () => {
    it('should update assignment notes or status', async () => {
      const res = await request(app)
        .put(`/becarios/${becarioId}/padrinos/${padrinoId}`)
        .set('Authorization', `Bearer ${coordToken}`)
        .send({
          observaciones: 'Notas de seguimiento actualizadas'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.observaciones).toEqual('Notas de seguimiento actualizadas');
    });
  });

  describe('DELETE /becarios/:id/padrinos/:padrino_id', () => {
    it('should decouple sponsor from student while keeping history', async () => {
      const res = await request(app)
        .delete(`/becarios/${becarioId}/padrinos/${padrinoId}`)
        .set('Authorization', `Bearer ${coordToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      const checkRecord = await BecarioPadrino.findOne({
        where: { becario_id: becarioId, padrino_id: padrinoId }
      });

      expect(checkRecord.activo).toBe(false);
      expect(checkRecord.fecha_fin).not.toBeNull();
    });
  });
});
