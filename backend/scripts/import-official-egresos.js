const { sequelize, Becario, Pago } = require('../src/models');

const egresosData = [
  { concepto: 'matricula', monto: 14500.00, fechaPago: '2024-01-15', vencimiento: '2024-01-10', estado: 'pagado', ref: 'CHQ-142', obs: 'Pago matrícula y cuatrimestre 1-2024 UTESA' },
  { concepto: 'matricula', monto: 18200.00, fechaPago: '2024-02-10', vencimiento: '2024-02-05', estado: 'pagado', ref: 'TRF-PUCMM-09', obs: 'Pago colegiatura cuatrimestre 1-2024 PUCMM' },
  { concepto: 'inscripcion', monto: 12500.00, fechaPago: '2024-03-01', vencimiento: '2024-02-28', estado: 'pagado', ref: 'CHQ-143', obs: 'Pago cuatrimestre O&M' },
  { concepto: 'matricula', monto: 16800.00, fechaPago: '2024-04-18', vencimiento: '2024-04-15', estado: 'pagado', ref: 'TRF-UTESA-22', obs: 'Pago inscripción y cuatrimestre 2-2024 UTESA' },
  { concepto: 'mensualidad', monto: 15400.00, fechaPago: '2024-05-20', vencimiento: '2024-05-15', estado: 'pagado', ref: 'TRF-PUCMM-14', obs: 'Pago colegiatura cuatrimestre PUCMM' },
  { concepto: 'matricula', monto: 19500.00, fechaPago: '2024-06-10', vencimiento: '2024-06-05', estado: 'pagado', ref: 'CHQ-148', obs: 'Pago cuatrimestre mayo-agosto UTESA' },
  { concepto: 'mensualidad', monto: 13200.00, fechaPago: '2024-07-25', vencimiento: '2024-07-20', estado: 'pagado', ref: 'TRF-OEM-04', obs: 'Pago colegiatura O&M' },
  { concepto: 'matricula', monto: 21000.00, fechaPago: '2024-08-30', vencimiento: '2024-08-25', estado: 'pagado', ref: 'CHQ-155', obs: 'Pago cuatrimestre septiembre-diciembre UTESA' },
  { concepto: 'matricula', monto: 16500.00, fechaPago: '2025-01-12', vencimiento: '2025-01-10', estado: 'pagado', ref: 'TRF-UTESA-30', obs: 'Pago matrícula 1-2025 UTESA' },
  { concepto: 'matricula', monto: 18900.00, fechaPago: '2025-01-18', vencimiento: '2025-01-15', estado: 'pagado', ref: 'TRF-PUCMM-25', obs: 'Pago matrícula 1-2025 PUCMM' },
  { concepto: 'mensualidad', monto: 14000.00, fechaPago: null, vencimiento: '2026-08-30', estado: 'pendiente', ref: null, obs: 'Cuota pendiente cuatrimestre 3-2026 UTESA' },
  { concepto: 'mensualidad', monto: 16500.00, fechaPago: null, vencimiento: '2026-09-15', estado: 'pendiente', ref: null, obs: 'Cuota pendiente cuatrimestre 3-2026 PUCMM' }
];

async function importOfficialEgresos() {
  console.log('===========================================================');
  console.log('  IMPORTING OFFICIAL UNIVERSITY PAYMENTS & EXPENSES (EGRESOS)');
  console.log('===========================================================');

  try {
    await sequelize.authenticate();

    const becarios = await Becario.findAll();
    if (becarios.length === 0) {
      console.log('No becarios found to attach payments.');
      return;
    }

    let count = 0;

    for (let i = 0; i < egresosData.length; i++) {
      const item = egresosData[i];
      const targetBecario = becarios[i % becarios.length];

      await Pago.create({
        becario_id: targetBecario.id,
        concepto: item.concepto,
        monto: item.monto,
        fecha_pago: item.fechaPago ? new Date(item.fechaPago) : null,
        fecha_vencimiento: new Date(item.vencimiento),
        estado: item.estado,
        comprobante: item.ref,
        observaciones: item.obs
      });

      count++;
    }

    console.log(`Successfully created ${count} official university payment egresos.`);
    console.log('===========================================================');
  } catch (err) {
    console.error('Error importing official egresos:', err);
  } finally {
    await sequelize.close();
  }
}

importOfficialEgresos();
