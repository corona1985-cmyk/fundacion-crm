import { loadStore } from '../api/dataStore';
import { downloadBlob, formatMoney, personName, todayStamp } from './downloadFile';
import { SimplePdf } from './simplePdf';

const RATES_MAP = {
  UTESA: { costPerCredit: 720, inscripcion: 2300, servicios: 1200, laboratorio: 800 },
  OYM: { costPerCredit: 757.89, inscripcion: 1000, servicios: 0, laboratorio: 800 },
  PUCMM: { costPerCredit: 1500, inscripcion: 3500, servicios: 1500, laboratorio: 1000 },
  UNEV: { costPerCredit: 650, inscripcion: 2000, servicios: 1000, laboratorio: 500 }
};

const SUBJECTS_MAP = {
  'Ingenieria Industrial': {
    c1: [
      { clave: 'MAT-100', nombre: 'Matematica I', creditos: 4, monto: 3200 },
      { clave: 'FIS-100', nombre: 'Fisica I', creditos: 4, monto: 3400 },
      { clave: 'IND-101', nombre: 'Introduccion a la Ing. Industrial', creditos: 3, monto: 2800 },
      { clave: 'QUI-100', nombre: 'Quimica General', creditos: 4, monto: 3400 },
      { clave: 'ING-115', nombre: 'Ingles I', creditos: 0, monto: 0 },
      { clave: 'ADM-100', nombre: 'Principios de Administracion', creditos: 4, monto: 4460 }
    ],
    c2: [
      { clave: 'MAT-101', nombre: 'Calculo I', creditos: 4, monto: 3400 },
      { clave: 'FIS-101', nombre: 'Fisica II y Laboratorio', creditos: 4, monto: 3600 },
      { clave: 'IND-102', nombre: 'Dibujo Industrial y CAD', creditos: 3, monto: 3200 },
      { clave: 'ING-125', nombre: 'Ingles II', creditos: 0, monto: 0 },
      { clave: 'IND-103', nombre: 'Procesos de Manufactura I', creditos: 4, monto: 3800 },
      { clave: 'EST-100', nombre: 'Estadistica General', creditos: 4, monto: 3260 }
    ]
  },
  'Administracion de Empresas': {
    c1: [
      { clave: 'ADM-101', nombre: 'Fundamentos de Administracion', creditos: 4, monto: 3400 },
      { clave: 'CON-100', nombre: 'Contabilidad General I', creditos: 4, monto: 3400 },
      { clave: 'ECO-100', nombre: 'Principios de Economia', creditos: 3, monto: 2800 },
      { clave: 'MAT-105', nombre: 'Matematica Financiera', creditos: 4, monto: 3400 },
      { clave: 'ING-115', nombre: 'Ingles I', creditos: 0, monto: 0 },
      { clave: 'MER-100', nombre: 'Mercadotecnia I', creditos: 3, monto: 5520 }
    ],
    c2: [
      { clave: 'ADM-102', nombre: 'Administracion de Recursos Humanos', creditos: 4, monto: 3400 },
      { clave: 'CON-101', nombre: 'Contabilidad de Costos', creditos: 4, monto: 3400 },
      { clave: 'ECO-101', nombre: 'Microeconomia', creditos: 3, monto: 2800 },
      { clave: 'ING-125', nombre: 'Ingles II', creditos: 0, monto: 0 },
      { clave: 'FIN-100', nombre: 'Analisis Financiero', creditos: 4, monto: 3800 },
      { clave: 'DER-100', nombre: 'Derecho Comercial', creditos: 3, monto: 3200 }
    ]
  },
  Mercadeo: {
    c1: [
      { clave: 'MER-101', nombre: 'Fundamentos de Mercadotecnia', creditos: 4, monto: 3400 },
      { clave: 'COM-100', nombre: 'Comunicacion y Comportamiento', creditos: 4, monto: 3400 },
      { clave: 'ADM-100', nombre: 'Principios de Administracion', creditos: 3, monto: 2800 },
      { clave: 'MAT-100', nombre: 'Matematica Aplicada', creditos: 4, monto: 3200 },
      { clave: 'ING-115', nombre: 'Ingles I', creditos: 0, monto: 0 },
      { clave: 'DIS-100', nombre: 'Diseno Publicitario', creditos: 4, monto: 4310 }
    ],
    c2: [
      { clave: 'MER-201', nombre: 'Investigacion de Mercados', creditos: 4, monto: 3600 },
      { clave: 'MER-202', nombre: 'Estrategias de Precios', creditos: 4, monto: 3400 },
      { clave: 'DIG-100', nombre: 'Marketing Digital', creditos: 3, monto: 3000 },
      { clave: 'ING-125', nombre: 'Ingles II', creditos: 0, monto: 0 },
      { clave: 'MER-203', nombre: 'Gestion de Marcas', creditos: 4, monto: 3800 },
      { clave: 'EST-100', nombre: 'Estadistica Comercial', creditos: 3, monto: 3310 }
    ]
  },
  Medicina: {
    c1: [
      { clave: 'MED-101', nombre: 'Anatomia Humana I', creditos: 5, monto: 4200 },
      { clave: 'MED-102', nombre: 'Histologia y Embriologia', creditos: 4, monto: 3600 },
      { clave: 'QUI-105', nombre: 'Bioquimica Medica I', creditos: 4, monto: 3600 },
      { clave: 'MED-103', nombre: 'Introduccion a la Salud Publica', creditos: 3, monto: 2600 },
      { clave: 'ING-115', nombre: 'Ingles Medico I', creditos: 0, monto: 0 },
      { clave: 'BIO-100', nombre: 'Biologia Celular y Genetica', creditos: 4, monto: 4280 }
    ],
    c2: [
      { clave: 'MED-201', nombre: 'Anatomia Humana II', creditos: 5, monto: 4500 },
      { clave: 'MED-202', nombre: 'Fisiologia Medica I', creditos: 5, monto: 4500 },
      { clave: 'MED-203', nombre: 'Microbiologia y Parasitologia', creditos: 4, monto: 3800 },
      { clave: 'ING-125', nombre: 'Ingles Medico II', creditos: 0, monto: 0 },
      { clave: 'MED-204', nombre: 'Farmacologia General', creditos: 4, monto: 3820 }
    ]
  },
  'Ingenieria Civil': {
    c1: [
      { clave: 'CIV-101', nombre: 'Introduccion a la Ing. Civil', creditos: 3, monto: 2800 },
      { clave: 'MAT-101', nombre: 'Calculo I', creditos: 4, monto: 3400 },
      { clave: 'FIS-101', nombre: 'Fisica I y Laboratorio', creditos: 4, monto: 3600 },
      { clave: 'QUI-100', nombre: 'Quimica para Ingenieros', creditos: 4, monto: 3400 },
      { clave: 'ING-115', nombre: 'Ingles Tecnico I', creditos: 0, monto: 0 },
      { clave: 'DIB-101', nombre: 'Dibujo Topografico y CAD', creditos: 3, monto: 4570 }
    ],
    c2: [
      { clave: 'CIV-201', nombre: 'Estatica y Estructuras I', creditos: 4, monto: 3600 },
      { clave: 'CIV-202', nombre: 'Topografia y Practica', creditos: 4, monto: 3800 },
      { clave: 'MAT-102', nombre: 'Calculo II', creditos: 4, monto: 3400 },
      { clave: 'ING-125', nombre: 'Ingles Tecnico II', creditos: 0, monto: 0 },
      { clave: 'GEO-101', nombre: 'Geologia Aplicada', creditos: 3, monto: 3000 },
      { clave: 'MAT-103', nombre: 'Ecuaciones Diferenciales', creditos: 3, monto: 3970 }
    ]
  },
  'Ingenieria Electrica': {
    c1: [
      { clave: 'ELE-101', nombre: 'Circuitos Electricos I', creditos: 4, monto: 3600 },
      { clave: 'MAT-101', nombre: 'Calculo I', creditos: 4, monto: 3400 },
      { clave: 'FIS-101', nombre: 'Fisica Electromagnetica', creditos: 4, monto: 3600 },
      { clave: 'ING-115', nombre: 'Ingles Tecnico I', creditos: 0, monto: 0 },
      { clave: 'LAB-800', nombre: 'Lab. Especializado Electricidad', creditos: 1, monto: 800 },
      { clave: 'ELE-102', nombre: 'Electronica Basica', creditos: 4, monto: 5860 }
    ],
    c2: [
      { clave: 'ELE-201', nombre: 'Circuitos Electricos II', creditos: 4, monto: 3800 },
      { clave: 'ELE-202', nombre: 'Maquinaria Electrica I', creditos: 4, monto: 3800 },
      { clave: 'MAT-102', nombre: 'Calculo II', creditos: 4, monto: 3400 },
      { clave: 'LAB-800', nombre: 'Lab. Avanzado Potencia', creditos: 1, monto: 800 },
      { clave: 'ING-125', nombre: 'Ingles Tecnico II', creditos: 0, monto: 0 },
      { clave: 'ELE-203', nombre: 'Instalaciones Electricas Industriales', creditos: 4, monto: 5460 }
    ]
  },
  Derecho: {
    c1: [
      { clave: 'DER-101', nombre: 'Introduccion al Estudio del Derecho', creditos: 4, monto: 3200 },
      { clave: 'DER-102', nombre: 'Derecho Civil I', creditos: 4, monto: 3400 },
      { clave: 'DER-103', nombre: 'Derecho Constitucional Dominicano', creditos: 3, monto: 2800 },
      { clave: 'HIS-100', nombre: 'Historia del Derecho', creditos: 3, monto: 2600 },
      { clave: 'ING-115', nombre: 'Ingles Juridico I', creditos: 0, monto: 0 },
      { clave: 'SOC-100', nombre: 'Sociologia Juridica', creditos: 3, monto: 3400 }
    ],
    c2: [
      { clave: 'DER-201', nombre: 'Derecho Penal General', creditos: 4, monto: 3600 },
      { clave: 'DER-202', nombre: 'Derecho Civil II', creditos: 4, monto: 3600 },
      { clave: 'DER-203', nombre: 'Derecho Procesal Civil I', creditos: 4, monto: 3400 },
      { clave: 'ING-125', nombre: 'Ingles Juridico II', creditos: 0, monto: 0 },
      { clave: 'DER-204', nombre: 'Derecho Laboral I', creditos: 3, monto: 3200 },
      { clave: 'DER-205', nombre: 'Derecho Comercial y Sociedades', creditos: 3, monto: 3000 }
    ]
  },
  'Ingenieria en Sistemas': {
    c1: [
      { clave: 'INF-101', nombre: 'Introduccion a la Programacion', creditos: 4, monto: 3400 },
      { clave: 'MAT-101', nombre: 'Calculo I', creditos: 4, monto: 3400 },
      { clave: 'FIS-101', nombre: 'Fisica General y Lab.', creditos: 4, monto: 3400 },
      { clave: 'INF-102', nombre: 'Estructuras de Datos', creditos: 3, monto: 2800 },
      { clave: 'ING-115', nombre: 'Ingles Tecnico I', creditos: 0, monto: 0 },
      { clave: 'ADM-102', nombre: 'Sistemas de Informacion Gerencial', creditos: 4, monto: 4260 }
    ],
    c2: [
      { clave: 'INF-201', nombre: 'Programacion Orientada a Objetos', creditos: 4, monto: 3600 },
      { clave: 'INF-202', nombre: 'Bases de Datos I', creditos: 4, monto: 3600 },
      { clave: 'MAT-102', nombre: 'Algebra Lineal', creditos: 3, monto: 2800 },
      { clave: 'INF-203', nombre: 'Redes de Computadoras I', creditos: 4, monto: 3800 },
      { clave: 'ING-125', nombre: 'Ingles Tecnico II', creditos: 0, monto: 0 },
      { clave: 'INF-204', nombre: 'Sistemas Operativos', creditos: 4, monto: 3460 }
    ]
  },
  Bioanalisis: {
    c1: [
      { clave: 'BIO-101', nombre: 'Quimica Clinica I', creditos: 4, monto: 3400 },
      { clave: 'BIO-102', nombre: 'Hematologia General y Lab.', creditos: 4, monto: 3600 },
      { clave: 'QUI-100', nombre: 'Quimica Organica', creditos: 4, monto: 3400 },
      { clave: 'ING-115', nombre: 'Ingles I', creditos: 0, monto: 0 },
      { clave: 'BIO-103', nombre: 'Micologia y Bacteriologia', creditos: 4, monto: 4800 }
    ],
    c2: [
      { clave: 'BIO-201', nombre: 'Quimica Clinica II', creditos: 4, monto: 3600 },
      { clave: 'BIO-202', nombre: 'Inmunologia y Serologia', creditos: 4, monto: 3800 },
      { clave: 'BIO-203', nombre: 'Parasitologia Medica', creditos: 4, monto: 3600 },
      { clave: 'ING-125', nombre: 'Ingles II', creditos: 0, monto: 0 },
      { clave: 'BIO-204', nombre: 'Analisis de Fluidos Corporales', creditos: 4, monto: 4200 }
    ]
  },
  Psicologia: {
    c1: [
      { clave: 'PSI-101', nombre: 'Introduccion a la Psicologia', creditos: 4, monto: 3200 },
      { clave: 'PSI-102', nombre: 'Psicologia del Desarrollo I', creditos: 4, monto: 3400 },
      { clave: 'PSI-103', nombre: 'Biopsicologia', creditos: 3, monto: 2800 },
      { clave: 'ING-115', nombre: 'Ingles I', creditos: 0, monto: 0 },
      { clave: 'PSI-104', nombre: 'Teorias de la Personalidad', creditos: 4, monto: 4400 }
    ],
    c2: [
      { clave: 'PSI-201', nombre: 'Psicopatologia General', creditos: 4, monto: 3600 },
      { clave: 'PSI-202', nombre: 'Psicometria y Evaluacion I', creditos: 4, monto: 3600 },
      { clave: 'PSI-203', nombre: 'Psicologia Social', creditos: 3, monto: 3000 },
      { clave: 'ING-125', nombre: 'Ingles II', creditos: 0, monto: 0 },
      { clave: 'PSI-204', nombre: 'Psicologia Clinica y de la Salud', creditos: 4, monto: 3800 }
    ]
  },
  Arquitectura: {
    c1: [
      { clave: 'ARQ-101', nombre: 'Diseno Arquitectonico I', creditos: 5, monto: 4500 },
      { clave: 'ARQ-102', nombre: 'Geometria Descriptiva', creditos: 4, monto: 3600 },
      { clave: 'ARQ-103', nombre: 'Historia del Arte y la Arq.', creditos: 3, monto: 2800 },
      { clave: 'ING-115', nombre: 'Ingles Tecnico I', creditos: 0, monto: 0 },
      { clave: 'ARQ-104', nombre: 'Expresion Grafica y Bocetos', creditos: 4, monto: 4360 }
    ],
    c2: [
      { clave: 'ARQ-201', nombre: 'Diseno Arquitectonico II', creditos: 5, monto: 4800 },
      { clave: 'ARQ-202', nombre: 'Sistemas Estructurales I', creditos: 4, monto: 3800 },
      { clave: 'ARQ-203', nombre: 'Materiales y Construccion', creditos: 4, monto: 3600 },
      { clave: 'ING-125', nombre: 'Ingles Tecnico II', creditos: 0, monto: 0 },
      { clave: 'ARQ-204', nombre: 'Modelado 3D y Renderizado', creditos: 3, monto: 3260 }
    ]
  },
  Educacion: {
    c1: [
      { clave: 'EDU-101', nombre: 'Fundamentos de la Educacion', creditos: 4, monto: 3200 },
      { clave: 'EDU-102', nombre: 'Psicologia Educativa', creditos: 4, monto: 3200 },
      { clave: 'EDU-103', nombre: 'Didactica General', creditos: 3, monto: 2600 },
      { clave: 'ING-115', nombre: 'Ingles I', creditos: 0, monto: 0 },
      { clave: 'EDU-104', nombre: 'Lengua Espanola y Literatura', creditos: 4, monto: 5080 }
    ],
    c2: [
      { clave: 'EDU-201', nombre: 'Planificacion y Evaluacion Escolar', creditos: 4, monto: 3400 },
      { clave: 'EDU-202', nombre: 'Tecnologia Educativa y Medios', creditos: 3, monto: 3000 },
      { clave: 'EDU-203', nombre: 'Orientacion Educativa', creditos: 3, monto: 2800 },
      { clave: 'ING-125', nombre: 'Ingles II', creditos: 0, monto: 0 },
      { clave: 'EDU-204', nombre: 'Practica Docente I', creditos: 4, monto: 4880 }
    ]
  },
  'Adm. Turisticas': {
    c1: [
      { clave: 'TUR-101', nombre: 'Introduccion Turismo y Hosteleria', creditos: 4, monto: 3400 },
      { clave: 'TUR-102', nombre: 'Geografia Turistica Nacional', creditos: 3, monto: 2800 },
      { clave: 'ADM-100', nombre: 'Principios de Administracion', creditos: 4, monto: 3400 },
      { clave: 'ING-115', nombre: 'Ingles I', creditos: 0, monto: 0 },
      { clave: 'TUR-103', nombre: 'Gestion Servicios y Alimentos', creditos: 4, monto: 5800 }
    ],
    c2: [
      { clave: 'TUR-201', nombre: 'Adm. Operaciones Hoteleras', creditos: 4, monto: 3600 },
      { clave: 'TUR-202', nombre: 'Marketing Turistico', creditos: 4, monto: 3400 },
      { clave: 'TUR-203', nombre: 'Organizacion Eventos y Congresos', creditos: 3, monto: 3000 },
      { clave: 'ING-125', nombre: 'Ingles II', creditos: 0, monto: 0 },
      { clave: 'TUR-204', nombre: 'Contabilidad Hotelera', creditos: 4, monto: 3800 }
    ]
  },
  'Lenguas Extranjeras': {
    c1: [
      { clave: 'LEN-101', nombre: 'Linguistica General I', creditos: 4, monto: 3400 },
      { clave: 'LEN-102', nombre: 'Fonetica y Fonologia Inglesa', creditos: 4, monto: 3600 },
      { clave: 'LEN-103', nombre: 'Gramatica Francesa I', creditos: 4, monto: 3400 },
      { clave: 'ING-115', nombre: 'Ingles I', creditos: 0, monto: 0 },
      { clave: 'LEN-104', nombre: 'Redaccion y Composicion', creditos: 4, monto: 4840 }
    ],
    c2: [
      { clave: 'LEN-201', nombre: 'Linguistica Aplicada y Traduccion', creditos: 4, monto: 3800 },
      { clave: 'LEN-202', nombre: 'Literatura Anglofona', creditos: 4, monto: 3600 },
      { clave: 'LEN-203', nombre: 'Gramatica Francesa II', creditos: 4, monto: 3600 },
      { clave: 'ING-125', nombre: 'Ingles II', creditos: 0, monto: 0 },
      { clave: 'LEN-204', nombre: 'Cultura y Civilizacion Extranjera', creditos: 3, monto: 3240 }
    ]
  }
};

