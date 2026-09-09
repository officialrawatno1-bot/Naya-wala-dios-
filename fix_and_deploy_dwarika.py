import os, sys, subprocess

print("==========================================================================")
print("🚀 [1/3] WRITING BULLETPROOF DWARIKA UNIVERSAL DUAL-FORMAT PARSER...")
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

export async function parseDwarikaRetailerPdf(file: File): Promise<RetailerSaleRecord[]> {
  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);
  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

  const records: RetailerSaleRecord[] = [];
  let reportFormat: 'ITEM_WISE' | 'PARTY_WISE' | 'UNKNOWN' = 'UNKNOWN';

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
        if (Math.abs(lineRefY[i] - item.y) <= 4.0) {
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

      if (reportFormat === 'UNKNOWN') {
        if (upper.includes('ITEM / ITEM WISE') || upper.includes('ITEM WISE')) {
          reportFormat = 'ITEM_WISE';
        } else if (upper.includes('PARTY / ITEM WISE') || upper.includes('PARTY WISE')) {
          reportFormat = 'PARTY_WISE';
        }
      }

      // Skip report non-data lines
      if (
        !fullLine ||
        upper.includes('DWARIKA MEDICALS') ||
        upper.includes('PAGE NO') ||
        upper.includes('DESCRIPTION QTY') ||
        upper.includes('GRAND TOTAL') ||
        upper.includes('END OF REPORT') ||
        upper.includes('TOTAL :') ||
        upper.includes('CONTINUED..') ||
        upper.includes('REPORT FOR') ||
        upper.includes('DIOS LIFESCIENCE') ||
        upper.includes('SHOP NO.') ||
        upper.includes('GSTIN') ||
        upper.includes('D.L.NO') ||
        upper.includes('FOOD LIC') ||
        upper.includes('PHONE :')
      ) {
        continue;
      }

      const tokens = fullLine.split(/\\s+/);
      const lastTokens: string[] = [];
      const nameTokens: string[] = [];

      for (let i = tokens.length - 1; i >= 0; i--) {
        const t = tokens[i].replace(/,/g, '').trim();
        if (/^-?\\d+(\\.\\d+)?$/.test(t) || t === '-' || t === '—' || t === '–') {
          lastTokens.unshift(t);
        } else {
          nameTokens.unshift(tokens[i]);
        }
      }

      const hasNumericTail = lastTokens.length >= 3;
      const textPart = nameTokens.join(' ').trim();

      // =========================================================================
      // 1. ITEM_WISE: Product Header -> Chemist Lines
      // =========================================================================
      if (reportFormat === 'ITEM_WISE') {
        const prodMatch = matchMasterProduct(fullLine);
        if (prodMatch && !hasNumericTail) {
          currentHeaderProductSn = prodMatch.sn;
          currentHeaderProductName = prodMatch.name;
          continue;
        }

        if (currentHeaderProductSn > 0 && hasNumericTail && textPart.length > 0) {
          const { cleanName, address } = extractAddressAndCleanName(textPart);
          const qty = parseQtyToken(lastTokens[0]);
          const free = parseQtyToken(lastTokens[1]);
          const rate = parseQtyToken(lastTokens[2]);
          const amount = lastTokens.length >= 4 ? parseQtyToken(lastTokens[3]) : (qty * rate);

          if (qty > 0 || free > 0) {
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
      }

      // =========================================================================
      // 2. PARTY_WISE: Chemist Header -> Product Lines
      // =========================================================================
      else if (reportFormat === 'PARTY_WISE') {
        const isHeaderRow = !hasNumericTail && fullLine.length > 2;

        if (isHeaderRow) {
          currentHeaderPartyName = fullLine;
          continue;
        }

        if (currentHeaderPartyName && hasNumericTail && textPart.length > 0) {
          const prodMatch = matchMasterProduct(textPart);
          if (prodMatch) {
            const { cleanName, address } = extractAddressAndCleanName(currentHeaderPartyName);
            const qty = parseQtyToken(lastTokens[0]);
            const free = parseQtyToken(lastTokens[1]);
            const rate = parseQtyToken(lastTokens[2]);
            const amount = lastTokens.length >= 4 ? parseQtyToken(lastTokens[3]) : (qty * rate);

            if (qty > 0 || free > 0) {
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

      // =========================================================================
      // 3. AUTO-DETECTION FALLBACK
      // =========================================================================
      else {
        const prodMatch = matchMasterProduct(fullLine);
        if (prodMatch && !hasNumericTail) {
          reportFormat = 'ITEM_WISE';
          currentHeaderProductSn = prodMatch.sn;
          currentHeaderProductName = prodMatch.name;
        } else if (!hasNumericTail && fullLine.length > 2) {
          reportFormat = 'PARTY_WISE';
          currentHeaderPartyName = fullLine;
        }
      }
    }
  }

  return records;
}
"""

with open('src/parsers/retailerParsers/dwarikaRetailerParser.ts', 'w', encoding='utf-8') as f:
    f.write(parser_code)

print("✅ Parser updated.")

print("\n==========================================================================")
print("📦 [2/3] COMPILING VITE FRONTEND (npm run build)...")
print("==========================================================================")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful.")

print("\n==========================================================================")
print("☁️ [3/3] DEPLOYING DIRECTLY TO CLOUDFLARE PAGES (dios-hub)...")
print("==========================================================================")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Live deployment is updated on Cloudflare Pages!")
