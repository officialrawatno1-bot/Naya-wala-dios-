import { standardTheme, borderThin } from '../styles/standardTheme';
import { memoryStore } from '../../data/memoryStore';

const INITIAL_PRODS = [
  { sn: 1, name: 'VINTEL', rate: 1, janMar: 3246, apr: 1605, may: 1498, jun: 1920, q1: 5023, g1: 54.74, minReq: 3733, inc1: 5023 },
  { sn: 2, name: 'VINVES', rate: 2, janMar: 0, apr: 0, may: 0, jun: 0, q1: 0, g1: '', minReq: 0, inc1: 0 },
  { sn: 3, name: 'LINAGET', rate: 1.5, janMar: 264, apr: 24, may: 84, jun: 75, q1: 183, g1: -30.68, minReq: 304, inc1: 274.5 },
  { sn: 4, name: 'VALROS', rate: 1.5, janMar: 817, apr: 126, may: 430, jun: 424, q1: 980, g1: 19.95, minReq: 940, inc1: 1470 },
  { sn: 5, name: 'DOSGLT', rate: 1.75, janMar: 1, apr: -1, may: 65, jun: 0, q1: 64, g1: 6300.00, minReq: 1, inc1: 112 }
];

const INITIAL_SPECIAL = [
  { sn: 1, name: 'CONVERSION SI', amt: 1000, criteria: 'MINIMUM 3 DrS/MONTH', apr: '', may: '', jun: '', tot: 0 },
  { sn: 2, name: 'CAMP SI', amt: 1000, criteria: 'MINIMUM 5 Prescription in camp', apr: '', may: '', jun: '', tot: 0 },
  { sn: 3, name: 'WCFYH SI', amt: 1000, criteria: 'EVERY CONVERSION(as per campaign enrolled)', apr: '', may: '', jun: '', tot: 0 }
];

