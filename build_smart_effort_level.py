import os

code = """import React, { useState, useMemo } from 'react';
import { 
  Activity, Download, Zap, Check, MessageSquare, Plus, 
  Trash2, X, Search, Calendar, Stethoscope, Sparkles, Cake, Heart,
  ChevronRight, Filter, Globe, ArrowRight, UserCheck
} from 'lucide-react';
import { memoryStore, FwDayEntry, MslDoctor } from '../../data/memoryStore';
import { MASTER_123_MSL_DOCTORS } from './MslSheet';
import { CloudSyncBar } from '../CloudSyncBar';

const MONTHS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

const MONTH_INDEX_MAP: Record<string, number> = {
  APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9,
  OCT: 10, NOV: 11, DEC: 12, JAN: 1, FEB: 2, MAR: 3
};

const MONTH_METADATA: Record<string, { year: number; monthIdx: number; days: number }> = {
  APR: { year: 2026, monthIdx: 3, days: 30 },
  MAY: { year: 2026, monthIdx: 4, days: 31 },
  JUN: { year: 2026, monthIdx: 5, days: 30 },
  JUL: { year: 2026, monthIdx: 6, days: 31 },
  AUG: { year: 2026, monthIdx: 7, days: 31 },
  SEP: { year: 2026, monthIdx: 8, days: 30 },
  OCT: { year: 2026, monthIdx: 9, days: 31 },
  NOV: { year: 2026, monthIdx: 10, days: 30 },
  DEC: { year: 2026, monthIdx: 11, days: 31 },
  JAN: { year: 2027, monthIdx: 0, days: 31 },
  FEB: { year: 2027, monthIdx: 1, days: 28 },
  MAR: { year: 2027, monthIdx: 2, days: 31 },
};

export const getSundaysCount = (monthCode: string): number => {
  const meta = MONTH_METADATA[monthCode];
  if (!meta) return 4;
  let count = 0;
  for (let d = 1; d <= meta.days; d++) {
    const dt = new Date(meta.year, meta.monthIdx, d);
    if (dt.getDay() === 0) count++;
  }
  return count;
};

export const parseSlashSum = (val: string | number | undefined): number => {
  if (val === undefined || val === null) return 0;
  const s = String(val).trim();
  if (!s || s === '-' || s === '#DIV/0!') return 0;
  if (s.includes('/')) {
    return s.split('/').reduce((acc, part) => {
      const num = parseFloat(part.trim());
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }
  const direct = parseFloat(s);
  return isNaN(direct) ? 0 : direct;
};

export interface ActivityDetailItem {
  id: string;
  type: 'CAMP' | 'DOB' | 'DOA' | 'RTM' | 'DINNER' | 'CME';
  doctorName: string;
  date: string;
  comment: string;
}

const ACTIVITY_TYPES: Array<{ key: ActivityDetailItem['type']; label: string; icon: string }> = [
  { key: 'CAMP', label: 'Camp', icon: '⛺' },
  { key: 'DOB', label: 'DOB', icon: '🎂' },
  { key: 'DOA', label: 'DOA', icon: '💍' },
  { key: 'RTM', label: 'RTM', icon: '👥' },
  { key: 'DINNER', label: 'Dinner', icon: '🍽️' },
  { key: 'CME', label: 'CME', icon: '🎓' }
];

const ROW_DEFINITIONS = [
  { sn: 1, id: 'days_in_month', title: 'NO. OF DAYS IN MONTH' },
  { sn: 2, id: 'avail_fw_days', title: 'NO. OF AVAILABLE F.W. DAYS', isCalculated: true },
  { sn: 3, id: 'actual_fw_days', title: 'NO. OF ACTUAL F.W. DAYS', isCalculated: true },
  { sn: 4, id: 'days_on_leave', title: 'NO. OF DAYS ON LEAVE' },
  { sn: 5, id: 'holidays', title: 'NO. OF DAYS OF HOLIDAYS' },
  { sn: 6, id: 'meeting_admin_transit', title: 'NO. OF DAYS MEETING/ ADMIN /TRANSIT' },
  { sn: 7, id: 'total_dr_calls', title: 'TOTAL NO. OF DR. CALL' },
  { sn: 8, id: 'dr_call_avg', title: 'DR. CALL AVERAGE', isCalculated: true },
  { sn: 9, id: 'total_chemist_calls', title: 'TOTAL NO. OF CHEMIST CALL' },
  { sn: 10, id: 'chemist_call_avg', title: 'CHEMIST CALL AVERAGE', isCalculated: true },
  { sn: 11, id: 'activities', title: 'NO. OF ACTIVITIES  ( CAMP, DOB, DOA, RTM, DINNER, CME)', isActivityRow: true },
  { sn: 12, id: 'dr_conversion', title: 'NO. OF DR. CONVERSION IN AREA' },
  { sn: 13, id: 'drs_added_new_brand', title: 'NO. OF DRS. ADDED NEW BRAND' },
  { sn: 14, id: 'drs_stopped', title: 'NO. OF DRS. STOPPED' },
  { sn: 15, id: 'fw_days_with_manager', title: 'NO. OF F.W. DAYS WITH MANAGER' },
  { sn: 16, id: 'fw_days_independent', title: 'NO. OF F.W. DAYS INDEPENDENT', isCalculated: true },
];

const INITIAL_BASE: Record<string, Record<string, string>> = {
  days_in_month: { APR: '30', MAY: '31', JUN: '30', JUL: '31', AUG: '31', SEP: '30', OCT: '31', NOV: '30', DEC: '31', JAN: '31', FEB: '28', MAR: '31' },
  avail_fw_days: {}, actual_fw_days: {},
  days_on_leave: { APR: '0', MAY: '1', JUN: '1', JUL: '1', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  holidays: { APR: '0', MAY: '1', JUN: '0', JUL: '0', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  meeting_admin_transit: { APR: '0/0/0', MAY: '1/0/0', JUN: '1/0/0/0', JUL: '1/1/0/0', AUG: '0/0/0', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  total_dr_calls: { APR: '239', MAY: '209', JUN: '213', JUL: '208', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  dr_call_avg: {}, total_chemist_calls: { APR: '234', MAY: '208', JUN: '250', JUL: '239', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  chemist_call_avg: {},
  activities: { APR: '2/2/4/0/0/0', MAY: '2/6/5/0/0/0', JUN: '3/4/1/0/0/0', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  dr_conversion: { APR: '', MAY: '1', JUN: '1', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  drs_added_new_brand: { APR: '', MAY: '', JUN: '', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  drs_stopped: { APR: '', MAY: '', JUN: '', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  fw_days_with_manager: { APR: '6', MAY: '3', JUN: '3', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  fw_days_independent: {},
};

const getMonthFromDateStr = (dateStr: string): number | null => {
  if (!dateStr || !dateStr.includes('/')) return null;
  const parts = dateStr.split('/');
  if (parts.length >= 2) {
    const m = parseInt(parts[1], 10);
    if (!isNaN(m) && m >= 1 && m <= 12) return m;
  }
  return null;
};

export const EffortLevelSheet: React.FC = () => {
  const [beName, setBeName] = useState(() => memoryStore.beName || 'BANWARI LAL MEENA');
  const [hqName, setHqName] = useState(() => memoryStore.hqName || 'UDAIPUR');
  
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const draft = localStorage.getItem('dios_draft_sheet_01_effort_level');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && parsed.formData) return parsed.formData;
      }
    } catch (e) {}
    return memoryStore.effortLevelData || INITIAL_BASE;
  });

  const [activityComments, setActivityComments] = useState<Record<string, ActivityDetailItem[]>>(() => {
    try {
      const draft = localStorage.getItem('dios_effort_activity_comments_v1');
      if (draft) return JSON.parse(draft);
    } catch (e) {}
    return {
      APR: [
        { id: '1', type: 'CAMP', doctorName: 'Dr. Mona Dhingra', date: '10-Apr', comment: 'Sugar check camp, 30 patients' },
        { id: '2', type: 'CAMP', doctorName: 'Dr. Deepak Aametha', date: '22-Apr', comment: 'Cardio clinic camp' },
        { id: '3', type: 'DOB', doctorName: 'Dr. BS Bomb', date: '08/12/2019', comment: 'Birthday bouquet and gifts' },
        { id: '4', type: 'DOB', doctorName: 'Dr. Mahesh Dave', date: '03/03/2019', comment: 'Birthday visit' },
        { id: '5', type: 'DOA', doctorName: 'Dr. Ameet Mehta', date: '19/05/1900', comment: 'Anniversary greeting' },
        { id: '6', type: 'DOA', doctorName: 'Dr. Chirag Rathor', date: '10/02/2000', comment: 'Anniversary celebration' },
        { id: '7', type: 'DOA', doctorName: 'Dr. HC Soni', date: '23/11/2023', comment: 'Anniversary visit' },
        { id: '8', type: 'DOA', doctorName: 'Dr. Vinod Bokadia', date: '02/05/2014', comment: 'Anniversary clinic visit' }
      ]
    };
  });

  const [activeModalMonth, setActiveModalMonth] = useState<string | null>(null);
  const [activeTabType, setActiveTabType] = useState<ActivityDetailItem['type']>('CAMP');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [suggestionFilterMode, setSuggestionFilterMode] = useState<'CURRENT' | 'NEXT' | 'CUSTOM' | 'ALL'>('CURRENT');
  const [selectedCustomMonth, setSelectedCustomMonth] = useState<string>('AUG');

  const [newEntry, setNewEntry] = useState<{ doctorName: string; date: string; comment: string }>({
    doctorName: '', date: '', comment: ''
  });

  const detectedMonthCode = memoryStore.lastSyncedMonthCode || 'AUG';
  const [targetMonth, setTargetMonth] = useState(detectedMonthCode);
  const [syncedAlert, setSyncedAlert] = useState<string | null>(null);

  const allMslDoctors: MslDoctor[] = useMemo(() => {
    if (memoryStore.mslData && memoryStore.mslData.length > 0) return memoryStore.mslData;
    try {
      const saved = localStorage.getItem('dios_msl_schedule_permanent_v5');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return MASTER_123_MSL_DOCTORS || [];
  }, []);

  const targetSuggestionMonthNum = useMemo(() => {
    if (!activeModalMonth) return 8;
    const currentMNum = MONTH_INDEX_MAP[activeModalMonth] || 8;
    if (suggestionFilterMode === 'CURRENT') return currentMNum;
    if (suggestionFilterMode === 'NEXT') return (currentMNum % 12) + 1;
    if (suggestionFilterMode === 'CUSTOM') return MONTH_INDEX_MAP[selectedCustomMonth] || 8;
    return null;
  }, [activeModalMonth, suggestionFilterMode, selectedCustomMonth]);

  const targetMonthLabel = useMemo(() => {
    if (suggestionFilterMode === 'ALL') return 'All Months (125 Doctors)';
    if (suggestionFilterMode === 'NEXT') {
      const currentIdx = MONTHS.indexOf(activeModalMonth || 'AUG');
      return `${MONTHS[(currentIdx + 1) % 12]} (Next Month)`;
    }
    if (suggestionFilterMode === 'CUSTOM') return `${selectedCustomMonth} (Selected)`;
    return `${activeModalMonth} (Active Month)`;
  }, [suggestionFilterMode, activeModalMonth, selectedCustomMonth]);

  const { birthdayDoctors, anniversaryDoctors } = useMemo(() => {
    const bList: MslDoctor[] = [];
    const aList: MslDoctor[] = [];

    allMslDoctors.forEach(doc => {
      const bMonth = getMonthFromDateStr(doc.dob);
      const aMonth = getMonthFromDateStr(doc.doa);

      if (suggestionFilterMode === 'ALL') {
        if (doc.dob) bList.push(doc);
        if (doc.doa) aList.push(doc);
      } else if (targetSuggestionMonthNum !== null) {
        if (bMonth === targetSuggestionMonthNum) bList.push(doc);
        if (aMonth === targetSuggestionMonthNum) aList.push(doc);
      }
    });

    return { birthdayDoctors: bList, anniversaryDoctors: aList };
  }, [allMslDoctors, targetSuggestionMonthNum, suggestionFilterMode]);

  const filteredMslDocs = useMemo(() => {
    if (!docSearchQuery.trim()) return [];
    const q = docSearchQuery.toLowerCase();
    return allMslDoctors.filter(d => 
      d.doctorName.toLowerCase().includes(q) || (d.speciality || '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [allMslDoctors, docSearchQuery]);

  const handleSelectDoctor = (doc: MslDoctor) => {
    let autoDate = newEntry.date;
    if (activeTabType === 'DOB' && doc.dob) autoDate = doc.dob;
    if (activeTabType === 'DOA' && doc.doa) autoDate = doc.doa;

    setNewEntry({
      ...newEntry,
      doctorName: doc.doctorName,
      date: autoDate
    });
    setDocSearchQuery('');
  };

  const persistActivityComments = (updated: Record<string, ActivityDetailItem[]>) => {
    setActivityComments(updated);
    try {
      localStorage.setItem('dios_effort_activity_comments_v1', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleQuickAddDoctorActivity = (doc: MslDoctor, type: 'DOB' | 'DOA') => {
    if (!activeModalMonth) return;
    const rawDate = type === 'DOB' ? doc.dob : doc.doa;
    const dayPart = (rawDate || '').split('/')[0] || '15';
    const formattedDate = `${dayPart}-${activeModalMonth}`;
    const defaultComment = type === 'DOB' ? 'Birthday greeting & celebration visit' : 'Anniversary greeting & visit';

    const currentList = activityComments[activeModalMonth] || [];
    const newItem: ActivityDetailItem = {
      id: 'act_' + Date.now(),
      type,
      doctorName: doc.doctorName,
      date: formattedDate,
      comment: defaultComment
    };

    const updatedList = [...currentList, newItem];
    const updatedMap = { ...activityComments, [activeModalMonth]: updatedList };
    persistActivityComments(updatedMap);

    const counts = ACTIVITY_TYPES.map(t => updatedList.filter(it => it.type === t.key).length);
    const newSlashStr = counts.join('/');
    handleCellChange('activities', activeModalMonth, newSlashStr);
  };

  const isDoctorAlreadyAdded = (docName: string, type: 'DOB' | 'DOA'): boolean => {
    if (!activeModalMonth) return false;
    const currentList = activityComments[activeModalMonth] || [];
    return currentList.some(it => it.type === type && it.doctorName.toLowerCase().trim() === docName.toLowerCase().trim());
  };

  const handleAddActivityItem = () => {
    if (!activeModalMonth) return;
    if (!newEntry.doctorName.trim() && !newEntry.comment.trim()) {
      alert("Kripya Doctor ka naam ya Comment zaroor likhein!");
      return;
    }

    const currentList = activityComments[activeModalMonth] || [];
    const newItem: ActivityDetailItem = {
      id: 'act_' + Date.now(),
      type: activeTabType,
      doctorName: newEntry.doctorName.trim(),
      date: newEntry.date.trim(),
      comment: newEntry.comment.trim()
    };

    const updatedList = [...currentList, newItem];
    const updatedMap = { ...activityComments, [activeModalMonth]: updatedList };
    persistActivityComments(updatedMap);

    const counts = ACTIVITY_TYPES.map(t => updatedList.filter(it => it.type === t.key).length);
    const newSlashStr = counts.join('/');

    handleCellChange('activities', activeModalMonth, newSlashStr);
    setNewEntry({ doctorName: '', date: '', comment: '' });
  };

  const handleDeleteActivityItem = (id: string) => {
    if (!activeModalMonth) return;
    const currentList = activityComments[activeModalMonth] || [];
    const updatedList = currentList.filter(it => it.id !== id);
    const updatedMap = { ...activityComments, [activeModalMonth]: updatedList };
    persistActivityComments(updatedMap);

    const counts = ACTIVITY_TYPES.map(t => updatedList.filter(it => it.type === t.key).length);
    const newSlashStr = counts.join('/');
    handleCellChange('activities', activeModalMonth, newSlashStr);
  };

  const handleCellChange = (rowId: string, month: string, value: string) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [rowId]: {
          ...prev[rowId],
          [month]: value
        }
      };
      memoryStore.effortLevelData = updated;
      return updated;
    });
  };

  const getAvailFwDaysNum = (month: string): number => {
    const totalDays = parseFloat(formData.days_in_month?.[month] || '') || (MONTH_METADATA[month]?.days || 30);
    const sundays = getSundaysCount(month);
    const holidays = parseSlashSum(formData.holidays?.[month]);
    return Math.max(0, totalDays - sundays - holidays);
  };

  const getActualFwDaysNum = (month: string): number => {
    const availDays = getAvailFwDaysNum(month);
    const leaves = parseSlashSum(formData.days_on_leave?.[month]);
    const meetingTransit = parseSlashSum(formData.meeting_admin_transit?.[month]);
    return Math.max(0, availDays - leaves - meetingTransit);
  };

  const calculateCell = (rowId: string, month: string): string => {
    if (rowId === 'avail_fw_days') {
      const avail = getAvailFwDaysNum(month);
      return avail > 0 ? String(avail) : '-';
    }
    if (rowId === 'actual_fw_days') {
      const actual = getActualFwDaysNum(month);
      return actual > 0 ? String(actual) : '-';
    }
    if (rowId === 'dr_call_avg') {
      const calls = parseFloat(formData.total_dr_calls?.[month] || '0') || 0;
      const days = getActualFwDaysNum(month);
      return days > 0 ? (calls / days).toFixed(1) : '-';
    }
    if (rowId === 'chemist_call_avg') {
      const calls = parseFloat(formData.total_chemist_calls?.[month] || '0') || 0;
      const days = getActualFwDaysNum(month);
      return days > 0 ? (calls / days).toFixed(1) : '-';
    }
    if (rowId === 'fw_days_independent') {
      const actual = getActualFwDaysNum(month);
      const manager = parseFloat(formData.fw_days_with_manager?.[month] || '0') || 0;
      return actual > 0 ? String(Math.max(0, actual - manager)) : '-';
    }
    return formData[rowId]?.[month] || '';
  };

  const calculateCumm = (rowId: string): string => {
    if (rowId === 'avail_fw_days') {
      let total = 0;
      MONTHS.forEach(m => { total += getAvailFwDaysNum(m); });
      return total > 0 ? String(total) : '-';
    }
    if (rowId === 'actual_fw_days') {
      let total = 0;
      MONTHS.forEach(m => { total += getActualFwDaysNum(m); });
      return total > 0 ? String(total) : '-';
    }
    if (rowId === 'dr_call_avg') {
      let totalCalls = 0;
      let totalDays = 0;
      MONTHS.forEach(m => {
        totalCalls += parseFloat(formData.total_dr_calls?.[m] || '0') || 0;
        totalDays += getActualFwDaysNum(m);
      });
      return totalDays > 0 ? (totalCalls / totalDays).toFixed(1) : '0';
    }
    if (rowId === 'chemist_call_avg') {
      let totalCalls = 0;
      let totalDays = 0;
      MONTHS.forEach(m => {
        totalCalls += parseFloat(formData.total_chemist_calls?.[m] || '0') || 0;
        totalDays += getActualFwDaysNum(m);
      });
      return totalDays > 0 ? (totalCalls / totalDays).toFixed(1) : '0';
    }
    if (rowId === 'fw_days_independent') {
      let totalActual = 0;
      let totalManager = 0;
      MONTHS.forEach(m => {
        totalActual += getActualFwDaysNum(m);
        totalManager += parseFloat(formData.fw_days_with_manager?.[m] || '0') || 0;
      });
      return totalActual > 0 ? String(Math.max(0, totalActual - totalManager)) : '-';
    }

    let sum = 0;
    let hasNumeric = false;
    MONTHS.forEach(m => {
      const num = parseSlashSum(formData[rowId]?.[m]);
      if (num > 0) {
        sum += num;
        hasNumeric = true;
      }
    });

    return hasNumeric ? String(sum) : '-';
  };

  const handleAutoFillFromFwProgress = () => {
    const fwEntries: FwDayEntry[] = memoryStore.dcrDataByMonth[targetMonth];
    if (!fwEntries || fwEntries.length === 0) {
      alert(`⚠️ '${targetMonth}' ka koi FW Progress data memory mein nahi hai!`);
      return;
    }

    const totalDays = fwEntries.length;
    let holidays = 0, leaves = 0, meetings = 0, admin = 0, transit = 0;
    let totalDrCalls = 0, totalChemistCalls = 0, managerDays = 0;

    fwEntries.forEach(entry => {
      const area = String(entry.areaWorked || '').toUpperCase();
      const wt = String(entry.workType || '').toUpperCase();

      if (entry.day === 'SUNDAY') {
      } else if (wt.includes('HOLIDAY') || area.includes('HOLIDAY') || area.includes('DAY') || area.includes('BANDHAN')) {
        holidays++;
      } else if (wt.includes('LEAVE') || area.includes('LEAVE')) {
        leaves++;
      } else if (wt.includes('MEETING') || area.includes('MEETING')) {
        meetings++;
      } else if (wt.includes('ADMIN') || area.includes('ADMIN')) {
        admin++;
      } else if (wt.includes('TRANSIT') || area.includes('TRANSIT')) {
        transit++;
      } else if (area !== '') {
        totalDrCalls += parseFloat(String(entry.drsMet)) || 0;
        totalChemistCalls += parseFloat(String(entry.chemistsMet)) || 0;
        if (entry.withManager) managerDays++;
      }
    });

    const meetingSlashString = `${meetings}/${admin}/${transit}`;

    setFormData(prev => {
      const updated = {
        ...prev,
        days_in_month: { ...prev.days_in_month, [targetMonth]: String(totalDays) },
        days_on_leave: { ...prev.days_on_leave, [targetMonth]: String(leaves) },
        holidays: { ...prev.holidays, [targetMonth]: String(holidays) },
        meeting_admin_transit: { ...prev.meeting_admin_transit, [targetMonth]: meetingSlashString },
        total_dr_calls: { ...prev.total_dr_calls, [targetMonth]: String(totalDrCalls) },
        total_chemist_calls: { ...prev.total_chemist_calls, [targetMonth]: String(totalChemistCalls) },
        fw_days_with_manager: { ...prev.fw_days_with_manager, [targetMonth]: String(managerDays) }
      };
      memoryStore.effortLevelData = updated;
      return updated;
    });

    setSyncedAlert(`🎉 SUCCESS! '${targetMonth}' Auto-Filled!`);
    setTimeout(() => setSyncedAlert(null), 3500);
  };

  const handleExportCSV = () => {
    let csv = `BE Name - ,${beName},FIELD WORK ACTIVITY,,,,,,,,,,,,\n`;
    csv += `H.Q- ,${hqName},,,,,,,,,,,,,,\n`;
    csv += `S.N.,PARTICULARS,${MONTHS.join(',')},CUMM\n`;

    ROW_DEFINITIONS.forEach(row => {
      const monthVals = MONTHS.map(m => row.isCalculated ? calculateCell(row.id, m) : (formData[row.id]?.[m] || ''));
      const cumm = calculateCumm(row.id);
      csv += `${row.sn},"${row.title}",${monthVals.join(',')},${cumm}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `1_EFFORT_LEVEL_${hqName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Activity size={22} />
          </span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              1. EFFORT LEVEL (Field Work Activity)
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <Sparkles size={10} /> Smart DOB &amp; DOA Assistant Live
              </span>
            </h2>
            <p className="text-xs text-slate-400">BE: {beName} • HQ: {hqName} • Click Row 11 to Open Smart Activity Manager</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-cyan-500/40 shadow-lg">
            <span className="text-[11px] text-slate-400 pl-2 pr-1 font-semibold">Month:</span>
            <select
              value={targetMonth}
              onChange={e => setTargetMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-400 px-2 py-1 focus:outline-none cursor-pointer"
            >
              {MONTHS.map(m => (
                <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>
              ))}
            </select>

            <button
              onClick={handleAutoFillFromFwProgress}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow"
            >
              <Zap size={14} className="text-yellow-300" /> Auto-Fill {targetMonth}
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <CloudSyncBar
        storageKey="review/sheet_01_effort_level"
        sheetTitle="1. Effort Level (Field Work Activity)"
        getData={() => ({ beName, hqName, formData, activityComments })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.formData) {
            setFormData(cloudData.formData);
            memoryStore.effortLevelData = cloudData.formData;
          }
          if (cloudData.activityComments) {
            setActivityComments(cloudData.activityComments);
            persistActivityComments(cloudData.activityComments);
          }
          if (cloudData.beName) setBeName(cloudData.beName);
          if (cloudData.hqName) setHqName(cloudData.hqName);
        }}
        onSaveLocal={() => {
          memoryStore.effortLevelData = formData;
          try {
            localStorage.setItem('dios_draft_sheet_01_effort_level', JSON.stringify({ beName, hqName, formData, activityComments }));
            persistActivityComments(activityComments);
          } catch (e) {}
        }}
      />

      {syncedAlert && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <Check size={16} className="text-emerald-400 shrink-0" />
          <span>{syncedAlert}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
              <th className="p-3 w-10 text-center">S.N.</th>
              <th className="p-3 min-w-[260px]">Particulars</th>
              {MONTHS.map(m => (
                <th key={m} className={`p-3 text-center min-w-[75px] ${m === targetMonth ? 'text-cyan-400 bg-cyan-950/40 border-b-2 border-cyan-400' : ''}`}>
                  {m}
                </th>
              ))}
              <th className="p-3 text-center min-w-[80px] bg-emerald-950/40 text-emerald-300 font-bold">CUMM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {ROW_DEFINITIONS.map((row) => (
              <tr key={row.sn} className="hover:bg-slate-800/30 transition">
                <td className="p-2 text-center text-slate-500 font-mono">{row.sn}</td>
                <td className="p-2 font-medium text-slate-200 flex items-center justify-between">
                  <span>{row.title}</span>
                  {row.isActivityRow && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 font-mono font-bold">
                      Tap Cell for Smart Hub
                    </span>
                  )}
                </td>
                
                {MONTHS.map((m) => {
                  const val = row.isCalculated ? calculateCell(row.id, m) : (formData[row.id]?.[m] ?? '');
                  const isHighlight = m === targetMonth;

                  if (row.isActivityRow) {
                    const commentsCount = (activityComments[m] || []).length;
                    return (
                      <td key={m} className="p-1 text-center">
                        <div className="relative">
                          <input
                            type="text"
                            value={val}
                            onClick={() => { setActiveModalMonth(m); setSuggestionFilterMode('CURRENT'); }}
                            onChange={(e) => handleCellChange(row.id, m, e.target.value)}
                            placeholder="0/0/0..."
                            className={`w-full py-1.5 px-1 rounded-lg font-mono text-xs border text-center transition cursor-pointer ${
                              commentsCount > 0 
                                ? 'bg-amber-950/40 text-amber-300 font-bold border-amber-500/60 shadow-sm' 
                                : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-600'
                            }`}
                            title="Click to open Smart Activity Hub"
                          />
                          {commentsCount > 0 && (
                            <span 
                              onClick={() => { setActiveModalMonth(m); setSuggestionFilterMode('CURRENT'); }}
                              className="absolute -top-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-950 cursor-pointer shadow"
                              title={`${commentsCount} Activity entries`}
                            >
                              {commentsCount}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={m} className={`p-1 text-center ${isHighlight ? 'bg-cyan-950/20' : ''}`}>
                      {row.isCalculated ? (
                        <div className="w-full py-1.5 px-2 bg-slate-950/80 rounded-lg font-mono font-bold text-cyan-400 border border-slate-800/60 text-center">
                          {val}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleCellChange(row.id, m, e.target.value)}
                          placeholder="-"
                          className={`w-full py-1.5 px-2 bg-slate-950 rounded-lg font-mono text-slate-100 border border-slate-800 focus:border-cyan-500 focus:bg-slate-900 focus:outline-none text-center transition ${
                            isHighlight && val ? 'text-cyan-300 font-bold' : ''
                          }`}
                        />
                      )}
                    </td>
                  );
                })}

                <td className="p-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">
                  {calculateCumm(row.id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🌟 ADVANCED SMART ACTIVITY & MULTI-MONTH SUGGESTION MODAL */}
      {activeModalMonth && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-3xl w-full p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40">
                  <MessageSquare size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Smart Activity &amp; Remarks Manager ({activeModalMonth} 2026)
                  </h3>
                  <p className="text-xs text-slate-400">1-Click Auto-Suggest Birthdays &amp; Anniversaries • Cross-Month Planning</p>
                </div>
              </div>
              <button onClick={() => setActiveModalMonth(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* 🌟 LAYER 1: MULTI-MONTH QUICK SUGGESTION BAR */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-cyan-500/40 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-yellow-300" /> Smart Suggestions Target: <b className="text-white font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">{targetMonthLabel}</b>
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSuggestionFilterMode('CURRENT')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      suggestionFilterMode === 'CURRENT'
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    🎯 This Month ({activeModalMonth})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSuggestionFilterMode('NEXT')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      suggestionFilterMode === 'NEXT'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    ⏭️ Next Month ({MONTHS[(MONTHS.indexOf(activeModalMonth) + 1) % 12]})
                  </button>

                  <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-400">📅 Month:</span>
                    <select
                      value={selectedCustomMonth}
                      onChange={e => { setSelectedCustomMonth(e.target.value); setSuggestionFilterMode('CUSTOM'); }}
                      className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
                    >
                      {MONTHS.map(m => (
                        <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSuggestionFilterMode('ALL')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      suggestionFilterMode === 'ALL'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    🌐 All 125
                  </button>
                </div>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-36 overflow-y-auto pr-1">
                {/* Birthday Cards */}
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-pink-400 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Cake size={13} /> Birthdays ({birthdayDoctors.length}):</span>
                    <span className="text-[10px] text-slate-500 font-mono">1-Click Add</span>
                  </div>
                  {birthdayDoctors.length === 0 ? (
                    <div className="text-[10px] text-slate-500 italic py-1">No birthdays recorded for this month.</div>
                  ) : (
                    <div className="space-y-1">
                      {birthdayDoctors.map(doc => {
                        const added = isDoctorAlreadyAdded(doc.doctorName, 'DOB');
                        return (
                          <div key={doc.srNo} className="flex items-center justify-between p-1.5 bg-slate-950 rounded-lg text-[11px]">
                            <div className="truncate max-w-[150px]">
                              <span className="font-bold text-white">{doc.doctorName}</span>
                              <span className="text-[9px] text-pink-300 font-mono ml-1.5 bg-pink-950/60 px-1 rounded">{doc.dob}</span>
                            </div>
                            {added ? (
                              <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-0.5">
                                <Check size={11} /> Added
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleQuickAddDoctorActivity(doc, 'DOB')}
                                className="px-2 py-0.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded text-[10px] transition cursor-pointer"
                              >
                                + Add DOB
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Anniversary Cards */}
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-purple-400 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Heart size={13} /> Anniversaries ({anniversaryDoctors.length}):</span>
                    <span className="text-[10px] text-slate-500 font-mono">1-Click Add</span>
                  </div>
                  {anniversaryDoctors.length === 0 ? (
                    <div className="text-[10px] text-slate-500 italic py-1">No anniversaries recorded for this month.</div>
                  ) : (
                    <div className="space-y-1">
                      {anniversaryDoctors.map(doc => {
                        const added = isDoctorAlreadyAdded(doc.doctorName, 'DOA');
                        return (
                          <div key={doc.srNo} className="flex items-center justify-between p-1.5 bg-slate-950 rounded-lg text-[11px]">
                            <div className="truncate max-w-[150px]">
                              <span className="font-bold text-white">{doc.doctorName}</span>
                              <span className="text-[9px] text-purple-300 font-mono ml-1.5 bg-purple-950/60 px-1 rounded">{doc.doa}</span>
                            </div>
                            {added ? (
                              <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-0.5">
                                <Check size={11} /> Added
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleQuickAddDoctorActivity(doc, 'DOA')}
                                className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-[10px] transition cursor-pointer"
                              >
                                + Add DOA
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Type Tabs */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              {ACTIVITY_TYPES.map(t => {
                const count = (activityComments[activeModalMonth] || []).filter(it => it.type === t.key).length;
                const isActive = activeTabType === t.key;

                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => { setActiveTabType(t.key); setDocSearchQuery(''); }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      isActive 
                        ? 'bg-amber-500 text-slate-950 shadow-md' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                    {count > 0 && (
                      <span className={`text-[10px] font-mono px-1 rounded-full ${isActive ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/20 text-amber-400'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Form Section with Master Doctor Search */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5 text-xs relative">
              <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
                <span>Manual / Custom {activeTabType} Entry:</span>
                {newEntry.doctorName && (
                  <span className="text-emerald-400 flex items-center gap-1 font-mono">
                    <Check size={12} /> Doctor Selected: {newEntry.doctorName}
                  </span>
                )}
              </div>

              {/* Master Doctor Search Input */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search Any Doctor (e.g. Abhay, Dave, Suresh, Mona)..."
                      value={docSearchQuery}
                      onChange={e => setDocSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="text"
                      placeholder="Date (15-Aug)"
                      value={newEntry.date}
                      onChange={e => setNewEntry({ ...newEntry, date: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-center rounded-xl px-2.5 py-1.5 text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {filteredMslDocs.length > 0 && (
                  <div className="absolute top-full left-0 right-28 mt-1 bg-slate-900 border-2 border-amber-500/60 rounded-xl shadow-2xl p-1.5 z-50 max-h-44 overflow-y-auto space-y-1">
                    {filteredMslDocs.map(doc => (
                      <div
                        key={doc.srNo}
                        onClick={() => handleSelectDoctor(doc)}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950 hover:bg-amber-950/60 border border-transparent text-xs cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[10px]">#{doc.srNo}</span>
                          <span className="font-bold text-white">{doc.doctorName}</span>
                          {doc.dob && <span className="text-[9px] text-pink-300 bg-pink-950/60 px-1 py-0.2 rounded font-mono">🎂 {doc.dob}</span>}
                          {doc.doa && <span className="text-[9px] text-purple-300 bg-purple-950/60 px-1 py-0.2 rounded font-mono">💍 {doc.doa}</span>}
                        </div>
                        <span className="text-[10px] text-amber-400 font-mono font-bold">Select ➔</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Doctor Name or Hospital Venue (or select from search)"
                  value={newEntry.doctorName}
                  onChange={e => setNewEntry({ ...newEntry, doctorName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-semibold rounded-xl px-3 py-1.5 text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Detailed Comment / Remarks (e.g. Birthday gift, sugar camp, clinic visit)..."
                  value={newEntry.comment}
                  onChange={e => setNewEntry({ ...newEntry, comment: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddActivityItem}
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Entry
                </button>
              </div>
            </div>

            {/* List of Added Entries */}
            <div className="flex-1 overflow-y-auto space-y-1.5 border border-slate-800 rounded-2xl p-2 bg-slate-950/60 max-h-[160px]">
              {(activityComments[activeModalMonth] || []).filter(it => it.type === activeTabType).length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-xs font-mono">
                  No {activeTabType} entries added yet for {activeModalMonth}.
                </div>
              ) : (
                (activityComments[activeModalMonth] || [])
                  .filter(it => it.type === activeTabType)
                  .map(it => (
                    <div key={it.id} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{it.doctorName || '(No Doctor Specified)'}</span>
                          {it.date && <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-500/30">{it.date}</span>}
                        </div>
                        {it.comment && <div className="text-[11px] text-slate-300 font-medium">{it.comment}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteActivityItem(it.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="font-mono text-slate-400">
                Live Slash Value: <b className="text-amber-400">{formData.activities?.[activeModalMonth] || '0/0/0/0/0/0'}</b>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalMonth(null)}
                className="px-5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                Done &amp; Save
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
"""

with open('src/components/review/EffortLevelSheet.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("✅ Successfully generated smart EffortLevelSheet.tsx with multi-month suggestions!")
