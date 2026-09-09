import * as XLSX from 'xlsx-js-style';
import { partywiseAggregatorStore } from '../data/partywiseAggregatorStore';
import { standardTheme } from './styles/standardTheme';

export function exportPartywiseConsolidatedExcel(monthCode: string) {
  const retailers = partywiseAggregatorStore.getMonthRetailers(monthCode);
  const wsData: any[][] = [];

  wsData.push([
    { v: 'S.N.', s: standardTheme.colHeader },
    { v: 'RETAILER / CHEMIST NAME', s: standardTheme.colHeader },
    { v: 'ADDRESS / LOCATION', s: standardTheme.colHeader },
    { v: 'LINKED DOCTOR (MSL)', s: standardTheme.colHeader },
    { v: 'TOTAL QTY', s: standardTheme.colHeader },
    { v: 'TOTAL AMOUNT (₹)', s: standardTheme.colHeader }
  ]);

  retailers.forEach((r, idx) => {
    const doc = partywiseAggregatorStore.getLinkedDoctor(r.key);
    wsData.push([
      { v: idx + 1, s: standardTheme.cellCenter },
      { v: r.retailerName, s: standardTheme.cellLeft },
      { v: r.address, s: standardTheme.cellCenter },
      { v: doc || '-', s: standardTheme.cellCenterBold },
      { v: r.totalQty, s: standardTheme.cellCenterBold },
      { v: r.totalAmount, s: standardTheme.cellRight }
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 20 }, { wch: 24 }, { wch: 12 }, { wch: 16 }];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Retailers_${monthCode}`);
  XLSX.writeFile(wb, `Partywise_Retailer_Analysis_${monthCode}_2026.xlsx`);
}

export function exportPartywiseConsolidatedCSV(monthCode: string) {
  const retailers = partywiseAggregatorStore.getMonthRetailers(monthCode);
  const lines: string[] = [];

  lines.push('S.N.,RETAILER / CHEMIST NAME,ADDRESS / LOCATION,LINKED DOCTOR (MSL),TOTAL QTY,TOTAL AMOUNT (₹)');

  retailers.forEach((r, idx) => {
    const doc = partywiseAggregatorStore.getLinkedDoctor(r.key) || '-';
    const q = (v: any) => `"${String(v || '').replace(/"/g, '""')}"`;
    lines.push(`${idx + 1},${q(r.retailerName)},${q(r.address)},${q(doc)},${r.totalQty},${r.totalAmount}`);
  });

  const csvContent = lines.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Partywise_Retailer_Analysis_${monthCode}_2026.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
