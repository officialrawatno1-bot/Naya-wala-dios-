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

const PROFILES_STORAGE_KEY = 'dios_doctor_field_profiles_v6';
const DAY_PLANS_STORAGE_KEY = 'dios_daily_plans_v6';

const cleanName = (s: string) => (s || '').toUpperCase().replace(/^(DR\.?|DR\s+)/i, '').replace(/[^A-Z]/g, '');

export class DailyWorkingStore {
  public profiles: Record<number, DoctorFieldProfile>;
  public dayPlans: Record<string, DayPlanRecord>;

  constructor() {
    this.profiles = this.loadProfiles();
    this.dayPlans = this.loadDayPlans();
  }

  public getRealLastVisitDate(docSrNo: number, targetDateStr: string = '18/08/2026'): { lastDate: string; daysAgo: number } {
    const mslDocs = memoryStore.mslData || MASTER_123_MSL_DOCTORS;
    const doc = mslDocs.find(d => d.srNo === docSrNo);
    const targetTime = new Date(2026, 7, 18).getTime();

    let foundDates: Date[] = [];

    if (doc) {
      const augDates = String((doc as any).aug || '').split(',');
      augDates.forEach(d => {
        const dNum = parseInt(d.trim());
        if (!isNaN(dNum) && dNum > 0 && dNum <= 18) foundDates.push(new Date(2026, 7, dNum));
      });

      const julDates = String((doc as any).jul || '').split(',');
      julDates.forEach(d => {
        const dNum = parseInt(d.trim());
        if (!isNaN(dNum) && dNum > 0 && dNum <= 31) foundDates.push(new Date(2026, 6, dNum));
      });

      const junDates = String((doc as any).jun || '').split(',');
      junDates.forEach(d => {
        const dNum = parseInt(d.trim());
        if (!isNaN(dNum) && dNum > 0 && dNum <= 30) foundDates.push(new Date(2026, 5, dNum));
      });
    }

    if (docSrNo === 32) {
      foundDates.push(new Date(2026, 6, 22));
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

    sourceDoctors.forEach((doc) => {
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

      // =========================================================================
      // 🚌 EX-STATIONS MAPPING (Exact List from User)
      // =========================================================================

      // 1. Rajsamand: HC Soni, Anmol Pagariya, Kripa Shankar, Bhupesh Partani, MK Meena, Manish Khandelwal, M Vijayvargiy, Satish Choudhary, Sunil Upadhay
      if (
        c.includes('HCSONI') || c.includes('ANMOLPAGARIYA') || c.includes('KRIPASHANKAR') ||
        c.includes('BHUPESHPARTANI') || c.includes('MKMEENA') || c.includes('MANISHKHANDELWAL') ||
        c.includes('MVIJAYVARGIY') || c.includes('SATISHCHOUDHARY') || c.includes('SUNILUPADHAY')
      ) {
        station = 'Rajsamand';
        area = 'Rajsamand';
        isEx = true;
        approxTime = '11:30 AM';
        hour = 11; minute = 30; period = 'AM';
        notes = 'Rajsamand Ex-Station Day';
      }
      // 2. Chittorgarh: Lalit Jainani, Anish Jain, Madhup Baxi, Shushil Chouhan, Sandeep Chandoliya, Anurag Jain, JL Pungliya
      else if (
        c.includes('LALITJAINANI') || c.includes('ANISHJAIN') || c.includes('MADHUPBAXI') ||
        c.includes('SHUSHILCHOUHAN') || c.includes('SANDEEPCHANDOLIYA') || c.includes('ANURAGJAIN') ||
        c.includes('JLPUNGLIYA') || c.includes('PUNGLIYA')
      ) {
        station = 'Chittorgarh';
        area = 'Chittorgarh';
        isEx = true;
        approxTime = '12:00 PM';
        hour = 12; minute = 0; period = 'PM';
        notes = 'Chittorgarh Ex-Station Day';
      }
      // 3. Dungarpur: Pintu Aahari, Kanti Lal Megwal, Rajesh Siroiya, KN Das, Rahul Panchal
      else if (
        c.includes('PINTUAAHARI') || c.includes('KANTILALMEGWAL') || c.includes('RAJESHSIROIYA') ||
        c.includes('KNDAS') || (c.includes('RAHULPANCHAL') && doc.srNo === 17)
      ) {
        station = 'Dungarpur';
        area = 'Dungarpur';
        isEx = true;
        approxTime = '11:30 AM';
        hour = 11; minute = 30; period = 'AM';
        notes = 'Dungarpur Ex-Station Day';
      }
      // 4. Banswara: Jimesh Pandya, Ashwin Patidar, Deepa Katara, Harish Charpota, Mayank Sharma, Navneet Patel Kiyda, Yash Shah
      else if (
        c.includes('JIMESHPANDYA') || c.includes('ASHWINPATIDAR') || c.includes('DEEPAKATARA') ||
        c.includes('HARISHCHARPOTA') || c.includes('MAYANKSHARMA') || c.includes('NAVNEETPATEL') ||
        c.includes('YASHSHAH')
      ) {
        station = 'Banswara';
        area = 'Banswara';
        isEx = true;
        approxTime = '12:00 PM';
        hour = 12; minute = 0; period = 'PM';
        notes = 'Banswara Ex-Station Day (372 KM Rule)';
      }

      // =========================================================================
      // 🏥 UDAIPUR HOSPITALS & AREAS (Exact Mapping from User)
      // =========================================================================

      // 🏥 Geetanjali Hospital (Thu, Fri | 01:00 PM – 03:30 PM):
      // Abhijeet Basu, Lalit Shreemali, Ravi Mangaliya, Ameet Mehta, Navgeet Mathur, Manu Sharma, Jitena Jingar, Suraj Gupta, GK Mukhiya, Rahul (Sehlot), Vinod (Mehta/Bokadia), Dilip Jain, Ramesh Patel, Sanjay Gandhi, Neha Sharma.
      else if (
        c.includes('ABHIJEETBASU') || c.includes('LALITSHREEMALI') || c.includes('RAVIMANGLIYA') || c.includes('RAVIMANGALIA') ||
        c.includes('AMEETMEHTA') || c.includes('NAVGEETMATHUR') || c.includes('MANUSHARMA') ||
        c.includes('JITENAJINGAR') || c.includes('SURAJGUPTA') || c.includes('GKMUKHIYA') ||
        c.includes('RAHULSEHLOT') || c.includes('VINODMEHTA') || c.includes('VINODBOKADIA') ||
        c.includes('DILIPJAIN') || (c.includes('RAMESHPATEL') && doc.srNo === 11) ||
        c.includes('SANJAYGANDHI') || c.includes('NEHASHARMA')
      ) {
        area = 'Geetanjali Hospital';
        approxTime = '01:30 PM';
        hour = 1; minute = 30; period = 'PM';
        availableDays = ['THU', 'FRI'];
        notes = 'Thu, Fri | 01:00 PM – 03:30 PM';
      }

      // 🏥 GBH American Bedwas (Fri, Sat | 01:00 PM – 03:00 PM):
      // Danny (Deny), Kapil Bhargav, Priyanka Minocha, Parth, Jitesh Agrawal, Rajendra Samar, Ashwini Shanbhag, Harbeer Singh, Mahesh Desai, Mukesh Barjatiya.
      else if (
        c.includes('DENNY') || c.includes('DENY') || c.includes('KAPILBHARGAV') ||
        c.includes('PRIYANKAMINOCHA') || c.includes('PARTH') || c.includes('JITESHAGRAWAL') ||
        c.includes('RAJENDRASAMAR') || c.includes('ASHWINISHANBHAG') || c.includes('HARBEERSINGH') ||
        c.includes('MAHESHDESAI') || (c.includes('MUKESHBARJATIYA') && doc.srNo === 53)
      ) {
        area = 'GBH American Bedwas';
        approxTime = '01:30 PM';
        hour = 1; minute = 30; period = 'PM';
        availableDays = ['FRI', 'SAT'];
        notes = 'Fri, Sat | 01:00 PM – 03:00 PM';
      }

      // 🏥 GBH American City:
      // Prerna Baheti, Pankaj Taparia, Naman N Taneja, Raviraj Singh Ahada.
      else if (
        c.includes('PRERNABAHETI') || c.includes('PANKAJTAPARIA') || c.includes('NAMANNTANEJA') ||
        c.includes('NAMAN') || c.includes('RAVIRAJ')
      ) {
        area = 'GBH American City';
        approxTime = '11:30 AM';
        hour = 11; minute = 30; period = 'AM';
        availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        notes = 'GBH City Morning Visit';
      }

      // 🏥 PIMS City: Hitesh Yadav (12:00 PM)
      else if (c.includes('HITESH') && doc.srNo === 24) {
        area = 'PIMS City';
        approxTime = '12:00 PM';
        hour = 12; minute = 0; period = 'PM';
        availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        notes = 'PIMS City (12:00 PM) & Hospital Road Evening';
      }

      // 🏥 PMCH Bedla (Tue, Fri | 11:00 AM – 01:00 PM):
      // S.A. Bohra, Jagdish Bishnoi, RK Sharma, CP Purohit, Harish Sanadhya, Sunita, RN Ladha, Nilesh Pathira.
      else if (
        c.includes('SABOHRA') || c.includes('JAGDISHVISHNOI') || c.includes('JAGDISHBISHNOI') ||
        c.includes('RKSHARMA') || (c.includes('CPPUROHIT') && doc.srNo === 34) ||
        c.includes('HARISHSANADHY') || c.includes('SUNITA') || c.includes('RNLADHA') ||
        c.includes('NILESHPATHIRA')
      ) {
        area = 'PMCH Bedla';
        approxTime = '11:30 AM';
        hour = 11; minute = 30; period = 'AM';
        availableDays = ['TUE', 'FRI'];
        notes = 'Tue, Fri | 11:00 AM – 01:00 PM';
      }

      // 🏢 Bhopalpura: KC Jain, DP Singh, Mukesh Barjatiya, Sandeep Bhatnagar (06:00 PM)
      else if (c.includes('KCJAIN') || c.includes('DPSINGH') || (c.includes('SANDEEPBHATNAGAR') && doc.srNo === 16)) {
        area = 'Bhopalpura';
        approxTime = '06:00 PM';
        hour = 6; minute = 0; period = 'PM';
        availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        notes = 'Bhopalpura Evening Clinic (06:00 PM)';
      }

      // 🏥 Hospital Road (Exact Evening Timings):
      // Dr. Deepak Aametha: 08:10 PM | Dr. Hitesh Yadav: 08:00 PM | Dr. JC Devpura: 06:30 PM - 07:00 PM | Dr. Mukesh Sharma: 08:00 PM
      else if (c.includes('DEEPAKAAMETHA')) {
        area = 'Hospital Road';
        approxTime = '08:10 PM';
        hour = 8; minute = 10; period = 'PM';
        availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        notes = 'Hospital Road Clinic (08:10 PM Exact)';
      } else if (c.includes('JCDEVPURA')) {
        area = 'Hospital Road';
        approxTime = '06:30 PM';
        hour = 6; minute = 30; period = 'PM';
        availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        notes = 'Hospital Road (06:30 PM - 07:00 PM)';
      } else if (c.includes('MUKESHSHARMA') && doc.srNo === 33) {
        area = 'Hospital Road';
        approxTime = '08:00 PM';
        hour = 8; minute = 0; period = 'PM';
        availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        notes = 'Hospital Road (08:00 PM)';
      }

      // 🏢 Shobhagpura (Exact Evening Timings):
      // Dr. Abhay Jain: 06:30 PM | Dr. Manish Kulshreshtha: 06:00 PM - 07:00 PM | Dr. Danny: 06:00 PM - 08:00 PM (Wed, Thu, Fri)
      else if (c.includes('ABHAYJAIN')) {
        area = 'Shobhagpura';
        approxTime = '06:30 PM';
        hour = 6; minute = 30; period = 'PM';
        availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        notes = 'Shobhagpura (06:30 PM)';
      } else if (c.includes('MANISHKULSHERT') || c.includes('MANISHKULSHRESH')) {
        area = 'Shobhagpura';
        approxTime = '06:30 PM';
        hour = 6; minute = 30; period = 'PM';
        availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        notes = 'Shobhagpura (06:00 PM - 07:00 PM)';
      }

      // 🏢 Mallatalai (Exact Evening Timings):
      // Dr. Sandeep Kansara: 07:00 PM | Dr. SK Kaushiq: 08:00 PM
      else if (c.includes('SANDEEPKANSARA')) {
        area = 'Mallatalai';
        approxTime = '07:00 PM';
        hour = 7; minute = 0; period = 'PM';
        availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        notes = 'Mallatalai Clinic (07:00 PM)';
      } else if (c.includes('SKKUASHIK') || c.includes('SKKAUSHIQ')) {
        area = 'Mallatalai';
        approxTime = '08:00 PM';
        hour = 8; minute = 0; period = 'PM';
        availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        notes = 'Mallatalai Clinic (08:00 PM)';
      }

      // 🏥 Paras Hospital (Friday | 04:00 PM – 05:30 PM):
      // Abhay Jain, Manish Kulshreshtha, Sandeep Bhatnagar, Amit Khandelwal, Ashutosh Soni
      else if (c.includes('AMITKHANDELWAL') || c.includes('ASHUTOSHSONI')) {
        area = 'Paras Hospital';
        approxTime = '04:30 PM';
        hour = 4; minute = 30; period = 'PM';
        availableDays = ['FRI'];
        notes = 'Paras Hospital (Friday | 04:00 PM – 05:30 PM)';
      }

      // 🏭 Hindustan Zinc City & Debari:
      // Zinc City: Salma Shah, Abhishek Kumar, Vinod K Rai (11:00 AM).
      // Debari: Sumit Siroya (12:00 PM).
      else if (c.includes('SALMASHAH') || c.includes('ABHISHEKKUMAR') || c.includes('VINODKUMARRAI') || c.includes('VINODKRAI')) {
        area = 'Hindustan Zinc City';
        approxTime = '11:00 AM';
        hour = 11; minute = 0; period = 'AM';
        availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        notes = 'Zinc City Hospital (11:00 AM)';
      } else if (c.includes('SUMITSIROIYA')) {
        area = 'Hindustan Zinc Debari';
        approxTime = '12:00 PM';
        hour = 12; minute = 0; period = 'PM';
        availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        notes = 'Zinc Debari (12:00 PM) & Hiran Magri Evening';
      }

      // 🏢 Hiran Magri (07:30 PM):
      // Paras Jain, Ramesh Patel, Mahesh Desai, Manu Sharma, Navgeet Mathur, Sumit Siroya, CP Purohit, Harish Sanadhya
      else if (c.includes('PARASJAIN')) {
        area = 'Hiran Magri';
        approxTime = '07:30 PM';
        hour = 7; minute = 30; period = 'PM';
        availableDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        notes = 'Hiran Magri Evening Clinic (07:30 PM)';
      }

      // 🏥 Shikarwadi (Wed, Thu | 05:00 PM): AK Vats
      else if (c.includes('AKVATS')) {
        area = 'Shikarwadi';
        approxTime = '05:00 PM';
        hour = 5; minute = 0; period = 'PM';
        availableDays = ['WED', 'THU'];
        notes = 'Shikarwadi (Wed, Thu | 05:00 PM)';
      }

      const hasAct = !!(doc.activityType && doc.activityType.trim() !== '-');

      initial[doc.srNo] = {
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
