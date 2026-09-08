import { standardTheme, borderThin } from '../styles/standardTheme';
import { memoryStore } from '../../data/memoryStore';

const EXPIRY_PRODUCTS_MASTER = [
  "CALGYM 60K CAP", "CALGYM TAB", "CALROS TAB", "CITICURE 500 TAB", "CITICURE PLUS TAB",
  "DIOFLAM TAB", "DIOMILIN NT TAB", "DIOSGLT 10 TAB", "DIOSUL TAB", "DIOZAM 10 TAB",
  "DIOZAM 5 TAB", "ESIPRAM 10MG TAB", "ESIPRAM PLUS TAB", "FITJEE CAP", "FITJEE DM TAB",
  "ISIRON CAP", "NEUTOCID DSR CAP", "NEUTOCID LS CAP", "PREMYLIN M 75 TAB", "PREMYLIN M SR TAB",
  "PROSTADO TAB", "PROSTADO D TAB", "SOLEM 500 TAB", "VALROS 10 TAB", "VALROS 20 TAB",
  "VALROS ASP TAB", "VALROS F TAB", "VALROS GOLD 20 CAP", "VALROS GOLD 10 CAP", "VIDGLIT M FORTE TAB",
  "VIDGLIT M TAB", "VIDGLIT TAB", "VIDMET G 80 TAB", "VIDMET SR 1000MG TAB", "VIDMET SR 500MG TAB",
  "VINTEL 20 TAB", "VINTEL 40 TAB", "VINTEL 40AM TAB", "VINTEL 80 TAB", "VINTEL CT TAB",
  "VINTEL CTC TAB", "VINTEL H40 TAB", "VINTEL H80 TAB", "VINTEL M 25 TAB", "VINTEL M 50 TAB",
  "XILDA M 500 TAB", "XILDA M 1000 TAB", "XILDA TAB"
];

export function buildSheet05_NearByExpiry(data?: any) {
  const hqName = data?.hqName || memoryStore.hqName || 'UDAIPUR';
  const rowsData = data?.rows || (memoryStore.expiryData ? Object.values(memoryStore.expiryData) : []);

  // Map user data or fallback to master product names
  const dataMap = new Map<string, any>();
  if (Array.isArray(rowsData)) {
    rowsData.forEach((r: any) => {
      if (r && r.product) dataMap.set(r.product.toUpperCase().trim(), r);
    });
  }

  const wsData: any[][] = [];

  // ROW 1: Copper/Brown Banner (Cols A to F merged), Col G blank
  wsData.push([
    { v: 'DETAILS OF PRODUCTS HAVING LESS THAN 8 MONTHS EXPIRY', s: standardTheme.bannerCopper },
    { v: '', s: standardTheme.bannerCopper },
    { v: '', s: standardTheme.bannerCopper },
    { v: '', s: standardTheme.bannerCopper },
    { v: '', s: standardTheme.bannerCopper },
    { v: '', s: standardTheme.bannerCopper },
    { v: '', s: {} }
  ]);

  // ROW 2: Column Headers (Soft Peach Background)
  wsData.push([
    { v: 'S. NO', s: standardTheme.headerLightPeach },
    { v: 'PRODUCT', s: { ...standardTheme.headerLightPeach, alignment: { horizontal: 'left', vertical: 'center' } } },
    { v: 'HQ', s: standardTheme.headerLightPeach },
    { v: 'STOCKIST NAME', s: standardTheme.headerLightPeach },
    { v: 'QUANTITY', s: standardTheme.headerLightPeach },
    { v: 'MONTH OF EXPIRY', s: standardTheme.headerLightPeach },
    { v: 'PLAN OF LIQUIDATION', s: standardTheme.headerLightPeach }
  ]);

  // ROWS 3 to 50: 48 Products
  EXPIRY_PRODUCTS_MASTER.forEach((prodName, idx) => {
    const sn = idx + 1;
    const item = dataMap.get(prodName) || {};

    wsData.push([
      { v: sn, s: standardTheme.cellCenter },
      { v: prodName, s: standardTheme.cellLeft },
      { v: item.hq || '', s: standardTheme.cellCenter },
      { v: item.stockistName || '', s: standardTheme.cellCenter },
      { v: item.quantity !== undefined && item.quantity !== '' ? item.quantity : '', s: standardTheme.cellCenter },
      { v: item.monthOfExpiry || '', s: standardTheme.cellCenter },
      { v: item.planOfLiquidation || '', s: standardTheme.cellLeft }
    ]);
  });

  return {
    wsData,
    sheetName: '5_NEAR BY EXPIRY',
    merges: [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } } // Merge Row 1 Cols A to F
    ],
    cols: [
      { wch: 6 },  // S. NO
      { wch: 26 }, // PRODUCT
      { wch: 10 }, // HQ
      { wch: 20 }, // STOCKIST NAME
      { wch: 12 }, // QUANTITY
      { wch: 18 }, // MONTH OF EXPIRY
      { wch: 26 }  // PLAN OF LIQUIDATION
    ]
  };
}
