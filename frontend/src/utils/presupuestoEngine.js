import { personName, normalizeText } from './downloadFile';

export const RATES_BY_UNI = {
  UTESA: { costPerCredit: 720, inscripcion: 2300, servicios: 1200, laboratorio: 800 },
  OYM: { costPerCredit: 757.89, inscripcion: 1000, servicios: 0, laboratorio: 800 },
  PUCMM: { costPerCredit: 1500, inscripcion: 3500, servicios: 1500, laboratorio: 1000 },
  UNEV: { costPerCredit: 650, inscripcion: 2000, servicios: 1000, laboratorio: 500 }
};

export const DEFAULT_GASTOS_FUNDACION = [
  {
    id: 9001,
    tipo: 'sueldo',
    categoria: 'administrativo',
    descripcion: 'Sueldo Erick Páez',
    beneficiario: 'Erick Páez',
    monto: 20000,
    frecuencia: 'mensual',
    fecha: '2026-01-01',
    activo: true
  },
  {
    id: 9002,
    tipo: 'operativo',
    categoria: 'operativo',
    descripcion: 'Gastos operativos / logística fundación',
    beneficiario: 'Fundación',
    monto: 8000,
    frecuencia: 'mensual',
    fecha: '2026-01-01',
    activo: true
  }
];

/** Materias base que suelen cursar casi todos los nuevos ingresos (UTESA / comunes). */
export const DEFAULT_MATERIAS_OBLIGATORIAS = [
  { codigo: 'ORI-112', nombre: 'Orientación Universitaria', creditos: 2 },
  { codigo: 'ESP-181', nombre: 'Lengua Española I', creditos: 4 },
  { codigo: 'ESP-189', nombre: 'Lengua Española II', creditos: 4 },
  { codigo: 'INF-103', nombre: 'Ofimática', creditos: 2 },
  { codigo: 'SOC-182', nombre: 'Reflexión Filosófica', creditos: 3 },
  { codigo: 'MAT-095', nombre: 'Matemática Básica', creditos: 4 },
  { codigo: 'MAT-100', nombre: 'Matemática I', creditos: 4 },
  { codigo: 'INF-113', nombre: 'TIC', creditos: 2 }
];

/** Materias que la fundación cubre directo (no se cobran al padrino / cargo FRP). */
export const DEFAULT_MATERIAS_CUBIERTAS = [
  { codigo: 'ING-105', nombre: 'Inglés I', creditos: 0, costo_fijo: 0, motivo: 'ingles' },
  { codigo: 'ING-115', nombre: 'Inglés II', creditos: 0, costo_fijo: 0, motivo: 'ingles' },
  { codigo: 'ING-125', nombre: 'Inglés III', creditos: 0, costo_fijo: 0, motivo: 'ingles' },
  { codigo: 'ING-135', nombre: 'Inglés IV', creditos: 0, costo_fijo: 0, motivo: 'ingles' }
];

const CONFIG_KEY = 'crm_presupuesto_config_v1';

export function uniKey(name) {
  const value = String(name || '');
  if (/O\s*&\s*M|O\s*y\s*M|OYM/i.test(value)) return 'OYM';
  if (/Católica|Catolica|PUCMM/i.test(value)) return 'PUCMM';
  if (/Evangélica|Evangelica|UNEV/i.test(value)) return 'UNEV';
  return 'UTESA';
}

export function isEnglishCode(codigo) {
  return /^ING[- ]?\d+/i.test(String(codigo || ''));
}

export function normalizeFrequency(freq) {
  const f = normalizeText(freq || 'mensual');
  if (f.includes('cuatrim')) return 'cuatrimestral';
  if (f.includes('trim')) return 'trimestral';
  if (f.includes('anual') || f.includes('ano')) return 'anual';
  return 'mensual';
}

/** Convierte un compromiso de padrino a monto mensual. */
export function compromisoMensual(padrino) {
  const monto = Number(padrino.monto_compromiso || 0);
  const freq = normalizeFrequency(padrino.frecuencia);
  if (freq === 'anual') return monto / 12;
  if (freq === 'cuatrimestral') return monto / 4;
  if (freq === 'trimestral') return monto / 3;
  return monto;
}

