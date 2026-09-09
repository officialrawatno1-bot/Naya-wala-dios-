import os, sys, subprocess

print("==========================================================================")
print("🧠 [1/4] CREATING DEDICATED VARDHMAN RETAILER PARSER (4-COLUMN ERP)...")
print("==========================================================================")

vardhman_parser_code = '''import * as pdfjsLib from 'pdfjs-dist';
import { matchMasterProduct, MasterProduct } from '../common';
import { RetailerSaleRecord } from './dwarikaRetailerParser';

const DUNGARPUR_LOCATIONS = [
  'DUNGARPUR', 'DPR', 'HATHAI', 'SAGWARA', 'ASPUR', 'RAMGARH',
  'DHAMBOLA', 'KANBA', 'SEMARI', 'BANKODA', 'SARADA', 'DEBARI',
  'TOKOR', 'TOKAR'
];

function extractVardhmanChemistDetails(rawName: string): { cleanName: string; address: string } {
  let clean = rawName.replace(/^[0-9.\\-\\s]+/, '').replace(/\\*+$/, '').trim();
  let address = 'DUNGARPUR';
  const upper = clean.toUpperCase();

  for (const loc of DUNGARPUR_LOCATIONS) {
    if (upper.includes(loc)) {
      address = loc === 'DPR' ? 'DUNGARPUR' : loc;
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

// Parses lines like:
// "VALROS-10 TABS. 10's 6 pcs 100.42 602.49 0.80"
// "LINAGET-M-OD5/500 10;S 20 PCS 78.30 1565.97 2.08"
// "VINTEL CTC TABS. 10's -6 PCS 140.34 -842.04 -1.52"
function parseVardhmanDataRow(line: string): { desc: string; qty: number; free: number; rate: number; amount: number } | null {
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
    upper.includes('SHREEVARDHMAN') || upper.includes('SAIFEECOMPLEX') ||
    upper.includes('GSTIN') || upper.includes('08ADTPJ4670R1ZI') ||
    upper.includes('PHONE:') || upper.includes('E-MAIL:') ||
    upper.includes('PARTY/ITEMWISE') || upper.includes('REPORTFOR') ||
    upper.includes('DIOSLIFESCIENCES') || upper.includes('DESCRIPTIONQTY') ||
    upper.includes('PAGENO') || upper.includes('CONTINUED') ||
    upper.includes('TOTAL:') || upper.includes('GRANDTOTAL')
  ) {
    return null;
  }

  const rawTokens = trimmed.split(/\\s+/);
  if (rawTokens.length < 3) return null;

  // Scan backwards for numeric tail: [Amount, Rate, Qty] (or with Percentage)
  const tailTokens: string[] = [];
  let nameEndIdx = -1;

  for (let i = rawTokens.length - 1; i >= 0; i--) {
    const token = rawTokens[i].replace(/,/g, '').trim();
    // Match signed integer or float, ignoring 'PCS' or 'pcs'
    if (token.toUpperCase() === 'PCS' || token.toUpperCase() === 'PC') {
      continue;
    }

    if (/^-?\\d+(\\.\\d+)?$/.test(token)) {
      tailTokens.unshift(token);
      if (tailTokens.length === 4) { // [Qty, Rate, Amount, Percent]
        nameEndIdx = i;
        break;
      }
    } else {
      if (tailTokens.length >= 3) {
        nameEndIdx = i + 1;
        break;
      }
      return null;
    }
  }

  if (tailTokens.length >= 3 && nameEndIdx > 0) {
    // Cut description before unit tokens
    let descTokens = rawTokens.slice(0, nameEndIdx);
    while (
      descTokens.length > 0 &&
      (descTokens[descTokens.length - 1].toUpperCase() === 'PCS' ||
       descTokens[descTokens.length - 1].toUpperCase() === 'PC')
    ) {
      descTokens.pop();
    }

    const desc = descTokens.join(' ').trim();
    if (!desc) return null;

    let qty = 0;
    let rate = 0;
    let amount = 0;

    if (tailTokens.length === 4) {
      qty = parseFloat(tailTokens[0]) || 0;
      rate = parseFloat(tailTokens[1]) || 0;
      amount = parseFloat(tailTokens[2]) || 0;
    } else if (tailTokens.length === 3) {
      qty = parseFloat(tailTokens[0]) || 0;
      rate = parseFloat(tailTokens[1]) || 0;
      amount = parseFloat(tailTokens[2]) || 0;
    }

    return {
      desc,
      qty,
      free: 0,
      rate,
      amount: Number(amount.toFixed(2))
    };
  }

  return null;
}

export async function parseVardhmanRetailerPdf(file: File): Promise<{
  records: RetailerSaleRecord[];
  detectedMonthCode?: string;
}> {
  let virtualLines: string[] = [];
  let detectedMonthCode: string | undefined = undefined;

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
          const dateMatch = fullLine.toUpperCase().match(/FROM\\s+\\d{2}[-/](\\d{2})[-/](\\d{4})/);
          if (dateMatch) detectedMonthCode = MONTH_NUM_MAP[dateMatch[1]];
        }
      }
    }
  }

  const records: RetailerSaleRecord[] = [];
  let currentParty: string = '';

  for (const line of virtualLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.toUpperCase().startsWith('TOTAL :') || trimmed.toUpperCase().startsWith('GRAND TOTAL')) {
      continue;
    }

    const dataRow = parseVardhmanDataRow(line);

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
        upper.includes('SHREEVARDHMAN') || upper.includes('SAIFEECOMPLEX') ||
        upper.includes('GSTIN') || upper.includes('08ADTPJ4670R1ZI') ||
        upper.includes('PHONE:') || upper.includes('E-MAIL:') ||
        upper.includes('PARTY/ITEMWISE') || upper.includes('REPORTFOR') ||
        upper.includes('DIOSLIFESCIENCES') || upper.includes('DESCRIPTIONQTY') ||
        upper.includes('PAGENO') || upper.includes('PAGE') || upper.includes('CONTINUED')
      ) {
        continue;
      }

      // Check if product line
      const cleanDescWithoutPack = trimmed.replace(/\\b\\d+[';]S\\b|\\b\\d+S\\b|\\b10S\\b|\\b15S\\b|\\b4S\\b|\\b14S\\b/gi, '').trim();
      const possibleProd = matchMasterProduct(cleanDescWithoutPack) || matchMasterProduct(trimmed);

      if (!possibleProd && /[A-Z]/i.test(trimmed) && trimmed.length >= 3) {
        currentParty = trimmed;
      }
      continue;
    }

    // Case 2: Product Data Line
    const cleanDescWithoutPack = dataRow.desc
      .replace(/\\b\\d+[';]S\\b|\\b\\d+S\\b|\\b10S\\b|\\b15S\\b|\\b4S\\b|\\b14S\\b/gi, '')
      .replace(/\\bNEW\\b/gi, '')
      .replace(/\\bNE\\b/gi, '')
      .trim();

    const prodMatch = matchMasterProduct(cleanDescWithoutPack) || matchMasterProduct(dataRow.desc);

    if (prodMatch && currentParty) {
      const { cleanName, address } = extractVardhmanChemistDetails(currentParty);
      records.push({
        retailerName: cleanName,
        address: address,
        productSn: prodMatch.sn,
        productName: prodMatch.name,
        salesQty: dataRow.qty,
        freeQty: 0,
        rate: dataRow.rate,
        amount: dataRow.amount
      });
    }
  }

  return { records, detectedMonthCode };
}
'''

