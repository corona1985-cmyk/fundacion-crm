const { sequelize, Persona, Padrino, InstitucionPublica, Aporte } = require('../src/models');

const officialAportesData = [
  { padrinoName: 'Tabacalera Palma', monto: 19300.00, fecha: '2024-01-09', ref: 'TRF-2024-001', obs: 'Transferencia recibida inscripción y 2do. cuatrimestre Víctor' },
  { padrinoName: 'Carlos Estrella', monto: 13000.00, fecha: '2024-02-01', ref: 'TRF-2024-002', obs: 'Transferencia recibida 2do. Cuatrimestre Caren' },
  { padrinoName: 'Dr. Luis Reynoso', monto: 56040.00, fecha: '2024-02-07', ref: 'TRF-2024-003', obs: 'Transferencia recibida 2do. Cuatrimestre Darleny, Melinda y Yadiel' },
  { padrinoName: 'Félix García', monto: 72920.00, fecha: '2024-03-05', ref: 'TRF-2024-004', obs: 'Transferencia recibida 2do. cuatrimestre Windy, Yarisbel, Liz y Kimberli' },
  { padrinoName: 'Tabacalera Palma', monto: 19300.00, fecha: '2024-03-05', ref: 'TRF-2024-005', obs: 'Transferencia recibida inscripción y 3er. cuatrimestre Víctor' },
  { instName: 'ARS Banreservas', monto: 50000.00, fecha: '2024-03-21', ref: 'TRF-2024-006', obs: 'Transferencia Recibida aporte ARS Reservas' },
  { padrinoName: 'Sandy Filpo', monto: 19200.00, fecha: '2024-05-05', ref: 'TRF-2024-007', obs: 'Transferencia recibida 2do. cuatrimestre Armando' },
  { padrinoName: 'Dr. Luis Reynoso', monto: 64100.00, fecha: '2024-06-06', ref: 'TRF-2024-008', obs: 'Transferencia recibida 3er. Cuatrimestre Darleny, Melinda y Yadiel' },
  { padrinoName: 'Tabacalera Palma', monto: 22400.00, fecha: '2024-06-13', ref: 'TRF-2024-009', obs: 'Transferencia recibida inscripción y 4to. cuatrimestre Víctor' },
  { instName: 'AFP Banreservas', monto: 75000.00, fecha: '2024-07-01', ref: 'TRF-2024-010', obs: 'Transferencia recibida aporte AFP Banreservas' },
  { padrinoName: 'Carlos Estrella', monto: 13000.00, fecha: '2024-08-05', ref: 'TRF-2024-011', obs: 'Transferencia recibida Caren mayo-agosto' },
  { padrinoName: 'Franklin Ureña', monto: 22560.00, fecha: '2024-08-12', ref: 'TRF-2024-012', obs: 'Transferencia recibida Mayo-Agosto' },
  { padrinoName: 'Deyvis Castillo', monto: 25000.00, fecha: '2025-01-15', ref: 'TRF-2025-001', obs: 'Aporte cuatrimestral Politécnico México y Rafaela Pérez' },
  { padrinoName: 'Gilberto Rodríguez', monto: 25000.00, fecha: '2025-01-20', ref: 'TRF-2025-002', obs: 'Aporte cuatrimestral Politécnico Ntra. Sra. de las Mercedes' },
  { padrinoName: 'Gustavo Plasencia', monto: 25000.00, fecha: '2025-01-25', ref: 'TRF-2025-003', obs: 'Aporte cuatrimestral UFE' }
];

async function importOfficialAportes() {
  console.log('===========================================================');
  console.log('  IMPORTING OFFICIAL REAL FINANCIAL APORTES & TRANSACTIONS');
  console.log('===========================================================');

  try {
    await sequelize.authenticate();

    let count = 0;

    for (const item of officialAportesData) {
      let padrinoId = null;
      let instId = null;

      if (item.padrinoName) {
        // Find or create Padrino
        let padrino = await Padrino.findOne({
          include: [{ model: Persona, as: 'persona' }],
          where: item.padrinoName.includes('Tabacalera') ? { razon_social: item.padrinoName } : undefined
        });

        if (!padrino) {
          const parts = item.padrinoName.split(' ');
          const nombre = parts[0];
          const apellido = parts.slice(1).join(' ') || 'Patrocinador';
          const cleanUser = `${nombre.toLowerCase()}.${apellido.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
          const email = `${cleanUser}@empresa.com`;

          const [persona] = await Persona.findOrCreate({
            where: { email },
            defaults: {
              nombre,
              apellido,
              cedula: `101-${Math.floor(1000000 + Math.random() * 9000000)}-0`,
              email,
              telefono: '809-555-7777',
              direccion: 'Santiago, R.D.'
            }
          });

          padrino = await Padrino.create({
            persona_id: persona.id,
            tipo: item.padrinoName.includes('Tabacalera') ? 'juridica' : 'natural',
            razon_social: item.padrinoName.includes('Tabacalera') ? item.padrinoName : null,
            monto_compromiso: 25000.00,
            frecuencia: 'cuatrimestral',
            forma_pago: 'transferencia',
            activo: true
          });
        }
        padrinoId = padrino.id;
      }

      if (item.instName) {
        const [inst] = await InstitucionPublica.findOrCreate({
          where: { nombre: item.instName },
          defaults: {
            nombre: item.instName,
            contacto: 'Dirección de Fondos',
            telefono: '809-500-0000',
            email: `contacto@${item.instName.toLowerCase().replace(/[^a-z0-9]/g, '')}.gob.do`,
            activo: true
          }
        });
        instId = inst.id;
      }

      await Aporte.create({
        padrino_id: padrinoId,
        institucion_id: instId,
        monto: item.monto,
        fecha_aporte: new Date(item.fecha),
        comprobante: item.ref,
        observaciones: item.obs
      });

      count++;
    }

    console.log(`Successfully created ${count} official financial aportes.`);
    console.log('===========================================================');
  } catch (err) {
    console.error('Error importing official aportes:', err);
  } finally {
    await sequelize.close();
  }
}

importOfficialAportes();
