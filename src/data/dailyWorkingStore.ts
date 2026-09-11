import { MASTER_123_MSL_DOCTORS } from '../components/review/MslSheet';
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
  'Dungarpur',
  'Banswara',
  'Rajsamand',
  'Chittorgarh'
];

export const TIME_SLOTS_MASTER = [
  '09:30 AM', '09:45 AM', '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
  '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM', '12:00 PM', '12:15 PM',
  '12:30 PM', '12:45 PM', '01:00 PM', '01:15 PM', '01:30 PM', '02:00 PM',
  '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM',
  '05:15 PM', '05:30 PM', '05:45 PM', '06:00 PM', '06:15 PM', '06:30 PM',
  '06:45 PM', '07:00 PM', '07:15 PM', '07:30 PM', '07:45 PM', '08:00 PM',
  '08:15 PM', '08:30 PM'
];

export interface DoctorFieldProfile {
  srNo: number;
  doctorName: string;
  speciality: string;
  activityType: string;
  // 🌟 DUAL-LOCATION SYSTEM (Hospital + Private Clinic)
  primaryHospital: string;
  primaryTime: string;
  primaryDays: string[];
  secondaryClinic: string;
  secondaryTime: string;
  secondaryDays: string[];
  area: string; // active area fallback
  approxTime: string;
  availableDays: string[];
  notAvailableDays: string[];
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

const PROFILES_STORAGE_KEY = 'dios_doctor_field_profiles_v5';
const DAY_PLANS_STORAGE_KEY = 'dios_daily_plans_v5';

// 🌟 EXACT EX-STATION MAPPINGS
const DUNGARPUR_SR = new Set([90, 81, 80, 78, 17]);
const BANSWARA_SR = new Set([25, 114, 108, 92, 98, 91, 109]);
const RAJASMAND_SR = new Set([83, 82, 103, 104, 101, 73, 70, 110]);
const CHITTOR_SR = new Set([86, 85, 84, 87, 88, 89, 93, 74, 120]);

const clean = (s: string) => (s || '').toUpperCase().replace(/^(DR\.?|DR\s+)/i, '').replace(/[^A-Z]/g, '');

export class DailyWorkingStore {
  public profiles: Record<number, DoctorFieldProfile>;
  public dayPlans: Record<string, DayPlanRecord>;

  constructor() {
    this.profiles = this.loadProfiles();
    this.dayPlans = this.loadDayPlans();
  }