export function gastoMensual(gasto) {
  if (gasto.activo === false) return 0;
  const monto = Number(gasto.monto || 0);
  const freq = normalizeFrequency(gasto.frecuencia || 'mensual');
  if (freq === 'anual') return monto / 12;
  if (freq === 'cuatrimestral') return monto / 4;
  if (freq === 'trimestral') return monto / 3;
  return monto;
}

export const UNI_LABELS = {
  UTESA: 'Universidad Tecnológica de Santiago (UTESA)',
  OYM: 'Universidad Organización y Método (O&M)',
  PUCMM: 'Pontificia Universidad Católica Madre y Maestra (PUCMM)',
  UNEV: 'Universidad Evangélica (UNEV)'
};

/** Datos fiscales receptores (universidades) para liquidaciones. */
export const UNI_FISCAL = {
  UTESA: { rnc: '101-00001-1', nombre: 'UTESA' },
  OYM: { rnc: '101-00002-2', nombre: 'Universidad O&M' },
  PUCMM: { rnc: '101-00003-3', nombre: 'PUCMM' },
  UNEV: { rnc: '101-00004-4', nombre: 'UNEV' }
};

export const FUNDACION_FISCAL = {
  nombre: 'Fundación Rompiendo Paradigmas',
  rnc: '430-28829-2',
  direccion: 'Calle E. León Jiménez #12, Reparto del Este, Santiago',
  telefono: '809-995-0808 / 809-669-8000',
  banco: 'Banco BHD',
  cuenta: '28480220014'
};

export function loadPresupuestoConfig() {
  try {
    const raw = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
    return {
      anio: raw.anio || 2026,
      meses: raw.meses || 12,
      materias_obligatorias: raw.materias_obligatorias || DEFAULT_MATERIAS_OBLIGATORIAS,
      materias_cubiertas: raw.materias_cubiertas || DEFAULT_MATERIAS_CUBIERTAS,
      extras_compromiso: Number(raw.extras_compromiso || 0),
      creditos_promedio_cuatrimestre: Number(raw.creditos_promedio_cuatrimestre ?? 18),
      itbis_pct: Number(raw.itbis_pct ?? 0.18),
      aplicar_itbis: raw.aplicar_itbis !== false,
      cuatrimestre_actual: raw.cuatrimestre_actual || '2026-C1',
      notas: raw.notas || ''
    };
  } catch {
    return {
      anio: 2026,
      meses: 12,
      materias_obligatorias: DEFAULT_MATERIAS_OBLIGATORIAS,
      materias_cubiertas: DEFAULT_MATERIAS_CUBIERTAS,
      extras_compromiso: 0,
      creditos_promedio_cuatrimestre: 18,
      itbis_pct: 0.18,
      aplicar_itbis: true,
      cuatrimestre_actual: '2026-C1',
      notas: ''
    };
  }
}

export function savePresupuestoConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  return config;
}

function materiaFromEnrollment(row) {
  const mat = row.materia || row;
  return {
    codigo: String(mat.codigo || row.codigo || '').toUpperCase(),
    nombre: mat.nombre || row.nombre || 'Sin nombre',
    creditos: Number(mat.creditos ?? row.creditos ?? 0),
    estado: row.estado || mat.estado || null,
    ciclo: row.ciclo?.nombre || row.periodo || null
  };
}

/** Catálogo de materias reales cursadas por becarios activos. */
export function collectMateriasFromBecarios(becarios = []) {
  const map = new Map();
  becarios
    .filter((b) => String(b.estado_beca || '').toUpperCase() === 'ACTIVA')
    .forEach((b) => {
      (b.materias_cursadas || []).forEach((row) => {
        const m = materiaFromEnrollment(row);
        if (!m.codigo || m.codigo === 'TOTALES') return;
        const prev = map.get(m.codigo) || {
          codigo: m.codigo,
          nombre: m.nombre,
          creditos: m.creditos,
          estudiantes: 0,
          ids: new Set()
        };
        if (!prev.ids.has(b.id)) {
          prev.ids.add(b.id);
          prev.estudiantes += 1;
        }
        if (m.nombre && m.nombre !== 'Sin nombre') prev.nombre = m.nombre;
        if (m.creditos != null) prev.creditos = m.creditos;
        map.set(m.codigo, prev);
      });
    });
  return Array.from(map.values())
    .map(({ ids, ...rest }) => rest)
    .sort((a, b) => b.estudiantes - a.estudiantes || a.codigo.localeCompare(b.codigo));
}

