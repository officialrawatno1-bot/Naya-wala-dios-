import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { PartyParseSummary, matchMasterProduct } from './common';

export async function parseRpFile(file: File, partyName: string = 'R.P. Agencies'): Promise<PartyParseSummary> {
  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf');
  const items: Record<number, { sales: number; closing: number }> = {};
  let count = 0;
  let totalSales = 0;
  let totalClosing = 0;

  if (isPdf) {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
    
    // Multi-tier Packing Regex
    const packingRegex = /(\b\d+(?:\s*[*xX'/]\s*\d+)+\s*(?:TAB|CAP|TABS|CAPS|STR|STRP|PCS)?|\b\d+\s*S\b|\b\d+\s*'S\b|\b10S\b|\b15S\b|\b4S\b|\b14S\b|\b10\s*S\b|\b15\s*S\b|\b4\s*S\b|\b14\s*S\b)/i;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const rawItems: Array<{ x: number; y: number; text: string }> = [];
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

      rawItems.sort((a, b) => b.y - a.y);

      const clusteredLines: Array<Array<{ x: number; text: string }>> = [];
      const lineRefY: number[] = [];

      rawItems.forEach(item => {
        let matchedLineIdx = -1;
        for (let i = 0; i < lineRefY.length; i++) {
          if (Math.abs(lineRefY[i] - item.y) <= 4.0) {
            matchedLineIdx = i;
            break;
          }
        }
        if (matchedLineIdx !== -1) {
          clusteredLines[matchedLineIdx].push({ x: item.x, text: item.text });
        } else {
          lineRefY.push(item.y);
          clusteredLines.push([{ x: item.x, text: item.text }]);
        }
      });

      clusteredLines.forEach(lineItems => {
        lineItems.sort((a, b) => a.x - b.x);
        const fullLine = lineItems.map(it => it.text).join(' ').trim();

        if (!fullLine || fullLine.toUpperCase().includes('PAGE NO') || fullLine.toUpperCase().includes('DIOS LIFE') || fullLine.toUpperCase().includes('PRODUCT NAME') || fullLine.startsWith('***') || fullLine.toUpperCase().includes('TOTAL')) {
          return;
        }

        let rawName = '';
        let quantitiesStr = '';

        const match = fullLine.match(packingRegex);
        if (match && match.index !== undefined) {
          rawName = fullLine.slice(0, match.index).trim();
          quantitiesStr = fullLine.slice(match.index + match[0].length).trim();
        } else {
          const tokens = fullLine.split(/\s+/);
          const nums: string[] = [];
          const nTokens: string[] = [];
          for (let i = tokens.length - 1; i >= 0; i--) {
            const t = tokens[i].replace(/,/g, '');
            if (/^-?\d+(\.\d+)?$/.test(t) && nums.length < 9) {
              nums.unshift(t);
            } else {
              nTokens.unshift(tokens[i]);
            }
          }
          rawName = nTokens.join(' ');
          quantitiesStr = nums.join(' ');
        }

        if (rawName) {
          const matched = matchMasterProduct(rawName);
          if (matched) {
            const numTokens = (quantitiesStr.match(/-?\d+(\.\d+)?/g) || []).map(Number);
            let sales = 0;
            let closing = 0;

            if (numTokens.length === 8) {
              sales = numTokens[4]; // Issue Qty
              closing = numTokens[6]; // Closing Balance
            } else if (numTokens.length >= 7) {
              sales = numTokens[4];
              closing = numTokens[6] !== undefined ? numTokens[6] : numTokens[5];
            } else if (numTokens.length >= 2) {
              sales = numTokens[numTokens.length - 2];
              closing = numTokens[numTokens.length - 1];
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
        }
      });
    }
  } else {
    // XLS / CSV
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const lines = csvContent.split('\n');

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
      const rawProd = cols[0] || '';
      if (!rawProd || rawProd.toUpperCase().includes('TOTAL')) continue;

      const matched = matchMasterProduct(rawProd);
      if (matched) {
        const sales = parseFloat(cols[6] || '0') || 0;
        const closing = parseFloat(cols[8] || '0') || 0;
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
