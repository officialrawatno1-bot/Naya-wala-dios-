export interface CampPatientEntry {
  id: string;
  patientName: string;
  ageGender?: string;
  testResult: string;
  brandPrescribed: string;
  stripsSold: number;
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
  pobAmount?: number;
  pobChemist?: string;
  totalScreened: number;
  totalRxGenerated: number;
  totalStripsSold: number;
  savedAt: string;
}

const CAMPS_STORAGE_KEY = 'dios_doctor_camps_vault_v1';

export const CAMP_TYPES_PRESETS = [
  'DDC (Diabetes Detection Camp)',
  'Neuropathy Screening Camp (Biothesiometer)',
  'HbA1c Diabetes Progression Camp',
  'BMD (Bone Mineral Density) Camp',
  'Cardio & Lipid Profile Camp',
  'Hypertension & Vascular Camp'
];

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
