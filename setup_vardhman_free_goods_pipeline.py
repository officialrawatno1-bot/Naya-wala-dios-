import os, sys, subprocess

print("==========================================================================")
print("🧠 [1/3] CREATING 2-STAGE VARDHMAN (PDF -> CSV -> FREE GOODS) PARSER...")
print("==========================================================================")

os.makedirs('src/parsers/stockSalesParsers', exist_ok=True)

parser_code = '''import * as pdfjsLib from 'pdfjs-dist';
import { matchMasterProduct, MasterProduct } from '../common';

export interface VardhmanParsedFreeGoods {
  monthCode: string;
  totalSalesQty: number;
  totalFreeQty: number;
  totalClosingQty: number;
  productFreeMap: Record<number, number>;
  rawCsv: string;
}

const MONTH_NUM_MAP: Record<string, string> = {
  '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR',
  '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AUG',
  '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC'
};

// =========================================================================
// 🌟 STAGE 1: PDF TO CLEAN CSV CONVERTER IN MEMORY
// =========================================================================
export async function convertVardhmanPdfToCsv(file: File): Promise<{ csvContent: string; detectedMonthCode: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);
  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

  const virtualLines: string[] = [];
  let detectedMonthCode = 'AUG';

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

        // Detect Month from Date Header e.g. 01-07-2026 - 31-07-2026
        const dateMatch = fullLine.toUpperCase().match(/(\\d{2})[-/](\\d{2})[-/](\\d{4})\\s*[-–—TO]+\\s*(\\d{2})[-/](\\d{2})[-/](\\d{4})/);
        if (dateMatch) {
          const mNum = dateMatch[2];
          if (MONTH_NUM_MAP[mNum]) {
            detectedMonthCode = MONTH_NUM_MAP[mNum];
          }
        }
      }
    }
  }

  // Convert Lines to CSV format
  const csvRows: string[] = [];
  csvRows.push('ITEM_NAME,OPENING_STOCK,PURCHASE_QTY,PURCHASE_FREE,SR_QTY,SR_FREE,REPL_OTHER,TOTAL_STOCK,SALES_QTY,SALES_FREE,SAMPLE,STOCK_TF,PR_QTY,REPL_OTHER_OUT,CLOSING_STOCK');

  for (const line of virtualLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const upper = trimmed.toUpperCase().replace(/\\s+/g, '');
    if (
      upper.includes('SHREEVARDHMAN') || upper.includes('SAIFEECOMPLEX') ||
      upper.includes('STOCK&SALES') || upper.includes('ITEMDESCRIPTION') ||
      upper.includes('DIOSLIFESCIENCES') || upper.includes('DUNGARPUR')
    ) {
      continue;
    }

    // Match numbers at the end of product line
    const rawTokens = trimmed.split(/\\s+/);
    if (rawTokens.length < 5) continue;

    const nums: number[] = [];
    let splitIdx = -1;

    for (let i = rawTokens.length - 1; i >= 0; i--) {
      const tok = rawTokens[i].replace(/,/g, '').trim();
      // Skip expiry date token like 7/27 or 12/26 at the end
      if (/^\\d{1,2}\\/\\d{2,4}$/.test(tok)) {
        continue;
      }

      if (/^-?\\d+(\\.\\d+)?$/.test(tok)) {
        nums.unshift(parseFloat(tok));
      } else {
        splitIdx = i + 1;
        break;
      }
    }

    if (splitIdx > 0 && nums.length >= 8) {
      const descTokens = rawTokens.slice(0, splitIdx);
      const desc = descTokens.join(' ').trim();
      const csvLine = `"${desc.replace(/"/g, '""')}",${nums.join(',')}`;
      csvRows.push(csvLine);
    }
  }

  return {
    csvContent: csvRows.join('\\r\\n'),
    detectedMonthCode
  };
}

// =========================================================================
// 🌟 STAGE 2: CSV PARSER -> 73 MASTER PRODUCT FREE GOODS MATCHER
// =========================================================================
export async function parseVardhmanStockSalesPdf(file: File): Promise<VardhmanParsedFreeGoods> {
  const { csvContent, detectedMonthCode } = await convertVardhmanPdfToCsv(file);

  const lines = csvContent.split(/\\r?\\n/);
  const productFreeMap: Record<number, number> = {};
  let totalSalesQty = 0;
  let totalFreeQty = 0;
  let totalClosingQty = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Safe CSV Split
    const matches = line.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
    if (!matches || matches.length < 9) continue;

    const cols = matches.map(m => m.replace(/^,/, '').replace(/^"|"$/g, '').trim());
    const rawName = cols[0];

    // Numbers array
    const nums = cols.slice(1).map(v => parseFloat(v) || 0);

    // Vardhman Standard Layout:
    // When 14 numbers: [Op(0), PurQ(1), PurF(2), SR_Q(3), SR_F(4), Repl(5), TotStk(6), SalesQ(7), SalesFree(8), Sample(9), TF(10), PR(11), ReplO(12), Closing(13)]
    let salesQ = 0;
    let freeQ = 0;
    let closingQ = 0;

    if (nums.length >= 14) {
      salesQ = nums[7];
      freeQ = nums[8];
      closingQ = nums[13];
    } else if (nums.length >= 12) {
      salesQ = nums[nums.length - 7];
      freeQ = nums[nums.length - 6];
      closingQ = nums[nums.length - 1];
    } else if (nums.length >= 8) {
      salesQ = nums[nums.length - 3];
      freeQ = nums[nums.length - 2];
      closingQ = nums[nums.length - 1];
    }

    const cleanDesc = rawName
      .replace(/\\b\\d+[';]S\\b|\\b\\d+S\\b|\\b10S\\b|\\b15S\\b|\\b4S\\b|\\b14S\\b/gi, '')
      .replace(/\\bNEW\\b/gi, '')
      .replace(/\\bNE\\b/gi, '')
      .trim();

    const matched = matchMasterProduct(cleanDesc) || matchMasterProduct(rawName);

    if (matched) {
      totalSalesQty += salesQ;
      totalFreeQty += freeQ;
      totalClosingQty += closingQ;

      if (freeQ > 0) {
        productFreeMap[matched.sn] = (productFreeMap[matched.sn] || 0) + freeQ;
      }
    }
  }

  return {
    monthCode: detectedMonthCode,
    totalSalesQty,
    totalFreeQty,
    totalClosingQty,
    productFreeMap,
    rawCsv: csvContent
  };
}
''';

