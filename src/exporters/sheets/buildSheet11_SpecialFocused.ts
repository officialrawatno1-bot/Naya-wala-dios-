import { standardTheme, borderThin } from '../styles/standardTheme';

const INITIAL_PRIMARY_ROWS = [
  { sn: 1, name: 'VINTEL', janMar: 3246, apr: 1650, may: 1498, jun: 2195, q1: 5343, g1: '64.6025878', jul: '', aug: '', sep: '', q2: 0, g2: -100, oct: '', nov: '', dec: '', q3: 0, g3: -100, jan: '', feb: '', mar: '', q4: 0, g4: -100 },
  { sn: 2, name: 'VINVES', janMar: '', apr: '', may: '', jun: '', q1: 0, g1: '', jul: '', aug: '', sep: '', q2: 0, g2: '', oct: '', nov: '', dec: '', q3: 0, g3: '', jan: '', feb: '', mar: '', q4: 0, g4: '' },
  { sn: 3, name: 'LINAGET', janMar: 214, apr: 62, may: 84, jun: 96, q1: 242, g1: '13.08411215', jul: '', aug: '', sep: '', q2: 0, g2: -100, oct: '', nov: '', dec: '', q3: 0, g3: -100, jan: '', feb: '', mar: '', q4: 0, g4: -100 },
  { sn: 4, name: 'VALROS', janMar: 817, apr: 352, may: 430, jun: 445, q1: 1227, g1: '50.18359853', jul: '', aug: '', sep: '', q2: 0, g2: -100, oct: '', nov: '', dec: '', q3: 0, g3: -100, jan: '', feb: '', mar: '', q4: 0, g4: -100 },
  { sn: 5, name: 'DIOSGLT', janMar: '', apr: '', may: 65, jun: '', q1: 65, g1: '', jul: '', aug: '', sep: '', q2: 0, g2: '', oct: '', nov: '', dec: '', q3: 0, g3: '', jan: '', feb: '', mar: '', q4: 0, g4: '' }
];

const INITIAL_SECONDARY_ROWS = [
  { sn: 1, name: 'VINTEL', janMar: 4819, apr: 2023, may: 1709, jun: 1717, q1: 5449, g1: '13.07325171', jul: '', aug: '', sep: '', q2: 0, g2: -100, oct: '', nov: '', dec: '', q3: 0, g3: -100, jan: '', feb: '', mar: '', q4: 0, g4: -100 },
  { sn: 2, name: 'VINVES', janMar: 21, apr: 2, may: '', jun: '', q1: 2, g1: '-90.47619048', jul: '', aug: '', sep: '', q2: 0, g2: -100, oct: '', nov: '', dec: '', q3: 0, g3: -100, jan: '', feb: '', mar: '', q4: 0, g4: -100 },
  { sn: 3, name: 'LINAGET', janMar: 390, apr: 153, may: 130, jun: 186, q1: 469, g1: '20.25641026', jul: '', aug: '', sep: '', q2: 0, g2: -100, oct: '', nov: '', dec: '', q3: 0, g3: -100, jan: '', feb: '', mar: '', q4: 0, g4: -100 },
  { sn: 4, name: 'VALROS', janMar: 1234, apr: 509, may: 361, jun: 502, q1: 1372, g1: '11.18314425', jul: '', aug: '', sep: '', q2: 0, g2: -100, oct: '', nov: '', dec: '', q3: 0, g3: -100, jan: '', feb: '', mar: '', q4: 0, g4: -100 },
  { sn: 5, name: 'DIOSGLT', janMar: 71, apr: 8, may: 39, jun: 15, q1: 62, g1: '-12.67605634', jul: '', aug: '', sep: '', q2: 0, g2: -100, oct: '', nov: '', dec: '', q3: 0, g3: -100, jan: '', feb: '', mar: '', q4: 0, g4: -100 }
];

