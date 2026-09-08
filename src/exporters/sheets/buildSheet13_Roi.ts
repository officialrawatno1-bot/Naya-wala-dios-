import { standardTheme, borderThin } from '../styles/standardTheme';
import { INITIAL_ROI_SEED, RoiDoctorItem } from '../../data/seedRoi';

const ACTIVE_2026_MONTHS = [
  { label: 'Jan-26', dateKey: 'jan26_date', roiKey: 'jan26_roi' },
  { label: 'Feb-26', dateKey: 'feb26_date', roiKey: 'feb26_roi' },
  { label: 'Mar-26', dateKey: 'mar26_date', roiKey: 'mar26_roi' },
  { label: 'Apr-26', dateKey: 'apr_date', roiKey: 'apr_roi' },
  { label: 'May-26', dateKey: 'may_date', roiKey: 'may_roi' },
  { label: 'Jun-26', dateKey: 'jun_date', roiKey: 'jun_roi' },
  { label: 'Jul-26', dateKey: 'jul_date', roiKey: 'jul_roi' },
  { label: 'Aug-26', dateKey: 'aug_date', roiKey: 'aug_roi' },
  { label: 'Sep-26', dateKey: 'sept_date', roiKey: 'sept_roi' },
  { label: 'Oct-26', dateKey: 'oct_date', roiKey: 'oct_roi' },
  { label: 'Nov-26', dateKey: 'nov_date', roiKey: 'nov_roi' },
  { label: 'Dec-26', dateKey: 'dec_date', roiKey: 'dec_roi' },
  { label: 'Jan-27', dateKey: 'jan_date', roiKey: 'jan_roi' },
  { label: 'Feb-27', dateKey: 'feb_date', roiKey: 'feb_roi' },
  { label: 'Mar-27', dateKey: 'mar_date', roiKey: 'mar_roi' },
];

