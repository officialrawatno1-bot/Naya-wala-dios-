import os

print("==========================================================================")
print("📦 [PART 1/3] UPDATING STORE: DYNAMIC AREAS, DUAL LOCATIONS & EXACT MAPPINGS...")
print("==========================================================================")

store_code = """import { MASTER_123_MSL_DOCTORS } from '../components/review/MslSheet';
import { memoryStore } from './memoryStore';

export const TIME_SLOTS_MASTER = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
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
  // 🌟 DUAL-LOCATION SYSTEM (AM/PM dictation, no hardcoded Morning/Evening)
  location1: string;
  time1: string;
  days1: string[];
  location2: string;
  time2: string;
  days2: string[];
  area: string;
  approxTime: string;
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
  status: 'PLANNED' | 'MET' | 'MISSED';
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
const AREAS_STORAGE_KEY = 'dios_dynamic_areas_v1';

const clean = (s: string) => (s || '').toUpperCase().replace(/^(DR\\.?|DR\\s+)/i, '').replace(/[^A-Z]/g, '');

const checkMatch = (name: string, targets: string[]) => {
  return targets.some(t => name.includes(t) || t.includes(name));
};

export class DailyWorkingStore {
  public profiles: Record<number, DoctorFieldProfile>;
  public dayPlans: Record<string, DayPlanRecord>;
  public localAreas: string[];
  public exStations: string[];

  constructor() {
    const areas = this.loadAreas();
    this.localAreas = areas.local;
    this.exStations = areas.ex;
    this.profiles = this.loadProfiles();
    this.dayPlans = this.loadDayPlans();
  }

  // 🌟 DYNAMIC AREA MANAGEMENT
  private loadAreas() {
    try {
      const raw = localStorage.getItem(AREAS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    return {
      local: [
        'Hospital Road', 'Geetanjali Hospital', 'GBH American Bedwas', 'GBH American City',
        'PIMS City', 'PMCH Bedla', 'Paras Hospital', 'Bhopalpura', 'Shobhagpura',
        'Mallatalai', 'Shikarwadi', 'Hiran Magri', 'Hindustan Zinc City',
        'Hindustan Zinc Debari', 'Choudhary Hospital', 'Madhuban', 'Sector 14',
        'Dhanmandi', 'PMCH Umarda', 'Savina', 'Ananta Hospital'
      ],
      ex: ['Dungarpur', 'Banswara', 'Rajsamand', 'Chittorgarh']
    };
  }

  public saveAreas() {
    try {
      localStorage.setItem(AREAS_STORAGE_KEY, JSON.stringify({ local: this.localAreas, ex: this.exStations }));
    } catch (e) {}
  }

  public addArea(name: string, isEx: boolean) {
    if (isEx) {
      if (!this.exStations.includes(name)) this.exStations.push(name);
    } else {
      if (!this.localAreas.includes(name)) this.localAreas.push(name);
    }
    this.saveAreas();
  }

  public deleteArea(name: string, isEx: boolean) {
    if (isEx) {
      this.exStations = this.exStations.filter(a => a !== name);
    } else {
      this.localAreas = this.localAreas.filter(a => a !== name);
    }
    this.saveAreas();
  }

  public mergeAreas(sourceName: string, targetName: string, isEx: boolean) {
    this.deleteArea(sourceName, isEx);
    
    // Update profiles linked to old area
    Object.values(this.profiles).forEach(p => {
      let changed = false;
      if (p.location1 === sourceName) { p.location1 = targetName; changed = true; }
      if (p.location2 === sourceName) { p.location2 = targetName; changed = true; }
      if (p.area === sourceName) { p.area = targetName; changed = true; }
      if (p.station === sourceName) { p.station = targetName; changed = true; }
      if (changed) this.profiles[p.srNo] = p;
    });

    this.saveProfiles(this.profiles);
  }

  // 🌟 REAL MSL DATE ENGINE
  public getRealLastVisitDate(docSrNo: number, targetDateStr: string): { lastDate: string; daysAgo: number } {
    let sourceDoctors: any[] = [];
    try {
      const savedMsl = localStorage.getItem('dios_msl_schedule_permanent_v5');
      if (savedMsl) sourceDoctors = JSON.parse(savedMsl);
    } catch (e) {}

    if (!sourceDoctors || sourceDoctors.length === 0) sourceDoctors = memoryStore.mslData || MASTER_123_MSL_DOCTORS;

    const doc = sourceDoctors.find((d: any) => d.srNo === docSrNo);
    const targetParts = targetDateStr.split('/').map(Number);
    const targetDate = new Date(targetParts[2], targetParts[1] - 1, targetParts[0]);

    const extractedDates: Date[] = [];

    if (doc) {
      const monthsToCheck = [
        { key: 'aug', mIdx: 7, year: 2026 }, { key: 'jul', mIdx: 6, year: 2026 },
        { key: 'jun', mIdx: 5, year: 2026 }, { key: 'may', mIdx: 4, year: 2026 }, { key: 'apr', mIdx: 3, year: 2026 }
      ];
      monthsToCheck.forEach(({ key, mIdx, year }) => {
        const rawVal = String((doc as any)[key] || '');
        if (rawVal && rawVal !== '-' && rawVal !== 'na' && !rawVal.includes('out of')) {
          const dayMatches = rawVal.match(/\\d+/g);
          if (dayMatches) {
            dayMatches.forEach(dStr => {
              const dNum = parseInt(dStr, 10);
              if (dNum > 0 && dNum <= 31) {
                const dt = new Date(year, mIdx, dNum);
                if (dt <= targetDate) extractedDates.push(dt);
              }
            });
          }
        }
      });
    }

    if (extractedDates.length > 0) {
      extractedDates.sort((a, b) => b.getTime() - a.getTime());
      const latest = extractedDates[0];
      const diffDays = Math.max(0, Math.floor((targetDate.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24)));
      const dd = String(latest.getDate()).padStart(2, '0');
      const mm = String(latest.getMonth() + 1).padStart(2, '0');
      const yyyy = latest.getFullYear();
      return { lastDate: `${dd}/${mm}/${yyyy}`, daysAgo: diffDays };
    }

    return { lastDate: 'Not Met', daysAgo: 999 };
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
      let loc1 = 'Hospital Road';
      let t1 = '11:00 AM';
      let d1 = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      let loc2 = '';
      let t2 = '';
      let d2: string[] = [];
      let notes = '';

      // 1. RAJSAMAND
      if (checkMatch(cName, ['HCSONI','ANMOL','KRIPASHANKAR','BHUPESH','MKMEENA','MANISHKHANDELWAL','MVIJAYVARGIY','SATISH','SUNIL'])) {
        station = 'Rajsamand'; loc1 = 'Rajsamand'; isEx = true; t1 = '11:00 AM';
      }
      // 2. CHITTORGARH
      else if (checkMatch(cName, ['LALITJAINANI','ANISHJAIN','MADHUP','SUSHIL','SHUSHIL','CHANDOLIYA','ANURAGJAIN','PUNGLIYA'])) {
        station = 'Chittorgarh'; loc1 = 'Chittorgarh'; isEx = true; t1 = '11:30 AM';
      }
      // 3. DUNGARPUR
      else if (checkMatch(cName, ['PINTUAAHARI','KANTILALMEGWAL','RAJESHSIROIYA','KNDAS','RAHULPANCHAL','JAYESHGANDHI','PRAVEENJAIN'])) {
        station = 'Dungarpur'; loc1 = 'Dungarpur'; isEx = true; t1 = '11:30 AM';
      }
      // 4. BANSWARA
      else if (checkMatch(cName, ['JIMESH','ASHWINPATIDAR','DEEPAKATARA','HARISHCHARPOTA','MAYANKSHARMA','NAVNEET','YASHSHAH','KIRITGANDHI','RKMALOT'])) {
        station = 'Banswara'; loc1 = 'Banswara'; isEx = true; t1 = '12:00 PM';
      }
      // 5. GEETANJALI HOSPITAL (Thu, Fri 1:00-3:30)
      else if (checkMatch(cName, ['ABHIJEET','LALIT','RAVIMANGLIYA','AMEETMEHTA','NAVGEET','MANUSHARMA','JITENAJINGAR','SURAJ','GKMUKHIYA','RAHUL','VINOD','DILIP','RAMESH','SANJAY','NEHA'])) {
        loc1 = 'Geetanjali Hospital'; t1 = '01:30 PM'; d1 = ['THU', 'FRI'];
        loc2 = 'Bhopalpura'; t2 = '06:00 PM'; d2 = ['MON', 'TUE', 'WED', 'SAT'];
      }
      // 6. GBH BEDWAS (Fri, Sat 1:00-3:00)
      else if (checkMatch(cName, ['DANNY','DENY','KAPIL','PRIYANKA','PARTH','JITENDRAAGRAWAL','JITESHAGRAWAL','RAJENDRASAMAR','ASHWINISHANBHAG','HARBEERSINGH','MAHESHDESAI','MUKESHBARJATIYA'])) {
        loc1 = 'GBH American Bedwas'; t1 = '01:30 PM'; d1 = ['FRI', 'SAT'];
        loc2 = 'Hospital Road'; t2 = '06:30 PM'; d2 = ['MON', 'TUE', 'WED', 'THU'];
      }
      // 7. GBH CITY (4:30 - 6:00 PM)
      else if (checkMatch(cName, ['PRERNABAHETI','PANKAJTAPARIA','NAMAN','RAVIRAJ'])) {
        loc1 = 'GBH American City'; t1 = '05:00 PM';
      }
      // 8. PIMS CITY
      else if (checkMatch(cName, ['HITESH'])) {
        loc1 = 'PIMS City'; t1 = '12:00 PM'; loc2 = 'Hospital Road'; t2 = '08:00 PM'; d2 = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      }
      // 9. PMCH BEDLA (Tue, Fri 11:00-1:00 PM)
      else if (checkMatch(cName, ['SABOHRA','JAGDISHBISHNOI','RKSHARMA','CPPUROHIT','HARISH','SUNITA','RNLADHA','NILESHPATHIRA'])) {
        loc1 = 'PMCH Bedla'; t1 = '11:30 AM'; d1 = ['TUE', 'FRI'];
        loc2 = 'Hospital Road'; t2 = '06:30 PM'; d2 = ['MON', 'WED', 'THU', 'SAT'];
      }
      // 10. BHOPALPURA
      else if (checkMatch(cName, ['KCJAIN','DPSINGH','SANDEEPBHATNAGAR'])) {
        loc1 = 'Bhopalpura'; t1 = '06:00 PM'; loc2 = 'Paras Hospital'; t2 = '04:30 PM'; d2 = ['FRI'];
      }
      // 11. HOSPITAL ROAD
      else if (checkMatch(cName, ['DEEPAKAAMETHA'])) {
        loc1 = 'Hospital Road'; t1 = '08:10 PM'; loc2 = 'Paras Hospital'; t2 = '01:00 PM'; d2 = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      } else if (checkMatch(cName, ['JCDEVPURA'])) {
        loc1 = 'Hospital Road'; t1 = '06:30 PM';
      } else if (checkMatch(cName, ['MUKESHSHARMA'])) {
        loc1 = 'Hospital Road'; t1 = '08:00 PM';
      }
      // 12. SHOBHAGPURA
      else if (checkMatch(cName, ['ABHAYJAIN'])) {
        loc1 = 'Shobhagpura'; t1 = '06:30 PM'; loc2 = 'Paras Hospital'; t2 = '04:30 PM'; d2 = ['FRI'];
      } else if (checkMatch(cName, ['MANISHKULSHRE'])) {
        loc1 = 'Shobhagpura'; t1 = '06:30 PM'; loc2 = 'Paras Hospital'; t2 = '04:30 PM'; d2 = ['FRI'];
      } else if (checkMatch(cName, ['DANNY'])) {
        loc1 = 'Shobhagpura'; t1 = '07:00 PM'; d1 = ['WED', 'THU', 'FRI'];
      }
      // 13. MALLATALAI
      else if (checkMatch(cName, ['SANDEEPKANSARA'])) {
        loc1 = 'Mallatalai'; t1 = '07:00 PM';
      } else if (checkMatch(cName, ['SKKUASHIK','SKKAUSHIQ'])) {
        loc1 = 'Mallatalai'; t1 = '08:00 PM';
      }
      // 14. PARAS HOSPITAL (Friday 4-5.30 PM)
      else if (checkMatch(cName, ['AMITKHANDELWAL','ASHUTOSHSONI'])) {
        loc1 = 'Paras Hospital'; t1 = '04:30 PM'; d1 = ['FRI'];
      }
      // 15. HINDUSTAN ZINC
      else if (checkMatch(cName, ['SALMA','ABHISHEKKUMAR','VINODKRAI'])) {
        loc1 = 'Hindustan Zinc City'; t1 = '11:00 AM';
      } else if (checkMatch(cName, ['SUMITSIROIYA'])) {
        loc1 = 'Hindustan Zinc Debari'; t1 = '12:00 PM'; loc2 = 'Hiran Magri'; t2 = '07:00 PM'; d2 = ['MON','TUE','WED','THU','FRI','SAT'];
      }
      // 16. SHIKARWADI (Wed, Thu 5 PM)
      else if (checkMatch(cName, ['AKVATS'])) {
        loc1 = 'Shikarwadi'; t1 = '05:00 PM'; d1 = ['WED', 'THU'];
      }
      // 17. HIRAN MAGRI
      else if (checkMatch(cName, ['PARASJAIN','RAMESHPATEL','MAHESHDESAI','MANUSHARMA','NAVGEETMATHUR','CPPUROHIT','HARISHSANADHY'])) {
        loc1 = 'Hiran Magri'; t1 = '07:30 PM';
      }

      const hasAct = !!(doc.activityType && doc.activityType.trim() !== '-');

      initial[doc.srNo] = {
        srNo: doc.srNo,
        doctorName: doc.doctorName,
        speciality: doc.speciality || 'CONSULTANT',
        activityType: doc.activityType || '',
        location1: loc1,
        time1: t1,
        days1: d1,
        location2: loc2,
        time2: t2,
        days2: d2,
        area: loc1,
        approxTime: t1,
        availableDays: d1,
        notAvailableDays: [],
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

  public syncFromMslSheet(): number {
    let sourceDoctors: any[] = [];
    try {
      const savedMsl = localStorage.getItem('dios_msl_schedule_permanent_v5');
      if (savedMsl) sourceDoctors = JSON.parse(savedMsl);
    } catch (e) {}

    if (!sourceDoctors || sourceDoctors.length === 0) {
      sourceDoctors = memoryStore.mslData || MASTER_123_MSL_DOCTORS;
    }

    let count = 0;
    sourceDoctors.forEach(m => {
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
"""

with open('src/data/dailyWorkingStore.ts', 'w', encoding='utf-8') as f:
    f.write(store_code)

print("✅ Part 1 complete! dailyWorkingStore.ts successfully updated with Area Management & Dual-Location Engine.")