const CYCLES = [
  { code: 'c1', title: 'ENERO - ABRIL 2026' },
  { code: 'c2', title: 'MAYO - AGOSTO 2026' }
];

function cleanCarrera(name) {
  const lower = String(name || '').toLowerCase();
  if (lower.includes('industrial')) return 'Ingenieria Industrial';
  if (lower.includes('sistemas') || lower.includes('computaci') || lower.includes('inform') || lower.includes('telem')) return 'Ingenieria en Sistemas';
  if (lower.includes('medicina') || lower.includes('odontolog')) return 'Medicina';
  if (lower.includes('civil')) return 'Ingenieria Civil';
  if (lower.includes('electric') || lower.includes('eléctric')) return 'Ingenieria Electrica';
  if (lower.includes('derecho') || lower.includes('juridic')) return 'Derecho';
  if (lower.includes('mercadeo') || lower.includes('marketing') || lower.includes('publicidad') || lower.includes('comunicaci')) return 'Mercadeo';
  if (lower.includes('psicolog')) return 'Psicologia';
  if (lower.includes('educaci') || lower.includes('docente')) return 'Educacion';
  if (lower.includes('turistic') || lower.includes('turismo') || lower.includes('hotel')) return 'Adm. Turisticas';
  if (lower.includes('lengua') || lower.includes('idioma') || lower.includes('extranjera')) return 'Lenguas Extranjeras';
  if (lower.includes('bioanalisis') || lower.includes('bioanálisis')) return 'Bioanalisis';
  if (lower.includes('arquitectura')) return 'Arquitectura';
  return 'Administracion de Empresas';
}