export function buildSheet13_Roi(data?: any) {
  // 🌟 DYNAMIC PIPELINE: Load from passed data OR localStorage OR default seed
  let roiList: any[] = [];

  if (data?.roiList && Array.isArray(data.roiList) && data.roiList.length > 0) {
    roiList = data.roiList;
  } else if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('dios_roi_analysis_permanent_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) roiList = parsed;
      }
    } catch (e) {}
  }

  if (roiList.length === 0) {
    roiList = INITIAL_ROI_SEED;
  }

  const wsData: any[][] = [];
  const merges: any[] = [];

  const totalCols = 8 + ACTIVE_2026_MONTHS.length * 2 + 2;

  // ROW 1: INVESTMENT AND COVERAGE ANALYSIS . (Yellow Banner Merged A1 to H1)
  const r1: any[] = [
    { v: 'INVESTMENT AND COVERAGE ANALYSIS . ', s: standardTheme.headerYellowLeft }
  ];
  for (let c = 1; c < 8; c++) r1.push({ v: '', s: standardTheme.headerYellowLeft });
  for (let c = 8; c < totalCols; c++) r1.push({ v: '', s: {} });
  wsData.push(r1);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } });

  // ROW 2: Main Headers (Solid Yellow)
  const r2: any[] = [
    { v: 'S.N.', s: standardTheme.headerYellowCol },
    { v: 'DR.NAME', s: standardTheme.headerYellowColLeft },
    { v: 'EXECUTIVE NAME', s: standardTheme.headerYellowColLeft },
    { v: 'MOBILE NO.', s: standardTheme.headerYellowCol },
    { v: 'ACTIVITY TYPE', s: standardTheme.headerYellowCol },
    { v: 'ACTIVITY AMOUNT', s: standardTheme.headerYellowCol },
    { v: 'DATE OF ACTIVITY', s: standardTheme.headerYellowCol },
    { v: 'OLD/NEW', s: standardTheme.headerYellowCol }
  ];

  ACTIVE_2026_MONTHS.forEach(m => {
    r2.push(
      { v: m.label, s: standardTheme.headerYellowCol },
      { v: '', s: standardTheme.headerYellowCol }
    );
  });
  r2.push({ v: 'OLD/NEW', s: standardTheme.headerYellowCol });
  r2.push({ v: 'TOTAL', s: standardTheme.headerYellowCol });
  wsData.push(r2);

  // 2-Row Vertical Merges for Left Headers
  merges.push({ s: { r: 1, c: 0 }, e: { r: 2, c: 0 } }); // S.N.
  merges.push({ s: { r: 1, c: 1 }, e: { r: 2, c: 1 } }); // DR.NAME
  merges.push({ s: { r: 1, c: 2 }, e: { r: 2, c: 2 } }); // EXECUTIVE NAME
  merges.push({ s: { r: 1, c: 3 }, e: { r: 2, c: 3 } }); // MOBILE NO.
  merges.push({ s: { r: 1, c: 4 }, e: { r: 2, c: 4 } }); // ACTIVITY TYPE
  merges.push({ s: { r: 1, c: 5 }, e: { r: 2, c: 5 } }); // ACTIVITY AMOUNT
  merges.push({ s: { r: 1, c: 6 }, e: { r: 2, c: 6 } }); // DATE OF ACTIVITY
  merges.push({ s: { r: 1, c: 7 }, e: { r: 2, c: 7 } }); // OLD/NEW

  // Month 2-Col Horizontal Merges
  ACTIVE_2026_MONTHS.forEach((_, idx) => {
    const startCol = 8 + idx * 2;
    merges.push({ s: { r: 1, c: startCol }, e: { r: 1, c: startCol + 1 } });
  });

  const lastCol = 8 + ACTIVE_2026_MONTHS.length * 2;
  merges.push({ s: { r: 1, c: lastCol }, e: { r: 2, c: lastCol } });
  merges.push({ s: { r: 1, c: lastCol + 1 }, e: { r: 2, c: lastCol + 1 } });

  // ROW 3: Sub-Headers (Solid Red Background)
  const r3: any[] = [
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol }
  ];

  ACTIVE_2026_MONTHS.forEach(() => {
    r3.push(
      { v: 'DATE of visit', s: standardTheme.subHeaderRed },
      { v: 'ROI', s: standardTheme.subHeaderRed }
    );
  });
  r3.push({ v: '', s: standardTheme.headerYellowCol });
  r3.push({ v: '', s: standardTheme.headerYellowCol });
  wsData.push(r3);

  // ROWS 4 onwards: DYNAMIC DOCTORS DATA
  roiList.forEach((d: any) => {
    const mCells: any[] = [];
    let rowSum = 0;

    ACTIVE_2026_MONTHS.forEach(m => {
      const dVal = d[m.dateKey] || '';
      const rVal = d[m.roiKey] || '';
      const rNum = parseFloat(String(rVal).replace(/,/g, '')) || 0;
      if (rNum > 0) rowSum += rNum;

      mCells.push(
        { v: dVal, s: standardTheme.cellCenter },
        { v: rNum > 0 ? rNum : (rVal !== '' ? rVal : ''), s: rNum > 0 ? standardTheme.cellRight : standardTheme.cellCenter }
      );
    });

    const displayTotal = rowSum > 0 ? rowSum : (parseFloat(String(d.total || '0').replace(/,/g, '')) || '');

    const row = [
      { v: d.sn || '', s: standardTheme.cellCenter },
      { v: d.drName || d.name || '', s: standardTheme.cellLeft },
      { v: d.execName || d.exec || 'BANWARI LAL MEENA', s: standardTheme.cellLeft },
      { v: d.mobileNo || d.mob || '', s: standardTheme.cellCenter },
      { v: d.activityType || d.actType || '', s: standardTheme.cellCenter },
      { v: d.activityAmount || d.actAmt || '', s: standardTheme.cellRight },
      { v: d.dateOfActivity || d.actDate || '', s: standardTheme.cellCenter },
      { v: d.category || d.cat || 'OLD', s: standardTheme.cellCenter },
      ...mCells,
      { v: d.category || d.cat || 'OLD', s: standardTheme.cellCenter },
      { v: displayTotal, s: standardTheme.cellRight }
    ];

    wsData.push(row);
  });

  return {
    wsData,
    sheetName: '13_ROI',
    merges,
    cols: [
      { wch: 6 },
      { wch: 22 },
      { wch: 22 },
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      ...ACTIVE_2026_MONTHS.flatMap(() => [{ wch: 18 }, { wch: 10 }]),
      { wch: 10 },
      { wch: 14 }
    ],
    rows: [
      { hpt: 22 },
      { hpt: 26 },
      { hpt: 26 }
    ]
  };
}
