import { standardTheme, borderThin } from '../styles/standardTheme';
import { memoryStore } from '../../data/memoryStore';

const INITIAL_SUPPORT_DOCTORS = [
  { sn: '1', hq: 'UDAIPUR', drName: 'JIMESH PANDYA', typeOfSupport: 'GIFT CARDS', amount: '30000', expectedRoi: '15000' },
  { isBlank: true },
  { sn: '3', hq: 'UDAIPUR', drName: 'VIJAY GOYAL', typeOfSupport: 'GIFT CARDS', amount: '10000', expectedRoi: '10000' },
  { sn: '4', hq: 'UDAIPUR', drName: 'JAYESH GANDHI', typeOfSupport: 'SPECIAL PLAN', amount: 'NOT DECIDED', expectedRoi: '50000' },
  { isBlank: true },
  { sn: '6', hq: 'UDAIPUR', drName: 'AK VATS', typeOfSupport: 'GIFT CARDS', amount: '30000', expectedRoi: '15000' },
  { sn: '7', hq: 'UDAIPUR', drName: 'SANDEEP BHATNAGAR', typeOfSupport: 'GIFT CARDS', amount: '30000', expectedRoi: '150000' },
  { sn: '8', hq: 'UDAIPUR', drName: 'RK MALOT', typeOfSupport: 'GIFT CARDS', amount: '40000,', expectedRoi: '20000' },
  { isBlank: true },
  { sn: '10', hq: 'UDAIPUR', drName: 'BS BOMB', typeOfSupport: 'GIFT CARDS(VINTEL OR OTHER', amount: '30000+20000', expectedRoi: '30000' },
  { sn: '11', hq: 'UDAIPUR', drName: 'RAHUL PANCHAL', typeOfSupport: 'GIFT CARDS', amount: '30000', expectedRoi: '15000' },
  { sn: '12', hq: 'UDAIPUR', drName: 'KC JAIN', typeOfSupport: 'SPECIAL PLAN', amount: '20000', expectedRoi: '' },
  { sn: '13', hq: 'UDAIPUR', drName: 'DP SINGH', typeOfSupport: 'GIFT CARDS', amount: '30000', expectedRoi: '15000' },
  { isBlank: true },
  { sn: '15', hq: 'UDAIPUR', drName: 'JC DEVPURA', typeOfSupport: 'GIFT CARDS', amount: '10000', expectedRoi: '10000' },
  { sn: '16', hq: 'UDAIPUR', drName: 'BALDEV MEENA', typeOfSupport: 'TREAD MIL', amount: '85000', expectedRoi: '' },
  { sn: '17', hq: 'UDAIPUR', drName: 'KRIPA SHANKAR', typeOfSupport: 'GIFT CARDS', amount: '20000', expectedRoi: '10000' },
];

