import { standardTheme, borderThin } from '../styles/standardTheme';
import { MASTER_PRODUCTS } from '../../data/masterProducts';
import { unProgressionStore, MONTH_CODES } from '../../data/unProgressionStore';
import { memoryStore } from '../../data/memoryStore';

const MONTH_NAMES = [
  'APRIL', 'MAY', 'JUN', 'JULY', 'AUG', 'SEP', 
  'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'
];

export function buildSheet04_UnSalesProg(data?: any) {
  const hqName = data?.hqName || memoryStore.hqName || 'UDAIPUR';
  const gridData = data?.progressionData || unProgressionStore.getData() || {};

  const wsData: any[][] = [];

  // ROW 1: HQ NAME: UDAIPUR (Col C)
  const r1: any[] = [
    { v: '', s: {} },
    { v: '', s: {} },
    { v: `HQ NAME: ${hqName}`, s: { font: { name: 'Calibri', sz: 10, bold: true }, alignment: { horizontal: 'left', vertical: 'center' } } }
  ];
  for (let c = 3; c < 3 + MONTH_CODES.length * 3; c++) {
    r1.push({ v: '', s: {} });
  }
  wsData.push(r1);

  // ROW 2: 
  // Cols A & B (Merged): UNIT SALES PROGRESSION (HQ TOTAL) [RED BG + YELLOW TEXT]
  // Col C: Blank
  // Cols D onwards: Month Names merged across 3 cols each
  const r2: any[] = [
    { v: 'UNIT SALES PROGRESSION (HQ TOTAL)', s: standardTheme.headerRedYellowText },
    { v: '', s: standardTheme.headerRedYellowText },
    { v: '', s: {} }
  ];
  MONTH_NAMES.forEach(mName => {
    r2.push(
      { v: mName, s: standardTheme.colHeader },
      { v: '', s: standardTheme.colHeader },
      { v: '', s: standardTheme.colHeader }
    );
  });
  wsData.push(r2);

  // ROW 3:
  // Col A: S.N. [YELLOW BG]
  // Col B: PRODUCT NAME [YELLOW BG]
  // Col C: PTS [GREEN BG]
  // Cols D onwards: NET PRI (Soft Blue), NET SEC (Soft Green), CLOSING (Soft Peach)
  const r3: any[] = [
    { v: 'S.N.', s: standardTheme.headerYellowCol },
    { v: 'PRODUCT NAME', s: standardTheme.headerYellowCol },
    { v: 'PTS', s: standardTheme.headerGreenPts }
  ];
  MONTH_CODES.forEach(() => {
    r3.push(
      { v: 'NET PRI', s: standardTheme.subHeaderNetPri },
      { v: 'NET SEC', s: standardTheme.subHeaderNetSec },
      { v: 'CLOSING', s: standardTheme.subHeaderClosing }
    );
  });
  wsData.push(r3);

  // ROWS 4 to 76: 73 Master Products
  MASTER_PRODUCTS.forEach(p => {
    const row: any[] = [
      { v: p.sn, s: standardTheme.cellCenter },
      { v: p.name, s: standardTheme.cellLeft },
      { v: Number(p.pts.toFixed(2)), s: standardTheme.cellRight }
    ];

    MONTH_CODES.forEach(m => {
      const it = gridData[m]?.[p.sn];
      const priVal = it && it.netPri !== undefined && it.netPri !== 0 ? it.netPri : '';
      const secVal = it && it.netSec !== undefined && it.netSec !== 0 ? it.netSec : '';
      const clVal = it && it.closing !== undefined && it.closing !== 0 ? it.closing : '';

      row.push(
        { v: priVal !== '' ? Number(priVal) : '', s: standardTheme.cellCenter },
        { v: secVal !== '' ? Number(secVal) : '', s: standardTheme.cellCenter },
        { v: clVal !== '' ? Number(clVal) : '', s: standardTheme.cellCenter }
      );
    });

    wsData.push(row);
  });

  // Merges configuration
  const merges: any[] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Row 2: UNIT SALES PROGRESSION merge Col A-B
  ];

  // Merge each month name across its 3 sub-columns
  MONTH_NAMES.forEach((_, idx) => {
    const startCol = 3 + idx * 3;
    merges.push({
      s: { r: 1, c: startCol },
      e: { r: 1, c: startCol + 2 }
    });
  });

  // Column Widths
  const cols: any[] = [
    { wch: 6 },  // S.N.
    { wch: 30 }, // PRODUCT NAME
    { wch: 10 }, // PTS
  ];
  MONTH_CODES.forEach(() => {
    cols.push({ wch: 9 }, { wch: 9 }, { wch: 9 });
  });

  return {
    wsData,
    sheetName: '4_UN.SALES PROG.',
    merges,
    cols,
    rows: [{ hpt: 20 }, { hpt: 26 }, { hpt: 22 }]
  };
}
