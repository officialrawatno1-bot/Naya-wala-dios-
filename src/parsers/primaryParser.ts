import * as XLSX from 'xlsx';
import { PartyParseSummary, matchMasterProduct } from './common';

export async function parsePrimaryFile(file: File, partyName: string = 'Company Primary Dispatch'): Promise<PartyParseSummary> {
  const items: Record<number, { sales: number; closing: number }> = {};
  let count = 0;
  let totalSales = 0;

  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  let prodCol = 0;
  let priQtyCol = 1;
  let startRow = 0;

  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r] || [];
    const rowStr = row.map(c => String(c || '').toUpperCase()).join(' | ');

    if (rowStr.includes('PRODUCT') || rowStr.includes('PRIMARY QTY') || rowStr.includes('QTY')) {
      startRow = r + 1;
      row.forEach((cell, idx) => {
        const c = String(cell || '').toUpperCase().trim();
        if (c.includes('PRODUCT')) prodCol = idx;
        if (c.includes('PRIMARY QTY') || (c.includes('QTY') && !c.includes('VAL') && !c.includes('RATE'))) priQtyCol = idx;
      });
      break;
    }
  }

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawProd = String(row[prodCol] || '').trim();
    if (!rawProd || rawProd.toUpperCase().includes('TOTAL') || rawProd.toUpperCase().includes('COUNT') || rawProd.toUpperCase().includes('PRIMARY SALES') || rawProd.toUpperCase().includes('HEAD QTR') || rawProd.toUpperCase().includes('UDAIPUR')) continue;

    const matched = matchMasterProduct(rawProd);
    if (matched) {
      let qtyStr = String(row[priQtyCol] !== undefined ? row[priQtyCol] : row[1] || '0').replace(/,/g, '').trim();
      let priQty = parseFloat(qtyStr);
      if (isNaN(priQty)) priQty = 0;

      if (!items[matched.sn]) {
        items[matched.sn] = { sales: 0, closing: 0 };
        count++;
      }
      items[matched.sn].sales += priQty;
      totalSales += priQty;
    }
  }

  return {
    partyName,
    fileName: file.name,
    itemCount: count,
    totalSales,
    totalClosing: 0,
    items,
  };
}
