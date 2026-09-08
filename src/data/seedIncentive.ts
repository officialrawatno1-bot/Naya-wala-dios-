export interface MonthIncentiveData {
  tgt: number | string;
  primarySale: number | string;
  secSale: number | string;
  nextMonthPrimary: number | string;
  achPct: number | string;
  pcpm: number | string;
  drCallAvg: number | string;
  monthlyIncEarned: number | string;
}

export interface EmployeeIncentiveRow {
  id: string;
  name: string;
  desig: string;
  hq: string;
  m1: MonthIncentiveData;
  m2: MonthIncentiveData;
  m3: MonthIncentiveData;
  qtrTgt: number | string;
  qtrSale: number | string;
  qtrAchPct: number | string;
  checkMthTgt: number | string;
  checkMthAch: number | string;
  checkMthAchPct: number | string;
  qtrIncEarned: number | string;
  totalIncEarned: number | string;
}

export interface QuarterConfig {
  code: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  title: string;
  m1Name: string;
  m2Name: string;
  m3Name: string;
  checkMthName: string;
}

export const QUARTERS_CONFIG: Record<string, QuarterConfig> = {
  Q1: { code: 'Q1', title: 'QTR 1 (Apr - Jun)', m1Name: 'Apr-26', m2Name: 'May-26', m3Name: 'Jun-26', checkMthName: 'JULY' },
  Q2: { code: 'Q2', title: 'QTR 2 (Jul - Sep)', m1Name: 'Jul-26', m2Name: 'Aug-26', m3Name: 'Sep-26', checkMthName: 'OCT' },
  Q3: { code: 'Q3', title: 'QTR 3 (Oct - Dec)', m1Name: 'Oct-26', m2Name: 'Nov-26', m3Name: 'Dec-26', checkMthName: 'JAN' },
  Q4: { code: 'Q4', title: 'QTR 4 (Jan - Mar)', m1Name: 'Jan-27', m2Name: 'Feb-27', m3Name: 'Mar-27', checkMthName: 'APR' }
};

