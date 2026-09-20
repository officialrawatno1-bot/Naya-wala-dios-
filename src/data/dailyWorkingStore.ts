import { memoryStore } from './memoryStore';
import { MASTER_123_MSL_DOCTORS } from '../components/review/MslSheet';

export const UDAIPUR_AREAS_MASTER = [
  'Hospital Road',
  'Geetanjali Hospital',
  'GBH American Bedwas',
  'GBH American City',
  'PIMS City',
  'PMCH Bedla',
  'Paras Hospital',
  'Bhopalpura',
  'Shobhagpura',
  'Mallatalai',
  'Shikarwadi',
  'Hiran Magri',
  'Hindustan Zinc City',
  'Hindustan Zinc Debari',
  'Choudhary Hospital',
  'Madhuban',
  'Sector 14',
  'Dhanmandi',
  'PMCH Umarda',
  'Savina',
  'Ananta Hospital'
];

export const EX_STATIONS_MASTER = [
  'Rajsamand',
  'Chittorgarh',
  'Dungarpur',
  'Banswara'
];

export const WCFYH_VINTEL_NAMES = [
  'PRIYANKA MINOCHA',
  'MONA DHINGRA',
  'UDAY BHOMIK'
];

export const WCFYH_VALROS_NAMES = [
  'DEEPAK AAMETHA',
  'MUKESH SHARMA',
  'CPPUROHIT',
  'RAMESH PATEL',
  'SANJAY GANDHI',
  'RAVIRAJ SINGH AHADA',
  'DILIP JAIN'
];

export const TIME_SLOTS_MASTER = [
  '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
  '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM',
  '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM',
  '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:10 PM', '08:30 PM'
];

export const cleanName = (s: string) => 
  (s || '').toUpperCase().replace(/^(DR\.?|DR\s+)/i, '').replace(/[^A-Z]/g, '').trim();

export const normalizeStationName = (st: string): 'UDAIPUR' | 'BANSWARA' | 'DUNGARPUR' | 'CHITTORGARH' | 'RAJASMAND' => {
  const s = (st || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (s.includes('RAJAS') || s.includes('RAJSAM') || s.includes('KANKROLI') || s.includes('NATHDWARA')) return 'RAJASMAND';
  if (s.includes('CHITOR') || s.includes('CHITTOR') || s.includes('NIMBAHERA')) return 'CHITTORGARH';
  if (s.includes('DUNGAR') || s.includes('SAGWARA')) return 'DUNGARPUR';
  if (s.includes('BANSWA') || s.includes('GHATOL')) return 'BANSWARA';
  return 'UDAIPUR';
};

export interface LiveWcfyhDoctorItem {
  drName: string;
  brand: 'VINTEL' | 'VALROS';
  speciality?: string;
  dateOfCampaign?: string;
}

export const getLiveWcfyhDoctorsFromSheet7 = (): { 
  vintelDoctors: LiveWcfyhDoctorItem[]; 
  valrosDoctors: LiveWcfyhDoctorItem[];
} => {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dios_wcfyh_campaign_permanent_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const vList: LiveWcfyhDoctorItem[] = [];
          const valList: LiveWcfyhDoctorItem[] = [];

          parsed.forEach((r: any) => {
            if (r.drName && r.drName.trim().length > 0) {
              const brandUpper = (r.brand || '').toUpperCase().trim();
              const item: LiveWcfyhDoctorItem = {
                drName: r.drName.trim(),
                brand: brandUpper === 'VINTEL' ? 'VINTEL' : 'VALROS',
                speciality: r.speciality,
                dateOfCampaign: r.dateOfCampaign
              };
              if (item.brand === 'VINTEL') vList.push(item);
              else valList.push(item);
            }
          });

          return { vintelDoctors: vList, valrosDoctors: valList };
        }
      }
    }
  } catch (e) {}

  return {
    vintelDoctors: [
      { drName: 'PRIYANKA MINOCHA', brand: 'VINTEL', speciality: 'MD MBBS, NEUROLOGY', dateOfCampaign: '10TH OF EVERY MONTH' },
      { drName: 'Mona dingra', brand: 'VINTEL', speciality: 'DM ENDOCRINOLOGIST', dateOfCampaign: '10TH OF EVERY MONTH' },
      { drName: 'UDAY BHOMIK', brand: 'VINTEL', speciality: 'MCH NEUROSURGERY', dateOfCampaign: '10TH OF EVERY MONTH' }
    ],
    valrosDoctors: [
      { drName: 'DEEPAK AAMETHA', brand: 'VALROS', speciality: 'DM CARD.', dateOfCampaign: '20TH OF EVERY MONTH' },
      { drName: 'MUKESH SHARMA', brand: 'VALROS', speciality: 'DM CARD.', dateOfCampaign: '20TH OF EVERY MONTH' },
      { drName: 'CPPUROHIT', brand: 'VALROS', speciality: 'DM CARD.', dateOfCampaign: '20TH OF EVERY MONTH' },
      { drName: 'RAMESH PATEL', brand: 'VALROS', speciality: 'DM CARD.', dateOfCampaign: '20TH OF EVERY MONTH' },
      { drName: 'Sanjay Gandhi', brand: 'VALROS', speciality: 'MS, MCH, CARDIOLOGY', dateOfCampaign: '20TH OF EVERY MONTH' },
      { drName: 'RAVIRAJ SINGH AHADA', brand: 'VALROS', speciality: 'DM CARD.', dateOfCampaign: '20TH OF EVERY MONTH' },
      { drName: 'Dilip jain', brand: 'VALROS', speciality: 'DM CARD.', dateOfCampaign: '20TH OF EVERY MONTH' }
    ]
  };
};

