export interface FwDayEntry {
  date: number;
  day: string;
  areaWorked: string;
  tpSubmitted: string;
  drsMet: string | number;
  chemistsMet: string | number;
  withManager?: boolean;
  workType?: string;
}

export interface PartyBreakdownItem {
  id: string;
  partyName: string;
  amount: number;
  note?: string;
}

export interface MonthBreakdownMap {
  [key: string]: PartyBreakdownItem[];
}

export interface DhruviProductEntry {
  sn: number;
  salesFormula: string;
  salesQty: number;
  closingFormula: string;
  closingQty: number;
}

export type DhruviValuationMode = 'PTS' | 'PTR' | 'MANUAL_PTR' | 'MANUAL_PTS';

export interface DcrDoctorCall {
  date: string;
  day: string;
  station: string;
  route: string;
  workWith: string;
  srNo: string;
  docName: string;
  docCode: string;
  speciality: string;
  area: string;
  visitTime: string;
  prodSample: string;
  gift: string;
  rxQty: string;
  pobAmt: string;
  callType: string;
  remarks: string;
}

export interface DcrChemistCall {
  date: string;
  day: string;
  station: string;
  srNo: string;
  chemistName: string;
  address: string;
  visitTime: string;
  products: string;
  pobAmt: string;
  remarks: string;
}

export interface MslDoctor {
  srNo: number;
  doctorName: string;
  activityType: string;
  speciality: string;
  dob: string;
  doa: string;
  apr: string;
  may: string;
  jun: string;
  jul: string;
  aug: string;
  sept: string;
  oct: string;
  nov: string;
  dec: string;
  jan: string;
  feb: string;
  mar: string;
  isNewDoctor?: boolean;
}

export const DEFAULT_STOCKISTS = [
  'NAGDA DISTRIBUTORS',
  'MODI DISTRIBUTORS',
  'SHREE VARDHMAN PHARMA',
  'SUN DISTRIBUTORS',
  'R.P. AGENCIES',
  'DWARIKA MEDICALS'
];

export const memoryStore = {
  dcrDataByMonth: {} as Record<string, FwDayEntry[]>,
  currentDcrMonth: 'Aug-2026',
  effortLevelData: null as Record<string, Record<string, string>> | null,
  salesPerformanceData: null as Record<string, Record<string, string>> | null,
  salesBreakdown: {} as MonthBreakdownMap,
  dhruviEntries: {} as Record<number, DhruviProductEntry>,
  dhruviManualPtrTotal: '' as string,
  dhruviManualPtsTotal: '' as string,
  dhruviValuationMode: 'PTS' as DhruviValuationMode,
  expiryData: null as Record<number, any> | null,
  mslData: null as MslDoctor[] | null,
  mslSyncEnabled: true as boolean, // ⚡ Sync Toggle State
  commitmentTopData: null as any,
  commitmentMonthlyCA: null as any,
  commitmentDoctors: null as any,
  dcrCallsByMonth: {} as Record<string, { doctors: DcrDoctorCall[]; chemists: DcrChemistCall[] }>,
  beName: 'BANWARI LAL MEENA',
  hqName: 'UDAIPUR',
  lastSyncedMonthCode: 'AUG'
};