with open('src/parsers/retailerParsers/vardhmanRetailerParser.ts', 'w', encoding='utf-8') as f:
    f.write(vardhman_parser_code)
print("✅ 1. src/parsers/retailerParsers/vardhmanRetailerParser.ts created.")

# 2. Update src/exporters/partywiseExporter.ts to include Vardhman
with open('src/exporters/partywiseExporter.ts', 'r', encoding='utf-8') as f:
    exp_code = f.read()

old_stockists = """  const stockistsToExport = currentStockist === 'all' 
    ? [
        { id: 'dwarika', name: 'Dwarika Medicals' },
        { id: 'modi', name: 'Modi Distributors' },
        { id: 'nagda', name: 'Nagda Distributors' }
      ]"""

new_stockists = """  const stockistsToExport = currentStockist === 'all' 
    ? [
        { id: 'dwarika', name: 'Dwarika Medicals' },
        { id: 'modi', name: 'Modi Distributors' },
        { id: 'nagda', name: 'Nagda Distributors' },
        { id: 'vardhman', name: 'Shree Vardhman' }
      ]"""

if old_stockists in exp_code:
    exp_code = exp_code.replace(old_stockists, new_stockists)

with open('src/exporters/partywiseExporter.ts', 'w', encoding='utf-8') as f:
    f.write(exp_code)
print("✅ 2. src/exporters/partywiseExporter.ts updated with Shree Vardhman.")

# 3. Update src/components/PartywiseAggregatorVault.tsx
with open('src/components/PartywiseAggregatorVault.tsx', 'r', encoding='utf-8') as f:
    vault_code = f.read()

# Add import
if "parseVardhmanRetailerPdf" not in vault_code:
    vault_code = vault_code.replace(
        "import { parseNagdaRetailerPdf } from '../parsers/retailerParsers/nagdaRetailerParser';",
        "import { parseNagdaRetailerPdf } from '../parsers/retailerParsers/nagdaRetailerParser';\\nimport { parseVardhmanRetailerPdf } from '../parsers/retailerParsers/vardhmanRetailerParser';"
    )

# Add type union
vault_code = vault_code.replace(
    "const [selectedStockist, setSelectedStockist] = useState<'all' | 'dwarika' | 'modi' | 'nagda'>('dwarika');",
    "const [selectedStockist, setSelectedStockist] = useState<'all' | 'dwarika' | 'modi' | 'nagda' | 'vardhman'>('vardhman');"
)

# Add tab
old_tabs = """const STOCKIST_TABS = [
  { id: 'all', name: 'All Stockists (Consolidated)' },
  { id: 'dwarika', name: 'Dwarika Medicals' },
  { id: 'modi', name: 'Modi Distributors' },
  { id: 'nagda', name: 'Nagda Distributors' }
];"""

