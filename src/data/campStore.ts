export type ClinicalTestType = 'RBS' | 'FBS' | 'PPBS' | 'HbA1c' | 'VPT' | 'BMD' | 'BP' | 'OTHER';
export type DosageFrequency = 'OD' | 'BD' | 'TDS' | 'WEEKLY';

export interface CampPatientEntry {
  id: string;
  patientName: string;
  mobileNumber?: string;
  age: number | string;
  gender: 'M' | 'F' | 'O';
  ageGender: string;
  testType: ClinicalTestType;
  testValue: number | string;
  testDiagnosis: string;
  testResult: string;
  isPrescribed: boolean;
  brandPrescribed: string;
  dosageFrequency: DosageFrequency;
  prescribedDuration: string;
  stripsCount: number;
}

export interface CampPobItem {
  id: string;
  productName: string;
  boxes: number;
  strips: number;
}

export interface CampRecord {
  id: string;
  date: string;
  time: string;
  doctorName: string;
  doctorSrNo: number;
  station: string;
  clinicVenue: string;
  campType: string;
  focusBrands: string[];
  patients: CampPatientEntry[];
  pobItems: CampPobItem[];
  pobChemist?: string;
  totalScreened: number;
  totalRxGenerated: number;
  totalStripsPrescribed: number;
  savedAt: string;
}

const CAMPS_STORAGE_KEY = 'dios_doctor_camps_vault_v4';

export const CAMP_TYPES_PRESETS = [
  'DDC (Diabetes Detection Camp)',
  'Neuropathy Screening Camp (Biothesiometer)',
  'HbA1c Diabetes Progression Camp',
  'BMD (Bone Mineral Density) Camp',
  'Cardio & Lipid Profile Camp',
  'Hypertension & Vascular Camp'
];

