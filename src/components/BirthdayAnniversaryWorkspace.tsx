import React, { useState, useMemo, useEffect } from 'react';
import { 
  Cake, Heart, Calendar, Search, Download, Filter, 
  Check, X, Sparkles, Building2, UserCheck, AlertTriangle, 
  Baby, Users, ArrowLeft, RefreshCw, Edit3, ChevronRight,
  ShieldCheck, Eye, EyeOff, Plus, Trash2
} from 'lucide-react';
import { MASTER_123_MSL_DOCTORS } from './review/MslSheet';
import { memoryStore, MslDoctor } from '../data/memoryStore';
import { CloudSyncBar } from './CloudSyncBar';

interface Props {
  onBack: () => void;
}

export interface DoctorFamilyRecord {
  son1_dob?: string;
  son2_dob?: string;
  daughter1_dob?: string;
  daughter2_dob?: string;
  father_dob?: string;
  father_doa?: string;
  notes?: string;
}

const CELEBRATIONS_FAMILY_STORAGE_KEY = 'dios_doctor_family_celebrations_v1';
const MSL_STORAGE_KEY = 'dios_msl_schedule_permanent_v5';

const STATIONS = [
  { id: 'ALL', label: 'All Stations' },
  { id: 'UDAIPUR', label: 'Udaipur (HQ)' },
  { id: 'BANSWARA', label: 'Banswara (Ex-HQ)' },
  { id: 'DUNGARPUR', label: 'Dungarpur (Ex-HQ)' },
  { id: 'CHITTORGARH', label: 'Chittorgarh (Ex-HQ)' },
  { id: 'RAJSAMAND', label: 'Rajsamand (Ex-HQ)' }
];

const clean = (s: string) => (s || '').toUpperCase().replace(/^(DR\.?|DR\s+)/i, '').replace(/[^A-Z]/g, '');

const detectDoctorStation = (doc: MslDoctor): 'UDAIPUR' | 'BANSWARA' | 'DUNGARPUR' | 'CHITTORGARH' | 'RAJSAMAND' => {
  const c = clean(doc.doctorName);

  // 1. Rajsamand: HC Soni, Anmol Pagariya, Kripa Shankar, Bhupesh Partani, MK Meena, Manish Khandelwal, M Vijayvargiy, Satish Choudhary, Sunil Upadhay
  if (
    c.includes('HCSONI') || c.includes('ANMOLPAGARIYA') || c.includes('KRIPASHANKAR') ||
    c.includes('BHUPESHPARTANI') || c.includes('MKMEENA') || c.includes('MANISHKHANDELWAL') ||
    c.includes('MVIJAYVARGIY') || c.includes('SATISHCHOUDHARY') || c.includes('SUNILUPADHAY')
  ) {
    return 'RAJSAMAND';
  }

  // 2. Chittorgarh: Lalit Jainani, Anish Jain, Madhup Baxi, Shushil Chouhan, Sandeep Chandoliya, Anurag Jain, JL Pungliya
  if (
    c.includes('LALITJAINANI') || c.includes('ANISHJAIN') || c.includes('MADHUPBAXI') ||
    c.includes('SHUSHILCHOUHAN') || c.includes('SANDEEPCHANDOLIYA') || c.includes('ANURAGJAIN') ||
    c.includes('JLPUNGLIYA') || c.includes('PUNGLIYA')
  ) {
    return 'CHITTORGARH';
  }

  // 3. Dungarpur: Pintu Aahari, Kanti Lal Megwal, Rajesh Siroiya, KN Das, Rahul Panchal
  if (
    c.includes('PINTUAAHARI') || c.includes('KANTILALMEGWAL') || c.includes('RAJESHSIROIYA') ||
    c.includes('KNDAS') || (c.includes('RAHULPANCHAL') && doc.srNo === 17)
  ) {
    return 'DUNGARPUR';
  }

  // 4. Banswara: Jimesh Pandya, Ashwin Patidar, Deepa Katara, Harish Charpota, Mayank Sharma, Navneet Patel Kiyda, Yash Shah
  if (
    c.includes('JIMESHPANDYA') || c.includes('ASHWINPATIDAR') || c.includes('DEEPAKATARA') ||
    c.includes('HARISHCHARPOTA') || c.includes('MAYANKSHARMA') || c.includes('NAVNEETPATEL') ||
    c.includes('YASHSHAH')
  ) {
    return 'BANSWARA';
  }

  return 'UDAIPUR';
};

