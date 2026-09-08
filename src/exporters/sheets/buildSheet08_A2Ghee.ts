import { standardTheme, borderThin } from '../styles/standardTheme';

const MONTH_COLS = [
  { key: 'apr', label: 'APRIL' }, { key: 'may', label: 'MAY' }, { key: 'jun', label: 'JUNE' },
  { key: 'jul', label: 'JULY' }, { key: 'aug', label: 'AUG' }, { key: 'sept', label: 'SEP' },
  { key: 'oct', label: 'OCT' }, { key: 'nov', label: 'NOV' }, { key: 'dec', label: 'DEC' },
  { key: 'jan', label: 'JAN' }, { key: 'feb', label: 'FEB' }, { key: 'mar', label: 'MAR' }
];

const INITIAL_A2_ROWS = [
  { sn: 1, drName: 'SANJAY GANDHI', hq: 'UDAIPUR', dmCard: 'CARDIOLOGIST', dateOfActivity: '13-Jun', prescriberStatus: 'NON', rxPerMonth: '', apr: '', may: '', jun: '13', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { sn: 2, drName: 'SK KAUSHIQ', hq: 'UDAIPUR', dmCard: 'CARD', dateOfActivity: '13-Jun', prescriberStatus: 'NON', rxPerMonth: '', apr: '2,17,27', may: '6,27', jun: '13,24', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' }
];

export function buildSheet08_A2Ghee(data?: any) {
  const rowsList = data?.rows && Array.isArray(data.rows) && data.rows.length > 0 ? data.rows : INITIAL_A2_ROWS;
  const wsData: any[][] = [];

  // ROW 1: 
  // Col A: PRODUCT NAME (Dusty Rose)
  // Col B: VALROS (Dusty Rose)
  // Col C: (Dusty Rose)
  // Cols D to G (Merged): A2 GHEE CAMPAIGN (Dusty Rose)
  // Cols H to S (Merged): VISIT DATES (🌟 EXACT SAME HOT MAGENTA PINK AS MONTHS)
  const r1: any[] = [
    { v: 'PRODUCT NAME', s: standardTheme.headerDustyRoseLeft },
    { v: 'VALROS', s: standardTheme.headerDustyRose },
    { v: '', s: standardTheme.headerDustyRose },
    { v: 'A2 GHEE CAMPAIGN', s: standardTheme.headerDustyRose },
    { v: '', s: standardTheme.headerDustyRose },
    { v: '', s: standardTheme.headerDustyRose },
    { v: '', s: standardTheme.headerDustyRose },
    { v: 'VISIT DATES', s: standardTheme.bannerHotPink } // 💖 SAME HOT PINK
  ];
  for (let c = 8; c < 19; c++) {
    r1.push({ v: '', s: standardTheme.bannerHotPink });
  }
  wsData.push(r1);

  // ROW 2: 
  // Left: Dusty Rose Headers
  // Months: 💖 EXACT SAME HOT MAGENTA PINK
  const r2: any[] = [
    { v: 'S.NO.', s: standardTheme.headerDustyRose },
    { v: 'DR NAME', s: standardTheme.headerDustyRose },
    { v: 'HQ', s: standardTheme.headerDustyRose },
    { v: 'DM CARD', s: standardTheme.headerDustyRose },
    { v: 'DATE OF ACTIVITY', s: standardTheme.headerDustyRose },
    { v: 'PRESCRIBER/NON PRESCRIBER', s: standardTheme.headerDustyRose },
    { v: 'NO. OF PRESCRIPTION/MONTH', s: standardTheme.headerDustyRose }
  ];
  MONTH_COLS.forEach(m => {
    r2.push({ v: m.label, s: standardTheme.headerHotPink }); // 💖 SAME HOT PINK
  });
  wsData.push(r2);

  // ROWS 3 onwards: Doctor Data Rows
  rowsList.forEach((row: any) => {
    const dataRow: any[] = [
      { v: row.sn || '', s: standardTheme.cellCenter },
      { v: row.drName || '', s: standardTheme.cellLeft },
      { v: row.hq || 'UDAIPUR', s: standardTheme.cellCenter },
      { v: row.dmCard || '', s: standardTheme.cellCenter },
      { v: row.dateOfActivity || '', s: standardTheme.cellCenter },
      { v: row.prescriberStatus || '', s: standardTheme.cellCenter },
      { v: row.rxPerMonth || '', s: standardTheme.cellCenter }
    ];

    MONTH_COLS.forEach(m => {
      const val = row[m.key] || '';
      dataRow.push({ v: val, s: standardTheme.cellCenter });
    });

    wsData.push(dataRow);
  });

  return {
    wsData,
    sheetName: '8_A2 GHEE VALROS',
    merges: [
      { s: { r: 0, c: 3 }, e: { r: 0, c: 6 } }, // Merge D1 to G1 (A2 GHEE CAMPAIGN)
      { s: { r: 0, c: 7 }, e: { r: 0, c: 18 } } // Merge H1 to S1 (VISIT DATES)
    ],
    cols: [
      { wch: 6 },  // S.NO.
      { wch: 22 }, // DR NAME
      { wch: 12 }, // HQ
      { wch: 16 }, // DM CARD
      { wch: 18 }, // DATE OF ACTIVITY
      { wch: 26 }, // PRESCRIBER/NON PRESCRIBER
      { wch: 26 }, // NO. OF PRESCRIPTION/MONTH
      ...MONTH_COLS.map(() => ({ wch: 9 })) // 12 Month columns
    ]
  };
}
