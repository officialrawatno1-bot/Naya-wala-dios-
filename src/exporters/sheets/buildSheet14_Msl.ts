import { standardTheme, borderThin } from '../styles/standardTheme';
import { MASTER_123_MSL_DOCTORS } from '../../components/review/MslSheet';
import { memoryStore, MslDoctor } from '../../data/memoryStore';

export interface CustomPriorityRule {
  id: string;
  field: 'activity' | 'speciality';
  value: string;
}

const DEFAULT_CUSTOM_RULES: CustomPriorityRule[] = [
  { id: 'r1', field: 'activity', value: 'CRM' },
  { id: 'r2', field: 'speciality', value: 'ENDO' },
  { id: 'r3', field: 'activity', value: 'WCFYH VAL/VIN' }
];

const MONTH_COLS = [
  { key: 'apr', label: 'APR' }, { key: 'may', label: 'MAY' }, { key: 'jun', label: 'JUN' },
  { key: 'jul', label: 'JUL' }, { key: 'aug', label: 'AUG' }, { key: 'sept', label: 'SEPT' },
  { key: 'oct', label: 'OCT' }, { key: 'nov', label: 'NOV' }, { key: 'dec', label: 'DEC' },
  { key: 'jan', label: 'JAN' }, { key: 'feb', label: 'FEB' }, { key: 'mar', label: 'MAR' }
];

const YELLOW_HIGHLIGHT_DOCTORS = new Set([
  'ABHAY JAIN', 'ABHIJEET BASU', 'AKVATS', 'AMEET MEHTA', 'ANISH JAIN', 'BALDEV MEENA',
  'BHUPESH PARTANI', 'BS BOMB', 'D C SHARMA', 'DENY', 'DP SINGH', 'G K MUKHIYA',
  'HEMANT MAHUR', 'HITESH YADAV', 'JIMESH PANDIYA', 'KAVITA BADJATIYA', 'KIRIT GANDHI',
  'MAHESH DAVE', 'NAVGEET MATHUR', 'PARAS JAIN', 'RAHUL PANCHAL', 'RAMESH PATEL',
  'RK MALOT', 'SANDEEP BHATNAGAR', 'SANDEEP KANSARA', 'SUMIT SIROIYA', 'VIJAY GOYAL',
  'VINOD KUMAR RAI', 'VINOD MEHTA'
]);

