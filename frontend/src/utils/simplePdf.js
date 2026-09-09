const WIN_ANSI = {
  '€': 128, '‚': 130, 'ƒ': 131, '„': 132, '…': 133, '†': 134, '‡': 135,
  'ˆ': 136, '‰': 137, 'Š': 138, '‹': 139, 'Œ': 140, 'Ž': 142,
  '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151,
  '˜': 152, '™': 153, 'š': 154, '›': 155, 'œ': 156, 'ž': 158, 'Ÿ': 159,
  '¡': 161, '¢': 162, '£': 163, '¤': 164, '¥': 165, '¦': 166, '§': 167,
  '¨': 168, '©': 169, 'ª': 170, '«': 171, '¬': 172, '®': 174, '¯': 175,
  '°': 176, '±': 177, '²': 178, '³': 179, '´': 180, 'µ': 181, '¶': 182,
  '·': 183, '¸': 184, '¹': 185, 'º': 186, '»': 187, '¼': 188, '½': 189,
  '¾': 190, '¿': 191, 'À': 192, 'Á': 193, 'Â': 194, 'Ã': 195, 'Ä': 196,
  'Å': 197, 'Æ': 198, 'Ç': 199, 'È': 200, 'É': 201, 'Ê': 202, 'Ë': 203,
  'Ì': 204, 'Í': 205, 'Î': 206, 'Ï': 207, 'Ð': 208, 'Ñ': 209, 'Ò': 210,
  'Ó': 211, 'Ô': 212, 'Õ': 213, 'Ö': 214, '×': 215, 'Ø': 216, 'Ù': 217,
  'Ú': 218, 'Û': 219, 'Ü': 220, 'Ý': 221, 'Þ': 222, 'ß': 223, 'à': 224,
  'á': 225, 'â': 226, 'ã': 227, 'ä': 228, 'å': 229, 'æ': 230, 'ç': 231,
  'è': 232, 'é': 233, 'ê': 234, 'ë': 235, 'ì': 236, 'í': 237, 'î': 238,
  'ï': 239, 'ð': 240, 'ñ': 241, 'ò': 242, 'ó': 243, 'ô': 244, 'õ': 245,
  'ö': 246, '÷': 247, 'ø': 248, 'ù': 249, 'ú': 250, 'û': 251, 'ü': 252,
  'ý': 253, 'þ': 254, 'ÿ': 255
};

function encodePdfText(text) {
  let out = '';
  for (const ch of String(text ?? '')) {
    if (ch === '\\' || ch === '(' || ch === ')') {
      out += `\\${ch}`;
      continue;
    }
    const code = ch.charCodeAt(0);
    if (code < 128) {
      out += ch;
      continue;
    }
    const mapped = WIN_ANSI[ch];
    out += mapped != null ? `\\${mapped.toString(8).padStart(3, '0')}` : '?';
  }
  return out;
}

