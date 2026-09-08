import { standardTheme, borderThin } from '../styles/standardTheme';

const MONTH_COLS = [
  { key: 'apr', label: 'APRIL' }, { key: 'may', label: 'MAY' }, { key: 'jun', label: 'JUNE' },
  { key: 'jul', label: 'JULY' }, { key: 'aug', label: 'AUG' }, { key: 'sept', label: 'SEP' },
  { key: 'oct', label: 'OCT' }, { key: 'nov', label: 'NOV' }, { key: 'dec', label: 'DEC' },
  { key: 'jan', label: 'JAN' }, { key: 'feb', label: 'FEB' }, { key: 'mar', label: 'MAR' }
];

const INITIAL_WCFYH_ROWS = [
  // SECTION 1: VINTEL
  { sn: '1', brand: 'VINTEL', drName: 'PRIYANKA MINOCHA', speciality: 'MD MBBS, NEUROLOGY', dateOfCamp: '10TH OF EVERY MONTH', doneOn: 'na', rx: '' },
  { sn: '2', brand: 'VINTEL', drName: 'Mona dingra', speciality: 'DM ENDOCRINOLOGIST', dateOfCamp: '10TH OF EVERY MONTH', doneOn: '10-Jul', rx: '' },
  { sn: '3', brand: 'VINTEL', drName: 'UDAY BHOMIK', speciality: 'MCH NEUROSURGERY', dateOfCamp: '10TH OF EVERY MONTH', doneOn: '17-Jul', rx: '' },
  { isBlank: true },
  { isBlank: true },
  { isSeparatorP: true },
  { isBlank: true },

  // SECTION 2: VALROS
  { sn: '1', brand: 'VALROS', drName: 'DEEPAK AAMETHA', speciality: 'DM CARD.', dateOfCamp: '20TH OF EVERY MONTH', doneOn: '22-Jul', rx: '' },
  { sn: '2', brand: 'VALROS', drName: 'MUKESH SHARMA', speciality: 'DM CARD.', dateOfCamp: '20TH OF EVERY MONTH', doneOn: '22-Jul', rx: '' },
  { sn: '3', brand: 'VALROS', drName: 'CPPUROHIT', speciality: 'DM CARD.', dateOfCamp: '20TH OF EVERY MONTH', doneOn: '22-Jul', rx: '' },
  { sn: '4', brand: 'VALROS', drName: 'RAMESH PATEL', speciality: 'DM CARD.', dateOfCamp: '20TH OF EVERY MONTH', doneOn: '22-Jul', rx: '' },
  { sn: '5', brand: 'VALROS', drName: 'Sanjay Gandhi', speciality: 'MS,MCH,CARDIOLOGY', dateOfCamp: '20TH OF EVERY MONTH', doneOn: '', rx: '' },
  { sn: '6', brand: 'VALROS', drName: 'RAVIRAJ SINGH AHADA', speciality: 'DM CARD.', dateOfCamp: '20TH OF EVERY MONTH', doneOn: '22-Jul', rx: '' },
  { sn: '7', brand: 'VALROS', drName: 'Dilip jain', speciality: 'DM CARD.', dateOfCamp: '20TH OF EVERY MONTH', doneOn: '23-Jul', rx: '' }
];

