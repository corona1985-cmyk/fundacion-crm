require('dotenv').config();
const { Persona, Usuario, sequelize } = require('../src/models');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Connecting to database...');
    await sequelize.sync();
    console.log('Database tables synchronized.');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }

  const transaction = await sequelize.transaction();
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@rompiendoparadigmas.org';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminCedula = process.env.ADMIN_CEDULA || '000-0000000-0';

    // Check if admin already exists
    const existingUser = await Usuario.findOne({ where: { username: adminUsername } });
    if (existingUser) {
      console.log(`Admin user '${adminUsername}' already exists.`);
      await transaction.rollback();
      process.exit(0);
    }

    const persona = await Persona.create({
      nombre: 'Administrador',
      apellido: 'Sistema',
      cedula: adminCedula,
      email: adminEmail,
      telefono: '809-555-0100',
      direccion: 'Oficina Principal Fundación Rompiendo Paradigmas'
    }, { transaction });

    const usuario = await Usuario.create({
      persona_id: persona.id,
      username: adminUsername,
      password_hash: adminPassword,
      rol: 'ADMINISTRADOR',
      activo: true
    }, { transaction });

    await transaction.commit();

    console.log('========================================================');
    console.log('  INITIAL ADMIN USER CREATED SUCCESSFULLY');
    console.log('========================================================');
    console.log(` Username: ${adminUsername}`);
    console.log(` Password: ${adminPassword}`);
    console.log(` Email:    ${adminEmail}`);
    console.log(` Role:     ADMINISTRADOR`);
    console.log('========================================================');

    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('Failed to create admin user:', error.message);
    process.exit(1);
  }
}

createAdmin();
