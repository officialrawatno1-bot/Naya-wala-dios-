import { standardTheme, borderThin } from '../styles/standardTheme';

const MONTH_COLS = [
  { key: 'apr', label: 'APRIL' }, { key: 'may', label: 'MAY' }, { key: 'jun', label: 'JUNE' },
  { key: 'jul', label: 'JULY' }, { key: 'aug', label: 'AUG' }, { key: 'sept', label: 'SEP' },
  { key: 'oct', label: 'OCT' }, { key: 'nov', label: 'NOV' }, { key: 'dec', label: 'DEC' },
  { key: 'jan', label: 'JAN' }, { key: 'feb', label: 'FEB' }, { key: 'mar', label: 'MAR' }
];

const INITIAL_DOC_ROWS = [
  { sn: 1, drName: 'MONA DHINGRA', hq: 'UDAIPUR', speciality: 'ENDO', campDate: '', rxInCamp: '' }
];

const INITIAL_PATIENTS = [
  { sn: 1, name: 'OM PRAKASH RANAWAT' },
  { sn: 2, name: 'GURUSIKHA SALVI' },
  { sn: 3, name: 'nilesh archarta' },
  { sn: 4, name: 'kanti lal sharma' },
  { sn: 5, name: 'BHERU PRASAD' },
  { sn: 6, name: '' },
  { sn: 7, name: '' },
  { sn: 8, name: '' },
  { sn: 9, name: '' },
  { sn: 10, name: '' },
  { sn: 11, name: '' },
  { sn: 12, name: '' },
  { sn: 13, name: '' },
  { sn: 14, name: '' },
  { sn: 15, name: '' },
];

