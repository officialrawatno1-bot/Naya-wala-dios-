import { standardTheme, borderThin } from '../styles/standardTheme';
import { memoryStore } from '../../data/memoryStore';

const MONTHS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

const ROWS_CONFIG = [
  { sn: 1, id: 'days_in_month', title: 'NO. OF DAYS IN MONTH' },
  { sn: 2, id: 'avail_fw_days', title: 'NO. OF AVAILABLE F.W. DAYS' },
  { sn: 3, id: 'actual_fw_days', title: 'NO. OF ACTUAL F.W. DAYS' },
  { sn: 4, id: 'days_on_leave', title: 'NO. OF DAYS ON LEAVE' },
  { sn: 5, id: 'holidays', title: 'NO. OF DAYS OF HOLIDAYS' },
  { sn: 6, id: 'meeting_admin_transit', title: 'NO. OF DAYS MEETING/ ADMIN /TRANSIT' },
  { sn: 7, id: 'total_dr_calls', title: 'TOTAL NO. OF DR. CALL' },
  { sn: 8, id: 'dr_call_avg', title: 'DR. CALL AVERAGE' },
  { sn: 9, id: 'total_chemist_calls', title: 'TOTAL NO. OF CHEMIST CALL' },
  { sn: 10, id: 'chemist_call_avg', title: 'CHEMIST CALL AVERAGE' },
  { sn: 11, id: 'activities', title: 'NO. OF ACTIVITIES  ( CAMP, DOB, DOA, RTM, DINNER, CME)' },
  { sn: 12, id: 'dr_conversion', title: 'NO. OF DR. CONVERSION IN AREA' },
  { sn: 13, id: 'drs_added_new_brand', title: 'NO. OF DRS. ADDED NEW BRAND' },
  { sn: 14, id: 'drs_stopped', title: 'NO. OF DRS. STOPPED', isRed: true },
  { sn: 15, id: 'fw_days_with_manager', title: 'NO. OF F.W. DAYS WITH MANAGER' },
  { sn: 16, id: 'fw_days_independent', title: 'NO. OF F.W. DAYS INDEPENDENT' },
];

export function buildSheet01_EffortLevel(data?: any) {
  const beName = data?.beName || memoryStore.beName || 'BANWARI LAL MEENA';
  const hqName = data?.hqName || memoryStore.hqName || 'UDAIPUR';
  const formData = data?.formData || memoryStore.effortLevelData || {};

  const wsData: any[][] = [];

  // ROW 1: Yellow Header Top
  const r1: any[] = [
    { v: `BE Name - ${beName}`, s: standardTheme.headerYellowLeft },
    { v: '', s: standardTheme.headerYellowLeft }
  ];
  for (let c = 2; c < 15; c++) {
    r1.push({ v: c === 2 ? 'FIELD WORK ACTIVITY' : '', s: standardTheme.headerYellowCenterBold });
  }
  wsData.push(r1);

  // ROW 2: Yellow Header Sub (HQ)
  const r2: any[] = [
    { v: `H.Q- ${hqName}`, s: standardTheme.headerYellowLeft },
    { v: '', s: standardTheme.headerYellowLeft }
  ];
  for (let c = 2; c < 15; c++) {
    r2.push({ v: '', s: standardTheme.headerYellowCenterBold });
  }
  wsData.push(r2);

  // ROW 3: Column Headers
  const r3: any[] = [
    { v: 'S.N.', s: standardTheme.colHeader },
    { v: 'PARTICULARS', s: { ...standardTheme.colHeader, alignment: { horizontal: 'left', vertical: 'center' } } }
  ];
  MONTHS.forEach(m => r3.push({ v: m, s: standardTheme.colHeader }));
  r3.push({ v: 'CUMM', s: standardTheme.colHeader });
  wsData.push(r3);

  // ROWS 4 to 19: 16 Data Rows
  ROWS_CONFIG.forEach(cfg => {
    const isRed = !!cfg.isRed;
    const rowCells: any[] = [
      { v: cfg.sn, s: standardTheme.cellCenter },
      { v: cfg.title, s: isRed ? standardTheme.cellRedLabel : standardTheme.cellLeft }
    ];

    let cummSum = 0;
    let hasNumeric = false;

    MONTHS.forEach(m => {
      const val = formData[cfg.id]?.[m] || '';
      rowCells.push({ v: val, s: standardTheme.cellCenter });

      const n = parseFloat(String(val).split('/')[0]);
      if (!isNaN(n)) { cummSum += n; hasNumeric = true; }
    });

    const cummVal = formData[cfg.id]?.['CUMM'] || (hasNumeric && cummSum > 0 ? cummSum : '');
    rowCells.push({ v: cummVal, s: standardTheme.cellCenter });

    wsData.push(rowCells);
  });

  return {
    wsData,
    sheetName: '1_EFFORT LEVEL',
    merges: [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // BE Name merge
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // HQ merge
      { s: { r: 0, c: 2 }, e: { r: 1, c: 14 } }, // FIELD WORK ACTIVITY 2-row x 13-col merge
    ],
    cols: [
      { wch: 5 },  // S.N.
      { wch: 38 }, // PARTICULARS
      ...MONTHS.map(() => ({ wch: 9 })), // Months
      { wch: 9 }   // CUMM
    ]
  };
}
