const { sequelize, Persona, Becario, Universidad, Carrera } = require('../src/models');

const newScholars = [
  { name: 'Ruth Esther Bueno St Fleur', uniSigla: 'UTESA', carreraName: 'Medicina' },
  { name: 'Keisy Maria Soto de Leon', uniSigla: 'UTESA', carreraName: 'Derecho' },
  { name: 'Genesis Johanny Rodriguez', uniSigla: 'UTESA', carreraName: 'Mercadeo' },
  { name: 'Hansel Marcelino López', uniSigla: 'UTESA', carreraName: 'Ingeniería en Sistemas Computacionales' },
  { name: 'Angel Miguel Castillo Romero', uniSigla: 'UTESA', carreraName: 'Educación, mención Ciencias Sociales' },
  { name: 'Irainy Céspedes García', uniSigla: 'UTESA', carreraName: 'Lenguas Extranjeras' },
  { name: 'Lissette María Martínez Caba', uniSigla: 'UTESA', carreraName: 'Psicología Clínica' },
  { name: 'Astrid Yamil Castillo Cruz', uniSigla: 'UTESA', carreraName: 'Contaduría Pública' },
  { name: 'Dariely Genao Morales', uniSigla: 'UTESA', carreraName: 'Marketing' },
  { name: 'Helen Marie Uceta Rodríguez', uniSigla: 'PUCMM', carreraName: 'Negocios Internacionales' },
  { name: 'Melany Chantelle Mercedes Salvador', uniSigla: 'UTESA', carreraName: 'Medicina' },
  { name: 'Emely Crisbell Abreu Ortiz', uniSigla: 'UTESA', carreraName: 'Medicina' },
  { name: 'Emely María Rodríguez Ramírez', uniSigla: 'UTESA', carreraName: 'Medicina' },
  { name: 'Ramón Cruz Mejía', uniSigla: 'UTESA', carreraName: 'Medicina' },
  { name: 'Mayelin Maria Vargas Jiménez', uniSigla: 'UTESA', carreraName: 'Ingeniería Civil' },
  { name: 'Kiara Torres Rodriguez', uniSigla: 'UTESA', carreraName: 'Ingeniería Civil' },
  { name: 'Sheila Anae Díaz Vargas', uniSigla: 'UTESA', carreraName: 'Ingeniería Civil' },
  { name: 'Marina Camila Nazarre Peña', uniSigla: 'UTESA', carreraName: 'Lenguas Extranjeras' },
  { name: 'Arianny Guzmán Díaz', uniSigla: 'UTESA', carreraName: 'Medicina' },
  { name: 'Daniel Sarita Peña', uniSigla: 'UTESA', carreraName: 'Ingeniería Eléctrica' },
  { name: 'Chanell Alexandra Emiliana Almarante Jiménez', uniSigla: 'UTESA', carreraName: 'Marketing Digital' },
  { name: 'Rosa Adela Jiménez Custodio', uniSigla: 'UTESA', carreraName: 'Ingeniería Ambiental' },
  { name: 'Zoe Cavaliere Familia', uniSigla: 'UTESA', carreraName: 'Odontología' },
  { name: 'Rosibel Del Carmen García Genao', uniSigla: 'UTESA', carreraName: 'Marketing' },
  { name: 'Lorena Rodríguez Rubiera', uniSigla: 'UTESA', carreraName: 'Psicología' },
  { name: 'Dariel Diaz', uniSigla: 'UTESA', carreraName: 'Lenguas Modernas' },
  { name: 'Yoanny Peralta', uniSigla: 'UTESA', carreraName: 'Administración de Empresas' }
];

async function importNewScholars() {
  console.log('====================================================');
  console.log('  IMPORTING 27 NEW SCHOLARS FROM IMAGE (NO GPA YET)');
  console.log('====================================================');

  try {
    await sequelize.authenticate();

    // Map Universities
    const uniMap = {};
    const utesa = await Universidad.findOne({ where: { nombre: 'Universidad Tecnológica de Santiago (UTESA)' } });
    const pucmm = await Universidad.findOne({ where: { nombre: 'Pontificia Universidad Católica Madre y Maestra (PUCMM)' } });
    uniMap['UTESA'] = utesa ? utesa.id : 1;
    uniMap['PUCMM'] = pucmm ? pucmm.id : 2;

    let createdCount = 0;

    for (const item of newScholars) {
      const parts = item.name.trim().split(/\s+/);
      const nombre = parts[0];
      const apellido = parts.slice(1).join(' ') || 'Estudiante';
      const cleanUser = `${nombre.toLowerCase()}.${apellido.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
      const email = `${cleanUser}@becado.org`;

      const [persona] = await Persona.findOrCreate({
        where: { email },
        defaults: {
          nombre,
          apellido,
          cedula: `402-${Math.floor(1000000 + Math.random() * 9000000)}-${createdCount % 10}`,
          email,
          telefono: '809-555-' + String(2000 + createdCount).padStart(4, '0'),
          direccion: 'Santiago, R.D.'
        }
      });

      const uniId = uniMap[item.uniSigla] || utesa.id;

      // Find or create Carrera
      let carrera = await Carrera.findOne({ where: { nombre: item.carreraName } });
      if (!carrera) {
        carrera = await Carrera.create({
          universidad_id: uniId,
          nombre: item.carreraName,
          duracion_ciclos: 12
        });
      }

      const [becario, created] = await Becario.findOrCreate({
        where: { persona_id: persona.id },
        defaults: {
          persona_id: persona.id,
          universidad_id: uniId,
          carrera_id: carrera.id,
          centro_origen: 'Politécnico / Liceo de Origen 2026',
          fecha_seleccion: new Date('2026-08-01'),
          estado_beca: 'ACTIVA',
          ciclo_actual: 0,
          promedio_general: null
        }
      });

      if (created) createdCount++;
    }

    console.log(`Successfully created ${createdCount} new scholars without GPA (Nuevo Ingreso).`);
    console.log('====================================================');
  } catch (err) {
    console.error('Error importing new scholars:', err);
  } finally {
    await sequelize.close();
  }
}

importNewScholars();
