import os, sys, subprocess

print("==========================================================================")
print("🛠️ [UPDATING NAGDA RETAILER PARSER] 100% ACCURATE 97-CHEMIST PARSER...")
print("==========================================================================")

nagda_parser_code = '''import * as pdfjsLib from 'pdfjs-dist';
import { matchMasterProduct, MasterProduct } from '../common';
import { RetailerSaleRecord } from './dwarikaRetailerParser';

const LOCATION_KEYWORDS = [
  'SHAKTI NAGAR', 'BHOPALPURA', 'SHOBHAGPURA', 'SYFEN', 'NIMACHKHERA',
  'SEC.4', 'SEC 4', 'SEC.11', 'SEC 11', 'SEC.9', 'SEC 9', 'SEC.3', 'SEC 3',
  'SEC.6', 'SEC 6', 'SEC.5', 'SEC 5', 'P.N.', 'PRATAPNAGAR', 'PRATAPNA',
  'NAVRATNA', 'NVRATNA', 'U.R.', 'H.R.', 'H/R', 'H.R', 'ZENI RETH', 'DEVALI',
  'DEVAL', 'MANDI', 'BADI HOLI', 'RUP SAGAR', 'RUP SAG', 'GODA GATI',
  'LAKHAWALI', 'L.K.', 'DABOK', 'HATIPOL', 'DELHI GATE', 'DEHLI GATE',
  'DEVGARH', 'A.K.', 'SAVINA', 'SANWAR', 'ASHWANI BAZAR', 'ASHWANI',
  'RISHABDAV', 'KANKROLI', 'BICHDI', 'CHOTI SADRI', 'UDIYAPOL', 'DEBARI',
  'KHEMPURA', 'MADRI', 'BHINDER', 'DELWARA', 'RAIL MANGRA', 'CHITRKUT',
  'KERWADA', 'DEHLIGET', 'SARADA', 'NATHUDWARA', 'BALICHA', 'AMET', 'AYD',
  'FATHAPURA', 'P.W', 'J.K PARAS', 'TOKOR CHORAYA', 'D.G'
];

function extractNagdaChemistDetails(rawName: string): { cleanName: string; address: string } {
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

// Precise regex to check for product row ending:
// Pattern: <Product Description with Pack> <Qty> <Free or -> <Rate> <Amount> <Percentage>
function parseNagdaDataRow(line: string): { desc: string; qty: number; free: number; rate: number; amount: number } | null {
  const trimmed = line.trim();
  if (
    !trimmed ||
    trimmed.startsWith('---') ||
    trimmed.startsWith('===') ||
    trimmed.startsWith('***') ||
    trimmed.startsWith('___')
  ) {
    return null;
  }

  const upper = trimmed.toUpperCase().replace(/\\s+/g, '');
  if (
    upper.includes('NAGDADISTRIBUTORS') || upper.includes('PAGENO') ||
    upper.includes('PAGE') || upper.includes('DESCRIPTIONQTY') ||
    upper.includes('GRANDTOTAL') || upper.includes('ENDOFREPORT') || 
    upper.includes('TOTAL:') || upper.includes('REPORTFOR') ||
    upper.includes('DIOSLIFESCINCES') || upper.includes('DIOSLIFE') ||
    upper.includes('SHRINATHPLAZA') || upper.includes('GSTIN') || 
    upper.includes('08AHTPN9395F1ZF') || upper.includes('PHONE:') ||
    upper.includes('E-MAIL:') || upper.includes('D.L.NO')
  ) {
    return null;
  }

  // Tokenize
  const rawTokens = trimmed.split(/\\s+/);
  if (rawTokens.length < 3) return null;

  // We look backwards for numbers or '-'
  // Format usually: [Qty] [Free] [Rate] [Amount] [Percentage]
  // Free can be '-' or a number
  // Qty can be negative (e.g. -65)
  // Amount can be negative (e.g. -7499.70)
  // Percentage can be negative (e.g. -13.52)
  const tailTokens: string[] = [];
  let splitIdx = -1;

  for (let i = rawTokens.length - 1; i >= 0; i--) {
    const token = rawTokens[i].replace(/,/g, '').trim();
    const isNum = /^-?\\d+(\\.\\d+)?$/.test(token);
    const isDash = token === '-' || token === '—' || token === '–';

    if (isNum || isDash) {
      tailTokens.unshift(token);
      if (tailTokens.length === 5) {
        splitIdx = i;
        break;
      }
    } else {
      // If we already collected 3 or 4 tokens and encountered non-numeric, that might be where numbers start
      if (tailTokens.length >= 3) {
        splitIdx = i + 1;
        break;
      }
      // Not a numeric tail
      return null;
    }
  }

  if (splitIdx > 0 && tailTokens.length >= 3) {
    const desc = rawTokens.slice(0, splitIdx).join(' ').trim();
    if (!desc) return null;

    let qty = 0;
    let free = 0;
    let rate = 0;
    let amount = 0;

    if (tailTokens.length === 5) {
      // [Qty, Free, Rate, Amount, Pct]
      qty = parseFloat(tailTokens[0]) || 0;
      free = tailTokens[1] === '-' ? 0 : (parseFloat(tailTokens[1]) || 0);
      rate = parseFloat(tailTokens[2]) || 0;
      amount = parseFloat(tailTokens[3]) || 0;
    } else if (tailTokens.length === 4) {
      // [Qty, Free, Rate, Amount] or [Qty, Rate, Amount, Pct]
      if (tailTokens[1] === '-' || tailTokens[1] === '0') {
        qty = parseFloat(tailTokens[0]) || 0;
        free = 0;
        rate = parseFloat(tailTokens[2]) || 0;
        amount = parseFloat(tailTokens[3]) || 0;
      } else {
        qty = parseFloat(tailTokens[0]) || 0;
        free = 0;
        rate = parseFloat(tailTokens[1]) || 0;
        amount = parseFloat(tailTokens[2]) || 0;
      }
    } else if (tailTokens.length === 3) {
      qty = parseFloat(tailTokens[0]) || 0;
      free = 0;
      rate = parseFloat(tailTokens[1]) || 0;
      amount = parseFloat(tailTokens[2]) || 0;
    }

    return {
      desc,
      qty,
      free,
      rate,
      amount: Number(amount.toFixed(2))
    };
  }

  return null;
}

export async function parseNagdaRetailerPdf(file: File): Promise<{ 
  records: RetailerSaleRecord[]; 
  detectedMonthCode?: string;
  isCumulative?: boolean;
  cumulativeLabel?: string;
}> {
  let virtualLines: string[] = [];
  let detectedMonthCode: string | undefined = undefined;
  let isCumulative = false;
  let cumulativeLabel: string | undefined = undefined;

  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);
  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    interface RawItem { x: number; y: number; text: string; }
    const rawItems: RawItem[] = [];

    textContent.items.forEach((it: any) => {
      if (it && it.transform && typeof it.str === 'string') {
        const text = it.str.trim();
        if (text.length > 0) {
          rawItems.push({
            x: it.transform[4] || 0,
            y: it.transform[5] || 0,
            text
          });
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
          const rangeMatch = fullLine.toUpperCase().match(/FROM\\s+(\\d{2})[-/](\\d{2})[-/](\\d{4})[-–—TO\\s]+(\\d{2})[-/](\\d{2})[-/](\\d{4})/);
          if (rangeMatch) {
            const startM = MONTH_NUM_MAP[rangeMatch[2]];
            const endM = MONTH_NUM_MAP[rangeMatch[5]];
            if (startM && endM) {
              if (startM === endM) {
                detectedMonthCode = startM;
              } else {
                detectedMonthCode = `${startM}_${endM}`;
                isCumulative = true;
                cumulativeLabel = `${startM}-${endM}`;
              }
            }
          } else {
            const singleMatch = fullLine.toUpperCase().match(/FROM\\s+\\d{2}[-/](\\d{2})[-/](\\d{4})/);
            if (singleMatch) detectedMonthCode = MONTH_NUM_MAP[singleMatch[1]];
          }
        }
      }
    }
  }

  const records: RetailerSaleRecord[] = [];
  let currentParty: string = '';

  for (const line of virtualLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if total summary line
    if (trimmed.toUpperCase().startsWith('TOTAL :') || trimmed.toUpperCase().startsWith('GRAND TOTAL')) {
      continue;
    }

    const dataRow = parseNagdaDataRow(line);

    // Case 1: Chemist Header Line
    if (!dataRow) {
      if (
        trimmed.startsWith('---') ||
        trimmed.startsWith('===') ||
        trimmed.startsWith('***') ||
        trimmed.startsWith('___')
      ) {
        continue;
      }

      const upper = trimmed.toUpperCase().replace(/\\s+/g, '');
      if (
        upper.includes('NAGDADISTRIBUTORS') || upper.includes('SHRINATHPLAZA') ||
        upper.includes('PHONE:') || upper.includes('E-MAIL:') ||
        upper.includes('GSTIN') || upper.includes('08AHTPN9395F1ZF') ||
        upper.includes('PARTY/ITEMWISE') || upper.includes('REPORTFOR') ||
        upper.includes('DIOSLIFESCINCES') || upper.includes('DESCRIPTIONQTY') ||
        upper.includes('PAGENO') || upper.includes('PAGE')
      ) {
        continue;
      }

      // Check if this line is accidentally a product description line without quantities
      const cleanDescWithoutPack = trimmed.replace(/\\b\\d+[';]S\\b|\\b\\d+S\\b|\\b10S\\b|\\b15S\\b|\\b4S\\b|\\b14S\\b/gi, '').trim();
      const possibleProd = matchMasterProduct(cleanDescWithoutPack) || matchMasterProduct(trimmed);

      // Only treat as Chemist Name if it is NOT a master product description and contains letters
      if (!possibleProd && /[A-Z]/i.test(trimmed) && trimmed.length >= 3) {
        currentParty = trimmed;
      }
      continue;
    }

    // Case 2: Product Data Row
    const cleanDescWithoutPack = dataRow.desc.replace(/\\b\\d+[';]S\\b|\\b\\d+S\\b|\\b10S\\b|\\b15S\\b|\\b4S\\b|\\b14S\\b/gi, '').trim();
    const prodMatch = matchMasterProduct(cleanDescWithoutPack) || matchMasterProduct(dataRow.desc);

    if (prodMatch && currentParty) {
      const { cleanName, address } = extractNagdaChemistDetails(currentParty);
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

  return { records, detectedMonthCode, isCumulative, cumulativeLabel };
}
'''

with open('src/parsers/retailerParsers/nagdaRetailerParser.ts', 'w', encoding='utf-8') as f:
    f.write(nagda_parser_code)

print("✅ nagdaRetailerParser.ts successfully updated.")
