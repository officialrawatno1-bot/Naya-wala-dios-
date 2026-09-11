import { CBO_MASTER_130_DOCTORS, CboDoctorMaster } from './cboMasterDoctors';
import { memoryStore } from './memoryStore';

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

export const TIME_SLOTS_MASTER = [
  '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
  '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM',
  '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM',
  '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:10 PM', '08:30 PM'
];

// 🌟 UNIVERSAL STATION NORMALIZER (Solves Rajasmand/Rajsamand, Chitor/Chittorgarh, Banswada/Banswara variations)
export const normalizeStationName = (st: string): 'UDAIPUR' | 'BANSWARA' | 'DUNGARPUR' | 'CHITTORGARH' | 'RAJASMAND' => {
  const s = (st || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (s.includes('RAJAS') || s.includes('RAJSAM') || s.includes('KANKROLI') || s.includes('NATHDWARA')) return 'RAJASMAND';
  if (s.includes('CHITOR') || s.includes('CHITTOR') || s.includes('NIMBAHERA')) return 'CHITTORGARH';
  if (s.includes('DUNGAR') || s.includes('SAGWARA')) return 'DUNGARPUR';
  if (s.includes('BANSWA') || s.includes('GHATOL')) return 'BANSWARA';
  return 'UDAIPUR';
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

const cleanName = (s: string) => (s || '').toUpperCase().replace(/^(DR\.?|DR\s+)/i, '').replace(/[^A-Z]/g, '');

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

export class DailyWorkingStore {
  public profiles: Record<number, DoctorFieldProfile>;
  public dayPlans: Record<string, DayPlanRecord>;

  constructor() {
    this.profiles = this.loadProfiles();
    this.dayPlans = this.loadDayPlans();
  }

  public getRealLastVisitDate(docSrNo: number, targetDateStr: string): { lastDate: string; daysAgo: number } {
    let targetTime: number;
    try {
      const parts = targetDateStr.split('/').map(Number);
      targetTime = new Date(parts[2], parts[1] - 1, parts[0]).getTime();
    } catch {
      targetTime = new Date(2026, 7, 18).getTime();
    }

    let allMsl: any[] = [];
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dios_msl_schedule_permanent_v5');
        if (saved) allMsl = JSON.parse(saved);
      }
    } catch (e) {}

    const doc = allMsl.find(d => d.srNo === docSrNo);
    const foundDates: Date[] = [];

    if (doc) {
      MONTH_KEYS_ORDER.forEach(mCfg => {
        const rawVal = String(doc[mCfg.key] || '');
        if (rawVal && rawVal.trim().length > 0 && rawVal !== '-' && rawVal !== 'na') {
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
      if (typeof window !== 'undefined' && doc) {
        const rawCalls = localStorage.getItem('dios_call_status_master_doctors_v4');
        if (rawCalls) {
          const parsedCalls = JSON.parse(rawCalls);
          if (Array.isArray(parsedCalls)) {
            const cleanDoc = cleanName(doc.doctorName);
            parsedCalls.forEach((call: any) => {
              if (call.docName && cleanName(call.docName) === cleanDoc && call.date && call.date.includes('/')) {
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

  public buildProfileForDoctor(doc: CboDoctorMaster, exIndex: number = 0): DoctorFieldProfile {
    const normStation = normalizeStationName(doc.station);
    const isEx = normStation !== 'UDAIPUR';
    const c = cleanName(doc.doctorName);

    let area = 'Hospital Road';
    let approxTime = '06:30 PM';
    let hour = 6;
    let minute = 30;
    let period: 'AM' | 'PM' = 'PM';
    let availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    let notes = doc.clinicAddress || 'Sitting';

    // 🚌 EX-HQ STATIONS: Explicitly set station and area to normalized station name
    if (isEx) {
      const stationDisplay = normStation.charAt(0) + normStation.slice(1).toLowerCase();
      area = stationDisplay; // 'Rajsamand', 'Chittorgarh', 'Dungarpur', 'Banswara'
      
      const baseHour = 10 + Math.floor((exIndex * 25) / 60);
      const baseMin = (exIndex * 25) % 60;
      const isPm = baseHour >= 12;
      const displayHour = baseHour > 12 ? baseHour - 12 : baseHour;

      hour = displayHour;
      minute = baseMin;
      period = isPm ? 'PM' : 'AM';
      approxTime = `${String(displayHour).padStart(2, '0')}:${String(baseMin).padStart(2, '0')} ${period}`;
      notes = `${stationDisplay} Ex-Station Day &bull; ${doc.clinicAddress || 'Clinic'}`;
    } 
    // 🏥 UDAIPUR HOSPITALS
    else {
      if (
        c.includes('ABHIJEETBASU') || c.includes('LALITSHREEMALI') || c.includes('RAVIMANGLIYA') || c.includes('RAVIMANGALIA') ||
        c.includes('AMEETMEHTA') || c.includes('NAVGEETMATHUR') || c.includes('MANUSHARMA') ||
        c.includes('JITENAJINGAR') || c.includes('SURAJGUPTA') || c.includes('GKMUKHIYA') ||
        c.includes('RAHULSEHLOT') || c.includes('VINODMEHTA') || c.includes('VINODBOKADIA') ||
        c.includes('DILIPJAIN') || (c.includes('RAMESHPATEL') && doc.srNo === 32) ||
        c.includes('SANJAYGANDHI') || c.includes('NEHASHARMA')
      ) {
        area = 'Geetanjali Hospital'; approxTime = '01:30 PM'; hour = 1; minute = 30; period = 'PM';
        availableDays = ['THU', 'FRI']; notes = 'Geetanjali (Thu, Fri | 01:00 PM – 03:30 PM)';
      } else if (
        c.includes('DANNY') || c.includes('DENY') || c.includes('KAPILBHARGAV') ||
        c.includes('PRIYANKAMINOCHA') || c.includes('PARTH') || c.includes('JITESHAGRAWAL') ||
        c.includes('RAJENDRASAMAR') || c.includes('ASHWINISHANBHAG') || c.includes('HARBEERSINGH') ||
        c.includes('MAHESHDESAI') || (c.includes('MUKESHBARJATIYA') && doc.srNo === 31)
      ) {
        area = 'GBH American Bedwas'; approxTime = '01:30 PM'; hour = 1; minute = 30; period = 'PM';
        availableDays = ['FRI', 'SAT']; notes = 'GBH Bedwas (Fri, Sat | 01:00 PM – 03:00 PM)';
      } else if (
        c.includes('PRERNABAHETI') || c.includes('PANKAJTAPARIA') || c.includes('NAMANNTANEJA') ||
        c.includes('NAMAN') || c.includes('RAVIRAJ')
      ) {
        area = 'GBH American City'; approxTime = '11:30 AM'; hour = 11; minute = 30; period = 'AM';
        notes = 'GBH City Morning Visit';
      } else if (c.includes('HITESH') && doc.srNo === 71) {
        area = 'PIMS City'; approxTime = '12:00 PM'; hour = 12; minute = 0; period = 'PM';
        notes = 'PIMS City (12:00 PM)';
      } else if (
        c.includes('SABOHRA') || c.includes('JAGDISHVISHNOI') || c.includes('RKSHARMA') ||
        (c.includes('CPPUROHIT') && doc.srNo === 20) || c.includes('HARISHSANADHY') ||
        c.includes('SUNITA') || c.includes('RNLADHA') || c.includes('NILESHPATHIRA')
      ) {
        area = 'PMCH Bedla'; approxTime = '11:30 AM'; hour = 11; minute = 30; period = 'AM';
        availableDays = ['TUE', 'FRI']; notes = 'PMCH Bedla (Tue, Fri | 11:00 AM – 01:00 PM)';
      } else if (c.includes('KCJAIN') || c.includes('DPSINGH') || (c.includes('SANDEEPBHATNAGAR') && doc.srNo === 43)) {
        area = 'Bhopalpura'; approxTime = '06:00 PM'; hour = 6; minute = 0; period = 'PM';
        notes = 'Bhopalpura Evening Clinic (06:00 PM)';
      } else if (c.includes('DEEPAKAAMETHA')) {
        area = 'Hospital Road'; approxTime = '08:10 PM'; hour = 8; minute = 10; period = 'PM';
        notes = 'Hospital Road Clinic (08:10 PM Exact)';
      } else if (c.includes('JCDEVPURA')) {
        area = 'Hospital Road'; approxTime = '06:30 PM'; hour = 6; minute = 30; period = 'PM';
        notes = 'Hospital Road (06:30 PM - 07:00 PM)';
      } else if (c.includes('MUKESHSHARMA') && doc.srNo === 19) {
        area = 'Hospital Road'; approxTime = '08:00 PM'; hour = 8; minute = 0; period = 'PM';
        notes = 'Hospital Road (08:00 PM)';
      } else if (c.includes('ABHAYJAIN')) {
        area = 'Shobhagpura'; approxTime = '06:30 PM'; hour = 6; minute = 30; period = 'PM';
        notes = 'Shobhagpura (06:30 PM)';
      } else if (c.includes('MANISHKULSHERT') || c.includes('MANISHKULSHRESH')) {
        area = 'Shobhagpura'; approxTime = '06:30 PM'; hour = 6; minute = 30; period = 'PM';
        notes = 'Shobhagpura (06:00 PM - 07:00 PM)';
      } else if (c.includes('SANDEEPKANSARA')) {
        area = 'Mallatalai'; approxTime = '07:00 PM'; hour = 7; minute = 0; period = 'PM';
        notes = 'Mallatalai Clinic (07:00 PM)';
      } else if (c.includes('SKKUASHIK') || c.includes('SKKAUSHIQ')) {
        area = 'Mallatalai'; approxTime = '08:00 PM'; hour = 8; minute = 0; period = 'PM';
        notes = 'Mallatalai Clinic (08:00 PM)';
      } else if (c.includes('AMITKHANDELWAL') || c.includes('ASHUTOSHSONI')) {
        area = 'Paras Hospital'; approxTime = '04:30 PM'; hour = 4; minute = 30; period = 'PM';
        availableDays = ['FRI']; notes = 'Paras Hospital (Friday | 04:00 PM – 05:30 PM)';
      } else if (c.includes('SALMASHAH') || c.includes('ABHISHEKKUMAR') || c.includes('VINODKUMARRAI') || c.includes('VINODKRAI')) {
        area = 'Hindustan Zinc City'; approxTime = '11:00 AM'; hour = 11; minute = 0; period = 'AM';
        notes = 'Zinc City Hospital (11:00 AM)';
      } else if (c.includes('SUMITSIROIYA')) {
        area = 'Hindustan Zinc Debari'; approxTime = '12:00 PM'; hour = 12; minute = 0; period = 'PM';
        notes = 'Zinc Debari (12:00 PM) & Hiran Magri Evening';
      } else if (c.includes('PARASJAIN')) {
        area = 'Hiran Magri'; approxTime = '07:30 PM'; hour = 7; minute = 30; period = 'PM';
        notes = 'Hiran Magri Evening Clinic (07:30 PM)';
      } else if (c.includes('AKVATS')) {
        area = 'Shikarwadi'; approxTime = '05:00 PM'; hour = 5; minute = 0; period = 'PM';
        availableDays = ['WED', 'THU']; notes = 'Shikarwadi (Wed, Thu | 05:00 PM)';
      }
    }

    const hasAct = !!(doc.activityType && doc.activityType.trim() !== '-');

    return {
      srNo: doc.srNo,
      doctorName: doc.doctorName,
      speciality: doc.speciality,
      activityType: doc.activityType || '',
      primaryHospital: area,
      area: area,
      approxTime: approxTime,
      hour: hour,
      minute: minute,
      period: period,
      availableDays: availableDays,
      notes: notes,
      isExStation: isEx,
      station: isEx ? area : 'UDAIPUR',
      monthlyTargetVisits: (!isEx && hasAct) ? 4 : (hasAct ? 2 : 1)
    };
  }

  public loadProfiles(): Record<number, DoctorFieldProfile> {
    let savedProfiles: Record<number, DoctorFieldProfile> = {};

    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
        if (raw) savedProfiles = JSON.parse(raw);
      }
    } catch (e) {}

    const exCounts: Record<string, number> = { DUNGARPUR: 0, BANSWARA: 0, CHITTORGARH: 0, RAJSAMAND: 0 };

    CBO_MASTER_130_DOCTORS.forEach(doc => {
      const normStation = normalizeStationName(doc.station);
      let exIdx = 0;
      if (normStation !== 'UDAIPUR') {
        exIdx = exCounts[normStation] || 0;
        exCounts[normStation] = exIdx + 1;
      }

      if (!savedProfiles[doc.srNo]) {
        savedProfiles[doc.srNo] = this.buildProfileForDoctor(doc, exIdx);
      } else {
        const isEx = normStation !== 'UDAIPUR';
        const displayStation = normStation.charAt(0) + normStation.slice(1).toLowerCase();
        savedProfiles[doc.srNo].doctorName = doc.doctorName;
        savedProfiles[doc.srNo].station = isEx ? displayStation : 'UDAIPUR';
        savedProfiles[doc.srNo].isExStation = isEx;
        if (isEx) {
          savedProfiles[doc.srNo].area = displayStation;
          savedProfiles[doc.srNo].primaryHospital = displayStation;
        }
        savedProfiles[doc.srNo].speciality = doc.speciality;
        if (doc.activityType) savedProfiles[doc.srNo].activityType = doc.activityType;
      }
    });

    return savedProfiles;
  }

  private loadDayPlans(): Record<string, DayPlanRecord> {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(DAY_PLANS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return {};
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
      }
    } catch (e) {}
  }

  public getPlanForDate(dateStr: string): DayPlanRecord | undefined {
    return this.dayPlans[dateStr];
  }

  public syncFromMslSheet(): { synced: number; added: number; total: number } {
    let synced = 0;
    let added = 0;
    const exCounts: Record<string, number> = { DUNGARPUR: 0, BANSWARA: 0, CHITTORGARH: 0, RAJSAMAND: 0 };

    CBO_MASTER_130_DOCTORS.forEach(doc => {
      const normStation = normalizeStationName(doc.station);
      let exIdx = 0;
      if (normStation !== 'UDAIPUR') {
        exIdx = exCounts[normStation] || 0;
        exCounts[normStation] = exIdx + 1;
      }

      const isEx = normStation !== 'UDAIPUR';
      const displayStation = normStation.charAt(0) + normStation.slice(1).toLowerCase();

      if (this.profiles[doc.srNo]) {
        this.profiles[doc.srNo].doctorName = doc.doctorName;
        this.profiles[doc.srNo].station = isEx ? displayStation : 'UDAIPUR';
        this.profiles[doc.srNo].isExStation = isEx;
        if (isEx) {
          this.profiles[doc.srNo].area = displayStation;
          this.profiles[doc.srNo].primaryHospital = displayStation;
        }
        this.profiles[doc.srNo].speciality = doc.speciality;
        synced++;
      } else {
        this.profiles[doc.srNo] = this.buildProfileForDoctor(doc, exIdx);
        added++;
      }
    });

    this.saveProfiles(this.profiles);
    return { synced, added, total: Object.keys(this.profiles).length };
  }
}

export const dailyWorkingStore = new DailyWorkingStore();