function uniKey(name) {
  const value = String(name || '');
  if (value.includes('O&M') || value.includes('O y M') || value.includes('OYM')) return 'OYM';
  if (value.includes('Católica') || value.includes('Catolica') || value.includes('PUCMM')) return 'PUCMM';
  if (value.includes('Evangélica') || value.includes('Evangelica') || value.includes('UNEV')) return 'UNEV';
  return 'UTESA';
}

function uniqueRows(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    map.set(String(row.id), row);
  });
  return Array.from(map.values());
}

function assignedBecarios(store, padrinoId) {
  const padrino = (store.padrinos || []).find((row) => String(row.id) === String(padrinoId)) || {};
  const linkedIds = new Set([
    ...(padrino.becario_ids || []).map(String),
    ...(store.asignaciones || store.becario_padrinos || [])
      .filter((row) => String(row.padrino_id) === String(padrinoId) && row.activo !== false)
      .map((row) => String(row.becario_id))
  ]);
  const assigned = (store.becarios || []).filter((row) => (
    linkedIds.has(String(row.id)) || String(row.padrino_id) === String(padrinoId)
  ));
  if (assigned.length) return uniqueRows(assigned);
  return uniqueRows((store.becarios || []).filter((row) => String(row.estado_beca || '').toUpperCase() === 'ACTIVA'));
}

