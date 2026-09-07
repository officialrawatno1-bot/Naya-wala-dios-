import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { PartyParseSummary, matchMasterProduct } from './common';

export async function parseNagdaFile(file: File, partyName: string = 'Nagda Distributors'): Promise<PartyParseSummary> {
  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf');
  const items: Record<number, { sales: number; closing: number }> = {};
  let count = 0;
  let totalSales = 0;
  let totalClosing = 0;

  if (isPdf) {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      interface TextItem { x: number; y: number; text: string; }
      const rawItems: TextItem[] = [];
      textContent.items.forEach((it: any) => {
        if (it && it.transform && typeof it.str === 'string') {
          const text = it.str.trim();
          if (text.length > 0) rawItems.push({ x: it.transform[4] || 0, y: it.transform[5] || 0, text });
        }
      });

      const lineBins: Array<{ y: number; items: TextItem[] }> = [];
      rawItems.forEach(item => {
        let bin = lineBins.find(b => Math.abs(b.y - item.y) <= 4.5);
        if (bin) bin.items.push(item);
        else lineBins.push({ y: item.y, items: [item] });
      });

      lineBins.sort((a, b) => b.y - a.y);

      lineBins.forEach(bin => {
        bin.items.sort((a, b) => a.x - b.x);
        const fullLine = bin.items.map(it => it.text).join(' ').trim();
        if (!fullLine || fullLine.toUpperCase().includes('NAGDA') || fullLine.toUpperCase().includes('ANALYSIS') || fullLine.toUpperCase().includes('STATEMENT') || fullLine.toUpperCase().includes('ITEM DESCRIPTION') || fullLine.toUpperCase().includes('TOTAL')) return;

        const tokens = fullLine.split(/\s+/);
        const nums: number[] = [];
        const nameTokens: string[] = [];
        let isCollectingNumbers = true;

        // Scan backwards from right to left
        for (let i = tokens.length - 1; i >= 0; i--) {
          const rawT = tokens[i].replace(/,/g, '').trim();
          if (!rawT) continue;

          if (isCollectingNumbers) {
            // Treat dash as 0 (e.g. 10 - - 10)
            if (rawT === '-' || rawT === '—' || rawT === '–' || rawT === '- -') {
              nums.unshift(0);
            } else if (/^-?\d+(\.\d+)?$/.test(rawT)) {
              nums.unshift(parseFloat(rawT));
            } else {
              // Found text or packing (like 10'S, TAB, CAP), stop collecting numbers!
              isCollectingNumbers = false;
              nameTokens.unshift(tokens[i]);
            }
          } else {
            nameTokens.unshift(tokens[i]);
          }
        }

        const rawName = nameTokens.join(' ');
        if (!rawName || nums.length < 2) return;

        const matched = matchMasterProduct(rawName);
        if (matched) {
          let sales = 0;
          let closing = 0;

          // Format B (Old Format: 10-11 Numbers: Op, Pur, Return, Repl, TotRec, SaleQty(5), PR, Repl, Closing(8), Order)
          if (nums.length >= 10) {
            sales = nums[5];
            closing = nums[8];
          }
          // Format A (Old Format: 8 Numbers: Op, OpVal, Rec, RecVal, IssueQty(4), IssueVal, ClosingStock(6), ClosingVal)
          else if (nums.length >= 8) {
            sales = nums[4];
            closing = nums[6];
          } 
          // 4-Column Layout (New August PDF: [Opening, Receipt, Issue (Sale), Closing (Stock)])
          else if (nums.length === 4 || nums.length === 5) {
            sales = nums[nums.length - 2];
            closing = nums[nums.length - 1];
          } else {
            sales = nums[nums.length - 2];
            closing = nums[nums.length - 1];
          }

          if (!items[matched.sn]) {
            items[matched.sn] = { sales: 0, closing: 0 };
            count++;
          }
          items[matched.sn].sales += sales;
          items[matched.sn].closing += closing;
          totalSales += sales;
          totalClosing += closing;
        }
      });
    }
  } else {
    // 2D Array Engine for XLS / XLSX / CSV (Preserved untouched)
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    let prodCol = 0;
    let salesCol = -1;
    let closingCol = -1;
    let startRow = 7;

    for (let r = 0; r < Math.min(rows.length, 12); r++) {
      const row = rows[r] || [];
      const rowStr = row.map(c => String(c || '').toUpperCase().trim()).join(' | ');

      if (rowStr.includes('PRODUCT') || rowStr.includes('ITEM') || rowStr.includes('DESCRIPTION')) {
        startRow = r + 1;
        row.forEach((cell, cIdx) => {
          const c = String(cell || '').replace(/[\r\n]+/g, ' ').toUpperCase().trim();
          if (c.includes('PRODUCT') || c.includes('DESCRIPTION') || c.includes('ITEM')) {
            prodCol = cIdx;
          }
          if ((c === 'SALE QUANTITY' || c === 'SALE QTY' || c === 'ISSUE QUANTITY' || c === 'ISSUE QTY' || c === 'ISSUE') || 
              ((c.includes('SALE') || c.includes('ISSUE')) && !c.includes('RETURN') && !c.includes('P/R') && !c.includes('VAL'))) {
            salesCol = cIdx;
          }
          if ((c.includes('CLOSING') && (c.includes('STOCK') || c.includes('BAL') || c.includes('BALANCE') || c.includes('QTY'))) && !c.includes('VAL')) {
            closingCol = cIdx;
          }
        });
        break;
      }
    }

    if (salesCol === -1) salesCol = 6;
    if (closingCol === -1) closingCol = 9;

    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const rawProd = String(row[prodCol] || '').trim();
      if (!rawProd || rawProd.toUpperCase().includes('TOTAL') || rawProd.toUpperCase().includes('MARG ERP')) continue;

      const matched = matchMasterProduct(rawProd);
      if (matched) {
        const parseCell = (v: any) => {
          if (!v) return 0;
          const s = String(v).replace(/,/g, '').trim();
          if (s === '-' || s === '—') return 0;
          const n = parseFloat(s);
          return isNaN(n) ? 0 : n;
        };

        const sales = parseCell(row[salesCol]);
        const closing = parseCell(row[closingCol]);

        if (!items[matched.sn]) {
          items[matched.sn] = { sales: 0, closing: 0 };
          count++;
        }
        items[matched.sn].sales += sales;
        items[matched.sn].closing += closing;
        totalSales += sales;
        totalClosing += closing;
      }
    }
  }

  return { partyName, fileName: file.name, itemCount: count, totalSales, totalClosing, items };
}