export function buildSheet06_Commitment(data?: any) {
  const topData = data?.commitmentData || memoryStore.commitmentTopData || {
    prevBudget: '4.83', prevAch: '4.84', currSec: '4.85', currInventory: '7.01', currBudget: '4.83', commitmentVal: '5.5'
  };
  const doctorsList = data?.doctorsRows || (memoryStore.commitmentDoctors && memoryStore.commitmentDoctors.length > 0 ? memoryStore.commitmentDoctors : INITIAL_SUPPORT_DOCTORS);
  const monthlyCA = data?.monthlyCA || memoryStore.commitmentMonthlyCA || {
    APR: { commitment: '4.34', achievement: '4.34' },
    MAY: { commitment: '4.55', achievement: '4.74' },
    JUN: { commitment: '4.89', achievement: '5.07' },
    JUL: { commitment: '', achievement: '' },
    AUG: { commitment: '', achievement: '' },
    SEP: { commitment: '', achievement: '' },
    OCT: { commitment: '', achievement: '' },
    NOV: { commitment: '', achievement: '' },
    DEC: { commitment: '', achievement: '' },
    JAN: { commitment: '', achievement: '' },
    FEB: { commitment: '', achievement: '' },
    MAR: { commitment: '', achievement: '' },
  };

  const wsData: any[][] = [];
  const merges: any[] = [];

  // ==========================================
  // SECTION 1: TOP SUMMARY (Rows 1 to 3)
  // ==========================================
  // Row 1: COMMITMENT OF MONTH (Merged Col A to H, Yellow)
  const r1: any[] = [{ v: 'COMMITMENT OF MONTH', s: standardTheme.headerYellowCenterBold }];
  for (let c = 1; c < 8; c++) r1.push({ v: '', s: standardTheme.headerYellowCenterBold });
  for (let c = 8; c < 15; c++) r1.push({ v: '', s: {} });
  wsData.push(r1);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } });

  // Row 2: Top Headers (All with wrapText: true so no clipping occurs!)
  wsData.push([
    { v: 'S.N.', s: standardTheme.colHeaderWrapped },
    { v: 'H.Q. NAME', s: standardTheme.colHeaderWrapped },
    { v: 'PREVIOUS MONTH\nBUDGET', s: standardTheme.colHeaderWrapped },
    { v: 'PREVIOUS MONTH\nACHIV.', s: standardTheme.colHeaderWrapped },
    { v: 'CURRENT\nSECONDARY', s: standardTheme.colHeaderWrapped },
    { v: 'CURRENT\nINVENTORY', s: standardTheme.colHeaderWrapped },
    { v: 'CURRENT MONTH\nBUDGET', s: standardTheme.colHeaderWrapped },
    { v: 'COMMITMENT', s: standardTheme.colHeaderWrapped },
    { v: '', s: {} }, // Col H gap
    { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }
  ]);

  // Row 3: Top Values
  wsData.push([
    { v: 1, s: standardTheme.cellCenter },
    { v: 'UDAIPUR', s: standardTheme.cellCenter },
    { v: topData.prevBudget || '4.83', s: standardTheme.cellCenter },
    { v: topData.prevAch || '4.84', s: standardTheme.cellCenter },
    { v: topData.currSec || '4.85', s: standardTheme.cellCenter },
    { v: topData.currInventory || '7.01', s: standardTheme.cellCenter },
    { v: topData.currBudget || '4.83', s: standardTheme.cellCenter },
    { v: topData.commitmentVal || '5.5', s: standardTheme.cellCenter },
    { v: '', s: {} },
    { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }
  ]);

  // Rows 4 & 5: Spacers
  wsData.push(new Array(15).fill({ v: '', s: {} }));
  wsData.push(new Array(15).fill({ v: '', s: {} }));

  // ==========================================
  // SECTION 2: DUAL LAYOUT (LEFT SUPPORT + RIGHT QUARTERS)
  // ==========================================
  // Row 6 (Index 5):
  // Left: SUPPORT REQUIRE (Cols A to F merged, Yellow)
  // Col G & H: Gap
  // Right: Cols I to N for Quarters
  wsData.push([
    { v: 'SUPPORT REQUIRE', s: standardTheme.headerYellowCenterBold },
    { v: '', s: standardTheme.headerYellowCenterBold },
    { v: '', s: standardTheme.headerYellowCenterBold },
    { v: '', s: standardTheme.headerYellowCenterBold },
    { v: '', s: standardTheme.headerYellowCenterBold },
    { v: '', s: standardTheme.headerYellowCenterBold },
    { v: '', s: {} }, // Col G gap
    { v: '', s: {} }, // Col H gap
    { v: 'APRIL', s: standardTheme.headerYellowRedText },
    { v: '', s: standardTheme.headerYellowRedText },
    { v: 'MAY', s: standardTheme.headerYellowRedText },
    { v: '', s: standardTheme.headerYellowRedText },
    { v: 'JUNE', s: standardTheme.headerYellowRedText },
    { v: '', s: standardTheme.headerYellowRedText }
  ]);
  merges.push({ s: { r: 5, c: 0 }, e: { r: 5, c: 5 } }); // SUPPORT REQUIRE merge A6:F6
  merges.push({ s: { r: 5, c: 8 }, e: { r: 5, c: 9 } }); // APRIL merge I6:J6
  merges.push({ s: { r: 5, c: 10 }, e: { r: 5, c: 11 } }); // MAY merge K6:L6
  merges.push({ s: { r: 5, c: 12 }, e: { r: 5, c: 13 } }); // JUNE merge M6:N6

  // Row 7 (Index 6):
  wsData.push([
    { v: 'S.N.', s: standardTheme.colHeader },
    { v: 'H.Q.NAME', s: standardTheme.colHeader },
    { v: 'DR.NAME', s: standardTheme.colHeader },
    { v: 'TYPE OF SUPPORT', s: standardTheme.colHeader },
    { v: 'AMOUNT', s: standardTheme.colHeader },
    { v: 'EXPECTED ROI', s: standardTheme.colHeader },
    { v: '', s: {} },
    { v: '', s: {} },
    { v: 'COMMITMENT', s: standardTheme.colHeader },
    { v: 'ACHIEVEMENT', s: standardTheme.colHeader },
    { v: 'COMMITMENT', s: standardTheme.colHeader },
    { v: 'ACHIEVEMENT', s: standardTheme.colHeader },
    { v: 'COMMITMENT', s: standardTheme.colHeader },
    { v: 'ACHIEVEMENT', s: standardTheme.colHeader }
  ]);

  // Helper for right-side quarter rows
  function getRightSideCells(currRowIdx: number) {
    if (currRowIdx === 7) {
      return [
        { v: monthlyCA.APR?.commitment || '4.34', s: standardTheme.cellCenter },
        { v: monthlyCA.APR?.achievement || '4.34', s: standardTheme.cellCenter },
        { v: monthlyCA.MAY?.commitment || '4.55', s: standardTheme.cellCenter },
        { v: monthlyCA.MAY?.achievement || '4.74', s: standardTheme.cellCenter },
        { v: monthlyCA.JUN?.commitment || '4.89', s: standardTheme.cellCenter },
        { v: monthlyCA.JUN?.achievement || '5.07', s: standardTheme.cellCenter },
      ];
    }
    if (currRowIdx === 11) {
      merges.push({ s: { r: 11, c: 8 }, e: { r: 11, c: 9 } });
      merges.push({ s: { r: 11, c: 10 }, e: { r: 11, c: 11 } });
      merges.push({ s: { r: 11, c: 12 }, e: { r: 11, c: 13 } });
      return [
        { v: 'JULY', s: standardTheme.headerYellowRedText }, { v: '', s: standardTheme.headerYellowRedText },
        { v: 'AUGUST', s: standardTheme.headerYellowRedText }, { v: '', s: standardTheme.headerYellowRedText },
        { v: 'SEPTEMBER', s: standardTheme.headerYellowRedText }, { v: '', s: standardTheme.headerYellowRedText }
      ];
    }
    if (currRowIdx === 12) {
      return [
        { v: 'COMMITMENT', s: standardTheme.colHeader }, { v: 'ACHIEVEMENT', s: standardTheme.colHeader },
        { v: 'COMMITMENT', s: standardTheme.colHeader }, { v: 'ACHIEVEMENT', s: standardTheme.colHeader },
        { v: 'COMMITMENT', s: standardTheme.colHeader }, { v: 'ACHIEVEMENT', s: standardTheme.colHeader }
      ];
    }
    if (currRowIdx === 13) {
      return [
        { v: monthlyCA.JUL?.commitment || '', s: standardTheme.cellCenter }, { v: monthlyCA.JUL?.achievement || '', s: standardTheme.cellCenter },
        { v: monthlyCA.AUG?.commitment || '', s: standardTheme.cellCenter }, { v: monthlyCA.AUG?.achievement || '', s: standardTheme.cellCenter },
        { v: monthlyCA.SEP?.commitment || '', s: standardTheme.cellCenter }, { v: monthlyCA.SEP?.achievement || '', s: standardTheme.cellCenter }
      ];
    }
    if (currRowIdx === 15) {
      merges.push({ s: { r: 15, c: 8 }, e: { r: 15, c: 9 } });
      merges.push({ s: { r: 15, c: 10 }, e: { r: 15, c: 11 } });
      merges.push({ s: { r: 15, c: 12 }, e: { r: 15, c: 13 } });
      return [
        { v: 'OCTOBER', s: standardTheme.headerYellowRedText }, { v: '', s: standardTheme.headerYellowRedText },
        { v: 'NOVEMBER', s: standardTheme.headerYellowRedText }, { v: '', s: standardTheme.headerYellowRedText },
        { v: 'DECEMBER', s: standardTheme.headerYellowRedText }, { v: '', s: standardTheme.headerYellowRedText }
      ];
    }
    if (currRowIdx === 16) {
      return [
        { v: 'COMMITMENT', s: standardTheme.colHeader }, { v: 'ACHIEVEMENT', s: standardTheme.colHeader },
        { v: 'COMMITMENT', s: standardTheme.colHeader }, { v: 'ACHIEVEMENT', s: standardTheme.colHeader },
        { v: 'COMMITMENT', s: standardTheme.colHeader }, { v: 'ACHIEVEMENT', s: standardTheme.colHeader }
      ];
    }
    if (currRowIdx === 17) {
      return [
        { v: monthlyCA.OCT?.commitment || '', s: standardTheme.cellCenter }, { v: monthlyCA.OCT?.achievement || '', s: standardTheme.cellCenter },
        { v: monthlyCA.NOV?.commitment || '', s: standardTheme.cellCenter }, { v: monthlyCA.NOV?.achievement || '', s: standardTheme.cellCenter },
        { v: monthlyCA.DEC?.commitment || '', s: standardTheme.cellCenter }, { v: monthlyCA.DEC?.achievement || '', s: standardTheme.cellCenter }
      ];
    }
    if (currRowIdx === 19) {
      merges.push({ s: { r: 19, c: 8 }, e: { r: 19, c: 9 } });
      merges.push({ s: { r: 19, c: 10 }, e: { r: 19, c: 11 } });
      merges.push({ s: { r: 19, c: 12 }, e: { r: 19, c: 13 } });
      return [
        { v: 'JANUARY', s: standardTheme.headerYellowRedText }, { v: '', s: standardTheme.headerYellowRedText },
        { v: 'FEBRUARY', s: standardTheme.headerYellowRedText }, { v: '', s: standardTheme.headerYellowRedText },
        { v: 'MARCH', s: standardTheme.headerYellowRedText }, { v: '', s: standardTheme.headerYellowRedText }
      ];
    }
    if (currRowIdx === 20) {
      return [
        { v: 'COMMITMENT', s: standardTheme.colHeader }, { v: 'ACHIEVEMENT', s: standardTheme.colHeader },
        { v: 'COMMITMENT', s: standardTheme.colHeader }, { v: 'ACHIEVEMENT', s: standardTheme.colHeader },
        { v: 'COMMITMENT', s: standardTheme.colHeader }, { v: 'ACHIEVEMENT', s: standardTheme.colHeader }
      ];
    }
    if (currRowIdx === 21) {
      return [
        { v: monthlyCA.JAN?.commitment || '', s: standardTheme.cellCenter }, { v: monthlyCA.JAN?.achievement || '', s: standardTheme.cellCenter },
        { v: monthlyCA.FEB?.commitment || '', s: standardTheme.cellCenter }, { v: monthlyCA.FEB?.achievement || '', s: standardTheme.cellCenter },
        { v: monthlyCA.MAR?.commitment || '', s: standardTheme.cellCenter }, { v: monthlyCA.MAR?.achievement || '', s: standardTheme.cellCenter }
      ];
    }

    return new Array(6).fill({ v: '', s: {} });
  }

  doctorsList.forEach((doc: any, dIdx: number) => {
    const currRow = 7 + dIdx;
    let leftCells: any[] = [];

    if (doc.isBlank) {
      leftCells = [
        { v: '', s: standardTheme.cellCenter },
        { v: '', s: standardTheme.cellCenter },
        { v: '', s: standardTheme.cellCenter },
        { v: '', s: standardTheme.cellCenter },
        { v: '', s: standardTheme.cellCenter },
        { v: '', s: standardTheme.cellCenter },
      ];
    } else {
      leftCells = [
        { v: doc.sn || '', s: standardTheme.cellCenter },
        { v: doc.hq || 'UDAIPUR', s: standardTheme.cellCenter },
        { v: doc.drName || '', s: standardTheme.cellLeft },
        { v: doc.typeOfSupport || '', s: standardTheme.cellLeft },
        { v: doc.amount || '', s: standardTheme.cellRight },
        { v: doc.expectedRoi || '', s: standardTheme.cellRight },
      ];
    }

    const rightCells = getRightSideCells(currRow);

    wsData.push([
      ...leftCells,
      { v: '', s: {} }, // Col G gap
      { v: '', s: {} }, // Col H gap
      ...rightCells
    ]);
  });

  return {
    wsData,
    sheetName: '6_COMMITMENT',
    merges,
    // 🌟 Perfectly Sized Columns (Zero Clipping!)
    cols: [
      { wch: 6 },  // Col A: S.N.
      { wch: 14 }, // Col B: H.Q. NAME
      { wch: 22 }, // Col C: PREVIOUS MONTH BUDGET
      { wch: 22 }, // Col D: PREVIOUS MONTH ACHIV.
      { wch: 20 }, // Col E: CURRENT SECONDARY (Now fully fits!)
      { wch: 20 }, // Col F: CURRENT INVENTORY (Now fully fits!)
      { wch: 22 }, // Col G: CURRENT MONTH BUDGET (Now fully fits!)
      { wch: 16 }, // Col H: COMMITMENT (Now fully fits!)
      { wch: 14 }, { wch: 14 }, // Q Month 1
      { wch: 14 }, { wch: 14 }, // Q Month 2
      { wch: 14 }, { wch: 14 }  // Q Month 3
    ],
    // 🌟 Double Row Height for Header so text wraps perfectly
    rows: [
      { hpt: 24 }, // Row 1: COMMITMENT OF MONTH Banner
      { hpt: 36 }, // Row 2: Column Headers (Double Height for 2-line clean wrap)
      { hpt: 22 }  // Row 3: Values
    ]
  };
}