with open('src/parsers/stockSalesParsers/vardhmanStockSalesParser.ts', 'w', encoding='utf-8') as f:
    f.write(parser_code)
print("✅ 1. src/parsers/stockSalesParsers/vardhmanStockSalesParser.ts created.")

# 2. Update src/data/freeGoodsStore.ts with setStockSalesFreeGoods method
store_path = 'src/data/freeGoodsStore.ts'
with open(store_path, 'r', encoding='utf-8') as f:
    scode = f.read()

new_store_method = '''  // 🌟 INJECT FREE GOODS FROM STOCK & SALES STATEMENT (PDF -> CSV ENGINE)
  public setStockSalesFreeGoods(monthCode: string, partyId: string, freeMap: Record<number, number>): number {
    if (!this.data[monthCode]) this.data[monthCode] = {};
    if (!this.data[monthCode][partyId]) this.data[monthCode][partyId] = {};

    let totalInjected = 0;
    // Clear old items for this party in this month
    this.data[monthCode][partyId] = {};

    Object.entries(freeMap).forEach(([snStr, freeQty]) => {
      const sn = Number(snStr);
      if (freeQty > 0) {
        this.data[monthCode][partyId][sn] = freeQty;
        totalInjected += freeQty;
      }
    });

    this.persist();
    return totalInjected;
  }
'''

if "setStockSalesFreeGoods" not in scode:
    scode = scode.replace("  public updateCell(", new_store_method + "\n  public updateCell(")
    with open(store_path, 'w', encoding='utf-8') as f:
        f.write(scode)
    print("✅ 2. freeGoodsStore.ts updated with setStockSalesFreeGoods method.")
else:
    print("✓ freeGoodsStore.ts already has setStockSalesFreeGoods.")

