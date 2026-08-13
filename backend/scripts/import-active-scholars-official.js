const { sequelize, Persona, Becario, Universidad, Carrera, Padrino } = require('../src/models');

const activeScholarsData = [
  // UTESA
  { name: 'Adriana De Peña Liriano', acum: 3.4, cuat: 3.4, mat: '1-25-2101', uni: 'UTESA', carrera: 'Enfermería', padrino: 'RP', phone: '809-555-3001' },
  { name: 'Ana Cristal Almonte Siri', acum: 3.5, cuat: 3.5, mat: '1-25-2085', uni: 'UTESA', carrera: 'Medicina', padrino: 'DR. CARLOS AGUSTIN TEJADA', phone: '809-555-3002' },
  { name: 'Ashley Mari Then Santos', acum: 3.7, cuat: 3.5, mat: '1-25-2742', uni: 'UTESA', carrera: 'Diseño de Interiores', padrino: 'RP', phone: '809-555-3003' },
  { name: 'Ashly Maria Zapata', acum: 3.5, cuat: 3.8, mat: '2-25-0272', uni: 'UTESA', carrera: 'Ingeniería en Sistemas Computacionales', padrino: 'RP', phone: '809-555-3004' },
  { name: 'Dariel Miguel Angel Estrella Jimenez', acum: 3.5, cuat: 3.7, mat: '1-25-2159', uni: 'UTESA', carrera: 'Ingeniería Civil', padrino: 'RP', phone: '809-555-3005' },
  { name: 'David Daniel Gonzalez Batista', acum: 3.9, cuat: 3.8, mat: '1-25-2067', uni: 'UTESA', carrera: 'Medicina', padrino: 'RP', phone: '809-555-3006' },
  { name: 'Diosmelin de la cruz duran', acum: 3.0, cuat: 3.0, mat: '1-25-2063', uni: 'UTESA', carrera: 'Administración de Empresas Turísticas y Hoteleras', padrino: 'RP', phone: '809-555-3007' },
  { name: 'Elias Rafael Vilorio de la cruz', acum: 3.8, cuat: 3.8, mat: '1-25-2219', uni: 'UTESA', carrera: 'Ingeniería Industrial', padrino: 'RP', phone: '809-555-3008' },
  { name: 'Emily Disairy Carela Almonte', acum: 3.3, cuat: 3.2, mat: '1-25-2564', uni: 'UTESA', carrera: 'Contaduría Pública', padrino: 'RP', phone: '809-555-3009' },
  { name: 'Freily Delvion Arias Severino', acum: 2.4, cuat: 2.3, mat: '1-25-2314', uni: 'UTESA', carrera: 'Ingeniería en Sistemas Computacionales', padrino: 'RP', phone: '809-555-3010', status: 'BAJO_INDICE' },
  { name: 'Grismely Altagracia Nuñez medrano', acum: 3.9, cuat: 4.0, mat: '1-25-2146', uni: 'UTESA', carrera: 'Mercadeo', padrino: 'RP', phone: '809-555-3011' },
  { name: 'Isabella Peña Casado', acum: 3.2, cuat: 3.2, mat: '1-25-2070', uni: 'UTESA', carrera: 'Lenguas Extranjeras', padrino: 'Deyvis Castillo', phone: '809-555-3012' },
  { name: 'Isamar Marcano Peña', acum: 3.9, cuat: 3.9, mat: '1-25-2292', uni: 'UTESA', carrera: 'Contaduría Pública', padrino: 'RP', phone: '809-555-3013' },
  { name: 'Isaura Grullon De La cruz', acum: 3.6, cuat: 3.8, mat: '1-25-0333', uni: 'UTESA', carrera: 'Derecho', padrino: 'RP', phone: '809-555-3014' },
  { name: 'Jeili Serrata Castro', acum: 3.6, cuat: 3.6, mat: '1-25-2165', uni: 'UTESA', carrera: 'Derecho', padrino: 'RP', phone: '809-555-3015' },
  { name: 'Josbel de Jesus Polanco Pichardo', acum: 3.4, cuat: 3.4, mat: '1-25-0423', uni: 'UTESA', carrera: 'Contaduría Pública', padrino: 'RP', phone: '809-555-3016' },
  { name: 'Juany Yileiny Almonte Taveras', acum: 3.5, cuat: 4.0, mat: '1-25-2997', uni: 'UTESA', carrera: 'Administración de Empresas Turísticas y Hoteleras', padrino: 'RP', phone: '809-555-3017' },
  { name: 'Lia Marie Peña Baez', acum: 3.8, cuat: 3.5, mat: '1-25-2056', uni: 'UTESA', carrera: 'Comunicación Social', padrino: 'RP', phone: '809-555-3018' },
  { name: 'Mariana Vargas Vargas', acum: 3.9, cuat: 4.0, mat: '1-25-2324', uni: 'UTESA', carrera: 'Medicina', padrino: 'RP', phone: '809-555-3019' },
  { name: 'Odalis Rodriguez Carela', acum: 3.5, cuat: 3.7, mat: '1-25-2278', uni: 'UTESA', carrera: 'Ingeniería en Sistemas Computacionales', padrino: 'RP', phone: '809-555-3020' },
  { name: 'Priscila del Carmen Torrez Sanchez', acum: 4.0, cuat: 4.0, mat: '1-25-2620', uni: 'UTESA', carrera: 'Medicina', padrino: 'RP', phone: '809-555-3021' },
  { name: 'Reidy Miguel Vera Meson', acum: 3.0, cuat: 2.8, mat: '1-25-2118', uni: 'UTESA', carrera: 'Contaduría Pública', padrino: 'RP', phone: '809-555-3022', status: 'BAJO_INDICE' },
  { name: 'Sirelys Rodriguez Acevedo', acum: 4.0, cuat: 4.0, mat: '1-25-2465', uni: 'UTESA', carrera: 'Nutrición Humana y Dietética', padrino: 'RP', phone: '809-555-3023' },
  { name: 'Vaiolette Almonte Rodriguez', acum: 3.6, cuat: 3.6, mat: '2-25-0256', uni: 'UTESA', carrera: 'Ingeniería Industrial', padrino: 'RP', phone: '809-555-3024' },
  { name: 'Veronica Rosario Alvares', acum: 3.5, cuat: 3.7, mat: '1-25-2667', uni: 'UTESA', carrera: 'Bioanálisis', padrino: 'RP', phone: '809-555-3025' },
  { name: 'Yenesi Flete Sanchez', acum: 3.3, cuat: 3.7, mat: '1-25-2231', uni: 'UTESA', carrera: 'Derecho', padrino: 'RP', phone: '809-555-3026' },
  { name: 'Yesly Lantigua Gomez', acum: 3.6, cuat: 3.6, mat: '1-25-2318', uni: 'UTESA', carrera: 'Medicina', padrino: 'RP', phone: '809-555-3027' },
  { name: 'Brendalys Del Carmen Pimentel', acum: 4.0, cuat: 4.0, mat: '1-26-0128', uni: 'UTESA', carrera: 'Arquitectura', padrino: 'RP', phone: '809-555-3028' },
  { name: 'Abel Henriquez', acum: 3.6, cuat: 3.6, mat: '1-26-0047', uni: 'UTESA', carrera: 'Ingeniería en Sistemas Computacionales', padrino: 'RP', phone: '809-555-3029' },

  // O&M
  { name: 'Nathalia Suero Perez', acum: 3.75, cuat: 3.66, mat: '25-SPSS-7-017', uni: 'OEM', carrera: 'Psicología Escolar', padrino: 'RP', phone: '809-484-2716' },
  { name: 'Oliver Guzman Estevez', acum: 3.76, cuat: 3.84, mat: '25-SPSM-7-012', uni: 'OEM', carrera: 'Psicología Clínica', padrino: 'RP', phone: '829-577-0224' },
  { name: 'Yatna Esteisy Meson Reyes', acum: 2.94, cuat: 2.95, mat: '25-SMRT-7-003', uni: 'OEM', carrera: 'Mercadotecnia', padrino: 'RP', phone: '829-879-8006', status: 'BAJO_INDICE' },
  { name: 'Lisbeth Rosanny Gomez Rodriguez', acum: 3.92, cuat: 3.90, mat: '24-SATM-7-014', uni: 'OEM', carrera: 'Administración de Empresas Turísticas y Hoteleras', padrino: 'RP', phone: '829-385-3659' },
  { name: 'Luis Angel Rodriguez Delgado', acum: null, cuat: null, mat: '24-SIIN-7-036', uni: 'OEM', carrera: 'Ingeniería Industrial', padrino: 'RP', phone: '849-655-3689', status: 'INACTIVO' },
  { name: 'Moises David Vargas Madera', acum: 3.64, cuat: 4.00, mat: '24-SISN-7-023', uni: 'OEM', carrera: 'Ingeniería de Sistemas y Computación', padrino: 'RP', phone: '829-974-1051' },
  { name: 'Caren Mosquea joaquin', acum: 3.63, cuat: 3.43, mat: '23-SATN-7-013', uni: 'OEM', carrera: 'Administración de Empresas Turísticas y Hoteleras', padrino: 'Carlos Estrella', phone: '849-707-2343' },

  // UNEV
  { name: 'Genesis Cruz Santos', acum: 3.83, cuat: 3.67, mat: '2024-1300057', uni: 'UNEV', carrera: 'Psicología', padrino: 'RP', phone: '809-555-4001' },

  // PUCMM
  { name: 'Karina Alexandra Santos Ramírez', acum: 3.80, cuat: 3.00, mat: 'KASR0002', uni: 'PUCMM', carrera: 'Medicina', padrino: 'Ministerio de la Juventud', phone: '849-279-8421' },
  { name: 'Ana Iris Mateo Marte', acum: 3.70, cuat: 4.00, mat: 'AIMM0001', uni: 'PUCMM', carrera: 'Educación', padrino: 'INAFOCAM', phone: '809-271-4034' },
  { name: 'Erick Miguel Páez Caba', acum: null, cuat: null, mat: 'EMPC0003', uni: 'PUCMM', carrera: 'Ingeniería Telemática', padrino: 'Ministerio de la Juventud', phone: '829-960-5933' },
  { name: 'Ángel De Jesús Valerio Collado', acum: 3.40, cuat: 2.90, mat: 'ADVC0002', uni: 'PUCMM', carrera: 'Ingeniería Mecánica', padrino: 'RP', phone: '829-393-5610' },
  { name: 'María Esther Martínez Diplán', acum: 3.80, cuat: 4.00, mat: 'MEMD0001', uni: 'PUCMM', carrera: 'Psicología', padrino: 'RP', phone: '849-879-1325' },
  { name: 'Zoe Lisbeth Morales Piña', acum: 3.60, cuat: 3.60, mat: 'ZLMP0001', uni: 'PUCMM', carrera: 'Ingeniería Telemática', padrino: 'RP', phone: '849-658-7470' },
  { name: 'Yugeiry del Carmen Canela Perez', acum: 3.70, cuat: 3.90, mat: 'YDCP0001', uni: 'PUCMM', carrera: 'Educación Biología y Química', padrino: 'RP', phone: '829-270-0019' },
  { name: 'Arisbely Cruz Polanco', acum: 3.80, cuat: 4.00, mat: 'AXCP0006', uni: 'PUCMM', carrera: 'Educación Biología y Química', padrino: 'RP', phone: '849-402-4351' }
];

