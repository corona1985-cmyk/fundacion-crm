const { sequelize, Becario, Persona, Pago, Alarma } = require('../src/models');

async function importOfficialAlarmas() {
  console.log('===========================================================');
  console.log('  GENERATING OFFICIAL ALARMS FROM VERIFIED DOCUMENTS');
  console.log('===========================================================');

  try {
    await sequelize.authenticate();

    let count = 0;

    // 1. PROMEDIO BAJO ALARMS (Low GPA Warnings)
    const lowGpaScholars = [
      { name: 'Freily Delvion Arias Severino', gpa: '2.40', note: 'Notificación enviada por bajo índice cuatrimestral (2.3) y acumulado (2.4).' },
      { name: 'Reidy Miguel Vera Meson', gpa: '2.80', note: 'Notificación enviada por bajo índice cuatrimestral (2.8).' },
      { name: 'Yatna Esteisy Meson Reyes', gpa: '2.94', note: 'Notificación de bajo índice cuatrimestral (2.95) en O&M.' }
    ];

    for (const item of lowGpaScholars) {
      const parts = item.name.split(' ');
      const persona = await Persona.findOne({ where: { nombre: parts[0] } });
      let becarioId = null;

      if (persona) {
        const becario = await Becario.findOne({ where: { persona_id: persona.id } });
        if (becario) becarioId = becario.id;
      }

      await Alarma.create({
        tipo: 'PROMEDIO_BAJO',
        nivel: parseFloat(item.gpa) < 2.5 ? 'critico' : 'medio',
        titulo: `Bajo Índice Académico - ${item.name} (GPA: ${item.gpa})`,
        descripcion: item.note,
        entidad_relacionada: 'becario',
        entidad_id: becarioId,
        estado: 'pendiente'
      });
      count++;
    }

    // 2. GRADUACIONES PROXIMAS ALARMS (Upcoming High School Graduations)
    const graduationEvents = [
      { name: 'Hansel Marcelino López', center: 'Politécnico Canadá', date: '2026-08-14', note: 'Acto de Graduación agendado para el 14 de agosto.' },
      { name: 'Marina Camila Nazarre Peña', center: 'Politécnico Maestra Elsa Brito', date: '2026-08-28', note: 'Acto de Graduación agendado para el viernes 28 de agosto.' },
      { name: 'Daniel Sarita Peña', center: 'UFE', date: '2026-08-29', note: 'Acto de Graduación agendado para el sábado 29 de agosto.' },
      { name: 'Rosibel Del Carmen García Genao', center: 'Liceo Onésimo Jiménez', date: '2026-08-29', note: 'Acto de Graduación agendado para el 29 de agosto.' },
      { name: 'Zoe Cavaliere Familia', center: 'Politécnico La Esperanza', date: '2026-08-30', note: 'Acto de Graduación agendado para el 30 de agosto.' },
      { name: 'Irainy Céspedes García', center: 'Politécnico Braulio Paulino', date: '2026-09-15', note: 'Acto de Graduación agendado para Septiembre.' },
      { name: 'Chanell Alexandra Emiliana Almarante Jiménez', center: 'Don Bosco', date: '2026-10-01', note: 'Acto de Graduación agendado para Octubre.' },
      { name: 'Kiara Torres Rodriguez', center: 'IPISA', date: '2026-10-16', note: 'Acto de Graduación agendado para el 16 de octubre.' }
    ];

    for (const item of graduationEvents) {
      const parts = item.name.split(' ');
      const persona = await Persona.findOne({ where: { nombre: parts[0] } });
      let becarioId = null;

      if (persona) {
        const becario = await Becario.findOne({ where: { persona_id: persona.id } });
        if (becario) becarioId = becario.id;
      }

      await Alarma.create({
        tipo: 'GRADUACION_PROXIMA',
        nivel: 'medio',
        titulo: `Graduación de Liceo Próxima - ${item.name} (${item.center})`,
        descripcion: `${item.note} Estatus de solicitud de beca: Creado.`,
        entidad_relacionada: 'becario',
        entidad_id: becarioId,
        fecha_evento: item.date,
        estado: 'pendiente'
      });
      count++;
    }

    // 3. PAGOS VENCIDOS / PROXIMOS ALARMS (University Tuition Due)
    const tuitionDueList = [
      { uni: 'UTESA', monto: '14,000.00', vencimiento: '2026-08-30', note: 'Cuota cuatrimestre 3-2026 UTESA por vencer.' },
      { uni: 'PUCMM', monto: '16,500.00', vencimiento: '2026-09-15', note: 'Cuota cuatrimestre 3-2026 PUCMM por vencer.' }
    ];

    for (const item of tuitionDueList) {
      await Alarma.create({
        tipo: 'PAGO_VENCIDO',
        nivel: 'critico',
        titulo: `Vencimiento de Colegiatura ${item.uni} (RD$ ${item.monto})`,
        descripcion: `${item.note} Fecha límite de pago: ${item.vencimiento}`,
        entidad_relacionada: 'pago',
        entidad_id: null,
        fecha_evento: item.vencimiento,
        estado: 'pendiente'
      });
      count++;
    }

    console.log(`Successfully generated ${count} official active alarms.`);
    console.log('===========================================================');
  } catch (err) {
    console.error('Error generating official alarms:', err);
  } finally {
    await sequelize.close();
  }
}

importOfficialAlarmas();
