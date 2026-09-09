export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

export function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatMoney(amount) {
  return Number(amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('es-DO');
}

export function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function personName(row = {}) {
  const persona = row.persona || {};
  const nombre = persona.nombre || row.nombre || '';
  const apellido = persona.apellido || row.apellido || '';
  return `${nombre} ${apellido}`.trim() || row.razon_social || 'Sin nombre';
}

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
