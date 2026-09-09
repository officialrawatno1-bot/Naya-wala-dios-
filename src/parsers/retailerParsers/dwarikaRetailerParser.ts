import * as pdfjsLib from 'pdfjs-dist';
import { matchMasterProduct, MasterProduct } from '../common';

export interface RetailerSaleRecord {
  retailerName: string;
  address: string;
  productSn: number;
  productName: string;
  salesQty: number;
  freeQty: number;
  rate: number;
  amount: number;
}

const LOCATION_KEYWORDS = [
  'FATEHNAGAR', 'DUNGARPUR', 'BANSWARA', 'SALUMBER', 'KHAMNOR', 'MADRI',
  'BHOPALPURA', 'SEVASHRAM', 'AYAD', 'BEDLA', 'BHUWANA', 'UDIAPOLE',
  'HOSPITAL ROAD', 'PRATAPNAGAR', 'PRATAPNA', 'CHOTI SADRI', 'KURABAD',
  'KANKROLI', 'NATHDWARA', 'KHERWARA', 'BADGAON', 'GOGUNDA', 'RAMGARH',
  'SECTOR 4', 'SECTOR-4', 'SECTOR 3', 'SECTOR-3', 'SECTOR 14', 'SEC 14',
  'SEC.14', 'DELHI GATE', 'DHAN MANDI', 'HATHIPOLE', 'ASHWINI BAZAR',
  'ASHWINI BAZARA', 'SUNDERWAS', 'SAVINA', 'SHOBHAGPURA', 'DABOK',
  'BARI SADRI', 'GARIYAWAS', 'BHETWAR', 'KELWARA', 'RAMPURA', 'SAIFAN',
  'NEW BHOPAL', 'H/R'
];

function extractAddressAndCleanName(rawName: string): { cleanName: string; address: string } {
  let clean = rawName.replace(/^[0-9.\-\s]+/, '').trim();
  let address = 'UDAIPUR';
  const upper = clean.toUpperCase();

  for (const loc of LOCATION_KEYWORDS) {
    if (upper.includes(loc)) {
      address = loc;
      break;
    }
  }

  return { cleanName: clean.toUpperCase(), address: address.toUpperCase() };
}

const MONTH_NUM_MAP: Record<string, string> = {
  '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR',
  '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AUG',
  '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC'
};

// 🌟 SMART 5-COLUMN MARG ERP TOKENIZER (Safely protects numbers inside product/chemist names)
function parseMargDataRow(line: string): { desc: string; qty: number; free: number; rate: number; amount: number } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('---') || trimmed.startsWith('===') || trimmed.startsWith('***')) return null;

  const upper = trimmed.toUpperCase().replace(/\s+/g, '');
  if (
    upper.includes('DWARIKAMEDICALS') || upper.includes('PAGENO') ||
    upper.includes('DESCRIPTIONQTY') || upper.includes('GRANDTOTAL') ||
    upper.includes('ENDOFREPORT') || upper.includes('TOTAL:') ||
    upper.includes('CONTINUED') || upper.includes('REPORTFOR') ||
    upper.includes('DIOSLIFESCIENCE') || upper.includes('SHOPNO') ||
    upper.includes('GSTIN') || upper.includes('D.L.NO') ||
    upper.includes('FOODLIC') || upper.includes('PHONE:')
  ) {
    return null;
  }

  const rawTokens = trimmed.split(/\s+/);
  if (rawTokens.length < 3) return null;

  const tailNums: number[] = [];
  let nameEndIdx = rawTokens.length;

  // Scan backwards from right to left: [percent], [amount], [rate], [free], [qty]
  for (let i = rawTokens.length - 1; i >= 0; i--) {
    const t = rawTokens[i].replace(/,/g, '').trim();
    if (/^-?\d+(\.\d+)?$/.test(t)) {
      tailNums.unshift(parseFloat(t));
      nameEndIdx = i;
      if (tailNums.length === 5) break; // Reached exact 5 columns!
    } else if (t === '-' || t === '—' || t === '–') {
      tailNums.unshift(0);
      nameEndIdx = i;
      if (tailNums.length === 5) break;
    } else {
      break; // Hit text, stop scanning!
    }
  }

  if (tailNums.length >= 3 && nameEndIdx > 0) {
    const desc = rawTokens.slice(0, nameEndIdx).join(' ').trim();
    if (!desc) return null;

    let qty = 0, free = 0, rate = 0, amount = 0;

    if (tailNums.length === 5) {
      qty = tailNums[0];
      free = tailNums[1];
      rate = tailNums[2];
      amount = tailNums[3];
    } else if (tailNums.length === 4) {
      qty = tailNums[0];
      free = tailNums[1];
      rate = tailNums[2];
      amount = tailNums[3];
    } else if (tailNums.length === 3) {
      qty = tailNums[0];
      free = 0;
      rate = tailNums[1];
      amount = tailNums[2];
    }

    if (qty > 0 || free > 0 || amount > 0) {
      return { desc, qty, free, rate, amount: Number(amount.toFixed(2)) };
    }
  }

  return null;
}

