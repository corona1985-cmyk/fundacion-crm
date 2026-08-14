const { sequelize, Persona, Becario, Universidad, Carrera } = require('../src/models');

const newScholarsWithGraduations = [
  {
    name: 'Ruth Esther Bueno St Fleur',
    centro: 'Instituto Politécnico Ramón Dubert Novo',
    graduacion: 'Graduados',
    doc: 'Documento de solicitud de beca creado',
    uniSigla: 'UTESA',
    carreraName: 'Medicina'
  },
  {
    name: 'Keisy Maria Soto de Leon',
    centro: 'Instituto Politécnico Ramón Dubert Novo',
    graduacion: 'Graduados',
    doc: 'Documento de solicitud de beca creado',
    uniSigla: 'UTESA',
    carreraName: 'Derecho'
  },
  {
    name: 'Hansel Marcelino López',
    centro: 'Politécnico Canadá',
    graduacion: 'Agendado 14 de agosto, 4:00 PM',
    doc: 'Documento de solicitud de beca creado',
    uniSigla: 'UTESA',
    carreraName: 'Ingeniería en Sistemas Computacionales'
  },
  {
    name: 'Angel Miguel Castillo Romero',
    centro: 'Politécnico Milagros Hernández',
    graduacion: 'Mensaje enviado',
    doc: 'Documento de solicitud de beca creado',
    uniSigla: 'UTESA',
    carreraName: 'Educación, mención Ciencias Sociales'
  },
  {
    name: 'Irainy Céspedes García',
    centro: 'Politécnico Braulio Paulino',
    graduacion: 'Agendado en Sep, con fecha',
    doc: 'Documento de solicitud de beca creado',
    uniSigla: 'UTESA',
    carreraName: 'Lenguas Extranjeras'
  },
  {
    name: 'Lissette María Martínez Caba',
    centro: 'Politécnico Mercedes Peña',
    graduacion: 'Graduados',
    doc: 'Documento de solicitud de beca creado',
    uniSigla: 'UTESA',
    carreraName: 'Psicología Clínica'
  },
  {
    name: 'Astrid Yamil Castillo Cruz',
    centro: 'Instituto Politécnico Nuestra Señora de las Mercedes',
    graduacion: 'Graduados',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Contaduría Pública'
  },
  {
    name: 'Dariely Genao Morales',
    centro: 'Politécnico Profesora Mercedes Altagracia Cabral De León',
    graduacion: 'Graduados',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Marketing'
  },
  {
    name: 'Genesis Johanny Rodriguez',
    centro: 'Politécnico Profesora Mercedes Altagracia Cabral De León',
    graduacion: 'Graduados',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Mercadeo'
  },
  {
    name: 'Helen Marie Uceta Rodríguez',
    centro: 'Centro educativo San Francisco de Asís',
    graduacion: 'Graduados',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'PUCMM',
    carreraName: 'Negocios Internacionales'
  },
  {
    name: 'Melany Chantelle Mercedes Salvador',
    centro: 'Politécnico Maria Luisa Crisostomo',
    graduacion: 'Mensaje enviado',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Medicina'
  },
  {
    name: 'Emely Crisbell Abreu Ortiz',
    centro: 'Politécnico Padre Zegrí',
    graduacion: 'Graduados',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Medicina'
  },
  {
    name: 'Emely María Rodríguez Ramírez',
    centro: 'Politécnico Profesora Rafaela Pérez',
    graduacion: 'Graduados',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Medicina'
  },
  {
    name: 'Ramón Cruz Mejía',
    centro: 'Politécnico Martina Mercedes Zouain',
    graduacion: 'NO HACEN GRADUACIONES',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Medicina'
  },
  {
    name: 'Mayelin Maria Vargas Jiménez',
    centro: 'Liceo José Antonio Paulino',
    graduacion: 'Graduados',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Ingeniería Civil'
  },
  {
    name: 'Kiara Torres Rodriguez',
    centro: 'Instituto Politécnico Industrial de Santiago IPISA',
    graduacion: 'Agendado, 16 de octubre',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Ingeniería Civil'
  },
  {
    name: 'Lucy María Rojas Grullón',
    centro: 'Politécnico Ramona Altagracia Tejada Marte',
    graduacion: 'Mensaje enviado',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Educación'
  },
  {
    name: 'Sheila Anae Díaz Vargas',
    centro: 'Liceo Pedro María Espaillat',
    graduacion: 'Graduados',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Ingeniería Civil'
  },
  {
    name: 'Marina Camila Nazarre Peña',
    centro: 'Politécnico Maestra Elsa Brito de Domínguez',
    graduacion: 'Agendado viernes 28 de agost, sin hora',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Lenguas Extranjeras'
  },
  {
    name: 'Arianny Guzmán Díaz',
    centro: 'Liceo Esperanza Milena Martínez',
    graduacion: 'Agendado en agosto, sin fecha',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Medicina'
  },
  {
    name: 'Daniel Sarita Peña',
    centro: 'Politécnico Ulises Francisco Espaillat (UFE)',
    graduacion: 'Agendado en agosto 29, sin hora',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Ingeniería Eléctrica'
  },
  {
    name: 'Chanell Alexandra Emiliana Almarante Jiménez',
    centro: 'Instituto Politécnico Industrial Don Bosco',
    graduacion: 'Agendado para octubre',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Marketing Digital'
  },
  {
    name: 'Rosa Adela Jiménez Custodio',
    centro: 'Instituto Tecnológico México',
    graduacion: 'Mensaje enviado',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Ingeniería Ambiental'
  },
  {
    name: 'Zoe Cavaliere Familia',
    centro: 'Instituto Politécnico La esperanza',
    graduacion: 'Agendado para el 30 de agosto',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Odontología'
  },
  {
    name: 'Rosibel Del Carmen García Genao',
    centro: 'Liceo Onésimo Jiménez',
    graduacion: 'Agendado agosto 29',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Marketing'
  },
  {
    name: 'Lorena Rodríguez Rubiera',
    centro: 'Liceo Escuela Santo Hermano Miguel',
    graduacion: 'Graduados',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Psicología'
  },
  {
    name: 'Dariel Diaz',
    centro: 'Politécnico Rafaela Marrero Paulino',
    graduacion: 'Graduados',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Lenguas Modernas'
  },
  {
    name: 'Yoanny Peralta',
    centro: 'Politécnico Profesor Miguel Ángel Guzmán',
    graduacion: 'Graduados',
    doc: 'Documento de solicitud de beca Creado',
    uniSigla: 'UTESA',
    carreraName: 'Administración de Empresas'
  }
];

