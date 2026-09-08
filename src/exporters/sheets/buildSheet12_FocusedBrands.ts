import { standardTheme, borderThin } from '../styles/standardTheme';

const MONTH_COLS = [
  { key: 'apr', label: 'APRIL' }, { key: 'may', label: 'MAY' }, { key: 'jun', label: 'JUNE' },
  { key: 'jul', label: 'JULY' }, { key: 'aug', label: 'AUG' }, { key: 'sept', label: 'SEP' },
  { key: 'oct', label: 'OCT' }, { key: 'nov', label: 'NOV' }, { key: 'dec', label: 'DEC' },
  { key: 'jan', label: 'JAN' }, { key: 'feb', label: 'FEB' }, { key: 'mar', label: 'MAR' }
];

const INITIAL_FOCUSED_DOCTORS = [
  { sn: 1, drName: 'ABHIJEET BASU', productName: 'CALGYM 60K', speciality: 'GP' },
  { sn: 2, drName: 'AMIT MEHTA', productName: 'CALGYM 60K', speciality: 'GP' },
  { sn: 3, drName: 'ANISH BAHL', productName: 'CALGYM 60K', speciality: 'GP' },
  { sn: 4, drName: 'JAGDISH VISHNOI', productName: 'CALGYM 60K', speciality: 'GP' },
  { sn: 5, drName: 'LALIT SHREEMALI', productName: 'CALGYM 60K', speciality: 'GP' },
  { sn: 6, drName: 'KB BADOLIYA', productName: 'DIOFLAM', speciality: 'GP' },
  { sn: 7, drName: 'RAVI MANGALIYA', productName: 'DIOFLAM', speciality: 'GP' },
  { sn: 8, drName: 'YN VERMA', productName: 'DIOFLAM', speciality: 'GP' },
  { sn: 9, drName: 'RN LADDHA', productName: 'DIOFLAM', speciality: 'GP' },
  { sn: 10, drName: 'LALIT SHRIMALI', productName: 'DIOFLAM', speciality: 'GP' },
  { sn: 6, drName: 'POOJA GANDHI', productName: 'FITJEE Q10', speciality: 'PHY/GYN/GP' },
  { sn: 7, drName: 'RADHA RASTOGI', productName: 'FITJEE Q10', speciality: 'PHY/GYN/GP' },
  { sn: 8, drName: 'LALIT JAINANI', productName: 'FITJEE Q10', speciality: 'PHY/GYN/GP' },
  { sn: 9, drName: 'ANMOL PAGARIYA', productName: 'FITJEE Q10', speciality: 'PHY/GYN/GP' },
  { sn: 10, drName: 'BS BOMB', productName: 'FITJEE Q10', speciality: 'PHY/GYN/GP' },
];

