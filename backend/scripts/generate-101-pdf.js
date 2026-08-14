const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

function generateReporte101() {
  const doc = new PDFDocument({ margin: 40, size: 'LETTER' });

  const artifactDir = 'C:\\Users\\Erick\\.gemini\\antigravity\\brain\\cdcc2025-b395-419e-8163-58d1c80eb802';
  const outPathArtifact = path.join(artifactDir, 'Reporte_101_Politecnico_Canada.pdf');
  const outPathLocal = 'c:\\Users\\Erick\\Desktop\\Fundacion Rompiendo Paradigmas\\crm-becas\\Reporte_101_Politecnico_Canada.pdf';

  const writeStreamArtifact = fs.createWriteStream(outPathArtifact);
  const writeStreamLocal = fs.createWriteStream(outPathLocal);

  doc.pipe(writeStreamArtifact);
  doc.pipe(writeStreamLocal);

  // --- HEADER RED LOGO BRANDING ---
  doc.fillColor('#E53935')
     .fontSize(22)
     .font('Helvetica-Bold')
     .text('ROMPIENDO PARADIGMAS', 40, 40);

  doc.fillColor('#757575')
     .fontSize(9)
     .font('Helvetica')
     .text('FUNDACIÓN DE BECAS ESTUDIANTILES', 40, 65);

  doc.fillColor('#212121')
     .fontSize(10)
     .text('Santiago de los Caballeros, 14 de agosto del año 2026', 320, 50, { align: 'right' });

  doc.moveDown(1.5);
  doc.moveTo(40, doc.y).lineTo(570, doc.y).strokeColor('#E53935').lineWidth(2).stroke().moveDown(1);

  // --- EVENT TITLE ---
  doc.fillColor('#1A237E')
     .fontSize(15)
     .font('Helvetica-Bold')
     .text('Acto de Entrega de Reconocimientos y Becas 2026', { align: 'left' });

  doc.fillColor('#D32F2F')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text('Politécnico Canadá', { align: 'left' })
     .moveDown(0.3);

  doc.fillColor('#424242')
     .fontSize(10)
     .font('Helvetica')
     .text('Viernes 14 de Agosto del 2026, a las 4:00 PM (Salón Principal del Centro)')
     .moveDown(0.8);

  // --- GENERAL CENTER DATA ---
  doc.fillColor('#0D47A1')
     .fontSize(11)
     .font('Helvetica-Bold')
     .text('Directora del Centro: ', { continued: true })
     .font('Helvetica')
     .fillColor('#212121')
     .text('María Margarita Estévez Cabral');

  doc.fillColor('#0D47A1')
     .font('Helvetica-Bold')
     .text('Año de Integración a la Fundación: ', { continued: true })
     .font('Helvetica')
     .fillColor('#212121')
     .text('2025');

  doc.fillColor('#0D47A1')
     .font('Helvetica-Bold')
     .text('Cantidad de Graduandos: ', { continued: true })
     .font('Helvetica')
     .fillColor('#212121')
     .text('Promoción 2026')
     .moveDown(1.2);

  // --- BECA DEL AÑO BOX ---
  const boxTop = doc.y;
  doc.rect(40, boxTop, 530, 95).fillAndStroke('#F5F5F5', '#1976D2');

  doc.fillColor('#0D47A1')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('BECA DEL AÑO 2026 – LA GANADORA ES:', 50, boxTop + 10);

  doc.fillColor('#B71C1C')
     .fontSize(15)
     .font('Helvetica-Bold')
     .text('Hansel Marcelino López', 50, boxTop + 28);

  doc.fillColor('#212121')
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('Va a estudiar: ', 50, boxTop + 48, { continued: true })
     .font('Helvetica')
     .text('Ingeniería en Sistemas Computacionales en UTESA.')
     .font('Helvetica-Bold')
     .text('Patrocinador / Cortesía: ', 50, boxTop + 62, { continued: true })
     .font('Helvetica')
     .text('Brayan Collado')
     .font('Helvetica-Bold')
     .text('Perfil: ', 50, boxTop + 76, { continued: true })
     .font('Helvetica')
     .text('Destacado en olimpiadas académicas y Modelos de las Naciones Unidas (MUN).');

  doc.y = boxTop + 105;
  doc.moveDown(1);

  // --- TERNA ESTUDIANTES ---
  doc.fillColor('#1A237E')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('LOS ESTUDIANTES DE LA TERNA SON:')
     .moveDown(0.5);

  doc.fillColor('#212121')
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('1- Sujeiri del Carmen Zarzuela Rodríguez: ', { continued: true })
     .font('Helvetica')
     .text('Quiere estudiar la carrera de Turismo u Odontología. Apoya el sustento del hogar trabajando los fines de semana. Su madre es trabajadora doméstica y su padre agricultor.')
     .moveDown(0.5);

  doc.fillColor('#212121')
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('2- Wendy Mateo Sánchez: ', { continued: true })
     .font('Helvetica')
     .text('Quiere estudiar la carrera de Medicina (Pediatría o Cirugía). Participa en jornadas de saneamiento y reforestación. Su padre es miembro de la Policía Nacional.')
     .moveDown(1.2);

  // --- BECADOS ACTUALES EN UNIVERSIDAD ---
  doc.fillColor('#1A237E')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('BECADOS ACTUALES EN LA UNIVERSIDAD:')
     .moveDown(0.5);

  doc.fillColor('#212121')
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('• Jeili Serrata Castro (Matrícula 1-25-2165): ', { continued: true })
     .font('Helvetica')
     .text('Becada en el año 2025. Estudia la carrera de Derecho en UTESA. Cuenta con un excelente índice académico acumulado de 3.60.')
     .moveDown(1.2);

  // --- GRADUADOS UNIVERSITARIOS ---
  doc.fillColor('#1A237E')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('GRADUADOS UNIVERSITARIOS DEL CENTRO:')
     .moveDown(0.5);

  doc.fillColor('#616161')
     .fontSize(10)
     .font('Helvetica-Oblique')
     .text('- No hay graduados universitarios de este centro aún (estudiantes actualmente en curso).')
     .moveDown(2);

  // --- FOOTER ---
  doc.moveTo(40, 720).lineTo(570, 720).strokeColor('#BDBDBD').lineWidth(0.5).stroke();

  doc.fillColor('#616161')
     .fontSize(8)
     .font('Helvetica')
     .text('Calle E. León Jiménez #12, Reparto del Este, Santiago • Tel. 809-995-0808 / 809-669-8000', 40, 730, { align: 'center' })
     .text('RNC: 430-28829-2 • Email: servicios@rompiendoparadigmas.com.do', 40, 742, { align: 'center' });

  doc.end();

  console.log('Successfully generated Reporte 101 PDF for Politécnico Canadá!');
}

generateReporte101();