function costForMateria(materia, uni = 'UTESA', coveredMap = new Map()) {
  const code = String(materia.codigo || '').toUpperCase();
  const covered = coveredMap.get(code);
  const rates = RATES_BY_UNI[uni] || RATES_BY_UNI.UTESA;
  const creditos = Number(materia.creditos ?? covered?.creditos ?? 0);

  if (covered) {
    if (covered.costo_fijo != null && Number(covered.costo_fijo) >= 0 && (isEnglishCode(code) || covered.motivo === 'ingles')) {
      return Number(covered.costo_fijo);
    }
    if (covered.costo_fijo != null && Number(covered.costo_fijo) > 0) {
      return Number(covered.costo_fijo);
    }
  }
  if (isEnglishCode(code) || creditos === 0) return 0;
  return creditos * rates.costPerCredit;
}

/** Costo de matrícula estimado de un becario para UN cuatrimestre. */
export function estimateStudentQuarterCost(becario, config = loadPresupuestoConfig()) {
  const uni = uniKey(becario.universidad_nombre || becario.universidad?.nombre);
  const rates = RATES_BY_UNI[uni] || RATES_BY_UNI.UTESA;
  const materias = (becario.materias_cursadas || []).filter((row) => {
    const codigo = String(row.materia?.codigo || row.codigo || '').toUpperCase();
    return codigo && codigo !== 'TOTALES' && !isEnglishCode(codigo);
  });

  let creditos = 0;
  let montoMaterias = 0;
  if (materias.length) {
    materias.forEach((row) => {
      const cr = Number(row.materia?.creditos ?? row.creditos ?? 0);
      creditos += cr;
      montoMaterias += cr * rates.costPerCredit;
    });
  } else {
    creditos = Number(config.creditos_promedio_cuatrimestre || 18);
    montoMaterias = creditos * rates.costPerCredit;
  }

  const cargosFijos = rates.inscripcion + rates.laboratorio + rates.servicios;
  const subtotal = montoMaterias + cargosFijos;
  return {
    becario_id: becario.id,
    nombre: personName(becario),
    universidad_key: uni,
    universidad: UNI_LABELS[uni] || uni,
    matricula: becario.matricula || 'N/D',
    carrera: becario.carrera_nombre || becario.carrera?.nombre || 'N/A',
    centro: becario.centro_origen || 'N/A',
    creditos,
    costo_credito: rates.costPerCredit,
    monto_materias: montoMaterias,
    cargos_fijos: cargosFijos,
    subtotal,
    fuente_creditos: materias.length ? 'materias_crm' : 'promedio_config'
  };
}

/**
 * Compromiso de matrícula que la fundación debe cubrir / buscar fondos:
 * por cuatrimestre, mes y año, desglosado por universidad.
 */