function groupStudents(students) {
  const grouped = {};
  students.forEach((student) => {
    const uni = uniKey(student.universidad?.nombre || student.universidad_nombre);
    const center = student.centro_origen || 'Centro educativo';
    if (!grouped[uni]) grouped[uni] = {};
    if (!grouped[uni][center]) grouped[uni][center] = [];
    grouped[uni][center].push(student);
  });
  return grouped;
}

function buildInvoiceModel(padrino, students) {
  const grouped = groupStudents(students);
  const cycles = CYCLES.map((cycle) => {
    const centers = [];
    let cycleSum = 0;
    Object.entries(grouped).forEach(([uni, byCenter]) => {
      const rates = RATES_MAP[uni] || RATES_MAP.UTESA;
      Object.entries(byCenter).forEach(([centerName, list]) => {
        const rows = [];
        let centerSum = 0;
        const push = (concepto, creditos, monto) => {
          rows.push({ concepto, creditos, monto });
          centerSum += monto;
        };
        push(`Costo de Inscripcion (${list.length} estudiante${list.length > 1 ? 's' : ''})`, '', rates.inscripcion * list.length);
        push(`Laboratorios y Tecnologia (${list.length} estudiante${list.length > 1 ? 's' : ''})`, '', rates.laboratorio * list.length);
        push(`Servicios Estudiantiles (${list.length} estudiante${list.length > 1 ? 's' : ''})`, '', rates.servicios * list.length);
        const detailed = students.length <= 20;
        list.forEach((student) => {
          const carrera = cleanCarrera(student.carrera?.nombre || student.carrera_nombre);
          const mats = SUBJECTS_MAP[carrera]?.[cycle.code] || [];
          if (detailed) {
            mats.forEach((mat) => {
              push(`${carrera}: ${mat.nombre} (${mat.clave})`, mat.creditos, mat.monto);
            });
            return;
          }
          const creditos = mats.reduce((sum, mat) => sum + Number(mat.creditos || 0), 0);
          const monto = mats.reduce((sum, mat) => sum + Number(mat.monto || 0), 0);
          push(`${personName(student)} — ${carrera}`, creditos, monto);
        });
        centers.push({ uni, centerName, count: list.length, rows, total: centerSum });
        cycleSum += centerSum;
      });
    });
    return { ...cycle, centers, total: cycleSum };
  });
  const grandTotal = cycles.reduce((sum, cycle) => sum + cycle.total, 0);
  return {
    padrinoNombre: personName(padrino),
    usedFallback: students.length > 0 && !(padrino.becarios || []).length,
    studentCount: students.length,
    cycles,
    grandTotal
  };
}