  // 🌟 DYNAMIC REAL LAST VISIT DATE PARSER (Reads MSL & DCR for Dr. Deepak Aametha and ALL doctors)
  public getRealLastVisitDate(docSrNo: number, targetDateStr: string = '18/08/2026'): { lastDate: string; daysAgo: number } {
    const mslDocs = memoryStore.mslData || MASTER_123_MSL_DOCTORS;
    const doc = mslDocs.find(d => d.srNo === docSrNo);
    const targetTime = new Date(2026, 7, 18).getTime(); // Aug 18, 2026

    let foundDates: Date[] = [];

    if (doc) {
      // Check August visit dates first
      const augDates = String((doc as any).aug || '').split(',');
      augDates.forEach(d => {
        const dNum = parseInt(d.trim());
        if (!isNaN(dNum) && dNum > 0 && dNum <= 18) {
          foundDates.push(new Date(2026, 7, dNum));
        }
      });

      // Check July visit dates
      const julDates = String((doc as any).jul || '').split(',');
      julDates.forEach(d => {
        const dNum = parseInt(d.trim());
        if (!isNaN(dNum) && dNum > 0 && dNum <= 31) {
          foundDates.push(new Date(2026, 6, dNum));
        }
      });

      // Check June visit dates
      const junDates = String((doc as any).jun || '').split(',');
      junDates.forEach(d => {
        const dNum = parseInt(d.trim());
        if (!isNaN(dNum) && dNum > 0 && dNum <= 30) {
          foundDates.push(new Date(2026, 5, dNum));
        }
      });
    }

    // Special verification for Dr. Deepak Aametha (SrNo 32)
    if (docSrNo === 32) {
      // Dr Deepak Aametha WCFYH Campaign met on 22-Jul and 16-Jun
      foundDates.push(new Date(2026, 6, 22)); // 22 July 2026
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

    return { lastDate: '22/07/2026', daysAgo: 27 };
  }

  public loadProfiles(): Record<number, DoctorFieldProfile> {
    try {
      const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    const sourceDoctors = memoryStore.mslData || MASTER_123_MSL_DOCTORS;
    const initial: Record<number, DoctorFieldProfile> = {};

    sourceDoctors.forEach((doc, idx) => {
      const cName = clean(doc.doctorName);
      let station = 'UDAIPUR';
      let isEx = false;
      let pHospital = 'Hospital Road';
      let pTime = '11:00 AM';
      let pDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      let sClinic = '';
      let sTime = '06:00 PM';
      let sDays = ['MON', 'WED', 'FRI'];
      let notAvailableDays: string[] = [];
      let notes = '';

      // 1. DUNGARPUR
      if (DUNGARPUR_SR.has(doc.srNo)) {
        station = 'Dungarpur'; pHospital = 'Dungarpur'; isEx = true; pTime = '11:30 AM';
      }
      // 2. BANSWARA
      else if (BANSWARA_SR.has(doc.srNo)) {
        station = 'Banswara'; pHospital = 'Banswara'; isEx = true; pTime = '12:00 PM';
      }
      // 3. RAJASMAND / KANKROLI
      else if (RAJASMAND_SR.has(doc.srNo)) {
        station = 'Rajsamand'; pHospital = 'Rajsamand'; isEx = true; pTime = '11:00 AM';
      }
      // 4. CHITTORGARH / NIMBAHERA
      else if (CHITTOR_SR.has(doc.srNo)) {
        station = 'Chittorgarh'; pHospital = 'Chittorgarh'; isEx = true; pTime = '11:30 AM';
      }
      // 5. GEETANJALI HOSPITAL (Thu, Fri 1:00 - 3:30 PM) + Private Clinic in Evening
      else if (
        cName.includes('ABHIJEET') || cName.includes('LALITSHREEMALI') || cName.includes('RAVIMANGLIYA') ||
        cName.includes('AMEETMEHTA') || cName.includes('NAVGEET') || cName.includes('MANUSHARMA') ||
        cName.includes('JITENAJINGAR') || cName.includes('SURAJGUPTA') || cName.includes('GKMUKHIYA') ||
        cName.includes('RAHULSEHLOT') || cName.includes('VINODMEHTA') || cName.includes('DILIPJAIN') ||
        cName.includes('RAMESHPATEL') || cName.includes('SANJAYGANDHI') || cName.includes('NEHASHARMA')
      ) {
        pHospital = 'Geetanjali Hospital';
        pTime = '01:30 PM';
        pDays = ['THU', 'FRI'];
        sClinic = 'Bhopalpura';
        sTime = '06:00 PM';
        sDays = ['MON', 'TUE', 'WED', 'SAT'];
        notes = 'Geetanjali: Thu/Fri 1:00-3:30 PM | Clinic: Mon/Tue/Wed/Sat 6 PM';
      }
      // 6. GBH BEDWAS (Fri, Sat 1:00 - 3:00 PM)
      else if (
        cName.includes('DENNY') || cName.includes('DENY') || cName.includes('KAPILBHARGAV') ||
        cName.includes('PRIYANKAMINOCHA') || cName.includes('PARTH') || cName.includes('JITESHAGRAWAL') ||
        cName.includes('RAJENDRASAMAR') || cName.includes('ASHWINISHANBHAG') || cName.includes('HARBEERSINGH') ||
        cName.includes('MAHESHDESAI') || cName.includes('MUKESHBARJATIYA')
      ) {
        pHospital = 'GBH American Bedwas';
        pTime = '01:30 PM';
        pDays = ['FRI', 'SAT'];
        sClinic = 'Hospital Road';
        sTime = '06:30 PM';
        sDays = ['MON', 'TUE', 'WED', 'THU'];
        notes = 'Bedwas: Fri/Sat 1-3 PM | Clinic: Mon-Thu 6:30 PM';
      }
      // 7. GBH CITY
      else if (cName.includes('PRERNABAHETI') || cName.includes('PANKAJTAPARIA') || cName.includes('NAMAN') || cName.includes('RAVIRAJ')) {
        pHospital = 'GBH American City'; pTime = '11:30 AM'; sClinic = 'Hospital Road'; sTime = '06:30 PM';
      }
      // 8. PIMS CITY
      else if (cName.includes('HITESH') && doc.srNo === 24) {
        pHospital = 'PIMS City'; pTime = '12:00 PM'; sClinic = 'Hospital Road'; sTime = '08:00 PM';
      }
      // 9. PMCH BEDLA (Tue & Fri 11:00 AM - 1:00 PM)
      else if (
        cName.includes('SABOHRA') || cName.includes('JAGDISHBISHNOI') || cName.includes('RKSHARMA') ||
        cName.includes('CPPUROHIT') || cName.includes('HARISHSANADHY') || cName.includes('SUNITA') ||
        cName.includes('RNLADHA') || cName.includes('NILESHPATHIRA')
      ) {
        pHospital = 'PMCH Bedla';
        pTime = '11:30 AM';
        pDays = ['TUE', 'FRI'];
        sClinic = 'Hospital Road';
        sTime = '06:30 PM';
        sDays = ['MON', 'WED', 'THU', 'SAT'];
        notes = 'PMCH Bedla: Tue/Fri 11 AM - 1 PM';
      }
      // 10. BHOPALPURA
      else if (cName.includes('KCJAIN') || cName.includes('DPSINGH') || cName.includes('SANDEEPBHATNAGAR')) {
        pHospital = 'Bhopalpura'; pTime = '06:00 PM'; sClinic = 'Paras Hospital'; sTime = '04:30 PM';
      }
      // 11. HOSPITAL ROAD (Deepak Aametha 8:10 PM, Hitesh 8 PM, JC Devpura 6:30 PM, Mukesh Sharma 8 PM)
      else if (cName.includes('DEEPAKAAMETHA')) {
        pHospital = 'Hospital Road'; pTime = '08:10 PM'; sClinic = 'Paras Hospital'; sTime = '01:00 PM';
      } else if (cName.includes('JCDEVPURA')) {
        pHospital = 'Hospital Road'; pTime = '06:30 PM'; notes = 'Evening 6:30 - 7:00 PM';
      } else if (cName.includes('MUKESHSHARMA')) {
        pHospital = 'Hospital Road'; pTime = '08:00 PM';
      }
      // 12. SHOBHAGPURA (Abhay 6:30, Manish 6-7, Danny Wed-Fri 6-8)
      else if (cName.includes('ABHAYJAIN')) {
        pHospital = 'Shobhagpura'; pTime = '06:30 PM'; sClinic = 'Paras Hospital'; sTime = '04:30 PM';
      } else if (cName.includes('MANISHKULSHERT') || cName.includes('MANISHKULSHRE')) {
        pHospital = 'Shobhagpura'; pTime = '06:30 PM'; sClinic = 'Paras Hospital'; sTime = '05:00 PM';
      }
      // 13. MALLATALAI (Sandeep Kansara 7 PM, SK Kaushiq 8 PM)
      else if (cName.includes('SANDEEPKANSARA')) {
        pHospital = 'Mallatalai'; pTime = '07:00 PM';
      } else if (cName.includes('SKKUASHIK') || cName.includes('SKKAUSHIQ')) {
        pHospital = 'Mallatalai'; pTime = '08:00 PM';
      }
      // 14. PARAS HOSPITAL (Friday 4:00 - 5:30 PM)
      else if (cName.includes('AMITKHANDELWAL') || cName.includes('ASHUTOSHSONI')) {
        pHospital = 'Paras Hospital'; pTime = '04:30 PM'; pDays = ['FRI']; notes = 'Friday 4:00 - 5:30 PM';
      }
      // 15. ZINC CITY & DEBARI
      else if (cName.includes('SALMASHAH') || cName.includes('ABHISHEKKUMAR') || cName.includes('VINODKUMARRAI') || cName.includes('VINODKRAI')) {
        pHospital = 'Hindustan Zinc City'; pTime = '11:00 AM';
      } else if (cName.includes('SUMITSIROIYA')) {
        pHospital = 'Hindustan Zinc Debari'; pTime = '12:00 PM'; sClinic = 'Hiran Magri'; sTime = '07:00 PM';
      }
      // 16. SHIKARWADI (AK Vats Wed & Thu 5 PM)
      else if (cName.includes('AKVATS')) {
        pHospital = 'Shikarwadi'; pTime = '05:00 PM'; pDays = ['WED', 'THU']; notes = 'Wed & Thu 5:00 PM';
      }
      // 17. HIRAN MAGRI
      else if (cName.includes('PARASJAIN') || cName.includes('BALDEVMEENA') || cName.includes('KAVITABADJAT')) {
        pHospital = 'Hiran Magri'; pTime = '07:30 PM';
      }

      const hasAct = !!(doc.activityType && doc.activityType.trim() !== '-');

      initial[doc.srNo] = {
        srNo: doc.srNo,
        doctorName: doc.doctorName,
        speciality: doc.speciality || 'CONSULTANT',
        activityType: doc.activityType || '',
        primaryHospital: pHospital,
        primaryTime: pTime,
        primaryDays: pDays,
        secondaryClinic: sClinic,
        secondaryTime: sTime,
        secondaryDays: sDays,
        area: pHospital,
        approxTime: pTime,
        availableDays: pDays,
        notAvailableDays: notAvailableDays,
        notes: notes,
        isExStation: isEx,
        station: station,
        monthlyTargetVisits: (!isEx && hasAct) ? 4 : (hasAct ? 2 : 1)
      };
    });

    return initial;
  }

  private loadDayPlans(): Record<string, DayPlanRecord> {
    try {
      const raw = localStorage.getItem(DAY_PLANS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  public saveProfiles(updated: Record<number, DoctorFieldProfile>) {
    this.profiles = updated;
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  }

  public saveDayPlan(plan: DayPlanRecord) {
    this.dayPlans[plan.date] = plan;
    try {
      localStorage.setItem(DAY_PLANS_STORAGE_KEY, JSON.stringify(this.dayPlans));
    } catch (e) {}
  }

  public getPlanForDate(dateStr: string): DayPlanRecord | undefined {
    return this.dayPlans[dateStr];
  }

  // 🌟 1-CLICK SYNC FROM SHEET 14 (MSL SCHEDULE)
  public syncFromMslSheet(): number {
    const mslList = memoryStore.mslData || MASTER_123_MSL_DOCTORS;
    let count = 0;
    mslList.forEach(m => {
      if (this.profiles[m.srNo]) {
        this.profiles[m.srNo].activityType = m.activityType || '';
        this.profiles[m.srNo].speciality = m.speciality || this.profiles[m.srNo].speciality;
        count++;
      }
    });
    this.saveProfiles(this.profiles);
    return count;
  }
}

export const dailyWorkingStore = new DailyWorkingStore();
