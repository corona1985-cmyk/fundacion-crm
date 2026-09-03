const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 5
});

function configureFirebaseEnv() {
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  process.env.FORCE_SQLITE = 'true';
  process.env.DB_DIALECT = 'sqlite';
  process.env.INJECT_SQLITE = 'true';
  process.env.DISABLE_AUTH = process.env.DISABLE_AUTH || 'true';
  process.env.SYNC_ON_START = 'true';
  process.env.DB_STORAGE = process.env.DB_STORAGE || '/tmp/crm_becas.sqlite';
}

let appPromise;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      configureFirebaseEnv();
      const { resolveDatabase } = require('./src/bootstrapDb');
      await resolveDatabase();
      require('./scripts/copy-db');
      const app = require('./src/app');
      const { sequelize } = require('./src/models');
      await sequelize.authenticate();
      await sequelize.sync();
      try {
        const ensureAdmin = require('./scripts/ensure-admin');
        await ensureAdmin();
      } catch (error) {
        console.warn('No se pudo asegurar el admin:', error.message);
      }
      console.log('Firebase API lista con SQLite');
      return app;
    })();
  }
  return appPromise;
}

exports.api = onRequest({
  cors: true,
  timeoutSeconds: 120,
  memory: '1GiB',
  invoker: 'public'
}, async (req, res) => {
  const app = await getApp();
  return app(req, res);
});
