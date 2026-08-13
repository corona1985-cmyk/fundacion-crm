const { sequelize, Persona, Becario, Padrino, InstitucionPublica, Aporte, BecarioPadrino, Pago, Usuario, Universidad, Carrera } = require('../src/models');
const bcrypt = require('bcryptjs');

async function resetDB() {
  console.log('====================================================');
  console.log('  RESETTING DATABASE - REMOVING AUTOMATED BULK DATA');
  console.log('====================================================');

  try {
    await sequelize.authenticate();

    // Drop and sync clean tables
    await sequelize.sync({ force: true });
    console.log('All tables recreated clean.');

    // Seed default admin user
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    const adminPersona = await Persona.create({
      nombre: 'Administrador',
      apellido: 'Fundación',
      cedula: '001-0000000-0',
      email: 'admin@fundacionrp.org',
      telefono: '809-555-0000',
      direccion: 'Santiago, R.D.'
    });

    await Usuario.create({
      persona_id: adminPersona.id,
      username: 'admin',
      password_hash: passwordHash,
      rol: 'admin',
      activo: true
    });
    console.log('Admin user recreated: admin / Admin123!');

    // Seed Universities
    const uniUtesa = await Universidad.create({
      nombre: 'Universidad Tecnológica de Santiago (UTESA)',
      direccion: 'Santiago',
      telefono: '809-582-0000',
      email_contacto: 'info@utesa.edu.do'
    });

    const uniPucmm = await Universidad.create({
      nombre: 'Pontificia Universidad Católica Madre y Maestra (PUCMM)',
      direccion: 'Santiago',
      telefono: '809-580-1962',
      email_contacto: 'info@pucmm.edu.do'
    });

    const uniUasd = await Universidad.create({
      nombre: 'Universidad Autónoma de Santo Domingo (UASD)',
      direccion: 'Santiago',
      telefono: '809-575-0000',
      email_contacto: 'info@uasd.edu.do'
    });

    const uniOyM = await Universidad.create({
      nombre: 'Universidad Dominicana O&M',
      direccion: 'Santiago',
      telefono: '809-583-0000',
      email_contacto: 'info@om.edu.do'
    });

    // Seed basic careers
    await Carrera.create({ universidad_id: uniUtesa.id, codigo: 'ISC', nombre: 'Ingeniería en Sistemas Computacionales', creditos: 180, duracion_meses: 48 });
    await Carrera.create({ universidad_id: uniUtesa.id, codigo: 'MED', nombre: 'Medicina', creditos: 240, duracion_meses: 72 });
    await Carrera.create({ universidad_id: uniUtesa.id, codigo: 'DER', nombre: 'Derecho', creditos: 190, duracion_meses: 48 });
    await Carrera.create({ universidad_id: uniUtesa.id, codigo: 'CON', nombre: 'Contaduría Pública', creditos: 175, duracion_meses: 48 });
    await Carrera.create({ universidad_id: uniPucmm.id, codigo: 'CIV', nombre: 'Ingeniería Civil', creditos: 200, duracion_meses: 48 });

    console.log('====================================================');
    console.log('  DATABASE RESET COMPLETED SUCCESSFULLY');
    console.log('====================================================');
  } catch (err) {
    console.error('Error resetting database:', err);
  } finally {
    await sequelize.close();
  }
}

resetDB();
