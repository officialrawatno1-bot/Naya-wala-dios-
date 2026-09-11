import { MASTER_123_MSL_DOCTORS } from '../components/review/MslSheet';
import { memoryStore, MslDoctor } from './memoryStore';

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

const PROFILES_STORAGE_KEY = 'dios_doctor_field_profiles_v7';
const DAY_PLANS_STORAGE_KEY = 'dios_daily_plans_v7';

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

  // 🌟 DYNAMIC SOURCE GETTER: Always fetches latest 129+ MSL doctors
  public getMslDoctorsList(): MslDoctor[] {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dios_msl_schedule_permanent_v5');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {}
    if (memoryStore.mslData && memoryStore.mslData.length > 0) return memoryStore.mslData;
    return MASTER_123_MSL_DOCTORS;
  }

  // 🌟 DYNAMIC REAL VISIT DATE PARSER (Regex + Date-Aware + Sheet 15 Call-Status Link)
  public getRealLastVisitDate(docSrNo: number, targetDateStr: string): { lastDate: string; daysAgo: number } {
    let targetTime: number;
    try {
      const parts = targetDateStr.split('/').map(Number);
      targetTime = new Date(parts[2], parts[1] - 1, parts[0]).getTime();
    } catch {
      targetTime = new Date(2026, 7, 18).getTime();
    }

    const allMsl = this.getMslDoctorsList();
    const doc = allMsl.find(d => d.srNo === docSrNo);
    const foundDates: Date[] = [];

    if (doc) {
      MONTH_KEYS_ORDER.forEach(mCfg => {
        const rawVal = String((doc as any)[mCfg.key] || '');
        if (rawVal && rawVal.trim().length > 0 && rawVal !== '-' && rawVal !== 'na') {
          // Robust Regex: Extract all numbers (1-31) even from strings like "out of Town ,21", "12,18,ntc", "appointment ,28"
          const matches = rawVal.match(/\b([1-9]|[12]\d|3[01])\b/g);
          if (matches) {
            matches.forEach(mStr => {
              const dayNum = parseInt(mStr, 10);
              if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
                const visitD = new Date(mCfg.year, mCfg.monthIdx, dayNum);
                // Only consider visits on or before target date
                if (visitD.getTime() <= targetTime) {
                  foundDates.push(visitD);
                }
              }
            });
          }
        }
      });
    }

    // Also check Sheet 15 (dios_call_status_master_doctors_v4) for live crawled calls
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

    // Verified date for Dr. Deepak Aametha (SrNo 32)
    if (docSrNo === 32) {
      const dJul22 = new Date(2026, 6, 22);
      if (dJul22.getTime() <= targetTime) foundDates.push(dJul22);
    }

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

  // 🌟 BUILD PROFILE ACCORDING TO YOUR EXACT HOSPITAL & DOCTOR MAPPING
  public buildProfileForDoctor(doc: MslDoctor): DoctorFieldProfile {
    const c = cleanName(doc.doctorName);

    let station = 'UDAIPUR';
    let isEx = false;
    let area = 'Hospital Road';
    let approxTime = '06:30 PM';
    let hour = 6;
    let minute = 30;
    let period: 'AM' | 'PM' = 'PM';
    let availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    let notes = 'Daily Sitting';

    // 1. Rajsamand: HC Soni, Anmol Pagariya, Kripa Shankar, Bhupesh Partani, MK Meena, Manish Khandelwal, M Vijayvargiy, Satish Choudhary, Sunil Upadhay
    if (
      c.includes('HCSONI') || c.includes('ANMOLPAGARIYA') || c.includes('KRIPASHANKAR') ||
      c.includes('BHUPESHPARTANI') || c.includes('MKMEENA') || c.includes('MANISHKHANDELWAL') ||
      c.includes('MVIJAYVARGIY') || c.includes('SATISHCHOUDHARY') || c.includes('SUNILUPADHAY')
    ) {
      station = 'Rajsamand'; area = 'Rajsamand'; isEx = true;
      approxTime = '11:30 AM'; hour = 11; minute = 30; period = 'AM';
      notes = 'Rajsamand Ex-Station Day';
    }
    // 2. Chittorgarh: Lalit Jainani, Anish Jain, Madhup Baxi, Shushil Chouhan, Sandeep Chandoliya, Anurag Jain, JL Pungliya
    else if (
      c.includes('LALITJAINANI') || c.includes('ANISHJAIN') || c.includes('MADHUPBAXI') ||
      c.includes('SHUSHILCHOUHAN') || c.includes('SANDEEPCHANDOLIYA') || c.includes('ANURAGJAIN') ||
      c.includes('JLPUNGLIYA') || c.includes('PUNGLIYA')
    ) {
      station = 'Chittorgarh'; area = 'Chittorgarh'; isEx = true;
      approxTime = '12:00 PM'; hour = 12; minute = 0; period = 'PM';
      notes = 'Chittorgarh Ex-Station Day';
    }
    // 3. Dungarpur: Pintu Aahari, Kanti Lal Megwal, Rajesh Siroiya, KN Das, Rahul Panchal
    else if (
      c.includes('PINTUAAHARI') || c.includes('KANTILALMEGWAL') || c.includes('RAJESHSIROIYA') ||
      c.includes('KNDAS') || (c.includes('RAHULPANCHAL') && doc.srNo === 17)
    ) {
      station = 'Dungarpur'; area = 'Dungarpur'; isEx = true;
      approxTime = '11:30 AM'; hour = 11; minute = 30; period = 'AM';
      notes = 'Dungarpur Ex-Station Day';
    }
    // 4. Banswara: Jimesh Pandya, Ashwin Patidar, Deepa Katara, Harish Charpota, Mayank Sharma, Navneet Patel Kiyda, Yash Shah
    else if (
      c.includes('JIMESHPANDYA') || c.includes('ASHWINPATIDAR') || c.includes('DEEPAKATARA') ||
      c.includes('HARISHCHARPOTA') || c.includes('MAYANKSHARMA') || c.includes('NAVNEETPATEL') ||
      c.includes('YASHSHAH')
    ) {
      station = 'Banswara'; area = 'Banswara'; isEx = true;
      approxTime = '12:00 PM'; hour = 12; minute = 0; period = 'PM';
      notes = 'Banswara Ex-Station Day (372 KM Rule)';
    }

    // 🏥 Geetanjali Hospital (Thu, Fri | 01:00 PM – 03:30 PM):
    else if (
      c.includes('ABHIJEETBASU') || c.includes('LALITSHREEMALI') || c.includes('RAVIMANGLIYA') || c.includes('RAVIMANGALIA') ||
      c.includes('AMEETMEHTA') || c.includes('NAVGEETMATHUR') || c.includes('MANUSHARMA') ||
      c.includes('JITENAJINGAR') || c.includes('SURAJGUPTA') || c.includes('GKMUKHIYA') ||
      c.includes('RAHULSEHLOT') || c.includes('VINODMEHTA') || c.includes('VINODBOKADIA') ||
      c.includes('DILIPJAIN') || (c.includes('RAMESHPATEL') && doc.srNo === 11) ||
      c.includes('SANJAYGANDHI') || c.includes('NEHASHARMA')
    ) {
      area = 'Geetanjali Hospital'; approxTime = '01:30 PM'; hour = 1; minute = 30; period = 'PM';
      availableDays = ['THU', 'FRI']; notes = 'Thu, Fri | 01:00 PM – 03:30 PM';
    }

    // 🏥 GBH American Bedwas (Fri, Sat | 01:00 PM – 03:00 PM):
    else if (
      c.includes('DENNY') || c.includes('DENY') || c.includes('KAPILBHARGAV') ||
      c.includes('PRIYANKAMINOCHA') || c.includes('PARTH') || c.includes('JITESHAGRAWAL') ||
      c.includes('RAJENDRASAMAR') || c.includes('ASHWINISHANBHAG') || c.includes('HARBEERSINGH') ||
      c.includes('MAHESHDESAI') || (c.includes('MUKESHBARJATIYA') && doc.srNo === 53)
    ) {
      area = 'GBH American Bedwas'; approxTime = '01:30 PM'; hour = 1; minute = 30; period = 'PM';
      availableDays = ['FRI', 'SAT']; notes = 'Fri, Sat | 01:00 PM – 03:00 PM';
    }

    // 🏥 GBH American City:
    else if (
      c.includes('PRERNABAHETI') || c.includes('PANKAJTAPARIA') || c.includes('NAMANNTANEJA') ||
      c.includes('NAMAN') || c.includes('RAVIRAJ')
    ) {
      area = 'GBH American City'; approxTime = '11:30 AM'; hour = 11; minute = 30; period = 'AM';
      availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']; notes = 'GBH City Morning Visit';
    }

    // 🏥 PIMS City: Hitesh Yadav (12:00 PM)
    else if (c.includes('HITESH') && doc.srNo === 24) {
      area = 'PIMS City'; approxTime = '12:00 PM'; hour = 12; minute = 0; period = 'PM';
      availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']; notes = 'PIMS City (12:00 PM) & Hospital Road Evening';
    }

    // 🏥 PMCH Bedla (Tue, Fri | 11:00 AM – 01:00 PM):
    else if (
      c.includes('SABOHRA') || c.includes('JAGDISHVISHNOI') || c.includes('RKSHARMA') ||
      (c.includes('CPPUROHIT') && doc.srNo === 34) || c.includes('HARISHSANADHY') ||
      c.includes('SUNITA') || c.includes('RNLADHA') || c.includes('NILESHPATHIRA')
    ) {
      area = 'PMCH Bedla'; approxTime = '11:30 AM'; hour = 11; minute = 30; period = 'AM';
      availableDays = ['TUE', 'FRI']; notes = 'Tue, Fri | 11:00 AM – 01:00 PM';
    }

    // 🏢 Bhopalpura: KC Jain, DP Singh, Mukesh Barjatiya, Sandeep Bhatnagar (06:00 PM)
    else if (c.includes('KCJAIN') || c.includes('DPSINGH') || (c.includes('SANDEEPBHATNAGAR') && doc.srNo === 16)) {
      area = 'Bhopalpura'; approxTime = '06:00 PM'; hour = 6; minute = 0; period = 'PM';
      availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']; notes = 'Bhopalpura Evening Clinic (06:00 PM)';
    }

    // 🏥 Hospital Road:
    else if (c.includes('DEEPAKAAMETHA')) {
      area = 'Hospital Road'; approxTime = '08:10 PM'; hour = 8; minute = 10; period = 'PM';
      notes = 'Hospital Road Clinic (08:10 PM Exact)';
    } else if (c.includes('JCDEVPURA')) {
      area = 'Hospital Road'; approxTime = '06:30 PM'; hour = 6; minute = 30; period = 'PM';
      notes = 'Hospital Road (06:30 PM - 07:00 PM)';
    } else if (c.includes('MUKESHSHARMA') && doc.srNo === 33) {
      area = 'Hospital Road'; approxTime = '08:00 PM'; hour = 8; minute = 0; period = 'PM';
      notes = 'Hospital Road (08:00 PM)';
    }

    // 🏢 Shobhagpura:
    else if (c.includes('ABHAYJAIN')) {
      area = 'Shobhagpura'; approxTime = '06:30 PM'; hour = 6; minute = 30; period = 'PM';
      notes = 'Shobhagpura (06:30 PM)';
    } else if (c.includes('MANISHKULSHERT') || c.includes('MANISHKULSHRESH')) {
      area = 'Shobhagpura'; approxTime = '06:30 PM'; hour = 6; minute = 30; period = 'PM';
      notes = 'Shobhagpura (06:00 PM - 07:00 PM)';
    }

    // 🏢 Mallatalai:
    else if (c.includes('SANDEEPKANSARA')) {
      area = 'Mallatalai'; approxTime = '07:00 PM'; hour = 7; minute = 0; period = 'PM';
      notes = 'Mallatalai Clinic (07:00 PM)';
    } else if (c.includes('SKKUASHIK') || c.includes('SKKAUSHIQ')) {
      area = 'Mallatalai'; approxTime = '08:00 PM'; hour = 8; minute = 0; period = 'PM';
      notes = 'Mallatalai Clinic (08:00 PM)';
    }

    // 🏥 Paras Hospital (Friday | 04:00 PM – 05:30 PM):
    else if (c.includes('AMITKHANDELWAL') || c.includes('ASHUTOSHSONI')) {
      area = 'Paras Hospital'; approxTime = '04:30 PM'; hour = 4; minute = 30; period = 'PM';
      availableDays = ['FRI']; notes = 'Paras Hospital (Friday | 04:00 PM – 05:30 PM)';
    }

    // 🏭 Hindustan Zinc City & Debari:
    else if (c.includes('SALMASHAH') || c.includes('ABHISHEKKUMAR') || c.includes('VINODKUMARRAI') || c.includes('VINODKRAI')) {
      area = 'Hindustan Zinc City'; approxTime = '11:00 AM'; hour = 11; minute = 0; period = 'AM';
      notes = 'Zinc City Hospital (11:00 AM)';
    } else if (c.includes('SUMITSIROIYA')) {
      area = 'Hindustan Zinc Debari'; approxTime = '12:00 PM'; hour = 12; minute = 0; period = 'PM';
      notes = 'Zinc Debari (12:00 PM) & Hiran Magri Evening';
    }

    // 🏢 Hiran Magri (07:30 PM):
    else if (c.includes('PARASJAIN')) {
      area = 'Hiran Magri'; approxTime = '07:30 PM'; hour = 7; minute = 30; period = 'PM';
      notes = 'Hiran Magri Evening Clinic (07:30 PM)';
    }

    // 🏥 Shikarwadi (Wed, Thu | 05:00 PM):
    else if (c.includes('AKVATS')) {
      area = 'Shikarwadi'; approxTime = '05:00 PM'; hour = 5; minute = 0; period = 'PM';
      availableDays = ['WED', 'THU']; notes = 'Shikarwadi (Wed, Thu | 05:00 PM)';
    }

    const hasAct = !!(doc.activityType && doc.activityType.trim() !== '-' && doc.activityType.trim() !== '');

    return {
      srNo: doc.srNo,
      doctorName: doc.doctorName,
      speciality: doc.speciality || 'CONSULTANT',
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
      station: station,
      monthlyTargetVisits: (!isEx && hasAct) ? 4 : (hasAct ? 2 : 1)
    };
  }

  public loadProfiles(): Record<number, DoctorFieldProfile> {
    const allMsl = this.getMslDoctorsList();
    let savedProfiles: Record<number, DoctorFieldProfile> = {};

    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
        if (raw) savedProfiles = JSON.parse(raw);
      }
    } catch (e) {}

    // 🌟 FULL AUTO-SYNC: Ensure EVERY SINGLE DOCTOR in MSL has an active profile
    allMsl.forEach(doc => {
      if (!savedProfiles[doc.srNo]) {
        savedProfiles[doc.srNo] = this.buildProfileForDoctor(doc);
      } else {
        // Sync activity and speciality from MSL
        savedProfiles[doc.srNo].doctorName = doc.doctorName;
        savedProfiles[doc.srNo].speciality = doc.speciality || savedProfiles[doc.srNo].speciality;
        savedProfiles[doc.srNo].activityType = doc.activityType || savedProfiles[doc.srNo].activityType;
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

  // 🌟 FULL DISCOVERY SYNC: Imports and creates profiles for all 129+ MSL Doctors
  public syncFromMslSheet(): { synced: number; added: number; total: number } {
    const allMsl = this.getMslDoctorsList();
    let synced = 0;
    let added = 0;

    allMsl.forEach(m => {
      if (this.profiles[m.srNo]) {
        this.profiles[m.srNo].doctorName = m.doctorName;
        this.profiles[m.srNo].activityType = m.activityType || '';
        this.profiles[m.srNo].speciality = m.speciality || this.profiles[m.srNo].speciality;
        synced++;
      } else {
        this.profiles[m.srNo] = this.buildProfileForDoctor(m);
        added++;
      }
    });

    this.saveProfiles(this.profiles);
    return { synced, added, total: Object.keys(this.profiles).length };
  }
}

export const dailyWorkingStore = new DailyWorkingStore();
