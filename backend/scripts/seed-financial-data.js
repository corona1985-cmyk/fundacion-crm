require('dotenv').config();
const { Persona, Universidad, Carrera, Becario, Pago, Presupuesto, GastoAdministrativo, sequelize } = require('../src/models');

async function seedFinancialData() {
  const transaction = await sequelize.transaction();
  try {
    await sequelize.authenticate();
    console.log('Connecting to database for financial seed...');
    await sequelize.sync();

    // 1. Find or create sample student for payments
    let becario = await Becario.findOne({ include: [{ model: Persona, as: 'persona' }] });
    if (!becario) {
      const uni = await Universidad.create({ nombre: 'PUCMM', direccion: 'Santiago' }, { transaction });
      const carrera = await Carrera.create({ universidad_id: uni.id, nombre: 'Ingeniería en Sistemas' }, { transaction });
      const persona = await Persona.create({
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        cedula: '402-1234567-8',
        email: 'carlos.rod@example.com'
      }, { transaction });
      becario = await Becario.create({
        persona_id: persona.id,
        universidad_id: uni.id,
        carrera_id: carrera.id,
        estado_beca: 'ACTIVA'
      }, { transaction });
    }

    // 2. Sample Budget Allocation (Presupuesto)
    await Presupuesto.bulkCreate([
      {
        categoria: 'becas',
        monto_asignado: 300000.00,
        monto_ejecutado: 120000.00,
        anio: 2026,
        mes: 1,
        observaciones: 'Asignación mensual becas enero 2026'
      },
      {
        categoria: 'administrativo',
        monto_asignado: 50000.00,
        monto_ejecutado: 15000.00,
        anio: 2026,
        mes: 1,
        observaciones: 'Gastos administrativos enero 2026'
      },
      {
        categoria: 'operativo',
        monto_asignado: 25000.00,
        monto_ejecutado: 8000.00,
        anio: 2026,
        mes: 1,
        observaciones: 'Impresiones y papelería'
      }
    ], { transaction });

    // 3. Sample Scholarship Payments (Pagos)
    await Pago.bulkCreate([
      {
        becario_id: becario.id,
        concepto: 'matricula',
        monto: 25000.00,
        fecha_vencimiento: '2026-01-10',
        fecha_pago: '2026-01-08',
        estado: 'pagado',
        comprobante: 'REC-2026-001.pdf',
        observaciones: 'Pago matricula primer ciclo 2026'
      },
      {
        becario_id: becario.id,
        concepto: 'mensualidad',
        monto: 12000.00,
        fecha_vencimiento: '2026-02-15',
        fecha_pago: null,
        estado: 'pendiente',
        comprobante: null,
        observaciones: 'Mensualidad Febrero 2026'
      },
      {
        becario_id: becario.id,
        concepto: 'mensualidad',
        monto: 12000.00,
        fecha_vencimiento: '2026-01-15',
        fecha_pago: null,
        estado: 'atrasado',
        comprobante: null,
        observaciones: 'Pago de enero pendiente de acreditación'
      }
    ], { transaction });

    // 4. Sample Administrative Expense
    await GastoAdministrativo.create({
      categoria: 'administrativo',
      descripcion: 'Licencias de software CRM y servidores',
      monto: 15000.00,
      fecha: '2026-01-15',
      comprobante: 'INV-998877.pdf'
    }, { transaction });

    await transaction.commit();
    console.log('========================================================');
    console.log('  FINANCIAL CATALOG & PAYMENTS SEEDED SUCCESSFULLY');
    console.log('========================================================');
    console.log(` Budget allocated for 2026/01.`);
    console.log(` University payments registered for Becario ID: ${becario.id}`);
    console.log('========================================================');

    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('Failed to seed financial data:', error.message);
    process.exit(1);
  }
}

seedFinancialData();
