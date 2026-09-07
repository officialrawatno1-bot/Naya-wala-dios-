import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { PartyParseSummary, matchMasterProduct } from './common';

export async function parseVardhmanFile(file: File, partyName: string = 'Shree Vardhman'): Promise<PartyParseSummary> {
  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf');
  const items: Record<number, { sales: number; closing: number }> = {};
  let count = 0;
  let totalSales = 0;
  let totalClosing = 0;

  if (isPdf) {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

    // Packing Regex for Vardhman (supports 4's, 10's, 15's, 10;S, 10S, etc.)
    const vardhmanPackingRegex = /(\b\d+[';]s\b|\b\d+s\b|\b\d+\s*[*xX'/]\s*\d+\s*(?:TAB|CAP|TABS|CAPS)?)/i;

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

      // Group items strictly by horizontal line (Y within 4.5px)
      const lineBins: Array<{ y: number; items: TextItem[] }> = [];

      rawItems.forEach(item => {
        let bin = lineBins.find(b => Math.abs(b.y - item.y) <= 4.5);
        if (bin) {
          bin.items.push(item);
        } else {
          lineBins.push({ y: item.y, items: [item] });
        }
      });

      // Sort lines top to bottom
      lineBins.sort((a, b) => b.y - a.y);

      // Process each line
      lineBins.forEach(bin => {
        bin.items.sort((a, b) => a.x - b.x);
        const fullLine = bin.items.map(it => it.text).join(' ').trim();

        if (!fullLine || fullLine.toUpperCase().includes('SHREE') || fullLine.toUpperCase().includes('STOCK & SALES') || fullLine.toUpperCase().includes('ITEM DESCRIPTION') || fullLine.toUpperCase().includes('QUANTITY') || fullLine.toUpperCase().includes('VALUE IN RS') || fullLine.toUpperCase().includes('TOTAL')) {
          return;
        }

        let rawName = '';
        let quantitiesStr = '';

        // Split line using Vardhman Packing Column
        const match = fullLine.match(vardhmanPackingRegex);
        if (match && match.index !== undefined) {
          rawName = fullLine.slice(0, match.index).trim();
          quantitiesStr = fullLine.slice(match.index + match[0].length).trim();
        } else {
          const tokens = fullLine.split(/\s+/);
          const nums: string[] = [];
          const nTokens: string[] = [];
          for (let i = tokens.length - 1; i >= 0; i--) {
            const t = tokens[i].replace(/,/g, '');
            if (/^-?\d+(\.\d+)?$/.test(t) && nums.length < 15) {
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
            let regularSales = 0;
            let freeGoods = 0;
            let closing = 0;

            // Vardhman has 14 Numbers: Op, Pur, Free, S/R, Free, Repl, Tot, Sales_Qty(7), Sales_Free(8), Sample, T/F, P/R, Repl, Closing(13)
            if (numTokens.length >= 14) {
              regularSales = numTokens[7] || 0;
              freeGoods = numTokens[8] || 0;
              closing = numTokens[13] !== undefined ? numTokens[13] : numTokens[numTokens.length - 1];
            } else if (numTokens.length >= 12) {
              regularSales = numTokens[numTokens.length - 7] || 0;
              freeGoods = numTokens[numTokens.length - 6] || 0;
              closing = numTokens[numTokens.length - 1] || 0;
            } else if (numTokens.length >= 7) {
              regularSales = numTokens[numTokens.length - 3] || 0;
              freeGoods = numTokens[numTokens.length - 2] || 0;
              closing = numTokens[numTokens.length - 1] || 0;
            } else {
              regularSales = numTokens[numTokens.length - 2] || 0;
              freeGoods = 0;
              closing = numTokens[numTokens.length - 1] || 0;
            }

            const totalSalesCombined = regularSales + freeGoods;

            if (!items[matched.sn]) {
              items[matched.sn] = { sales: 0, closing: 0 };
              count++;
            }
            items[matched.sn].sales += totalSalesCombined;
            items[matched.sn].closing += closing;
            totalSales += totalSalesCombined;
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
      if (!rawProd || rawProd.toUpperCase().includes('QUANTITY') || rawProd.toUpperCase().includes('VALUE') || rawProd.toUpperCase().includes('TOTAL')) continue;

      const matched = matchMasterProduct(rawProd);
      if (matched) {
        const regularSales = parseFloat(cols[7] || '0') || 0;
        const freeGoods = parseFloat(cols[8] || '0') || 0;
        const totalSalesCombined = regularSales + freeGoods;
        const closing = parseFloat(cols[13] || cols[cols.length - 1] || '0') || 0;

        if (!items[matched.sn]) {
          items[matched.sn] = { sales: 0, closing: 0 };
          count++;
        }
        items[matched.sn].sales += totalSalesCombined;
        items[matched.sn].closing += closing;
        totalSales += totalSalesCombined;
        totalClosing += closing;
      }
    }
  }

  return { partyName, fileName: file.name, itemCount: count, totalSales, totalClosing, items };
}
