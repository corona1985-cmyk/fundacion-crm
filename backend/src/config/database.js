require('dotenv').config();
const path = require('path');

const define = {
  timestamps: true,
  underscored: true,
  freezeTableName: true
};

const pool = {
  max: 5,
  min: 0,
  acquire: 10000,
  idle: 10000
};

function sqliteConfig(storage) {
  return {
    dialect: 'sqlite',
    storage,
    logging: false,
    define
  };
}

function productionConfig() {
  if (process.env.DB_DIALECT === 'sqlite' || (!process.env.DATABASE_URL && process.env.DB_STORAGE)) {
    return sqliteConfig(process.env.DB_STORAGE || path.join(__dirname, '../../crm_becas.sqlite'));
  }

  if (process.env.DATABASE_URL) {
    return {
      use_env_variable: 'DATABASE_URL',
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false,
      pool,
      define
    };
  }

  return {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false,
    pool,
    define
  };
}

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'crm_becas',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || path.join(__dirname, '../../crm_becas_dev.sqlite'),
    logging: false,
    define
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define
  },
  get production() {
    return productionConfig();
  }
};