export function buildSheet14_Msl(data?: any) {
  // 🌟 STEP 1: iPad के LocalStorage से Live Data Hub स्टेट सबसे पहले लें
  let doctorsList: MslDoctor[] = [];
  let priorityRules: CustomPriorityRule[] = [];
  let sortMode = 'CUSTOM_RANK';

  if (typeof window !== 'undefined') {
    // 1. Doctors List (iPad LocalStorage ➔ Data Hub Live)
    try {
      const savedDocs = localStorage.getItem('dios_msl_schedule_permanent_v5');
      if (savedDocs) {
        const parsed = JSON.parse(savedDocs);
        if (Array.isArray(parsed) && parsed.length > 0) doctorsList = parsed;
      }
    } catch (e) {}

    // 2. Custom Priority Rules (iPad LocalStorage ➔ Data Hub Live)
    try {
      const savedRules = localStorage.getItem('dios_msl_custom_priority_rules_v1');
      if (savedRules) {
        const parsed = JSON.parse(savedRules);
        if (Array.isArray(parsed) && parsed.length > 0) priorityRules = parsed;
      }
    } catch (e) {}

    // 3. Saved View Mode (iPad LocalStorage)
    try {
      const savedView = localStorage.getItem('dios_msl_saved_filter_view_v5');
      if (savedView) {
        const parsed = JSON.parse(savedView);
        if (parsed.sortMode) sortMode = parsed.sortMode;
      }
    } catch (e) {}
  }

  // Fallbacks अगर LocalStorage खाली हो
  if (doctorsList.length === 0 && memoryStore.mslData && memoryStore.mslData.length > 0) {
    doctorsList = memoryStore.mslData;
  }
  if (doctorsList.length === 0 && data?.doctors && Array.isArray(data.doctors) && data.doctors.length > 0) {
    doctorsList = data.doctors;
  }
  if (doctorsList.length === 0) {
    doctorsList = MASTER_123_MSL_DOCTORS;
  }

  if (priorityRules.length === 0 && data?.customPriorityRules && Array.isArray(data.customPriorityRules) && data.customPriorityRules.length > 0) {
    priorityRules = data.customPriorityRules;
  }
  if (priorityRules.length === 0) {
    priorityRules = DEFAULT_CUSTOM_RULES;
  }

  if (data?.sortMode) sortMode = data.sortMode;

  // 🌟 STEP 2: Data Hub (MslSheet.tsx) का हूबहू Exact getCustomScore लॉजिक
  const getCustomScore = (doc: MslDoctor) => {
    const act = (doc.activityType || '').toUpperCase().trim();
    const spec = (doc.speciality || '').toUpperCase().trim();
    for (let i = 0; i < priorityRules.length; i++) {
      const rule = priorityRules[i];
      const ruleVal = (rule.value || '').toUpperCase().trim();
      if (rule.field === 'activity' && act.includes(ruleVal)) return i + 1;
      if (rule.field === 'speciality' && spec.includes(ruleVal)) return i + 1;
    }
    return 999;
  };

  // 🌟 STEP 3: Data Hub (MslSheet.tsx) की हूबहू Exact Sorting
  const sortedDoctors = [...doctorsList]
    .filter(d => (d.doctorName || '').trim().length > 0)
    .sort((a, b) => {
      const nameA = (a.doctorName || '').trim();
      const nameB = (b.doctorName || '').trim();
      if (!nameA && nameB) return 1;
      if (nameA && !nameB) return -1;

      if (sortMode === 'CUSTOM_RANK') {
        const scoreA = getCustomScore(a);
        const scoreB = getCustomScore(b);
        if (scoreA !== scoreB) return scoreA - scoreB;
        return (a.srNo || 0) - (b.srNo || 0);
      }
      if (sortMode === 'NAME_AZ') return a.doctorName.localeCompare(b.doctorName);
      if (sortMode === 'NAME_ZA') return b.doctorName.localeCompare(a.doctorName);
      if (sortMode === 'SRNO_DESC') return (b.srNo || 0) - (a.srNo || 0);
      return (a.srNo || 0) - (b.srNo || 0);
    });

  const wsData: any[][] = [];
  const merges: any[] = [];

  // ==========================================
  // ROW 1: VISIT DATES Banner (Bright Solid Yellow `#FFFF00`)
  // ==========================================
  const r1: any[] = [
    { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} },
    { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} },
    { v: 'VISIT DATES', s: standardTheme.headerYellowCenterBold }
  ];
  for (let c = 7; c < 18; c++) {
    r1.push({ v: '', s: standardTheme.headerYellowCenterBold });
  }
  wsData.push(r1);
  merges.push({ s: { r: 0, c: 6 }, e: { r: 0, c: 17 } });

  // ==========================================
  // ROW 2: Headers (Navy Blue `#1F497D` for Middle Headers)
  // ==========================================
  const r2: any[] = [
    { v: 'SrNo', s: standardTheme.colHeader },
    { v: 'Doctor Name', s: { ...standardTheme.colHeader, alignment: { horizontal: 'left', vertical: 'center' } } },
    { v: 'Activity Type', s: standardTheme.headerNavyWhiteText },
    { v: 'Speciality', s: standardTheme.headerNavyWhiteText },
    { v: 'DOB', s: standardTheme.headerNavyWhiteText },
    { v: 'DOA', s: standardTheme.headerNavyWhiteText }
  ];
  MONTH_COLS.forEach(m => {
    r2.push({ v: m.label, s: standardTheme.colHeader });
  });
  wsData.push(r2);

  // ==========================================
  // ROWS 3 onwards: Data Hub के Exact क्रम में सजे डॉक्टर्स
  // ==========================================
  sortedDoctors.forEach((d: any) => {
    const rawName = String(d.doctorName || '').toUpperCase().trim();
    const cleanDoc = rawName.replace(/^(DR\.?|DR\s+)/i, '').replace(/[^A-Z0-9]/g, '');
    
    let isYellow = d.activityType === 'CRM' || YELLOW_HIGHLIGHT_DOCTORS.has(rawName);
    if (!isYellow) {
      for (const yName of YELLOW_HIGHLIGHT_DOCTORS) {
        if (cleanDoc.includes(yName.replace(/[^A-Z0-9]/g, '')) || yName.replace(/[^A-Z0-9]/g, '').includes(cleanDoc)) {
          isYellow = true;
          break;
        }
      }
    }

    const row = [
      { v: d.srNo || '', s: standardTheme.cellCenter },
      { v: d.doctorName || '', s: isYellow ? standardTheme.cellYellowDoctorName : standardTheme.cellLeft },
      { v: d.activityType || '', s: standardTheme.cellCenter },
      { v: d.speciality || '', s: standardTheme.cellLeft },
      { v: d.dob || '', s: standardTheme.cellCenter },
      { v: d.doa || '', s: standardTheme.cellCenter }
    ];

    MONTH_COLS.forEach(m => {
      const val = d[m.key] || '';
      row.push({ v: val, s: standardTheme.cellCenter });
    });

    wsData.push(row);
  });

  return {
    wsData,
    sheetName: '14_MSL',
    merges,
    cols: [
      { wch: 6 },  // Col A: SrNo
      { wch: 26 }, // Col B: Doctor Name
      { wch: 16 }, // Col C: Activity Type
      { wch: 18 }, // Col D: Speciality
      { wch: 12 }, // Col E: DOB
      { wch: 12 }, // Col F: DOA
      ...MONTH_COLS.map(() => ({ wch: 15 }))
    ],
    rows: [
      { hpt: 24 }, // Row 1: VISIT DATES Banner
      { hpt: 26 }  // Row 2: Headers
    ]
  };
}
