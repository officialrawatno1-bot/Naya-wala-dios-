import os, sys, subprocess

print("==========================================================================")
print("🧠 [1000 IQ FIX] LOCKING GLOBAL FORMAT & RESOLVING CONTINUOUS PAGE BREAKS...")
print("==========================================================================")

parser_code = """import * as pdfjsLib from 'pdfjs-dist';
import { matchMasterProduct } from '../common';

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
  let clean = rawName.replace(/^[0-9.\\-\\s]+/, '').trim();
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

function parseQtyToken(tok: string): number {
  if (!tok || tok === '-' || tok === '—' || tok === '–') return 0;
  const n = parseFloat(tok.replace(/,/g, '').trim());
  return isNaN(n) ? 0 : n;
}

const MONTH_NUM_MAP: Record<string, string> = {
  '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR',
  '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AUG',
  '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC'
};

// 🌟 EXACT 5-COLUMN MARG ERP DATA TAIL REGEX
const DATA_ROW_REGEX = /^(.*?)\\s+([\\d.]+|[-—–])\\s+([\\d.]+|[-—–])\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\s*$/;

export async function parseDwarikaRetailerPdf(file: File): Promise<{ records: RetailerSaleRecord[]; detectedMonthCode?: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);
  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

  const records: RetailerSaleRecord[] = [];
  let globalFormat: 'ITEM_WISE' | 'PARTY_WISE' = 'ITEM_WISE';
  let detectedMonthCode: string | undefined = undefined;

  // 1. FIRST PASS: Detect Global Format & Month from Entire PDF Headers
  for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 2); pageNum++) {
    const page = await pdf.getPage(pageNum);
    const tc = await page.getTextContent();
    const pageText = tc.items.map((it: any) => it.str || '').join(' ').toUpperCase();

    if (!detectedMonthCode) {
      const dateMatch = pageText.match(/FROM\\s+\\d{2}\\/(\\d{2})\\/(\\d{4})/);
      if (dateMatch) {
        detectedMonthCode = MONTH_NUM_MAP[dateMatch[1]] || undefined;
      }
    }

    if (pageText.includes('PARTY / ITEM WISE') || pageText.includes('PARTY WISE')) {
      globalFormat = 'PARTY_WISE';
    } else if (pageText.includes('ITEM / ITEM WISE') || pageText.includes('ITEM WISE')) {
      globalFormat = 'ITEM_WISE';
    }
  }

  // 🌟 PERSISTENT STATE ACROSS PAGE BREAKS
  let currentHeaderProductSn = 0;
  let currentHeaderProductName = '';
  let currentHeaderPartyName = '';

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
        if (Math.abs(lineRefY[i] - item.y) <= 4.5) {
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
      const upper = fullLine.toUpperCase();
      const compact = upper.replace(/\\s+/g, '');

      // 🛑 STRICT HEADER & TOTAL FILTER
      if (
        !fullLine ||
        compact.includes('DWARIKAMEDICALS') ||
        compact.includes('PAGENO') ||
        compact.includes('DESCRIPTIONQTY') ||
        compact.includes('DESCRIPTION') ||
        compact.includes('GRANDTOTAL') ||
        compact.includes('ENDOFREPORT') ||
        compact.includes('TOTAL:') ||
        compact.includes('CONTINUED') ||
        compact.includes('REPORTFOR') ||
        compact.includes('DIOSLIFESCIENCE') ||
        compact.includes('SHOPNO') ||
        compact.includes('GSTIN') ||
        compact.includes('D.L.NO') ||
        compact.includes('FOODLIC') ||
        compact.includes('PHONE:') ||
        upper.startsWith('---') ||
        upper.startsWith('===')
      ) {
        continue;
      }

      const rowMatch = fullLine.match(DATA_ROW_REGEX);

      // =========================================================================
      // 1. FORMAT IS ITEM_WISE (Product Header -> Chemist Lines)
      // =========================================================================
      if (globalFormat === 'ITEM_WISE') {
        if (!rowMatch) {
          const prodMatch = matchMasterProduct(fullLine);
          if (prodMatch) {
            currentHeaderProductSn = prodMatch.sn;
            currentHeaderProductName = prodMatch.name;
          }
          continue;
        }

        const textCol = rowMatch[1].trim();
        const qty = parseQtyToken(rowMatch[2]);
        const free = parseQtyToken(rowMatch[3]);
        const rate = parseQtyToken(rowMatch[4]);
        const amount = parseQtyToken(rowMatch[5]);

        if (qty <= 0 && free <= 0) continue;

        if (currentHeaderProductSn > 0) {
          const { cleanName, address } = extractAddressAndCleanName(textCol);
          records.push({
            retailerName: cleanName,
            address: address,
            productSn: currentHeaderProductSn,
            productName: currentHeaderProductName,
            salesQty: qty,
            freeQty: free,
            rate: rate,
            amount: Number(amount.toFixed(2))
          });
        }
      }

      // =========================================================================
      // 2. FORMAT IS PARTY_WISE (Chemist Header -> Product Lines)
      // =========================================================================
      else if (globalFormat === 'PARTY_WISE') {
        if (!rowMatch) {
          if (fullLine.length > 2) {
            currentHeaderPartyName = fullLine;
          }
          continue;
        }

        const textCol = rowMatch[1].trim();
        const qty = parseQtyToken(rowMatch[2]);
        const free = parseQtyToken(rowMatch[3]);
        const rate = parseQtyToken(rowMatch[4]);
        const amount = parseQtyToken(rowMatch[5]);

        if (qty <= 0 && free <= 0) continue;

        const prodMatch = matchMasterProduct(textCol);
        if (prodMatch && currentHeaderPartyName) {
          const { cleanName, address } = extractAddressAndCleanName(currentHeaderPartyName);
          records.push({
            retailerName: cleanName,
            address: address,
            productSn: prodMatch.sn,
            productName: prodMatch.name,
            salesQty: qty,
            freeQty: free,
            rate: rate,
            amount: Number(amount.toFixed(2))
          });
        }
      }
    }
  }

  return { records, detectedMonthCode };
}
"""

with open('src/parsers/retailerParsers/dwarikaRetailerParser.ts', 'w', encoding='utf-8') as f:
    f.write(parser_code)
print("✅ 1. Fixed dwarikaRetailerParser.ts.")

# 2. Build Vite
print("\n📦 [2/3] Building Production Bundle...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful.")

# 3. Direct Cloudflare Pages Deploy
print("\n☁️ [3/3] Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Global Format Lock Deployed!")
