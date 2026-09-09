import os, sys, subprocess

print("==========================================================================")
print("🧠 [1/4] CREATING DEDICATED NAGDA PARSER (SINGLE & CUMULATIVE 3M)...")
print("==========================================================================")

nagda_parser_code = """import * as pdfjsLib from 'pdfjs-dist';
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
  'KERWADA', 'DEHLIGET', 'SARADA', 'NATHUDWARA', 'BALICHA', 'AMET'
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

function parseNagdaQty(tok: string): number {
  if (!tok || tok === '-' || tok === '—' || tok === '–') return 0;
  const n = parseFloat(tok.replace(/,/g, '').trim());
  return isNaN(n) ? 0 : n;
}

const MONTH_NUM_MAP: Record<string, string> = {
  '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR',
  '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AUG',
  '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC'
};

// 🌟 SMART 5-COLUMN TOKENIZER (Handles negative sales/free & decimals like 5.500)
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
    upper.includes('DESCRIPTION') || upper.includes('GRANDTOTAL') ||
    upper.includes('ENDOFREPORT') || upper.includes('TOTAL:') ||
    upper.includes('CONTINUED') || upper.includes('REPORTFOR') ||
    upper.includes('DIOSLIFE') || upper.includes('SHRINATHPLAZA') ||
    upper.includes('GSTIN') || upper.includes('TIN.') ||
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
        
        // 🌟 1000 IQ MULTI-MONTH / CUMULATIVE HEADER DETECTION
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

  // 🌟 DUAL-INVARIANT STATE MACHINE
  const records: RetailerSaleRecord[] = [];
  let currentProduct: MasterProduct | null = null;
  let currentParty: string = '';

  for (const line of virtualLines) {
    const dataRow = parseNagdaDataRow(line);

    // Case 1: Header Line (Product or Chemist Name)
    if (!dataRow) {
      const cleanDescWithoutPack = line.replace(/\\b\\d+[';]S\\b|\\b\\d+S\\b|\\b10S\\b|\\b15S\\b|\\b4S\\b|\\b14S\\b/gi, '').trim();
      const prod = matchMasterProduct(cleanDescWithoutPack) || matchMasterProduct(line);

      if (prod) {
        currentProduct = prod;
      } else if (line.length > 2) {
        const upper = line.toUpperCase().replace(/\\s+/g, '');
        if (
          !upper.includes('TOTAL:') &&
          !upper.includes('CONTINUED') &&
          !upper.includes('REPORTFOR') &&
          !upper.includes('DIOSLIFE') &&
          !upper.includes('SHRINATHPLAZA') &&
          !upper.includes('NAGDADISTRIBUTORS') &&
          !upper.includes('PAGENO') &&
          !upper.includes('PAGE') &&
          !upper.includes('SALESSUMMARY') &&
          !upper.includes('WISE') &&
          !upper.includes('DESCRIPTION') &&
          !upper.includes('PHONE:') &&
          !upper.includes('GSTIN') &&
          !upper.includes('TIN.') &&
          !upper.includes('FOODLIC') &&
          /[A-Z]/i.test(line)
        ) {
          currentParty = line;
        }
      }
      continue;
    }

    // Case 2: Data Row (Contains numbers)
    const cleanDescWithoutPack = dataRow.desc.replace(/\\b\\d+[';]S\\b|\\b\\d+S\\b|\\b10S\\b|\\b15S\\b|\\b4S\\b|\\b14S\\b/gi, '').trim();
    const rowProd = matchMasterProduct(cleanDescWithoutPack) || matchMasterProduct(dataRow.desc);

    // Sub-case A: row is PRODUCT -> Chemist is currentParty (Party-wise layout)
    if (rowProd) {
      const partyToUse = currentParty || 'UDAIPUR MEDICAL';
      const { cleanName, address } = extractNagdaChemistDetails(partyToUse);
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
    // Sub-case B: row is CHEMIST -> Product is currentProduct (Item-wise layout)
    else if (currentProduct) {
      const { cleanName, address } = extractNagdaChemistDetails(dataRow.desc);
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

  return { records, detectedMonthCode, isCumulative, cumulativeLabel };
}
"""

with open('src/parsers/retailerParsers/nagdaRetailerParser.ts', 'w', encoding='utf-8') as f:
    f.write(nagda_parser_code)
print("✅ 1. src/parsers/retailerParsers/nagdaRetailerParser.ts created.")

# 2. Update src/exporters/partywiseExporter.ts to include Nagda
with open('src/exporters/partywiseExporter.ts', 'r', encoding='utf-8') as f:
    exp_code = f.read()

