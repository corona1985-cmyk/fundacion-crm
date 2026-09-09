import { escapeXml } from './downloadFile';

function cellXml(value, header = false) {
  const numeric = typeof value === 'number' && Number.isFinite(value);
  const type = numeric ? 'Number' : 'String';
  const text = numeric ? String(value) : escapeXml(value);
  const style = header ? ' ss:StyleID="header"' : '';
  return `<Cell${style}><Data ss:Type="${type}">${text}</Data></Cell>`;
}

export function buildExcelBlob(sheets) {
  const worksheets = sheets.map((sheet) => {
    const headers = sheet.headers || [];
    const rows = sheet.rows || [];
    const headerRow = `<Row>${headers.map((header) => cellXml(header, true)).join('')}</Row>`;
    const dataRows = rows.map((row) => (
      `<Row>${headers.map((header) => cellXml(row[header])).join('')}</Row>`
    )).join('');
    const name = escapeXml(sheet.name || 'Hoja1').slice(0, 31);
    return `<Worksheet ss:Name="${name}"><Table>${headerRow}${dataRows}</Table></Worksheet>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1890FF" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 ${worksheets}
</Workbook>`;

  return new Blob([xml], { type: 'application/vnd.ms-excel' });
}
