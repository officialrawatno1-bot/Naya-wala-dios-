import { standardTheme, borderThin } from '../styles/standardTheme';

const DEFAULT_SECTIONS = [
  {
    productName: 'LINAGET',
    rows: [
      { sn: 1, drName: 'SANDEEP KANSARA', hq: 'UDAIPUR', speciality: 'ENDO', activityDone: 'DONE', prescriberStatus: '', rxPerMonth: '' },
      { sn: 2, drName: 'VINOD BOKADIYA', hq: 'UDAIPUR', speciality: 'ENDO', activityDone: 'DONE', prescriberStatus: '', rxPerMonth: '' },
      { sn: 3, drName: 'JAI CHORDIYA', hq: 'UDAIPUR', speciality: 'ENDO', activityDone: '', prescriberStatus: '', rxPerMonth: '' }
    ]
  },
  {
    productName: 'VINTEL',
    rows: [
      { sn: 1, drName: 'MANISH KULSHRESHT', hq: 'UDAIPUR', speciality: 'NEURO', activityDone: 'Done', prescriberStatus: '', rxPerMonth: '' },
      { sn: 2, drName: 'JITESH AGRAWAL', hq: 'UDAIPUR', speciality: 'PHY', activityDone: 'Done', prescriberStatus: '', rxPerMonth: '' },
      { sn: 3, drName: 'SATISH CHOUDHARY', hq: 'UDAIPUR', speciality: 'PHY', activityDone: 'Done', prescriberStatus: '', rxPerMonth: '' }
    ]
  }
];

export function buildSheet09_TableTop(data?: any) {
  const sections = data?.sections && Array.isArray(data.sections) && data.sections.length > 0 ? data.sections : DEFAULT_SECTIONS;
  const wsData: any[][] = [];
  const merges: any[] = [];

  // ROW 1: 
  // Col A: HQ (Red Bg + Yellow Text)
  // Cols B to G (Merged): TABLE TOP CAMPAIGN (Deeper Rich Green Bg)
  const r1: any[] = [
    { v: 'HQ', s: standardTheme.headerRedYellowText },
    { v: 'TABLE TOP CAMPAIGN', s: standardTheme.bannerLightGreen },
    { v: '', s: standardTheme.bannerLightGreen },
    { v: '', s: standardTheme.bannerLightGreen },
    { v: '', s: standardTheme.bannerLightGreen },
    { v: '', s: standardTheme.bannerLightGreen },
    { v: '', s: standardTheme.bannerLightGreen }
  ];
  wsData.push(r1);
  merges.push({ s: { r: 0, c: 1 }, e: { r: 0, c: 6 } }); // Merge B1 to G1

  let currentRowIdx = 1;

  sections.forEach((sec: any) => {
    // PRODUCT BANNER ROW (Richer Dusty Rose - Fits "PRODUCT NAME" completely!)
    const prodRow: any[] = [
      { v: 'PRODUCT NAME', s: standardTheme.headerDustyRoseLeft },
      { v: sec.productName || '', s: { ...standardTheme.headerDustyRoseLeft, font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '000000' } } } },
      { v: '', s: standardTheme.headerDustyRose },
      { v: '', s: standardTheme.headerDustyRose },
      { v: '', s: standardTheme.headerDustyRose },
      { v: '', s: standardTheme.headerDustyRose },
      { v: '', s: standardTheme.headerDustyRose }
    ];
    wsData.push(prodRow);
    currentRowIdx++;

    // COLUMN HEADERS (Richer Dusty Rose)
    const headerRow: any[] = [
      { v: 'S.NO.', s: standardTheme.headerDustyRose },
      { v: 'DR NAME', s: standardTheme.headerDustyRose },
      { v: 'HQ', s: standardTheme.headerDustyRose },
      { v: 'SPECIALITY', s: standardTheme.headerDustyRose },
      { v: 'ACTIVITY DONE/NOT', s: standardTheme.headerDustyRose },
      { v: 'PRESCRIBER/NON PRESCRIBER', s: standardTheme.headerDustyRose },
      { v: 'NO. OF PRESCRIPTION/MONTH', s: standardTheme.headerDustyRose }
    ];
    wsData.push(headerRow);
    currentRowIdx++;

    // DOCTOR ROWS
    (sec.rows || []).forEach((row: any) => {
      wsData.push([
        { v: row.sn || '', s: standardTheme.cellCenter },
        { v: row.drName || '', s: standardTheme.cellLeft },
        { v: row.hq || 'UDAIPUR', s: standardTheme.cellCenter },
        { v: row.speciality || '', s: standardTheme.cellCenter },
        { v: row.activityDone || '', s: standardTheme.cellCenter },
        { v: row.prescriberStatus || '', s: standardTheme.cellCenter },
        { v: row.rxPerMonth || '', s: standardTheme.cellCenter }
      ]);
      currentRowIdx++;
    });
  });

  return {
    wsData,
    sheetName: '9_TABLE TOP',
    merges,
    // 🌟 Col 0 को 16 विड्थ दी गई है ताकि "PRODUCT NAME" कभी न कटे!
    cols: [
      { wch: 16 }, // Col A: S.NO. & PRODUCT NAME (Fully fits without clipping!)
      { wch: 24 }, // Col B: DR NAME & LINAGET/VINTEL
      { wch: 12 }, // Col C: HQ
      { wch: 16 }, // Col D: SPECIALITY
      { wch: 22 }, // Col E: ACTIVITY DONE/NOT
      { wch: 28 }, // Col F: PRESCRIBER/NON PRESCRIBER
      { wch: 28 }  // Col G: NO. OF PRESCRIPTION/MONTH
    ]
  };
}
