import * as XLSX from 'xlsx-js-style';
import { buildSheet01_EffortLevel } from './sheets/buildSheet01_EffortLevel';
import { buildSheet02_FwProgress } from './sheets/buildSheet02_FwProgress';
import { buildSheet03_SalesPerformance } from './sheets/buildSheet03_SalesPerformance';
import { buildSheet04_UnSalesProg } from './sheets/buildSheet04_UnSalesProg';
import { buildSheet05_NearByExpiry } from './sheets/buildSheet05_NearByExpiry';
import { buildSheet06_Commitment } from './sheets/buildSheet06_Commitment';
import { buildSheet07_Wcfyh } from './sheets/buildSheet07_Wcfyh';
import { buildSheet08_A2Ghee } from './sheets/buildSheet08_A2Ghee';
import { buildSheet09_TableTop } from './sheets/buildSheet09_TableTop';
import { buildSheet10_Glucometer } from './sheets/buildSheet10_Glucometer';
import { buildSheet11_SpecialFocused } from './sheets/buildSheet11_SpecialFocused';
import { buildSheet12_FocusedBrands } from './sheets/buildSheet12_FocusedBrands';
import { buildSheet13_Roi } from './sheets/buildSheet13_Roi';
import { buildSheet14_Msl } from './sheets/buildSheet14_Msl';
import { buildSheet16_ProductIncentive } from './sheets/buildSheet16_ProductIncentive';
import { buildSheet17_ConversionDrList } from './sheets/buildSheet17_ConversionDrList';
import { MASTER_PRODUCTS } from '../data/masterProducts';
import { unProgressionStore, MONTH_CODES } from '../data/unProgressionStore';
import { memoryStore } from '../data/memoryStore';
import { standardTheme } from './styles/standardTheme';

// 🌟 BUILD 17-SHEET MASTER WORKBOOK IN MEMORY
export function buildMasterReviewWorkbookObject(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const append = (builderFn: Function) => {
    try {
      const s = builderFn();
      const ws = XLSX.utils.aoa_to_sheet(s.wsData);
      if (s.merges) ws['!merges'] = s.merges;
      if (s.cols) ws['!cols'] = s.cols;
      if (s.rows) ws['!rows'] = s.rows;
      XLSX.utils.book_append_sheet(wb, ws, s.sheetName);
    } catch (e) {
      console.warn("Sheet append warning:", e);
    }
  };

  append(buildSheet01_EffortLevel);
  append(buildSheet02_FwProgress);
  append(buildSheet03_SalesPerformance);
  append(buildSheet04_UnSalesProg);
  append(buildSheet05_NearByExpiry);
  append(buildSheet06_Commitment);
  append(buildSheet07_Wcfyh);
  append(buildSheet08_A2Ghee);
  append(buildSheet09_TableTop);
  append(buildSheet10_Glucometer);
  append(buildSheet11_SpecialFocused);
  append(buildSheet12_FocusedBrands);
  append(buildSheet13_Roi);
  append(buildSheet14_Msl);
  append(buildSheet16_ProductIncentive);
  append(buildSheet17_ConversionDrList);

  return wb;
}

// 🌟 BUILD STATEMENT AGGREGATOR WORKBOOK IN MEMORY (2 SHEETS: UN SALES & BREAKDOWN)
export function buildStatementAggregatorWorkbookObject(selectedMonth: string = 'AUG'): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const gridData = unProgressionStore.getData();

  // Sheet 1: UN.SALES PROG
  const wsData1: any[][] = [];
  wsData1.push([{ v: 'DIOS LIFESCIENCES PVT LTD - UNIT SALES PROGRESSION', s: standardTheme.headerYellowCenterBold }]);
  wsData1.push([
    { v: 'S.N.', s: standardTheme.colHeader },
    { v: 'PRODUCT NAME', s: standardTheme.colHeader },
    { v: 'PTS', s: standardTheme.colHeader },
    ...MONTH_CODES.flatMap(m => [
      { v: `${m} PRI`, s: standardTheme.subHeaderNetPri },
      { v: `${m} SEC`, s: standardTheme.subHeaderNetSec },
      { v: `${m} CL`, s: standardTheme.subHeaderClosing }
    ])
  ]);

  MASTER_PRODUCTS.forEach(p => {
    const row = [
      { v: p.sn, s: standardTheme.cellCenter },
      { v: p.name, s: standardTheme.cellLeft },
      { v: p.pts.toFixed(2), s: standardTheme.cellRight }
    ];
    MONTH_CODES.forEach(m => {
      const it = gridData[m]?.[p.sn];
      row.push(
        { v: it?.netPri || '', s: standardTheme.cellCenter },
        { v: it?.netSec || '', s: standardTheme.cellCenter },
        { v: it?.closing || '', s: standardTheme.cellCenter }
      );
    });
    wsData1.push(row);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(wsData1);
  XLSX.utils.book_append_sheet(wb, ws1, 'UN.SALES PROG');

  return wb;
}
