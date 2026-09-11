import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, 
  AlertTriangle, Trash2, Printer, 
  Stethoscope, Sparkles, Check, 
  Building2, X, Search, Compass, Edit3, ChevronLeft, ChevronRight,
  Lock, Zap, Plus
} from 'lucide-react';
import { 
  dailyWorkingStore, 
  DoctorFieldProfile, 
  PlannedCallItem, 
  DayPlanRecord,
  UDAIPUR_AREAS_MASTER,
  EX_STATIONS_MASTER,
  normalizeStationName
} from '../data/dailyWorkingStore';
import { CloudSyncBar } from './CloudSyncBar';

interface Props {
  onBack: () => void;
}

const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

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
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['Geetanjali Hospital']);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Calendar Modal State
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calMonth, setCalMonth] = useState<number>(7);
  const [calYear, setCalYear] = useState<number>(2026);

  // Search & Filter States
  const [areaSearchText, setAreaSearchText] = useState('');
  const [setupSearch, setSetupSearch] = useState('');
  const [masterAreaFilter, setMasterAreaFilter] = useState('ALL');
  const [masterActivityFilter, setMasterActivityFilter] = useState('ALL');

  // Quick Any-Doctor Search Bar State
  const [globalDocSearch, setGlobalDocSearch] = useState('');

  // Store references
  const [profiles, setProfiles] = useState<Record<number, DoctorFieldProfile>>(() => dailyWorkingStore.profiles);
  const [currentPlan, setCurrentPlan] = useState<DayPlanRecord | null>(null);

  // Clean Touch Clock Modal
  const [clockTargetDoc, setClockTargetDoc] = useState<DoctorFieldProfile | null>(null);
  const [clockMode, setClockMode] = useState<'HOUR' | 'MINUTE'>('HOUR');
  const [clockHour, setClockHour] = useState<number>(8);
  const [clockMinute, setClockMinute] = useState<number>(10);
  const [clockPeriod, setClockPeriod] = useState<'AM' | 'PM'>('PM');
  const [clockSelectedArea, setClockSelectedArea] = useState<string>('Hospital Road');
  const [clockDays, setClockDays] = useState<string[]>(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);

  const clockDialRef = useRef<SVGSVGElement | null>(null);
  const [isDraggingClock, setIsDraggingClock] = useState(false);

  // Date metadata
  const selectedDateObj = useMemo(() => parseDateDDMMYYYY(selectedDateStr), [selectedDateStr]);
  const dayOfWeekName = useMemo(() => selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(), [selectedDateObj]);
  const isSunday = selectedDateObj.getDay() === 0;
  const holidayName = HOLIDAYS_2026[selectedDateStr];
  const isHoliday = !!holidayName;

  useEffect(() => {
    dailyWorkingStore.syncFromMslSheet();
    setProfiles({ ...dailyWorkingStore.profiles });
  }, []);

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

  const handleOpenClockModal = (doc: DoctorFieldProfile) => {
    setClockTargetDoc(doc);
    setClockHour(doc.hour || 8);
    setClockMinute(doc.minute || 0);
    setClockPeriod(doc.period || 'PM');
    setClockSelectedArea(doc.area || doc.primaryHospital || 'Hospital Road');
    setClockDays(doc.availableDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);
    setClockMode('HOUR');
  };

  const handleRotateDial = (clientX: number, clientY: number) => {
    if (!clockDialRef.current) return;
    const rect = clockDialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;

    let deg = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (deg < 0) deg += 360;

    if (clockMode === 'HOUR') {
      let h = Math.round(deg / 30);
      if (h === 0) h = 12;
      setClockHour(h);
    } else {
      let m = Math.round(deg / 6);
      if (m === 60) m = 0;
      setClockMinute(m);
    }
  };

  const handleToggleDay = (day: string) => {
    if (clockDays.includes(day)) {
      setClockDays(clockDays.filter(d => d !== day));
    } else {
      setClockDays([...clockDays, day]);
    }
  };

  const handleSaveClockSchedule = () => {
    if (!clockTargetDoc) return;
    const formattedTime = `${String(clockHour).padStart(2, '0')}:${String(clockMinute).padStart(2, '0')} ${clockPeriod}`;
    const normStation = normalizeStationName(clockSelectedArea);
    const isEx = normStation !== 'UDAIPUR';
    const displayStation = isEx ? (normStation.charAt(0) + normStation.slice(1).toLowerCase()) : 'UDAIPUR';

    const updatedProfile: DoctorFieldProfile = {
      ...clockTargetDoc,
      primaryHospital: clockSelectedArea,
      area: clockSelectedArea,
      approxTime: formattedTime,
      hour: clockHour,
      minute: clockMinute,
      period: clockPeriod,
      availableDays: clockDays,
      isExStation: isEx,
      station: displayStation,
      notes: `${clockSelectedArea} (${formattedTime})`
    };

    const copy = { ...profiles, [clockTargetDoc.srNo]: updatedProfile };
    setProfiles(copy);
    dailyWorkingStore.saveProfiles(copy);

    if (currentPlan && currentPlan.plannedCalls.some(p => p.srNo === clockTargetDoc.srNo)) {
      const updatedCalls = currentPlan.plannedCalls.map(p => {
        if (p.srNo === clockTargetDoc.srNo) {
          return {
            ...p,
            approxTime: formattedTime,
            clinicArea: clockSelectedArea,
            otRemarks: updatedProfile.notes
          };
        }
        return p;
      });
      const updatedPlan = { ...currentPlan, plannedCalls: updatedCalls };
      setCurrentPlan(updatedPlan);
      dailyWorkingStore.saveDayPlan(updatedPlan);
    }

    setClockTargetDoc(null);
    setStatusMsg(`🎉 Dr. ${clockTargetDoc.doctorName} schedule updated to ${clockSelectedArea} at ${formattedTime}!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const generatePlanForAreas = (areasChoice: string[], dateStr: string) => {
    const dObj = parseDateDDMMYYYY(dateStr);
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

    // 🌟 ROBUST EX-STATION MATCHER VIA UNIVERSAL NORMALIZER
    const activeExChoice = areasChoice.find(a => EX_STATIONS_MASTER.some(ex => normalizeStationName(ex) === normalizeStationName(a)));

    if (activeExChoice) {
      const targetNorm = normalizeStationName(activeExChoice);
      // Load ALL doctors of this Ex-Station in 1 Single Day!
      matchedDoctors = allProfilesList.filter(d => normalizeStationName(d.station) === targetNorm && d.isExStation);
      matchedDoctors.sort((a, b) => a.approxTime.localeCompare(b.approxTime));
    } else {
      matchedDoctors = allProfilesList.filter(d => {
        if (d.isExStation) return false;
        const matchesPrimary = areasChoice.some(c => (d.primaryHospital || d.area || '').toLowerCase().includes(c.toLowerCase().trim()));
        return matchesPrimary;
      });

      matchedDoctors.sort((a, b) => {
        const aAct = a.activityType && a.activityType !== '-' ? 1 : 0;
        const bAct = b.activityType && b.activityType !== '-' ? 1 : 0;
        return bAct - aAct;
      });

      matchedDoctors = matchedDoctors.slice(0, 15);
    }

    const plannedItems: PlannedCallItem[] = matchedDoctors.map(doc => {
      const { lastDate, daysAgo } = dailyWorkingStore.getRealLastVisitDate(doc.srNo, dateStr);
      const tier = getRecencyTier(daysAgo);

      return {
        srNo: doc.srNo,
        doctorName: doc.doctorName,
        speciality: doc.speciality,
        clinicArea: doc.primaryHospital || doc.area,
        activityType: doc.activityType || 'REGULAR',
        approxTime: doc.approxTime,
        otRemarks: doc.notes || 'Available',
        visitNumber: doc.monthlyTargetVisits >= 4 ? 3 : 1,
        totalMonthlyTarget: doc.monthlyTargetVisits,
        lastVisitDate: lastDate,
        daysSinceLastVisit: daysAgo,
        recencyTier: tier,
        status: 'PLANNED',
        notes: ''
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

    if (EX_STATIONS_MASTER.some(ex => normalizeStationName(ex) === normalizeStationName(areaName))) {
      updated = [areaName];
    } else {
      const withoutEx = selectedAreas.filter(a => !EX_STATIONS_MASTER.some(ex => normalizeStationName(ex) === normalizeStationName(a)));
      if (withoutEx.includes(areaName)) {
        updated = withoutEx.filter(a => a !== areaName);
        if (updated.length === 0) updated = ['Geetanjali Hospital'];
      } else {
        updated = [...withoutEx, areaName];
      }
    }

    setSelectedAreas(updated);
    generatePlanForAreas(updated, selectedDateStr);
  };

  const handleSyncFromMsl = () => {
    const res = dailyWorkingStore.syncFromMslSheet();
    setProfiles({ ...dailyWorkingStore.profiles });
    setStatusMsg(`🎉 MSL Sync Complete! Total: ${res.total} Doctors active (${res.synced} Synced, ${res.added} Newly Added)!`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const remainingDoctorsInArea = useMemo(() => {
    if (!currentPlan) return [];
    const plannedSrNos = new Set(currentPlan.plannedCalls.map(p => p.srNo));
    const allProfiles = Object.values(profiles);

    const activeExChoice = selectedAreas.find(a => EX_STATIONS_MASTER.some(ex => normalizeStationName(ex) === normalizeStationName(a)));

    let areaDocs: DoctorFieldProfile[] = [];
    if (activeExChoice) {
      const targetNorm = normalizeStationName(activeExChoice);
      areaDocs = allProfiles.filter(d => normalizeStationName(d.station) === targetNorm && d.isExStation);
    } else {
      areaDocs = allProfiles.filter(d => {
        if (d.isExStation) return false;
        const inArea = selectedAreas.some(c => (d.primaryHospital || d.area || '').toLowerCase().includes(c.toLowerCase().trim()));
        return inArea;
      });
    }

    return areaDocs.filter(d => !plannedSrNos.has(d.srNo)).map(doc => {
      const { lastDate, daysAgo } = dailyWorkingStore.getRealLastVisitDate(doc.srNo, selectedDateStr);
      const tier = getRecencyTier(daysAgo);

      return {
        doc,
        lastVisitDate: lastDate,
        daysSinceLastVisit: daysAgo,
        recencyTier: tier
      };
    }).sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);
  }, [currentPlan, selectedAreas, profiles, selectedDateStr]);

  const globalMatchingDoctors = useMemo(() => {
    if (!globalDocSearch.trim()) return [];
    const q = globalDocSearch.toLowerCase();
    const plannedSrNos = new Set(currentPlan?.plannedCalls.map(p => p.srNo) || []);

    return Object.values(profiles)
      .filter(d => !plannedSrNos.has(d.srNo))
      .filter(d => d.doctorName.toLowerCase().includes(q) || (d.speciality || '').toLowerCase().includes(q) || (d.area || '').toLowerCase().includes(q) || String(d.srNo).includes(q))
      .slice(0, 10);
  }, [profiles, globalDocSearch, currentPlan]);

  const handleAddDoctorToTodayPlan = (doc: DoctorFieldProfile, lastDate?: string, daysDiff?: number, tier?: any) => {
    if (!currentPlan) return;
    if (currentPlan.plannedCalls.some(p => p.srNo === doc.srNo)) return;

    const realLast = lastDate !== undefined && daysDiff !== undefined ? { lastDate, daysAgo: daysDiff } : dailyWorkingStore.getRealLastVisitDate(doc.srNo, selectedDateStr);
    const resolvedTier = tier || getRecencyTier(realLast.daysAgo);

    const newItem: PlannedCallItem = {
      srNo: doc.srNo,
      doctorName: doc.doctorName,
      speciality: doc.speciality,
      clinicArea: doc.primaryHospital || doc.area,
      activityType: doc.activityType || 'REGULAR',
      approxTime: doc.approxTime || '01:00 PM',
      otRemarks: doc.notes || 'Available',
      visitNumber: 2,
      totalMonthlyTarget: doc.monthlyTargetVisits,
      lastVisitDate: realLast.lastDate,
      daysSinceLastVisit: realLast.daysAgo,
      recencyTier: resolvedTier,
      status: 'PLANNED',
      notes: ''
    };

    const updated = { ...currentPlan, plannedCalls: [...currentPlan.plannedCalls, newItem] };
    setCurrentPlan(updated);
    dailyWorkingStore.saveDayPlan(updated);
    setGlobalDocSearch('');
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

  const hourAngle = ((clockHour % 12) + clockMinute / 60) * 30;
  const minuteAngle = clockMinute * 6;
  const activeAngle = clockMode === 'HOUR' ? (clockHour % 12) * 30 : minuteAngle;
  const arcLength = 660;
  const clockProgress = (activeAngle / 360) * arcLength;

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
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-mono font-bold">
                {Object.keys(profiles).length} MSL Doctors Active
              </span>
            </h1>
            <p className="text-xs text-slate-400">BE: BANWARI LAL MEENA &bull; HQ: UDAIPUR &bull; Live Dynamic Recency Date Engine</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSyncFromMsl}
            className="flex items-center gap-1 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
            title="Scan MSL Sheet 14 and auto-discover all new doctors"
          >
            <Zap size={14} className="text-slate-950" /> ⚡ Sync MSL ({Object.keys(profiles).length})
          </button>

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
            <Compass size={15} /> 2. MTP
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
            <Edit3 size={14} /> 19 Hospitals Master ({Object.keys(profiles).length})
          </button>
        </div>
      </div>

      <CloudSyncBar
        storageKey="field/daily_working_system_v8"
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
            try { localStorage.setItem('dios_daily_plans_v11', JSON.stringify(cloudData.dayPlans)); } catch (e) {}
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
          
          {/* TAP TO OPEN CALENDAR BAR & GLOBAL DOCTOR SEARCH */}
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
                <span className="text-slate-400">Active Area:</span>
                <span className="text-amber-300 font-bold font-mono truncate max-w-[280px]">
                  {selectedAreas.join(', ')}
                </span>
              </div>
            </div>

            {/* QUICK 1-CLICK ANY-DOCTOR SEARCH & ADD TO TODAY PLAN */}
            <div className="relative w-full md:w-80">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Quick Add Any MSL Doctor to Today..."
                  value={globalDocSearch}
                  onChange={e => setGlobalDocSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-cyan-500/40 text-xs text-white rounded-xl pl-9 pr-3 py-2 focus:border-cyan-400 focus:outline-none placeholder-slate-500 shadow-inner"
                />
              </div>

              {globalMatchingDoctors.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border-2 border-cyan-500/60 rounded-xl shadow-2xl p-1.5 z-50 max-h-48 overflow-y-auto space-y-1">
                  {globalMatchingDoctors.map(d => (
                    <div
                      key={d.srNo}
                      onClick={() => handleAddDoctorToTodayPlan(d)}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950 hover:bg-cyan-950/70 border border-transparent hover:border-cyan-500/40 text-xs cursor-pointer transition"
                    >
                      <div>
                        <div className="font-bold text-white">Dr. {d.doctorName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{d.speciality} &bull; {d.area} &bull; {d.approxTime}</div>
                      </div>
                      <button className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-[10px] transition shrink-0">
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer shadow"
              >
                <Printer size={15} className="text-cyan-400" /> Print
              </button>
            </div>
          </div>

          {/* MULTI-AREA SELECTION HUB */}
          <div className="p-4 bg-slate-950 rounded-2xl border-2 border-amber-500/60 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg"><MapPin size={16} /></span>
                <div>
                  <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    "Aaj Kahan Working Karni Hai?" &bull; Multi-Area Hub
                  </h3>
                  <p className="text-[11px] text-slate-400">Select any hospital or station to load scheduled doctors!</p>
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter areas..."
                  value={areaSearchText}
                  onChange={e => setAreaSearchText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-8 pr-3 py-1.5 text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {UDAIPUR_AREAS_MASTER
                  .filter(a => !areaSearchText || a.toLowerCase().includes(areaSearchText.toLowerCase()))
                  .map(areaName => {
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

              {/* 🌟 100% ACCURATE EX-STATION TOUR CHIPS */}
              <div className="pt-2 border-t border-slate-900">
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider mr-2">🚌 Ex-Station Tours (All Doctors in 1 Day):</span>
                <div className="inline-flex flex-wrap gap-1.5 mt-1">
                  {EX_STATIONS_MASTER.map(st => {
                    const isChecked = selectedAreas.includes(st);
                    const normTarget = normalizeStationName(st);
                    const docCount = Object.values(profiles).filter(d => normalizeStationName(d.station) === normTarget && d.isExStation).length;

                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleToggleArea(st)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                          isChecked
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 border-cyan-400 font-black shadow-md shadow-cyan-950/60'
                            : 'bg-slate-900 text-cyan-300 border-cyan-900/60 hover:border-cyan-400'
                        }`}
                        title={`Load all ${docCount} doctors of ${st} in 1-Day Tour`}
                      >
                        <span>🚌 {st} Tour ({docCount} Drs)</span>
                        {isChecked && <Check size={13} className="text-slate-950 stroke-[3]" />}
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

          {/* TODAY'S ACTION TABLE (WITH FROZEN DOCTOR NAME & NUMBER) */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Stethoscope size={16} className="text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Today's Action Route &bull; {selectedDateStr} ({currentPlan?.plannedCalls.length || 0} Scheduled)
                </h3>
              </div>

              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                {currentPlan?.plannedCalls.length || 0} Planned Calls
              </span>
            </div>

            <div className="overflow-x-auto max-h-[460px] border border-slate-800 rounded-xl relative">
              <table className="w-full text-left text-xs border-separate border-spacing-0">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-30">
                  <tr>
                    <th style={{ width: '44px', minWidth: '44px', maxWidth: '44px', left: 0 }} className="p-2.5 text-center bg-slate-950 border-b border-r border-slate-800 sticky z-40 text-slate-400">
                      #
                    </th>
                    <th style={{ width: '200px', minWidth: '200px', maxWidth: '200px', left: '44px' }} className="p-2.5 bg-slate-950 border-b border-r-2 border-purple-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky z-40 text-white">
                      Doctor Name
                    </th>
                    <th className="p-2.5 text-center w-36 text-purple-300 border-b border-r border-slate-800">⏰ Meeting Clock</th>
                    <th className="p-2.5 min-w-[120px] text-cyan-300 border-b border-r border-slate-800">Speciality</th>
                    <th className="p-2.5 min-w-[160px] border-b border-r border-slate-800">Hospital / Station Area</th>
                    <th className="p-2.5 text-center w-24 text-purple-300 border-b border-r border-slate-800">Activity</th>
                    <th className="p-2.5 text-center w-20 text-emerald-400 border-b border-r border-slate-800">Visit #</th>
                    <th className="p-2.5 text-center w-36 border-b border-r border-slate-800">Last Visit (Recency)</th>
                    <th className="p-2.5 min-w-[160px] text-amber-400 border-b border-r border-slate-800">Sitting Days &amp; Timings</th>
                    <th className="p-2.5 text-center w-24 border-b border-r border-slate-800">Call Status</th>
                    <th className="p-2.5 text-center w-12 border-b border-slate-800">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
                  {(!currentPlan || currentPlan.plannedCalls.length === 0) ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-500 font-sans">
                        Aaj ke liye koi calls planned nahi hain. Upar hospital select karein ya doctor search karke plan me add karein.
                      </td>
                    </tr>
                  ) : (
                    currentPlan.plannedCalls.map((item, idx) => {
                      const profile = profiles[item.srNo];

                      return (
                        <tr key={item.srNo} className="hover:bg-slate-800/60 transition group">
                          <td style={{ width: '44px', minWidth: '44px', maxWidth: '44px', left: 0 }} className="p-2.5 text-center text-slate-500 border-b border-r border-slate-800/80 sticky z-20 bg-slate-900 group-hover:bg-slate-800">
                            {idx + 1}
                          </td>

                          <td style={{ width: '200px', minWidth: '200px', maxWidth: '200px', left: '44px' }} className="p-2.5 font-sans font-bold text-white border-b border-r-2 border-purple-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky z-20 bg-slate-900 group-hover:bg-slate-800 truncate">
                            Dr. {item.doctorName}
                          </td>

                          <td className="p-1.5 text-center border-b border-r border-slate-800/80">
                            <button
                              type="button"
                              onClick={() => profile && handleOpenClockModal(profile)}
                              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-950 to-indigo-950 border border-purple-500/50 hover:border-purple-400 px-2.5 py-1 rounded-lg text-purple-300 hover:text-white transition cursor-pointer w-full shadow-sm group"
                            >
                              <Clock size={13} className="text-purple-400 group-hover:rotate-45 transition" />
                              <span className="font-mono font-bold text-xs">{item.approxTime}</span>
                            </button>
                          </td>

                          <td className="p-2.5 text-cyan-300 font-sans border-b border-r border-slate-800/80">{item.speciality}</td>
                          <td className="p-2.5 text-slate-300 font-sans border-b border-r border-slate-800/80">{item.clinicArea}</td>
                          <td className="p-2.5 text-center border-b border-r border-slate-800/80">
                            <span className="bg-purple-950 text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-500/30">
                              {item.activityType}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-black text-emerald-400 border-b border-r border-slate-800/80">
                            {item.visitNumber}/{item.totalMonthlyTarget}
                          </td>
                          
                          <td className="p-2.5 text-center border-b border-r border-slate-800/80">
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

                          <td className="p-2.5 font-sans text-amber-300/90 text-xs border-b border-r border-slate-800/80">{item.otRemarks}</td>
                          
                          <td className="p-1.5 text-center border-b border-r border-slate-800/80">
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

                          <td className="p-2 text-center border-b border-slate-800">
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
                  Remaining Doctors in {selectedAreas.join(', ')} ({remainingDoctorsInArea.length} Backlog)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">
                1-Click Add to today's action plan
              </span>
            </div>

            {remainingDoctorsInArea.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">
                Is area ke sabhi doctors aaj ke plan me scheduled hain! Zero backlog.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                {remainingDoctorsInArea.map(({ doc, lastVisitDate, daysSinceLastVisit, recencyTier }) => (
                  <div key={doc.srNo} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs gap-2">
                    <div className="truncate">
                      <div className="font-bold text-white truncate">Dr. {doc.doctorName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {doc.speciality} &bull; {doc.area} &bull; {doc.approxTime}
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
      {/* 4. TAB 3: 19 HOSPITALS MASTER WITH AREA & ACTIVITY FILTERS               */}
      {/* ========================================================================= */}
      {activeSubTab === 'MASTER_SETUP' && (
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 size={16} className="text-purple-400" />
                19 Hospitals &amp; Doctor Schedule Master ({Object.keys(profiles).length} Total Doctors)
              </h3>
              <p className="text-xs text-slate-400">Freeze Panes &bull; Filter by Hospital / Activity &bull; Clean Schedule Setting</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                <span className="text-[10px] text-amber-400 font-bold uppercase">Hospital / Hub:</span>
                <select
                  value={masterAreaFilter}
                  onChange={e => setMasterAreaFilter(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900">All Locations</option>
                  {UDAIPUR_AREAS_MASTER.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
                  {EX_STATIONS_MASTER.map(s => <option key={s} value={s} className="bg-slate-900">🚌 {s}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                <span className="text-[10px] text-purple-300 font-bold uppercase">Activity:</span>
                <select
                  value={masterActivityFilter}
                  onChange={e => setMasterActivityFilter(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900">All Activities</option>
                  <option value="CRM" className="bg-slate-900">CRM</option>
                  <option value="WCFYH" className="bg-slate-900">WCFYH</option>
                  <option value="TABLE TOP" className="bg-slate-900">Table Top</option>
                  <option value="A2 GHEE" className="bg-slate-900">A2 Ghee</option>
                  <option value="GLUCOMETER" className="bg-slate-900">Glucometer</option>
                </select>
              </div>

              <div className="relative w-48">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search doctor..."
                  value={setupSearch}
                  onChange={e => setSetupSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-8 pr-3 py-1 text-xs focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[550px] border border-slate-800 rounded-xl relative">
            <table className="w-full text-left text-xs border-separate border-spacing-0">
              <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-30">
                <tr>
                  <th style={{ width: '44px', minWidth: '44px', maxWidth: '44px', left: 0 }} className="p-2.5 text-center bg-slate-950 border-b border-r border-slate-800 sticky z-40 text-slate-400">
                    #
                  </th>
                  <th style={{ width: '200px', minWidth: '200px', maxWidth: '200px', left: '44px' }} className="p-2.5 bg-slate-950 border-b border-r-2 border-purple-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky z-40 text-white">
                    Doctor Name
                  </th>
                  <th className="p-2.5 min-w-[120px] border-b border-r border-slate-800">Speciality</th>
                  <th className="p-2.5 min-w-[180px] text-amber-400 border-b border-r border-slate-800">Hospital / Station</th>
                  <th className="p-2.5 min-w-[140px] text-purple-300 border-b border-r border-slate-800">⏰ Meeting Clock</th>
                  <th className="p-2.5 min-w-[200px] border-b border-r border-slate-800">Sitting Timings &amp; Notes</th>
                  <th className="p-2.5 text-center w-24 border-b border-slate-800">Visits/M</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
                {Object.values(profiles)
                  .filter(d => {
                    const matchSearch = !setupSearch || d.doctorName.toLowerCase().includes(setupSearch.toLowerCase()) || d.area.toLowerCase().includes(setupSearch.toLowerCase());
                    const matchArea = masterAreaFilter === 'ALL' || d.area.toLowerCase().includes(masterAreaFilter.toLowerCase()) || d.station.toLowerCase().includes(masterAreaFilter.toLowerCase());
                    const matchAct = masterActivityFilter === 'ALL' || (d.activityType && d.activityType.toUpperCase().includes(masterActivityFilter.toUpperCase()));
                    return matchSearch && matchArea && matchAct;
                  })
                  .map(doc => (
                    <tr key={doc.srNo} className="hover:bg-slate-800/60 transition group">
                      <td style={{ width: '44px', minWidth: '44px', maxWidth: '44px', left: 0 }} className="p-2 text-center text-slate-500 border-b border-r border-slate-800/80 sticky z-20 bg-slate-900 group-hover:bg-slate-800">
                        {doc.srNo}
                      </td>

                      <td style={{ width: '200px', minWidth: '200px', maxWidth: '200px', left: '44px' }} className="p-2 font-sans font-bold text-white border-b border-r-2 border-purple-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky z-20 bg-slate-900 group-hover:bg-slate-800 truncate">
                        Dr. {doc.doctorName}
                      </td>

                      <td className="p-2 font-sans text-slate-400 border-b border-r border-slate-800/80">{doc.speciality}</td>
                      
                      <td className="p-2 font-sans font-bold text-amber-300 border-b border-r border-slate-800/80">
                        {doc.area}
                      </td>

                      <td className="p-1.5 border-b border-r border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handleOpenClockModal(doc)}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-purple-950 to-indigo-950 hover:from-purple-900 border border-purple-500/50 px-2.5 py-1 rounded-lg text-purple-300 hover:text-white transition cursor-pointer font-bold"
                        >
                          <Clock size={13} className="text-purple-400" />
                          <span>{doc.approxTime}</span>
                        </button>
                      </td>

                      <td className="p-2 font-sans text-slate-300 text-xs border-b border-r border-slate-800/80">
                        {doc.notes}
                      </td>

                      <td className="p-2 text-center border-b border-slate-800">
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

      {/* Clean Touch Clock Modal */}
      {clockTargetDoc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setClockTargetDoc(null)}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-600 cursor-pointer"
                >
                  <ArrowLeft size={18} />
                </button>
                <h3 className="text-base font-black text-slate-900 tracking-wide">
                  Set Doctor Schedule &bull; Dr. {clockTargetDoc.doctorName}
                </h3>
              </div>
              <button onClick={() => setClockTargetDoc(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setClockMode('HOUR')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  clockMode === 'HOUR' ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                ⏰ Ghanta Hand ({clockHour})
              </button>
              <button
                type="button"
                onClick={() => setClockMode('MINUTE')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  clockMode === 'MINUTE' ? 'bg-[#EC4899] text-white border-[#EC4899] shadow' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                ⏱️ Minute Hand ({clockMinute}m)
              </button>
            </div>

            <div className="flex flex-col items-center justify-center select-none">
              <div className="relative w-56 h-56 flex items-center justify-center">
                <svg
                  ref={clockDialRef}
                  viewBox="0 0 260 260"
                  className="w-56 h-56 cursor-pointer touch-none"
                  onMouseDown={() => setIsDraggingClock(true)}
                  onMouseUp={() => setIsDraggingClock(false)}
                  onMouseMove={(e) => isDraggingClock && handleRotateDial(e.clientX, e.clientY)}
                  onTouchStart={() => setIsDraggingClock(true)}
                  onTouchEnd={() => setIsDraggingClock(false)}
                  onTouchMove={(e) => isDraggingClock && handleRotateDial(e.touches[0].clientX, e.touches[0].clientY)}
                  onClick={(e) => handleRotateDial(e.clientX, e.clientY)}
                >
                  <circle cx="130" cy="130" r="105" fill="none" stroke="#F1F5F9" strokeWidth="20" />
                  <circle
                    cx="130"
                    cy="130"
                    r="105"
                    fill="none"
                    stroke={clockMode === 'HOUR' ? '#8B5CF6' : '#EC4899'}
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeDasharray={arcLength}
                    strokeDashoffset={arcLength - clockProgress}
                    transform="rotate(-90 130 130)"
                  />
                  <circle cx="130" cy="130" r="92" fill="#FFFFFF" />

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

                  <line
                    x1="130"
                    y1="130"
                    x2={130 + 48 * Math.sin(hourAngle * (Math.PI / 180))}
                    y2={130 - 48 * Math.cos(hourAngle * (Math.PI / 180))}
                    stroke="#8B5CF6"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="130"
                    y1="130"
                    x2={130 + 68 * Math.sin(minuteAngle * (Math.PI / 180))}
                    y2={130 - 68 * Math.cos(minuteAngle * (Math.PI / 180))}
                    stroke="#EC4899"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="130" cy="130" r="5" fill="#1E293B" />
                </svg>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl font-black font-mono text-slate-800 tracking-tight">
                  {String(clockHour).padStart(2, '0')}:{String(clockMinute).padStart(2, '0')}
                </span>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setClockPeriod('AM')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      clockPeriod === 'AM' ? 'bg-[#8B5CF6] text-white shadow' : 'text-slate-600'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setClockPeriod('PM')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      clockPeriod === 'PM' ? 'bg-[#8B5CF6] text-white shadow' : 'text-slate-600'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Building2 size={14} className="text-purple-600" />
                Hospital / Area Hub:
              </label>
              <select
                value={clockSelectedArea}
                onChange={e => setClockSelectedArea(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <optgroup label="🏥 19 Udaipur Hospitals & Areas">
                  {UDAIPUR_AREAS_MASTER.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                </optgroup>
                <optgroup label="🚌 Ex-Stations">
                  {EX_STATIONS_MASTER.map(st => <option key={st} value={st}>🚌 {st}</option>)}
                </optgroup>
              </select>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Sitting Days:</span>
                <span className="text-[10px] text-slate-500 font-normal">Green = Sitting &bull; Red = Off</span>
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {WEEK_DAYS.map(day => {
                  const isSitting = clockDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-sm ${
                        isSitting 
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                          : 'bg-rose-500 hover:bg-rose-400 text-white'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveClockSchedule}
                className="w-full py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-500/30 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Check size={16} /> SAVE SCHEDULE
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Calendar Popup */}
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
                  {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => (
                    <div key={`cal_emp_${i}`} className="h-9"></div>
                  ))}

                  {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
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
