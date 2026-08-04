require('dotenv').config();
const { Universidad, Carrera, Materia, CicloAcademico, sequelize } = require('../src/models');

async function seedAcademicData() {
  const transaction = await sequelize.transaction();
  try {
    await sequelize.authenticate();
    console.log('Connecting to database for academic seed...');
    await sequelize.sync();

    // 1. Universities
    const pucmm = await Universidad.create({
      nombre: 'Pontificia Universidad Católica Madre y Maestra (PUCMM)',
      direccion: 'Autopista Duarte Km 1.5, Santiago de los Caballeros',
      telefono: '809-580-1962',
      email_contacto: 'admisiones.sti@pucmm.edu.do'
    }, { transaction });

    const utesa = await Universidad.create({
      nombre: 'Universidad Tecnológica de Santiago (UTESA)',
      direccion: 'Av. Salvador Allende, Santiago de los Caballeros',
      telefono: '809-582-7156',
      email_contacto: 'info@utesa.edu'
    }, { transaction });

    const uasd = await Universidad.create({
      nombre: 'Universidad Autónoma de Santo Domingo (UASD - Recinto Santiago)',
      direccion: 'La Barranquita, Santiago de los Caballeros',
      telefono: '809-247-4000',
      email_contacto: 'uasdsantiago@uasd.edu.do'
    }, { transaction });

    // 2. Careers
    const sistemasPucmm = await Carrera.create({
      universidad_id: pucmm.id,
      nombre: 'Ingeniería en Ciencias de la Computación y Software',
      duracion_ciclos: 12
    }, { transaction });

    const medicinaUtesa = await Carrera.create({
      universidad_id: utesa.id,
      nombre: 'Doctor en Medicina',
      duracion_ciclos: 14
    }, { transaction });

    const derechoUasd = await Carrera.create({
      universidad_id: uasd.id,
      nombre: 'Licenciatura en Derecho',
      duracion_ciclos: 10
    }, { transaction });

    // 3. Subjects for Systems Engineering (PUCMM)
    await Materia.bulkCreate([
      { carrera_id: sistemasPucmm.id, codigo: 'ICC-101', nombre: 'Introducción a la Programación', creditos: 4, nivel: 1 },
      { carrera_id: sistemasPucmm.id, codigo: 'MAT-101', nombre: 'Cálculo I', creditos: 5, nivel: 1 },
      { carrera_id: sistemasPucmm.id, codigo: 'ICC-202', nombre: 'Estructuras de Datos y Algoritmos', creditos: 4, nivel: 2 },
      { carrera_id: sistemasPucmm.id, codigo: 'ICC-303', nombre: 'Bases de Datos I', creditos: 4, nivel: 3 },
      { carrera_id: sistemasPucmm.id, codigo: 'ICC-404', nombre: 'Ingeniería de Software I', creditos: 4, nivel: 4 }
    ], { transaction });

    // 4. Academic Cycles for PUCMM
    await CicloAcademico.create({
      universidad_id: pucmm.id,
      nombre: '2026-1 (Enero - Abril)',
      fecha_inicio: '2026-01-10',
      fecha_fin: '2026-04-25',
      fecha_limite_pago: '2026-01-30',
      ciclo_actual: true
    }, { transaction });

    await CicloAcademico.create({
      universidad_id: pucmm.id,
      nombre: '2026-2 (Mayo - Agosto)',
      fecha_inicio: '2026-05-10',
      fecha_fin: '2026-08-25',
      fecha_limite_pago: '2026-05-30',
      ciclo_actual: false
    }, { transaction });

    await transaction.commit();
    console.log('========================================================');
    console.log('  ACADEMIC CATALOG SEEDED SUCCESSFULLY');
    console.log('========================================================');
    console.log(' Universities: PUCMM, UTESA, UASD');
    console.log(' Careers: Ingeniería de Sistemas, Medicina, Derecho');
    console.log('========================================================');

    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('Failed to seed academic data:', error.message);
    process.exit(1);
  }
}

seedAcademicData();
