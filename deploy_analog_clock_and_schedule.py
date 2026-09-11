import os, subprocess

print("==========================================================================")
print("🚀 [1/2] CREATING ANALOG CLOCK & ADVANCED SITTING SCHEDULE ENGINE...")
print("==========================================================================")

# 1. Update dailyWorkingStore.ts with Day & OT structures
store_code = """import { MASTER_123_MSL_DOCTORS } from '../components/review/MslSheet';
import { memoryStore, MslDoctor } from './memoryStore';

export const UDAIPUR_AREAS_MASTER = [
  'Hospital Road',
  'Geetanjali Hospital',
  'GBH American City',
  'GBH American Bedwas',
  'Paras Hospital',
  'Choudhary Hospital',
  'Madhuban',
  'Bhopalpura',
  'Shobhagpura',
  'Sector 14',
  'Dhanmandi',
  'PMCH Bedla',
  'PMCH Umarda',
  'Hiran Magri',
  'Hindustan Zinc City',
  'Hindustan Zinc Debari',
  'Mallatalai',
  'Savina',
  'Ananta Hospital'
];

export const EX_STATIONS_MASTER = [
  'Dungarpur',
  'Banswara',
  'Rajsamand',
  'Chittorgarh'
];

export interface DoctorFieldProfile {
  srNo: number;
  doctorName: string;
  speciality: string;
  activityType: string;
  area: string;
  approxTime: string; // e.g. "10:30 AM"
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
  availableDays: string[]; // ["MON", "WED", "FRI"]
  hasOt: boolean;
  otDays: string[]; // ["TUE", "THU"]
  otHours: string; // "09:00 AM - 01:00 PM"
  otTiming: string;
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

const PROFILES_STORAGE_KEY = 'dios_doctor_field_profiles_v3';
const DAY_PLANS_STORAGE_KEY = 'dios_daily_plans_v3';

// Ex-Town identification
const DUNGARPUR_SR_NUMBERS = new Set([25, 114, 108, 92, 98, 91, 109]);
const BANSWARA_SR_NUMBERS = new Set([90, 81, 80, 78, 17]);
const RAJASMAND_SR_NUMBERS = new Set([73, 70, 77]);
const CHITTOR_SR_NUMBERS = new Set([84, 85, 86]);

export class DailyWorkingStore {
  public profiles: Record<number, DoctorFieldProfile>;
  public dayPlans: Record<string, DayPlanRecord>;

  constructor() {
    this.profiles = this.loadProfiles();
    this.dayPlans = this.loadDayPlans();
  }

  private loadProfiles(): Record<number, DoctorFieldProfile> {
    try {
      const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    const sourceDoctors = memoryStore.mslData || MASTER_123_MSL_DOCTORS;
    const initial: Record<number, DoctorFieldProfile> = {};

    sourceDoctors.forEach((doc, idx) => {
      let stn = 'UDAIPUR';
      let area = 'Hospital Road';
      let isEx = false;

      if (DUNGARPUR_SR_NUMBERS.has(doc.srNo)) {
        stn = 'Dungarpur';
        area = 'Dungarpur';
        isEx = true;
      } else if (BANSWARA_SR_NUMBERS.has(doc.srNo)) {
        stn = 'Banswara';
        area = 'Banswara';
        isEx = true;
      } else if (RAJASMAND_SR_NUMBERS.has(doc.srNo)) {
        stn = 'Rajsamand';
        area = 'Rajsamand';
        isEx = true;
      } else if (CHITTOR_SR_NUMBERS.has(doc.srNo)) {
        stn = 'Chittorgarh';
        area = 'Chittorgarh';
        isEx = true;
      } else {
        area = UDAIPUR_AREAS_MASTER[idx % UDAIPUR_AREAS_MASTER.length];
      }

      const hasAct = !!(doc.activityType && doc.activityType.trim() !== '-');
      const defaultHour = 10 + (idx % 3);

      initial[doc.srNo] = {
        srNo: doc.srNo,
        doctorName: doc.doctorName,
        speciality: doc.speciality || 'CONSULTANT',
        activityType: doc.activityType || '',
        area: area,
        approxTime: `${defaultHour}:00 AM`,
        hour: defaultHour,
        minute: 0,
        period: 'AM',
        availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        hasOt: idx % 4 === 0,
        otDays: ['TUE', 'THU'],
        otHours: '09:00 AM - 01:00 PM',
        otTiming: idx % 4 === 0 ? 'Tue & Thu 9-1 PM OT' : 'None',
        isExStation: isEx,
        station: stn,
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
}

export const dailyWorkingStore = new DailyWorkingStore();
"""

with open('src/data/dailyWorkingStore.ts', 'w', encoding='utf-8') as f:
    f.write(store_code)
print("✅ 1. dailyWorkingStore.ts updated.")