export interface DoctorFieldProfile {
  srNo: number;
  doctorName: string;
  speciality: string;
  activityType: string;
  primaryHospital: string;
  area: string;
  approxTime: string;
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
  availableDays: string[];
  notes: string;
  isExStation: boolean;
  station: string;
  monthlyTargetVisits: number;
}

export interface PlannedCallItem {
  srNo: number;
  doctorName: string;
  speciality: string;
  clinicArea: string;
  activityType: string;
  approxTime: string;
  otRemarks: string;
  visitNumber: number;
  totalMonthlyTarget: number;
  lastVisitDate: string;
  daysSinceLastVisit: number;
  recencyTier: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  status: 'PLANNED' | 'MET' | 'MISSED' | 'IN_OT';
  notes: string;
}

export interface DayPlanRecord {
  date: string;
  dayOfWeek: string;
  selectedAreas: string[];
  isHoliday: boolean;
  holidayName?: string;
  isSunday: boolean;
  plannedCalls: PlannedCallItem[];
  savedAt: string;
}

const PROFILES_STORAGE_KEY = 'dios_doctor_field_profiles_v11';
const DAY_PLANS_STORAGE_KEY = 'dios_daily_plans_v11';

const MONTH_KEYS_ORDER = [
  { key: 'apr', monthIdx: 3, year: 2026 },
  { key: 'may', monthIdx: 4, year: 2026 },
  { key: 'jun', monthIdx: 5, year: 2026 },
  { key: 'jul', monthIdx: 6, year: 2026 },
  { key: 'aug', monthIdx: 7, year: 2026 },
  { key: 'sept', monthIdx: 8, year: 2026 },
  { key: 'oct', monthIdx: 9, year: 2026 },
  { key: 'nov', monthIdx: 10, year: 2026 },
  { key: 'dec', monthIdx: 11, year: 2026 },
  { key: 'jan', monthIdx: 0, year: 2027 },
  { key: 'feb', monthIdx: 1, year: 2027 },
  { key: 'mar', monthIdx: 2, year: 2027 }
];