async function importNewScholarsWithGraduations() {
  console.log('========================================================================');
  console.log('  UPDATING 2026 SCHOLARS WITH HIGH SCHOOL OF ORIGIN & GRADUATION EVENTS');
  console.log('========================================================================');

  try {
    await sequelize.authenticate();

    // Map Universities
    const uniMap = {};
    const utesa = await Universidad.findOne({ where: { nombre: 'Universidad Tecnológica de Santiago (UTESA)' } });
    const pucmm = await Universidad.findOne({ where: { nombre: 'Pontificia Universidad Católica Madre y Maestra (PUCMM)' } });
    uniMap['UTESA'] = utesa ? utesa.id : 1;
    uniMap['PUCMM'] = pucmm ? pucmm.id : 2;

    let updatedCount = 0;

    for (const item of newScholarsWithGraduations) {
      const cleanName = item.name.replace(/\.$/, '').trim();
      const parts = cleanName.split(/\s+/);
      const nombre = parts[0];
      const apellido = parts.slice(1).join(' ') || 'Estudiante';
      const cleanUser = `${nombre.toLowerCase()}.${apellido.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
      const email = `${cleanUser}@becado.org`;

      const [persona] = await Persona.findOrCreate({
        where: { email },
        defaults: {
          nombre,
          apellido,
          cedula: `402-${Math.floor(1000000 + Math.random() * 9000000)}-${updatedCount % 10}`,
          email,
          telefono: '809-555-' + String(2000 + updatedCount).padStart(4, '0'),
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

      let becario = await Becario.findOne({ where: { persona_id: persona.id } });
      if (!becario) {
        becario = await Becario.create({
          persona_id: persona.id,
          universidad_id: uniId,
          carrera_id: carrera.id,
          centro_origen: item.centro,
          fecha_seleccion: new Date('2026-08-01'),
          estado_beca: 'ACTIVA',
          ciclo_actual: 0,
          promedio_general: null,
          estado_graduacion_liceo: item.graduacion,
          documento_solicitud: item.doc
        });
      } else {
        await becario.update({
          centro_origen: item.centro,
          estado_graduacion_liceo: item.graduacion,
          documento_solicitud: item.doc
        });
      }

      updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} scholars with high school origins & graduation tracking.`);
    console.log('========================================================================');
  } catch (err) {
    console.error('Error updating scholars graduations:', err);
  } finally {
    await sequelize.close();
  }
}

importNewScholarsWithGraduations();