const getMonthNumFromDateStr = (dateStr: string): number | null => {
  if (!dateStr || !dateStr.includes('/')) return null;
  const parts = dateStr.split('/');
  if (parts.length >= 2) {
    const m = parseInt(parts[1], 10);
    if (!isNaN(m) && m >= 1 && m <= 12) return m;
  }
  return null;
};

export const BirthdayAnniversaryWorkspace: React.FC<Props> = ({ onBack }) => {
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MISSING_DOB' | 'MISSING_DOA' | 'MISSING_BOTH' | 'FULLY_UPDATED' | 'UPCOMING_MONTH'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [search, setSearch] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Doctors list directly synced from MSL
  const [mslDoctors, setMslDoctors] = useState<MslDoctor[]>(() => {
    try {
      const saved = localStorage.getItem(MSL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return memoryStore.mslData || MASTER_123_MSL_DOCTORS;
  });

  // Doctor Family Details Dictionary: { [srNo]: DoctorFamilyRecord }
  const [familyData, setFamilyData] = useState<Record<number, DoctorFamilyRecord>>(() => {
    try {
      const saved = localStorage.getItem(CELEBRATIONS_FAMILY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // Active Doctor Family Editor Modal
  const [editingDoc, setEditingDoc] = useState<MslDoctor | null>(null);
  const [editForm, setEditForm] = useState<{
    dob: string;
    doa: string;
    son1_dob: string;
    son2_dob: string;
    daughter1_dob: string;
    daughter2_dob: string;
    father_dob: string;
    father_doa: string;
    notes: string;
  }>({
    dob: '',
    doa: '',
    son1_dob: '',
    son2_dob: '',
    daughter1_dob: '',
    daughter2_dob: '',
    father_dob: '',
    father_doa: '',
    notes: ''
  });

  // Sync MSL changes to localStorage and memoryStore
  const persistMslAndFamily = (updatedMsl: MslDoctor[], updatedFamily = familyData) => {
    setMslDoctors(updatedMsl);
    setFamilyData(updatedFamily);
    memoryStore.mslData = updatedMsl;

    try {
      localStorage.setItem(MSL_STORAGE_KEY, JSON.stringify(updatedMsl));
      localStorage.setItem(CELEBRATIONS_FAMILY_STORAGE_KEY, JSON.stringify(updatedFamily));
    } catch (e) {}
  };

  // 🌟 TWO-WAY SYNC: Update doctor DOB or DOA inline and push to MSL
  const handleInlineDoctorDateChange = (srNo: number, field: 'dob' | 'doa', val: string) => {
    const updated = mslDoctors.map(d => d.srNo === srNo ? { ...d, [field]: val.trim() } : d);
    persistMslAndFamily(updated);
  };

  const handleOpenEditModal = (doc: MslDoctor) => {
    setEditingDoc(doc);
    const fam = familyData[doc.srNo] || {};
    setEditForm({
      dob: doc.dob || '',
      doa: doc.doa || '',
      son1_dob: fam.son1_dob || '',
      son2_dob: fam.son2_dob || '',
      daughter1_dob: fam.daughter1_dob || '',
      daughter2_dob: fam.daughter2_dob || '',
      father_dob: fam.father_dob || '',
      father_doa: fam.father_doa || '',
      notes: fam.notes || ''
    });
  };

  const handleSaveModal = () => {
    if (!editingDoc) return;

    // 1. Update Doctor DOB & DOA in MSL list
    const updatedMsl = mslDoctors.map(d => {
      if (d.srNo === editingDoc.srNo) {
        return {
          ...d,
          dob: editForm.dob.trim(),
          doa: editForm.doa.trim()
        };
      }
      return d;
    });

    // 2. Update Family details
    const updatedFamily = {
      ...familyData,
      [editingDoc.srNo]: {
        son1_dob: editForm.son1_dob.trim(),
        son2_dob: editForm.son2_dob.trim(),
        daughter1_dob: editForm.daughter1_dob.trim(),
        daughter2_dob: editForm.daughter2_dob.trim(),
        father_dob: editForm.father_dob.trim(),
        father_doa: editForm.father_doa.trim(),
        notes: editForm.notes.trim()
      }
    };

    persistMslAndFamily(updatedMsl, updatedFamily);
    setEditingDoc(null);
    setStatusMsg(`🎉 Dr. ${editingDoc.doctorName} ke Celebrations & MSL Schedule successfully update ho gaye!`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Filtered doctors list
  const filteredDoctors = useMemo(() => {
    return mslDoctors.filter(doc => {
      // 1. Station check
      const station = detectDoctorStation(doc);
      if (stationFilter !== 'ALL' && station !== stationFilter) return false;

      // 2. Search check
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = doc.doctorName.toLowerCase().includes(q);
        const matchSpec = (doc.speciality || '').toLowerCase().includes(q);
        const matchSr = String(doc.srNo).includes(q);
        if (!matchName && !matchSpec && !matchSr) return false;
      }

      // 3. Status filter check
      const hasDob = !!(doc.dob && doc.dob.trim().length >= 4);
      const hasDoa = !!(doc.doa && doc.doa.trim().length >= 4);

      if (statusFilter === 'MISSING_DOB' && hasDob) return false;
      if (statusFilter === 'MISSING_DOA' && hasDoa) return false;
      if (statusFilter === 'MISSING_BOTH' && (hasDob || hasDoa)) return false;
      if (statusFilter === 'FULLY_UPDATED' && (!hasDob || !hasDoa)) return false;

      if (statusFilter === 'UPCOMING_MONTH') {
        const bM = getMonthNumFromDateStr(doc.dob);
        const aM = getMonthNumFromDateStr(doc.doa);
        if (bM !== selectedMonth && aM !== selectedMonth) return false;
      }

      return true;
    });
  }, [mslDoctors, stationFilter, statusFilter, selectedMonth, search]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let missingDobCount = 0;
    let missingDoaCount = 0;
    let missingBothCount = 0;
    let fullyUpdatedCount = 0;
    let thisMonthCount = 0;

    const currMonth = new Date().getMonth() + 1;

    mslDoctors.forEach(d => {
      const hasDob = !!(d.dob && d.dob.trim().length >= 4);
      const hasDoa = !!(d.doa && d.doa.trim().length >= 4);

      if (!hasDob) missingDobCount++;
      if (!hasDoa) missingDoaCount++;
      if (!hasDob && !hasDoa) missingBothCount++;
      if (hasDob && hasDoa) fullyUpdatedCount++;

      const bM = getMonthNumFromDateStr(d.dob);
      const aM = getMonthNumFromDateStr(d.doa);
      if (bM === currMonth || aM === currMonth) thisMonthCount++;
    });

    return {
      total: mslDoctors.length,
      missingDobCount,
      missingDoaCount,
      missingBothCount,
      fullyUpdatedCount,
      thisMonthCount
    };
  }, [mslDoctors]);

  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push('SR NO,STATION,DOCTOR NAME,SPECIALITY,DOCTOR DOB,DOCTOR DOA,SON 1 DOB,SON 2 DOB,DAUGHTER 1 DOB,DAUGHTER 2 DOB,FATHER DOB,FATHER DOA,NOTES');

    filteredDoctors.forEach(doc => {
      const st = detectDoctorStation(doc);
      const fam = familyData[doc.srNo] || {};
      const q = (v: any) => `"${String(v || '').replace(/"/g, '""')}"`;

      lines.push([
        doc.srNo,
        q(st),
        q(doc.doctorName),
        q(doc.speciality || '-'),
        q(doc.dob || ''),
        q(doc.doa || ''),
        q(fam.son1_dob || ''),
        q(fam.son2_dob || ''),
        q(fam.daughter1_dob || ''),
        q(fam.daughter2_dob || ''),
        q(fam.father_dob || ''),
        q(fam.father_doa || ''),
        q(fam.notes || '')
      ].join(','));
    });

    const csvContent = lines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Doctor_Celebrations_Master_${stationFilter}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-7xl mx-auto space-y-5">
      
      {/* 1. TOP NAVBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft size={16} /> Back to Web Data
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[11px] bg-pink-950 text-pink-300 border border-pink-500/40 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-pink-950/50">
            <Sparkles size={13} className="text-pink-400 animate-pulse" /> TWO-WAY MSL SYNC ACTIVE &bull; {mslDoctors.length} DOCTORS
          </span>
        </div>
      </div>

      {/* 2. TITLE & HEADER CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-xl text-white shadow-lg shadow-pink-500/20">
              <Cake size={24} />
            </span>
            Doctor Birthday &amp; Anniversary Hub
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Doctor Celebrations &bull; Family Dates (Sons, Daughters, Father) &bull; Instant Two-Way MSL Schedule Sync
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      <CloudSyncBar
        storageKey="celebrations/doctor_family_v1"
        sheetTitle="Doctor Birthday & Anniversary Hub"
        getData={() => ({
          mslDoctors,
          familyData
        })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.mslDoctors && Array.isArray(cloudData.mslDoctors)) {
            setMslDoctors(cloudData.mslDoctors);
            memoryStore.mslData = cloudData.mslDoctors;
            try { localStorage.setItem(MSL_STORAGE_KEY, JSON.stringify(cloudData.mslDoctors)); } catch (e) {}
          }
          if (cloudData.familyData) {
            setFamilyData(cloudData.familyData);
            try { localStorage.setItem(CELEBRATIONS_FAMILY_STORAGE_KEY, JSON.stringify(cloudData.familyData)); } catch (e) {}
          }
        }}
        onSaveLocal={() => {
          persistMslAndFamily(mslDoctors, familyData);
        }}
      />

      {statusMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-2xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="p-1 hover:text-white">✕</button>
        </div>
      )}

      {/* 3. AUDIT SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total MSL Doctors</div>
          <div className="text-xl font-black text-white font-mono mt-1">{metrics.total} Doctors</div>
          <div className="text-[10px] text-slate-400 mt-0.5">5 HQ/Ex-HQ Stations</div>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-2xl border border-pink-500/30 shadow-md">
          <div className="text-[10px] text-pink-400 uppercase font-semibold">Missing DOB</div>
          <div className="text-xl font-black text-pink-300 font-mono mt-1">{metrics.missingDobCount} Doctors</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Birthdays to collect</div>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-2xl border border-purple-500/30 shadow-md">
          <div className="text-[10px] text-purple-400 uppercase font-semibold">Missing DOA</div>
          <div className="text-xl font-black text-purple-300 font-mono mt-1">{metrics.missingDoaCount} Doctors</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Anniversaries to collect</div>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-2xl border border-rose-500/30 shadow-md">
          <div className="text-[10px] text-rose-400 uppercase font-semibold">Missing Both (DOB+DOA)</div>
          <div className="text-xl font-black text-rose-300 font-mono mt-1">{metrics.missingBothCount} Doctors</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Urgent Audit Queue</div>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-2xl border border-emerald-500/40 shadow-md">
          <div className="text-[10px] text-emerald-400 uppercase font-semibold">Fully Updated (DOB+DOA)</div>
          <div className="text-xl font-black text-emerald-300 font-mono mt-1">{metrics.fullyUpdatedCount} Doctors</div>
          <div className="text-[10px] text-emerald-400 font-bold mt-0.5">100% Ready</div>
        </div>
      </div>

      {/* 4. STATION & AUDIT FILTER BAR */}
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
        {/* Station Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Building2 size={13} className="text-amber-400" /> Station:
          </span>
          {STATIONS.map(st => {
            const isSelected = stationFilter === st.id;
            const count = mslDoctors.filter(d => st.id === 'ALL' || detectDoctorStation(d) === st.id).length;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setStationFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{st.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Audit Status Filter & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
              <Filter size={12} className="text-pink-400" /> Filter:
            </span>

            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg border font-bold transition ${
                statusFilter === 'ALL' ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('MISSING_DOB')}
              className={`px-2.5 py-1 rounded-lg border font-bold transition ${
                statusFilter === 'MISSING_DOB' ? 'bg-pink-600 text-white border-pink-400' : 'bg-slate-950 text-pink-300 border-pink-900/60'
              }`}
            >
              🎂 Missing DOB
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('MISSING_DOA')}
              className={`px-2.5 py-1 rounded-lg border font-bold transition ${
                statusFilter === 'MISSING_DOA' ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-950 text-purple-300 border-purple-900/60'
              }`}
            >
              💍 Missing DOA
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('MISSING_BOTH')}
              className={`px-2.5 py-1 rounded-lg border font-bold transition ${
                statusFilter === 'MISSING_BOTH' ? 'bg-rose-600 text-white border-rose-400' : 'bg-slate-950 text-rose-300 border-rose-900/60'
              }`}
            >
              ⚠️ Missing Both
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('FULLY_UPDATED')}
              className={`px-2.5 py-1 rounded-lg border font-bold transition ${
                statusFilter === 'FULLY_UPDATED' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-950 text-emerald-300 border-emerald-900/60'
              }`}
            >
              ✅ Fully Updated
            </button>

            <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400">📅 Month:</span>
              <select
                value={selectedMonth}
                onChange={e => {
                  setSelectedMonth(parseInt(e.target.value, 10));
                  setStatusFilter('UPCOMING_MONTH');
                }}
                className="bg-transparent text-pink-300 font-bold focus:outline-none cursor-pointer text-xs"
              >
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].map((mName, idx) => (
                  <option key={idx + 1} value={idx + 1} className="bg-slate-900 text-white">
                    {mName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search doctor or speciality..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-8 pr-3 py-1.5 text-xs focus:border-pink-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 5. MAIN DOCTORS & FAMILY CELEBRATIONS TABLE */}
      <div className="overflow-x-auto max-h-[560px] border border-slate-800 rounded-2xl shadow-2xl bg-slate-950 relative">
        <table className="w-full text-left text-xs border-separate border-spacing-0">
          <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-30">
            <tr>
              <th style={{ width: '44px', minWidth: '44px', left: 0 }} className="p-2.5 text-center bg-slate-950 border-b border-r border-slate-800 sticky z-40 text-slate-400">
                #
              </th>
              <th style={{ width: '200px', minWidth: '200px', left: '44px' }} className="p-2.5 bg-slate-950 border-b border-r-2 border-pink-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky z-40 text-white">
                Doctor Name
              </th>
              <th className="p-2.5 text-center w-28 text-amber-400 border-b border-r border-slate-800">Station</th>
              <th className="p-2.5 min-w-[130px] border-b border-r border-slate-800">Speciality</th>
              <th className="p-2.5 text-center min-w-[130px] text-pink-300 border-b border-r border-slate-800">
                🎂 Doctor DOB (MSL)
              </th>
              <th className="p-2.5 text-center min-w-[130px] text-purple-300 border-b border-r border-slate-800">
                💍 Doctor DOA (MSL)
              </th>
              <th className="p-2.5 min-w-[200px] border-b border-r border-slate-800 text-cyan-300">
                👨‍👩‍👧‍👦 Family Celebrations (Sons / Daughters / Father)
              </th>
              <th className="p-2.5 text-center w-20 border-b border-slate-800">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
            {filteredDoctors.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                  No doctors matched the selected filter query.
                </td>
              </tr>
            ) : (
              filteredDoctors.map((doc, idx) => {
                const st = detectDoctorStation(doc);
                const fam = familyData[doc.srNo] || {};

                const hasDob = !!(doc.dob && doc.dob.trim().length >= 4);
                const hasDoa = !!(doc.doa && doc.doa.trim().length >= 4);

                // Build family chips summary
                const familyChips: string[] = [];
                if (fam.son1_dob) familyChips.push(`👦 Son 1: ${fam.son1_dob}`);
                if (fam.son2_dob) familyChips.push(`👦 Son 2: ${fam.son2_dob}`);
                if (fam.daughter1_dob) familyChips.push(`👧 Daughter 1: ${fam.daughter1_dob}`);
                if (fam.daughter2_dob) familyChips.push(`👧 Daughter 2: ${fam.daughter2_dob}`);
                if (fam.father_dob) familyChips.push(`👴 Father DOB: ${fam.father_dob}`);
                if (fam.father_doa) familyChips.push(`💍 Parents DOA: ${fam.father_doa}`);

                return (
                  <tr key={doc.srNo} className="hover:bg-slate-800/60 transition group">
                    <td style={{ width: '44px', minWidth: '44px', left: 0 }} className="p-2.5 text-center text-slate-500 border-b border-r border-slate-800/80 sticky z-20 bg-slate-900 group-hover:bg-slate-800">
                      {doc.srNo}
                    </td>

                    <td style={{ width: '200px', minWidth: '200px', left: '44px' }} className="p-2.5 font-sans font-bold text-white border-b border-r-2 border-pink-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky z-20 bg-slate-900 group-hover:bg-slate-800 truncate">
                      Dr. {doc.doctorName}
                    </td>

                    <td className="p-2 text-center border-b border-r border-slate-800/80">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                        st === 'UDAIPUR' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {st}
                      </span>
                    </td>

                    <td className="p-2.5 font-sans text-slate-400 border-b border-r border-slate-800/80">
                      {doc.speciality || '-'}
                    </td>

                    {/* TWO-WAY LIVE EDITABLE DOB */}
                    <td className="p-1.5 text-center border-b border-r border-slate-800/80">
                      <input
                        type="text"
                        value={doc.dob || ''}
                        onChange={e => handleInlineDoctorDateChange(doc.srNo, 'dob', e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className={`w-full py-1 px-1.5 rounded-lg text-center font-mono font-bold text-xs border focus:outline-none ${
                          hasDob ? 'bg-slate-950 text-pink-300 border-slate-800 focus:border-pink-500' : 'bg-rose-950/40 text-rose-300 border-rose-500/50'
                        }`}
                        title="Live edits sync directly to Sheet 14 (MSL Schedule)"
                      />
                    </td>

                    {/* TWO-WAY LIVE EDITABLE DOA */}
                    <td className="p-1.5 text-center border-b border-r border-slate-800/80">
                      <input
                        type="text"
                        value={doc.doa || ''}
                        onChange={e => handleInlineDoctorDateChange(doc.srNo, 'doa', e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className={`w-full py-1 px-1.5 rounded-lg text-center font-mono font-bold text-xs border focus:outline-none ${
                          hasDoa ? 'bg-slate-950 text-purple-300 border-slate-800 focus:border-purple-500' : 'bg-rose-950/40 text-rose-300 border-rose-500/50'
                        }`}
                        title="Live edits sync directly to Sheet 14 (MSL Schedule)"
                      />
                    </td>

                    {/* FAMILY CELEBRATIONS PREVIEW */}
                    <td className="p-2 font-sans border-b border-r border-slate-800/80">
                      {familyChips.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {familyChips.map((chip, cIdx) => (
                            <span key={cIdx} className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-lg font-mono">
                              {chip}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[11px] italic">No family dates added yet</span>
                      )}
                    </td>

                    <td className="p-2 text-center border-b border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(doc)}
                        className="px-2.5 py-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 text-white font-bold rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1 mx-auto shadow-sm"
                        title="Edit Doctor & Family Celebrations"
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 6. MODAL: DOCTOR & FAMILY CELEBRATIONS EDITOR */}
      {editingDoc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-5">
          <div className="bg-slate-900 border-2 border-pink-500/60 rounded-3xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-pink-500/20 text-pink-400 rounded-2xl border border-pink-500/30">
                  <Cake size={22} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Dr. {editingDoc.doctorName} &bull; #{editingDoc.srNo}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Station: <b className="text-amber-400">{detectDoctorStation(editingDoc)}</b> &bull; Speciality: {editingDoc.speciality || '-'}
                  </p>
                </div>
              </div>
              <button onClick={() => setEditingDoc(null)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1">
              
              {/* SECTION 1: DOCTOR'S OWN DATES (TWO-WAY MSL SYNC) */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-pink-500/40 space-y-2.5">
                <div className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center justify-between">
                  <span>1. Doctor Celebrations (Syncs to Sheet 14 MSL):</span>
                  <span className="text-[10px] text-emerald-400 font-mono">MSL Live Protected</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1 flex items-center gap-1">
                      <Cake size={13} className="text-pink-400" /> Doctor DOB:
                    </label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.dob}
                      onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-pink-300 font-mono font-bold rounded-xl px-3 py-1.5 text-xs focus:border-pink-400 focus:outline-none text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1 flex items-center gap-1">
                      <Heart size={13} className="text-purple-400" /> Doctor DOA (Anniversary):
                    </label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.doa}
                      onChange={e => setEditForm({ ...editForm, doa: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-purple-300 font-mono font-bold rounded-xl px-3 py-1.5 text-xs focus:border-purple-400 focus:outline-none text-center"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: CHILDREN CELEBRATIONS */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-cyan-500/40 space-y-2.5">
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Baby size={15} className="text-cyan-400" />
                  <span>2. Children's Birthdays:</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">👦 Son 1 Birthday:</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.son1_dob}
                      onChange={e => setEditForm({ ...editForm, son1_dob: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-mono rounded-xl px-3 py-1.5 text-xs focus:border-cyan-400 focus:outline-none text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">👦 Son 2 Birthday:</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.son2_dob}
                      onChange={e => setEditForm({ ...editForm, son2_dob: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-mono rounded-xl px-3 py-1.5 text-xs focus:border-cyan-400 focus:outline-none text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">👧 Daughter 1 Birthday:</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.daughter1_dob}
                      onChange={e => setEditForm({ ...editForm, daughter1_dob: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-mono rounded-xl px-3 py-1.5 text-xs focus:border-cyan-400 focus:outline-none text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">👧 Daughter 2 Birthday:</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.daughter2_dob}
                      onChange={e => setEditForm({ ...editForm, daughter2_dob: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-mono rounded-xl px-3 py-1.5 text-xs focus:border-cyan-400 focus:outline-none text-center"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PARENTS / FATHER CELEBRATIONS */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-amber-500/40 space-y-2.5">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={15} className="text-amber-400" />
                  <span>3. Parents / Father Celebrations:</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">👴 Father DOB:</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.father_dob}
                      onChange={e => setEditForm({ ...editForm, father_dob: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-mono rounded-xl px-3 py-1.5 text-xs focus:border-amber-400 focus:outline-none text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">💍 Parents / Father DOA:</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.father_doa}
                      onChange={e => setEditForm({ ...editForm, father_doa: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-mono rounded-xl px-3 py-1.5 text-xs focus:border-amber-400 focus:outline-none text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">🎁 Notes &amp; Gift Preferences:</label>
                  <input
                    type="text"
                    placeholder="e.g. Bouquet preference, chocolate cake, clinic celebration note..."
                    value={editForm.notes}
                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Saving will update MSL Schedule in Sheet 14 automatically.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="px-5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} /> Save &amp; Sync MSL
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