export const INITIAL_INCENTIVE_Q1: EmployeeIncentiveRow[] = [
  {
    id: 'emp_1', name: 'DEEPAK SHARMA', desig: 'BE', hq: 'JAIPUR',
    m1: { tgt: 6.96, primarySale: 7.48, secSale: 8.15, nextMonthPrimary: 7.73, achPct: 107.47, pcpm: 2.49, drCallAvg: 10.20, monthlyIncEarned: 3000 },
    m2: { tgt: 7.29, primarySale: 7.76, secSale: 7.99, nextMonthPrimary: 8.13, achPct: 106.45, pcpm: 2.59, drCallAvg: 10.70, monthlyIncEarned: 3000 },
    m3: { tgt: 7.84, primarySale: 8.13, secSale: 8.27, nextMonthPrimary: 7.80, achPct: 103.70, pcpm: 2.71, drCallAvg: 10.95, monthlyIncEarned: 3000 },
    qtrTgt: 22.09, qtrSale: 23.37, qtrAchPct: 105.79, checkMthTgt: 7.74, checkMthAch: 7.80, checkMthAchPct: 100.78, qtrIncEarned: 12464, totalIncEarned: 21464
  },
  {
    id: 'emp_2', name: 'RAVI KUMAR', desig: 'BE', hq: 'JAIPUR',
    m1: { tgt: 6.96, primarySale: 7.48, secSale: 8.15, nextMonthPrimary: 7.73, achPct: 107.47, pcpm: 2.49, drCallAvg: 10.09, monthlyIncEarned: 3000 },
    m2: { tgt: 7.29, primarySale: 7.76, secSale: 7.99, nextMonthPrimary: 8.13, achPct: 106.45, pcpm: 2.59, drCallAvg: 10.38, monthlyIncEarned: 3000 },
    m3: { tgt: 7.84, primarySale: 8.13, secSale: 8.27, nextMonthPrimary: 7.80, achPct: 103.70, pcpm: 2.71, drCallAvg: 11.87, monthlyIncEarned: 3000 },
    qtrTgt: 22.09, qtrSale: 23.37, qtrAchPct: 105.79, checkMthTgt: 7.74, checkMthAch: 7.80, checkMthAchPct: 100.78, qtrIncEarned: 12464, totalIncEarned: 21464
  },
  {
    id: 'emp_3', name: 'SUBHASH GURJAR', desig: 'BE', hq: 'JAIPUR',
    m1: { tgt: 6.96, primarySale: 7.48, secSale: 8.15, nextMonthPrimary: 7.73, achPct: 107.47, pcpm: 2.49, drCallAvg: 9.40, monthlyIncEarned: 3000 },
    m2: { tgt: 7.29, primarySale: 7.76, secSale: 7.99, nextMonthPrimary: 8.13, achPct: 106.45, pcpm: 2.59, drCallAvg: 10.44, monthlyIncEarned: 3000 },
    m3: { tgt: 7.84, primarySale: 8.13, secSale: 8.27, nextMonthPrimary: 7.80, achPct: 103.70, pcpm: 2.71, drCallAvg: 11.14, monthlyIncEarned: 3000 },
    qtrTgt: 22.09, qtrSale: 23.37, qtrAchPct: 105.79, checkMthTgt: 7.74, checkMthAch: 7.80, checkMthAchPct: 100.78, qtrIncEarned: 12464, totalIncEarned: 21464
  },
  {
    id: 'emp_4', name: 'BANWARI LAL MEENA', desig: 'BE', hq: 'UDAIPUR',
    m1: { tgt: 4.34, primarySale: 4.34, secSale: 5.11, nextMonthPrimary: 4.75, achPct: 100.00, pcpm: 4.34, drCallAvg: 9.19, monthlyIncEarned: 4500 },
    m2: { tgt: 4.55, primarySale: 4.75, secSale: 4.74, nextMonthPrimary: 5.07, achPct: 104.40, pcpm: 4.75, drCallAvg: 9.09, monthlyIncEarned: 4500 },
    m3: { tgt: 4.89, primarySale: 5.07, secSale: 5.31, nextMonthPrimary: 4.84, achPct: 103.68, pcpm: 5.07, drCallAvg: 9.26, monthlyIncEarned: 5000 },
    qtrTgt: 13.78, qtrSale: 14.16, qtrAchPct: 102.76, checkMthTgt: 4.83, checkMthAch: 4.84, checkMthAchPct: 100.21, qtrIncEarned: 22656, totalIncEarned: 36656
  },
  {
    id: 'emp_5', name: 'SAURABH CHOUDHARY', desig: 'BE', hq: 'AJMER',
    m1: { tgt: 0.94, primarySale: 1.04, secSale: 0.84, nextMonthPrimary: 1.04, achPct: 110.64, pcpm: 1.04, drCallAvg: 11.17, monthlyIncEarned: 2000 },
    m2: { tgt: 0.99, primarySale: 1.04, secSale: 0.99, nextMonthPrimary: 1.10, achPct: 105.05, pcpm: 1.04, drCallAvg: 12.20, monthlyIncEarned: 2000 },
    m3: { tgt: 1.06, primarySale: 1.10, secSale: 1.15, nextMonthPrimary: 1.14, achPct: 103.77, pcpm: 1.10, drCallAvg: 11.90, monthlyIncEarned: 2000 },
    qtrTgt: 2.99, qtrSale: 3.18, qtrAchPct: 106.35, checkMthTgt: 1.05, checkMthAch: 1.14, checkMthAchPct: 108.57, qtrIncEarned: 5088, totalIncEarned: 11088
  },
  {
    id: 'emp_6', name: 'DUNGAR RAM', desig: 'BE', hq: 'JODHPUR',
    m1: { tgt: 5.12, primarySale: 6.30, secSale: 5.76, nextMonthPrimary: 5.61, achPct: 123.05, pcpm: 2.88, drCallAvg: 10.00, monthlyIncEarned: 3500 },
    m2: { tgt: 5.37, primarySale: 5.61, secSale: 5.72, nextMonthPrimary: 5.78, achPct: 104.47, pcpm: 2.81, drCallAvg: 10.50, monthlyIncEarned: 3500 },
    m3: { tgt: 5.77, primarySale: 5.78, secSale: 6.12, nextMonthPrimary: 5.92, achPct: 100.17, pcpm: 2.89, drCallAvg: 11.90, monthlyIncEarned: 3500 },
    qtrTgt: 16.26, qtrSale: 17.69, qtrAchPct: 108.79, checkMthTgt: 5.70, checkMthAch: 5.92, checkMthAchPct: 103.86, qtrIncEarned: 14152, totalIncEarned: 24652
  },
  {
    id: 'emp_7', name: 'JAYESH', desig: 'BE', hq: 'JODHPUR',
    m1: { tgt: 5.12, primarySale: 6.30, secSale: 5.76, nextMonthPrimary: 5.61, achPct: 123.05, pcpm: 2.88, drCallAvg: 11.00, monthlyIncEarned: 3500 },
    m2: { tgt: 5.37, primarySale: 5.61, secSale: 5.72, nextMonthPrimary: 5.78, achPct: 104.47, pcpm: 2.81, drCallAvg: 11.00, monthlyIncEarned: 3500 },
    m3: { tgt: 5.77, primarySale: 5.78, secSale: 6.12, nextMonthPrimary: 5.92, achPct: 100.17, pcpm: 2.89, drCallAvg: 11.07, monthlyIncEarned: 3500 },
    qtrTgt: 16.26, qtrSale: 17.69, qtrAchPct: 108.79, checkMthTgt: 5.70, checkMthAch: 5.92, checkMthAchPct: 103.86, qtrIncEarned: 14152, totalIncEarned: 24652
  },
  {
    id: 'emp_8', name: 'PUSHPENDRA SINGH', desig: 'BE', hq: 'KOTA',
    m1: { tgt: 2.96, primarySale: 2.99, secSale: 2.74, nextMonthPrimary: 2.41, achPct: 101.01, pcpm: 2.99, drCallAvg: 9.70, monthlyIncEarned: 0 },
    m2: { tgt: 3.10, primarySale: 2.41, secSale: 2.75, nextMonthPrimary: 2.14, achPct: 77.74, pcpm: 2.41, drCallAvg: 9.08, monthlyIncEarned: 0 },
    m3: { tgt: 3.33, primarySale: 2.13, secSale: 2.65, nextMonthPrimary: 1.91, achPct: 63.96, pcpm: 2.13, drCallAvg: 8.00, monthlyIncEarned: 0 },
    qtrTgt: 9.39, qtrSale: 7.53, qtrAchPct: 80.19, checkMthTgt: 3.29, checkMthAch: 1.91, checkMthAchPct: 58.05, qtrIncEarned: 0, totalIncEarned: 0
  },
  {
    id: 'emp_9', name: 'MANISH', desig: 'BE', hq: 'BIKANER',
    m1: { tgt: 0.54, primarySale: 0.27, secSale: 0.22, nextMonthPrimary: 0.34, achPct: 50.00, pcpm: 0.27, drCallAvg: 8.52, monthlyIncEarned: 0 },
    m2: { tgt: 0.56, primarySale: 0.34, secSale: 0.22, nextMonthPrimary: 0.63, achPct: 60.71, pcpm: 0.34, drCallAvg: 9.74, monthlyIncEarned: 0 },
    m3: { tgt: 0.61, primarySale: 0.63, secSale: 0.35, nextMonthPrimary: 0.39, achPct: 103.28, pcpm: 0.39, drCallAvg: 9.55, monthlyIncEarned: 0 },
    qtrTgt: 1.71, qtrSale: 1.24, qtrAchPct: 72.51, checkMthTgt: 0.60, checkMthAch: 0.39, checkMthAchPct: 65.00, qtrIncEarned: 0, totalIncEarned: 0
  },
  {
    id: 'emp_10', name: 'MOHIT VATS', desig: 'ABM', hq: 'JAIPUR',
    m1: { tgt: 7.90, primarySale: 8.52, secSale: 8.99, nextMonthPrimary: 8.77, achPct: 107.85, pcpm: 2.13, drCallAvg: 9.41, monthlyIncEarned: 3438 },
    m2: { tgt: 8.28, primarySale: 8.80, secSale: 8.98, nextMonthPrimary: 9.23, achPct: 106.28, pcpm: 2.20, drCallAvg: 10.29, monthlyIncEarned: 3438 },
    m3: { tgt: 8.90, primarySale: 9.23, secSale: 9.42, nextMonthPrimary: 8.94, achPct: 103.71, pcpm: 2.23, drCallAvg: 10.06, monthlyIncEarned: 3437.5 },
    qtrTgt: 25.08, qtrSale: 26.55, qtrAchPct: 105.86, checkMthTgt: 8.79, checkMthAch: 8.94, checkMthAchPct: 101.71, qtrIncEarned: 13275, totalIncEarned: 23589
  },
  {
    id: 'emp_11', name: 'CHANDAN YADAV', desig: 'ABM', hq: 'JODHPUR',
    m1: { tgt: 5.66, primarySale: 6.57, secSale: 5.98, nextMonthPrimary: 5.95, achPct: 116.08, pcpm: 2.19, drCallAvg: 9.46, monthlyIncEarned: 4375 },
    m2: { tgt: 5.93, primarySale: 5.95, secSale: 5.94, nextMonthPrimary: 6.41, achPct: 100.34, pcpm: 1.49, drCallAvg: 10.35, monthlyIncEarned: 4375 },
    m3: { tgt: 6.38, primarySale: 6.41, secSale: 6.47, nextMonthPrimary: 6.31, achPct: 100.47, pcpm: '', drCallAvg: 10.68, monthlyIncEarned: 4375 },
    qtrTgt: 17.97, qtrSale: 18.93, qtrAchPct: 105.34, checkMthTgt: 6.30, checkMthAch: 6.31, checkMthAchPct: 100.16, qtrIncEarned: 17690, totalIncEarned: 30815
  },
  {
    id: 'emp_12', name: 'AVINASH SONI', desig: 'Sr. ABM', hq: 'JAIPUR',
    m1: { tgt: 15.20, primarySale: 15.85, secSale: 16.84, nextMonthPrimary: 15.93, achPct: 104.28, pcpm: 2.64, drCallAvg: 9.44, monthlyIncEarned: 3875 },
    m2: { tgt: 15.93, primarySale: 15.96, secSale: 16.47, nextMonthPrimary: 16.44, achPct: 100.19, pcpm: 2.66, drCallAvg: 9.29, monthlyIncEarned: 3875 },
    m3: { tgt: 17.12, primarySale: 16.43, secSale: 17.38, nextMonthPrimary: 15.69, achPct: 95.97, pcpm: 2.61, drCallAvg: 9.33, monthlyIncEarned: 0 },
    qtrTgt: 48.25, qtrSale: 48.24, qtrAchPct: 99.98, checkMthTgt: 16.91, checkMthAch: 15.69, checkMthAchPct: 92.79, qtrIncEarned: 16284, totalIncEarned: 24034
  }
];

export const buildEmptyQuarterRows = (qtrCode: 'Q2' | 'Q3' | 'Q4'): EmployeeIncentiveRow[] => {
  return INITIAL_INCENTIVE_Q1.map(emp => ({
    ...emp,
    id: `${emp.id}_${qtrCode}`,
    name: (qtrCode === 'Q3' || qtrCode === 'Q4') && emp.hq === 'KOTA' ? 'YOGESH SONI' : emp.name,
    m1: { tgt: '', primarySale: '', secSale: '', nextMonthPrimary: '', achPct: '', pcpm: '', drCallAvg: '', monthlyIncEarned: '' },
    m2: { tgt: '', primarySale: '', secSale: '', nextMonthPrimary: '', achPct: '', pcpm: '', drCallAvg: '', monthlyIncEarned: '' },
    m3: { tgt: '', primarySale: '', secSale: '', nextMonthPrimary: '', achPct: '', pcpm: '', drCallAvg: '', monthlyIncEarned: '' },
    qtrTgt: '', qtrSale: '', qtrAchPct: '', checkMthTgt: '', checkMthAch: '', checkMthAchPct: '', qtrIncEarned: '', totalIncEarned: ''
  }));
};
