import * as XLSX from 'xlsx';
import { PartyParseSummary, matchMasterProduct } from './common';

export async function parseDwarikaFile(file: File, partyName: string = 'Dwarika Medicals'): Promise<PartyParseSummary> {
  const items: Record<number, { sales: number; closing: number }> = {};
  let count = 0;
  let totalSales = 0;
  let totalClosing = 0;

  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  let prodCol = 0;
  let salesCol = 6;
  let closingCol = 8;
  let startRow = 7;

  for (let r = 0; r < Math.min(rows.length, 12); r++) {
    const row = rows[r] || [];
    const rowStr = row.map(c => String(c || '').toUpperCase()).join(' | ');

    if (rowStr.includes('PRODUCT') || rowStr.includes('DESCRIPTION') || rowStr.includes('ISSUE')) {
      startRow = r + 1;
      row.forEach((cell, cIdx) => {
        const c = String(cell || '').replace(/[\r\n]+/g, ' ').toUpperCase().trim();
        if (c.includes('PRODUCT') || c.includes('DESCRIPTION')) prodCol = cIdx;
        if (c.includes('ISSUE') && c.includes('QUANTITY')) salesCol = cIdx;
        if (c.includes('CLOSING') && (c.includes('STOCK') || c.includes('BAL'))) closingCol = cIdx;
      });
      break;
    }
  }

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawProd = String(row[prodCol] || '').trim();
    if (!rawProd || rawProd.toUpperCase().includes('TOTAL') || rawProd.toUpperCase().includes('MARG ERP')) continue;

    const matched = matchMasterProduct(rawProd);
    if (matched) {
      const sales = parseFloat(String(row[salesCol] || '0').replace(/,/g, '')) || 0;
      const closing = parseFloat(String(row[closingCol] || '0').replace(/,/g, '')) || 0;

      if (!items[matched.sn]) {
        items[matched.sn] = { sales: 0, closing: 0 };
        count++;
      }
      items[matched.sn].sales += sales;
      items[matched.sn].closing += closing;
      totalSales += sales;
      totalClosing += closing;
    }
  }

  return { partyName, fileName: file.name, itemCount: count, totalSales, totalClosing, items };
}