// 🌟 COMPLETE HOSPITAL & TIMING MASTER KNOWLEDGE BASE
const DOCTOR_SCHEDULE_OVERRIDES: Record<string, Partial<DoctorFieldProfile>> = {
  // Geetanjali Hospital (Thu, Fri | 01:30 PM)
  'ABHIJEETBASU': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Geetanjali (Thu, Fri | 01:00 PM – 03:30 PM)', station: 'UDAIPUR', isExStation: false },
  'LALITSHREEMALI': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Geetanjali (Thu, Fri | 01:00 PM – 03:30 PM)', station: 'UDAIPUR', isExStation: false },
  'RAVIMANGLIYA': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Geetanjali Hospital, Udaipur', station: 'UDAIPUR', isExStation: false },
  'RAVIMANGALIA': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Geetanjali Hospital, Udaipur', station: 'UDAIPUR', isExStation: false },
  'AMEETMEHTA': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Gitanjali hospital', station: 'UDAIPUR', isExStation: false },
  'NAVGEETMATHUR': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Geetanjali (Thu, Fri | 01:00 PM – 03:30 PM)', station: 'UDAIPUR', isExStation: false },
  'MANUSHARMA': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Geetanjali Hospital, Udaipur', station: 'UDAIPUR', isExStation: false },
  'JITENAJINGAR': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Geetanjali Hospital, Udaipur', station: 'UDAIPUR', isExStation: false },
  'SURAJGUPTA': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Gitanjali Hospital, Udaipur', station: 'UDAIPUR', isExStation: false },
  'GKMUKHIYA': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Gitanjali Hospital, Udaipur', station: 'UDAIPUR', isExStation: false },
  'RAHULSEHLOT': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'at geetanjali hospital', station: 'UDAIPUR', isExStation: false },
  'VINODMEHTA': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Geetanjali (Thu, Fri | 01:00 PM – 03:30 PM)', station: 'UDAIPUR', isExStation: false },
  'VINODBOKADIA': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Geetanjali Hospital & Sec 6', station: 'UDAIPUR', isExStation: false },
  'DILIPJAIN': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Gitanjali hospital', station: 'UDAIPUR', isExStation: false },
  'RAMESHPATEL': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Geetanjali Hospital, Udaipur', station: 'UDAIPUR', isExStation: false },
  'SANJAYGANDHI': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Gitanjali Hospital, Udaipur', station: 'UDAIPUR', isExStation: false },
  'NEHASHARMA': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'g6 pharmacy / Geetanjali', station: 'UDAIPUR', isExStation: false },
  'ANUBHAVBANSAL': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Geetanjali', station: 'UDAIPUR', isExStation: false },
  'GOURAVKUMARMITTAL': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'Geetanjali', station: 'UDAIPUR', isExStation: false },
  'GORANGUPADHYAY': { primaryHospital: 'Geetanjali Hospital', area: 'Geetanjali Hospital', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['THU', 'FRI'], notes: 'gmch', station: 'UDAIPUR', isExStation: false },

  // GBH American Bedwas (Fri, Sat | 01:30 PM)
  'DANNYKUMARMANGLANI': { primaryHospital: 'GBH American Bedwas', area: 'GBH American Bedwas', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['FRI', 'SAT'], notes: 'GBH Bedwas (Fri, Sat | 01:00 PM – 03:00 PM)', station: 'UDAIPUR', isExStation: false },
  'DENY': { primaryHospital: 'GBH American Bedwas', area: 'GBH American Bedwas', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['FRI', 'SAT'], notes: 'GBH Bedwas (Fri, Sat | 01:00 PM – 03:00 PM)', station: 'UDAIPUR', isExStation: false },
  'KAPILBHARGAV': { primaryHospital: 'GBH American Bedwas', area: 'GBH American Bedwas', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['FRI', 'SAT'], notes: 'GBH Bedwas (Fri, Sat | 01:00 PM – 03:00 PM)', station: 'UDAIPUR', isExStation: false },
  'PRIYANKAMINOCHA': { primaryHospital: 'GBH American Bedwas', area: 'GBH American Bedwas', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['FRI', 'SAT'], notes: 'gbh hospital udaipur', station: 'UDAIPUR', isExStation: false },
  'PARTHVYAS': { primaryHospital: 'GBH American Bedwas', area: 'GBH American Bedwas', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['FRI', 'SAT'], notes: 'gbh bedwas', station: 'UDAIPUR', isExStation: false },
  'JITESHAGRAWAL': { primaryHospital: 'GBH American Bedwas', area: 'GBH American Bedwas', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['FRI', 'SAT'], notes: 'gbh BEDWAS', station: 'UDAIPUR', isExStation: false },
  'RAJENDRASAMAR': { primaryHospital: 'GBH American Bedwas', area: 'GBH American Bedwas', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['FRI', 'SAT'], notes: 'GBH Bedwas', station: 'UDAIPUR', isExStation: false },
  'RAJENDRAKUMARSAMAR': { primaryHospital: 'GBH American Bedwas', area: 'GBH American Bedwas', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['FRI', 'SAT'], notes: 'GBH Bedwas', station: 'UDAIPUR', isExStation: false },
  'ASHWINISHANBHAG': { primaryHospital: 'GBH American Bedwas', area: 'GBH American Bedwas', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['FRI', 'SAT'], notes: 'gbh bedwas', station: 'UDAIPUR', isExStation: false },
  'HARBEERSINGHCHHABRA': { primaryHospital: 'GBH American Bedwas', area: 'GBH American Bedwas', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['FRI', 'SAT'], notes: 'GBH Bedwas', station: 'UDAIPUR', isExStation: false },
  'HARBEERSINGH': { primaryHospital: 'GBH American Bedwas', area: 'GBH American Bedwas', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['FRI', 'SAT'], notes: 'GBH Bedwas', station: 'UDAIPUR', isExStation: false },
  'MAHESHDESAI': { primaryHospital: 'GBH American Bedwas', area: 'GBH American Bedwas', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['FRI', 'SAT'], notes: 'gbh bedwas', station: 'UDAIPUR', isExStation: false },
  'MUKESHBARJATIYA': { primaryHospital: 'GBH American Bedwas', area: 'GBH American Bedwas', approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', availableDays: ['FRI', 'SAT'], notes: 'GBH Bedwas', station: 'UDAIPUR', isExStation: false },

  // GBH American City (11:30 AM)
  'PRERNABAHETI': { primaryHospital: 'GBH American City', area: 'GBH American City', approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', notes: 'Gbh American hospital / City', station: 'UDAIPUR', isExStation: false },
  'NAMANNTANEJA': { primaryHospital: 'GBH American City', area: 'GBH American City', approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', notes: 'gbh hospital city', station: 'UDAIPUR', isExStation: false },
  'RAVIRAYSINGHAHADA': { primaryHospital: 'GBH American City', area: 'GBH American City', approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', notes: 'gbh city', station: 'UDAIPUR', isExStation: false },
  'RAVIRAJ': { primaryHospital: 'GBH American City', area: 'GBH American City', approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', notes: 'gbh city', station: 'UDAIPUR', isExStation: false },

  // PIMS City (12:00 PM)
  'HITESH': { primaryHospital: 'PIMS City', area: 'PIMS City', approxTime: '12:00 PM', hour: 12, minute: 0, period: 'PM', notes: 'PIMS City (12:00 PM)', station: 'UDAIPUR', isExStation: false },
  'HITESH YADAV': { primaryHospital: 'PIMS City', area: 'PIMS City', approxTime: '12:00 PM', hour: 12, minute: 0, period: 'PM', notes: 'PIMS City (12:00 PM)', station: 'UDAIPUR', isExStation: false },

  // PMCH Bedla (Tue, Fri | 11:30 AM)
  'SABOHRA': { primaryHospital: 'PMCH Bedla', area: 'PMCH Bedla', approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', availableDays: ['TUE', 'FRI'], notes: 'PACIFIC BEDLA (Tue, Fri | 11:00 AM – 01:00 PM)', station: 'UDAIPUR', isExStation: false },
  'JAGDISHVISHNOI': { primaryHospital: 'PMCH Bedla', area: 'PMCH Bedla', approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', availableDays: ['TUE', 'FRI'], notes: 'PMCH Bedla (Tue, Fri | 11:00 AM – 01:00 PM)', station: 'UDAIPUR', isExStation: false },
  'RKSHARMA': { primaryHospital: 'PMCH Bedla', area: 'PMCH Bedla', approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', availableDays: ['TUE', 'FRI'], notes: 'PMCH Bedla', station: 'UDAIPUR', isExStation: false },
  'CPPUROHIT': { primaryHospital: 'PMCH Bedla', area: 'PMCH Bedla', approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', availableDays: ['TUE', 'FRI'], notes: 'PMCH Bedla', station: 'UDAIPUR', isExStation: false },
  'HARISHSANADHY': { primaryHospital: 'PMCH Bedla', area: 'PMCH Bedla', approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', availableDays: ['TUE', 'FRI'], notes: 'PMCH Bedla', station: 'UDAIPUR', isExStation: false },
  'RNLADHA': { primaryHospital: 'PMCH Bedla', area: 'PMCH Bedla', approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', availableDays: ['TUE', 'FRI'], notes: 'PMCH Bedla / Ladha Clinic', station: 'UDAIPUR', isExStation: false },
  'NILESHPATHIRA': { primaryHospital: 'PMCH Bedla', area: 'PMCH Bedla', approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', availableDays: ['TUE', 'FRI'], notes: 'Pacific hospital bedla', station: 'UDAIPUR', isExStation: false },
  'KAMLESHBHATT': { primaryHospital: 'PMCH Bedla', area: 'PMCH Bedla', approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', availableDays: ['TUE', 'FRI'], notes: 'Bedla pmch hospital', station: 'UDAIPUR', isExStation: false },

  // Bhopalpura (Evening 06:00 PM)
  'KCJAIN': { primaryHospital: 'Bhopalpura', area: 'Bhopalpura', approxTime: '06:00 PM', hour: 6, minute: 0, period: 'PM', notes: 'Bhopalpura Evening Clinic (06:00 PM)', station: 'UDAIPUR', isExStation: false },
  'DPSINGH': { primaryHospital: 'Bhopalpura', area: 'Bhopalpura', approxTime: '06:00 PM', hour: 6, minute: 0, period: 'PM', notes: 'Bhopalpura Evening Clinic (06:00 PM)', station: 'UDAIPUR', isExStation: false },
  'SANDEEPBHATNAGAR': { primaryHospital: 'Bhopalpura', area: 'Bhopalpura', approxTime: '06:00 PM', hour: 6, minute: 0, period: 'PM', notes: 'Bhopalpura Evening Clinic (06:00 PM)', station: 'UDAIPUR', isExStation: false },
  'ABHISHEKKUMAR': { primaryHospital: 'Bhopalpura', area: 'Bhopalpura', approxTime: '06:00 PM', hour: 6, minute: 0, period: 'PM', notes: 'near dr salma Shah / Bhopalpura', station: 'UDAIPUR', isExStation: false },

  // Hospital Road (06:30 PM - 08:10 PM)
  'DEEPAKAAMETHA': { primaryHospital: 'Hospital Road', area: 'Hospital Road', approxTime: '08:10 PM', hour: 8, minute: 10, period: 'PM', notes: 'Hospital Road Clinic (08:10 PM Exact)', station: 'UDAIPUR', isExStation: false },
  'JCDEVPURA': { primaryHospital: 'Hospital Road', area: 'Hospital Road', approxTime: '06:30 PM', hour: 6, minute: 30, period: 'PM', notes: 'Hospital Road (06:30 PM - 07:00 PM)', station: 'UDAIPUR', isExStation: false },
  'MUKESHSHARMA': { primaryHospital: 'Hospital Road', area: 'Hospital Road', approxTime: '08:00 PM', hour: 8, minute: 0, period: 'PM', notes: 'Hospital Road (08:00 PM)', station: 'UDAIPUR', isExStation: false },
  'KAVITABADJATIYA': { primaryHospital: 'Hospital Road', area: 'Hospital Road', approxTime: '06:30 PM', hour: 6, minute: 30, period: 'PM', notes: 'Hospital Road Clinic', station: 'UDAIPUR', isExStation: false },
  'SAFDARHUSSAIN': { primaryHospital: 'Hospital Road', area: 'Hospital Road', approxTime: '06:30 PM', hour: 6, minute: 30, period: 'PM', notes: 'Hospital Road Clinic', station: 'UDAIPUR', isExStation: false },
  'MAHESHDAVE': { primaryHospital: 'Hospital Road', area: 'Hospital Road', approxTime: '06:30 PM', hour: 6, minute: 30, period: 'PM', notes: 'Hospital Road / Court Circle', station: 'UDAIPUR', isExStation: false },
  'RLMEENA': { primaryHospital: 'Hospital Road', area: 'Hospital Road', approxTime: '10:30 AM', hour: 10, minute: 30, period: 'AM', notes: 'MB HOSPITAL Road', station: 'UDAIPUR', isExStation: false },
  'ASHWINPATIDAR': { primaryHospital: 'Hospital Road', area: 'Hospital Road', approxTime: '10:30 AM', hour: 10, minute: 30, period: 'AM', notes: 'MB hospital', station: 'UDAIPUR', isExStation: false },

  // Shobhagpura (06:30 PM)
  'ABHAYJAIN': { primaryHospital: 'Shobhagpura', area: 'Shobhagpura', approxTime: '06:30 PM', hour: 6, minute: 30, period: 'PM', notes: 'Shobhagpura (06:30 PM)', station: 'UDAIPUR', isExStation: false },
  'MANISHKULSHERT': { primaryHospital: 'Shobhagpura', area: 'Shobhagpura', approxTime: '06:30 PM', hour: 6, minute: 30, period: 'PM', notes: 'Shobhagpura (06:00 PM - 07:00 PM)', station: 'UDAIPUR', isExStation: false },

  // Mallatalai (07:00 PM - 08:00 PM)
  'SANDEEPKANSARA': { primaryHospital: 'Mallatalai', area: 'Mallatalai', approxTime: '07:00 PM', hour: 7, minute: 0, period: 'PM', notes: 'Mallatalai Clinic (07:00 PM)', station: 'UDAIPUR', isExStation: false },
  'SKKUASHIK': { primaryHospital: 'Mallatalai', area: 'Mallatalai', approxTime: '08:00 PM', hour: 8, minute: 0, period: 'PM', notes: 'Mallatalai Clinic (08:00 PM)', station: 'UDAIPUR', isExStation: false },
  'SKKAUSHIQ': { primaryHospital: 'Mallatalai', area: 'Mallatalai', approxTime: '08:00 PM', hour: 8, minute: 0, period: 'PM', notes: 'Mallatalai Clinic (08:00 PM)', station: 'UDAIPUR', isExStation: false },

  // Paras Hospital (Friday | 04:30 PM)
  'AMITKHANDELWAL': { primaryHospital: 'Paras Hospital', area: 'Paras Hospital', approxTime: '04:30 PM', hour: 4, minute: 30, period: 'PM', availableDays: ['FRI'], notes: 'Paras Hospital (Friday | 04:00 PM – 05:30 PM)', station: 'UDAIPUR', isExStation: false },
  'ASHUTOSHSONI': { primaryHospital: 'Paras Hospital', area: 'Paras Hospital', approxTime: '04:30 PM', hour: 4, minute: 30, period: 'PM', availableDays: ['FRI'], notes: 'PARAS JK HOSPITAL', station: 'UDAIPUR', isExStation: false },

  // Hindustan Zinc City & Debari
  'VINODKUMARRAI': { primaryHospital: 'Hindustan Zinc City', area: 'Hindustan Zinc City', approxTime: '11:00 AM', hour: 11, minute: 0, period: 'AM', notes: 'Zinc City Hospital (11:00 AM)', station: 'UDAIPUR', isExStation: false },
  'SURESHCHANDRA': { primaryHospital: 'Hindustan Zinc City', area: 'Hindustan Zinc City', approxTime: '11:00 AM', hour: 11, minute: 0, period: 'AM', notes: 'Hindustan Zinc clinic, Udaipur', station: 'UDAIPUR', isExStation: false },
  'SUMITSIROIYA': { primaryHospital: 'Hindustan Zinc Debari', area: 'Hindustan Zinc Debari', approxTime: '12:00 PM', hour: 12, minute: 0, period: 'PM', notes: 'Zinc Debari (12:00 PM) & Hiran Magri Evening', station: 'UDAIPUR', isExStation: false },

  // Hiran Magri
  'PARASJAIN': { primaryHospital: 'Hiran Magri', area: 'Hiran Magri', approxTime: '07:30 PM', hour: 7, minute: 30, period: 'PM', notes: 'Hiran Magri Evening Clinic (07:30 PM)', station: 'UDAIPUR', isExStation: false },

  // Shikarwadi
  'AKVATS': { primaryHospital: 'Shikarwadi', area: 'Shikarwadi', approxTime: '05:00 PM', hour: 5, minute: 0, period: 'PM', availableDays: ['WED', 'THU'], notes: 'Shikarwadi (Wed, Thu | 05:00 PM)', station: 'UDAIPUR', isExStation: false },

  // PMCH Umarda
  'MAHESHJAIN': { primaryHospital: 'PMCH Umarda', area: 'PMCH Umarda', approxTime: '11:00 AM', hour: 11, minute: 0, period: 'AM', notes: 'pmch umarda', station: 'UDAIPUR', isExStation: false },

  // Dhanmandi
  'PRATIBHACHOUDHURY': { primaryHospital: 'Dhanmandi', area: 'Dhanmandi', approxTime: '10:00 AM', hour: 10, minute: 0, period: 'AM', notes: 'Dhanmandi Clinic', station: 'UDAIPUR', isExStation: false },

  // Ananta Hospital
  'YOGENDRASINGHRANAWAT': { primaryHospital: 'Ananta Hospital', area: 'Ananta Hospital', approxTime: '11:00 AM', hour: 11, minute: 0, period: 'AM', notes: 'Ananta hospital', station: 'UDAIPUR', isExStation: false },

  // 🚌 DUNGARPUR EX-STATION
  'KNDAS': { primaryHospital: 'Dungarpur', area: 'Dungarpur', station: 'Dungarpur', isExStation: true, approxTime: '10:00 AM', hour: 10, minute: 0, period: 'AM', notes: 'Dungarpur Ex-Station Day' },
  'JAYESHGANDHI': { primaryHospital: 'Dungarpur', area: 'Dungarpur', station: 'Dungarpur', isExStation: true, approxTime: '10:30 AM', hour: 10, minute: 30, period: 'AM', notes: 'Dungarpur Ex-Station Day' },
  'RAHULPANCHAL': { primaryHospital: 'Dungarpur', area: 'Dungarpur', station: 'Dungarpur', isExStation: true, approxTime: '11:00 AM', hour: 11, minute: 0, period: 'AM', notes: 'Dungarpur Ex-Station Day' },
  'CHIRAGRATHOR': { primaryHospital: 'Dungarpur', area: 'Dungarpur', station: 'Dungarpur', isExStation: true, approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', notes: 'Dungarpur Ex-Station Day' },
  'RAJESHSIROIYA': { primaryHospital: 'Dungarpur', area: 'Dungarpur', station: 'Dungarpur', isExStation: true, approxTime: '12:00 PM', hour: 12, minute: 0, period: 'PM', notes: 'Dungarpur Ex-Station Day' },
  'KANTILALMEGWAL': { primaryHospital: 'Dungarpur', area: 'Dungarpur', station: 'Dungarpur', isExStation: true, approxTime: '12:30 PM', hour: 12, minute: 30, period: 'PM', notes: 'Dungarpur Ex-Station Day' },
  'PINTUAAHARI': { primaryHospital: 'Dungarpur', area: 'Dungarpur', station: 'Dungarpur', isExStation: true, approxTime: '01:00 PM', hour: 1, minute: 0, period: 'PM', notes: 'Dungarpur Ex-Station Day' },
  'PRAVEENJAIN': { primaryHospital: 'Dungarpur', area: 'Dungarpur', station: 'Dungarpur', isExStation: true, approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', notes: 'disha hospital Dungarpur' },
  'RAKESHMEENA': { primaryHospital: 'Dungarpur', area: 'Dungarpur', station: 'Dungarpur', isExStation: true, approxTime: '02:00 PM', hour: 2, minute: 0, period: 'PM', notes: 'near manglam medical Dungarpur' },

  // 🚌 BANSWARA EX-STATION
  'RKMALOT': { primaryHospital: 'Banswara', area: 'Banswara', station: 'Banswara', isExStation: true, approxTime: '10:00 AM', hour: 10, minute: 0, period: 'AM', notes: 'Banswara Ex-Station Day' },
  'KIRITGANDHI': { primaryHospital: 'Banswara', area: 'Banswara', station: 'Banswara', isExStation: true, approxTime: '10:30 AM', hour: 10, minute: 30, period: 'AM', notes: 'Banswara Ex-Station Day' },
  'NAVNEETPATEL': { primaryHospital: 'Banswara', area: 'Banswara', station: 'Banswara', isExStation: true, approxTime: '11:00 AM', hour: 11, minute: 0, period: 'AM', notes: 'Banswara Ex-Station Day' },
  'JIMESHPANDIYA': { primaryHospital: 'Banswara', area: 'Banswara', station: 'Banswara', isExStation: true, approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', notes: 'Banswara Ex-Station Day' },
  'HARISHCHARPOTA': { primaryHospital: 'Banswara', area: 'Banswara', station: 'Banswara', isExStation: true, approxTime: '12:00 PM', hour: 12, minute: 0, period: 'PM', notes: 'Banswara Mohan colony' },
  'MAYANKSHARMA': { primaryHospital: 'Banswara', area: 'Banswara', station: 'Banswara', isExStation: true, approxTime: '12:30 PM', hour: 12, minute: 30, period: 'PM', notes: 'Banswara Ex-Station Day' },
  'DEEPAKATARA': { primaryHospital: 'Banswara', area: 'Banswara', station: 'Banswara', isExStation: true, approxTime: '01:00 PM', hour: 1, minute: 0, period: 'PM', notes: 'mahatama Gandhi hospital Banswara' },
  'YASHSHAH': { primaryHospital: 'Banswara', area: 'Banswara', station: 'Banswara', isExStation: true, approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', notes: 'zeal hospital Banswara' },
  'BIPINCHANDRA': { primaryHospital: 'Banswara', area: 'Banswara', station: 'Banswara', isExStation: true, approxTime: '02:00 PM', hour: 2, minute: 0, period: 'PM', notes: 'rhythm hospital Banswara' },
  'SAMARTHPATEL': { primaryHospital: 'Banswara', area: 'Banswara', station: 'Banswara', isExStation: true, approxTime: '02:30 PM', hour: 2, minute: 30, period: 'PM', notes: 'rhythm hospital Banswara' },

  // 🚌 CHITTORGARH EX-STATION
  'LALITJAINANI': { primaryHospital: 'Chittorgarh', area: 'Chittorgarh', station: 'Chittorgarh', isExStation: true, approxTime: '10:00 AM', hour: 10, minute: 0, period: 'AM', notes: 'Chittorgarh Ex-Station Day' },
  'MADHUPBAXI': { primaryHospital: 'Chittorgarh', area: 'Chittorgarh', station: 'Chittorgarh', isExStation: true, approxTime: '10:30 AM', hour: 10, minute: 30, period: 'AM', notes: 'Chittorgarh Ex-Station Day' },
  'ANISHJAIN': { primaryHospital: 'Chittorgarh', area: 'Chittorgarh', station: 'Chittorgarh', isExStation: true, approxTime: '11:00 AM', hour: 11, minute: 0, period: 'AM', notes: 'Chittorgarh Ex-Station Day' },
  'SHUSHILCHOUHAN': { primaryHospital: 'Chittorgarh', area: 'Chittorgarh', station: 'Chittorgarh', isExStation: true, approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', notes: 'Chittorgarh Ex-Station Day' },
  'SANDEEPCHANDOLIYA': { primaryHospital: 'Chittorgarh', area: 'Chittorgarh', station: 'Chittorgarh', isExStation: true, approxTime: '12:00 PM', hour: 12, minute: 0, period: 'PM', notes: 'Pratap circle Chittorgarh' },
  'VKRAMCHANDANI': { primaryHospital: 'Chittorgarh', area: 'Chittorgarh', station: 'Chittorgarh', isExStation: true, approxTime: '12:30 PM', hour: 12, minute: 30, period: 'PM', notes: 'Dr vk Ramchandani clinic' },
  'JAYPRAKASHKULDEEP': { primaryHospital: 'Chittorgarh', area: 'Chittorgarh', station: 'Chittorgarh', isExStation: true, approxTime: '01:00 PM', hour: 1, minute: 0, period: 'PM', notes: 'Chittorgarh Ex-Station Day' },
  'JLPUNGALIA': { primaryHospital: 'Chittorgarh', area: 'Chittorgarh', station: 'Chittorgarh', isExStation: true, approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', notes: 'Chittorgarh Clinic' },

  // 🚌 RAJSAMAND EX-STATION
  'SUNILUPADHAY': { primaryHospital: 'Rajsamand', area: 'Rajsamand', station: 'Rajsamand', isExStation: true, approxTime: '10:00 AM', hour: 10, minute: 0, period: 'AM', notes: 'Rajsamand Ex-Station Day' },
  'ANMOLPAGARIYA': { primaryHospital: 'Rajsamand', area: 'Rajsamand', station: 'Rajsamand', isExStation: true, approxTime: '10:30 AM', hour: 10, minute: 30, period: 'AM', notes: 'Rajsamand Ex-Station Day' },
  'BHUPESHPARTANI': { primaryHospital: 'Rajsamand', area: 'Rajsamand', station: 'Rajsamand', isExStation: true, approxTime: '11:00 AM', hour: 11, minute: 0, period: 'AM', notes: 'Rajsamand Ex-Station Day' },
  'KRIPASHANKAR': { primaryHospital: 'Rajsamand', area: 'Rajsamand', station: 'Rajsamand', isExStation: true, approxTime: '11:30 AM', hour: 11, minute: 30, period: 'AM', notes: 'Rajsamand Ex-Station Day' },
  'HCSONI': { primaryHospital: 'Rajsamand', area: 'Rajsamand', station: 'Rajsamand', isExStation: true, approxTime: '12:00 PM', hour: 12, minute: 0, period: 'PM', notes: 'Rajsamand Ex-Station Day' },
  'MKMEENA': { primaryHospital: 'Rajsamand', area: 'Rajsamand', station: 'Rajsamand', isExStation: true, approxTime: '12:30 PM', hour: 12, minute: 30, period: 'PM', notes: 'Rajsamand Ex-Station Day' },
  'MVIJAYVARGIY': { primaryHospital: 'Rajsamand', area: 'Rajsamand', station: 'Rajsamand', isExStation: true, approxTime: '01:00 PM', hour: 1, minute: 0, period: 'PM', notes: 'Near rk hospital, Rajsamand' },
  'MANISHKHANDELWAL': { primaryHospital: 'Rajsamand', area: 'Rajsamand', station: 'Rajsamand', isExStation: true, approxTime: '01:30 PM', hour: 1, minute: 30, period: 'PM', notes: 'Near rk hospital, Rajsamand' },
  'BLKUMAWAT': { primaryHospital: 'Rajsamand', area: 'Rajsamand', station: 'Rajsamand', isExStation: true, approxTime: '02:00 PM', hour: 2, minute: 0, period: 'PM', notes: 'Rajsamand Ex-Station Day' },
  'SATISHCHOUDHARY': { primaryHospital: 'Rajsamand', area: 'Rajsamand', station: 'Rajsamand', isExStation: true, approxTime: '02:30 PM', hour: 2, minute: 30, period: 'PM', notes: 'Nathdwara Clinic' },
  'SHRAVANKUMARMEENA': { primaryHospital: 'Rajsamand', area: 'Rajsamand', station: 'Rajsamand', isExStation: true, approxTime: '03:00 PM', hour: 3, minute: 0, period: 'PM', notes: 'Pacific Bedla / Rajsamand' },
  'RAVIKUMARMANGLANI': { primaryHospital: 'Rajsamand', area: 'Rajsamand', station: 'Rajsamand', isExStation: true, approxTime: '03:30 PM', hour: 3, minute: 30, period: 'PM', notes: 'GBH Hospital / Rajsamand' }
};

export class DailyWorkingStore {
  public profiles: Record<number, DoctorFieldProfile>;
  public dayPlans: Record<string, DayPlanRecord>;

  constructor() {
    this.profiles = this.loadProfiles();
    this.dayPlans = this.loadDayPlans();
  }

  public getRealLastVisitDate(docSrNo: number, targetDateStr: string, doctorName?: string): { lastDate: string; daysAgo: number } {
    let targetTime: number;
    try {
      const parts = targetDateStr.split('/').map(Number);
      targetTime = new Date(parts[2], parts[1] - 1, parts[0]).getTime();
    } catch {
      targetTime = new Date().getTime();
    }

    let allMsl: any[] = [];
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dios_msl_schedule_permanent_v5');
        if (saved) allMsl = JSON.parse(saved);
      }
    } catch (e) {}

    const targetClean = cleanName(doctorName || (this.profiles[docSrNo] ? this.profiles[docSrNo].doctorName : ''));
    
    let doc = allMsl.find(d => cleanName(d.doctorName) === targetClean);
    if (!doc && targetClean.length > 3) {
      doc = allMsl.find(d => cleanName(d.doctorName).includes(targetClean) || targetClean.includes(cleanName(d.doctorName)));
    }
    if (!doc) {
      doc = allMsl.find(d => d.srNo === docSrNo);
    }

    const foundDates: Date[] = [];

    if (doc) {
      MONTH_KEYS_ORDER.forEach(mCfg => {
        const rawVal = String(doc[mCfg.key] || '');
        if (rawVal && rawVal.trim().length > 0 && rawVal !== '-' && rawVal.toLowerCase() !== 'na') {
          const matches = rawVal.match(/\b([1-9]|[12]\d|3[01])\b/g);
          if (matches) {
            matches.forEach(mStr => {
              const dayNum = parseInt(mStr, 10);
              if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
                const visitD = new Date(mCfg.year, mCfg.monthIdx, dayNum);
                if (visitD.getTime() <= targetTime) {
                  foundDates.push(visitD);
                }
              }
            });
          }
        }
      });
    }

    try {
      if (typeof window !== 'undefined' && targetClean) {
        const rawCalls = localStorage.getItem('dios_call_status_master_doctors_v4');
        if (rawCalls) {
          const parsedCalls = JSON.parse(rawCalls);
          if (Array.isArray(parsedCalls)) {
            parsedCalls.forEach((call: any) => {
              if (call.docName && cleanName(call.docName) === targetClean && call.date && call.date.includes('/')) {
                const p = call.date.split('/').map(Number);
                if (p.length === 3) {
                  const callDate = new Date(p[2], p[1] - 1, p[0]);
                  if (callDate.getTime() <= targetTime) {
                    foundDates.push(callDate);
                  }
                }
              }
            });
          }
        }
      }
    } catch (e) {}

    if (foundDates.length > 0) {
      foundDates.sort((a, b) => b.getTime() - a.getTime());
      const mostRecent = foundDates[0];
      const diffDays = Math.max(0, Math.floor((targetTime - mostRecent.getTime()) / (1000 * 60 * 60 * 24)));
      const dd = String(mostRecent.getDate()).padStart(2, '0');
      const mm = String(mostRecent.getMonth() + 1).padStart(2, '0');
      const yyyy = mostRecent.getFullYear();
      return { lastDate: `${dd}/${mm}/${yyyy}`, daysAgo: diffDays };
    }

    return { lastDate: 'No Prior Visit', daysAgo: 99 };
  }

  // 🌟 BUILD FIELD PROFILE FOR ANY MSL DOCTOR
  public buildFieldProfile(mslDoc: any): DoctorFieldProfile {
    const c = cleanName(mslDoc.doctorName);
    const hasAct = !!(mslDoc.activityType && mslDoc.activityType.trim() !== '-');

    // Default Baseline
    let base: DoctorFieldProfile = {
      srNo: mslDoc.srNo,
      doctorName: mslDoc.doctorName,
      speciality: mslDoc.speciality || 'CONSULTANT',
      activityType: mslDoc.activityType || '',
      primaryHospital: 'Hospital Road',
      area: 'Hospital Road',
      approxTime: '06:30 PM',
      hour: 6,
      minute: 30,
      period: 'PM',
      availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      notes: 'Hospital Road Clinic',
      isExStation: false,
      station: 'UDAIPUR',
      monthlyTargetVisits: hasAct ? 4 : 1
    };

    // Apply specific hospital override matching
    for (const [keyPattern, overrideObj] of Object.entries(DOCTOR_SCHEDULE_OVERRIDES)) {
      if (c.includes(keyPattern) || keyPattern.includes(c)) {
        base = { ...base, ...overrideObj };
        break;
      }
    }

    return base;
  }

  // 🌟 LOAD PROFILES: DIRECTLY DRIVEN BY SHEET 14 MSL (NO HARDCODED 130 ARRAYS!)
  public loadProfiles(): Record<number, DoctorFieldProfile> {
    let savedProfiles: Record<number, DoctorFieldProfile> = {};
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
        if (raw) savedProfiles = JSON.parse(raw);
      }
    } catch (e) {}

    // Pull directly from Sheet 14 MSL
    let allMsl: any[] = [];
    try {
      if (typeof window !== 'undefined') {
        const savedMsl = localStorage.getItem('dios_msl_schedule_permanent_v5');
        if (savedMsl) allMsl = JSON.parse(savedMsl);
      }
    } catch (e) {}

    if (allMsl.length === 0) {
      allMsl = MASTER_123_MSL_DOCTORS;
    }

    const liveProfiles: Record<number, DoctorFieldProfile> = {};

    allMsl.forEach(mslDoc => {
      const existing = savedProfiles[mslDoc.srNo];

      if (existing) {
        // Update live fields from MSL while preserving user's customized hospital / time
        liveProfiles[mslDoc.srNo] = {
          ...existing,
          doctorName: mslDoc.doctorName,
          speciality: mslDoc.speciality || existing.speciality,
          activityType: mslDoc.activityType !== undefined ? mslDoc.activityType : existing.activityType,
          monthlyTargetVisits: (mslDoc.activityType && mslDoc.activityType.trim() !== '-') ? 4 : existing.monthlyTargetVisits
        };
      } else {
        liveProfiles[mslDoc.srNo] = this.buildFieldProfile(mslDoc);
      }
    });

    return liveProfiles;
  }

  public loadDayPlans(): Record<string, DayPlanRecord> {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(DAY_PLANS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return {};
  }

  public getAllSavedPlansList(): DayPlanRecord[] {
    const plans = Object.values(this.dayPlans);
    return plans.sort((a, b) => {
      const pA = a.date.split('/').map(Number);
      const pB = b.date.split('/').map(Number);
      const tA = new Date(pA[2], pA[1] - 1, pA[0]).getTime();
      const tB = new Date(pB[2], pB[1] - 1, pB[0]).getTime();
      return tB - tA;
    });
  }

  public saveProfiles(updated: Record<number, DoctorFieldProfile>) {
    this.profiles = updated;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {}
  }

  public saveDayPlan(plan: DayPlanRecord) {
    this.dayPlans[plan.date] = plan;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(DAY_PLANS_STORAGE_KEY, JSON.stringify(this.dayPlans));
        // Auto-sync to Cloudflare KV in background
        fetch('/api/cloud-storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'field/daily_working_system_v9',
            data: {
              profiles: this.profiles,
              dayPlans: this.dayPlans,
              selectedDateStr: plan.date,
              selectedAreas: plan.selectedAreas
            },
            device: 'iPad Safari AutoSync'
          })
        }).catch(() => {});
      }
    } catch (e) {}
  }

  public getPlanForDate(dateStr: string): DayPlanRecord | undefined {
    return this.dayPlans[dateStr];
  }

  public deleteDayPlan(dateStr: string) {
    delete this.dayPlans[dateStr];
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(DAY_PLANS_STORAGE_KEY, JSON.stringify(this.dayPlans));
      }
    } catch (e) {}
  }

  // 🌟 PULL DIRECT FROM SHEET 14 MSL SCHEDULE & REBUILD ALL PROFILES
  public syncFromMslSheet(): { synced: number; added: number; total: number } {
    let allMsl: any[] = [];
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dios_msl_schedule_permanent_v5');
        if (saved) allMsl = JSON.parse(saved);
      }
    } catch (e) {}

    if (allMsl.length === 0) {
      allMsl = MASTER_123_MSL_DOCTORS;
    }

    const rebuiltProfiles: Record<number, DoctorFieldProfile> = {};
    let synced = 0;
    let added = 0;

    allMsl.forEach(mslDoc => {
      const existing = this.profiles[mslDoc.srNo];
      if (existing) {
        rebuiltProfiles[mslDoc.srNo] = {
          ...existing,
          doctorName: mslDoc.doctorName,
          speciality: mslDoc.speciality || existing.speciality,
          activityType: mslDoc.activityType !== undefined ? mslDoc.activityType : existing.activityType,
          monthlyTargetVisits: (mslDoc.activityType && mslDoc.activityType.trim() !== '-') ? 4 : existing.monthlyTargetVisits
        };
        synced++;
      } else {
        rebuiltProfiles[mslDoc.srNo] = this.buildFieldProfile(mslDoc);
        added++;
      }
    });

    this.profiles = rebuiltProfiles;
    this.saveProfiles(this.profiles);
    return { synced, added, total: Object.keys(this.profiles).length };
  }
}

export const dailyWorkingStore = new DailyWorkingStore();
