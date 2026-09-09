import * as XLSX from 'xlsx-js-style';
import { MASTER_PRODUCTS } from '../data/masterProducts';
import { freeGoodsStore, FREE_GOODS_PARTIES } from '../data/freeGoodsStore';
import { standardTheme } from './styles/standardTheme';

export function exportFreeGoodsPartyCSV(monthCode: string, partyId: string, partyName: string) {
  const summary = freeGoodsStore.getPartySummary(monthCode, partyId, partyName);
  
  const lines: string[] = [];
  lines.push(`FREE GOODS ${partyName.toUpperCase()} ${monthCode}'26,,,,`);
  lines.push(',,,,');
  lines.push('S.NO.,BRAND NAME,PTS,QTY.,AMOUNT');

  let rowIdx = 1;
  MASTER_PRODUCTS.forEach(p => {
    const item = summary.items[p.sn];
    const qty = item && item.qty !== '' ? item.qty : '';
    const amt = item ? item.amount.toFixed(2) : '0.00';
    lines.push(`${rowIdx++},"${p.name}",${p.pts.toFixed(2)},${qty},${amt}`);
  });

  lines.push(`,TOTAL,,${summary.totalQty},${summary.totalAmount.toFixed(2)}`);

  const csvContent = lines.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Free_Goods_${partyName}_${monthCode}_2026.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportFreeGoodsMasterExcel(monthCode: string) {
  const wb = XLSX.utils.book_new();
  const wsData: any[][] = [];

  wsData.push([
    { v: 'S.N.', s: standardTheme.colHeader },
    { v: 'PRODUCT NAME', s: standardTheme.colHeader },
    { v: 'PTS (₹)', s: standardTheme.colHeader },
    ...FREE_GOODS_PARTIES.flatMap(p => [
      { v: `${p.tag} QTY`, s: standardTheme.colHeader },
      { v: `${p.tag} AMT (₹)`, s: standardTheme.colHeader }
    ]),
    { v: 'TOTAL FREE QTY', s: standardTheme.colHeader },
    { v: 'TOTAL FREE AMT (₹)', s: standardTheme.colHeader }
  ]);

  MASTER_PRODUCTS.forEach(p => {
    let rowTotQty = 0;
    let rowTotAmt = 0;
    const row: any[] = [
      { v: p.sn, s: standardTheme.cellCenter },
      { v: p.name, s: standardTheme.cellLeft },
      { v: p.pts.toFixed(2), s: standardTheme.cellRight }
    ];

    FREE_GOODS_PARTIES.forEach(party => {
      const summary = freeGoodsStore.getPartySummary(monthCode, party.id, party.name);
      const it = summary.items[p.sn];
      const q = typeof it?.qty === 'number' ? it.qty : 0;
      const a = it?.amount || 0;
      rowTotQty += q;
      rowTotAmt += a;

      row.push(
        { v: q > 0 ? q : '', s: q > 0 ? standardTheme.cellCenterBold : standardTheme.cellCenter },
        { v: a > 0 ? a : '', s: a > 0 ? standardTheme.cellRight : standardTheme.cellCenter }
      );
    });

    row.push(
      { v: rowTotQty > 0 ? rowTotQty : '', s: standardTheme.cellCenterBold },
      { v: rowTotAmt > 0 ? rowTotAmt : '', s: standardTheme.cellRight }
    );

    wsData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const cols = [{ wch: 6 }, { wch: 32 }, { wch: 10 }];
  FREE_GOODS_PARTIES.forEach(() => cols.push({ wch: 10 }, { wch: 14 }));
  cols.push({ wch: 14 }, { wch: 16 });
  ws['!cols'] = cols;

  XLSX.utils.book_append_sheet(wb, ws, `Free_Goods_${monthCode}`);
  XLSX.writeFile(wb, `Free_Goods_Master_Matrix_${monthCode}_2026.xlsx`);
}