export function buildCompromisoMatricula(store, config = loadPresupuestoConfig(), gastosOverride = null) {
  const anio = Number(config.anio || 2026);
  const becarios = (store.becarios || []).filter((b) => String(b.estado_beca || '').toUpperCase() === 'ACTIVA');
  const estudiantes = becarios.map((b) => estimateStudentQuarterCost(b, config));

  const byUniMap = new Map();
  estudiantes.forEach((row) => {
    const prev = byUniMap.get(row.universidad_key) || {
      universidad_key: row.universidad_key,
      universidad: row.universidad,
      estudiantes: 0,
      creditos: 0,
      monto_materias: 0,
      cargos_fijos: 0,
      subtotal_cuatrimestre: 0,
      detalle: []
    };
    prev.estudiantes += 1;
    prev.creditos += row.creditos;
    prev.monto_materias += row.monto_materias;
    prev.cargos_fijos += row.cargos_fijos;
    prev.subtotal_cuatrimestre += row.subtotal;
    prev.detalle.push(row);
    byUniMap.set(row.universidad_key, prev);
  });

  const itbisPct = config.aplicar_itbis === false ? 0 : Number(config.itbis_pct || 0);
  const porUniversidad = Array.from(byUniMap.values())
    .map((uni) => {
      const itbis = uni.subtotal_cuatrimestre * itbisPct;
      const totalFiscal = uni.subtotal_cuatrimestre + itbis;
      return {
        ...uni,
        itbis_pct: itbisPct,
        itbis_cuatrimestre: itbis,
        total_fiscal_cuatrimestre: totalFiscal,
        mensual: uni.subtotal_cuatrimestre / 4,
        mensual_fiscal: totalFiscal / 4,
        anual: uni.subtotal_cuatrimestre * 3,
        anual_fiscal: totalFiscal * 3
      };
    })
    .sort((a, b) => b.subtotal_cuatrimestre - a.subtotal_cuatrimestre);

  const subtotalCuatrimestre = porUniversidad.reduce((s, u) => s + u.subtotal_cuatrimestre, 0);
  const itbisCuatrimestre = porUniversidad.reduce((s, u) => s + u.itbis_cuatrimestre, 0);
  const totalFiscalCuatrimestre = subtotalCuatrimestre + itbisCuatrimestre;

  const gastos = (gastosOverride != null ? gastosOverride : (store.gastos || [])).filter((g) => g.activo !== false);
  const gastosMensuales = gastos.reduce((sum, g) => sum + gastoMensual(g), 0);
  const gastosCuatrimestre = gastosMensuales * 4;
  const gastosAnual = gastosMensuales * 12;

  const padrinos = (store.padrinos || []).filter((p) => p.activo !== false);
  const ingresosMensuales = padrinos.reduce((sum, p) => sum + compromisoMensual(p), 0);
  const ingresosCuatrimestre = ingresosMensuales * 4;
  const ingresosAnual = ingresosMensuales * 12;

  const necesidadCuatrimestre = totalFiscalCuatrimestre + gastosCuatrimestre;
  const necesidadMensual = necesidadCuatrimestre / 4;
  const necesidadAnual = (totalFiscalCuatrimestre * 3) + gastosAnual;

  const gapCuatrimestre = necesidadCuatrimestre - ingresosCuatrimestre;
  const gapMensual = necesidadMensual - ingresosMensuales;
  const gapAnual = necesidadAnual - ingresosAnual;

  return {
    anio,
    cuatrimestre: config.cuatrimestre_actual || `${anio}-C1`,
    activos: becarios.length,
    itbis_pct: itbisPct,
    estudiantes,
    por_universidad: porUniversidad,
    totales: {
      subtotal_cuatrimestre: subtotalCuatrimestre,
      itbis_cuatrimestre: itbisCuatrimestre,
      total_fiscal_cuatrimestre: totalFiscalCuatrimestre,
      mensual: subtotalCuatrimestre / 4,
      mensual_fiscal: totalFiscalCuatrimestre / 4,
      anual: subtotalCuatrimestre * 3,
      anual_fiscal: totalFiscalCuatrimestre * 3
    },
    operacion: {
      gastos_mensual: gastosMensuales,
      gastos_cuatrimestre: gastosCuatrimestre,
      gastos_anual: gastosAnual
    },
    ingresos: {
      mensual: ingresosMensuales,
      cuatrimestre: ingresosCuatrimestre,
      anual: ingresosAnual
    },
    necesidad_fondos: {
      mensual: necesidadMensual,
      cuatrimestre: necesidadCuatrimestre,
      anual: necesidadAnual,
      gap_mensual: gapMensual,
      gap_cuatrimestre: gapCuatrimestre,
      gap_anual: gapAnual
    },
    formula: [
      'Por cada becario activo: créditos del cuatrimestre × tarifa universidad + inscripción/labs/servicios',
      'Si no hay materias en CRM, se usa créditos promedio configurados',
      'Valor fiscal = subtotal + ITBIS (si aplica)',
      'Necesidad de fondos = matrículas fiscales + gastos fundación',
      'Gap = necesidad − compromisos de padrinos'
    ]
  };
}

/**
 * Construye el presupuesto detallado:
 * 1) Materias que deben cursar los becados
 * 2) Materias cubiertas por la fundación
 * 3) Compromiso presupuestario de esas cargas
 * 4) Menos gastos de fundación (sueldos, etc.)
 */