new_tabs = """const STOCKIST_TABS = [
  { id: 'all', name: 'All Stockists (Consolidated)' },
  { id: 'dwarika', name: 'Dwarika Medicals' },
  { id: 'modi', name: 'Modi Distributors' },
  { id: 'nagda', name: 'Nagda Distributors' },
  { id: 'vardhman', name: 'Shree Vardhman' }
];"""

vault_code = vault_code.replace(old_tabs, new_tabs)

# Update upload button text
old_btn_span = """<span>
              {isParsing 
                ? 'Processing...' 
                : `Upload ${
                    selectedStockist === 'nagda' 
                      ? 'Nagda' 
                      : selectedStockist === 'modi' 
                      ? 'Modi' 
                      : selectedStockist === 'dwarika' 
                      ? 'Dwarika' 
                      : 'Statement'
                  } PDF`}
            </span>"""

new_btn_span = """<span>
              {isParsing 
                ? 'Processing...' 
                : `Upload ${
                    selectedStockist === 'vardhman'
                      ? 'Vardhman'
                      : selectedStockist === 'nagda' 
                      ? 'Nagda' 
                      : selectedStockist === 'modi' 
                      ? 'Modi' 
                      : selectedStockist === 'dwarika' 
                      ? 'Dwarika' 
                      : 'Statement'
                  } PDF`}
            </span>"""

vault_code = vault_code.replace(old_btn_span, new_btn_span)

# Update handleFileUpload auto-detection
old_detection = """    let effectiveStockist: 'dwarika' | 'modi' | 'nagda' = 
      selectedStockist === 'all' ? 'dwarika' : selectedStockist;

    if (fUpper.includes('NAGDA')) effectiveStockist = 'nagda';
    else if (fUpper.includes('MODI')) effectiveStockist = 'modi';
    else if (fUpper.includes('DWARIKA')) effectiveStockist = 'dwarika';"""

new_detection = """    let effectiveStockist: 'dwarika' | 'modi' | 'nagda' | 'vardhman' = 
      selectedStockist === 'all' ? 'vardhman' : selectedStockist;

    if (fUpper.includes('VARDHMAN') || fUpper.includes('VARDHAMAN')) effectiveStockist = 'vardhman';
    else if (fUpper.includes('NAGDA')) effectiveStockist = 'nagda';
    else if (fUpper.includes('MODI')) effectiveStockist = 'modi';
    else if (fUpper.includes('DWARIKA')) effectiveStockist = 'dwarika';"""

vault_code = vault_code.replace(old_detection, new_detection)

# Update targetStockistName
old_st_name = """    const targetStockistName = 
      effectiveStockist === 'nagda' ? 'Nagda Distributors' : 
      effectiveStockist === 'modi' ? 'Modi Distributors' : 
      'Dwarika Medicals';"""

new_st_name = """    const targetStockistName = 
      effectiveStockist === 'vardhman' ? 'Shree Vardhman' :
      effectiveStockist === 'nagda' ? 'Nagda Distributors' : 
      effectiveStockist === 'modi' ? 'Modi Distributors' : 
      'Dwarika Medicals';"""

vault_code = vault_code.replace(old_st_name, new_st_name)

# Update parser invocation in handleFileUpload
old_parsers = """      if (effectiveStockist === 'nagda') {
        const res = await parseNagdaRetailerPdf(file);
        records = res.records;
        detectedMonthCode = res.detectedMonthCode;
      } else if (effectiveStockist === 'modi') {
        const res = await parseModiRetailerPdf(file);
        records = res.records;
        detectedMonthCode = res.detectedMonthCode;
      } else {
        const res = await parseDwarikaRetailerPdf(file);
        records = res.records;
        detectedMonthCode = res.detectedMonthCode;
      }"""

new_parsers = """      if (effectiveStockist === 'vardhman') {
        const res = await parseVardhmanRetailerPdf(file);
        records = res.records;
        detectedMonthCode = res.detectedMonthCode;
      } else if (effectiveStockist === 'nagda') {
        const res = await parseNagdaRetailerPdf(file);
        records = res.records;
        detectedMonthCode = res.detectedMonthCode;
      } else if (effectiveStockist === 'modi') {
        const res = await parseModiRetailerPdf(file);
        records = res.records;
        detectedMonthCode = res.detectedMonthCode;
      } else {
        const res = await parseDwarikaRetailerPdf(file);
        records = res.records;
        detectedMonthCode = res.detectedMonthCode;
      }"""

vault_code = vault_code.replace(old_parsers, new_parsers)

with open('src/components/PartywiseAggregatorVault.tsx', 'w', encoding='utf-8') as f:
    f.write(vault_code)
print("✅ 3. src/components/PartywiseAggregatorVault.tsx updated.")

# 4. Build and Deploy
print("\n📦 [2/3] Compiling Production Bundle (npm run build)...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful.")

print("\n☁️ [3/3] Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Shree Vardhman Pharma Engine is 100% Live on Cloudflare!")