function hexColor(hex) {
  const raw = String(hex || '#000000').replace('#', '');
  const value = raw.length === 3
    ? raw.split('').map((c) => c + c).join('')
    : raw.padEnd(6, '0').slice(0, 6);
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

export class SimplePdf {
  constructor({ width = 612, height = 792, margin = 40 } = {}) {
    this.width = width;
    this.height = height;
    this.margin = margin;
    this.pages = [];
    this.ops = [];
    this.y = height - margin;
    this.footer = 'Fundación Rompiendo Paradigmas';
  }

  addPage() {
    if (this.ops.length) {
      this.pages.push(this.ops);
    }
    this.ops = [];
    this.y = this.height - this.margin;
  }

  ensure(space = 16) {
    if (!this.ops.length) {
      this.y = this.height - this.margin;
    }
    if (this.y - space < this.margin + 28) {
      this.addPage();
    }
  }

  text(value, {
    x = this.margin,
    size = 11,
    bold = false,
    color = '#212121',
    align = 'left',
    width = this.width - this.margin * 2
  } = {}) {
    const font = bold ? 'F2' : 'F1';
    const approx = size * 0.5;
    const words = String(value ?? '').split(/\s+/);
    const lines = [];
    let current = '';
    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (next.length * approx > width && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    });
    if (current) lines.push(current);
    if (!lines.length) lines.push('');

    lines.forEach((line) => {
      this.ensure(size + 4);
      let drawX = x;
      if (align === 'center') {
        drawX = x + Math.max((width - line.length * approx) / 2, 0);
      } else if (align === 'right') {
        drawX = x + Math.max(width - line.length * approx, 0);
      }
      this.ops.push(`BT /${font} ${size} Tf ${hexColor(color)} rg ${drawX.toFixed(2)} ${this.y.toFixed(2)} Td (${encodePdfText(line)}) Tj ET`);
      this.y -= size + 4;
    });
  }

  space(amount = 10) {
    this.y -= amount;
  }

  line(color = '#1890FF') {
    this.ensure(8);
    const y = this.y;
    this.ops.push(`${hexColor(color)} RG 1.5 w ${this.margin} ${y} m ${this.width - this.margin} ${y} l S`);
    this.y -= 12;
  }

  toBlob() {
    if (this.ops.length) {
      this.pages.push(this.ops);
    }
    if (!this.pages.length) {
      this.pages.push([]);
    }

    const objects = [];
    const add = (body) => {
      objects.push(body);
      return objects.length;
    };

    const fontRegular = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const fontBold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const pageIds = [];

    this.pages.forEach((ops, index) => {
      const footer = `BT /F1 8 Tf 0.45 0.45 0.45 rg 40 28 Td (${encodePdfText(`${this.footer}  |  Pagina ${index + 1} de ${this.pages.length}`)}) Tj ET`;
      const stream = `${ops.join('\n')}\n${footer}`;
      const contentId = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      const pageId = add(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${this.width} ${this.height}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> >>`);
      pageIds.push(pageId);
    });

    const pagesId = add(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
    objects[pagesId - 1] = objects[pagesId - 1];
    pageIds.forEach((id) => {
      objects[id - 1] = objects[id - 1].replace('/Parent 0 0 R', `/Parent ${pagesId} 0 R`);
    });
    const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

    let offset = 0;
    const chunks = ['%PDF-1.4\n'];
    offset = chunks[0].length;
    const xref = [0];
    objects.forEach((body, index) => {
      xref.push(offset);
      const obj = `${index + 1} 0 obj\n${body}\nendobj\n`;
      chunks.push(obj);
      offset += obj.length;
    });

    const xrefStart = offset;
    let xrefTable = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    xref.slice(1).forEach((pos) => {
      xrefTable += `${String(pos).padStart(10, '0')} 00000 n \n`;
    });
    chunks.push(xrefTable);
    chunks.push(`trailer << /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
    return new Blob(chunks, { type: 'application/pdf' });
  }
}

export function reportPdf({ title, subtitle, lines = [] }) {
  const pdf = new SimplePdf();
  pdf.text('FUNDACION ROMPIENDO PARADIGMAS', { size: 16, bold: true, color: '#002140', align: 'center' });
  pdf.text('Sistema CRM de Gestion de Becas y Padrinazgo', { size: 10, color: '#595959', align: 'center' });
  pdf.space(4);
  pdf.line('#1890FF');
  pdf.text(title, { size: 14, bold: true, color: '#1890FF' });
  if (subtitle) {
    pdf.text(subtitle, { size: 10, color: '#595959' });
  }
  pdf.space(8);
  lines.forEach((line) => {
    if (line === '---') {
      pdf.line('#D9D9D9');
    } else {
      pdf.text(line, { size: 10 });
    }
  });
  pdf.space(16);
  pdf.text(`Generado el ${new Date().toLocaleString('es-DO')}`, { size: 9, color: '#8C8C8C', align: 'center' });
  return pdf.toBlob();
}
