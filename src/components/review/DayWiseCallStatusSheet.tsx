import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  UserCheck, Pill, Calendar as CalendarIcon, Search, Download, 
  Bot, Loader2, Check, AlertTriangle, Stethoscope, 
  Terminal, X, CalendarDays, RefreshCw, Copy, FileDown,
  ToggleLeft, ToggleRight, RotateCcw,
  CalendarRange, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import { memoryStore, DcrDoctorCall, DcrChemistCall } from '../../data/memoryStore';
import { CloudSyncBar } from '../CloudSyncBar';

const CALLS_MASTER_DOCS_KEY = 'dios_call_status_master_doctors_v4';
const CALLS_MASTER_CHEMS_KEY = 'dios_call_status_master_chemists_v4';
const CALLS_LAST_RANGE_KEY = 'dios_call_status_active_range_v4';
const CALLS_SYNC_TOGGLE_KEY = 'dios_call_status_sync_toggle_v4';

const FY_MONTHS = [
  { label: 'Apr 2026', key: 'apr', from: '01/04/2026', to: '30/04/2026' },
  { label: 'May 2026', key: 'may', from: '01/05/2026', to: '31/05/2026' },
  { label: 'Jun 2026', key: 'jun', from: '01/06/2026', to: '30/06/2026' },
  { label: 'Jul 2026', key: 'jul', from: '01/07/2026', to: '31/07/2026' },
  { label: 'Aug 2026', key: 'aug', from: '01/08/2026', to: '31/08/2026' },
  { label: 'Sep 2026', key: 'sep', from: '01/09/2026', to: '30/09/2026' },
  { label: 'Oct 2026', key: 'oct', from: '01/10/2026', to: '31/10/2026' },
  { label: 'Nov 2026', key: 'nov', from: '01/11/2026', to: '30/11/2026' },
  { label: 'Dec 2026', key: 'dec', from: '01/12/2026', to: '31/12/2026' },
  { label: 'Jan 2027', key: 'jan', from: '01/01/2027', to: '31/01/2027' },
  { label: 'Feb 2027', key: 'feb', from: '01/02/2027', to: '28/02/2027' },
  { label: 'Mar 2027', key: 'mar', from: '01/03/2027', to: '31/03/2027' },
];

