const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '../crm_becas_dev.sqlite');
const outPath = path.join(__dirname, '../../frontend/src/data/crmStore.json');

function all(db, sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (error, rows) => (error ? reject(error) : resolve(rows || [])));
  });
}

(async () => {
  const db = new sqlite3.Database(dbPath);
  const tables = await all(db, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('Tables:', tables.map((t) => t.name).join(', '));

  const becarios = await all(db, `
    SELECT b.*, p.nombre, p.apellido, p.cedula, p.email, p.telefono, p.direccion, p.fecha_nacimiento,
           u.nombre AS universidad_nombre, c.nombre AS carrera_nombre
    FROM becarios b
    LEFT JOIN personas p ON p.id = b.persona_id
    LEFT JOIN universidades u ON u.id = b.universidad_id
    LEFT JOIN carreras c ON c.id = b.carrera_id
  `);

  const padrinos = await all(db, `
    SELECT pad.*, p.nombre, p.apellido, p.cedula, p.email, p.telefono, p.direccion
    FROM padrinos pad
    LEFT JOIN personas p ON p.id = pad.persona_id
  `);

  const universidades = await all(db, 'SELECT * FROM universidades');
  const carreras = await all(db, 'SELECT * FROM carreras');
  const instituciones = await all(db, 'SELECT * FROM instituciones_publicas').catch(() => []);
  const aportes = await all(db, 'SELECT * FROM aportes').catch(() => []);
  const pagos = await all(db, `
    SELECT pg.*, p.nombre, p.apellido, u.nombre AS universidad_nombre
    FROM pagos pg
    LEFT JOIN becarios b ON b.id = pg.becario_id
    LEFT JOIN personas p ON p.id = b.persona_id
    LEFT JOIN universidades u ON u.id = b.universidad_id
  `).catch(() => []);
  const alarmas = await all(db, 'SELECT * FROM alarmas').catch(() => []);
  const presupuestos = await all(db, 'SELECT * FROM presupuestos').catch(() => []);
  const gastos = await all(db, 'SELECT * FROM gastos_administrativos').catch(() => []);

  const payload = {
    becarios: becarios.map((row) => ({
      ...row,
      persona: {
        id: row.persona_id,
        nombre: row.nombre,
        apellido: row.apellido,
        cedula: row.cedula,
        email: row.email,
        telefono: row.telefono,
        direccion: row.direccion,
        fecha_nacimiento: row.fecha_nacimiento
      },
      universidad: { id: row.universidad_id, nombre: row.universidad_nombre },
      carrera: { id: row.carrera_id, nombre: row.carrera_nombre }
    })),
    padrinos: padrinos.map((row) => ({
      ...row,
      persona: {
        id: row.persona_id,
        nombre: row.nombre,
        apellido: row.apellido,
        cedula: row.cedula,
        email: row.email,
        telefono: row.telefono,
        direccion: row.direccion
      }
    })),
    universidades,
    carreras,
    instituciones,
    aportes,
    pagos: pagos.map((row) => ({
      ...row,
      becario: {
        id: row.becario_id,
        persona: { nombre: row.nombre, apellido: row.apellido },
        universidad: { nombre: row.universidad_nombre }
      }
    })),
    alarmas,
    presupuestos,
    gastos
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload));
  console.log(`Exported ${payload.becarios.length} becarios, ${payload.padrinos.length} padrinos, ${payload.pagos.length} pagos -> ${outPath}`);
  db.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