async function importActiveScholars() {
  console.log('===========================================================');
  console.log('  IMPORTING ACTIVE SCHOLARS & REAL GPAs FROM REPORT DOCUMENT');
  console.log('===========================================================');

  try {
    await sequelize.authenticate();

    // Universities map
    const uniMap = {};
    const utesa = await Universidad.findOne({ where: { nombre: 'Universidad Tecnológica de Santiago (UTESA)' } });
    const pucmm = await Universidad.findOne({ where: { nombre: 'Pontificia Universidad Católica Madre y Maestra (PUCMM)' } });
    const oym = await Universidad.findOne({ where: { nombre: 'Universidad Dominicana O&M' } });

    let unev = await Universidad.findOne({ where: { nombre: 'Universidad Nacional Evangélica (UNEV)' } });
    if (!unev) {
      unev = await Universidad.create({
        nombre: 'Universidad Nacional Evangélica (UNEV)',
        direccion: 'Santiago',
        telefono: '809-221-7221',
        email_contacto: 'info@unev.edu.do'
      });
    }

    uniMap['UTESA'] = utesa.id;
    uniMap['PUCMM'] = pucmm.id;
    uniMap['OEM'] = oym.id;
    uniMap['UNEV'] = unev.id;

    let count = 0;

    for (const item of activeScholarsData) {
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
          cedula: `402-${Math.floor(1000000 + Math.random() * 9000000)}-${count % 10}`,
          email,
          telefono: item.phone,
          direccion: 'Santiago, R.D.'
        }
      });

      const uniId = uniMap[item.uni] || utesa.id;

      // Find or create Carrera
      let carrera = await Carrera.findOne({ where: { nombre: item.carrera } });
      if (!carrera) {
        carrera = await Carrera.create({
          universidad_id: uniId,
          nombre: item.carrera,
          duracion_ciclos: 12
        });
      }

      let estadoBeca = 'ACTIVA';
      if (item.status === 'INACTIVO') estadoBeca = 'CANCELADA';
      if (item.status === 'BAJO_INDICE') estadoBeca = 'SUSPENDIDA';

      await Becario.findOrCreate({
        where: { persona_id: persona.id },
        defaults: {
          persona_id: persona.id,
          universidad_id: uniId,
          carrera_id: carrera.id,
          centro_origen: 'Liceo / Politécnico Afiliado',
          fecha_seleccion: new Date('2025-01-10'),
          estado_beca: estadoBeca,
          ciclo_actual: 3,
          promedio_general: item.acum
        }
      });

      count++;
    }

    console.log(`Successfully imported ${count} active scholars with exact GPAs & matriculas.`);
    console.log('===========================================================');
  } catch (err) {
    console.error('Error importing active scholars:', err);
  } finally {
    await sequelize.close();
  }
}

importActiveScholars();
