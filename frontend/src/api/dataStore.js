import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import bundled from '../data/crmStore.json';

const COLLECTIONS = [
  'becarios',
  'padrinos',
  'universidades',
  'carreras',
  'instituciones',
  'aportes',
  'pagos',
  'alarmas',
  'presupuestos',
  'gastos'
];

let cache = null;
let loadPromise = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function uniqueRows(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    map.set(String(row.id ?? `${Math.random()}`), row);
  });
  return Array.from(map.values());
}

function emptyStore() {
  return {
    becarios: [],
    padrinos: [],
    universidades: [],
    carreras: [],
    instituciones: [],
    aportes: [],
    pagos: [],
    alarmas: [],
    presupuestos: [],
    gastos: []
  };
}

async function readFirestore() {
  const next = emptyStore();
  let hasData = false;
  await Promise.all(COLLECTIONS.map(async (name) => {
    const snap = await getDocs(collection(db, name));
    next[name] = uniqueRows(snap.docs.map((item) => ({ id: Number(item.id) || item.id, ...item.data() })));
    if (!snap.empty) hasData = true;
  }));
  return hasData ? next : null;
}

async function writeCollection(name, rows) {
  const chunks = [];
  for (let i = 0; i < rows.length; i += 400) {
    chunks.push(rows.slice(i, i + 400));
  }
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((row) => {
      const id = String(row.id || `${name}-${Math.random().toString(16).slice(2)}`);
      batch.set(doc(db, name, id), JSON.parse(JSON.stringify(row)));
    });
    await batch.commit();
  }
}

async function seedFirestore(store) {
  await Promise.all(COLLECTIONS.map((name) => writeCollection(name, store[name] || [])));
  await setDoc(doc(db, 'meta', 'ready'), { seededAt: new Date().toISOString(), becarios: store.becarios.length });
}

export async function loadStore() {
  if (cache) return cache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      cache = clone(bundled);
      seedFirestore(cache).catch((error) => {
        console.warn('No se pudo sembrar Firestore, se usa el dato local:', error.message);
      });
      return cache;
    } catch (error) {
      console.warn('No se pudieron cargar los datos embebidos:', error.message);
      cache = emptyStore();
      return cache;
    }
  })();

  return loadPromise;
}

export async function saveRecord(collectionName, record) {
  const store = await loadStore();
  const list = store[collectionName] || [];
  const index = list.findIndex((item) => String(item.id) === String(record.id));
  if (index >= 0) {
    list[index] = { ...list[index], ...record };
  } else {
    if (!record.id) {
      record.id = Date.now();
    }
    list.unshift(record);
  }
  store[collectionName] = list;
  try {
    await setDoc(doc(db, collectionName, String(record.id)), JSON.parse(JSON.stringify(record)));
  } catch (error) {
    console.warn('No se pudo guardar en Firestore:', error.message);
  }
  return record;
}

export async function removeRecord(collectionName, id) {
  const store = await loadStore();
  store[collectionName] = (store[collectionName] || []).filter((item) => String(item.id) !== String(id));
}

export function paginate(rows, params = {}) {
  const page = Math.max(parseInt(params.page || '1', 10) || 1, 1);
  const limit = Math.max(parseInt(params.limit || '10', 10) || 10, 1);
  const start = (page - 1) * limit;
  return {
    rows: rows.slice(start, start + limit),
    pagination: {
      total_items: rows.length,
      total_pages: Math.max(Math.ceil(rows.length / limit), 1),
      current_page: page,
      limit
    }
  };
}

export function ok(data, message) {
  return Promise.resolve({ success: true, data, message });
}
