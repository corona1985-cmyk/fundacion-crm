const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

function generateReporte101() {
  const doc = new PDFDocument({ margin: 36, size: 'LETTER' });

  const artifactDir = 'C:\\Users\\Erick\\.gemini\\antigravity\\brain\\cdcc2025-b395-419e-8163-58d1c80eb802';
  const outPathArtifact = path.join(artifactDir, 'Reporte_101_Politecnico_Canada.pdf');
  const outPathLocal = 'c:\\Users\\Erick\\Desktop\\Fundacion Rompiendo Paradigmas\\crm-becas\\Reporte_101_Politecnico_Canada.pdf';

  const writeStreamArtifact = fs.createWriteStream(outPathArtifact);
  const writeStreamLocal = fs.createWriteStream(outPathLocal);

  doc.pipe(writeStreamArtifact);
  doc.pipe(writeStreamLocal);

  // --- HEADER BRANDING ---
  doc.fillColor('#E53935')
     .fontSize(22)
     .font('Helvetica-Bold')
     .text('ROMPIENDO PARADIGMAS', 36, 36);

  doc.fillColor('#616161')
     .fontSize(9.5)
     .font('Helvetica-Bold')
     .text('FUNDACIÓN DE BECAS ESTUDIANTILES', 36, 62);

  doc.fillColor('#212121')
     .fontSize(10.5)
     .font('Helvetica')
     .text('Santiago de los Caballeros, 14 de agosto del año 2026', 280, 36, { width: 296, align: 'right' });

  // Red separator line
  doc.moveTo(36, 76).lineTo(576, 76).strokeColor('#E53935').lineWidth(2).stroke();

  // --- EVENT TITLE ---
  doc.fillColor('#1A237E')
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('Acto de Entrega de Reconocimientos y Becas 2026', 36, 86);

  doc.fillColor('#D32F2F')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text('Politécnico Canadá')
     .moveDown(0.15);

  doc.fillColor('#333333')
     .fontSize(10.5)
     .font('Helvetica')
     .text('Viernes 14 de Agosto del 2026, a las 4:00 PM (Salón Principal del Centro)')
     .moveDown(0.5);

  // --- GENERAL CENTER DATA ---
  doc.fillColor('#0D47A1')
     .fontSize(11)
     .font('Helvetica-Bold')
     .text('Directora del Centro: ', { continued: true })
     .font('Helvetica')
     .fillColor('#212121')
     .text('María Margarita Estévez Cabral');

  doc.fillColor('#0D47A1')
     .fontSize(11)
     .font('Helvetica-Bold')
     .text('Año de Integración a la Fundación: ', { continued: true })
     .font('Helvetica')
     .fillColor('#212121')
     .text('2025');

  doc.fillColor('#0D47A1')
     .fontSize(11)
     .font('Helvetica-Bold')
     .text('Cantidad de Graduandos: ', { continued: true })
     .font('Helvetica')
     .fillColor('#212121')
     .text('Promoción 2026')
     .moveDown(0.6);

  // --- BECA DEL AÑO BOX ---
  const boxTop = doc.y;
  doc.rect(36, boxTop, 540, 108).fillAndStroke('#F5F5F5', '#1976D2');

  doc.fillColor('#0D47A1')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('BECA #162 EN GENERAL Y #12 DEL AÑO 2026 – El ganador es:', 46, boxTop + 10);

  doc.fillColor('#B71C1C')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text('Hansel Marcelino López', 46, boxTop + 28);

  doc.fillColor('#212121')
     .fontSize(10.5)
     .font('Helvetica-Bold')
     .text('Va a estudiar: ', 46, boxTop + 49, { continued: true })
     .font('Helvetica')
     .text('Ingeniería en Sistemas Computacionales en UTESA.')
     .font('Helvetica-Bold')
     .text('Patrocinador / Cortesía: ', 46, boxTop + 65, { continued: true })
     .font('Helvetica')
     .text('Brayan Collado')
     .font('Helvetica-Bold')
     .text('Perfil: ', 46, boxTop + 81, { continued: true })
     .font('Helvetica')
     .text('Destacado en olimpiadas académicas y Modelos de las Naciones Unidas (MUN).');

  doc.y = boxTop + 116;
  doc.moveDown(0.6);

  // --- TERNA ESTUDIANTES ---
  doc.fillColor('#1A237E')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('LOS ESTUDIANTES DE LA TERNA SON:')
     .moveDown(0.3);

  doc.fillColor('#212121')
     .fontSize(10.5)
     .font('Helvetica-Bold')
     .text('1- Sujeiri del Carmen Zarzuela Rodríguez: ', { continued: true })
     .font('Helvetica')
     .text('Quiere estudiar Turismo u Odontología. Apoya el sustento del hogar trabajando los fines de semana. Madre es trabajadora doméstica y padre agricultor.')
     .moveDown(0.4);

  doc.fillColor('#212121')
     .fontSize(10.5)
     .font('Helvetica-Bold')
     .text('2- Wendy Mateo Sánchez: ', { continued: true })
     .font('Helvetica')
     .text('Quiere estudiar Medicina (Pediatría o Cirugía). Participa en jornadas de saneamiento y reforestación. Padre es miembro de la Policía Nacional.')
     .moveDown(0.7);

  // --- BECADOS ACTUALES EN UNIVERSIDAD ---
  doc.fillColor('#1A237E')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('BECADOS ACTUALES EN LA UNIVERSIDAD:')
     .moveDown(0.3);

  doc.fillColor('#212121')
     .fontSize(10.5)
     .font('Helvetica-Bold')
     .text('• Jeili Serrata Castro (Matrícula 1-25-2165): ', { continued: true })
     .font('Helvetica')
     .text('Becada en el año 2025. Estudia Derecho en UTESA. Cuenta con un excelente promedio académico acumulado de 3.60.')
     .moveDown(0.7);

  // --- GRADUADOS UNIVERSITARIOS ---
  doc.fillColor('#1A237E')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('GRADUADOS UNIVERSITARIOS DEL CENTRO:')
     .moveDown(0.3);

  doc.fillColor('#616161')
     .fontSize(10)
     .font('Helvetica-Oblique')
     .text('- No hay graduados universitarios de este centro aún (estudiantes actualmente en curso).');

  // --- FOOTER ---
  doc.moveTo(36, 715).lineTo(576, 715).strokeColor('#BDBDBD').lineWidth(0.5).stroke();

  doc.fillColor('#616161')
     .fontSize(8.5)
     .font('Helvetica')
     .text('Calle E. León Jiménez #12, Reparto del Este, Santiago • Tel. 809-995-0808 / 809-669-8000', 36, 723, { align: 'center' })
     .text('RNC: 430-28829-2 • Email: servicios@rompiendoparadigmas.com.do', 36, 735, { align: 'center' });

  doc.end();

  console.log('Successfully generated perfectly formatted single-page Reporte 101 PDF for Politécnico Canadá!');
}

generateReporte101();