export async function parseDwarikaRetailerPdf(file: File): Promise<{ records: RetailerSaleRecord[]; detectedMonthCode?: string; rawCsv?: string }> {
  let virtualLines: string[] = [];
  let detectedMonthCode: string | undefined = undefined;

  if (file.name.toLowerCase().endsWith('.csv')) {
    const text = await file.text();
    virtualLines = text.split(/\r?\n/);
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const rawItems: Array<{ x: number; y: number; text: string }> = [];
      textContent.items.forEach((it: any) => {
        if (it && it.transform && typeof it.str === 'string') {
          const text = it.str.trim();
          if (text.length > 0) {
            rawItems.push({ x: it.transform[4] || 0, y: it.transform[5] || 0, text });
          }
        }
      });

      rawItems.sort((a, b) => b.y - a.y || a.x - b.x);

      const lineBins: Array<Array<{ x: number; text: string }>> = [];
      const lineRefY: number[] = [];

      rawItems.forEach(item => {
        let matchedIdx = -1;
        for (let i = 0; i < lineRefY.length; i++) {
          if (Math.abs(lineRefY[i] - item.y) <= 4.8) {
            matchedIdx = i;
            break;
          }
        }
        if (matchedIdx !== -1) {
          lineBins[matchedIdx].push({ x: item.x, text: item.text });
        } else {
          lineRefY.push(item.y);
          lineBins.push([{ x: item.x, text: item.text }]);
        }
      });

      for (const lineItems of lineBins) {
        lineItems.sort((a, b) => a.x - b.x);
        const fullLine = lineItems.map(it => it.text).join(' ').trim();
        if (fullLine) {
          virtualLines.push(fullLine);
          if (!detectedMonthCode) {
            const dateMatch = fullLine.toUpperCase().match(/FROM\s+\d{2}\/(\d{2})\/(\d{4})/);
            if (dateMatch) detectedMonthCode = MONTH_NUM_MAP[dateMatch[1]];
          }
        }
      }
    }
  }

  // 🌟 UNIVERSAL DUAL-INVARIANT STATE MACHINE
  const records: RetailerSaleRecord[] = [];
  let currentProduct: MasterProduct | null = null;
  let currentParty: string = '';

  for (const line of virtualLines) {
    const dataRow = parseMargDataRow(line);

    // =========================================================================
    // CASE 1: HEADER LINE (No numeric tail)
    // =========================================================================
    if (!dataRow) {
      const prod = matchMasterProduct(line);
      if (prod) {
        currentProduct = prod;
      } else if (line.length > 2) {
        const upper = line.toUpperCase().replace(/\s+/g, '');
        if (!upper.includes('TOTAL:') && !upper.includes('CONTINUED') && !upper.includes('REPORTFOR') && !upper.includes('DIOSLIFE') && !upper.includes('SHOPNO')) {
          currentParty = line;
        }
      }
      continue;
    }

    // =========================================================================
    // CASE 2: DATA ROW (Has Qty, Free, Rate, Amount)
    // =========================================================================
    const rowProd = matchMasterProduct(dataRow.desc);

    // Sub-case A: row.desc is a PRODUCT (Party-wise PDF layout)
    if (rowProd) {
      const partyToUse = currentParty || 'UDAIPUR MEDICAL';
      const { cleanName, address } = extractAddressAndCleanName(partyToUse);
      records.push({
        retailerName: cleanName,
        address: address,
        productSn: rowProd.sn,
        productName: rowProd.name,
        salesQty: dataRow.qty,
        freeQty: dataRow.free,
        rate: dataRow.rate,
        amount: dataRow.amount
      });
    }
    // Sub-case B: row.desc is a CHEMIST (Item-wise PDF layout)
    else if (currentProduct) {
      const { cleanName, address } = extractAddressAndCleanName(dataRow.desc);
      records.push({
        retailerName: cleanName,
        address: address,
        productSn: currentProduct.sn,
        productName: currentProduct.name,
        salesQty: dataRow.qty,
        freeQty: dataRow.free,
        rate: dataRow.rate,
        amount: dataRow.amount
      });
    }
  }

  return { records, detectedMonthCode };
}
