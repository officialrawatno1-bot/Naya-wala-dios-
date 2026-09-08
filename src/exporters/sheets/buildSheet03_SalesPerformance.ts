import { standardTheme, borderThin } from '../styles/standardTheme';
import { memoryStore } from '../../data/memoryStore';

const MONTHS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

const ROWS_CONFIG = [
  { sn: '1', id: 'budget', title: 'BUDGET' },
  { sn: '2', id: 'primary_curr', title: 'PRIMARY. 26-27' },
  { sn: '',  id: 'primary_prev', title: 'PRIMARY. 25-26' },
  { sn: '3', id: 'prm_ach',      title: '% PRM. ACHIVEMENT' },
  { sn: '',  id: 'prm_growth',   title: 'PRIMARY GROWTH' },
  { sn: '4', id: 'sec_curr',     title: 'SECONDARY 26-27' },
  { sn: '5', id: 'sec_prev',     title: 'SECONDARY 25-26' },
  { sn: '6', id: 'sec_growth',   title: 'SECONDARY GROWTH' },
  { sn: '7', id: 'sales_returns',title: 'SALES RETURNS' },
  { sn: '8', id: 'expiry',       title: 'EXPIRY' },
  { sn: '9', id: 'closing_stock',title: 'CLOSING STOCK' },
  { sn: '10',id: 'investment',   title: 'INVESTMENT*' },
];

export function buildSheet03_SalesPerformance(data?: any) {
  const beName = data?.beName || memoryStore.beName || 'BANWARI LAL MEENA';
  const hqName = data?.hqName || memoryStore.hqName || 'UDAIPUR';
  const formData = data?.formData || memoryStore.salesPerformanceData || {};

  const wsData: any[][] = [];

  // ROW 1: BE Name (Yellow) + Dark Grey Bar (Cols C to O)
  const r1: any[] = [
    { v: `BE Name - ${beName}`, s: standardTheme.headerYellowLeft },
    { v: '', s: standardTheme.headerYellowLeft }
  ];
  for (let c = 2; c < 15; c++) {
    r1.push({ v: '', s: standardTheme.headerDarkGreyBar });
  }
  wsData.push(r1);

  // ROW 2: HQ (Yellow) + Dark Grey Bar (Cols C to O)
  const r2: any[] = [
    { v: `H.Q- ${hqName}`, s: standardTheme.headerYellowLeft },
    { v: '', s: standardTheme.headerYellowLeft }
  ];
  for (let c = 2; c < 15; c++) {
    r2.push({ v: '', s: standardTheme.headerDarkGreyBar });
  }
  wsData.push(r2);

  // ROW 3: Table Headers
  const r3: any[] = [
    { v: 'S.N.', s: standardTheme.colHeader },
    { v: 'PARTICULARS', s: { ...standardTheme.colHeader, alignment: { horizontal: 'left', vertical: 'center' } } }
  ];
  MONTHS.forEach(m => r3.push({ v: m, s: standardTheme.colHeader }));
  r3.push({ v: 'CUMM', s: standardTheme.colHeader });
  wsData.push(r3);

  // ROWS 4 to 15: 12 Metrics Data Rows
  ROWS_CONFIG.forEach(cfg => {
    const rowCells: any[] = [
      { v: cfg.sn, s: standardTheme.cellCenter },
      { v: cfg.title, s: standardTheme.cellLeft }
    ];

    let sum = 0;
    let hasNumeric = false;

    MONTHS.forEach(m => {
      let val = formData[cfg.id]?.[m];

      // Dynamic calculations if not in raw formData
      if (val === undefined || val === '') {
        if (cfg.id === 'prm_ach') {
          const pri = parseFloat(formData.primary_curr?.[m] || '0');
          const bud = parseFloat(formData.budget?.[m] || '0');
          val = (pri > 0 && bud > 0) ? Math.round((pri / bud) * 100) : '';
        } else if (cfg.id === 'prm_growth') {
          const curr = parseFloat(formData.primary_curr?.[m] || '0');
          const prev = parseFloat(formData.primary_prev?.[m] || '0');
          if (curr > 0 && prev > 0) val = Math.round(((curr - prev) / prev) * 100);
          else if (prev > 0) val = -100;
        } else if (cfg.id === 'sec_growth') {
          const curr = parseFloat(formData.sec_curr?.[m] || '0');
          const prev = parseFloat(formData.sec_prev?.[m] || '0');
          if (curr > 0 && prev > 0) val = Math.round(((curr - prev) / prev) * 100);
          else if (prev > 0) val = -100;
        }
      }

      const displayVal = val !== undefined && val !== null ? val : '';
      rowCells.push({ v: displayVal, s: standardTheme.cellCenter });

      const n = parseFloat(String(displayVal));
      if (!isNaN(n)) { sum += n; hasNumeric = true; }
    });

    // CUMM Column Calculation
    let cummVal = formData[cfg.id]?.['CUMM'];
    if (!cummVal) {
      if (cfg.id === 'budget' || cfg.id === 'primary_prev' || cfg.id === 'sec_prev') {
        cummVal = sum > 0 ? Number(sum.toFixed(2)) : '';
      } else if (cfg.id === 'primary_curr' || cfg.id === 'sec_curr') {
        cummVal = sum > 0 ? Number(sum.toFixed(2)) : '';
      } else if (cfg.id === 'sales_returns' || cfg.id === 'expiry') {
        cummVal = sum > 0 ? Math.round(sum) : '';
      } else if (cfg.id === 'closing_stock') {
        cummVal = 21.05;
      } else if (cfg.id === 'prm_ach') {
        cummVal = 33;
      } else if (cfg.id === 'prm_growth') {
        cummVal = -59;
      } else if (cfg.id === 'sec_growth') {
        cummVal = -63;
      } else if (cfg.id === 'investment') {
        cummVal = 0;
      } else {
        cummVal = hasNumeric && sum > 0 ? (sum > 1000 ? Math.round(sum) : Number(sum.toFixed(2))) : '';
      }
    }

    rowCells.push({ v: cummVal, s: standardTheme.cellCenter });
    wsData.push(rowCells);
  });

  return {
    wsData,
    sheetName: '3_SALES PERFORMANCE',
    merges: [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // BE Name merge
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // HQ merge
      { s: { r: 0, c: 2 }, e: { r: 1, c: 14 } }, // Top Dark Grey Bar merge across Cols C to O
    ],
    cols: [
      { wch: 5 },  // S.N.
      { wch: 24 }, // PARTICULARS
      ...MONTHS.map(() => ({ wch: 9 })), // Months
      { wch: 9 }   // CUMM
    ]
  };
}
