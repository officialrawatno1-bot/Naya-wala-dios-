import * as XLSX from 'xlsx-js-style';
import { partywiseAggregatorStore } from '../data/partywiseAggregatorStore';
import { standardTheme } from './styles/standardTheme';

export function exportPartywiseConsolidatedExcel(monthCode: string, currentStockist: string = 'all') {
  const wb = XLSX.utils.book_new();

  const stockistsToExport = currentStockist === 'all' 
    ? [
        { id: 'dwarika', name: 'Dwarika Medicals' },
        { id: 'modi', name: 'Modi Distributors' },
        { id: 'nagda', name: 'Nagda Distributors' },
        { id: 'vardhman', name: 'Shree Vardhman' }
      ]
    : [
        { id: currentStockist, name: currentStockist.charAt(0).toUpperCase() + currentStockist.slice(1) }
      ];

  stockistsToExport.forEach(st => {
    const retailers = partywiseAggregatorStore.getMonthRetailers(monthCode, st.id);
    const wsData: any[][] = [];

    wsData.push([
      { v: 'S.N.', s: standardTheme.colHeader },
      { v: 'RETAILER / CHEMIST NAME', s: standardTheme.colHeader },
      { v: 'ADDRESS / LOCATION', s: standardTheme.colHeader },
      { v: 'ALLOCATED MSL DOCTORS', s: standardTheme.colHeader },
      { v: 'SALES QTY', s: standardTheme.colHeader },
      { v: 'FREE QTY', s: standardTheme.colHeader },
      { v: 'TOTAL UNITS', s: standardTheme.colHeader },
      { v: 'SALES AMOUNT (₹)', s: standardTheme.colHeader },
      { v: 'FREE VALUE (₹)', s: standardTheme.colHeader },
      { v: 'GROSS AMOUNT (₹)', s: standardTheme.colHeader }
    ]);

    retailers.forEach((r, idx) => {
      const allocs = partywiseAggregatorStore.getAllocationsForRetailer(monthCode, r.key);
      const docSummary = allocs.length > 0 ? allocs.map(a => `${a.doctorName} (${Object.keys(a.allocatedProducts).length} SKUs)`).join('; ') : '-';

      wsData.push([
        { v: idx + 1, s: standardTheme.cellCenter },
        { v: r.retailerName, s: standardTheme.cellLeft },
        { v: r.address, s: standardTheme.cellCenter },
        { v: docSummary, s: standardTheme.cellLeft },
        { v: r.salesQty, s: standardTheme.cellCenter },
        { v: r.freeQty > 0 ? r.freeQty : '-', s: standardTheme.cellCenter },
        { v: r.totalQty, s: standardTheme.cellCenterBold },
        { v: r.salesAmount, s: standardTheme.cellRight },
        { v: r.freeAmount > 0 ? r.freeAmount : '-', s: standardTheme.cellRight },
        { v: r.grossAmount, s: standardTheme.cellRight }
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 18 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, st.name.split(' ')[0]);
  });

  const filename = `Partywise_Analysis_${currentStockist.toUpperCase()}_${monthCode}_2026.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportPartywiseConsolidatedCSV(monthCode: string, currentStockist: string = 'all') {
  const retailers = partywiseAggregatorStore.getMonthRetailers(monthCode, currentStockist);
  const lines: string[] = [];

  lines.push('S.N.,RETAILER / CHEMIST NAME,ADDRESS / LOCATION,STOCKIST,ALLOCATED MSL DOCTORS,SALES QTY,FREE QTY,TOTAL UNITS,SALES AMOUNT (₹),FREE VALUE (₹),GROSS AMOUNT (₹)');

  retailers.forEach((r, idx) => {
    const allocs = partywiseAggregatorStore.getAllocationsForRetailer(monthCode, r.key);
    const docSummary = allocs.length > 0 ? allocs.map(a => `${a.doctorName} (${Object.keys(a.allocatedProducts).length} SKUs)`).join('; ') : '-';
    const q = (v: any) => `"${String(v || '').replace(/"/g, '""')}"`;
    const stockistName = r.stockists.join('+') || 'Dwarika';

    lines.push(`${idx + 1},${q(r.retailerName)},${q(r.address)},${q(stockistName)},${q(docSummary)},${r.salesQty},${r.freeQty},${r.totalQty},${r.salesAmount},${r.freeAmount},${r.grossAmount}`);
  });

  const csvContent = lines.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Partywise_Analysis_${currentStockist.toUpperCase()}_${monthCode}_2026.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
