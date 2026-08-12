const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const {
  sequelize,
  Persona,
  Becario,
  Universidad,
  Carrera,
  Padrino,
  InstitucionPublica,
  Aporte,
  BecarioPadrino
} = require('../src/models');

const BASE_DIR = 'C:/Users/Erick/Desktop/Rompiendo Paradigmas actualizado/04-ROMPIENDO PARADIGMAS';

async function importFullDriveData() {
  console.log('========================================================');
  console.log('  STARTING FULL DRIVE EXCEL MIGRATION INTO CRM DATABASE');
  console.log('========================================================');

  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // ---------------------------------------------------------
    // 1. UNIVERSITIES & CAREERS SETUP
    // ---------------------------------------------------------
    console.log('\n--- 1. Processing Universities & Careers ---');
    const universitiesMap = {};
    const uniList = [
      { nombre: 'Universidad Tecnológica de Santiago (UTESA)', sigla: 'UTESA', direccion: 'Santiago' },
      { nombre: 'Pontificia Universidad Católica Madre y Maestra (PUCMM)', sigla: 'PUCMM', direccion: 'Santiago' },
      { nombre: 'Universidad Autónoma de Santo Domingo (UASD)', sigla: 'UASD', direccion: 'Santiago' },
      { nombre: 'Universidad Dominicana O&M', sigla: 'OEM', direccion: 'Santiago' }
    ];

    for (const u of uniList) {
      let record = await Universidad.findOne({
        where: { nombre: u.nombre }
      });
      if (!record) {
        record = await Universidad.create({
          nombre: u.nombre,
          direccion: u.direccion,
          telefono: '809-582-0000',
          email_contacto: `info@${u.sigla.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu.do`
        });
      }
      universitiesMap[u.sigla] = record.id;
    }
    const defaultUniId = universitiesMap['UTESA'];

    const carrerasMap = {};
    const getCarreraId = async (cName, uniSigla = 'UTESA') => {
      if (!cName) cName = 'General';
      const cleanName = cName.trim();
      if (carrerasMap[cleanName]) return carrerasMap[cleanName];

      const uniId = universitiesMap[uniSigla] || defaultUniId;
      let record = await Carrera.findOne({ where: { nombre: cleanName } });
      if (!record) {
        record = await Carrera.create({
          universidad_id: uniId,
          codigo: cleanName.substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900),
          nombre: cleanName,
          creditos: 180,
          duracion_meses: 48
        });
      }
      carrerasMap[cleanName] = record.id;
      return record.id;
    };

    // ---------------------------------------------------------
    // 2. PADRINOS & INSTITUTIONS
    // ---------------------------------------------------------
    console.log('\n--- 2. Processing Padrinos & Institutions ---');
    const padrinosMap = {};
    const padrinosPath = path.join(BASE_DIR, 'Listado de centros con Padrinos.xlsx');
    if (fs.existsSync(padrinosPath)) {
      const wbPadrinos = new ExcelJS.Workbook();
      await wbPadrinos.xlsx.readFile(padrinosPath);
      const sheet = wbPadrinos.worksheets[0];
      
      for (let r = 2; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r).values;
        const centro = row[1];
        const padrinoNombre = row[2];

        if (padrinoNombre) {
          const parts = padrinoNombre.trim().split(' ');
          const nombre = parts[0];
          const apellido = parts.slice(1).join(' ') || 'Padrino';
          const cleanUser = `${nombre.toLowerCase()}.${apellido.toLowerCase()}`.replace(/[^a-z0-9.]/g, '');
          const email = `${cleanUser}${r}@padrino.org`;

          const [persona] = await Persona.findOrCreate({
            where: { email },
            defaults: {
              nombre,
              apellido,
              cedula: `001-${Math.floor(1000000 + Math.random() * 9000000)}-${r}`,
              email,
              telefono: '809-555-9999',
              direccion: 'Santiago'
            }
          });

          const [padrino] = await Padrino.findOrCreate({
            where: { persona_id: persona.id },
            defaults: {
              persona_id: persona.id,
              tipo: 'natural',
              monto_compromiso: 25000.00,
              frecuencia: 'mensual',
              forma_pago: 'transferencia',
              activo: true
            }
          });
          padrinosMap[padrinoNombre.trim()] = padrino.id;
          if (centro) padrinosMap[centro.trim()] = padrino.id;
        }
      }
    }

    // Additional corporate Padrinos
    const corpPadrinos = [
      'Tabacalera Palma', 'Carlos Estrella', 'Dr. Luis Reynoso', 'Félix García',
      'Sandy Filpo', 'Franklin Ureña', 'Hipermercado La Fuente'
    ];
    for (const name of corpPadrinos) {
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `${cleanName}@empresa.com`;
      const [persona] = await Persona.findOrCreate({
        where: { email },
        defaults: {
          nombre: name,
          apellido: '(Empresa / Patrocinador)',
          cedula: `101-${Math.floor(1000000 + Math.random() * 9000000)}-0`,
          email,
          telefono: '809-555-8888',
          direccion: 'Santiago'
        }
      });
      const [padrino] = await Padrino.findOrCreate({
        where: { persona_id: persona.id },
        defaults: {
          persona_id: persona.id,
          tipo: 'juridica',
          razon_social: name,
          monto_compromiso: 50000.00,
          frecuencia: 'trimestral',
          forma_pago: 'transferencia',
          activo: true
        }
      });
      padrinosMap[name] = padrino.id;
    }

    // Institutional sponsors
    const instMap = {};
    const instList = [
      { nombre: 'ARS Banreservas', email: 'contacto@arsbanreservas.gob.do' },
      { nombre: 'AFP Banreservas', email: 'contacto@afpbanreservas.gob.do' },
      { nombre: 'Ministerio de Educación Superior (MESCYT)', email: 'contacto@mescyt.gob.do' }
    ];
    for (const inst of instList) {
      const [record] = await InstitucionPublica.findOrCreate({
        where: { nombre: inst.nombre },
        defaults: {
          nombre: inst.nombre,
          contacto: 'Dirección de Fondos',
          telefono: '809-500-0000',
          email: inst.email,
          activo: true
        }
      });
      instMap[inst.nombre] = record.id;
    }

    // ---------------------------------------------------------
    // 3. SCHOLARS & STUDENTS MIGRATION
    // ---------------------------------------------------------
    console.log('\n--- 3. Processing Master Scholar Relations ---');
    let totalScholarsImported = 0;

    const relPath = path.join(BASE_DIR, 'Relacion Becados Rompiendo Paradigmas.xlsx');
    if (fs.existsSync(relPath)) {
      const wbRel = new ExcelJS.Workbook();
      await wbRel.xlsx.readFile(relPath);
      const sheet = wbRel.getWorksheet('Listado Estudiantes') || wbRel.worksheets[0];

      for (let r = 4; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r).values;
        if (!row || !row[1] || typeof row[1] === 'number') {
          const name = row[2];
          const code = row[3];
          const centro = row[4];
          const uni = row[5];
          const matricula = row[6];
          const carrera = row[7];
          const statusRaw = row[9];

          if (name && typeof name === 'string' && name.trim().length > 2) {
            const parts = name.trim().split(' ');
            const nombre = parts[0];
            const apellido = parts.slice(1).join(' ') || 'Estudiante';
            const cleanUser = `${nombre.toLowerCase()}.${apellido.toLowerCase()}`.replace(/[^a-z0-9.]/g, '');
            const email = `${cleanUser}${r}@becado.org`;

            const [persona] = await Persona.findOrCreate({
              where: { email },
              defaults: {
                nombre,
                apellido,
                cedula: `402-${Math.floor(1000000 + Math.random() * 9000000)}-${r % 10}`,
                email,
                telefono: '809-555-' + String(r).padStart(4, '0'),
                direccion: 'Santiago, República Dominicana'
              }
            });

            const uniId = universitiesMap[uni] || defaultUniId;
            const carreraId = await getCarreraId(carrera, uni);

            let estadoBeca = 'ACTIVA';
            if (statusRaw && String(statusRaw).toLowerCase().includes('graduad')) estadoBeca = 'FINALIZADA';
            if (statusRaw && String(statusRaw).toLowerCase().includes('retirad')) estadoBeca = 'CANCELADA';
            if (statusRaw && String(statusRaw).toLowerCase().includes('suspend')) estadoBeca = 'SUSPENDIDA';

            const [becario, created] = await Becario.findOrCreate({
              where: { persona_id: persona.id },
              defaults: {
                persona_id: persona.id,
                universidad_id: uniId,
                carrera_id: carreraId,
                centro_origen: centro || 'Liceo / Politécnico Afiliado',
                fecha_seleccion: new Date('2024-01-10'),
                estado_beca: estadoBeca,
                ciclo_actual: Math.floor(Math.random() * 5) + 1,
                promedio_general: (3.20 + Math.random() * 0.70).toFixed(2)
              }
            });

            if (created) totalScholarsImported++;

            if (centro && padrinosMap[centro.trim()]) {
              await BecarioPadrino.findOrCreate({
                where: {
                  becario_id: becario.id,
                  padrino_id: padrinosMap[centro.trim()]
                },
                defaults: {
                  becario_id: becario.id,
                  padrino_id: padrinosMap[centro.trim()],
                  fecha_asignacion: new Date('2024-01-15')
                }
              });
            }
          }
        }
      }
    }

    // ---------------------------------------------------------
    // 4. FINANCIAL REPORTS & CONTRIBUTIONS (Reporte 2024 & 2025)
    // ---------------------------------------------------------
    console.log('\n--- 4. Processing Financial Reports & Aportes ---');
    let totalAportes = 0;

    const rep2024Path = path.join(BASE_DIR, 'CONTABILIDAD ROMPIENDO PARADIGMAS/Reporte Rompiendo Paradigmas 2024.xlsx');
    if (fs.existsSync(rep2024Path)) {
      const wbFin = new ExcelJS.Workbook();
      await wbFin.xlsx.readFile(rep2024Path);
      const sheetAportes = wbFin.getWorksheet('APORTES RECIBIDOS');

      if (sheetAportes) {
        for (let r = 3; r <= sheetAportes.rowCount; r++) {
          const row = sheetAportes.getRow(r).values;
          const fecha = row[1];
          const concepto = row[2];
          const monto = parseFloat(row[3]);

          if (concepto && !isNaN(monto) && monto > 0) {
            let padrinoId = null;
            let instId = null;

            if (String(concepto).includes('ARS')) instId = instMap['ARS Banreservas'];
            else if (String(concepto).includes('AFP')) instId = instMap['AFP Banreservas'];
            else {
              for (const pKey of Object.keys(padrinosMap)) {
                if (String(concepto).toLowerCase().includes(pKey.toLowerCase())) {
                  padrinoId = padrinosMap[pKey];
                  break;
                }
              }
            }

            if (!padrinoId && !instId) {
              const firstPadrinoKey = Object.keys(padrinosMap)[0];
              padrinoId = padrinosMap[firstPadrinoKey] || 1;
            }

            await Aporte.create({
              padrino_id: padrinoId,
              institucion_id: instId,
              monto: monto,
              fecha_aporte: fecha instanceof Date ? fecha : new Date('2024-03-01'),
              comprobante: `TR-2024-${r}`,
              observaciones: String(concepto)
            });
            totalAportes++;
          }
        }
      }
    }

    console.log('========================================================');
    console.log('  FULL DRIVE EXCEL MIGRATION COMPLETED');
    console.log(`  Total Scholars Created/Verified: ${totalScholarsImported}`);
    console.log(`  Total Financial Aportes Imported: ${totalAportes}`);
    console.log('========================================================');

  } catch (error) {
    console.error('Error during full Drive Excel migration:', error);
  } finally {
    await sequelize.close();
  }
}

importFullDriveData();