export function buildSheet11_SpecialFocused(data?: any) {
  const priRows = data?.primaryRows && Array.isArray(data.primaryRows) && data.primaryRows.length > 0 ? data.primaryRows : INITIAL_PRIMARY_ROWS;
  const secRows = data?.secondaryRows && Array.isArray(data.secondaryRows) && data.secondaryRows.length > 0 ? data.secondaryRows : INITIAL_SECONDARY_ROWS;

  const wsData: any[][] = [];
  const merges: any[] = [];

  // ==========================================
  // ROW 1: HQ Cell (Red Bg + Yellow Text)
  // ==========================================
  const r1: any[] = [
    { v: 'HQ', s: standardTheme.headerRedYellowText },
    { v: '', s: {} }, { v: '', s: {} }
  ];
  for (let c = 3; c < 23; c++) r1.push({ v: '', s: {} });
  wsData.push(r1);

  // Helper to build a Section Header Row
  function appendSectionHeaders(sectionTitle: string, bannerRowIdx: number) {
    // Row A: Silver grey for Col A, B, C | Hot Magenta Pink + Cyan Font for Cols D to W
    const bannerRow: any[] = [
      { v: '', s: standardTheme.headerSilverGrey },
      { v: '', s: standardTheme.headerSilverGrey },
      { v: '', s: standardTheme.headerSilverGrey },
      { v: sectionTitle, s: standardTheme.bannerMagentaCyanText } // 💖 Hot Pink + 💙 Cyan Text
    ];
    for (let c = 4; c < 23; c++) {
      bannerRow.push({ v: '', s: standardTheme.bannerMagentaCyanText });
    }
    wsData.push(bannerRow);
    merges.push({ s: { r: bannerRowIdx, c: 3 }, e: { r: bannerRowIdx, c: 22 } }); // Merge D to W

    // Row B: Column Headers
    const headRow: any[] = [
      { v: 'S.NO.', s: standardTheme.headerSilverGrey },
      { v: 'PRODUCT NAME', s: standardTheme.headerSilverGreyLeft },
      { v: 'JAN TO MARCH PRIMARY SALE', s: standardTheme.headerSkyBlue }, // 🔵 Soft Sky Blue
      { v: 'APRIL', s: standardTheme.headerHotPink },
      { v: 'MAY', s: standardTheme.headerHotPink },
      { v: 'JUNE', s: standardTheme.headerHotPink },
      { v: 'QTR SALE', s: standardTheme.headerHotPink },
      { v: '%GROWTH\nOVER LAST\nQTR', s: standardTheme.headerGrowthYellow }, // 🟡 Bright Yellow
      { v: 'JULY', s: standardTheme.headerHotPink },
      { v: 'AUG', s: standardTheme.headerHotPink },
      { v: 'SEP', s: standardTheme.headerHotPink },
      { v: 'QTR SALE', s: standardTheme.headerHotPink },
      { v: 'GROWTH\nOVER LAST\nQTR', s: standardTheme.headerGrowthYellow },  // 🟡 Bright Yellow
      { v: 'OCT', s: standardTheme.headerHotPink },
      { v: 'NOV', s: standardTheme.headerHotPink },
      { v: 'DEC', s: standardTheme.headerHotPink },
      { v: 'QTR SALE', s: standardTheme.headerHotPink },
      { v: 'GROWTH\nOVER LAST\nQTR', s: standardTheme.headerGrowthYellow },  // 🟡 Bright Yellow
      { v: 'JAN', s: standardTheme.headerHotPink },
      { v: 'FEB', s: standardTheme.headerHotPink },
      { v: 'MAR', s: standardTheme.headerHotPink },
      { v: 'QTR SALE', s: standardTheme.headerHotPink },
      { v: 'GROWTH\nOVER LAST\nQTR', s: standardTheme.headerGrowthYellow }   // 🟡 Bright Yellow
    ];
    wsData.push(headRow);
  }

  // ==========================================
  // SECTION 1: PRIMARY IN STRIPS (Rows 2 to 8)
  // ==========================================
  appendSectionHeaders('PRIMARY IN STRIPS', 1);

  priRows.forEach((r: any) => {
    wsData.push([
      { v: r.sn || '', s: standardTheme.cellCenter },
      { v: r.name || '', s: standardTheme.cellLeft },
      { v: r.janMar !== undefined && r.janMar !== '' ? Number(r.janMar) : '', s: standardTheme.cellCenterBold }, // 🌟 Bold Col C
      { v: r.apr !== undefined && r.apr !== '' ? Number(r.apr) : '', s: standardTheme.cellCenter },
      { v: r.may !== undefined && r.may !== '' ? Number(r.may) : '', s: standardTheme.cellCenter },
      { v: r.jun !== undefined && r.jun !== '' ? Number(r.jun) : '', s: standardTheme.cellCenter },
      { v: r.q1 !== undefined && r.q1 !== '' ? Number(r.q1) : '', s: standardTheme.cellCenter },
      { v: r.g1 !== undefined && r.g1 !== '' ? r.g1 : '', s: standardTheme.cellCenter },
      { v: r.jul !== undefined && r.jul !== '' ? Number(r.jul) : '', s: standardTheme.cellCenter },
      { v: r.aug !== undefined && r.aug !== '' ? Number(r.aug) : '', s: standardTheme.cellCenter },
      { v: r.sep !== undefined && r.sep !== '' ? Number(r.sep) : '', s: standardTheme.cellCenter },
      { v: r.q2 !== undefined && r.q2 !== '' ? Number(r.q2) : '', s: standardTheme.cellCenter },
      { v: r.g2 !== undefined && r.g2 !== '' ? r.g2 : '', s: standardTheme.cellCenter },
      { v: r.oct !== undefined && r.oct !== '' ? Number(r.oct) : '', s: standardTheme.cellCenter },
      { v: r.nov !== undefined && r.nov !== '' ? Number(r.nov) : '', s: standardTheme.cellCenter },
      { v: r.dec !== undefined && r.dec !== '' ? Number(r.dec) : '', s: standardTheme.cellCenter },
      { v: r.q3 !== undefined && r.q3 !== '' ? Number(r.q3) : '', s: standardTheme.cellCenter },
      { v: r.g3 !== undefined && r.g3 !== '' ? r.g3 : '', s: standardTheme.cellCenter },
      { v: r.jan !== undefined && r.jan !== '' ? Number(r.jan) : '', s: standardTheme.cellCenter },
      { v: r.feb !== undefined && r.feb !== '' ? Number(r.feb) : '', s: standardTheme.cellCenter },
      { v: r.mar !== undefined && r.mar !== '' ? Number(r.mar) : '', s: standardTheme.cellCenter },
      { v: r.q4 !== undefined && r.q4 !== '' ? Number(r.q4) : '', s: standardTheme.cellCenter },
      { v: r.g4 !== undefined && r.g4 !== '' ? r.g4 : '', s: standardTheme.cellCenter }
    ]);
  });

  // Empty Spacers (Row 9)
  wsData.push(new Array(23).fill({ v: '', s: {} }));

  // ==========================================
  // SECTION 2: SECONDARY IN STRIPS (Rows 10 to 16)
  // ==========================================
  appendSectionHeaders('SECONDARY IN STRIPS', 9);

  secRows.forEach((r: any) => {
    wsData.push([
      { v: r.sn || '', s: standardTheme.cellCenter },
      { v: r.name || '', s: standardTheme.cellLeft },
      { v: r.janMar !== undefined && r.janMar !== '' ? Number(r.janMar) : '', s: standardTheme.cellCenterBold }, // 🌟 Bold Col C
      { v: r.apr !== undefined && r.apr !== '' ? Number(r.apr) : '', s: standardTheme.cellCenter },
      { v: r.may !== undefined && r.may !== '' ? Number(r.may) : '', s: standardTheme.cellCenter },
      { v: r.jun !== undefined && r.jun !== '' ? Number(r.jun) : '', s: standardTheme.cellCenter },
      { v: r.q1 !== undefined && r.q1 !== '' ? Number(r.q1) : '', s: standardTheme.cellCenter },
      { v: r.g1 !== undefined && r.g1 !== '' ? r.g1 : '', s: standardTheme.cellCenter },
      { v: r.jul !== undefined && r.jul !== '' ? Number(r.jul) : '', s: standardTheme.cellCenter },
      { v: r.aug !== undefined && r.aug !== '' ? Number(r.aug) : '', s: standardTheme.cellCenter },
      { v: r.sep !== undefined && r.sep !== '' ? Number(r.sep) : '', s: standardTheme.cellCenter },
      { v: r.q2 !== undefined && r.q2 !== '' ? Number(r.q2) : '', s: standardTheme.cellCenter },
      { v: r.g2 !== undefined && r.g2 !== '' ? r.g2 : '', s: standardTheme.cellCenter },
      { v: r.oct !== undefined && r.oct !== '' ? Number(r.oct) : '', s: standardTheme.cellCenter },
      { v: r.nov !== undefined && r.nov !== '' ? Number(r.nov) : '', s: standardTheme.cellCenter },
      { v: r.dec !== undefined && r.dec !== '' ? Number(r.dec) : '', s: standardTheme.cellCenter },
      { v: r.q3 !== undefined && r.q3 !== '' ? Number(r.q3) : '', s: standardTheme.cellCenter },
      { v: r.g3 !== undefined && r.g3 !== '' ? r.g3 : '', s: standardTheme.cellCenter },
      { v: r.jan !== undefined && r.jan !== '' ? Number(r.jan) : '', s: standardTheme.cellCenter },
      { v: r.feb !== undefined && r.feb !== '' ? Number(r.feb) : '', s: standardTheme.cellCenter },
      { v: r.mar !== undefined && r.mar !== '' ? Number(r.mar) : '', s: standardTheme.cellCenter },
      { v: r.q4 !== undefined && r.q4 !== '' ? Number(r.q4) : '', s: standardTheme.cellCenter },
      { v: r.g4 !== undefined && r.g4 !== '' ? r.g4 : '', s: standardTheme.cellCenter }
    ]);
  });

  return {
    wsData,
    sheetName: '11_SPECIAL FOCUSED',
    merges,
    cols: [
      { wch: 6 },  // S.NO.
      { wch: 16 }, // PRODUCT NAME
      { wch: 28 }, // JAN TO MARCH PRIMARY SALE (Fits 100%!)
      { wch: 8 },  { wch: 8 },  { wch: 8 },  // Q1 Months
      { wch: 10 }, // QTR SALE
      { wch: 14 }, // %GROWTH OVER LAST QTR (Yellow)
      { wch: 8 },  { wch: 8 },  { wch: 8 },  // Q2 Months
      { wch: 10 }, // QTR SALE
      { wch: 14 }, // GROWTH OVER LAST QTR (Yellow)
      { wch: 8 },  { wch: 8 },  { wch: 8 },  // Q3 Months
      { wch: 10 }, // QTR SALE
      { wch: 14 }, // GROWTH OVER LAST QTR (Yellow)
      { wch: 8 },  { wch: 8 },  { wch: 8 },  // Q4 Months
      { wch: 10 }, // QTR SALE
      { wch: 14 }  // GROWTH OVER LAST QTR (Yellow)
    ],
    rows: [
      { hpt: 20 }, // Row 1: HQ
      { hpt: 26 }, // Row 2: Banner 1 (PRIMARY IN STRIPS)
      { hpt: 38 }, // Row 3: Column Headers (3-line wrap for growth)
      { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, // Data 1
      { hpt: 18 }, // Spacer
      { hpt: 26 }, // Row 10: Banner 2 (SECONDARY IN STRIPS)
      { hpt: 38 }  // Row 11: Column Headers 2
    ]
  };
}