function renderInvoicePdf(model) {
  const pdf = new SimplePdf({ width: 612, height: 792, margin: 36 });
  pdf.footer = 'Calle E. Leon Jimenez #12, Santiago  |  RNC 430-28829-2  |  809-995-0808';

  model.cycles.forEach((cycle) => {
    pdf.text('ROMPIENDO PARADIGMAS', { size: 18, bold: true, color: '#E53935' });
    pdf.text('FUNDACION DE BECAS ESTUDIANTILES', { size: 9, bold: true, color: '#616161' });
    pdf.text(`Santiago de los Caballeros, ${new Date().toLocaleDateString('es-DO')}`, {
      size: 10,
      align: 'right'
    });
    pdf.line('#E53935');
    pdf.text(`Senor, ${model.padrinoNombre}`, { size: 12, bold: true });
    pdf.text(`Despues de un cordial saludo, se remite el valor del cuatrimestre ${cycle.title} de los centros educativos apadrinados.`, { size: 10 });
    pdf.space(8);

    cycle.centers.forEach((center) => {
      pdf.text(`Centro: ${center.centerName}  |  Universidad: ${center.uni}  (${center.count} estudiante${center.count > 1 ? 's' : ''})`, {
        size: 10,
        bold: true,
        color: '#1A237E'
      });
      center.rows.forEach((row) => {
        const credits = row.creditos === '' ? '' : Number(row.creditos).toFixed(1);
        pdf.text(`${row.concepto}   ${credits}   RD$ ${formatMoney(row.monto)}`, { size: 9 });
      });
      pdf.text(`TOTAL CENTRO ${center.centerName.toUpperCase()}: RD$ ${formatMoney(center.total)}`, {
        size: 10,
        bold: true,
        color: '#1A237E'
      });
      pdf.space(8);
    });

    pdf.text(`Total del cuatrimestre ${cycle.title}: RD$ ${formatMoney(cycle.total)}`, {
      size: 12,
      bold: true,
      color: '#2E7D32'
    });
    pdf.addPage();
  });

  pdf.text('ROMPIENDO PARADIGMAS', { size: 18, bold: true, color: '#E53935' });
  pdf.text('RESUMEN GENERAL DE FACTURACION POR CENTROS', { size: 13, bold: true, color: '#1A237E', align: 'center' });
  pdf.space(6);
  pdf.text(`Consolidado de cobro de los dos periodos para ${model.padrinoNombre}.`, { size: 10 });
  model.cycles.forEach((cycle) => {
    pdf.text(`${cycle.title}: RD$ ${formatMoney(cycle.total)}`, { size: 11, bold: true });
  });
  pdf.text(`TOTAL GENERAL A PAGAR: RD$ ${formatMoney(model.grandTotal)}`, { size: 13, bold: true, color: '#C00000' });
  pdf.space(12);
  pdf.text('INSTRUCCIONES DE DEPOSITO BANCARIO', { size: 12, bold: true, color: '#1A237E' });
  pdf.text('Beneficiario: Fundacion Rompiendo Paradigmas');
  pdf.text('RNC: 430-28829-2');
  pdf.text('Banco BHD  |  Cuenta corriente: 28480220014');
  return pdf.toBlob();
}

