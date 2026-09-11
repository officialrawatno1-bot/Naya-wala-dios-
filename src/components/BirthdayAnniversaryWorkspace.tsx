import React, { useState, useMemo } from 'react';
import { 
  Cake, Heart, Calendar, Search, Download, Filter, 
  Check, X, Sparkles, Building2, UserCheck, AlertTriangle, 
  Baby, Users, ArrowLeft, RefreshCw, Edit3, ChevronRight,
  ShieldCheck, Eye, EyeOff, Plus, Trash2, Zap, Gift
} from 'lucide-react';
import { CBO_MASTER_130_DOCTORS, CboDoctorMaster } from '../data/cboMasterDoctors';
import { memoryStore } from '../data/memoryStore';
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
  lastUpdatedSource?: 'BIRTHDAY_HUB' | 'MSL';
  updatedTimestamp?: string;
}

const CELEBRATIONS_FAMILY_STORAGE_KEY = 'dios_doctor_family_celebrations_v2';
const MSL_STORAGE_KEY = 'dios_msl_schedule_permanent_v5';

const STATIONS = [
  { id: 'ALL', label: 'All Stations' },
  { id: 'UDAIPUR', label: 'Udaipur (HQ)' },
  { id: 'BANSWARA', label: 'Banswara (Ex-HQ)' },
  { id: 'DUNGARPUR', label: 'Dungarpur (Ex-HQ)' },
  { id: 'CHITTORGARH', label: 'Chittorgarh (Ex-HQ)' },
  { id: 'RAJASMAND', label: 'Rajsamand (Ex-HQ)' }
];

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
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [search, setSearch] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [doctorsList, setDoctorsList] = useState<Array<CboDoctorMaster & { lastUpdatedSource?: string; updatedTimestamp?: string }>>(() => {
    let baseList: any[] = [...CBO_MASTER_130_DOCTORS];

    try {
      if (typeof window !== 'undefined') {
        const savedMsl = localStorage.getItem(MSL_STORAGE_KEY);
        if (savedMsl) {
          const parsed = JSON.parse(savedMsl);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const mslMap = new Map(parsed.map((d: any) => [d.srNo, d]));
            baseList = baseList.map(doc => {
              const m = mslMap.get(doc.srNo);
              return {
                ...doc,
                dob: (m && m.dob) ? m.dob : doc.dob,
                doa: (m && m.doa) ? m.doa : doc.doa,
                activityType: (m && m.activityType) ? m.activityType : doc.activityType,
                lastUpdatedSource: m?.lastUpdatedSource,
                updatedTimestamp: m?.updatedTimestamp
              };
            });
          }
        }
      }
    } catch (e) {}

    return baseList;
  });

  const [familyData, setFamilyData] = useState<Record<number, DoctorFamilyRecord>>(() => {
    try {
      const saved = localStorage.getItem(CELEBRATIONS_FAMILY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [editingDoc, setEditingDoc] = useState<any | null>(null);
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

  const syncToMslLocalStorage = (updatedDocList: any[], updatedDocSrNo?: number) => {
    try {
      if (typeof window !== 'undefined') {
        let currentMsl: any[] = [];
        const raw = localStorage.getItem(MSL_STORAGE_KEY);
        if (raw) currentMsl = JSON.parse(raw);

        const docMap = new Map(updatedDocList.map(d => [d.srNo, d]));

        const syncedMsl = currentMsl.map(m => {
          const u = docMap.get(m.srNo);
          if (u) {
            const isTarget = updatedDocSrNo === undefined || m.srNo === updatedDocSrNo;
            return {
              ...m,
              doctorName: u.doctorName,
              dob: u.dob || '',
              doa: u.doa || '',
              speciality: u.speciality || m.speciality,
              ...(isTarget ? { lastUpdatedSource: 'BIRTHDAY_HUB', updatedTimestamp: new Date().toISOString() } : {})
            };
          }
          return m;
        });

        updatedDocList.forEach(u => {
          if (!syncedMsl.some(m => m.srNo === u.srNo)) {
            syncedMsl.push({
              srNo: u.srNo,
              doctorName: u.doctorName,
              speciality: u.speciality,
              activityType: u.activityType || '',
              dob: u.dob || '',
              doa: u.doa || '',
              apr: '', may: '', jun: '', jul: '', aug: '', sept: '',
              oct: '', nov: '', dec: '', jan: '', feb: '', mar: '',
              isNewDoctor: true,
              lastUpdatedSource: 'BIRTHDAY_HUB',
              updatedTimestamp: new Date().toISOString()
            });
          }
        });

        localStorage.setItem(MSL_STORAGE_KEY, JSON.stringify(syncedMsl));
        memoryStore.mslData = syncedMsl;
      }
    } catch (e) {}
  };

  const persistAll = (newDocs: any[], newFam = familyData, updatedSrNo?: number) => {
    setDoctorsList(newDocs);
    setFamilyData(newFam);
    syncToMslLocalStorage(newDocs, updatedSrNo);

    try {
      localStorage.setItem(CELEBRATIONS_FAMILY_STORAGE_KEY, JSON.stringify(newFam));
    } catch (e) {}
  };

  const handleInlineDateChange = (srNo: number, field: 'dob' | 'doa', val: string) => {
    const updated = doctorsList.map(d => d.srNo === srNo ? { 
      ...d, 
      [field]: val.trim(),
      lastUpdatedSource: 'BIRTHDAY_HUB',
      updatedTimestamp: new Date().toISOString()
    } : d);
    persistAll(updated, familyData, srNo);
  };

  const handleOpenEditModal = (doc: any) => {
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

    const updatedDocs = doctorsList.map(d => {
      if (d.srNo === editingDoc.srNo) {
        return {
          ...d,
          dob: editForm.dob.trim(),
          doa: editForm.doa.trim(),
          lastUpdatedSource: 'BIRTHDAY_HUB',
          updatedTimestamp: new Date().toISOString()
        };
      }
      return d;
    });

    const updatedFam = {
      ...familyData,
      [editingDoc.srNo]: {
        son1_dob: editForm.son1_dob.trim(),
        son2_dob: editForm.son2_dob.trim(),
        daughter1_dob: editForm.daughter1_dob.trim(),
        daughter2_dob: editForm.daughter2_dob.trim(),
        father_dob: editForm.father_dob.trim(),
        father_doa: editForm.father_doa.trim(),
        notes: editForm.notes.trim(),
        lastUpdatedSource: 'BIRTHDAY_HUB' as const,
        updatedTimestamp: new Date().toISOString()
      }
    };

    persistAll(updatedDocs, updatedFam, editingDoc.srNo);
    setEditingDoc(null);
    setStatusMsg(`🎉 Dr. ${editingDoc.doctorName} Celebrations & Family Schedule saved!`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const filteredDoctors = useMemo(() => {
    return doctorsList.filter(doc => {
      if (stationFilter !== 'ALL' && doc.station !== stationFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = doc.doctorName.toLowerCase().includes(q);
        const matchCode = doc.drCode.toLowerCase().includes(q);
        const matchSpec = doc.speciality.toLowerCase().includes(q);
        const matchClinic = (doc.clinicAddress || '').toLowerCase().includes(q);
        const matchSr = String(doc.srNo).includes(q);
        if (!matchName && !matchCode && !matchSpec && !matchClinic && !matchSr) return false;
      }

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
  }, [doctorsList, stationFilter, statusFilter, selectedMonth, search]);

  const metrics = useMemo(() => {
    let missingDobCount = 0;
    let missingDoaCount = 0;
    let missingBothCount = 0;
    let fullyUpdatedCount = 0;

    doctorsList.forEach(d => {
      const hasDob = !!(d.dob && d.dob.trim().length >= 4);
      const hasDoa = !!(d.doa && d.doa.trim().length >= 4);

      if (!hasDob) missingDobCount++;
      if (!hasDoa) missingDoaCount++;
      if (!hasDob && !hasDoa) missingBothCount++;
      if (hasDob && hasDoa) fullyUpdatedCount++;
    });

    return {
      total: doctorsList.length,
      missingDobCount,
      missingDoaCount,
      missingBothCount,
      fullyUpdatedCount
    };
  }, [doctorsList]);

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
            <Sparkles size={13} className="text-pink-400 animate-pulse" /> COLOR-CODED CELEBRATIONS ACTIVE
          </span>
        </div>
      </div>

      {/* 2. TITLE & COLOR PALETTE LEGEND */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-xl text-white shadow-lg shadow-pink-500/20">
              <Cake size={24} />
            </span>
            Doctor Birthday &amp; Anniversary Hub
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Distinct Color Scheme for Doctor DOB, DOA, Sons, Daughters, Father DOB &amp; Parents Anniversary
          </p>
        </div>

        {/* 🌟 VIBRANT COLOR PALETTE LEGEND */}
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-900/90 rounded-2xl border border-slate-800 text-[10px] font-bold font-mono">
          <span className="px-2 py-0.5 rounded-lg bg-pink-950 text-pink-300 border border-pink-500/40">🎂 Dr DOB</span>
          <span className="px-2 py-0.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-500/40">💍 Dr DOA</span>
          <span className="px-2 py-0.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40">👦 Sons</span>
          <span className="px-2 py-0.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-500/40">👧 Daughters</span>
          <span className="px-2 py-0.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-500/40">👴 Father</span>
          <span className="px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/40">💐 Parents DOA</span>
        </div>
      </div>

      <CloudSyncBar
        storageKey="celebrations/cbo_130_doctors_v2"
        sheetTitle="130 Doctors Birthday & Anniversary Hub"
        getData={() => ({ doctorsList, familyData })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.doctorsList && Array.isArray(cloudData.doctorsList)) {
            setDoctorsList(cloudData.doctorsList);
            syncToMslLocalStorage(cloudData.doctorsList);
          }
          if (cloudData.familyData) {
            setFamilyData(cloudData.familyData);
            try { localStorage.setItem(CELEBRATIONS_FAMILY_STORAGE_KEY, JSON.stringify(cloudData.familyData)); } catch (e) {}
          }
        }}
        onSaveLocal={() => {
          persistAll(doctorsList, familyData);
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

      {/* 3. METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Doctors</div>
          <div className="text-xl font-black text-white font-mono mt-1">{metrics.total}</div>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-2xl border border-pink-500/40 shadow-md">
          <div className="text-[10px] text-pink-400 uppercase font-semibold">Missing DOB</div>
          <div className="text-xl font-black text-pink-300 font-mono mt-1">{metrics.missingDobCount}</div>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-2xl border border-purple-500/40 shadow-md">
          <div className="text-[10px] text-purple-400 uppercase font-semibold">Missing DOA</div>
          <div className="text-xl font-black text-purple-300 font-mono mt-1">{metrics.missingDoaCount}</div>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-2xl border border-rose-500/40 shadow-md">
          <div className="text-[10px] text-rose-400 uppercase font-semibold">Missing Both</div>
          <div className="text-xl font-black text-rose-300 font-mono mt-1">{metrics.missingBothCount}</div>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-2xl border border-emerald-500/40 shadow-md">
          <div className="text-[10px] text-emerald-400 uppercase font-semibold">Fully Updated</div>
          <div className="text-xl font-black text-emerald-300 font-mono mt-1">{metrics.fullyUpdatedCount}</div>
        </div>
      </div>

      {/* 4. STATION TABS & FILTERS */}
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Building2 size={13} className="text-amber-400" /> Station:
          </span>
          {STATIONS.map(st => {
            const isSelected = stationFilter === st.id;
            const count = doctorsList.filter(d => st.id === 'ALL' || d.station === st.id).length;

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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
              <Filter size={12} className="text-pink-400" /> Status:
            </span>

            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg border font-bold transition ${
                statusFilter === 'ALL' ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              All ({filteredDoctors.length})
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
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search doctor, code, clinic..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-8 pr-3 py-1.5 text-xs focus:border-pink-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 5. TABLE WITH COLOR-CODED HEADERS, INPUTS & CHIPS */}
      <div className="overflow-x-auto max-h-[560px] border border-slate-800 rounded-2xl shadow-2xl bg-slate-950 relative">
        <table className="w-full text-left text-xs border-separate border-spacing-0">
          <thead className="sticky top-0 bg-slate-950 font-bold uppercase border-b border-slate-800 z-30">
            <tr>
              <th style={{ width: '44px', minWidth: '44px', left: 0 }} className="p-2.5 text-center bg-slate-950 border-b border-r border-slate-800 sticky z-40 text-slate-400">#</th>
              <th style={{ width: '210px', minWidth: '210px', left: '44px' }} className="p-2.5 bg-slate-950 border-b border-r-2 border-pink-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky z-40 text-white">Doctor Name</th>
              <th className="p-2.5 text-center w-28 text-amber-400 border-b border-r border-slate-800">Station</th>
              <th className="p-2.5 min-w-[120px] text-slate-300 border-b border-r border-slate-800">Speciality</th>
              
              {/* 🎂 DOCTOR DOB (PINK) */}
              <th className="p-2.5 text-center min-w-[130px] bg-pink-950/30 text-pink-300 border-b border-r border-slate-800">
                🎂 Doctor DOB
              </th>

              {/* 💍 DOCTOR DOA (PURPLE) */}
              <th className="p-2.5 text-center min-w-[130px] bg-purple-950/30 text-purple-300 border-b border-r border-slate-800">
                💍 Doctor DOA
              </th>

              {/* 👨‍👩‍👧‍👦 FAMILY CELEBRATIONS */}
              <th className="p-2.5 min-w-[260px] border-b border-r border-slate-800 text-cyan-300">
                👨‍👩‍👧‍👦 Family Celebrations (Color-Coded)
              </th>
              
              <th className="p-2.5 text-center w-20 border-b border-slate-800 text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
            {filteredDoctors.map(doc => {
              const fam = familyData[doc.srNo] || {};
              const hasDob = !!(doc.dob && doc.dob.trim().length >= 4);
              const hasDoa = !!(doc.doa && doc.doa.trim().length >= 4);
              const source = doc.lastUpdatedSource;

              return (
                <tr key={doc.srNo} className="hover:bg-slate-800/60 transition group">
                  <td style={{ width: '44px', minWidth: '44px', left: 0 }} className="p-2.5 text-center text-slate-500 border-b border-r border-slate-800/80 sticky z-20 bg-slate-900 group-hover:bg-slate-800">
                    {doc.srNo}
                  </td>
                  <td style={{ width: '210px', minWidth: '210px', left: '44px' }} className="p-2.5 font-sans font-bold text-white border-b border-r-2 border-pink-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky z-20 bg-slate-900 group-hover:bg-slate-800 truncate">
                    Dr. {doc.doctorName}
                    {doc.drCode && <span className="text-[10px] text-slate-400 font-mono block">({doc.drCode})</span>}
                  </td>
                  <td className="p-2 text-center border-b border-r border-slate-800/80">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                      doc.station === 'UDAIPUR' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {doc.station}
                    </span>
                  </td>
                  <td className="p-2.5 font-sans text-slate-300 border-b border-r border-slate-800/80">
                    {doc.speciality}
                  </td>

                  {/* 🎂 DOCTOR DOB INPUT (VIBRANT PINK) */}
                  <td className="p-1.5 text-center border-b border-r border-slate-800/80 bg-pink-950/10">
                    <input
                      type="text"
                      value={doc.dob || ''}
                      onChange={e => handleInlineDateChange(doc.srNo, 'dob', e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className={`w-full py-1 px-1.5 rounded-lg text-center font-mono font-bold text-xs border focus:outline-none ${
                        hasDob ? 'bg-slate-950 text-pink-300 border-pink-500/40 focus:border-pink-400' : 'bg-rose-950/40 text-rose-300 border-rose-500/50'
                      }`}
                    />
                    {source === 'BIRTHDAY_HUB' && (
                      <span className="block text-[7.5px] text-pink-400 font-sans tracking-tight text-center font-bold truncate mt-0.5">
                        🎂 From Birthday Hub
                      </span>
                    )}
                  </td>

                  {/* 💍 DOCTOR DOA INPUT (ROYAL PURPLE) */}
                  <td className="p-1.5 text-center border-b border-r border-slate-800/80 bg-purple-950/10">
                    <input
                      type="text"
                      value={doc.doa || ''}
                      onChange={e => handleInlineDateChange(doc.srNo, 'doa', e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className={`w-full py-1 px-1.5 rounded-lg text-center font-mono font-bold text-xs border focus:outline-none ${
                        hasDoa ? 'bg-slate-950 text-purple-300 border-purple-500/40 focus:border-purple-400' : 'bg-rose-950/40 text-rose-300 border-rose-500/50'
                      }`}
                    />
                    {source === 'BIRTHDAY_HUB' && (
                      <span className="block text-[7.5px] text-purple-400 font-sans tracking-tight text-center font-bold truncate mt-0.5">
                        💍 From Birthday Hub
                      </span>
                    )}
                  </td>

                  {/* 🌟 DISTINCT COLOR-CODED FAMILY CHIPS */}
                  <td className="p-2 font-sans border-b border-r border-slate-800/80">
                    <div className="flex flex-wrap gap-1">
                      {/* 👦 Sons (Ocean Cyan) */}
                      {fam.son1_dob && (
                        <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold">
                          👦 Son 1: {fam.son1_dob}
                        </span>
                      )}
                      {fam.son2_dob && (
                        <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold">
                          👦 Son 2: {fam.son2_dob}
                        </span>
                      )}

                      {/* 👧 Daughters (Bright Coral Rose) */}
                      {fam.daughter1_dob && (
                        <span className="bg-rose-950/80 text-rose-300 border border-rose-500/40 text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold">
                          👧 Daughter 1: {fam.daughter1_dob}
                        </span>
                      )}
                      {fam.daughter2_dob && (
                        <span className="bg-rose-950/80 text-rose-300 border border-rose-500/40 text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold">
                          👧 Daughter 2: {fam.daughter2_dob}
                        </span>
                      )}

                      {/* 👴 Father DOB (Warm Amber) */}
                      {fam.father_dob && (
                        <span className="bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold">
                          👴 Father: {fam.father_dob}
                        </span>
                      )}

                      {/* 💐 Parents / Father DOA (Radiant Emerald Green) */}
                      {fam.father_doa && (
                        <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold">
                          💐 Parents DOA: {fam.father_doa}
                        </span>
                      )}

                      {!fam.son1_dob && !fam.son2_dob && !fam.daughter1_dob && !fam.daughter2_dob && !fam.father_dob && !fam.father_doa && (
                        <span className="text-slate-600 text-[11px] italic">No family dates added</span>
                      )}
                    </div>
                  </td>

                  <td className="p-2 text-center border-b border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(doc)}
                      className="px-2.5 py-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 text-white font-bold rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1 mx-auto shadow-sm"
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 6. MODAL: DEDICATED COLOR SECTIONS FOR DOCTOR, SONS, DAUGHTERS, PARENTS */}
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
                    Dr. {editingDoc.doctorName} &bull; #{editingDoc.srNo} ({editingDoc.drCode})
                  </h3>
                  <p className="text-xs text-slate-400">Station: <b className="text-amber-400">{editingDoc.station}</b> &bull; Speciality: {editingDoc.speciality}</p>
                </div>
              </div>
              <button onClick={() => setEditingDoc(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer"><X size={18} /></button>
            </div>

            <div className="overflow-y-auto space-y-3.5 pr-1">
              
              {/* SECTION 1: DOCTOR DATES (PINK & PURPLE) */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-pink-500/40 space-y-2.5">
                <div className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center justify-between">
                  <span>1. Doctor Celebrations (Syncs Live to Sheet 14 MSL):</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Two-Way Synced</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-pink-950/20 border border-pink-500/40 rounded-xl">
                    <label className="block text-[11px] text-pink-300 font-bold mb-1 flex items-center gap-1">
                      <Cake size={13} className="text-pink-400" /> 🎂 Doctor Birthday (DOB):
                    </label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.dob}
                      onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                      className="w-full bg-slate-900 border border-pink-500/40 text-pink-300 font-mono font-bold rounded-lg px-3 py-1.5 text-xs text-center focus:border-pink-400 focus:outline-none"
                    />
                  </div>

                  <div className="p-2 bg-purple-950/20 border border-purple-500/40 rounded-xl">
                    <label className="block text-[11px] text-purple-300 font-bold mb-1 flex items-center gap-1">
                      <Heart size={13} className="text-purple-400" /> 💍 Doctor Anniversary (DOA):
                    </label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.doa}
                      onChange={e => setEditForm({ ...editForm, doa: e.target.value })}
                      className="w-full bg-slate-900 border border-purple-500/40 text-purple-300 font-mono font-bold rounded-lg px-3 py-1.5 text-xs text-center focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: 👦 SONS' BIRTHDAYS (OCEAN CYAN) */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-cyan-500/40 space-y-2.5">
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Baby size={15} className="text-cyan-400" />
                  <span>2. Sons' Birthdays (Ocean Cyan):</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-cyan-950/20 border border-cyan-500/30 rounded-xl">
                    <label className="block text-[11px] text-cyan-300 font-bold mb-1">👦 Son 1 Birthday (DOB):</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.son1_dob}
                      onChange={e => setEditForm({ ...editForm, son1_dob: e.target.value })}
                      className="w-full bg-slate-900 border border-cyan-500/40 text-cyan-300 font-mono font-bold rounded-lg px-3 py-1.5 text-xs text-center focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="p-2 bg-cyan-950/20 border border-cyan-500/30 rounded-xl">
                    <label className="block text-[11px] text-cyan-300 font-bold mb-1">👦 Son 2 Birthday (DOB):</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.son2_dob}
                      onChange={e => setEditForm({ ...editForm, son2_dob: e.target.value })}
                      className="w-full bg-slate-900 border border-cyan-500/40 text-cyan-300 font-mono font-bold rounded-lg px-3 py-1.5 text-xs text-center focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: 👧 DAUGHTERS' BIRTHDAYS (CORAL ROSE) */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-rose-500/40 space-y-2.5">
                <div className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Baby size={15} className="text-rose-400" />
                  <span>3. Daughters' Birthdays (Coral Rose):</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-rose-950/20 border border-rose-500/30 rounded-xl">
                    <label className="block text-[11px] text-rose-300 font-bold mb-1">👧 Daughter 1 Birthday (DOB):</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.daughter1_dob}
                      onChange={e => setEditForm({ ...editForm, daughter1_dob: e.target.value })}
                      className="w-full bg-slate-900 border border-rose-500/40 text-rose-300 font-mono font-bold rounded-lg px-3 py-1.5 text-xs text-center focus:border-rose-400 focus:outline-none"
                    />
                  </div>

                  <div className="p-2 bg-rose-950/20 border border-rose-500/30 rounded-xl">
                    <label className="block text-[11px] text-rose-300 font-bold mb-1">👧 Daughter 2 Birthday (DOB):</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.daughter2_dob}
                      onChange={e => setEditForm({ ...editForm, daughter2_dob: e.target.value })}
                      className="w-full bg-slate-900 border border-rose-500/40 text-rose-300 font-mono font-bold rounded-lg px-3 py-1.5 text-xs text-center focus:border-rose-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: 👴 FATHER (AMBER) & 💐 PARENTS DOA (EMERALD) */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-amber-500/40 space-y-2.5">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={15} className="text-amber-400" />
                  <span>4. Father &amp; Parents Celebrations:</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-amber-950/20 border border-amber-500/30 rounded-xl">
                    <label className="block text-[11px] text-amber-300 font-bold mb-1">👴 Father Birthday (DOB):</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.father_dob}
                      onChange={e => setEditForm({ ...editForm, father_dob: e.target.value })}
                      className="w-full bg-slate-900 border border-amber-500/40 text-amber-300 font-mono font-bold rounded-lg px-3 py-1.5 text-xs text-center focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="p-2 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
                    <label className="block text-[11px] text-emerald-300 font-bold mb-1">💐 Parents Anniversary (DOA):</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={editForm.father_doa}
                      onChange={e => setEditForm({ ...editForm, father_doa: e.target.value })}
                      className="w-full bg-slate-900 border border-emerald-500/40 text-emerald-300 font-mono font-bold rounded-lg px-3 py-1.5 text-xs text-center focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <Gift size={12} className="text-amber-400" /> 🎁 Gift Preferences &amp; Celebration Notes:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bouquet preference, chocolate cake, clinic timing..."
                    value={editForm.notes}
                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Will mark "From Birthday Hub" in MSL</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setEditingDoc(null)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer">Cancel</button>
                <button type="button" onClick={handleSaveModal} className="px-5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5">
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