export function buildSheet07_Wcfyh(data?: any) {
  const rawList = data?.rows && Array.isArray(data.rows) && data.rows.length > 0 ? data.rows : INITIAL_WCFYH_ROWS;
  
  // Strict Brand segregation for Excel
  const vintelRows = rawList.filter((r: any) => (r.brand || '').toUpperCase().trim() === 'VINTEL');
  const valrosRows = rawList.filter((r: any) => (r.brand || '').toUpperCase().trim() === 'VALROS');

  const wsData: any[][] = [];

  // ROW 1: 
  // Cols A to G (Merged): WE CARE FOR YOUR HEALTH CAMPAIGN (Yellow Bg + Red Text)
  // Cols H to S (Merged): VISIT DATES (Soft Rose Pink Bg)
  const r1: any[] = [
    { v: 'WE CARE FOR YOUR HEALTH CAMPAIGN', s: standardTheme.headerYellowRedText },
    { v: '', s: standardTheme.headerYellowRedText },
    { v: '', s: standardTheme.headerYellowRedText },
    { v: '', s: standardTheme.headerYellowRedText },
    { v: '', s: standardTheme.headerYellowRedText },
    { v: '', s: standardTheme.headerYellowRedText },
    { v: '', s: standardTheme.headerYellowRedText },
    { v: 'VISIT DATES', s: standardTheme.bannerSoftRose }
  ];
  for (let c = 8; c < 19; c++) {
    r1.push({ v: '', s: standardTheme.bannerSoftRose });
  }
  wsData.push(r1);

  // ROW 2: Column Headers
  // Left: White Bg Headers
  // Months: Hot Magenta Pink Headers
  const r2: any[] = [
    { v: 'S.NO.', s: standardTheme.colHeader },
    { v: 'BRAND', s: standardTheme.colHeader },
    { v: 'NAME OF THE DR.', s: standardTheme.colHeader },
    { v: 'SPECIALITY', s: standardTheme.colHeader },
    { v: 'DATE OF CAMPAIGN', s: standardTheme.colHeader },
    { v: 'CAMPAIGN DONE ON', s: standardTheme.colHeader },
    { v: 'RX GENERATED', s: standardTheme.colHeader }
  ];
  MONTH_COLS.forEach(m => {
    r2.push({ v: m.label, s: standardTheme.headerHotPink });
  });
  wsData.push(r2);

  // ROWS 3 onwards: Vintel Rows First
  vintelRows.forEach((row: any, idx: number) => {
    const dataRow: any[] = [
      { v: idx + 1, s: standardTheme.cellCenter },
      { v: 'VINTEL', s: standardTheme.cellCenter },
      { v: row.drName || '', s: standardTheme.cellLeft },
      { v: row.speciality || '', s: standardTheme.cellLeft },
      { v: row.dateOfCamp || row.dateOfCampaign || '10TH OF EVERY MONTH', s: standardTheme.cellCenter },
      { v: row.doneOn || row.campaignDoneOn || '', s: standardTheme.cellCenter },
      { v: row.rx || row.rxGenerated || '', s: standardTheme.cellCenter }
    ];
    MONTH_COLS.forEach(m => {
      dataRow.push({ v: row[m.key] || '', s: standardTheme.cellCenter });
    });
    wsData.push(dataRow);
  });

  // Separator rows between Vintel and Valros
  wsData.push(new Array(19).fill({ v: '', s: standardTheme.cellCenter }));
  const sepRow: any[] = new Array(19).fill({ v: '', s: standardTheme.cellCenter });
  sepRow[5] = { v: 'p', s: standardTheme.cellCenter };
  wsData.push(sepRow);
  wsData.push(new Array(19).fill({ v: '', s: standardTheme.cellCenter }));

  // Valros Rows Second
  valrosRows.forEach((row: any, idx: number) => {
    const dataRow: any[] = [
      { v: idx + 1, s: standardTheme.cellCenter },
      { v: 'VALROS', s: standardTheme.cellCenter },
      { v: row.drName || '', s: standardTheme.cellLeft },
      { v: row.speciality || '', s: standardTheme.cellLeft },
      { v: row.dateOfCamp || row.dateOfCampaign || '20TH OF EVERY MONTH', s: standardTheme.cellCenter },
      { v: row.doneOn || row.campaignDoneOn || '', s: standardTheme.cellCenter },
      { v: row.rx || row.rxGenerated || '', s: standardTheme.cellCenter }
    ];
    MONTH_COLS.forEach(m => {
      dataRow.push({ v: row[m.key] || '', s: standardTheme.cellCenter });
    });
    wsData.push(dataRow);
  });

  if (false) rowsList.forEach((row: any) => {
    if (row.isBlank) {
      wsData.push(new Array(19).fill({ v: '', s: standardTheme.cellCenter }));
    } else if (row.isSeparatorP) {
      const sepRow: any[] = new Array(19).fill({ v: '', s: standardTheme.cellCenter });
      sepRow[5] = { v: 'p', s: standardTheme.cellCenter };
      wsData.push(sepRow);
    } else {
      const dataRow: any[] = [
        { v: row.sn || '', s: standardTheme.cellCenter },
        { v: row.brand || '', s: standardTheme.cellCenter },
        { v: row.drName || '', s: standardTheme.cellLeft },
        { v: row.speciality || '', s: standardTheme.cellLeft },
        { v: row.dateOfCamp || row.dateOfCampaign || '', s: standardTheme.cellCenter },
        { v: row.doneOn || row.campaignDoneOn || '', s: standardTheme.cellCenter },
        { v: row.rx || row.rxGenerated || '', s: standardTheme.cellCenter }
      ];

      MONTH_COLS.forEach(m => {
        const val = row[m.key] || '';
        dataRow.push({ v: val, s: standardTheme.cellCenter });
      });

      wsData.push(dataRow);
    }
  });

  return {
    wsData,
    sheetName: '7_WCFYH',
    merges: [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Merge A1 to G1 (WE CARE FOR YOUR HEALTH)
      { s: { r: 0, c: 7 }, e: { r: 0, c: 18 } } // Merge H1 to S1 (VISIT DATES)
    ],
    cols: [
      { wch: 6 },  // S.NO.
      { wch: 10 }, // BRAND
      { wch: 24 }, // NAME OF THE DR.
      { wch: 24 }, // SPECIALITY
      { wch: 22 }, // DATE OF CAMPAIGN
      { wch: 20 }, // CAMPAIGN DONE ON
      { wch: 16 }, // RX GENERATED
      ...MONTH_COLS.map(() => ({ wch: 9 })) // 12 Month columns
    ]
  };
}
