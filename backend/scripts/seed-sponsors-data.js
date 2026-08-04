require('dotenv').config();
const { Persona, Padrino, InstitucionPublica, Aporte, sequelize } = require('../src/models');

async function seedSponsorsData() {
  const transaction = await sequelize.transaction();
  try {
    await sequelize.authenticate();
    console.log('Connecting to database for sponsors seed...');
    await sequelize.sync();

    // 1. Natural Sponsor
    const personaPadrino1 = await Persona.create({
      nombre: 'Roberto',
      apellido: 'Almonte',
      cedula: '031-0000000-9',
      email: 'roberto.almonte@example.com',
      telefono: '809-555-1234',
      direccion: 'Gurabo, Santiago'
    }, { transaction });

    const padrino1 = await Padrino.create({
      persona_id: personaPadrino1.id,
      tipo: 'natural',
      monto_compromiso: 15000.00,
      frecuencia: 'mensual',
      forma_pago: 'transferencia',
      activo: true
    }, { transaction });

    // 2. Corporate Sponsor (Jurídica)
    const personaPadrino2 = await Persona.create({
      nombre: 'Contacto',
      apellido: 'Empresarial',
      cedula: '031-9999999-9',
      email: 'contacto@grupoempresarial.com',
      telefono: '809-581-8888',
      direccion: 'Zona Industrial de Matanzas, Santiago'
    }, { transaction });

    const padrino2 = await Padrino.create({
      persona_id: personaPadrino2.id,
      tipo: 'juridica',
      razon_social: 'Grupo Industrial del Cibao S.A.',
      monto_compromiso: 50000.00,
      frecuencia: 'trimestral',
      forma_pago: 'cheque',
      activo: true
    }, { transaction });

    // 3. Public Institution
    const institucion = await InstitucionPublica.create({
      nombre: 'Ministerio de Educación Superior, Ciencia y Tecnología (MESCYT)',
      contacto: 'Lic. Francisca Gómez',
      telefono: '809-508-7700',
      email: 'becasnacionales@mescyt.gob.do',
      activo: true
    }, { transaction });

    // 4. Sample Contributions (Aportes)
    await Aporte.bulkCreate([
      {
        padrino_id: padrino1.id,
        institucion_id: null,
        monto: 15000.00,
        fecha_recepcion: '2026-01-05',
        medio_pago: 'transferencia',
        referencia: 'TRF-987654321',
        observaciones: 'Aporte correspondiente al mes de Enero 2026'
      },
      {
        padrino_id: padrino2.id,
        institucion_id: null,
        monto: 50000.00,
        fecha_recepcion: '2026-01-15',
        medio_pago: 'cheque',
        referencia: 'CH-445522',
        observaciones: 'Aporte trimestral Q1 2026'
      },
      {
        padrino_id: null,
        institucion_id: institucion.id,
        monto: 250000.00,
        fecha_recepcion: '2026-01-20',
        medio_pago: 'transferencia',
        referencia: 'GOB-2026-001',
        observaciones: 'Desembolso gubernamental de subsidio a becas estudiantiles'
      }
    ], { transaction });

    await transaction.commit();
    console.log('========================================================');
    console.log('  SPONSORS & CONTRIBUTIONS CATALOG SEEDED SUCCESSFULLY');
    console.log('========================================================');
    console.log(` Sponsors: ${personaPadrino1.nombre} ${personaPadrino1.apellido}, ${padrino2.razon_social}`);
    console.log(` Institution: ${institucion.nombre}`);
    console.log('========================================================');

    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('Failed to seed sponsors data:', error.message);
    process.exit(1);
  }
}

seedSponsorsData();
