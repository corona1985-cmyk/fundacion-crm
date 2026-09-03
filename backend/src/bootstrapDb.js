require('dotenv').config();
const path = require('path');

function useSqliteFallback(reason) {
  delete process.env.DATABASE_URL;
  process.env.DB_DIALECT = 'sqlite';
  process.env.DB_STORAGE = process.env.DB_STORAGE || path.join(__dirname, '../crm_becas.sqlite');
  console.warn(`[bootstrapDb] ${reason}`);
  console.warn(`[bootstrapDb] Usando SQLite en ${process.env.DB_STORAGE}`);
}

async function resolveDatabase() {
  if (process.env.DB_DIALECT === 'sqlite' || process.env.FORCE_SQLITE === 'true') {
    useSqliteFallback('SQLite forzado por variables de entorno.');
    return 'sqlite';
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    useSqliteFallback('No hay DATABASE_URL. El servicio arrancará con SQLite.');
    return 'sqlite';
  }

  if (url.includes('trngopsdonrctmjfpgfi')) {
    useSqliteFallback('El proyecto de Supabase configurado (trngopsdonrctmjfpgfi) ya no existe.');
    return 'sqlite';
  }

  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000
    });
    await client.connect();
    await client.end();
    console.log('[bootstrapDb] PostgreSQL respondió correctamente.');
    return 'postgres';
  } catch (error) {
    useSqliteFallback(`PostgreSQL no está disponible (${error.message}).`);
    return 'sqlite';
  }
}

module.exports = { resolveDatabase };