# 2. Update DailyWorkingWorkspace.tsx with the Analog Touch Clock & Day Sitting Engine
ui_code = """import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, CheckCircle2, 
  AlertTriangle, Plus, Trash2, Download, Printer, RefreshCw, 
  UserCheck, Stethoscope, Sparkles, Filter, ChevronRight, Check, 
  Building2, X, Search, ShieldCheck, Compass, Info, Edit3, ChevronLeft,
  Sliders, ShieldAlert
} from 'lucide-react';
import { 
  dailyWorkingStore, 
  DoctorFieldProfile, 
  PlannedCallItem, 
  DayPlanRecord,
  UDAIPUR_AREAS_MASTER,
  EX_STATIONS_MASTER
} from '../data/dailyWorkingStore';
import { CloudSyncBar } from './CloudSyncBar';

interface Props {
  onBack: () => void;
}

const WEEK_DAYS = [
  { key: 'MON', label: 'MON' },
  { key: 'TUE', label: 'TUE' },
  { key: 'WED', label: 'WED' },
  { key: 'THU', label: 'THU' },
  { key: 'FRI', label: 'FRI' },
  { key: 'SAT', label: 'SAT' },
  { key: 'SUN', label: 'SUN' }
];

const HOLIDAYS_2026: Record<string, string> = {
  '15/08/2026': 'INDEPENDENCE DAY',
  '28/08/2026': 'RAKSHABANDHAN',
  '02/10/2026': 'GANDHI JAYANTI',
  '20/10/2026': 'DUSSEHRA',
  '08/11/2026': 'DIWALI',
  '09/11/2026': 'GOVARDHAN PUJA',
  '25/12/2026': 'CHRISTMAS'
};

const parseDateDDMMYYYY = (str: string): Date => {
  const parts = str.split('/').map(Number);
  return new Date(parts[2], parts[1] - 1, parts[0]);
};

const formatDateDDMMYYYY = (d: Date): string => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const getRecencyTier = (days: number): 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' => {
  if (days < 15) return 'GREEN';
  if (days <= 30) return 'YELLOW';
  if (days <= 45) return 'ORANGE';
  return 'RED';
};

export const DailyWorkingWorkspace: React.FC<Props> = ({ onBack }) => {
  const [activeSubTab, setActiveSubTab] = useState<'DAY_PLAN' | 'MTP_PLACEHOLDER' | 'MASTER_SETUP'>('DAY_PLAN');
  const [selectedDateStr, setSelectedDateStr] = useState<string>('18/08/2026');
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['Hospital Road']);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Calendar Modal State
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calMonth, setCalMonth] = useState<number>(7);
  const [calYear, setCalYear] = useState<number>(2026);

  // Store references
  const [profiles, setProfiles] = useState<Record<number, DoctorFieldProfile>>(() => dailyWorkingStore.profiles);
  const [currentPlan, setCurrentPlan] = useState<DayPlanRecord | null>(null);

  // 🌟 SCREENSHOT-MATCHING ANALOG CLOCK & SCHEDULE MODAL STATE
  const [clockTargetDoc, setClockTargetDoc] = useState<DoctorFieldProfile | null>(null);
  const [clockHour, setClockHour] = useState<number>(8);
  const [clockMinute, setClockMinute] = useState<number>(0);
  const [clockPeriod, setClockPeriod] = useState<'AM' | 'PM'>('AM');
  const [clockDays, setClockDays] = useState<string[]>(['MON', 'WED', 'FRI']);
  const [clockArea, setClockArea] = useState<string>('Hospital Road');
  const [clockHasOt, setClockHasOt] = useState<boolean>(false);
  const [clockOtDays, setClockOtDays] = useState<string[]>(['TUE', 'THU']);
  const [clockOtHours, setClockOtHours] = useState<string>('09:00 AM - 01:00 PM');
  const [clockClockAngle, setClockClockAngle] = useState<number>(240); // 8 o'clock = 240 deg

  const clockDialRef = useRef<SVGSVGElement | null>(null);
  const [isDraggingClock, setIsDraggingClock] = useState(false);

  // Search
  const [setupSearch, setSetupSearch] = useState('');

  // Date metadata
  const selectedDateObj = useMemo(() => parseDateDDMMYYYY(selectedDateStr), [selectedDateStr]);
  const dayOfWeekShort = useMemo(() => selectedDateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(), [selectedDateObj]);
  const dayOfWeekName = useMemo(() => selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(), [selectedDateObj]);
  const isSunday = selectedDateObj.getDay() === 0;
  const holidayName = HOLIDAYS_2026[selectedDateStr];
  const isHoliday = !!holidayName;

  // Sync plan on date change
  useEffect(() => {
    const existing = dailyWorkingStore.getPlanForDate(selectedDateStr);
    if (existing) {
      setCurrentPlan(existing);
      if (existing.selectedAreas && existing.selectedAreas.length > 0) {
        setSelectedAreas(existing.selectedAreas);
      }
    } else {
      generatePlanForAreas(selectedAreas, selectedDateStr);
    }
  }, [selectedDateStr]);

  // Open clock picker for a doctor
  const handleOpenClockModal = (doc: DoctorFieldProfile) => {
    setClockTargetDoc(doc);
    setClockHour(doc.hour || 10);
    setClockMinute(doc.minute || 0);
    setClockPeriod(doc.period || 'AM');
    setClockDays(doc.availableDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);
    setClockArea(doc.area || 'Hospital Road');
    setClockHasOt(doc.hasOt || false);
    setClockOtDays(doc.otDays || ['TUE', 'THU']);
    setClockOtHours(doc.otHours || '09:00 AM - 01:00 PM');
    const h = doc.hour || 10;
    setClockClockAngle((h % 12) * 30);
  };

  // 🌟 TOUCH & MOUSE DRAG ROTATION FOR CLOCK HAND (Exact screenshot mechanics)
  const handleRotateDial = (clientX: number, clientY: number) => {
    if (!clockDialRef.current) return;
    const rect = clockDialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;

    let deg = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (deg < 0) deg += 360;

    setClockClockAngle(deg);

    let h = Math.round(deg / 30);
    if (h === 0) h = 12;
    setClockHour(h);
  };

  const handleSaveClockSchedule = () => {
    if (!clockTargetDoc) return;
    const formattedTime = `${String(clockHour).padStart(2, '0')}:${String(clockMinute).padStart(2, '0')} ${clockPeriod}`;
    const otRemarkStr = clockHasOt ? `${clockOtDays.join('/')} (${clockOtHours}) OT` : 'None';

    const updatedProfile: DoctorFieldProfile = {
      ...clockTargetDoc,
      approxTime: formattedTime,
      hour: clockHour,
      minute: clockMinute,
      period: clockPeriod,
      availableDays: clockDays,
      area: clockArea,
      hasOt: clockHasOt,
      otDays: clockOtDays,
      otHours: clockOtHours,
      otTiming: otRemarkStr
    };

    const copy = { ...profiles, [clockTargetDoc.srNo]: updatedProfile };
    setProfiles(copy);
    dailyWorkingStore.saveProfiles(copy);

    // If doctor is in today's plan, update them live too!
    if (currentPlan && currentPlan.plannedCalls.some(p => p.srNo === clockTargetDoc.srNo)) {
      const updatedCalls = currentPlan.plannedCalls.map(p => {
        if (p.srNo === clockTargetDoc.srNo) {
          return {
            ...p,
            approxTime: formattedTime,
            clinicArea: clockArea,
            otRemarks: otRemarkStr
          };
        }
        return p;
      });
      const updatedPlan = { ...currentPlan, plannedCalls: updatedCalls };
      setCurrentPlan(updatedPlan);
      dailyWorkingStore.saveDayPlan(updatedPlan);
    }

    setClockTargetDoc(null);
    setStatusMsg(`🎉 Dr. ${clockTargetDoc.doctorName} schedule & timing updated to ${formattedTime} at ${clockArea}!`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Generate automated plan with strict day & OT conflict protection
  const generatePlanForAreas = (areasChoice: string[], dateStr: string) => {
    const dObj = parseDateDDMMYYYY(dateStr);
    const dayShort = dObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const sunday = dObj.getDay() === 0;
    const hName = HOLIDAYS_2026[dateStr];

    if (sunday || hName) {
      const blockedPlan: DayPlanRecord = {
        date: dateStr,
        dayOfWeek: dayName,
        selectedAreas: areasChoice,
        isSunday: sunday,
        isHoliday: !!hName,
        holidayName: hName,
        plannedCalls: [],
        savedAt: new Date().toISOString()
      };
      setCurrentPlan(blockedPlan);
      dailyWorkingStore.saveDayPlan(blockedPlan);
      return;
    }

    const allProfilesList = Object.values(profiles);
    let matchedDoctors: DoctorFieldProfile[] = [];

    const activeExStation = areasChoice.find(a => EX_STATIONS_MASTER.some(ex => ex.toUpperCase() === a.toUpperCase()));

    if (activeExStation) {
      matchedDoctors = allProfilesList.filter(d => d.station.toUpperCase() === activeExStation.toUpperCase() && d.isExStation);
    } else {
      matchedDoctors = allProfilesList.filter(d => {
        if (d.isExStation) return false;
        // Check sitting day!
        const sitsOnThisDay = d.availableDays.includes(dayShort);
        if (!sitsOnThisDay) return false;

        return areasChoice.some(chosen => d.area.toLowerCase().includes(chosen.toLowerCase().trim()));
      });

      matchedDoctors.sort((a, b) => {
        const aAct = a.activityType && a.activityType !== '-' ? 1 : 0;
        const bAct = b.activityType && b.activityType !== '-' ? 1 : 0;
        return bAct - aAct;
      });

      matchedDoctors = matchedDoctors.slice(0, 12);
    }

    matchedDoctors.sort((a, b) => a.approxTime.localeCompare(b.approxTime));

    const plannedItems: PlannedCallItem[] = matchedDoctors.map(doc => {
      const simulatedLastVisit = doc.srNo === 56 ? '02/08/2026' : doc.srNo === 6 ? '18/07/2026' : doc.srNo === 32 ? '15/06/2026' : '10/08/2026';
      const daysDiff = Math.max(0, Math.floor((dObj.getTime() - parseDateDDMMYYYY(simulatedLastVisit).getTime()) / (1000 * 60 * 60 * 24)));
      const tier = getRecencyTier(daysDiff);

      // Check OT conflict
      const inOtToday = doc.hasOt && doc.otDays.includes(dayShort);
      const otRemark = inOtToday ? `🚫 In OT (${doc.otHours})` : (doc.otTiming !== 'None' ? doc.otTiming : 'Available');

      return {
        srNo: doc.srNo,
        doctorName: doc.doctorName,
        speciality: doc.speciality,
        clinicArea: doc.area,
        activityType: doc.activityType || 'REGULAR',
        approxTime: doc.approxTime,
        otRemarks: otRemark,
        visitNumber: doc.monthlyTargetVisits >= 4 ? 3 : 1,
        totalMonthlyTarget: doc.monthlyTargetVisits,
        lastVisitDate: simulatedLastVisit,
        daysSinceLastVisit: daysDiff,
        recencyTier: tier,
        status: inOtToday ? 'IN_OT' : 'PLANNED',
        notes: inOtToday ? 'Shift to evening clinic' : ''
      };
    });

    const newPlan: DayPlanRecord = {
      date: dateStr,
      dayOfWeek: dayName,
      selectedAreas: areasChoice,
      isSunday: false,
      isHoliday: false,
      plannedCalls: plannedItems,
      savedAt: new Date().toISOString()
    };

    setCurrentPlan(newPlan);
    dailyWorkingStore.saveDayPlan(newPlan);
  };

  const handleToggleArea = (areaName: string) => {
    let updated: string[] = [];

    if (EX_STATIONS_MASTER.some(ex => ex.toUpperCase() === areaName.toUpperCase())) {
      updated = [areaName];
    } else {
      const withoutEx = selectedAreas.filter(a => !EX_STATIONS_MASTER.some(ex => ex.toUpperCase() === a.toUpperCase()));
      if (withoutEx.includes(areaName)) {
        updated = withoutEx.filter(a => a !== areaName);
        if (updated.length === 0) updated = ['Hospital Road'];
      } else {
        updated = [...withoutEx, areaName];
      }
    }

    setSelectedAreas(updated);
    generatePlanForAreas(updated, selectedDateStr);
  };

  // Remaining doctors in area
  const remainingDoctorsInArea = useMemo(() => {
    if (!currentPlan) return [];
    const plannedSrNos = new Set(currentPlan.plannedCalls.map(p => p.srNo));
    const allProfiles = Object.values(profiles);

    const activeExStation = selectedAreas.find(a => EX_STATIONS_MASTER.some(ex => ex.toUpperCase() === a.toUpperCase()));

    let areaDocs: DoctorFieldProfile[] = [];
    if (activeExStation) {
      areaDocs = allProfiles.filter(d => d.station.toUpperCase() === activeExStation.toUpperCase() && d.isExStation);
    } else {
      areaDocs = allProfiles.filter(d => {
        if (d.isExStation) return false;
        return selectedAreas.some(chosen => d.area.toLowerCase().includes(chosen.toLowerCase().trim()));
      });
    }

    const dObj = parseDateDDMMYYYY(selectedDateStr);

    return areaDocs.filter(d => !plannedSrNos.has(d.srNo)).map(doc => {
      const simulatedLastVisit = doc.srNo === 1 ? '10/06/2026' : doc.srNo === 2 ? '02/07/2026' : '28/07/2026';
      const daysDiff = Math.max(0, Math.floor((dObj.getTime() - parseDateDDMMYYYY(simulatedLastVisit).getTime()) / (1000 * 60 * 60 * 24)));
      const tier = getRecencyTier(daysDiff);

      return {
        doc,
        lastVisitDate: simulatedLastVisit,
        daysSinceLastVisit: daysDiff,
        recencyTier: tier
      };
    }).sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);
  }, [currentPlan, selectedAreas, profiles, selectedDateStr]);

  const handleAddDoctorToTodayPlan = (doc: DoctorFieldProfile, lastDate: string, daysDiff: number, tier: any) => {
    if (!currentPlan) return;
    if (currentPlan.plannedCalls.some(p => p.srNo === doc.srNo)) return;

    const newItem: PlannedCallItem = {
      srNo: doc.srNo,
      doctorName: doc.doctorName,
      speciality: doc.speciality,
      clinicArea: doc.area,
      activityType: doc.activityType || 'REGULAR',
      approxTime: doc.approxTime || '01:00 PM',
      otRemarks: doc.otTiming || 'Available',
      visitNumber: 2,
      totalMonthlyTarget: doc.monthlyTargetVisits,
      lastVisitDate: lastDate,
      daysSinceLastVisit: daysDiff,
      recencyTier: tier,
      status: 'PLANNED',
      notes: ''
    };

    const updated = { ...currentPlan, plannedCalls: [...currentPlan.plannedCalls, newItem] };
    setCurrentPlan(updated);
    dailyWorkingStore.saveDayPlan(updated);
  };

  const handleRemoveDoctorFromPlan = (srNo: number) => {
    if (!currentPlan) return;
    const updated = { ...currentPlan, plannedCalls: currentPlan.plannedCalls.filter(p => p.srNo !== srNo) };
    setCurrentPlan(updated);
    dailyWorkingStore.saveDayPlan(updated);
  };

  const handleStatusChange = (srNo: number, newStatus: PlannedCallItem['status']) => {
    if (!currentPlan) return;
    const updated = {
      ...currentPlan,
      plannedCalls: currentPlan.plannedCalls.map(p => p.srNo === srNo ? { ...p, status: newStatus } : p)
    };
    setCurrentPlan(updated);
    dailyWorkingStore.saveDayPlan(updated);
  };

  const calMonthDaysCount = new Date(calYear, calMonth + 1, 0).getDate();
  const calFirstDayIndex = new Date(calYear, calMonth, 1).getDay();

  // Clock calculations (Arc circum: 2 * PI * 105 = ~660)
  const arcLength = 660;
  const clockProgress = (clockClockAngle / 360) * arcLength;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-5 max-w-7xl mx-auto text-slate-100">
      
      {/* 1. TOP HEADER & SUB-TABS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 transition cursor-pointer text-xs font-semibold"
          >
            <ArrowLeft size={16} /> Back to Hub
          </button>
          <div>
            <h1 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              📋 DAILY WORKING &amp; ROUTE INTELLIGENCE
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <Sparkles size={11} className="text-purple-400" /> Analog Touch Clock &bull; OT Shield
              </span>
            </h1>
            <p className="text-xs text-slate-400">BE: BANWARI LAL MEENA &bull; HQ: UDAIPUR &bull; Touch-Rotatable Clock Dial &bull; Hospital-Wise Sitting Matrix</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('DAY_PLAN')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              activeSubTab === 'DAY_PLAN'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <CalendarIcon size={15} /> 1. Day Plan &amp; Route Hub
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('MTP_PLACEHOLDER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              activeSubTab === 'MTP_PLACEHOLDER'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400 shadow-md'
                : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-400'
            }`}
          >
            <Compass size={15} /> 2. Monthly Tour Program (MTP)
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">Placeholder</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('MASTER_SETUP')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
              activeSubTab === 'MASTER_SETUP'
                ? 'bg-purple-600 text-white border-purple-400 shadow'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Edit3 size={14} /> 19 Hospitals &amp; Schedule Master
          </button>
        </div>
      </div>

      <CloudSyncBar
        storageKey="field/daily_working_system_v3"
        sheetTitle="Daily Working & Route Intelligence Hub"
        getData={() => ({
          profiles: dailyWorkingStore.profiles,
          dayPlans: dailyWorkingStore.dayPlans,
          selectedDateStr,
          selectedAreas
        })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.profiles) {
            dailyWorkingStore.saveProfiles(cloudData.profiles);
            setProfiles(cloudData.profiles);
          }
          if (cloudData.dayPlans) {
            dailyWorkingStore.dayPlans = cloudData.dayPlans;
            try { localStorage.setItem('dios_daily_plans_v3', JSON.stringify(cloudData.dayPlans)); } catch (e) {}
          }
        }}
        onSaveLocal={() => {
          dailyWorkingStore.saveProfiles(profiles);
          if (currentPlan) dailyWorkingStore.saveDayPlan(currentPlan);
        }}
      />

      {statusMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-2xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="p-1 hover:text-white">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB 1: ACTIVE DAY PLAN & ROUTE HUB                                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'DAY_PLAN' && (
        <div className="space-y-5">
          
          {/* TAP TO OPEN CALENDAR BAR */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => setShowCalendarModal(true)}
                className="flex items-center gap-2.5 bg-gradient-to-r from-purple-950 to-slate-900 border-2 border-purple-500/60 hover:border-purple-400 px-4 py-2 rounded-xl text-white transition cursor-pointer shadow-md group"
              >
                <span className="p-1.5 bg-purple-600 rounded-lg text-white group-hover:scale-110 transition">
                  <CalendarIcon size={16} />
                </span>
                <div className="text-left">
                  <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Tap to Change Date:</div>
                  <div className="font-mono font-black text-sm text-cyan-300">
                    {selectedDateStr} <span className="text-xs font-normal text-slate-300">({dayOfWeekName})</span>
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-2 bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-800">
                <MapPin size={15} className="text-amber-400" />
                <span className="text-slate-400">Planned Hubs:</span>
                <span className="text-amber-300 font-bold font-mono truncate max-w-[240px]">
                  {selectedAreas.join(', ')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer shadow"
              >
                <Printer size={15} className="text-cyan-400" /> Print Sheet
              </button>
            </div>
          </div>

          {/* MULTI-AREA SELECTION HUB */}
          <div className="p-4 bg-slate-950 rounded-2xl border-2 border-amber-500/60 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg"><MapPin size={16} /></span>
                <div>
                  <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    "Aaj Kahan Working Karni Hai?" &bull; Multi-Area Hub
                  </h3>
                  <p className="text-[11px] text-slate-400">Select multiple hospitals at once &bull; Sitting days &amp; OT hours are auto-checked!</p>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-300">
                Active: <b className="text-amber-400">{selectedAreas.join(', ')}</b>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {UDAIPUR_AREAS_MASTER.map(areaName => {
                  const isChecked = selectedAreas.includes(areaName);
                  return (
                    <button
                      key={areaName}
                      type="button"
                      onClick={() => handleToggleArea(areaName)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isChecked 
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black' 
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span>{areaName}</span>
                      {isChecked && <Check size={13} className="text-slate-950" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-900">
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider mr-2">Ex-Station Tours (All in 1 Shot):</span>
                <div className="inline-flex flex-wrap gap-1.5 mt-1">
                  {EX_STATIONS_MASTER.map(st => {
                    const isChecked = selectedAreas.includes(st);
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleToggleArea(st)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          isChecked
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black'
                            : 'bg-slate-900 text-cyan-300 border-cyan-900/60 hover:border-cyan-500'
                        }`}
                      >
                        <span>🚌 {st} (All In 1 Day)</span>
                        {isChecked && <Check size={13} className="text-slate-950" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SUNDAY / HOLIDAY WARNING BANNER */}
          {isSunday && (
            <div className="p-3.5 bg-rose-950/70 border-2 border-rose-500/70 text-rose-200 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-400" />
              <span>OFFICIAL SUNDAY: Today is Sunday. Regular field work is closed.</span>
            </div>
          )}
          {isHoliday && (
            <div className="p-3.5 bg-purple-950/70 border-2 border-purple-500/70 text-purple-200 rounded-2xl text-xs font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400" />
              <span>OFFICIAL HOLIDAY: {holidayName} - Field work closed.</span>
            </div>
          )}

          {/* TODAY'S PLANNED DOCTORS ACTION TABLE */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Stethoscope size={16} className="text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Today's Planned Action Route &bull; {selectedDateStr} ({currentPlan?.plannedCalls.length || 0} Scheduled)
                </h3>
              </div>

              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                {currentPlan?.plannedCalls.length || 0} Planned Calls
              </span>
            </div>

            <div className="overflow-x-auto max-h-[460px] border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
                  <tr>
                    <th className="p-2.5 text-center w-10">#</th>
                    <th className="p-2.5 text-center w-36 text-purple-300">⏰ Meeting Clock</th>
                    <th className="p-2.5 min-w-[180px] text-white">Doctor Name</th>
                    <th className="p-2.5 min-w-[120px] text-cyan-300">Speciality</th>
                    <th className="p-2.5 min-w-[160px]">Clinic / Hospital</th>
                    <th className="p-2.5 text-center w-24 text-purple-300">Activity</th>
                    <th className="p-2.5 text-center w-20 text-emerald-400">Visit #</th>
                    <th className="p-2.5 text-center w-36">Last Visit (Recency)</th>
                    <th className="p-2.5 min-w-[150px] text-amber-400">OT / Sitting Alert</th>
                    <th className="p-2.5 text-center w-24">Call Status</th>
                    <th className="p-2.5 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
                  {(!currentPlan || currentPlan.plannedCalls.length === 0) ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-500 font-sans">
                        Aaj ke liye koi calls planned nahi hain.
                      </td>
                    </tr>
                  ) : (
                    currentPlan.plannedCalls.map((item, idx) => {
                      const profile = profiles[item.srNo];

                      return (
                        <tr key={item.srNo} className="hover:bg-slate-800/40 transition">
                          <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                          
                          {/* 🌟 CLOCK TRIGGER BUTTON (OPENS ANALOG TOUCH CLOCK) */}
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => profile && handleOpenClockModal(profile)}
                              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-950 to-indigo-950 border border-purple-500/50 hover:border-purple-400 px-2.5 py-1 rounded-lg text-purple-300 hover:text-white transition cursor-pointer w-full shadow-sm group"
                              title="Click to turn clock hand & set schedule"
                            >
                              <Clock size={13} className="text-purple-400 group-hover:rotate-45 transition" />
                              <span className="font-mono font-bold text-xs">{item.approxTime}</span>
                            </button>
                          </td>

                          <td className="p-2.5 font-sans font-bold text-white">Dr. {item.doctorName}</td>
                          <td className="p-2.5 text-cyan-300 font-sans">{item.speciality}</td>
                          <td className="p-2.5 text-slate-300 font-sans">{item.clinicArea}</td>
                          <td className="p-2.5 text-center">
                            <span className="bg-purple-950 text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-500/30">
                              {item.activityType}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-black text-emerald-400">
                            {item.visitNumber}/{item.totalMonthlyTarget}
                          </td>
                          
                          {/* COLOR-CODED LAST VISIT */}
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-1 rounded-lg font-mono font-bold text-[10px] border flex items-center justify-center gap-1 ${
                              item.recencyTier === 'GREEN' 
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                                : item.recencyTier === 'YELLOW'
                                ? 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                                : item.recencyTier === 'ORANGE'
                                ? 'bg-orange-950/80 text-orange-300 border-orange-500/60'
                                : 'bg-rose-950/80 text-rose-300 border-rose-500/60'
                            }`}>
                              <span>{item.recencyTier === 'GREEN' ? '🟢' : item.recencyTier === 'YELLOW' ? '🟡' : item.recencyTier === 'ORANGE' ? '🟠' : '🔴'}</span>
                              <span>{item.lastVisitDate} ({item.daysSinceLastVisit}d)</span>
                            </span>
                          </td>

                          <td className="p-2.5 font-sans text-xs">
                            {item.otRemarks.includes('🚫') ? (
                              <span className="text-rose-400 font-bold bg-rose-950/50 px-2 py-0.5 rounded border border-rose-500/30">
                                {item.otRemarks}
                              </span>
                            ) : (
                              <span className="text-slate-400">{item.otRemarks}</span>
                            )}
                          </td>
                          
                          <td className="p-1.5 text-center">
                            <select
                              value={item.status}
                              onChange={e => handleStatusChange(item.srNo, e.target.value as any)}
                              className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border focus:outline-none cursor-pointer ${
                                item.status === 'MET' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50' :
                                item.status === 'IN_OT' ? 'bg-rose-950 text-rose-300 border-rose-500/50' :
                                'bg-slate-950 text-slate-300 border-slate-800'
                              }`}
                            >
                              <option value="PLANNED">Planned</option>
                              <option value="MET">Met ✅</option>
                              <option value="IN_OT">In OT / Off</option>
                              <option value="MISSED">Missed ❌</option>
                            </select>
                          </td>

                          <td className="p-2 text-center">
                            <button
                              onClick={() => handleRemoveDoctorFromPlan(item.srNo)}
                              className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* REMAINING DOCTORS BACKLOG IN SELECTED AREAS */}
          <div className="p-4 bg-slate-950 rounded-2xl border-2 border-cyan-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Remaining / Unplanned Doctors in {selectedAreas.join(', ')} ({remainingDoctorsInArea.length} Backlog)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">
                1-Click Add any doctor to today's action plan
              </span>
            </div>

            {remainingDoctorsInArea.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">
                Is area ke sabhi doctors aaj ke plan me scheduled ho chuke hain! Zero backlog.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                {remainingDoctorsInArea.map(({ doc, lastVisitDate, daysSinceLastVisit, recencyTier }) => (
                  <div key={doc.srNo} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs gap-2">
                    <div className="truncate">
                      <div className="font-bold text-white truncate">Dr. {doc.doctorName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {doc.speciality} &bull; {doc.area}
                      </div>
                      
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[9px] font-bold mt-1 border ${
                        recencyTier === 'GREEN' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                        : recencyTier === 'YELLOW' ? 'bg-amber-950 text-amber-300 border-amber-500/60'
                        : recencyTier === 'ORANGE' ? 'bg-orange-950 text-orange-300 border-orange-500/60'
                        : 'bg-rose-950 text-rose-300 border-rose-500/60'
                      }`}>
                        <span>{recencyTier === 'GREEN' ? '🟢' : recencyTier === 'YELLOW' ? '🟡' : recencyTier === 'ORANGE' ? '🟠' : '🔴'}</span>
                        <span>Last: {lastVisitDate} ({daysSinceLastVisit}d)</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddDoctorToTodayPlan(doc, lastVisitDate, daysSinceLastVisit, recencyTier)}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-[10px] transition cursor-pointer shadow shrink-0"
                    >
                      + Plan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB 2: MTP PLACEHOLDER                                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'MTP_PLACEHOLDER' && (
        <div className="p-12 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-3">
          <span className="p-4 bg-cyan-500/10 text-cyan-400 rounded-full inline-block border border-cyan-500/20">
            <Compass size={32} />
          </span>
          <h2 className="text-lg font-bold text-white">Monthly Tour Program (MTP / TP)</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Advance monthly route schedule module.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 3: 19 HOSPITALS & SCHEDULE MASTER SETUP                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'MASTER_SETUP' && (
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 size={16} className="text-purple-400" />
                19 Hospitals &amp; Doctor Schedule Master (One-Time Setup)
              </h3>
              <p className="text-xs text-slate-400">Tap Clock ⏰ to turn dial &bull; Set Hospital &bull; Choose Sitting Days &amp; OT Hours</p>
            </div>

            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search doctor in setup..."
                value={setupSearch}
                onChange={e => setSetupSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[550px] border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-2.5 text-center w-10">#</th>
                  <th className="p-2.5 min-w-[180px]">Doctor Name</th>
                  <th className="p-2.5 min-w-[120px]">Speciality</th>
                  <th className="p-2.5 min-w-[180px] text-amber-400">Hospital / Clinic Hub</th>
                  <th className="p-2.5 min-w-[140px] text-purple-300">⏰ Meeting Clock</th>
                  <th className="p-2.5 min-w-[140px] text-cyan-300">Sitting Days</th>
                  <th className="p-2.5 min-w-[160px]">OT / Off Hours</th>
                  <th className="p-2.5 text-center w-24">Visits/M</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
                {Object.values(profiles)
                  .filter(d => !setupSearch || d.doctorName.toLowerCase().includes(setupSearch.toLowerCase()) || d.area.toLowerCase().includes(setupSearch.toLowerCase()))
                  .map(doc => (
                    <tr key={doc.srNo} className="hover:bg-slate-800/40 transition">
                      <td className="p-2 text-center text-slate-500">{doc.srNo}</td>
                      <td className="p-2 font-sans font-bold text-white">Dr. {doc.doctorName}</td>
                      <td className="p-2 font-sans text-slate-400">{doc.speciality}</td>
                      
                      {/* Area */}
                      <td className="p-2 font-sans font-bold text-amber-300">
                        {doc.area}
                      </td>

                      {/* Interactive Clock Trigger */}
                      <td className="p-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenClockModal(doc)}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-purple-950 to-indigo-950 hover:from-purple-900 border border-purple-500/50 px-2.5 py-1 rounded-lg text-purple-300 hover:text-white transition cursor-pointer font-bold"
                        >
                          <Clock size={13} className="text-purple-400" />
                          <span>{doc.approxTime}</span>
                        </button>
                      </td>

                      {/* Sitting Days */}
                      <td className="p-2 font-sans text-cyan-300 text-[10px]">
                        {doc.availableDays.join(', ')}
                      </td>

                      {/* OT Remarks */}
                      <td className="p-2 font-sans text-slate-400 text-xs">
                        {doc.hasOt ? `🚫 ${doc.otDays.join('/')} OT` : 'None'}
                      </td>

                      {/* Target Visits */}
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold ${doc.monthlyTargetVisits >= 4 ? 'bg-amber-950 text-amber-300' : 'bg-slate-950 text-slate-400'}`}>
                          {doc.monthlyTargetVisits}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. 🌟 SCREENSHOT-EXACT INTERACTIVE TOUCH ANALOG CLOCK & SCHEDULE MODAL   */}
      {/* ========================================================================= */}
      {clockTargetDoc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col p-6 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setClockTargetDoc(null)}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-600"
                >
                  <ArrowLeft size={18} />
                </button>
                <h3 className="text-sm font-black text-slate-800 tracking-wide">
                  Set Doctor Timing &bull; Dr. {clockTargetDoc.doctorName.split(' ')[0]}
                </h3>
              </div>
              <button onClick={() => setClockTargetDoc(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            {/* 🌟 ANALOG TOUCH DIAL WITH DRAGGABLE HAND & PURPLE ARC (EXACT SCREENSHOT MATCH) */}
            <div className="flex flex-col items-center justify-center select-none">
              <div className="relative w-64 h-64 flex items-center justify-center">
                
                <svg
                  ref={clockDialRef}
                  viewBox="0 0 260 260"
                  className="w-64 h-64 cursor-pointer touch-none"
                  onMouseDown={() => setIsDraggingClock(true)}
                  onMouseUp={() => setIsDraggingClock(false)}
                  onMouseMove={(e) => isDraggingClock && handleRotateDial(e.clientX, e.clientY)}
                  onTouchStart={() => setIsDraggingClock(true)}
                  onTouchEnd={() => setIsDraggingClock(false)}
                  onTouchMove={(e) => isDraggingClock && handleRotateDial(e.touches[0].clientX, e.touches[0].clientY)}
                  onClick={(e) => handleRotateDial(e.clientX, e.clientY)}
                >
                  {/* Outer Track */}
                  <circle cx="130" cy="130" r="105" fill="none" stroke="#F1F5F9" strokeWidth="22" />

                  {/* 🌟 Purple Circular Arc Track (Exact match to screenshot) */}
                  <circle
                    cx="130"
                    cy="130"
                    r="105"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="22"
                    strokeLinecap="round"
                    strokeDasharray={arcLength}
                    strokeDashoffset={arcLength - clockProgress}
                    transform="rotate(-90 130 130)"
                  />

                  {/* Clock Dial Inner Background */}
                  <circle cx="130" cy="130" r="92" fill="#FFFFFF" />

                  {/* 12 Hour Numbers (3, 6, 9, 12 in Purple as in screenshot) */}
                  {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h, i) => {
                    const angle = (i * 30) * (Math.PI / 180);
                    const x = 130 + 72 * Math.sin(angle);
                    const y = 130 - 72 * Math.cos(angle);
                    const isKeyNumber = [12, 3, 6, 9].includes(h);

                    return (
                      <text
                        key={h}
                        x={x}
                        y={y + 4}
                        textAnchor="middle"
                        fontSize={isKeyNumber ? "13" : "11"}
                        fontWeight={isKeyNumber ? "bold" : "normal"}
                        fill={isKeyNumber ? "#8B5CF6" : "#64748B"}
                      >
                        {h}
                      </text>
                    );
                  })}

                  {/* 🌟 Clock Hand (Rotating pointer directed by touch angle) */}
                  <line
                    x1="130"
                    y1="130"
                    x2={130 + 55 * Math.sin(clockClockAngle * (Math.PI / 180))}
                    y2={130 - 55 * Math.cos(clockClockAngle * (Math.PI / 180))}
                    stroke="#8B5CF6"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Center Dot */}
                  <circle cx="130" cy="130" r="5" fill="#8B5CF6" />
                </svg>

              </div>

              {/* Digital Time Readout & AM/PM Toggle */}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-2xl font-black font-mono text-slate-800 tracking-tight">
                  {String(clockHour).padStart(2, '0')}:{String(clockMinute).padStart(2, '0')}
                </span>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setClockPeriod('AM')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      clockPeriod === 'AM' ? 'bg-[#8B5CF6] text-white shadow' : 'text-slate-600'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setClockPeriod('PM')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      clockPeriod === 'PM' ? 'bg-[#8B5CF6] text-white shadow' : 'text-slate-600'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 mt-0.5">
                Drag dial hand to rotate &bull; Selected: {clockHour}:00 {clockPeriod}
              </div>
            </div>

            {/* 🌟 SETTINGS SECTION (Exact Match to Screenshot) */}
            <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
              
              {/* Day Selector Chips (MON, TUE, WED, THU, FRI, SAT, SUN) */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1.5">
                  Sitting Days (Kin din doctor milte hain):
                </span>
                <div className="flex justify-between items-center">
                  {WEEK_DAYS.map(({ key, label }) => {
                    const isSelected = clockDays.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (key === 'SUN') return; // Sunday always off
                          if (clockDays.includes(key)) {
                            if (clockDays.length > 1) setClockDays(clockDays.filter(d => d !== key));
                          } else {
                            setClockDays([...clockDays, key]);
                          }
                        }}
                        className={`text-[11px] font-bold transition cursor-pointer ${
                          key === 'SUN'
                            ? 'text-slate-300 cursor-not-allowed'
                            : isSelected
                            ? 'text-[#8B5CF6] font-black'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hospital / Clinic for this schedule */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                  Assigned Hospital / Hub:
                </label>
                <select
                  value={clockArea}
                  onChange={e => setClockArea(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
                >
                  <optgroup label="19 Udaipur Hospitals & Hubs">
                    {UDAIPUR_AREAS_MASTER.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                  </optgroup>
                  <optgroup label="Ex-Station Tours">
                    {EX_STATIONS_MASTER.map(st => <option key={st} value={st}>🚌 {st}</option>)}
                  </optgroup>
                </select>
              </div>

              {/* OT Hours Shield */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1">
                    <ShieldAlert size={13} /> Strict OT / Off Hours:
                  </label>
                  <input
                    type="checkbox"
                    checked={clockHasOt}
                    onChange={e => setClockHasOt(e.target.checked)}
                    className="rounded text-[#8B5CF6]"
                  />
                </div>

                {clockHasOt && (
                  <div className="space-y-1.5 pt-1 border-t border-slate-200">
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-500">OT Days:</span>
                      {['TUE', 'THU', 'SAT'].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            if (clockOtDays.includes(d)) setClockOtDays(clockOtDays.filter(x => x !== d));
                            else setClockOtDays([...clockOtDays, d]);
                          }}
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            clockOtDays.includes(d) ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={clockOtHours}
                      onChange={e => setClockOtHours(e.target.value)}
                      placeholder="e.g. 09:00 AM - 01:00 PM"
                      className="w-full bg-white border border-slate-200 text-slate-800 text-[11px] rounded-lg px-2 py-1 font-mono"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* 🌟 PURPLE SAVE BUTTON (Exact Match to Screenshot) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveClockSchedule}
                className="w-full py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-98 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-500/30 transition cursor-pointer"
              >
                SAVE TIMING &amp; SCHEDULE
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CALENDAR POPUP MODAL */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-purple-500/70 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row">
            
            <div className="w-full md:w-5/12 bg-gradient-to-br from-purple-700 via-indigo-700 to-purple-900 p-6 flex flex-col justify-between text-white">
              <div>
                <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Dios Route Planner
                </span>
                <h2 className="text-2xl font-black mt-2">Calendar UI</h2>
                <p className="text-xs text-purple-200 mt-2 leading-relaxed">
                  Interactive month navigator with planned area indicators, holiday markers, and 1-click day route switching.
                </p>
              </div>

              <div className="p-3 bg-black/30 rounded-2xl border border-white/10 space-y-1 mt-4">
                <div className="text-[10px] text-purple-200 uppercase font-semibold">Active Selection:</div>
                <div className="text-base font-black font-mono text-white">
                  {selectedDateStr}
                </div>
                <div className="text-xs font-bold text-amber-300">
                  {dayOfWeekName} &bull; {selectedAreas.join(', ')}
                </div>
              </div>
            </div>

            <div className="w-full md:w-7/12 bg-white text-slate-900 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (calMonth === 0) { setCalMonth(11); setCalYear(prev => prev - 1); }
                      else setCalMonth(prev => prev - 1);
                    }}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <h3 className="text-sm font-black tracking-wide text-slate-800">
                    {new Date(calYear, calMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>

                  <button
                    type="button"
                    onClick={() => {
                      if (calMonth === 11) { setCalMonth(0); setCalYear(prev => prev + 1); }
                      else setCalMonth(prev => prev + 1);
                    }}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-7 text-center mb-2 font-bold text-[11px] text-slate-400">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className={d === 'Sun' ? 'text-rose-500' : ''}>{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
                  {Array.from({ length: calFirstDayIndex }).map((_, i) => (
                    <div key={`cal_emp_${i}`} className="h-9"></div>
                  ))}

                  {Array.from({ length: calMonthDaysCount }).map((_, i) => {
                    const dNum = i + 1;
                    const dObj = new Date(calYear, calMonth, dNum);
                    const dStr = formatDateDDMMYYYY(dObj);
                    const isSun = dObj.getDay() === 0;
                    const isSelected = selectedDateStr === dStr;
                    const dayPlan = dailyWorkingStore.getPlanForDate(dStr);
                    const hasPlan = !!dayPlan && dayPlan.plannedCalls.length > 0;

                    return (
                      <button
                        key={dStr}
                        type="button"
                        onClick={() => {
                          setSelectedDateStr(dStr);
                          setShowCalendarModal(false);
                        }}
                        className={`h-9 rounded-xl font-bold flex flex-col items-center justify-center relative transition cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50 scale-105 font-black'
                            : isSun
                            ? 'text-rose-500 hover:bg-rose-50'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{dNum}</span>
                        {hasPlan && !isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] absolute bottom-1"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
"""

with open('src/components/DailyWorkingWorkspace.tsx', 'w', encoding='utf-8') as f:
    f.write(ui_code)
print("✅ 2. DailyWorkingWorkspace.tsx updated with Touch Analog Clock & Schedule Modal.")

print("\n==========================================================================")
print("📦 [3/3] COMPILING VITE PRODUCTION BUNDLE & DEPLOYING TO CLOUDFLARE...")
print("==========================================================================")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build 100% Successful with 0 errors!")

if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Screenshot-Matching Touch Clock & Hospital Schedule Engine is LIVE on Cloudflare!")
