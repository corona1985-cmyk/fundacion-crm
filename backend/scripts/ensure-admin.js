const { Usuario, Persona, sequelize } = require('../src/models');

async function ensureAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const shouldReset = process.env.RESET_ADMIN_PASSWORD === 'true';

  let admin = await Usuario.findOne({ where: { username } });

  if (!admin) {
    admin = await Usuario.findOne({ where: { rol: 'ADMINISTRADOR' } });
  }

  if (admin && !shouldReset) {
    console.log(`Usuario administrador '${admin.username}' ya existe.`);
    return;
  }

  if (admin && shouldReset) {
    admin.password_hash = password;
    admin.activo = true;
    await admin.save();
    console.log(`Contraseña del administrador '${admin.username}' restablecida.`);
    return;
  }

  const persona = await Persona.create({
    nombre: 'Administrador',
    apellido: 'Sistema',
    cedula: process.env.ADMIN_CEDULA || '000-0000000-0',
    email: process.env.ADMIN_EMAIL || 'admin@rompiendoparadigmas.org',
    telefono: '809-555-0100',
    direccion: 'Oficina Principal Fundación Rompiendo Paradigmas'
  });

  await Usuario.create({
    persona_id: persona.id,
    username,
    password_hash: password,
    rol: 'ADMINISTRADOR',
    activo: true
  });

  console.log(`Administrador creado: ${username}`);
}

if (require.main === module) {
  (async () => {
    await sequelize.authenticate();
    await sequelize.sync();
    await ensureAdmin();
    process.exit(0);
  })().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = ensureAdmin;
