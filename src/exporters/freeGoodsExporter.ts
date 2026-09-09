import * as XLSX from 'xlsx-js-style';
import { MASTER_PRODUCTS } from '../data/masterProducts';
import { freeGoodsStore, FREE_GOODS_PARTIES } from '../data/freeGoodsStore';

const borderBlackThin = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } }
};

// 🌟 EXACT SCREENSHOT THEME STYLES
const styleYellowBanner = {
  font: { name: 'Arial', sz: 12, bold: true, color: { rgb: '000000' } },
  fill: { fgColor: { rgb: 'FFFF00' } }, // Bright Solid Yellow
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderBlackThin
};

const styleBlackHeader = {
  font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '000000' } }, // Solid Black Header
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderBlackThin
};

const styleCellCenter = {
  font: { name: 'Arial', sz: 10, color: { rgb: '000000' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderBlackThin
};

const styleCellLeft = {
  font: { name: 'Arial', sz: 10, color: { rgb: '000000' } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: borderBlackThin
};

const styleCellRight = {
  font: { name: 'Arial', sz: 10, color: { rgb: '000000' } },
  alignment: { horizontal: 'right', vertical: 'center' },
  border: borderBlackThin
};

const styleCellQtyBold = {
  font: { name: 'Arial', sz: 12, bold: true, color: { rgb: '000000' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderBlackThin
};

const styleYellowFooter = {
  font: { name: 'Arial', sz: 11, bold: true, color: { rgb: '000000' } },
  fill: { fgColor: { rgb: 'FFFF00' } }, // Bright Solid Yellow Footer
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderBlackThin
};

const styleYellowFooterRight = {
  font: { name: 'Arial', sz: 11, bold: true, color: { rgb: '000000' } },
  fill: { fgColor: { rgb: 'FFFF00' } },
  alignment: { horizontal: 'right', vertical: 'center' },
  border: borderBlackThin
};

const MONTH_FULL_MAP: Record<string, string> = {
  'APR': 'APRIL', 'MAY': 'MAY', 'JUN': 'JUNE',
  'JUL': 'JULY', 'AUG': 'AUGUST', 'SEP': 'SEPTEMBER',
  'OCT': 'OCTOBER', 'NOV': 'NOVEMBER', 'DEC': 'DECEMBER',
  'JAN': 'JANUARY', 'FEB': 'FEBRUARY', 'MAR': 'MARCH',
  'JUN_AUG': 'JUN-AUG (3M CUM)'
};

// 🌟 BUILD EXCEL SHEET FOR A STOCKIST (ONLY ACTIVE FREE GOODS PRODUCTS INCLUDED)
function buildStockistExcelSheet(partyId: string, partyName: string, tag: string, monthCodes: string[], onlyActiveQty: boolean = true) {
  const summary = freeGoodsStore.getMultiMonthPartySummary(monthCodes, partyId, partyName);
  
  // Format Banner Heading with Year (e.g. "FREE GOODS DWARIKA JULY'26")
  let monthsLabel = '';
  if (monthCodes.length === 1) {
    const fullM = MONTH_FULL_MAP[monthCodes[0]] || monthCodes[0];
    monthsLabel = `${fullM}'26`;
  } else {
    monthsLabel = monthCodes.map(m => `${MONTH_FULL_MAP[m] || m}'26`).join('-');
  }
  
  const bannerTitle = `FREE GOODS ${tag.toUpperCase()} ${monthsLabel}`;
  const wsData: any[][] = [];

  // ROW 1: Bright Yellow Banner (Merged A1:E1)
  wsData.push([
    { v: bannerTitle, s: styleYellowBanner },
    { v: '', s: styleYellowBanner },
    { v: '', s: styleYellowBanner },
    { v: '', s: styleYellowBanner },
    { v: '', s: styleYellowBanner }
  ]);

  // ROW 2: Solid Black Header with White Text
  wsData.push([
    { v: 'S.NO.', s: styleBlackHeader },
    { v: 'BRAND NAME', s: styleBlackHeader },
    { v: 'PTS', s: styleBlackHeader },
    { v: 'QTY.', s: styleBlackHeader },
    { v: 'AMOUNT', s: styleBlackHeader }
  ]);

  // DATA ROWS: ONLY INCLUDE PRODUCTS WITH FREE QTY > 0
  let rowCount = 0;
  MASTER_PRODUCTS.forEach(p => {
    const item = summary.items[p.sn];
    const qtyVal = item ? item.qty : '';
    const numQty = typeof qtyVal === 'number' ? qtyVal : 0;
    const amtVal = item ? item.amount : 0;

    if (onlyActiveQty && numQty <= 0) return; // 🌟 REMOVE ZERO / BLANK PRODUCTS!

    rowCount++;
    wsData.push([
      { v: onlyActiveQty ? rowCount : p.sn, s: styleCellCenter },
      { v: p.name, s: styleCellLeft },
      { v: Number(p.pts.toFixed(2)), s: styleCellRight },
      { v: numQty > 0 ? numQty : '', s: numQty > 0 ? styleCellQtyBold : styleCellCenter },
      { v: Number(amtVal.toFixed(2)), s: styleCellRight }
    ]);
  });

  // If no products had free goods, add one clean informational row
  if (rowCount === 0 && onlyActiveQty) {
    wsData.push([
      { v: 1, s: styleCellCenter },
      { v: 'No Free Goods in this period', s: styleCellLeft },
      { v: '-', s: styleCellCenter },
      { v: '-', s: styleCellCenter },
      { v: 0.00, s: styleCellRight }
    ]);
  }

  // ROW LAST: Solid Yellow Total Footer
  wsData.push([
    { v: 'TOTAL', s: styleYellowFooter },
    { v: '', s: styleYellowFooter },
    { v: '', s: styleYellowFooter },
    { v: summary.totalQty > 0 ? summary.totalQty : '', s: styleYellowFooter },
    { v: Number(summary.totalAmount.toFixed(2)), s: styleYellowFooterRight }
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Merge Banner A1:E1
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 2 } } // Merge Total A:C
  ];

  ws['!cols'] = [
    { wch: 8 },  // S.NO.
    { wch: 34 }, // BRAND NAME
    { wch: 12 }, // PTS
    { wch: 12 }, // QTY.
    { wch: 16 }  // AMOUNT
  ];

  ws['!rows'] = [
    { hpt: 26 }, // Row 1: Banner
    { hpt: 22 }  // Row 2: Header
  ];

  return ws;
}

// 🌟 MULTI-SHEET EXCEL WORKBOOK (ALL STOCKISTS IN SEPARATE SHEETS)
export function exportFreeGoodsStockwiseMultiSheetExcel(monthCodes: string[], onlyActiveQty: boolean = true) {
  const wb = XLSX.utils.book_new();

  FREE_GOODS_PARTIES.forEach(party => {
    const ws = buildStockistExcelSheet(party.id, party.name, party.tag, monthCodes, onlyActiveQty);
    XLSX.utils.book_append_sheet(wb, ws, party.tag); // Dedicated tab for Dwarika, Modi, Vardhman, etc.
  });

  const monthsStr = monthCodes.join('_');
  const filename = `FREE_GOODS_ALL_STOCKISTS_${monthsStr}_2026.xlsx`;
  XLSX.writeFile(wb, filename);
}

// Single Stockist Excel Export
export function exportFreeGoodsSinglePartyExcel(monthCodes: string[], partyId: string, partyName: string, tag: string, onlyActiveQty: boolean = true) {
  const wb = XLSX.utils.book_new();
  const ws = buildStockistExcelSheet(partyId, partyName, tag, monthCodes, onlyActiveQty);
  XLSX.utils.book_append_sheet(wb, ws, tag);

  const monthsStr = monthCodes.join('_');
  const filename = `FREE_GOODS_${tag.toUpperCase()}_${monthsStr}_2026.xlsx`;
  XLSX.writeFile(wb, filename);
}

// Single Stockist CSV Export
export function exportFreeGoodsPartyCSV(monthCodes: string[], partyId: string, partyName: string, onlyActiveQty: boolean = true) {
  const summary = freeGoodsStore.getMultiMonthPartySummary(monthCodes, partyId, partyName);
  let monthsLabel = '';
  if (monthCodes.length === 1) {
    const fullM = MONTH_FULL_MAP[monthCodes[0]] || monthCodes[0];
    monthsLabel = `${fullM}'26`;
  } else {
    monthsLabel = monthCodes.map(m => `${MONTH_FULL_MAP[m] || m}'26`).join('-');
  }

  const lines: string[] = [];
  lines.push(`FREE GOODS ${partyName.toUpperCase()} ${monthsLabel},,,,`);
  lines.push(',,,,');
  lines.push('S.NO.,BRAND NAME,PTS,QTY.,AMOUNT');

  let rowIdx = 1;
  MASTER_PRODUCTS.forEach(p => {
    const item = summary.items[p.sn];
    const qtyVal = item ? item.qty : '';
    const numQty = typeof qtyVal === 'number' ? qtyVal : 0;
    const amt = item ? item.amount.toFixed(2) : '0.00';

    if (onlyActiveQty && numQty <= 0) return;

    lines.push(`${onlyActiveQty ? rowIdx++ : p.sn},"${p.name}",${p.pts.toFixed(2)},${numQty > 0 ? numQty : ''},${amt}`);
  });

  lines.push(`TOTAL,,,${summary.totalQty},${summary.totalAmount.toFixed(2)}`);

  const csvContent = lines.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Free_Goods_${partyName}_${monthsLabel}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 🌟 DYNAMIC CUSTOM MASTER EXCEL (SELECTIVE STOCKISTS + SELECTIVE MONTHS)
export function exportCustomMasterExcel(
  monthCodes: string[],
  selectedPartyIds: string[],
  onlyActiveQty: boolean = true
) {
  const wb = XLSX.utils.book_new();

  const partiesToExport = FREE_GOODS_PARTIES.filter(p => selectedPartyIds.includes(p.id));

  partiesToExport.forEach(party => {
    const ws = buildStockistExcelSheet(party.id, party.name, party.tag, monthCodes, onlyActiveQty);
    XLSX.utils.book_append_sheet(wb, ws, party.tag);
  });

  const partyTagsStr = partiesToExport.map(p => p.tag.toUpperCase()).join('_');
  const monthsStr = monthCodes.join('_');
  const filename = `FREE_GOODS_${partyTagsStr}_${monthsStr}_2026.xlsx`;
  XLSX.writeFile(wb, filename);
}