export function buildSheet16_ProductIncentive(data?: any) {
  const beName = data?.beName || memoryStore.beName || 'BANWARI LAL MEENA';
  const hqName = data?.hqName || memoryStore.hqName || 'UDAIPUR';
  const products = data?.products && Array.isArray(data.products) && data.products.length > 0 ? data.products : INITIAL_PRODS;
  const specialList = data?.specialList && Array.isArray(data.specialList) && data.specialList.length > 0 ? data.specialList : INITIAL_SPECIAL;

  const wsData: any[][] = [];
  const merges: any[] = [];

  const stylePeach = {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'F8CBAD' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderThin
  };

  const styleYellowInc = {
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '000000' } },
    fill: { fgColor: { rgb: 'FFFF00' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderThin
  };

  // ==========================================
  // ROW 1: HQ & BE NAME (Solid Red Banner Header)
  // ==========================================
  const r1: any[] = [
    { v: 'HQ', s: standardTheme.headerRedYellowText },
    { v: hqName, s: standardTheme.cellCenterBold },
    { v: 'BE NAME', s: standardTheme.headerRedYellowText },
    { v: beName, s: standardTheme.cellLeft }
  ];
  for (let c = 4; c < 26; c++) r1.push({ v: '', s: {} });
  wsData.push(r1);

  // ==========================================
  // ROW 2: PRIMARY IN STRIPS Banner (Cols E to Y)
  // ==========================================
  const r2: any[] = [
    { v: '', s: standardTheme.headerSilverGrey },
    { v: '', s: standardTheme.headerSilverGrey },
    { v: '', s: standardTheme.headerSilverGrey },
    { v: '', s: standardTheme.headerSilverGrey },
    { v: 'PRIMARY IN STRIPS', s: standardTheme.bannerMagentaCyanText }
  ];
  for (let c = 5; c < 26; c++) r2.push({ v: '', s: standardTheme.bannerMagentaCyanText });
  wsData.push(r2);
  merges.push({ s: { r: 1, c: 4 }, e: { r: 1, c: 25 } });

  // ==========================================
  // ROW 3: Column Headers (Table 1)
  // ==========================================
  const r3: any[] = [
    { v: 'S.NO.', s: standardTheme.headerSilverGrey },
    { v: 'PRODUCT NAME', s: standardTheme.headerSilverGreyLeft },
    { v: 'INCENTIVE/STRIP\n( Rs.)', s: standardTheme.headerSilverGrey },
    { v: 'JAN TO MARCH PRIMARY SALE', s: standardTheme.headerSkyBlue },
    { v: 'APRIL', s: standardTheme.headerHotPink },
    { v: 'MAY', s: standardTheme.headerHotPink },
    { v: 'JUNE', s: standardTheme.headerHotPink },
    { v: 'QTR SALE', s: standardTheme.headerHotPink },
    { v: '%GROWTH\nOVER\nLAST QTR', s: standardTheme.headerGrowthYellow },
    { v: 'MINIMUM\nSTRIPS\nREQUIRED\nFOR\nELIGIBILITY', s: stylePeach },
    { v: 'INCENTIVE\nAMOUNT', s: styleYellowInc },
    { v: 'JULY', s: standardTheme.headerHotPink },
    { v: 'AUG', s: standardTheme.headerHotPink },
    { v: 'SEP', s: standardTheme.headerHotPink },
    { v: 'QTR SALE', s: standardTheme.headerHotPink },
    { v: 'GROWTH\nOVER LAST\nQTR', s: standardTheme.headerGrowthYellow },
    { v: 'OCT', s: standardTheme.headerHotPink },
    { v: 'NOV', s: standardTheme.headerHotPink },
    { v: 'DEC', s: standardTheme.headerHotPink },
    { v: 'QTR SALE', s: standardTheme.headerHotPink },
    { v: 'GROWTH\nOVER LAST\nQTR', s: standardTheme.headerGrowthYellow },
    { v: 'JAN', s: standardTheme.headerHotPink },
    { v: 'FEB', s: standardTheme.headerHotPink },
    { v: 'MAR', s: standardTheme.headerHotPink },
    { v: 'QTR SALE', s: standardTheme.headerHotPink },
    { v: 'GROWTH\nOVER LAST\nQTR', s: standardTheme.headerGrowthYellow }
  ];
  wsData.push(r3);

  // ROWS 4 to 8: 5 Focus Products Data
  products.forEach((p: any) => {
    const parseNum = (v: any) => parseFloat(String(v || '0').replace(/,/g, '')) || 0;
    const base = parseNum(p.janToMar || p.janMar);
    const apr = parseNum(p.apr);
    const may = parseNum(p.may);
    const jun = parseNum(p.jun);
    const q1 = apr + may + jun;
    const g1 = base > 0 ? ((q1 - base) / base * 100).toFixed(2) : '#DIV/0!';
    const minReq = Math.round(base * 1.15);
    const rate = parseFloat(p.ratePerStrip || p.rate) || 1;
    const incAmt = q1 * rate;

    wsData.push([
      { v: p.sn, s: standardTheme.cellCenter },
      { v: p.name, s: standardTheme.cellLeft },
      { v: rate, s: standardTheme.cellCenterBold },
      { v: base, s: standardTheme.cellCenterBold },
      { v: apr || 0, s: standardTheme.cellCenter },
      { v: may || 0, s: standardTheme.cellCenter },
      { v: jun || 0, s: standardTheme.cellCenter },
      { v: q1, s: standardTheme.cellCenterBold },
      { v: g1, s: standardTheme.cellCenter },
      { v: minReq, s: stylePeach },
      { v: incAmt > 0 ? incAmt : 0, s: standardTheme.cellCenterBold },
      { v: p.jul || '', s: standardTheme.cellCenter },
      { v: p.aug || '', s: standardTheme.cellCenter },
      { v: p.sept || p.sep || '', s: standardTheme.cellCenter },
      { v: 0, s: standardTheme.cellCenter },
      { v: -100, s: standardTheme.cellCenter },
      { v: p.oct || '', s: standardTheme.cellCenter },
      { v: p.nov || '', s: standardTheme.cellCenter },
      { v: p.dec || '', s: standardTheme.cellCenter },
      { v: 0, s: standardTheme.cellCenter },
      { v: -100, s: standardTheme.cellCenter },
      { v: p.jan || '', s: standardTheme.cellCenter },
      { v: p.feb || '', s: standardTheme.cellCenter },
      { v: p.mar || '', s: standardTheme.cellCenter },
      { v: 0, s: standardTheme.cellCenter },
      { v: -100, s: standardTheme.cellCenter }
    ]);
  });

  // Empty Spacers (Rows 9 & 10)
  wsData.push(new Array(26).fill({ v: '', s: {} }));
  wsData.push(new Array(26).fill({ v: '', s: {} }));

  // ==========================================
  // ROW 11: SPECIAL INCENTIVE Banner
  // ==========================================
  const r11: any[] = [
    { v: 'SPECIAL INCENTIVE', s: standardTheme.headerSilverGreyLeft },
    { v: '', s: standardTheme.headerSilverGrey },
    { v: '', s: standardTheme.headerSilverGrey },
    { v: '', s: standardTheme.headerSilverGrey },
    { v: 'No. of conversion or prescription', s: standardTheme.headerHotPink },
    { v: '', s: standardTheme.headerHotPink },
    { v: '', s: standardTheme.headerHotPink },
    { v: 'INCENTIVE AMOUNT EARNED', s: standardTheme.bannerMagentaCyanText }
  ];
  for (let c = 8; c < 26; c++) r11.push({ v: '', s: standardTheme.bannerMagentaCyanText });
  wsData.push(r11);
  merges.push({ s: { r: 10, c: 0 }, e: { r: 10, c: 3 } }); // Merge A11:D11
  merges.push({ s: { r: 10, c: 4 }, e: { r: 10, c: 6 } }); // Merge E11:G11
  merges.push({ s: { r: 10, c: 7 }, e: { r: 10, c: 25 } }); // Merge H11:Z11

  // ==========================================
  // ROW 12: Column Headers (Table 2)
  // ==========================================
  const r12: any[] = [
    { v: 'S.NO.', s: standardTheme.headerSilverGrey },
    { v: 'NAME OF SI', s: standardTheme.headerSilverGreyLeft },
    { v: 'AMOUNT OF\nINCENTIVE IN Rs.', s: standardTheme.headerSilverGrey },
    { v: 'CRITERIA', s: standardTheme.headerSilverGreyLeft },
    { v: 'APRIL', s: standardTheme.headerHotPink },
    { v: 'MAY', s: standardTheme.headerHotPink },
    { v: 'JUNE', s: standardTheme.headerHotPink },
    { v: 'APRIL', s: standardTheme.headerGrowthYellow },
    { v: 'MAY', s: standardTheme.headerGrowthYellow },
    { v: 'JUNE', s: standardTheme.headerGrowthYellow },
    { v: 'TOTAL\nINCENTIVE\nEARNED', s: standardTheme.headerGrowthYellow },
    { v: 'AUG', s: standardTheme.headerHotPink },
    { v: 'SEP', s: standardTheme.headerHotPink },
    { v: 'QTR SALE', s: standardTheme.headerHotPink },
    { v: 'GROWTH\nOVER LAST\nQTR', s: standardTheme.headerGrowthYellow },
    { v: 'OCT', s: standardTheme.headerHotPink },
    { v: 'NOV', s: standardTheme.headerHotPink },
    { v: 'DEC', s: standardTheme.headerHotPink },
    { v: 'QTR SALE', s: standardTheme.headerHotPink },
    { v: 'GROWTH\nOVER LAST\nQTR', s: standardTheme.headerGrowthYellow },
    { v: 'JAN', s: standardTheme.headerHotPink },
    { v: 'FEB', s: standardTheme.headerHotPink },
    { v: 'MAR', s: standardTheme.headerHotPink },
    { v: 'QTR SALE', s: standardTheme.headerHotPink },
    { v: 'GROWTH\nOVER LAST\nQTR', s: standardTheme.headerGrowthYellow },
    { v: 'TOTAL IN QTR', s: standardTheme.headerGrowthYellow }
  ];
  wsData.push(r12);

  // ROWS 13 to 15: 3 Special Incentive Rows
  specialList.forEach((s: any) => {
    const parseNum = (v: any) => parseFloat(String(v || '0').replace(/,/g, '')) || 0;
    const rate = parseFloat(s.amountPerUnit || s.amt) || 1000;
    const c1 = parseNum(s.aprCount || s.apr);
    const c2 = parseNum(s.mayCount || s.may);
    const c3 = parseNum(s.junCount || s.jun);
    const e1 = c1 * rate;
    const e2 = c2 * rate;
    const e3 = c3 * rate;
    const totE = e1 + e2 + e3;

    wsData.push([
      { v: s.sn, s: standardTheme.cellCenter },
      { v: s.name, s: standardTheme.cellLeft },
      { v: rate, s: standardTheme.cellCenterBold },
      { v: s.criteria, s: standardTheme.cellLeft },
      { v: c1 || '', s: standardTheme.cellCenter },
      { v: c2 || '', s: standardTheme.cellCenter },
      { v: c3 || '', s: standardTheme.cellCenter },
      { v: e1 || 0, s: standardTheme.cellCenter },
      { v: e2 || 0, s: standardTheme.cellCenter },
      { v: e3 || 0, s: standardTheme.cellCenter },
      { v: totE || 0, s: standardTheme.cellCenterBold },
      { v: '', s: standardTheme.cellCenter },
      { v: '', s: standardTheme.cellCenter },
      { v: 0, s: standardTheme.cellCenter },
      { v: '#DIV/0!', s: standardTheme.cellCenter },
      { v: '', s: standardTheme.cellCenter },
      { v: '', s: standardTheme.cellCenter },
      { v: '', s: standardTheme.cellCenter },
      { v: 0, s: standardTheme.cellCenter },
      { v: '#DIV/0!', s: standardTheme.cellCenter },
      { v: '', s: standardTheme.cellCenter },
      { v: '', s: standardTheme.cellCenter },
      { v: '', s: standardTheme.cellCenter },
      { v: 0, s: standardTheme.cellCenter },
      { v: '#DIV/0!', s: standardTheme.cellCenter },
      { v: totE || 0, s: standardTheme.cellCenterBold }
    ]);
  });

  return {
    wsData,
    sheetName: '16_PRODUCT INCENTIVE',
    merges,
    cols: [
      { wch: 6 },  // S.NO.
      { wch: 20 }, // PRODUCT NAME / NAME OF SI
      { wch: 16 }, // INCENTIVE/STRIP
      { wch: 26 }, // JAN TO MARCH PRIMARY SALE / CRITERIA
      { wch: 9 },  { wch: 9 },  { wch: 9 },  // Apr, May, Jun
      { wch: 12 }, // QTR SALE
      { wch: 14 }, // %GROWTH OVER LAST QTR
      { wch: 18 }, // MINIMUM STRIPS REQUIRED
      { wch: 14 }, // INCENTIVE AMOUNT
      { wch: 9 },  { wch: 9 },  { wch: 9 },  // Jul, Aug, Sep
      { wch: 12 }, { wch: 14 }, // QTR SALE, GROWTH
      { wch: 9 },  { wch: 9 },  { wch: 9 },  // Oct, Nov, Dec
      { wch: 12 }, { wch: 14 }, // QTR SALE, GROWTH
      { wch: 9 },  { wch: 9 },  { wch: 9 },  // Jan, Feb, Mar
      { wch: 12 }, { wch: 14 }  // QTR SALE, GROWTH
    ],
    rows: [
      { hpt: 22 }, // Row 1: HQ & BE NAME
      { hpt: 26 }, // Row 2: Banner
      { hpt: 38 }, // Row 3: Headers (Wrapped)
      { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, // 5 Focus products
      { hpt: 16 }, { hpt: 16 }, // Spacers
      { hpt: 26 }, // Row 11: Special Inc Banner
      { hpt: 38 }, // Row 12: Headers 2
      { hpt: 22 }, { hpt: 22 }, { hpt: 22 } // 3 Special Inc rows
    ]
  };
}