export function buildSheet10_Glucometer(data?: any) {
  const docRows = data?.campDocs && Array.isArray(data.campDocs) && data.campDocs.length > 0 ? data.campDocs : INITIAL_DOC_ROWS;
  const patientRows = data?.patients && Array.isArray(data.patients) && data.patients.length > 0 ? data.patients : INITIAL_PATIENTS;

  const wsData: any[][] = [];
  const merges: any[] = [];

  // ==========================================
  // ROW 1: 
  // Col A: HQ (Red + Yellow Text)
  // Cols B to F (Merged): GLUCOMETER CAMPAIGN (Solid Olive Green)
  // Cols G to R: Blank
  // ==========================================
  const r1: any[] = [
    { v: 'HQ', s: standardTheme.headerRedYellowText },
    { v: 'GLUCOMETER CAMPAIGN', s: standardTheme.bannerLightGreen },
    { v: '', s: standardTheme.bannerLightGreen },
    { v: '', s: standardTheme.bannerLightGreen },
    { v: '', s: standardTheme.bannerLightGreen },
    { v: '', s: standardTheme.bannerLightGreen }
  ];
  for (let c = 6; c < 18; c++) r1.push({ v: '', s: {} });
  wsData.push(r1);
  merges.push({ s: { r: 0, c: 1 }, e: { r: 0, c: 5 } }); // Merge B1 to F1 (GLUCOMETER CAMPAIGN)

  // ==========================================
  // ROW 2: 
  // Col A: PRODUCT NAME (Dusty Rose)
  // Col B: LINAGET (Dusty Rose Bold)
  // Cols C to F: Dusty Rose
  // Cols G to R (Merged): NO. OF PRESCRIPTION  GENEREATED IN MONTH (Hot Magenta Pink)
  // ==========================================
  const r2: any[] = [
    { v: 'PRODUCT NAME', s: standardTheme.headerDustyRoseLeft },
    { v: 'LINAGET', s: { ...standardTheme.headerDustyRoseLeft, font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } } } },
    { v: '', s: standardTheme.headerDustyRose },
    { v: '', s: standardTheme.headerDustyRose },
    { v: '', s: standardTheme.headerDustyRose },
    { v: '', s: standardTheme.headerDustyRose },
    { v: 'NO. OF PRESCRIPTION  GENEREATED IN MONTH', s: standardTheme.bannerHotPink } // 💖 Hot Magenta Pink
  ];
  for (let c = 7; c < 18; c++) r2.push({ v: '', s: standardTheme.bannerHotPink });
  wsData.push(r2);
  merges.push({ s: { r: 1, c: 6 }, e: { r: 1, c: 17 } }); // Merge G2 to R2 (NO. OF PRESCRIPTION...)

  // ==========================================
  // ROW 3: 
  // Cols A to F: Doctor Table Headers (Dusty Rose)
  // Cols G to R: Months APRIL to MAR (💖 Hot Magenta Pink)
  // ==========================================
  const r3: any[] = [
    { v: 'S.NO.', s: standardTheme.headerDustyRose },
    { v: 'DR NAME', s: standardTheme.headerDustyRose },
    { v: 'HQ', s: standardTheme.headerDustyRose },
    { v: 'SPECIALITY', s: standardTheme.headerDustyRose },
    { v: 'CAMP DATE', s: standardTheme.headerDustyRose },
    { v: 'NO. OF Rx GENERATED IN CAMP', s: standardTheme.headerDustyRose }
  ];
  MONTH_COLS.forEach(m => {
    r3.push({ v: m.label, s: standardTheme.headerHotPink }); // 💖 Hot Magenta Pink
  });
  wsData.push(r3);

  // ==========================================
  // ROW 4: Doctor Data Rows
  // ==========================================
  docRows.forEach((doc: any) => {
    const dRow: any[] = [
      { v: doc.sn || '', s: standardTheme.cellCenter },
      { v: doc.drName || '', s: standardTheme.cellLeft },
      { v: doc.hq || 'UDAIPUR', s: standardTheme.cellCenter },
      { v: doc.speciality || 'ENDO', s: standardTheme.cellCenter },
      { v: doc.campDate || '', s: standardTheme.cellCenter },
      { v: doc.rxInCamp || '', s: standardTheme.cellCenter }
    ];
    MONTH_COLS.forEach(m => {
      dRow.push({ v: doc[m.key] || '', s: standardTheme.cellCenter });
    });
    wsData.push(dRow);
  });

  // Empty Spacers (Rows 5 & 6)
  wsData.push(new Array(18).fill({ v: '', s: standardTheme.cellCenter }));
  wsData.push(new Array(18).fill({ v: '', s: standardTheme.cellCenter }));

  // ==========================================
  // ROW 7: PATIENT TABLE HEADERS (Pure White & Crisp Black Borders)
  // ==========================================
  const patientHeaderRow: any[] = [
    { v: 'S. NO.', s: standardTheme.colHeader },
    { v: 'PATIENT NAME', s: standardTheme.colHeader },
    { v: 'PHONE NO.', s: standardTheme.colHeader },
    { v: 'BRAND PRESCRIBED', s: standardTheme.colHeader },
    { v: 'NO. OF STRIPS SOLD ON CAMPAIGN DAY', s: standardTheme.colHeader },
    { v: '', s: standardTheme.colHeader }
  ];
  for (let c = 6; c < 18; c++) patientHeaderRow.push({ v: '', s: {} });
  wsData.push(patientHeaderRow);
  merges.push({ s: { r: 6, c: 4 }, e: { r: 6, c: 5 } }); // Merge E7 to F7 (NO. OF STRIPS SOLD...)

  // ==========================================
  // ROWS 8 to 22: 15 PATIENT ROWS
  // ==========================================
  patientRows.forEach((p: any, idx: number) => {
    const rowIdx = 7 + idx;
    const pRow: any[] = [
      { v: p.sn || (idx + 1), s: standardTheme.cellCenter },
      { v: p.name || p.patientName || '', s: standardTheme.cellLeft },
      { v: p.phoneNo || '', s: standardTheme.cellCenter },
      { v: p.brand || '', s: standardTheme.cellCenter },
      { v: p.stripsSold || '', s: standardTheme.cellCenter },
      { v: '', s: standardTheme.cellCenter }
    ];
    for (let c = 6; c < 18; c++) pRow.push({ v: '', s: {} });
    wsData.push(pRow);
    merges.push({ s: { r: rowIdx, c: 4 }, e: { r: rowIdx, c: 5 } }); // Merge E to F for each row
  });

  return {
    wsData,
    sheetName: '10_GLUCOMETER CAMP',
    merges,
    cols: [
      { wch: 16 }, // Col A: S.NO. / PRODUCT NAME (Zero Clipping!)
      { wch: 24 }, // Col B: DR NAME / PATIENT NAME
      { wch: 14 }, // Col C: HQ / PHONE NO.
      { wch: 20 }, // Col D: SPECIALITY / BRAND PRESCRIBED
      { wch: 16 }, // Col E: CAMP DATE
      { wch: 26 }, // Col F: NO. OF Rx GENERATED IN CAMP / STRIPS
      ...MONTH_COLS.map(() => ({ wch: 9 })) // 12 Months
    ]
  };
}