export function buildSheet12_FocusedBrands(data?: any) {
  const doctorsList = data?.items && Array.isArray(data.items) && data.items.length > 0 ? data.items : INITIAL_FOCUSED_DOCTORS;
  const wsData: any[][] = [];
  const merges: any[] = [];

  // ==========================================
  // ROW 1: HQ Cell (Red Bg + Yellow Text)
  // ==========================================
  const r1: any[] = [
    { v: 'HQ', s: standardTheme.headerRedYellowText },
    { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} },
    { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }
  ];
  for (let c = 7; c < 19; c++) r1.push({ v: '', s: {} });
  wsData.push(r1);

  // ==========================================
  // ROW 2: 
  // Cols A to E: Steel Blue Headers
  // Cols F to G: Steel Blue Headers
  // Cols H to S (Merged): SECONDARY IN STRIPS (Hot Magenta Pink + Black Text)
  // ==========================================
  const r2: any[] = [
    { v: 'S.NO.', s: standardTheme.headerSteelBlue },
    { v: 'DR NAME', s: standardTheme.headerSteelBlue },
    { v: 'PRODUCT NAME', s: standardTheme.headerSteelBlue },
    { v: 'SPECIALITY', s: standardTheme.headerSteelBlue },
    { v: 'ACTIVITY DONE/NOT', s: standardTheme.headerSteelBlue },
    { v: '', s: standardTheme.headerSteelBlue },
    { v: '', s: standardTheme.headerSteelBlue },
    { v: 'SECONDARY IN STRIPS', s: standardTheme.bannerHotPink } // 💖 Hot Magenta Pink
  ];
  for (let c = 8; c < 19; c++) {
    r2.push({ v: '', s: standardTheme.bannerHotPink });
  }
  wsData.push(r2);
  merges.push({ s: { r: 1, c: 7 }, e: { r: 1, c: 18 } }); // Merge H2 to S2 (SECONDARY IN STRIPS)

  // ==========================================
  // ROW 3:
  // Cols A to E: Vertical Merges from Row 2
  // Col F: PRESCRIBER / NON RXBER (Steel Blue)
  // Col G: NO. OF PRESCRIPTION GENERATED (Steel Blue)
  // Cols H to S: Months APRIL to MAR (Hot Magenta Pink)
  // ==========================================
  const r3: any[] = [
    { v: '', s: standardTheme.headerSteelBlue },
    { v: '', s: standardTheme.headerSteelBlue },
    { v: '', s: standardTheme.headerSteelBlue },
    { v: '', s: standardTheme.headerSteelBlue },
    { v: '', s: standardTheme.headerSteelBlue },
    { v: 'PRESCRIBER / NON RXBER', s: standardTheme.headerSteelBlue },
    { v: 'NO. OF PRESCRIPTION GENERATED', s: standardTheme.headerSteelBlue }
  ];
  MONTH_COLS.forEach(m => {
    r3.push({ v: m.label, s: standardTheme.headerHotPink });
  });
  wsData.push(r3);

  // 🌟 Vertical 2-Row Merges for Cols A to E (Rows 2 to 3)
  merges.push({ s: { r: 1, c: 0 }, e: { r: 2, c: 0 } }); // S.NO.
  merges.push({ s: { r: 1, c: 1 }, e: { r: 2, c: 1 } }); // DR NAME
  merges.push({ s: { r: 1, c: 2 }, e: { r: 2, c: 2 } }); // PRODUCT NAME
  merges.push({ s: { r: 1, c: 3 }, e: { r: 2, c: 3 } }); // SPECIALITY
  merges.push({ s: { r: 1, c: 4 }, e: { r: 2, c: 4 } }); // ACTIVITY DONE/NOT

  // ==========================================
  // ROWS 4 to 18: 15 Doctors Data Rows
  // ==========================================
  doctorsList.forEach((d: any) => {
    const row: any[] = [
      { v: d.sn || '', s: standardTheme.cellCenter },
      { v: d.drName || '', s: standardTheme.cellLeft },
      { v: d.productName || '', s: standardTheme.cellLeft },
      { v: d.speciality || 'GP', s: standardTheme.cellCenter },
      { v: d.activityDone || '', s: standardTheme.cellCenter },
      { v: d.prescriberType || '', s: standardTheme.cellCenter },
      { v: d.rxGenerated || '', s: standardTheme.cellCenter }
    ];

    MONTH_COLS.forEach(m => {
      const val = d[m.key] || '';
      row.push({ v: val, s: standardTheme.cellCenter });
    });

    wsData.push(row);
  });

  return {
    wsData,
    sheetName: '12_FOCUSED BRANDS',
    merges,
    // 🌟 Zero Clipping Guaranteed
    cols: [
      { wch: 6 },  // S.NO.
      { wch: 22 }, // DR NAME
      { wch: 18 }, // PRODUCT NAME
      { wch: 14 }, // SPECIALITY
      { wch: 20 }, // ACTIVITY DONE/NOT
      { wch: 26 }, // PRESCRIBER / NON RXBER
      { wch: 30 }, // NO. OF PRESCRIPTION GENERATED
      ...MONTH_COLS.map(() => ({ wch: 9 })) // 12 Month columns
    ],
    rows: [
      { hpt: 20 }, // Row 1: HQ
      { hpt: 24 }, // Row 2: Headers 1
      { hpt: 28 }  // Row 3: Headers 2
    ]
  };
}
