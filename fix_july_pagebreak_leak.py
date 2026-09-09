import os, sys, subprocess

print("==========================================================================")
print("🧠 [1000 IQ FIX] FILTERING PAGE BREAK HEADERS SO NEW AGE MEDICAL IS PRESERVED...")
print("==========================================================================")

# 1. Update src/parsers/retailerParsers/modiRetailerParser.ts
modi_parser_code = """import * as pdfjsLib from 'pdfjs-dist';
import { matchMasterProduct } from '../common';
import { RetailerSaleRecord } from './dwarikaRetailerParser';

const LOCATION_KEYWORDS = [
  'BHOPALPURA', 'HOSPITAL RD', 'HOSPITAL ROAD', 'PANCHWATI', 'H/R',
  'JAIPUR', 'SEC-14', 'SEC 14', 'SECTOR 4', 'SECTOR-4', 'SECTOR 3',
  'SECTOR-3', 'RAJSAMAND', 'U.R.', 'UNIVERSITY ROAD', 'CHETAK MARG',
  'CHETAK CIRCLE', 'KANKROLI', 'ASHWINI BAZAR', 'ASHWINI BAZARA',
  'BHOPAL PURA', 'B.PURA', 'GOVERDHAN VILAS', 'H.C.', 'HATHIPOLE',
  'HIRAN MAGRI', 'KHAMNOR', 'MAVLI', 'MADRI', 'COURT CHORAHA', 'MANDI RD',
  'MANDI ROAD', 'GOGUNDA', 'AYAD', 'DEBARI', 'BEDLA', 'BHUWANA', 'UDIAPOLE',
  'SALUMBER', 'FATEH PURA', 'F.P.', 'FATEHNAGAR', 'CHHOTI SADRI', 'CHOTI SADRI',
  'PULA', 'SUNDERWAS', 'LAKKADWAS', 'LAKHDWAS', 'KHERWARA', 'BADGAON', 'VALLABH NAGAR'
];

function extractModiChemistDetails(rawName: string): { cleanName: string; address: string } {
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

const MONTH_NUM_MAP: Record<string, string> = {
  '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR',
  '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AUG',
  '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC'
};

function parseModiDataRow(line: string): { desc: string; qty: number; free: number; rate: number; amount: number } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('---') || trimmed.startsWith('===') || trimmed.startsWith('***')) return null;

  const upper = trimmed.toUpperCase().replace(/\\s+/g, '');
  if (
    upper.includes('MODIDISTRIBUTORS') || upper.includes('PAGENO') ||
    upper.includes('PAGE') || upper.includes('DESCRIPTIONQTY') ||
    upper.includes('DESCRIPTION') || upper.includes('GRANDTOTAL') ||
    upper.includes('ENDOFREPORT') || upper.includes('TOTAL:') ||
    upper.includes('CONTINUED') || upper.includes('REPORTFOR') ||
    upper.includes('DIOSLIFESCIENCES') || upper.includes('HAZARESHWER') ||
    upper.includes('GSTNO') || upper.includes('TIN.') ||
    upper.includes('FOODLIC') || upper.includes('PHONE:')
  ) {
    return null;
  }

  const rawTokens = trimmed.split(/\\s+/);
  if (rawTokens.length < 3) return null;

  const tailNums: number[] = [];
  let nameEndIdx = rawTokens.length;

  // Scan backwards for [percent], [amount], [rate], [free], [qty]
  for (let i = rawTokens.length - 1; i >= 0; i--) {
    const t = rawTokens[i].replace(/,/g, '').trim();
    if (/^-?\\d+(\\.\\d+)?$/.test(t)) {
      tailNums.unshift(parseFloat(t));
      nameEndIdx = i;
      if (tailNums.length === 5) break;
    } else if (t === '-' || t === '—' || t === '–') {
      tailNums.unshift(0);
      nameEndIdx = i;
      if (tailNums.length === 5) break;
    } else {
      break;
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

    if (qty !== 0 || free !== 0 || amount !== 0) {
      return { desc, qty, free, rate, amount: Number(amount.toFixed(2)) };
    }
  }

  return null;
}

export async function parseModiRetailerPdf(file: File): Promise<{ records: RetailerSaleRecord[]; detectedMonthCode?: string }> {
  let virtualLines: string[] = [];
  let detectedMonthCode: string | undefined = undefined;

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
          const dateMatch = fullLine.toUpperCase().match(/FROM\\s+\\d{2}[-/](\\d{2})[-/](\\d{4})/);
          if (dateMatch) detectedMonthCode = MONTH_NUM_MAP[dateMatch[1]];
        }
      }
    }
  }

  const records: RetailerSaleRecord[] = [];
  let currentParty: string = '';

  for (const line of virtualLines) {
    const dataRow = parseModiDataRow(line);

    // Case 1: Header Line (Chemist/Hospital Name)
    if (!dataRow) {
      const cleanDescWithoutPack = line.replace(/\\b\\d+[';]S\\b|\\b\\d+S\\b|\\b10S\\b|\\b15S\\b|\\b4S\\b|\\b14S\\b/gi, '').trim();
      const prod = matchMasterProduct(cleanDescWithoutPack) || matchMasterProduct(line);

      // 🛑 STRICT CHECK: Never treat report headers, page numbers, or zero-qty products as Chemist Name!
      if (!prod && line.length > 2) {
        const upper = line.toUpperCase().replace(/\\s+/g, '');
        if (
          !upper.includes('TOTAL:') &&
          !upper.includes('CONTINUED') &&
          !upper.includes('REPORTFOR') &&
          !upper.includes('DIOSLIFE') &&
          !upper.includes('PARSHWANATH') &&
          !upper.includes('COLONY,UDAIPUR') &&
          !upper.includes('PAGENO') &&
          !upper.includes('PAGE') &&
          !upper.includes('SALESSUMMARY') &&
          !upper.includes('WISE') &&
          !upper.includes('DESCRIPTION') &&
          !upper.includes('MODIDISTRIBUTORS') &&
          !upper.includes('PHONE:') &&
          !upper.includes('GSTNO') &&
          !upper.includes('TIN.') &&
          !upper.includes('FOODLIC')
        ) {
          currentParty = line;
        }
      }
      continue;
    }

    // Case 2: Data Row (Product + Pack + Numbers)
    const cleanDescWithoutPack = dataRow.desc.replace(/\\b\\d+[';]S\\b|\\b\\d+S\\b|\\b10S\\b|\\b15S\\b|\\b4S\\b|\\b14S\\b/gi, '').trim();
    const prodMatch = matchMasterProduct(cleanDescWithoutPack) || matchMasterProduct(dataRow.desc);

    if (prodMatch && currentParty) {
      const { cleanName, address } = extractModiChemistDetails(currentParty);
      records.push({
        retailerName: cleanName,
        address: address,
        productSn: prodMatch.sn,
        productName: prodMatch.name,
        salesQty: dataRow.qty,
        freeQty: dataRow.free,
        rate: dataRow.rate,
        amount: dataRow.amount
      });
    }
  }

  return { records, detectedMonthCode };
}
"""

with open('src/parsers/retailerParsers/modiRetailerParser.ts', 'w', encoding='utf-8') as f:
    f.write(modi_parser_code)

print("✅ 1. modiRetailerParser.ts page-break header filter fixed.")

# 2. Build production bundle
print("\n📦 [2/3] Compiling Production Bundle (npm run build)...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful.")

# 3. Direct Cloudflare Pages deploy
print("\n☁️ [3/3] Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Modi July 2026 Page-Break Fix is Live on Cloudflare!")