export function summarizeInvoice(model) {
  const lines = model.cycles.map((cycle) => `• ${cycle.title}: RD$ ${formatMoney(cycle.total)}`);
  return {
    nombre: model.padrinoNombre,
    studentCount: model.studentCount,
    grandTotal: model.grandTotal,
    text: `📑 *FACTURA POR CENTROS*\n\nPadrino: *${model.padrinoNombre}*\nEstudiantes: *${model.studentCount}*\n\n${lines.join('\n')}\n\n*TOTAL GENERAL:* RD$ ${formatMoney(model.grandTotal)}\n\n_Se descargó el PDF de la factura._`
  };
}

export async function buildPadrinoInvoice(padrinoId) {
  const store = await loadStore();
  const padrino = (store.padrinos || []).find((row) => String(row.id) === String(padrinoId));
  if (!padrino) {
    throw new Error('Padrino no encontrado.');
  }
  const students = assignedBecarios(store, padrinoId);
  const model = buildInvoiceModel(padrino, students);
  const blob = renderInvoicePdf(model);
  const filename = `Factura_Centros_${model.padrinoNombre.replace(/\s+/g, '_')}_${todayStamp()}.pdf`;
  return { blob, filename, model, summary: summarizeInvoice(model) };
}

export async function exportPadrinoInvoice(padrinoId, { download = true } = {}) {
  const result = await buildPadrinoInvoice(padrinoId);
  if (download) {
    downloadBlob(result.blob, result.filename);
  }
  return result;
}
