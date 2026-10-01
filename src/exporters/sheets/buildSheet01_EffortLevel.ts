import { standardTheme, borderThin } from '../styles/standardTheme';
import { memoryStore } from '../../data/memoryStore';

const MONTHS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

const MONTH_METADATA: Record<string, { year: number; monthIdx: number; days: number }> = {
  APR: { year: 2026, monthIdx: 3, days: 30 },
  MAY: { year: 2026, monthIdx: 4, days: 31 },
  JUN: { year: 2026, monthIdx: 5, days: 30 },
  JUL: { year: 2026, monthIdx: 6, days: 31 },
  AUG: { year: 2026, monthIdx: 7, days: 31 },
  SEP: { year: 2026, monthIdx: 8, days: 30 },
  OCT: { year: 2026, monthIdx: 9, days: 31 },
  NOV: { year: 2026, monthIdx: 10, days: 30 },
  DEC: { year: 2026, monthIdx: 11, days: 31 },
  JAN: { year: 2027, monthIdx: 0, days: 31 },
  FEB: { year: 2027, monthIdx: 1, days: 28 },
  MAR: { year: 2027, monthIdx: 2, days: 31 },
};

const getSundaysCount = (monthCode: string): number => {
  const meta = MONTH_METADATA[monthCode];
  if (!meta) return 4;
  let count = 0;
  for (let d = 1; d <= meta.days; d++) {
    const dt = new Date(meta.year, meta.monthIdx, d);
    if (dt.getDay() === 0) count++;
  }
  return count;
};