# Update stockistsToExport to include Nagda
old_stockists = """  const stockistsToExport = currentStockist === 'all' 
    ? [
        { id: 'dwarika', name: 'Dwarika Medicals' },
        { id: 'modi', name: 'Modi Distributors' }
      ]"""

new_stockists = """  const stockistsToExport = currentStockist === 'all' 
    ? [
        { id: 'dwarika', name: 'Dwarika Medicals' },
        { id: 'modi', name: 'Modi Distributors' },
        { id: 'nagda', name: 'Nagda Distributors' }
      ]"""

if old_stockists in exp_code:
    exp_code = exp_code.replace(old_stockists, new_stockists)

with open('src/exporters/partywiseExporter.ts', 'w', encoding='utf-8') as f:
    f.write(exp_code)
print("✅ 2. partywiseExporter.ts updated with Nagda.")

# 3. Update src/components/PartywiseAggregatorVault.tsx with Nagda & Cumulative Dropdown Options
with open('src/components/PartywiseAggregatorVault.tsx', 'r', encoding='utf-8') as f:
    vault_code = f.read()

# Add import for parseNagdaRetailerPdf
if "parseNagdaRetailerPdf" not in vault_code:
    vault_code = vault_code.replace(
        "import { parseModiRetailerPdf } from '../parsers/retailerParsers/modiRetailerParser';",
        "import { parseModiRetailerPdf } from '../parsers/retailerParsers/modiRetailerParser';\nimport { parseNagdaRetailerPdf } from '../parsers/retailerParsers/nagdaRetailerParser';"
    )

# Add Nagda to STOCKIST_TABS
old_tabs = """const STOCKIST_TABS = [
  { id: 'all', name: 'All Stockists (Consolidated)' },
  { id: 'dwarika', name: 'Dwarika Medicals' },
  { id: 'modi', name: 'Modi Distributors' }
];"""

new_tabs = """const STOCKIST_TABS = [
  { id: 'all', name: 'All Stockists (Consolidated)' },
  { id: 'dwarika', name: 'Dwarika Medicals' },
  { id: 'modi', name: 'Modi Distributors' },
  { id: 'nagda', name: 'Nagda Distributors' }
];"""

vault_code = vault_code.replace(old_tabs, new_tabs)

# Add Cumulative Options to MONTH_OPTIONS
old_m_opts = """  { label: 'Mar-2027', code: 'MAR' },
];"""

new_m_opts = """  { label: 'Mar-2027', code: 'MAR' },
  { label: 'Jun-Aug (3M Cum)', code: 'JUN_AUG' },
];"""

vault_code = vault_code.replace(old_m_opts, new_m_opts)

# Update handleFileUpload to support Nagda parser
old_upload_logic = """      if (selectedStockist === 'modi') {
        const res = await parseModiRetailerPdf(file);
        records = res.records;
        detectedMonthCode = res.detectedMonthCode;
      } else {
        const res = await parseDwarikaRetailerPdf(file);
        records = res.records;
        detectedMonthCode = res.detectedMonthCode;
      }"""

new_upload_logic = """      if (selectedStockist === 'nagda') {
        const res = await parseNagdaRetailerPdf(file);
        records = res.records;
        detectedMonthCode = res.detectedMonthCode;
      } else if (selectedStockist === 'modi') {
        const res = await parseModiRetailerPdf(file);
        records = res.records;
        detectedMonthCode = res.detectedMonthCode;
      } else {
        const res = await parseDwarikaRetailerPdf(file);
        records = res.records;
        detectedMonthCode = res.detectedMonthCode;
      }"""

vault_code = vault_code.replace(old_upload_logic, new_upload_logic)

# Update targetStockistName string
old_st_name = "const targetStockistName = selectedStockist === 'modi' ? 'Modi Distributors' : 'Dwarika Medicals';"
new_st_name = "const targetStockistName = selectedStockist === 'nagda' ? 'Nagda Distributors' : selectedStockist === 'modi' ? 'Modi Distributors' : 'Dwarika Medicals';"
vault_code = vault_code.replace(old_st_name, new_st_name)

with open('src/components/PartywiseAggregatorVault.tsx', 'w', encoding='utf-8') as f:
    f.write(vault_code)
print("✅ 3. PartywiseAggregatorVault.tsx updated with Nagda Distributors & Cumulative options.")

# 4. Build Production Bundle
print("\n📦 [2/3] Compiling Production Bundle (npm run build)...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful.")

# 5. Direct Cloudflare Pages deploy
print("\n☁️ [3/3] Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Nagda Distributors & 3-Month Cumulative Engine Live on Cloudflare!")
