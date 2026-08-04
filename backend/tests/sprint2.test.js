const request = require('supertest');
const app = require('../src/app');
const { sequelize, Usuario, Persona, Becario, Universidad, Carrera, Alarma, Auditoria, Pago } = require('../src/models');
const jwt = require('jsonwebtoken');

describe('Sprint 2: Modules 5 (Alarms), 6 (Excel/PDF Export) & 7 (Extended Audit)', () => {
  let token;
  let adminUser;
  let becario;
  let testAlarma;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create Persona & Admin User
    const personaUser = await Persona.create({
      nombre: 'Admin',
      apellido: 'Sprint2',
      cedula: '001-8877665-4',
      email: 'admin.sprint2@fundacion.org'
    });

    adminUser = await Usuario.create({
      persona_id: personaUser.id,
      username: 'adminsprint2',
      password_hash: '$2a$10$abcdefghijklmnopqrstuuv',
      rol: 'ADMINISTRADOR',
      activo: true
    });

    token = jwt.sign(
      { id: adminUser.id, username: adminUser.username, rol: adminUser.rol },
      process.env.JWT_SECRET || 'super_secret_jwt_key_rompiendo_paradigmas_2026',
      { expiresIn: '1h' }
    );

    // Seed low GPA Becario to trigger rule 1
    const uni = await Universidad.create({ nombre: 'UASD' });
    const carrera = await Carrera.create({ universidad_id: uni.id, nombre: 'Derecho' });
    const personaBecario = await Persona.create({
      nombre: 'Maria',
      apellido: 'Gomez',
      cedula: '001-5544332-1',
      email: 'maria.sprint2@gmail.com'
    });

    becario = await Becario.create({
      persona_id: personaBecario.id,
      universidad_id: uni.id,
      carrera_id: carrera.id,
      promedio_general: 2.15, // Below 2.50 threshold
      estado_beca: 'activa'
    });

    // Create Overdue Payment to trigger rule 4
    await Pago.create({
      becario_id: becario.id,
      concepto: 'matricula',
      monto: 15000,
      fecha_vencimiento: '2026-01-01',
      estado: 'atrasado'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Module 5: Alarms Engine & Management API', () => {
    test('POST /alarmas/evaluar - should execute rule evaluation sweep and create alarms', async () => {
      const res = await request(app)
        .post('/alarmas/evaluar')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.promedioBajo).toBeGreaterThan(0);
      expect(res.body.data.pagosVencidos).toBeGreaterThan(0);
    });

    test('GET /alarmas/resumen - should return active alarm counts by severity', async () => {
      const res = await request(app)
        .get('/alarmas/resumen')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('pendientes');
      expect(res.body.data).toHaveProperty('criticos');
      expect(res.body.data.criticos).toBeGreaterThan(0);
    });

    test('GET /alarmas - should list pending alarms', async () => {
      const res = await request(app)
        .get('/alarmas?estado=pendiente')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      testAlarma = res.body.data[0];
    });

    test('PUT /alarmas/:id/atender - should resolve alarm with note', async () => {
      const res = await request(app)
        .put(`/alarmas/${testAlarma.id}/atender`)
        .set('Authorization', `Bearer ${token}`)
        .send({ resolucion_nota: 'Estudiante citado a tutoría académica.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('atendida');
      expect(res.body.data.resolucion_nota).toBe('Estudiante citado a tutoría académica.');
    });

    test('PUT /alarmas/:id/descartar - should dismiss alarm', async () => {
      const nextAlarma = await Alarma.findOne({ where: { estado: 'pendiente' } });
      if (nextAlarma) {
        const res = await request(app)
          .put(`/alarmas/${nextAlarma.id}/descartar`)
          .set('Authorization', `Bearer ${token}`)
          .send({ resolucion_nota: 'Alarma duplicada.' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.estado).toBe('descartada');
      }
    });
  });

  describe('Module 6: Report Exportation (Excel & PDF)', () => {
    test('GET /reportes/export/excel?tipo=becarios - should return Excel file buffer', async () => {
      const res = await request(app)
        .get('/reportes/export/excel?tipo=becarios')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(res.body).toBeDefined();
    });

    test('GET /reportes/export/excel?tipo=financiero - should return Financial Excel buffer', async () => {
      const res = await request(app)
        .get('/reportes/export/excel?tipo=financiero')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    test('GET /reportes/export/pdf?tipo=becarios - should return PDF document', async () => {
      const res = await request(app)
        .get('/reportes/export/pdf?tipo=becarios')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    test('GET /reportes/export/pdf?tipo=financiero - should return Financial PDF document', async () => {
      const res = await request(app)
        .get('/reportes/export/pdf?tipo=financiero')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('Module 7: Extended Audit Trail & Inspection API', () => {
    test('GET /audit - should return paginated audit logs', async () => {
      const res = await request(app)
        .get('/audit')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('audit_logs');
      expect(Array.isArray(res.body.data.audit_logs)).toBe(true);
    });

    test('GET /audit/:id - should return detailed audit log entry', async () => {
      const firstLog = await Auditoria.findOne();
      if (firstLog) {
        const res = await request(app)
          .get(`/audit/${firstLog.id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(firstLog.id);
      }
    });
  });
});