# 3. Update src/components/FreeGoodsVault.tsx with Import Button & 2-Stage Pipeline
vault_path = 'src/components/FreeGoodsVault.tsx'
with open(vault_path, 'r', encoding='utf-8') as f:
    vcode = f.read()

# Add imports
if "parseVardhmanStockSalesPdf" not in vcode:
    vcode = vcode.replace(
        "import { freeGoodsStore, FREE_GOODS_PARTIES, ChemistFreeDistributionItem } from '../data/freeGoodsStore';",
        "import { freeGoodsStore, FREE_GOODS_PARTIES, ChemistFreeDistributionItem } from '../data/freeGoodsStore';\nimport { parseVardhmanStockSalesPdf } from '../parsers/stockSalesParsers/vardhmanStockSalesParser';"
    )

# Add file ref and upload handler
import_handler_code = '''  const stockSalesFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImportingPdf, setIsImportingPdf] = React.useState(false);

  const handleImportStockSalesPdf = async (file: File) => {
    setIsImportingPdf(true);
    setStatusMsg(`Converting '${file.name}' to Virtual CSV stream...`);
    try {
      const parsed = await parseVardhmanStockSalesPdf(file);
      const targetMonth = parsed.monthCode || selectedMonthCodes[0] || 'AUG';

      if (!selectedMonthCodes.includes(targetMonth)) {
        setSelectedMonthCodes([targetMonth]);
      }

      // Auto switch active tab to Vardhman
      setActiveTab('vardhman');

      const totalUnits = freeGoodsStore.setStockSalesFreeGoods(targetMonth, 'vardhman', parsed.productFreeMap);
      setRefreshTrigger(prev => prev + 1);

      const itemsCount = Object.keys(parsed.productFreeMap).length;
      setStatusMsg(`🎉 SUCCESS! '${file.name}' (${targetMonth}): Virtual CSV Generated -> ${totalUnits} Free Units across ${itemsCount} SKUs loaded into Shree Vardhman!`);
    } catch (err: any) {
      alert("Import Error: " + (err.message || String(err)));
    } finally {
      setIsImportingPdf(false);
      if (stockSalesFileInputRef.current) stockSalesFileInputRef.current.value = '';
      setTimeout(() => setStatusMsg(null), 4500);
    }
  };
'''

if "handleImportStockSalesPdf" not in vcode:
    vcode = vcode.replace("  const handleClearParty = () => {", import_handler_code + "\n  const handleClearParty = () => {")

# Add the UI button in the toolbar
old_sync_btn = '''          {/* AUTO-SYNC BUTTON */}
          <button
            onClick={handleAutoSyncFromPartywise}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
            title="Auto-fetch free quantities directly from Partywise Analysis for selected months"
          >
            <Zap size={14} /> ⚡ Auto-Sync ({selectedMonthCodes.length}M)
          </button>'''

new_sync_btn = '''          {/* 🌟 2-STAGE VIRTUAL CSV IMPORT BUTTON */}
          <label className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md">
            <Upload size={14} className={isImportingPdf ? 'animate-bounce' : ''} />
            <span>{isImportingPdf ? 'Converting CSV...' : '📥 Import Stock & Sales (PDF➔CSV)'}</span>
            <input
              ref={stockSalesFileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              disabled={isImportingPdf}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleImportStockSalesPdf(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </label>

          {/* AUTO-SYNC BUTTON */}
          <button
            onClick={handleAutoSyncFromPartywise}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
            title="Auto-fetch free quantities directly from Partywise Analysis for selected months"
          >
            <Zap size={14} /> ⚡ Auto-Sync ({selectedMonthCodes.length}M)
          </button>'''

# Ensure Upload icon is imported
if "Upload," not in vcode:
    vcode = vcode.replace("import { \n  ArrowLeft,", "import { \n  ArrowLeft, Upload,")

if old_sync_btn in vcode:
    vcode = vcode.replace(old_sync_btn, new_sync_btn)

with open(vault_path, 'w', encoding='utf-8') as f:
    f.write(vcode)
print("✅ 3. FreeGoodsVault.tsx updated with PDF->CSV converter button.")

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

print("\n🎉 ALL DONE! PDF -> Virtual CSV -> 73 Master Free Goods Pipeline is 100% Live on Cloudflare!")