const RESET_OPTIONS = [
  { label: 'Active Range (Currently Selected)', key: 'ACTIVE' },
  { label: 'April 2026', key: 'apr', from: '01/04/2026', to: '30/04/2026' },
  { label: 'May 2026', key: 'may', from: '01/05/2026', to: '31/05/2026' },
  { label: 'June 2026', key: 'jun', from: '01/06/2026', to: '30/06/2026' },
  { label: 'July 2026', key: 'jul', from: '01/07/2026', to: '31/07/2026' },
  { label: 'August 2026', key: 'aug', from: '01/08/2026', to: '31/08/2026' },
  { label: 'September 2026', key: 'sep', from: '01/09/2026', to: '30/09/2026' },
  { label: 'October 2026', key: 'oct', from: '01/10/2026', to: '31/10/2026' },
  { label: 'November 2026', key: 'nov', from: '01/11/2026', to: '30/11/2026' },
  { label: 'December 2026', key: 'dec', from: '01/12/2026', to: '31/12/2026' },
  { label: 'January 2027', key: 'jan', from: '01/01/2027', to: '31/01/2027' },
  { label: 'February 2027', key: 'feb', from: '01/02/2027', to: '28/02/2027' },
  { label: 'March 2027', key: 'mar', from: '01/03/2027', to: '31/03/2027' },
  { label: 'All Months (Full Reset)', key: 'ALL' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const parseDateStr = (s: string): Date => {
  if (!s || !s.includes('/')) return new Date();
  const parts = s.split('/').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return new Date();
  return new Date(parts[2], parts[1] - 1, parts[0]);
};

const formatDateToDDMMYYYY = (d: Date): string => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const loadMasterDoctors = (): DcrDoctorCall[] => {
  try {
    const raw = localStorage.getItem(CALLS_MASTER_DOCS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
};

const loadMasterChemists = (): DcrChemistCall[] => {
  try {
    const raw = localStorage.getItem(CALLS_MASTER_CHEMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
};

interface MaterialDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDateStr: string;
  title: string;
  onSelectDate: (formattedDate: string) => void;
}

const MaterialDatePickerModal: React.FC<MaterialDatePickerModalProps> = ({
  isOpen,
  onClose,
  initialDateStr,
  title,
  onSelectDate
}) => {
  const initialDate = useMemo(() => parseDateStr(initialDateStr), [initialDateStr, isOpen]);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  useEffect(() => {
    if (isOpen) {
      const d = parseDateStr(initialDateStr);
      setSelectedDate(d);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [isOpen, initialDateStr]);

  if (!isOpen) return null;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleDaySelect = (dayNum: number) => {
    const newD = new Date(viewYear, viewMonth, dayNum);
    setSelectedDate(newD);
  };

  const handleConfirm = () => {
    const formatted = formatDateToDDMMYYYY(selectedDate);
    onSelectDate(formatted);
    onClose();
  };

  const weekdayShort = selectedDate.toLocaleDateString('en-US', { weekday: 'short' });
  const monthShort = selectedDate.toLocaleDateString('en-US', { month: 'short' });
  const dayNum = selectedDate.getDate();
  const fullYear = selectedDate.getFullYear();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-[340px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 p-5 text-white shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-widest text-purple-200">
            {title}
          </div>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-2xl font-bold tracking-tight">
              {weekdayShort}, {monthShort} {dayNum}
            </h3>
            <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-full font-bold">
              {fullYear}
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-950 text-slate-200">
          <div className="flex items-center justify-between px-1 mb-3">
            <span className="text-xs font-bold text-white tracking-wide">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dw, idx) => (
              <span key={idx} className="text-[11px] font-bold text-slate-500">
                {dw}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-8 w-8" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dNum = idx + 1;
              const isSelected = 
                selectedDate.getDate() === dNum &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getFullYear() === viewYear;

              return (
                <div key={dNum} className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleDaySelect(dNum)}
                    className={`h-8 w-8 rounded-full text-xs font-semibold flex items-center justify-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/50 scale-105'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {dNum}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-3 bg-slate-950 border-t border-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white tracking-wider uppercase transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white tracking-wider uppercase rounded-xl shadow-md transition cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export const DayWiseCallStatusSheet: React.FC = () => {
  const [masterDoctors, setMasterDoctors] = useState<DcrDoctorCall[]>(() => loadMasterDoctors());
  const [masterChemists, setMasterChemists] = useState<DcrChemistCall[]>(() => loadMasterChemists());

  const [fromDate, setFromDate] = useState<string>(() => {
    try {
      const savedRange = localStorage.getItem(CALLS_LAST_RANGE_KEY);
      if (savedRange) return JSON.parse(savedRange).fromDate || '01/04/2026';
    } catch (e) {}
    return '01/04/2026';
  });

  const [toDate, setToDate] = useState<string>(() => {
    try {
      const savedRange = localStorage.getItem(CALLS_LAST_RANGE_KEY);
      if (savedRange) return JSON.parse(savedRange).toDate || '30/09/2026';
    } catch (e) {}
    return '30/09/2026';
  });

  const [activePickerTarget, setActivePickerTarget] = useState<'from' | 'to' | null>(null);
  const [activeTab, setActiveTab] = useState<'doctors' | 'chemists'>('doctors');
  const [search, setSearch] = useState('');
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(100);
  const [currentStep, setCurrentStep] = useState('Data loaded from master memory');
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logsCopied, setLogsCopied] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState<{ title: string; details: string } | null>(null);

  const [syncToMsl, setSyncToMsl] = useState<boolean>(() => {
    try {
      const savedSync = localStorage.getItem(CALLS_SYNC_TOGGLE_KEY);
      if (savedSync !== null) return JSON.parse(savedSync);
    } catch (e) {}
    return memoryStore.mslSyncEnabled ?? true;
  });

  const [selectedResetTarget, setSelectedResetTarget] = useState<string>('ACTIVE');
  const [missedDates, setMissedDates] = useState<any[]>([]);
  const [isRetryingMissed, setIsRetryingMissed] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);
  const taskId = `${fromDate}_${toDate}`;

  const { filteredDoctors, filteredChemists } = useMemo(() => {
    const fDt = parseDateStr(fromDate);
    const tDt = parseDateStr(toDate);

    const docs = masterDoctors.filter(d => {
      const dt = parseDateStr(d.date);
      return dt >= fDt && dt <= tDt;
    });

    const chems = masterChemists.filter(c => {
      const dt = parseDateStr(c.date);
      return dt >= fDt && dt <= tDt;
    });

    return { filteredDoctors: docs, filteredChemists: chems };
  }, [masterDoctors, masterChemists, fromDate, toDate]);

  useEffect(() => {
    if (!memoryStore.dcrCallsByMonth) memoryStore.dcrCallsByMonth = {};
    memoryStore.dcrCallsByMonth[taskId] = { 
      doctors: filteredDoctors, 
      chemists: filteredChemists 
    };
    try {
      localStorage.setItem(CALLS_LAST_RANGE_KEY, JSON.stringify({ fromDate, toDate }));
    } catch (e) {}
  }, [filteredDoctors, filteredChemists, fromDate, toDate, taskId]);

  useEffect(() => {
    if (showLogs && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveLogs, showLogs]);

  const handleApplyPreset = (f: string, t: string) => {
    setFromDate(f);
    setToDate(t);
    setDiagnosticError(null);
  };

  const persistMasterCalls = (newDocs: DcrDoctorCall[], newChems: DcrChemistCall[]) => {
    const docMap = new Map<string, DcrDoctorCall>();
    masterDoctors.forEach(d => docMap.set(`${d.date}_${d.docName}_${d.visitTime}`, d));
    newDocs.forEach(d => docMap.set(`${d.date}_${d.docName}_${d.visitTime}`, d));

    const chemMap = new Map<string, DcrChemistCall>();
    masterChemists.forEach(c => chemMap.set(`${c.date}_${c.chemistName}_${c.visitTime}`, c));
    newChems.forEach(c => chemMap.set(`${c.date}_${c.chemistName}_${c.visitTime}`, c));

    const mergedDocs = Array.from(docMap.values()).sort((a, b) => parseDateStr(a.date).getTime() - parseDateStr(b.date).getTime());
    const mergedChems = Array.from(chemMap.values()).sort((a, b) => parseDateStr(a.date).getTime() - parseDateStr(b.date).getTime());

    setMasterDoctors(mergedDocs);
    setMasterChemists(mergedChems);

    try {
      localStorage.setItem(CALLS_MASTER_DOCS_KEY, JSON.stringify(mergedDocs));
      localStorage.setItem(CALLS_MASTER_CHEMS_KEY, JSON.stringify(mergedChems));
    } catch (e) {}
  };

  const handleToggleSync = () => {
    const nextState = !syncToMsl;
    setSyncToMsl(nextState);
    memoryStore.mslSyncEnabled = nextState;
    try {
      localStorage.setItem(CALLS_SYNC_TOGGLE_KEY, JSON.stringify(nextState));
    } catch (e) {}
  };

  const handleResetTarget = () => {
    if (selectedResetTarget === 'ALL') {
      if (window.confirm("⚠️ Kya aap Call Status ka POORA DATA (All Months) permanently reset karna chahte hain?")) {
        setMasterDoctors([]);
        setMasterChemists([]);
        setMissedDates([]);
        setLiveLogs([]);
        try {
          localStorage.removeItem(CALLS_MASTER_DOCS_KEY);
          localStorage.removeItem(CALLS_MASTER_CHEMS_KEY);
        } catch (e) {}
      }
      return;
    }

    let rFrom = fromDate;
    let rTo = toDate;
    let rLabel = `Active Range (${fromDate} to ${toDate})`;

    if (selectedResetTarget !== 'ACTIVE') {
      const opt = RESET_OPTIONS.find(o => o.key === selectedResetTarget);
      if (opt && opt.from && opt.to) {
        rFrom = opt.from;
        rTo = opt.to;
        rLabel = opt.label;
      }
    }

    if (window.confirm(`Kya aap sirf '${rLabel}' ka Call Status data reset karna chahte hain? Baaki months ka data safe rahega.`)) {
      const fDt = parseDateStr(rFrom);
      const tDt = parseDateStr(rTo);

      const remainingDocs = masterDoctors.filter(d => {
        const dt = parseDateStr(d.date);
        return !(dt >= fDt && dt <= tDt);
      });

      const remainingChems = masterChemists.filter(c => {
        const dt = parseDateStr(c.date);
        return !(dt >= fDt && dt <= tDt);
      });

      setMasterDoctors(remainingDocs);
      setMasterChemists(remainingChems);

      try {
        localStorage.setItem(CALLS_MASTER_DOCS_KEY, JSON.stringify(remainingDocs));
        localStorage.setItem(CALLS_MASTER_CHEMS_KEY, JSON.stringify(remainingChems));
      } catch (e) {}
    }
  };

  const handleCopyLogs = () => {
    const fullLogText = liveLogs.join('\n');
    if (!fullLogText) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullLogText).then(() => {
        setLogsCopied(true);
        setTimeout(() => setLogsCopied(false), 2500);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = fullLogText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setLogsCopied(true);
      setTimeout(() => setLogsCopied(false), 2500);
    }
  };

  const handleDownloadLogs = () => {
    const fullLogText = liveLogs.join('\n');
    if (!fullLogText) return;
    const blob = new Blob([fullLogText], { type: 'text/plain;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `CBO_Crawl_Logs_${fromDate.replace(/\//g, '-')}_to_${toDate.replace(/\//g, '-')}.txt`;
    a.click();
  };

  const handleStartLiveExtraction = async () => {
    setIsExtracting(true);
    setProgressPercent(5);
    setCurrentStep(`Connecting to CBO for ${fromDate} to ${toDate}...`);
    setLiveLogs([`[${new Date().toLocaleTimeString()}] Starting extraction for ${fromDate} to ${toDate}...`]);
    setDiagnosticError(null);
    setMissedDates([]);
    setShowLogs(true);

    try {
      const startRes = await fetch('/api/start-dcr-extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_date: fromDate, to_date: toDate })
      });

      const startData = await startRes.json();
      if (!startData.success) throw new Error(startData.error || 'Failed to start');

      const intervalId = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/extraction-status?taskId=${encodeURIComponent(taskId)}`);
          const pollData = await pollRes.json();

          if (pollData.percent !== undefined) setProgressPercent(pollData.percent);
          if (pollData.step) setCurrentStep(pollData.step);
          if (pollData.logs && pollData.logs.length > 0) setLiveLogs(pollData.logs);

          if (pollData.status === 'completed') {
            clearInterval(intervalId);
            setIsExtracting(false);
            setProgressPercent(100);
            const docs = pollData.doctors || [];
            const chems = pollData.chemists || [];
            const missed = pollData.missed_dates || [];

            persistMasterCalls(docs, chems);
            setMissedDates(missed);
          } else if (pollData.status === 'failed') {
            clearInterval(intervalId);
            setIsExtracting(false);
            setDiagnosticError({ title: 'Extraction Error', details: pollData.error || 'Crawler stopped.' });
          }
        } catch (e) {
          console.warn('Poll skip:', e);
        }
      }, 1500);

    } catch (err: any) {
      setIsExtracting(false);
      setDiagnosticError({ title: 'Connection Error', details: err.message });
    }
  };

  const handleRetryMissedDates = async () => {
    if (missedDates.length === 0) return;

    setIsExtracting(true);
    setIsRetryingMissed(true);
    setProgressPercent(15);
    setCurrentStep(`Starting recovery for ${missedDates.length} missed dates...`);
    setLiveLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔄 [1-CLICK RECOVERY] Starting recovery...`]);
    setShowLogs(true);

    try {
      const res = await fetch('/api/retry-missed-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, missed_dates: missedDates })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to start recovery');

      const intervalId = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/extraction-status?taskId=${encodeURIComponent(taskId)}`);
          const pollData = await pollRes.json();

          if (pollData.percent !== undefined) setProgressPercent(pollData.percent);
          if (pollData.step) setCurrentStep(pollData.step);
          if (pollData.logs && pollData.logs.length > 0) setLiveLogs(pollData.logs);

          if (pollData.status === 'completed') {
            clearInterval(intervalId);
            setIsExtracting(false);
            setIsRetryingMissed(false);
            setProgressPercent(100);
            const docs = pollData.doctors || [];
            const chems = pollData.chemists || [];
            const missed = pollData.missed_dates || [];

            persistMasterCalls(docs, chems);
            setMissedDates(missed);
          }
        } catch (e) {
          console.warn('Poll skip:', e);
        }
      }, 1500);

    } catch (err: any) {
      setIsExtracting(false);
      setIsRetryingMissed(false);
      setDiagnosticError({ title: 'Recovery Error', details: err.message });
    }
  };

  // 100% UNTOUCHED Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'doctors') {
      let csv = `Date,Day,Employee,Station,Route,Work_With,Sr_No,Doctor_Name,Doctor_Code,Speciality,Area,Visit_Time,Products_Sample,Gift,Rx_Qty,POB_Amount,Call_Type,Remarks\n`;
      filteredDoctors.forEach(d => {
        csv += `"${d.date}","${d.day}","BANWARI LAL MEENA","${d.station}","${d.route}","${d.workWith}","${d.srNo}","${d.docName}","${d.docCode}","${d.speciality}","${d.area}","${d.visitTime}","${d.prodSample}","${d.gift}","${d.rxQty}","${d.pobAmt}","${d.callType}","${d.remarks}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `DayWise_Doctors_${fromDate.replace(/\//g, '-')}_to_${toDate.replace(/\//g, '-')}.csv`;
      a.click();
    } else {
      let csv = `Date,Day,Employee,Station,Sr_No,Chemist_Name,Address,Visit_Time,Products,POB_Amount,Remarks\n`;
      filteredChemists.forEach(c => {
        csv += `"${c.date}","${c.day}","BANWARI LAL MEENA","${c.station}","${c.srNo}","${c.chemistName}","${c.address}","${c.visitTime}","${c.products}","${c.pobAmt}","${c.remarks}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `DayWise_Chemists_${fromDate.replace(/\//g, '-')}_to_${toDate.replace(/\//g, '-')}.csv`;
      a.click();
    }
  };

  const searchDoctors = filteredDoctors.filter(d => 
    (d.docName || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.speciality || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.station || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.date || '').includes(search)
  );

  const searchChemists = filteredChemists.filter(c => 
    (c.chemistName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.station || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.date || '').includes(search)
  );

  const totalDoctorPob = filteredDoctors.reduce((sum, d) => sum + (parseFloat(d.pobAmt) || 0), 0);
  const totalChemistPob = filteredChemists.reduce((sum, c) => sum + (parseFloat(c.pobAmt) || 0), 0);
  const uniqueDates = new Set([...filteredDoctors.map(d => d.date), ...filteredChemists.map(c => c.date)]).size;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
      
      {/* 1. MATERIAL DESIGN DATE PICKER DIALOG POPUP */}
      <MaterialDatePickerModal
        isOpen={activePickerTarget !== null}
        onClose={() => setActivePickerTarget(null)}
        initialDateStr={activePickerTarget === 'from' ? fromDate : toDate}
        title={activePickerTarget === 'from' ? 'SELECT FROM DATE' : 'SELECT TO DATE'}
        onSelectDate={(newDateStr) => {
          if (activePickerTarget === 'from') {
            setFromDate(newDateStr);
          } else if (activePickerTarget === 'to') {
            setToDate(newDateStr);
          }
        }}
      />

      {/* 2. Top Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
            <UserCheck size={20} />
          </span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              15. DAY WISE CALL STATUS REPORT
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                Cloud Sync Ready
              </span>
            </h2>
            <p className="text-xs text-slate-400">BE: BANWARI LAL MEENA • Active Range: <span className="text-cyan-400 font-bold font-mono">{fromDate}</span> ➔ <span className="text-cyan-400 font-bold font-mono">{toDate}</span></p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* SYNC TO MSL TOGGLE */}
          <button
            onClick={handleToggleSync}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              syncToMsl 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-md shadow-emerald-950/50' 
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
            }`}
            title="When ON, extracted visits auto-sync to 14. MSL Schedule"
          >
            {syncToMsl ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} className="text-slate-500" />}
            <span>Sync to MSL: <b className={syncToMsl ? "text-emerald-400" : "text-slate-400"}>{syncToMsl ? "ON" : "OFF"}</b></span>
          </button>

          {/* LIVE CBO FETCH BUTTON */}
          <button
            onClick={handleStartLiveExtraction}
            disabled={isExtracting}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition cursor-pointer"
          >
            {isExtracting ? <Loader2 size={15} className="animate-spin" /> : <Bot size={15} />}
            {isExtracting ? `Extracting (${progressPercent}%)` : '⚡ Live CBO Fetch'}
          </button>

          {/* 100% UNTOUCHED Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* ☁️ DEDICATED CLOUD SYNC TOOLBAR */}
      <CloudSyncBar
        storageKey="review/sheet_15_call_status"
        sheetTitle="15. Day Wise Call Status Report"
        getData={() => ({
          masterDoctors,
          masterChemists,
          lastRange: { fromDate, toDate },
          syncToMsl
        })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.masterDoctors && Array.isArray(cloudData.masterDoctors)) {
            setMasterDoctors(cloudData.masterDoctors);
            try { localStorage.setItem(CALLS_MASTER_DOCS_KEY, JSON.stringify(cloudData.masterDoctors)); } catch (e) {}
          }
          if (cloudData.masterChemists && Array.isArray(cloudData.masterChemists)) {
            setMasterChemists(cloudData.masterChemists);
            try { localStorage.setItem(CALLS_MASTER_CHEMS_KEY, JSON.stringify(cloudData.masterChemists)); } catch (e) {}
          }
          if (cloudData.lastRange) {
            if (cloudData.lastRange.fromDate) setFromDate(cloudData.lastRange.fromDate);
            if (cloudData.lastRange.toDate) setToDate(cloudData.lastRange.toDate);
          }
          if (cloudData.syncToMsl !== undefined) {
            setSyncToMsl(cloudData.syncToMsl);
            memoryStore.mslSyncEnabled = cloudData.syncToMsl;
          }
        }}
        onSaveLocal={() => {
          try {
            localStorage.setItem(CALLS_MASTER_DOCS_KEY, JSON.stringify(masterDoctors));
            localStorage.setItem(CALLS_MASTER_CHEMS_KEY, JSON.stringify(masterChemists));
            localStorage.setItem(CALLS_LAST_RANGE_KEY, JSON.stringify({ fromDate, toDate }));
            localStorage.setItem(CALLS_SYNC_TOGGLE_KEY, JSON.stringify(syncToMsl));
          } catch (e) {}
        }}
      />

      {/* 3. FY MONTH PRESETS WITH LIVE SAVED DATA INDICATORS & CALL COUNTS */}
      <div className="space-y-2.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5"><CalendarDays size={13} className="text-cyan-400" /> FY 2026-2027 Month Presets (Live Call Badges):</span>
          <span className="text-slate-500">Tap to Auto-Load Month</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {FY_MONTHS.map(m => {
            const isSelected = fromDate === m.from && toDate === m.to;
            const fD = parseDateStr(m.from);
            const tD = parseDateStr(m.to);
            const monthCallCount = masterDoctors.filter(d => {
              const dt = parseDateStr(d.date);
              return dt >= fD && dt <= tD;
            }).length;

            return (
              <button
                key={m.label}
                onClick={() => handleApplyPreset(m.from, m.to)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-md shadow-cyan-950'
                    : monthCallCount > 0
                    ? 'bg-slate-900 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{m.label}</span>
                {monthCallCount > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-cyan-500/20 text-cyan-300'}`}>
                    {monthCallCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 4. CUSTOM DATE RANGE WITH MATERIAL DATE PICKER DIALOG TRIGGERS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-900 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <CalendarRange size={13} className="text-cyan-400" /> Custom Range:
            </span>

            <div 
              onClick={() => setActivePickerTarget('from')}
              className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-purple-500 cursor-pointer transition shadow-sm"
              title="Tap to open Material Date Picker Dialog"
            >
              <span className="text-slate-400 text-xs">From:</span>
              <span className="font-mono font-bold text-cyan-300 text-xs">{fromDate}</span>
              <button type="button" className="p-1 text-purple-400 hover:text-purple-300 rounded-lg transition">
                <CalendarIcon size={14} />
              </button>
            </div>

            <span className="text-slate-500 font-bold">➔</span>

            <div 
              onClick={() => setActivePickerTarget('to')}
              className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-purple-500 cursor-pointer transition shadow-sm"
              title="Tap to open Material Date Picker Dialog"
            >
              <span className="text-slate-400 text-xs">To:</span>
              <span className="font-mono font-bold text-cyan-300 text-xs">{toDate}</span>
              <button type="button" className="p-1 text-purple-400 hover:text-purple-300 rounded-lg transition">
                <CalendarIcon size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold pl-1 flex items-center gap-1">
              <Filter size={11} /> Reset Target:
            </span>
            <select
              value={selectedResetTarget}
              onChange={e => setSelectedResetTarget(e.target.value)}
              className="bg-slate-950 text-xs font-bold text-amber-400 px-2 py-1 rounded-lg border border-slate-800 focus:outline-none cursor-pointer"
            >
              {RESET_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleResetTarget}
              className="flex items-center gap-1 px-3 py-1 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg text-xs font-bold transition cursor-pointer"
              title="Reset selected month / range"
            >
              <RotateCcw size={12} /> 🧹 Reset
            </button>
          </div>
        </div>
      </div>

      {/* 5. Missed Dates Action Card */}
      {missedDates.length > 0 && (
        <div className="p-3.5 bg-amber-950/70 border-2 border-amber-500/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-300">
                {missedDates.length} Date(s) had server lag / incomplete data:
              </div>
              <div className="text-[11px] text-amber-200 font-mono mt-0.5">
                {missedDates.map((m, idx) => (
                  <span key={idx} className="inline-block bg-amber-900/50 px-2 py-0.5 rounded border border-amber-500/30 mr-1 mb-1">
                    📅 {m.date} ({m.expected} Drs)
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleRetryMissedDates}
            disabled={isExtracting}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition cursor-pointer shrink-0"
          >
            <RefreshCw size={14} className={isRetryingMissed ? "animate-spin" : ""} />
            🔄 Re-Fetch &amp; Merge Missed Dates
          </button>
        </div>
      )}

      {/* 6. PERMANENT CBO CRAWL & TERMINAL LOGS HUD */}
      {(liveLogs.length > 0 || isExtracting) && (
        <div className="p-4 bg-slate-950 rounded-2xl border-2 border-purple-500/70 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className={`${isExtracting ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75`}></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {isExtracting ? `Live CBO Crawl In Progress (${fromDate} ➔ ${toDate})` : `CBO Extraction Log History (${fromDate} ➔ ${toDate})`}
              </span>
            </div>
            <div className="text-xl font-black font-mono text-purple-400">
              {progressPercent}%
            </div>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800 p-0.5">
            <div 
              className="bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-lg shadow-purple-500/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pt-1">
            <span className="text-cyan-300 font-semibold truncate max-w-[50%]">
              👉 {currentStep}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLogs}
                className="flex items-center gap-1.5 text-xs font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 px-3 py-1 rounded-xl transition cursor-pointer shadow-md"
              >
                {logsCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {logsCopied ? "✅ Logs Copied!" : "📋 Copy Log History"}
              </button>

              <button
                type="button"
                onClick={handleDownloadLogs}
                className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-xl transition cursor-pointer"
              >
                <FileDown size={14} /> 💾 Download .txt
              </button>

              <button
                onClick={() => setShowLogs(!showLogs)}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] underline cursor-pointer pl-1"
              >
                <Terminal size={12} /> {showLogs ? 'Hide Logs' : 'View Logs'}
              </button>
            </div>
          </div>

          {showLogs && (
            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 max-h-48 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1">
              {liveLogs.map((lg, i) => (
                <div key={i} className="leading-tight select-text">{lg}</div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      )}

      {/* ERROR DIAGNOSTICS */}
      {diagnosticError && (
        <div className="p-4 bg-rose-950/80 border-2 border-rose-500 rounded-2xl text-xs space-y-2">
          <div className="flex items-center justify-between text-rose-300 font-bold">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-400 shrink-0" />
              <span>{diagnosticError.title}</span>
            </div>
            <button onClick={() => setDiagnosticError(null)} className="p-1 text-rose-300 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="text-slate-200 font-mono text-[11px] bg-slate-950/70 p-2.5 rounded-xl border border-rose-900/60">
            {diagnosticError.details}
          </div>
        </div>
      )}

      {/* 7. Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Working Days</div>
          <div className="text-lg font-bold text-white font-mono mt-0.5">{uniqueDates} Days</div>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-cyan-400 uppercase font-semibold">Doctor Calls Met</div>
          <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">{filteredDoctors.length} Calls</div>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-emerald-400 uppercase font-semibold">Chemist Calls Met</div>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{filteredChemists.length} Calls</div>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-amber-400 uppercase font-semibold">Total POB Amount</div>
          <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
            ₹ {Math.round(totalDoctorPob + totalChemistPob).toLocaleString()}
          </div>
        </div>
      </div>

      {/* 8. Toggle Doctors vs Chemists & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex-1 sm:flex-none ${
              activeTab === 'doctors'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Stethoscope size={14} /> Doctor Calls ({filteredDoctors.length})
          </button>
          <button
            onClick={() => setActiveTab('chemists')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex-1 sm:flex-none ${
              activeTab === 'chemists'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Pill size={14} /> Chemist Calls ({filteredChemists.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={activeTab === 'doctors' ? "Search doctor, spec, station..." : "Search chemist, station..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* 9. TABLES */}
      {activeTab === 'doctors' ? (
        <div className="overflow-x-auto max-h-[580px] border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
              <tr>
                <th className="p-2.5 text-center w-10">#</th>
                <th className="p-2.5 min-w-[95px]">Date</th>
                <th className="p-2.5 min-w-[80px]">Day</th>
                <th className="p-2.5 min-w-[120px]">Station / Area</th>
                <th className="p-2.5 min-w-[180px] text-white">Doctor Name</th>
                <th className="p-2.5 min-w-[130px] text-cyan-400">Speciality</th>
                <th className="p-2.5 min-w-[100px]">Visit Time</th>
                <th className="p-2.5 min-w-[120px]">Work With</th>
                <th className="p-2.5 min-w-[160px]">Products Sampled</th>
                <th className="p-2.5 text-center w-20">Rx Qty</th>
                <th className="p-2.5 text-right w-24 text-amber-400">POB (₹)</th>
                <th className="p-2.5 min-w-[130px]">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {searchDoctors.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-500">
                    {filteredDoctors.length === 0 
                      ? 'Upar Dates check karke "⚡ Live CBO Fetch" button dabayein.'
                      : 'Search query se koi doctor call match nahi hui.'}
                  </td>
                </tr>
              ) : (
                searchDoctors.map((doc, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="p-2 text-center text-slate-500 font-mono">{i + 1}</td>
                    <td className="p-2 font-mono text-cyan-300">{doc.date}</td>
                    <td className="p-2 text-slate-400">{doc.day}</td>
                    <td className="p-2 text-slate-300 font-medium">{doc.area || doc.station}</td>
                    <td className="p-2 font-bold text-white">
                      {doc.docName}
                      {doc.docCode && <span className="text-[10px] text-slate-500 ml-1">({doc.docCode})</span>}
                    </td>
                    <td className="p-2 text-cyan-400 font-semibold">{doc.speciality || '-'}</td>
                    <td className="p-2 font-mono text-slate-400">{doc.visitTime || '-'}</td>
                    <td className="p-2 text-slate-400">{doc.workWith || 'Independent'}</td>
                    <td className="p-2 text-slate-300">{doc.prodSample || '-'}</td>
                    <td className="p-2 text-center font-mono text-slate-300">{doc.rxQty || '-'}</td>
                    <td className="p-2 text-right font-mono font-bold text-amber-300">{doc.pobAmt || '0'}</td>
                    <td className="p-2 text-slate-400">{doc.remarks || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[580px] border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
              <tr>
                <th className="p-2.5 text-center w-10">#</th>
                <th className="p-2.5 min-w-[95px]">Date</th>
                <th className="p-2.5 min-w-[80px]">Day</th>
                <th className="p-2.5 min-w-[120px]">Station</th>
                <th className="p-2.5 min-w-[200px] text-white">Chemist Name</th>
                <th className="p-2.5 min-w-[180px]">Address / Location</th>
                <th className="p-2.5 min-w-[100px]">Visit Time</th>
                <th className="p-2.5 min-w-[180px]">Products Promoted</th>
                <th className="p-2.5 text-right w-24 text-emerald-400">POB (₹)</th>
                <th className="p-2.5 min-w-[140px]">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {searchChemists.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    {filteredChemists.length === 0 
                      ? 'Upar Dates check karke "⚡ Live CBO Fetch" button dabayein.'
                      : 'Search query se koi chemist call match nahi hui.'}
                  </td>
                </tr>
              ) : (
                searchChemists.map((chem, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="p-2 text-center text-slate-500 font-mono">{i + 1}</td>
                    <td className="p-2 font-mono text-cyan-300">{chem.date}</td>
                    <td className="p-2 text-slate-400">{chem.day}</td>
                    <td className="p-2 text-slate-300 font-medium">{chem.station}</td>
                    <td className="p-2 font-bold text-white">{chem.chemistName}</td>
                    <td className="p-2 text-slate-400">{chem.address || '-'}</td>
                    <td className="p-2 font-mono text-slate-400">{chem.visitTime || '-'}</td>
                    <td className="p-2 text-slate-300">{chem.products || '-'}</td>
                    <td className="p-2 text-right font-mono font-bold text-emerald-300">{chem.pobAmt || '0'}</td>
                    <td className="p-2 text-slate-400">{chem.remarks || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