export function buildPresupuestoDetallado(store, config = loadPresupuestoConfig(), gastosOverride = null) {
  const meses = Number(config.meses || 12);
  const anio = Number(config.anio || 2026);
  const becarios = (store.becarios || []).filter((b) => String(b.estado_beca || '').toUpperCase() === 'ACTIVA');
  const catalogo = collectMateriasFromBecarios(becarios);

  const coveredList = (config.materias_cubiertas || []).map((m) => ({
    ...m,
    codigo: String(m.codigo || '').toUpperCase()
  }));
  const coveredMap = new Map(coveredList.map((m) => [m.codigo, m]));

  const obligatorias = (config.materias_obligatorias || []).map((m) => {
    const fromCatalog = catalogo.find((c) => c.codigo === String(m.codigo).toUpperCase());
    const codigo = String(m.codigo || '').toUpperCase();
    const creditos = Number(m.creditos ?? fromCatalog?.creditos ?? 0);
    const estudiantes = fromCatalog?.estudiantes || becarios.length;
    // Estimación: cada activo debe cursar la materia alguna vez en el período
    // Si hay datos reales usamos conteo; si no, proyectamos sobre todos los activos.
    const proyectados = fromCatalog ? fromCatalog.estudiantes : becarios.length;
    const uni = 'UTESA';
    const costoUnitario = costForMateria({ codigo, creditos }, uni, coveredMap);
    const cubierta = coveredMap.has(codigo) || isEnglishCode(codigo);
    const total = proyectados * costoUnitario;
    return {
      codigo,
      nombre: m.nombre || fromCatalog?.nombre || codigo,
      creditos,
      estudiantes: proyectados,
      costo_unitario: costoUnitario,
      total,
      cubierta_fundacion: cubierta,
      fuente: fromCatalog ? 'crm' : 'catalogo'
    };
  });

  // Materias cubiertas que no estén ya en obligatorias
  const cubiertasDetalle = coveredList.map((m) => {
    const fromCatalog = catalogo.find((c) => c.codigo === m.codigo);
    const creditos = Number(m.creditos ?? fromCatalog?.creditos ?? 0);
    const proyectados = fromCatalog?.estudiantes || 0;
    const costoUnitario = costForMateria({ codigo: m.codigo, creditos }, 'UTESA', coveredMap);
    return {
      codigo: m.codigo,
      nombre: m.nombre || fromCatalog?.nombre || m.codigo,
      creditos,
      motivo: m.motivo || (isEnglishCode(m.codigo) ? 'ingles' : 'fundacion'),
      estudiantes: proyectados,
      costo_unitario: costoUnitario,
      total: proyectados * costoUnitario,
      costo_fijo: Number(m.costo_fijo || 0)
    };
  });

  const totalObligatoriasPadrino = obligatorias
    .filter((m) => !m.cubierta_fundacion)
    .reduce((sum, m) => sum + m.total, 0);
  // Solo lista de cubiertas (evitar doble conteo con obligatorias marcadas)
  const totalCubiertasFundacion = cubiertasDetalle.reduce((sum, m) => sum + m.total, 0);

  // Cargos fijos estimados por estudiante activo (1 ciclo) × ciclos en el año (meses/4)
  const ciclos = Math.max(1, Math.round(meses / 4));
  const cargosFijos = becarios.reduce((sum, b) => {
    const rates = RATES_BY_UNI[uniKey(b.universidad_nombre || b.universidad?.nombre)] || RATES_BY_UNI.UTESA;
    return sum + (rates.inscripcion + rates.laboratorio + rates.servicios) * ciclos;
  }, 0);

  const extras = Number(config.extras_compromiso || 0);
  const compromisoAcademico = totalObligatoriasPadrino + totalCubiertasFundacion + cargosFijos + extras;

  const padrinos = (store.padrinos || []).filter((p) => p.activo !== false);
  const compromisoPadrinosMensual = padrinos.reduce((sum, p) => sum + compromisoMensual(p), 0);
  const compromisoPadrinosPeriodo = compromisoPadrinosMensual * meses;
  const aportesRecibidos = (store.aportes || []).reduce((sum, row) => sum + Number(row.monto || 0), 0);

  const gastos = (gastosOverride != null ? gastosOverride : (store.gastos || []))
    .filter((g) => g.activo !== false);
  const gastosMensuales = gastos.reduce((sum, g) => sum + gastoMensual(g), 0);
  const gastosPeriodo = gastosMensuales * meses;
  const gastosDetalle = gastos.map((g) => ({
    ...g,
    mensual: gastoMensual(g),
    periodo: gastoMensual(g) * meses
  }));

  const pagosPagados = (store.pagos || [])
    .filter((p) => String(p.estado || '').toLowerCase() === 'pagado')
    .reduce((sum, p) => sum + Number(p.monto || 0), 0);
  const pagosPendientes = (store.pagos || [])
    .filter((p) => ['pendiente', 'atrasado', 'vencido'].includes(String(p.estado || '').toLowerCase()))
    .reduce((sum, p) => sum + Number(p.monto || 0), 0);

  // Disponible = ingresos comprometidos − compromiso académico − gastos fundación
  const ingresosBase = Math.max(compromisoPadrinosPeriodo, aportesRecibidos);
  const disponible = ingresosBase - compromisoAcademico - gastosPeriodo;
  const disponibleTrasGastos = compromisoAcademico > 0
    ? compromisoAcademico - gastosPeriodo
    : ingresosBase - gastosPeriodo;

  const partidas = [
    {
      id: 'compromiso-materias',
      categoria: 'Materias obligatorias (cargo académico)',
      asignado: totalObligatoriasPadrino,
      ejecutado: Math.min(pagosPagados, totalObligatoriasPadrino),
      tipo: 'academico'
    },
    {
      id: 'cubiertas-fundacion',
      categoria: 'Materias cubiertas por la fundación',
      asignado: totalCubiertasFundacion,
      ejecutado: 0,
      tipo: 'fundacion'
    },
    {
      id: 'cargos-fijos',
      categoria: 'Inscripción / labs / servicios (estimado)',
      asignado: cargosFijos,
      ejecutado: 0,
      tipo: 'academico'
    },
    {
      id: 'gastos-fundacion',
      categoria: 'Gastos fundación (sueldos y operación)',
      asignado: gastosPeriodo,
      ejecutado: gastosPeriodo,
      tipo: 'gasto'
    },
    ...(extras > 0 ? [{
      id: 'extras',
      categoria: 'Compromiso adicional asignado',
      asignado: extras,
      ejecutado: 0,
      tipo: 'extra'
    }] : [])
  ];

  const matricula = buildCompromisoMatricula(store, config, gastos);

  return {
    anio,
    meses,
    ciclos,
    activos: becarios.length,
    catalogo_materias: catalogo,
    materias_obligatorias: obligatorias,
    materias_cubiertas: cubiertasDetalle,
    gastos: gastosDetalle,
    matricula,
    padrinos: padrinos.map((p) => ({
      id: p.id,
      nombre: personName(p),
      compromiso: Number(p.monto_compromiso || 0),
      frecuencia: p.frecuencia || 'mensual',
      mensual: compromisoMensual(p),
      periodo: compromisoMensual(p) * meses
    })),
    kpis: {
      compromiso_padrinos_mensual: compromisoPadrinosMensual,
      compromiso_padrinos_periodo: compromisoPadrinosPeriodo,
      aportes_recibidos: aportesRecibidos,
      compromiso_academico: compromisoAcademico,
      materias_obligatorias_total: totalObligatoriasPadrino,
      materias_cubiertas_total: totalCubiertasFundacion,
      cargos_fijos: cargosFijos,
      gastos_fundacion_mensual: gastosMensuales,
      gastos_fundacion_periodo: gastosPeriodo,
      pagos_ejecutados: pagosPagados,
      pagos_pendientes: pagosPendientes,
      compromiso_neto_tras_gastos: compromisoAcademico - gastosPeriodo,
      disponible,
      disponible_tras_gastos: disponibleTrasGastos,
      // Necesidad de fondos (matricula)
      matricula_cuatrimestre: matricula.totales.total_fiscal_cuatrimestre,
      matricula_mensual: matricula.totales.mensual_fiscal,
      matricula_anual: matricula.totales.anual_fiscal,
      necesidad_cuatrimestre: matricula.necesidad_fondos.cuatrimestre,
      necesidad_mensual: matricula.necesidad_fondos.mensual,
      necesidad_anual: matricula.necesidad_fondos.anual,
      gap_cuatrimestre: matricula.necesidad_fondos.gap_cuatrimestre
    },
    partidas,
    formula: {
      pasos: [
        'Sumar materias obligatorias de becados (créditos × tarifa)',
        'Sumar materias que cubre la fundación directamente',
        'Sumar cargos fijos universitarios estimados',
        'Calcular compromiso de matrícula por cuatrimestre / mes / año y por universidad',
        'Asignar valor fiscal (subtotal + ITBIS) y necesidad de fondos',
        'Descontar gastos de fundación y comparar vs compromisos de padrinos'
      ]
    }
  };
}