// 🌟 CLINICAL RANGE REFERENCE & DIAGNOSIS EVALUATOR
export function evaluateTestResult(testType: ClinicalTestType, valueNum: number): { status: 'NORMAL' | 'BORDERLINE' | 'HIGH' | 'CRITICAL'; label: string; rangeGuide: string } {
  if (isNaN(valueNum) || valueNum <= 0) {
    return { status: 'NORMAL', label: 'Pending Value', rangeGuide: 'Enter reading' };
  }

  if (testType === 'RBS') {
    if (valueNum < 140) return { status: 'NORMAL', label: '🟢 Normal (<140 mg/dL)', rangeGuide: 'Normal: <140 | Pre-Diabetic: 140-199 | Diabetic: ≥200' };
    if (valueNum < 200) return { status: 'BORDERLINE', label: '🟡 Borderline / Pre-Diabetic (140-199 mg/dL)', rangeGuide: 'Normal: <140 | Pre-Diabetic: 140-199 | Diabetic: ≥200' };
    return { status: 'CRITICAL', label: '🔴 Diabetic Random (≥200 mg/dL)', rangeGuide: 'Normal: <140 | Pre-Diabetic: 140-199 | Diabetic: ≥200' };
  }

  if (testType === 'FBS') {
    if (valueNum < 100) return { status: 'NORMAL', label: '🟢 Normal (<100 mg/dL)', rangeGuide: 'Normal: <100 | Impaired Fasting: 100-125 | Diabetic: ≥126' };
    if (valueNum < 126) return { status: 'BORDERLINE', label: '🟡 Impaired Fasting (100-125 mg/dL)', rangeGuide: 'Normal: <100 | Impaired Fasting: 100-125 | Diabetic: ≥126' };
    return { status: 'CRITICAL', label: '🔴 Diabetic Fasting (≥126 mg/dL)', rangeGuide: 'Normal: <100 | Impaired Fasting: 100-125 | Diabetic: ≥126' };
  }

  if (testType === 'PPBS') {
    if (valueNum < 140) return { status: 'NORMAL', label: '🟢 Normal (<140 mg/dL)', rangeGuide: 'Normal: <140 | Impaired: 140-199 | Diabetic: ≥200' };
    if (valueNum < 200) return { status: 'BORDERLINE', label: '🟡 Impaired Glucose (140-199 mg/dL)', rangeGuide: 'Normal: <140 | Impaired: 140-199 | Diabetic: ≥200' };
    return { status: 'CRITICAL', label: '🔴 Diabetic PPBS (≥200 mg/dL)', rangeGuide: 'Normal: <140 | Impaired: 140-199 | Diabetic: ≥200' };
  }

  if (testType === 'HbA1c') {
    if (valueNum < 5.7) return { status: 'NORMAL', label: '🟢 Normal (<5.7%)', rangeGuide: 'Normal: <5.7% | Pre-Diabetic: 5.7-6.4% | Diabetic: ≥6.5%' };
    if (valueNum < 6.5) return { status: 'BORDERLINE', label: '🟡 Pre-Diabetic (5.7-6.4%)', rangeGuide: 'Normal: <5.7% | Pre-Diabetic: 5.7-6.4% | Diabetic: ≥6.5%' };
    if (valueNum < 8.0) return { status: 'HIGH', label: '🟠 Diabetic (6.5-7.9%)', rangeGuide: 'Diabetic: ≥6.5% | Poor Control: ≥8.0%' };
    return { status: 'CRITICAL', label: '🔴 Poor Glycemic Control (≥8.0%)', rangeGuide: 'Poor Control: ≥8.0%' };
  }

  if (testType === 'VPT') {
    if (valueNum < 15) return { status: 'NORMAL', label: '🟢 Normal (<15V)', rangeGuide: 'Normal: <15V | Moderate: 15-24V | Severe Neuropathy: ≥25V' };
    if (valueNum < 25) return { status: 'BORDERLINE', label: '🟡 Moderate Risk (15-24V)', rangeGuide: 'Normal: <15V | Moderate: 15-24V | Severe Neuropathy: ≥25V' };
    return { status: 'CRITICAL', label: '🔴 High Risk Neuropathy (≥25V)', rangeGuide: 'High Risk Neuropathy: ≥25V' };
  }

  if (testType === 'BMD') {
    if (valueNum >= -1.0) return { status: 'NORMAL', label: '🟢 Normal Bone Density (T ≥ -1.0)', rangeGuide: 'Normal: ≥-1.0 | Osteopenia: -1.0 to -2.5 | Osteoporosis: ≤-2.5' };
    if (valueNum > -2.5) return { status: 'BORDERLINE', label: '🟡 Osteopenia (-1.0 to -2.5)', rangeGuide: 'Normal: ≥-1.0 | Osteopenia: -1.0 to -2.5 | Osteoporosis: ≤-2.5' };
    return { status: 'CRITICAL', label: '🔴 Osteoporosis (T ≤ -2.5)', rangeGuide: 'Osteoporosis: ≤-2.5' };
  }

  return { status: 'NORMAL', label: 'Recorded', rangeGuide: 'Clinical Reading' };
}

export class CampStore {
  public camps: CampRecord[];

  constructor() {
    this.camps = this.loadCamps();
  }

  private loadCamps(): CampRecord[] {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(CAMPS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return [];
  }

  public saveCamp(camp: CampRecord) {
    const existingIdx = this.camps.findIndex(c => c.id === camp.id);
    if (existingIdx >= 0) {
      this.camps[existingIdx] = camp;
    } else {
      this.camps.unshift(camp);
    }
    this.persist();
  }

  public deleteCamp(id: string) {
    this.camps = this.camps.filter(c => c.id !== id);
    this.persist();
  }

  public getCamps(): CampRecord[] {
    return this.camps;
  }

  public persist() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(CAMPS_STORAGE_KEY, JSON.stringify(this.camps));
      }
    } catch (e) {}
  }
}

export const campStore = new CampStore();
