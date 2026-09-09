import * as pdfjsLib from 'pdfjs-dist';
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
        const dateMatch = fullLine.toUpperCase().match(/(\d{2})[-/](\d{2})[-/](\d{4})\s*[-–—TO]+\s*(\d{2})[-/](\d{2})[-/](\d{4})/);
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

    const upper = trimmed.toUpperCase().replace(/\s+/g, '');
    if (
      upper.includes('SHREEVARDHMAN') || upper.includes('SAIFEECOMPLEX') ||
      upper.includes('STOCK&SALES') || upper.includes('ITEMDESCRIPTION') ||
      upper.includes('DIOSLIFESCIENCES') || upper.includes('DUNGARPUR')
    ) {
      continue;
    }

    // Match numbers at the end of product line
    const rawTokens = trimmed.split(/\s+/);
    if (rawTokens.length < 5) continue;

    const nums: number[] = [];
    let splitIdx = -1;

    for (let i = rawTokens.length - 1; i >= 0; i--) {
      const tok = rawTokens[i].replace(/,/g, '').trim();
      // Skip expiry date token like 7/27 or 12/26 at the end
      if (/^\d{1,2}\/\d{2,4}$/.test(tok)) {
        continue;
      }

      if (/^-?\d+(\.\d+)?$/.test(tok)) {
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
    csvContent: csvRows.join('\r\n'),
    detectedMonthCode
  };
}

// =========================================================================
// 🌟 STAGE 2: CSV PARSER -> 73 MASTER PRODUCT FREE GOODS MATCHER
// =========================================================================
export async function parseVardhmanStockSalesPdf(file: File): Promise<VardhmanParsedFreeGoods> {
  const { csvContent, detectedMonthCode } = await convertVardhmanPdfToCsv(file);

  const lines = csvContent.split(/\r?\n/);
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
      .replace(/\b\d+[';]S\b|\b\d+S\b|\b10S\b|\b15S\b|\b4S\b|\b14S\b/gi, '')
      .replace(/\bNEW\b/gi, '')
      .replace(/\bNE\b/gi, '')
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
