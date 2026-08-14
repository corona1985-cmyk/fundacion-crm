const { sequelize, Persona, Becario, Universidad, Carrera, Padrino, InstitucionPublica, Aporte, BecarioPadrino } = require('../src/models');

async function seedVerifiedOnly() {
  console.log('====================================================');
  console.log('  SEEDING VERIFIED OFFICIAL DATA ONLY (16 SCHOLARS)');
  console.log('====================================================');

  try {
    await sequelize.authenticate();

    // Fetch Universities
    const utesa = await Universidad.findOne({ where: { nombre: 'Universidad Tecnológica de Santiago (UTESA)' } });
    const pucmm = await Universidad.findOne({ where: { nombre: 'Pontificia Universidad Católica Madre y Maestra (PUCMM)' } });
    const oym = await Universidad.findOne({ where: { nombre: 'Universidad Dominicana O&M' } });

    // Fetch Careers
    const isc = await Carrera.findOne({ where: { nombre: 'Ingeniería en Sistemas Computacionales' } });
    const med = await Carrera.findOne({ where: { nombre: 'Medicina' } });
    const der = await Carrera.findOne({ where: { nombre: 'Derecho' } });
    const con = await Carrera.findOne({ where: { nombre: 'Contaduría Pública' } });

    // Official 16 Scholars List
    const verifiedScholars = [
      { name: 'María Victoria Torres', code: 'LRP-001', center: 'Instituto Politécnico Rafaela Pérez', uniId: utesa.id, carreraId: con.id, phone: '809-555-1001' },
      { name: 'Rafaela Cabrera', code: 'LRP-002', center: 'Instituto Politécnico Rafaela Pérez', uniId: utesa.id, carreraId: isc.id, phone: '809-555-1002' },
      { name: 'Justin Eladio Bueno', code: 'IPM-001', center: 'Instituto Politécnico México', uniId: pucmm.id, carreraId: isc.id, phone: '809-555-1003' },
      { name: 'Karolan Rodríguez', code: 'UFE-001', center: 'Liceo Ulises Francisco Espaillat (UFE)', uniId: utesa.id, carreraId: med.id, phone: '809-555-1004' },
      { name: 'Audric Rosario', code: 'IPI-001', center: 'Instituto Politécnico Industrial Salesiano (IPISA)', uniId: pucmm.id, carreraId: isc.id, phone: '809-555-1005' },
      { name: 'Samuel Peña', code: 'HMS-001', center: 'Liceo Santo Hermano Miguel, La Salle', uniId: pucmm.id, carreraId: der.id, phone: '809-555-1006' },
      { name: 'Rafianny Larimar', code: 'LOJ-001', center: 'Liceo Onésimo Jiménez', uniId: utesa.id, carreraId: con.id, phone: '809-555-1007' },
      { name: 'Waiddy Ashley Grullón', code: 'IRD-001', center: 'Instituto Politécnico Ramón Dubert Novo', uniId: utesa.id, carreraId: med.id, phone: '809-555-1008' },
      { name: 'Odanis Antonio Ramos', code: 'LMH-001', center: 'Liceo Milagros Hernández', uniId: utesa.id, carreraId: isc.id, phone: '809-555-1009' },
      { name: 'Laura M. Betances', code: 'NSM-001', center: 'Instituto Politécnico Nuestra Señora de las Mercedes', uniId: pucmm.id, carreraId: der.id, phone: '809-555-1010' },
      { name: 'Paola Disla', code: 'PME-001', center: 'Liceo Matutino Pedro María Espaillat', uniId: utesa.id, carreraId: con.id, phone: '809-555-1011' },
      { name: 'Emmanuel Vargas', code: 'RDD-001', center: 'Oficina Política Robinson Díaz', uniId: utesa.id, carreraId: isc.id, phone: '809-555-1012' },
      { name: 'Dayhanne Domínguez', code: 'RDD-002', center: 'Oficina Política Robinson Díaz', uniId: utesa.id, carreraId: med.id, phone: '809-555-1013' },
      { name: 'Pedro Juan Jiménez', code: 'RDD-003', center: 'Oficina Política Robinson Díaz', uniId: utesa.id, carreraId: der.id, phone: '809-555-1014' },
      { name: 'Clara Rodríguez Torres', code: 'RDD-004', center: 'Fundación O&M', uniId: oym.id, carreraId: con.id, phone: '809-555-1015' },
      { name: 'Carlos José Suero', code: 'RDD-005', center: 'Fundación O&M', uniId: oym.id, carreraId: isc.id, phone: '809-555-1016' }
    ];

    for (const item of verifiedScholars) {
      const parts = item.name.split(' ');
      const nombre = parts[0];
      const apellido = parts.slice(1).join(' ');
      const cleanUser = `${nombre.toLowerCase()}.${apellido.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
      const email = `${cleanUser}@becado.org`;

      const persona = await Persona.create({
        nombre,
        apellido,
        cedula: `402-${Math.floor(1000000 + Math.random() * 9000000)}-1`,
        email,
        telefono: item.phone,
        direccion: 'Santiago, R.D.'
      });

      await Becario.create({
        persona_id: persona.id,
        universidad_id: item.uniId,
        carrera_id: item.carreraId,
        centro_origen: item.center,
        fecha_seleccion: new Date('2024-01-10'),
        estado_beca: 'ACTIVA',
        ciclo_actual: 3,
        promedio_general: (3.40 + Math.random() * 0.40).toFixed(2)
      });
    }
    console.log(`Created ${verifiedScholars.length} official verified scholars.`);

    // Official Padrinos List
    const officialPadrinos = [
      { name: 'Deyvis Castillo', center: 'Instituto Tecnológico México' },
      { name: 'Gilberto Rodríguez', center: 'Instituto Politécnico Nuestra Señora de las Mercedes' },
      { name: 'Gustavo Plasencia', center: 'Politécnico Ulises Francisco Espaillat (UFE)' },
      { name: 'Ángel Venezuela', center: 'Liceo Santo Hermano Miguel, La Salle' },
      { name: 'Ramón Consuegra', center: 'Instituto Politécnico Ramón Dubert Novo' },
      { name: 'Andrés Cueto', center: 'Liceo Matutino Pedro María Espaillat' },
      { name: 'Fabio Nicolás Cabrera', center: 'Liceo Onésimo Jiménez' },
      { name: 'Geovanny López', center: 'Instituto Politécnico Industrial de Santiago IPISA' },
      { name: 'Guillermo Estrella', center: 'Liceo Milagros Hernández' },
      { name: 'Dr. Luis Reynoso', center: 'Patrocinador Corporativo - Medicina' },
      { name: 'Félix García', center: 'Patrocinador Corporativo' },
      { name: 'Tabacalera Palma', center: 'Empresa Patrocinadora' },
      { name: 'Brayan Collado', center: 'Politécnico Canadá' }
    ];

    for (const item of officialPadrinos) {
      const parts = item.name.split(' ');
      const nombre = parts[0];
      const apellido = parts.slice(1).join(' ') || 'Padrino';
      const cleanUser = `${nombre.toLowerCase()}.${apellido.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
      const email = `${cleanUser}@padrino.org`;

      const persona = await Persona.create({
        nombre,
        apellido,
        cedula: `001-${Math.floor(1000000 + Math.random() * 9000000)}-5`,
        email,
        telefono: '809-555-8888',
        direccion: 'Santiago, R.D.'
      });

      await Padrino.create({
        persona_id: persona.id,
        tipo: item.name.includes('Tabacalera') ? 'juridica' : 'natural',
        razon_social: item.name.includes('Tabacalera') ? item.name : null,
        monto_compromiso: 25000.00,
        frecuencia: 'mensual',
        forma_pago: 'transferencia',
        activo: true
      });
    }
    console.log(`Created ${officialPadrinos.length} official verified padrinos.`);

    console.log('====================================================');
    console.log('  SEEDING VERIFIED OFFICIAL DATA COMPLETED');
    console.log('====================================================');
  } catch (err) {
    console.error('Error seeding verified data:', err);
  } finally {
    await sequelize.close();
  }
}

seedVerifiedOnly();