const parseSlashSum = (val: string | number | undefined): number => {
  if (val === undefined || val === null) return 0;
  const s = String(val).trim();
  if (!s || s === '-' || s === '#DIV/0!') return 0;
  if (s.includes('/')) {
    return s.split('/').reduce((acc, part) => {
      const num = parseFloat(part.trim());
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }
  const direct = parseFloat(s);
  return isNaN(direct) ? 0 : direct;
};

const ROWS_CONFIG = [
  { sn: 1, id: 'days_in_month', title: 'NO. OF DAYS IN MONTH' },
  { sn: 2, id: 'avail_fw_days', title: 'NO. OF AVAILABLE F.W. DAYS', isCalculated: true },
  { sn: 3, id: 'actual_fw_days', title: 'NO. OF ACTUAL F.W. DAYS', isCalculated: true },
  { sn: 4, id: 'days_on_leave', title: 'NO. OF DAYS ON LEAVE' },
  { sn: 5, id: 'holidays', title: 'NO. OF DAYS OF HOLIDAYS' },
  { sn: 6, id: 'meeting_admin_transit', title: 'NO. OF DAYS MEETING/ ADMIN /TRANSIT' },
  { sn: 7, id: 'total_dr_calls', title: 'TOTAL NO. OF DR. CALL' },
  { sn: 8, id: 'dr_call_avg', title: 'DR. CALL AVERAGE', isCalculated: true },
  { sn: 9, id: 'total_chemist_calls', title: 'TOTAL NO. OF CHEMIST CALL' },
  { sn: 10, id: 'chemist_call_avg', title: 'CHEMIST CALL AVERAGE', isCalculated: true },
  { sn: 11, id: 'activities', title: 'NO. OF ACTIVITIES  ( CAMP, DOB, DOA, RTM, DINNER, CME)', isActivity: true },
  { sn: 12, id: 'dr_conversion', title: 'NO. OF DR. CONVERSION IN AREA' },
  { sn: 13, id: 'drs_added_new_brand', title: 'NO. OF DRS. ADDED NEW BRAND' },
  { sn: 14, id: 'drs_stopped', title: 'NO. OF DRS. STOPPED', isRed: true },
  { sn: 15, id: 'fw_days_with_manager', title: 'NO. OF F.W. DAYS WITH MANAGER' },
  { sn: 16, id: 'fw_days_independent', title: 'NO. OF F.W. DAYS INDEPENDENT', isCalculated: true },
];

export function buildSheet01_EffortLevel(data?: any) {
  const beName = data?.beName || memoryStore.beName || 'BANWARI LAL MEENA';
  const hqName = data?.hqName || memoryStore.hqName || 'UDAIPUR';
  const formData = data?.formData || memoryStore.effortLevelData || {};

  let actComments: Record<string, any[]> = data?.activityComments || {};
  if (Object.keys(actComments).length === 0 && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('dios_effort_activity_comments_v1');
      if (saved) actComments = JSON.parse(saved);
    } catch (e) {}
  }

  // 🌟 EXACT CALCULATION HELPERS
  const getAvailFwDaysNum = (month: string): number => {
    const totalDays = parseFloat(formData.days_in_month?.[month] || '') || (MONTH_METADATA[month]?.days || 30);
    const sundays = getSundaysCount(month);
    const holidays = parseSlashSum(formData.holidays?.[month]);
    return Math.max(0, totalDays - sundays - holidays);
  };

  const getActualFwDaysNum = (month: string): number => {
    const availDays = getAvailFwDaysNum(month);
    const leaves = parseSlashSum(formData.days_on_leave?.[month]);
    const meetingTransit = parseSlashSum(formData.meeting_admin_transit?.[month]);
    return Math.max(0, availDays - leaves - meetingTransit);
  };

  const calculateCell = (rowId: string, month: string): any => {
    if (rowId === 'avail_fw_days') {
      const avail = getAvailFwDaysNum(month);
      return avail > 0 ? avail : '';
    }
    if (rowId === 'actual_fw_days') {
      const actual = getActualFwDaysNum(month);
      return actual > 0 ? actual : '';
    }
    if (rowId === 'dr_call_avg') {
      const calls = parseFloat(formData.total_dr_calls?.[month] || '0') || 0;
      const days = getActualFwDaysNum(month);
      return (days > 0 && calls > 0) ? Number((calls / days).toFixed(1)) : '';
    }
    if (rowId === 'chemist_call_avg') {
      const calls = parseFloat(formData.total_chemist_calls?.[month] || '0') || 0;
      const days = getActualFwDaysNum(month);
      return (days > 0 && calls > 0) ? Number((calls / days).toFixed(1)) : '';
    }
    if (rowId === 'fw_days_independent') {
      const actual = getActualFwDaysNum(month);
      const manager = parseFloat(formData.fw_days_with_manager?.[month] || '0') || 0;
      return actual > 0 ? Math.max(0, actual - manager) : '';
    }
    return formData[rowId]?.[month] ?? '';
  };

  const calculateCumm = (rowId: string): any => {
    if (rowId === 'avail_fw_days') {
      let total = 0;
      MONTHS.forEach(m => { total += getAvailFwDaysNum(m); });
      return total > 0 ? total : '';
    }
    if (rowId === 'actual_fw_days') {
      let total = 0;
      MONTHS.forEach(m => { total += getActualFwDaysNum(m); });
      return total > 0 ? total : '';
    }
    if (rowId === 'dr_call_avg') {
      let totalCalls = 0;
      let totalDays = 0;
      MONTHS.forEach(m => {
        totalCalls += parseFloat(formData.total_dr_calls?.[m] || '0') || 0;
        totalDays += getActualFwDaysNum(m);
      });
      return totalDays > 0 ? Number((totalCalls / totalDays).toFixed(1)) : '';
    }
    if (rowId === 'chemist_call_avg') {
      let totalCalls = 0;
      let totalDays = 0;
      MONTHS.forEach(m => {
        totalCalls += parseFloat(formData.total_chemist_calls?.[m] || '0') || 0;
        totalDays += getActualFwDaysNum(m);
      });
      return totalDays > 0 ? Number((totalCalls / totalDays).toFixed(1)) : '';
    }
    if (rowId === 'fw_days_independent') {
      let totalActual = 0;
      let totalManager = 0;
      MONTHS.forEach(m => {
        totalActual += getActualFwDaysNum(m);
        totalManager += parseFloat(formData.fw_days_with_manager?.[m] || '0') || 0;
      });
      return totalActual > 0 ? Math.max(0, totalActual - totalManager) : '';
    }

    let sum = 0;
    let hasNumeric = false;
    MONTHS.forEach(m => {
      const num = parseSlashSum(formData[rowId]?.[m]);
      if (num > 0) {
        sum += num;
        hasNumeric = true;
      }
    });

    return hasNumeric ? sum : '';
  };

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

  // ROWS 4 to 19: 16 Data Rows with FULL Calculation Support
  ROWS_CONFIG.forEach(cfg => {
    const isRed = !!cfg.isRed;
    const isActivity = !!cfg.isActivity;
    const isCalculated = !!cfg.isCalculated;

    const rowCells: any[] = [
      { v: cfg.sn, s: standardTheme.cellCenter },
      { v: cfg.title, s: isRed ? standardTheme.cellRedLabel : standardTheme.cellLeft }
    ];

    MONTHS.forEach(m => {
      const val = isCalculated ? calculateCell(cfg.id, m) : (formData[cfg.id]?.[m] ?? '');
      const cellObj: any = { 
        v: val !== '' ? (typeof val === 'number' ? val : val) : '', 
        s: standardTheme.cellCenter 
      };

      if (isActivity && actComments[m] && actComments[m].length > 0) {
        const commentLines = actComments[m].map(it => 
          `• ${it.type} (${it.date || '-'}): ${it.doctorName ? it.doctorName + ' - ' : ''}${it.comment || ''}`
        );
        cellObj.c = [
          {
            a: 'DIOS Activity Log',
            t: `=== ACTIVITIES DETAIL (${m} 2026) ===\n${commentLines.join('\n')}\nSlash Count: ${val}`
          }
        ];
        cellObj.s = { ...standardTheme.cellCenter, fill: { fgColor: { rgb: 'FEF9C3' } } };
      }

      rowCells.push(cellObj);
    });

    const cummVal = calculateCumm(cfg.id);
    rowCells.push({ v: cummVal !== '' ? cummVal : '', s: standardTheme.cellCenter });

    wsData.push(rowCells);
  });

  return {
    wsData,
    sheetName: '1_EFFORT LEVEL',
    merges: [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 0, c: 2 }, e: { r: 1, c: 14 } },
    ],
    cols: [
      { wch: 5 },
      { wch: 38 },
      ...MONTHS.map(() => ({ wch: 9 })),
      { wch: 9 }
    ]
  };
}
