import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { PartyParseSummary, matchMasterProduct } from './common';

export async function parseModiFile(file: File, partyName: string = 'Modi Distributors'): Promise<PartyParseSummary> {
  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf');
  const items: Record<number, { sales: number; closing: number }> = {};
  let count = 0;
  let totalSales = 0;
  let totalClosing = 0;

  if (isPdf) {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

    // Anchor regex for Modi unit column: STR, PCS, STRP, TAB
    const modiUnitRegex = /(\bSTR\b|\bPCS\b|\bSTRP\b|\bTAB\b)/i;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      interface TextItem {
        x: number;
        y: number;
        text: string;
      }

      const rawItems: TextItem[] = [];
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

      const lineBins: Array<{ y: number; items: TextItem[] }> = [];

      rawItems.forEach(item => {
        let bin = lineBins.find(b => Math.abs(b.y - item.y) <= 4.5);
        if (bin) {
          bin.items.push(item);
        } else {
          lineBins.push({ y: item.y, items: [item] });
        }
      });

      lineBins.sort((a, b) => b.y - a.y);

      lineBins.forEach(bin => {
        bin.items.sort((a, b) => a.x - b.x);
        const fullLine = bin.items.map(it => it.text).join(' ').trim();

        if (!fullLine || fullLine.toUpperCase().includes('STOCK & SALES') || fullLine.toUpperCase().includes('MODI DISTRIBUTORS') || fullLine.toUpperCase().includes('ITEM DESCRIPTION') || fullLine.toUpperCase().includes('TOTAL') || fullLine.toUpperCase().includes('DIOS LIFESCIENCES')) {
          return;
        }

        let rawName = '';
        let quantitiesStr = '';

        // Split at STR or PCS anchor
        const match = fullLine.match(modiUnitRegex);
        if (match && match.index !== undefined) {
          rawName = fullLine.slice(0, match.index).trim();
          quantitiesStr = fullLine.slice(match.index + match[0].length).trim();
        } else {
          // Fallback: search for numbers/dashes from right
          const tokens = fullLine.split(/\s+/);
          const nums: string[] = [];
          const nameTokens: string[] = [];
          for (let i = tokens.length - 1; i >= 0; i--) {
            const t = tokens[i].replace(/,/g, '');
            if (t === '-') {
              nums.unshift('0');
            } else if (/^-?\d+(\.\d+)?$/.test(t) && nums.length < 4) {
              nums.unshift(t);
            } else {
              nameTokens.unshift(tokens[i]);
            }
          }
          rawName = nameTokens.join(' ');
          quantitiesStr = nums.join(' ');
        }

        if (rawName) {
          const matched = matchMasterProduct(rawName);
          if (matched) {
            // Replace '-' with '0' and extract 4 numbers: [Opening, Receipt, Issue, Closing]
            const cleanQty = quantitiesStr.replace(/-/g, ' 0 ');
            const numTokens = (cleanQty.match(/-?\d+(\.\d+)?/g) || []).map(Number);
            let sales = 0;
            let closing = 0;

            if (numTokens.length >= 4) {
              sales = numTokens[numTokens.length - 2]; // ISSUE (Sales)
              closing = numTokens[numTokens.length - 1]; // CLOSING (Stock)
            } else if (numTokens.length >= 2) {
              sales = numTokens[0];
              closing = numTokens[1];
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
      if (!rawProd || rawProd.toUpperCase().includes('TOTAL') || rawProd.toUpperCase().includes('ITEM')) continue;

      const matched = matchMasterProduct(rawProd);
      if (matched) {
        const salesVal = cols[4] === '-' ? '0' : cols[4] || '0';
        const closingVal = cols[5] === '-' ? '0' : cols[5] || '0';
        const sales = parseFloat(salesVal) || 0;
        const closing = parseFloat(closingVal) || 0;

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
