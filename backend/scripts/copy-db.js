const fs = require('fs');
const path = require('path');

const targetFile = process.env.DB_STORAGE;
const shouldInject = process.env.DB_DIALECT === 'sqlite' || process.env.FORCE_SQLITE === 'true' || (targetFile && (targetFile.startsWith('/data') || process.env.INJECT_SQLITE === 'true'));

if (targetFile && shouldInject) {
  const targetDir = path.dirname(targetFile);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const payloadPath = path.join(__dirname, 'db_data.js');
  const existingSize = fs.existsSync(targetFile) ? fs.statSync(targetFile).size : 0;
  const shouldOverwrite = existingSize < 2000000;

  if (shouldOverwrite && fs.existsSync(payloadPath)) {
    console.log(`Inyectando base de datos SQLite en ${targetFile}`);
    try {
      const dbData = require('./db_data.js');
      const buffer = Buffer.from(dbData, 'base64');
      fs.writeFileSync(targetFile, buffer);
      console.log('Inyección SQLite completada. Tamaño:', buffer.length);
    } catch (error) {
      console.error('Error inyectando BD:', error.message);
    }
  } else if (!shouldOverwrite) {
    console.log(`La base de datos ya tiene datos (${existingSize} bytes). Se omite la inyección.`);
  } else {
    console.log('No hay payload db_data.js. Se usará la BD vacía o existente.');
  }
} else {
  console.log('No aplica inyección SQLite en este entorno.');
}
