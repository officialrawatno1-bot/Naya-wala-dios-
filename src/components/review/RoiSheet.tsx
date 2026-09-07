import React, { useState, useMemo } from 'react';
import { 
  DollarSign, Search, Save, Download, Check, Plus, Trash2, 
  RefreshCw, X, Calendar, UserCheck, Stethoscope, Link2, 
  CheckCircle2, Filter, AlertTriangle, ArrowRight, ShieldAlert 
} from 'lucide-react';
import { memoryStore, MslDoctor } from '../../data/memoryStore';
import { MASTER_123_MSL_DOCTORS } from './MslSheet';
import { INITIAL_ROI_SEED, RoiDoctorItem as BaseRoiItem } from '../../data/seedRoi';

const ROI_STORAGE_KEY = 'dios_roi_analysis_permanent_v2';

export interface RoiDoctorItem extends BaseRoiItem {
  apr_date?: string; may_date?: string; jun_date?: string;
  jul_date?: string; aug_date?: string; sept_date?: string;
  oct_date?: string; nov_date?: string; dec_date?: string;
  jan_date?: string; feb_date?: string; mar_date?: string;
}

const MONTH_KEYS = [
  { key: 'apr', dateKey: 'apr_date', roiKey: 'apr_roi', label: 'Apr-26' },
  { key: 'may', dateKey: 'may_date', roiKey: 'may_roi', label: 'May-26' },
  { key: 'jun', dateKey: 'jun_date', roiKey: 'jun_roi', label: 'Jun-26' },
  { key: 'jul', dateKey: 'jul_date', roiKey: 'jul_roi', label: 'Jul-26' },
  { key: 'aug', dateKey: 'aug_date', roiKey: 'aug_roi', label: 'Aug-26' },
  { key: 'sept', dateKey: 'sept_date', roiKey: 'sept_roi', label: 'Sep-26' },
  { key: 'oct', dateKey: 'oct_date', roiKey: 'oct_roi', label: 'Oct-26' },
  { key: 'nov', dateKey: 'nov_date', roiKey: 'nov_roi', label: 'Nov-26' },
  { key: 'dec', dateKey: 'dec_date', roiKey: 'dec_roi', label: 'Dec-26' },
  { key: 'jan', dateKey: 'jan_date', roiKey: 'jan_roi', label: 'Jan-27' },
  { key: 'feb', dateKey: 'feb_date', roiKey: 'feb_roi', label: 'Feb-27' },
  { key: 'mar', dateKey: 'mar_date', roiKey: 'mar_roi', label: 'Mar-27' },
];

const SYNC_MONTH_OPTIONS = [
  { label: 'All 12 Months', key: 'ALL' },
  { label: 'Apr-2026', key: 'apr' },
  { label: 'May-2026', key: 'may' },
  { label: 'Jun-2026', key: 'jun' },
  { label: 'Jul-2026', key: 'jul' },
  { label: 'Aug-2026', key: 'aug' },
  { label: 'Sep-2026', key: 'sept' },
  { label: 'Oct-2026', key: 'oct' },
  { label: 'Nov-2026', key: 'nov' },
  { label: 'Dec-2026', key: 'dec' },
  { label: 'Jan-2027', key: 'jan' },
  { label: 'Feb-2027', key: 'feb' },
  { label: 'Mar-2027', key: 'mar' },
];

const cleanStr = (s: string) => (s || '').toLowerCase().replace(/^(dr\\.?|dr\\s+)/i, '').replace(/[^a-z0-9]/g, '').trim();

export const RoiSheet: React.FC = () => {
  const [search, setSearch] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // 🌟 Selective Month Sync Target
  const [selectedSyncMonth, setSelectedSyncMonth] = useState<string>('ALL');

  // Modals State
  const [showAddMslModal, setShowAddMslModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [mslSearchQuery, setMslSearchQuery] = useState('');
  const [selectedMslDoc, setSelectedMslDoc] = useState<MslDoctor | null>(null);

  const [newRoiForm, setNewRoiForm] = useState({
    mobileNo: '',
    activityType: 'GIFT CARDS',
    activityAmount: '30000',
    dateOfActivity: "Aug'26",
    category: 'NEW' as 'OLD' | 'NEW'
  });

  // 🌟 Persistent ROI Doctors with Explicit Date & ROI Storage
  const [roiList, setRoiList] = useState<RoiDoctorItem[]>(() => {
    try {
      const saved = localStorage.getItem(ROI_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    // Initialize with MSL visit dates pre-filled
    const mslDocs: MslDoctor[] = memoryStore.mslData || [];
    return INITIAL_ROI_SEED.map(seedItem => {
      const match = mslDocs.find(d => d.srNo === seedItem.sn || cleanStr(d.doctorName) === cleanStr(seedItem.drName));
      const populated: any = { ...seedItem };
      MONTH_KEYS.forEach(m => {
        populated[m.dateKey] = match ? ((match as any)[m.key] || '') : '';
      });
      return populated;
    });
  });

  const persistRoiList = (updated: RoiDoctorItem[]) => {
    setRoiList(updated);
    try {
      localStorage.setItem(ROI_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleFieldChange = (sn: number, field: keyof RoiDoctorItem, val: any) => {
    const updated = roiList.map(r => r.sn === sn ? { ...r, [field]: val } : r);
    persistRoiList(updated);
  };

  // 🌟 1. SELECTIVE MONTH AUTO-SYNC FROM MSL SCHEDULE
  const handleAutoSyncFromMsl = () => {
    const mslDoctors: MslDoctor[] = memoryStore.mslData || [];
    if (mslDoctors.length === 0) {
      setSyncMsg('⚠️ MSL Schedule mein koi doctor data nahi mila!');
      setTimeout(() => setSyncMsg(null), 3000);
      return;
    }

    const updated = roiList.map(item => {
      const match = mslDoctors.find(d => d.srNo === item.sn || cleanStr(d.doctorName) === cleanStr(item.drName));
      if (!match) return item;

      const newItem: any = { ...item };
      if (selectedSyncMonth === 'ALL') {
        MONTH_KEYS.forEach(m => {
          newItem[m.dateKey] = (match as any)[m.key] || '';
        });
      } else {
        const mObj = MONTH_KEYS.find(m => m.key === selectedSyncMonth);
        if (mObj) {
          newItem[mObj.dateKey] = (match as any)[mObj.key] || '';
        }
      }
      return newItem;
    });

    persistRoiList(updated);
    const mLabel = SYNC_MONTH_OPTIONS.find(o => o.key === selectedSyncMonth)?.label || selectedSyncMonth;
    setSyncMsg(`🎉 [${mLabel}] ki Visit Dates MSL Schedule se live update aur save ho gayi hain!`);
    setTimeout(() => setSyncMsg(null), 3500);
  };

  const handleSave = () => {
    persistRoiList(roiList);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const calculateRowTotal = (doc: RoiDoctorItem): number => {
    const fields = [
      doc.jan26_roi, doc.feb26_roi, doc.mar26_roi,
      doc.apr_roi, doc.may_roi, doc.jun_roi, doc.jul_roi, doc.aug_roi,
      doc.sept_roi, doc.oct_roi, doc.nov_roi, doc.dec_roi, doc.jan_roi, doc.feb_roi, doc.mar_roi
    ];
    return fields.reduce((acc: number, v) => acc + (parseFloat(String(v || '0').replace(/,/g, '')) || 0), 0);
  };

  const handleRemoveBlankDoctors = () => {
    const validDocs = roiList.filter(d => (d.drName || '').trim().length > 0);
    const removedCount = roiList.length - validDocs.length;
    if (removedCount === 0) {
      alert("Koi khali/blank doctor row nahi hai!");
      return;
    }
    if (window.confirm(`Kya aap ${removedCount} bina naam wali khali rows ko delete karna chahte hain?`)) {
      persistRoiList(validDocs);
      setSyncMsg(`🧹 ${removedCount} khali rows successfully remove ho gayi hain!`);
      setTimeout(() => setSyncMsg(null), 3000);
    }
  };

  const handleSelectMslDoctor = (doc: MslDoctor) => {
    setSelectedMslDoc(doc);
    setNewRoiForm(prev => ({
      ...prev,
      activityType: doc.activityType || 'GIFT CARDS'
    }));
  };

  const handleConfirmAddMslDoctor = () => {
    if (!selectedMslDoc) {
      alert("Kripya MSL Doctor List me se doctor select karein!");
      return;
    }

    const created: any = {
      sn: selectedMslDoc.srNo,
      drName: selectedMslDoc.doctorName,
      execName: 'BANWARI LAL MEENA',
      mobileNo: newRoiForm.mobileNo.trim(),
      activityType: newRoiForm.activityType.trim(),
      activityAmount: newRoiForm.activityAmount.trim(),
      dateOfActivity: newRoiForm.dateOfActivity.trim(),
      category: newRoiForm.category,
      apr_roi: '', may_roi: '', jun_roi: '', jul_roi: '', aug_roi: '',
      sept_roi: '', oct_roi: '', nov_roi: '', dec_roi: '', jan_roi: '', feb_roi: '', mar_roi: ''
    };

    // Pre-fill all visit dates from MSL
    MONTH_KEYS.forEach(m => {
      created[m.dateKey] = (selectedMslDoc as any)[m.key] || '';
    });

    persistRoiList([...roiList, created]);
    setShowAddMslModal(false);
    setSelectedMslDoc(null);
    setMslSearchQuery('');
    setSyncMsg(`🎉 Dr. ${created.drName} (#${created.sn}) ROI list me add ho gaye!`);
    setTimeout(() => setSyncMsg(null), 3000);
  };

  const handleRemoveDoctorDirect = (sn: number, name: string) => {
    if (window.confirm(`⚠️ Kya aap Dr. ${name || '#' + sn} ko ROI list se DELETE karna chahte hain?`)) {
      persistRoiList(roiList.filter(r => r.sn !== sn));
      setSyncMsg(`🗑️ Dr. ${name || '#' + sn} list se remove ho gaye.`);
      setTimeout(() => setSyncMsg(null), 2500);
    }
  };

  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push('INVESTMENT AND COVERAGE ANALYSIS . ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,');
    lines.push('S.N.,DR.NAME,EXECUTIVE NAME,MOBILE NO.,ACTIVITY TYPE,ACTIVITY AMOUNT,DATE OF ACTIVITY,JAN.,,FEB.,,MARCH,,OLD/NEW,Jan-26,,Feb-26,,Mar-26,,Apr-26,,May-26,,Jun-26,,Jul-26,,Aug-26,,Sep-26,,Oct-26,,Nov-26,,Dec-26,,Jan-27,,Feb-27,,Mar-27,,,');
    lines.push(',,,,,,,DATE,ROI,DATE,ROI,DATE,ROI,,DATE of visit,ROI,DATE of visit,ROI,DATE of visit,ROI,DATE of visit,ROI,DATE of visit,ROI,DATE of visit,ROI,DATE of visit,ROI,DATE of visit,ROI,DATE of visit,ROI,DATE of visit,ROI,DATE of visit,ROI,DATE of visit,ROI,DATE of visit,ROI,DATE of visit,ROI,DATE of visit,ROI,OLD/NEW,TOTAL');

    roiList.forEach(d => {
      const q = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      const row = [
        d.sn,
        q(d.drName),
        q(d.execName || 'BANWARI LAL MEENA'),
        q(d.mobileNo),
        q(d.activityType),
        q(d.activityAmount),
        q(d.dateOfActivity),
        q(d.jan26_date || ''), q(d.jan26_roi || ''),
        q(d.feb26_date || ''), q(d.feb26_roi || ''),
        q(d.mar26_date || ''), q(d.mar26_roi || ''),
        q(d.category || 'OLD'),
        q(d.jan26_date || ''), q(d.jan26_roi || ''),
        q(d.feb26_date || ''), q(d.feb26_roi || ''),
        q(d.mar26_date || ''), q(d.mar26_roi || ''),
        q((d as any).apr_date), q(d.apr_roi || ''),
        q((d as any).may_date), q(d.may_roi || ''),
        q((d as any).jun_date), q(d.jun_roi || ''),
        q((d as any).jul_date), q(d.jul_roi || ''),
        q((d as any).aug_date), q(d.aug_roi || ''),
        q((d as any).sept_date), q(d.sept_roi || ''),
        q((d as any).oct_date), q(d.oct_roi || ''),
        q((d as any).nov_date), q(d.nov_roi || ''),
        q((d as any).dec_date), q(d.dec_roi || ''),
        q((d as any).jan_date), q(d.jan_roi || ''),
        q((d as any).feb_date), q(d.feb_roi || ''),
        q((d as any).mar_date), q(d.mar_roi || ''),
        q(d.category || 'OLD'),
        calculateRowTotal(d)
      ];
      lines.push(row.join(','));
    });

    const csvContent = lines.join('\\r\\n');
    const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '13_ROI.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = useMemo(() => {
    return roiList.filter(r => 
      (r.drName || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.mobileNo || '').includes(search) ||
      (r.activityType || '').toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => {
      const nameA = (a.drName || '').trim();
      const nameB = (b.drName || '').trim();
      if (!nameA && nameB) return 1;
      if (nameA && !nameB) return -1;
      return a.sn - b.sn;
    });
  }, [roiList, search]);

  const grandTotalRoi = roiList.reduce((sum, d) => sum + calculateRowTotal(d), 0);

    const allMslDoctors: MslDoctor[] = useMemo(() => {
    if (memoryStore.mslData && memoryStore.mslData.length > 0) return memoryStore.mslData;
    try {
      const saved = localStorage.getItem('dios_msl_schedule_permanent_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MASTER_123_MSL_DOCTORS || [];
  }, [showAddMslModal]);
  const filteredMslDocs = allMslDoctors.filter(d => {
    const q = mslSearchQuery.toLowerCase();
    return !q || d.doctorName.toLowerCase().includes(q) || (d.speciality || '').toLowerCase().includes(q) || (d.activityType || '').toLowerCase().includes(q) || String(d.srNo).includes(q);
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><DollarSign size={18} /></span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              13. INVESTMENT AND COVERAGE ANALYSIS (ROI)
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                Selective Month Sync &amp; Custom Save
              </span>
            </h2>
            <p className="text-xs text-slate-400">Month-Wise Selective MSL Sync • Fully Editable Dates &amp; ROI Amounts</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-36">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* 🌟 1. SELECTIVE MONTH AUTO-SYNC CONTROLS */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-cyan-500/50">
            <select
              value={selectedSyncMonth}
              onChange={e => setSelectedSyncMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-400 px-2 py-1 focus:outline-none cursor-pointer"
            >
              {SYNC_MONTH_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key} className="bg-slate-900 text-white">{opt.label}</option>
              ))}
            </select>

            <button
              onClick={handleAutoSyncFromMsl}
              className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
              title="Sync visit dates for selected month from MSL"
            >
              <RefreshCw size={12} className="text-yellow-300" /> ⚡ Sync MSL
            </button>
          </div>

          <button
            onClick={() => setShowAddMslModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Plus size={14} /> + Add Doctor
          </button>

          {/* 🌟 2. SAFE REMOVE DOCTOR TOOL IN TOOLBAR */}
          <button
            onClick={() => setShowRemoveModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Safely remove doctors from ROI list"
          >
            <Trash2 size={13} /> Remove Doctor
          </button>

          <button
            onClick={handleRemoveBlankDoctors}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs transition cursor-pointer"
            title="Clean blank rows"
          >
            Clean Blanks
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            {savedSuccess ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
            {savedSuccess ? 'Saved' : 'Save Data'}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            <span className="font-semibold">{syncMsg}</span>
          </div>
          <button onClick={() => setSyncMsg(null)} className="p-1 hover:text-white cursor-pointer"><X size={15} /></button>
        </div>
      )}

      {/* 🌟 3. SAFE REMOVE DOCTOR MODAL DIALOG */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40"><ShieldAlert size={20} /></span>
                <div>
                  <h3 className="text-base font-bold text-white">Remove Doctor from ROI Analysis</h3>
                  <p className="text-xs text-slate-400">Select any doctor to delete safely</p>
                </div>
              </div>
              <button onClick={() => setShowRemoveModal(false)} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-2xl p-2 space-y-1.5 bg-slate-950/80 max-h-[350px]">
              {roiList.map(doc => (
                <div key={doc.sn} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 text-[10px] w-8">#{doc.sn}</span>
                    <span className="font-bold text-white">{doc.drName || '(Unnamed Doctor)'}</span>
                    <span className="text-[10px] text-amber-400">{doc.activityType}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveDoctorDirect(doc.sn, doc.drName)}
                    className="flex items-center gap-1 px-3 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button onClick={() => setShowRemoveModal(false)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Doctor from MSL Modal */}
      {showAddMslModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/60 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40"><Stethoscope size={20} /></span>
                <div>
                  <h3 className="text-base font-bold text-white">Select Doctor from MSL Schedule</h3>
                  <p className="text-xs text-slate-400">Search doctor from master list &amp; enter investment details</p>
                </div>
              </div>
              <button onClick={() => setShowAddMslModal(false)} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>1. Search &amp; Pick MSL Doctor:</span>
                {selectedMslDoc && <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 size={13} /> Selected: #{selectedMslDoc.srNo} {selectedMslDoc.doctorName}</span>}
              </label>
              
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Type doctor name, speciality (e.g. Abhay, Cardio)..."
                  value={mslSearchQuery}
                  onChange={e => setMslSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-xl pl-9 pr-3 py-2 focus:border-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="overflow-y-auto max-h-[150px] border border-slate-800 rounded-2xl p-1.5 space-y-1 bg-slate-950/80">
                {filteredMslDocs.map(doc => {
                  const isSelected = selectedMslDoc?.srNo === doc.srNo;
                  return (
                    <div
                      key={doc.srNo}
                      onClick={() => handleSelectMslDoctor(doc)}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition ${
                        isSelected ? 'bg-emerald-950 border border-emerald-500 text-white font-bold' : 'bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-[10px] w-8">#{doc.srNo}</span>
                        <span className="font-semibold text-white">{doc.doctorName}</span>
                        {doc.speciality && <span className="text-[10px] text-blue-300 bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-500/30">{doc.speciality}</span>}
                        {doc.activityType && <span className="text-[10px] text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">{doc.activityType}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="text-xs font-bold text-emerald-400">2. Investment / Activity Details:</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Mobile No</label>
                  <input type="text" placeholder="e.g. 9829012345" value={newRoiForm.mobileNo} onChange={e => setNewRoiForm({ ...newRoiForm, mobileNo: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 font-mono" />
                </div>
                <div>
                  <label className="block text-amber-400 font-semibold mb-1">Activity Type</label>
                  <input type="text" placeholder="e.g. CASH, GIFT CARDS" value={newRoiForm.activityType} onChange={e => setNewRoiForm({ ...newRoiForm, activityType: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-amber-300 rounded-xl px-3 py-1.5 uppercase font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Activity Amount (₹)</label>
                  <input type="text" placeholder="e.g. 30000" value={newRoiForm.activityAmount} onChange={e => setNewRoiForm({ ...newRoiForm, activityAmount: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold rounded-xl px-3 py-1.5" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Activity Date</label>
                  <input type="text" placeholder="e.g. Aug'26" value={newRoiForm.dateOfActivity} onChange={e => setNewRoiForm({ ...newRoiForm, dateOfActivity: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-slate-300 font-mono rounded-xl px-3 py-1.5 text-center" />
                </div>
                <div>
                  <label className="block text-purple-400 font-semibold mb-1">Category</label>
                  <select value={newRoiForm.category} onChange={e => setNewRoiForm({ ...newRoiForm, category: e.target.value as any })} className="w-full bg-slate-900 border border-slate-700 text-purple-300 font-bold rounded-xl px-3 py-1.5">
                    <option value="NEW">NEW</option>
                    <option value="OLD">OLD</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowAddMslModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
              <button type="button" onClick={handleConfirmAddMslDoctor} disabled={!selectedMslDoc} className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer">
                <Check size={15} /> Add to ROI Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Double-Tier Table (Clean, Safe & Fully Editable) */}
      <div className="overflow-x-auto max-h-[640px] border border-slate-800 rounded-2xl relative shadow-2xl">
        <table className="w-full text-left text-xs border-separate border-spacing-0">
          <thead className="sticky top-0 z-40 bg-slate-950">
            <tr>
              <th rowSpan={2} className="p-2 text-center bg-slate-950 border-b border-r border-slate-800 sticky left-0 z-50 text-slate-400 font-bold uppercase w-10">S.N.</th>
              <th rowSpan={2} className="p-2 bg-slate-950 border-b border-r border-slate-800 sticky left-10 z-50 text-slate-400 font-bold uppercase min-w-[170px]">DR. NAME</th>
              <th rowSpan={2} className="p-2 bg-slate-950 border-b border-r border-slate-800 text-slate-400 font-bold uppercase min-w-[120px]">MOBILE NO.</th>
              <th rowSpan={2} className="p-2 bg-slate-950 border-b border-r border-slate-800 text-amber-400 font-bold uppercase min-w-[130px]">ACTIVITY TYPE</th>
              <th rowSpan={2} className="p-2 text-right bg-slate-950 border-b border-r border-slate-800 text-slate-300 font-bold uppercase min-w-[110px]">ACTIVITY AMT (₹)</th>
              <th rowSpan={2} className="p-2 text-center bg-slate-950 border-b border-r border-slate-800 text-slate-400 font-bold uppercase min-w-[110px]">ACTIVITY DATE</th>
              <th rowSpan={2} className="p-2 text-center bg-slate-950 border-b border-r border-slate-800 text-purple-300 font-bold uppercase w-20">OLD/NEW</th>

              {MONTH_KEYS.map(m => (
                <th key={m.key} colSpan={2} className="p-2 text-center bg-slate-900 border-b border-r border-slate-800 text-cyan-300 font-extrabold uppercase min-w-[180px]">
                  {m.label}
                </th>
              ))}

              <th rowSpan={2} className="p-2 text-right bg-emerald-950/80 border-b border-slate-800 text-emerald-300 font-black uppercase min-w-[110px]">TOTAL ROI (₹)</th>
            </tr>

            <tr>
              {MONTH_KEYS.map(m => (
                <React.Fragment key={`sub_${m.key}`}>
                  <th className="p-1 text-center bg-slate-950 text-[10px] text-slate-400 border-b border-r border-slate-800 font-semibold w-24">DATE of visit</th>
                  <th className="p-1 text-center bg-slate-950 text-[10px] text-emerald-400 border-b border-r border-slate-800 font-bold w-20">ROI (₹)</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody className="bg-slate-900 divide-y divide-slate-800/60">
            {filtered.map(doc => {
              const rowTotal = calculateRowTotal(doc);
              const isBlank = !(doc.drName || '').trim();

              return (
                <tr key={doc.sn} className={`transition group ${isBlank ? 'bg-rose-950/20 hover:bg-rose-950/40' : 'hover:bg-slate-800/60'}`}>
                  <td className="p-1 text-center font-mono text-slate-400 border-b border-r border-slate-800/80 sticky left-0 bg-slate-900 group-hover:bg-slate-800 z-20">
                    {doc.sn}
                  </td>

                  <td className="p-1 border-b border-r border-slate-800/80 sticky left-10 bg-slate-900 group-hover:bg-slate-800 z-20">
                    <input
                      type="text"
                      value={doc.drName}
                      onChange={e => handleFieldChange(doc.sn, 'drName', e.target.value)}
                      placeholder="Doctor Name"
                      className={`w-full py-1 px-1.5 bg-slate-950 rounded-md font-bold text-xs border focus:outline-none ${
                        isBlank ? 'border-rose-500/60 text-rose-300' : 'border-slate-800 text-white focus:border-emerald-500'
                      }`}
                    />
                  </td>

                  <td className="p-1 border-b border-r border-slate-800/80">
                    <input type="text" value={doc.mobileNo} onChange={e => handleFieldChange(doc.sn, 'mobileNo', e.target.value)} placeholder="Mobile" className="w-full py-1 px-1.5 bg-slate-950 rounded-md font-mono text-slate-300 text-xs border border-slate-800 focus:border-emerald-500 focus:outline-none" />
                  </td>

                  <td className="p-1 border-b border-r border-slate-800/80">
                    <input type="text" value={doc.activityType} onChange={e => handleFieldChange(doc.sn, 'activityType', e.target.value)} className="w-full py-1 px-1.5 bg-slate-950 rounded-md font-semibold text-amber-400 text-xs border border-slate-800 focus:border-emerald-500 focus:outline-none uppercase" />
                  </td>

                  <td className="p-1 border-b border-r border-slate-800/80">
                    <input type="text" value={doc.activityAmount} onChange={e => handleFieldChange(doc.sn, 'activityAmount', e.target.value)} className="w-full py-1 px-1.5 bg-slate-950 rounded-md font-mono font-bold text-right text-slate-200 text-xs border border-slate-800 focus:border-emerald-500 focus:outline-none" />
                  </td>

                  <td className="p-1 border-b border-r border-slate-800/80">
                    <input type="text" value={doc.dateOfActivity} onChange={e => handleFieldChange(doc.sn, 'dateOfActivity', e.target.value)} className="w-full py-1 px-1 bg-slate-950 rounded-md font-mono text-center text-slate-400 text-xs border border-slate-800 focus:border-emerald-500 focus:outline-none" />
                  </td>

                  <td className="p-1 text-center border-b border-r border-slate-800/80">
                    <select value={doc.category || 'OLD'} onChange={e => handleFieldChange(doc.sn, 'category', e.target.value as any)} className="bg-slate-950 text-purple-300 font-bold text-[10px] rounded px-1.5 py-1 border border-slate-800 focus:outline-none">
                      <option value="OLD">OLD</option>
                      <option value="NEW">NEW</option>
                    </select>
                  </td>

                  {/* 12 Months: (Editable Synced Visit Date + Editable ROI Amount) */}
                  {MONTH_KEYS.map(m => {
                    const dateVal = (doc as any)[m.dateKey] || '';
                    const roiVal = (doc as any)[m.roiKey] || '';

                    return (
                      <React.Fragment key={m.key}>
                        {/* 🌟 Fully Editable Visit Date Cell */}
                        <td className="p-1 text-center border-b border-r border-slate-800/60 bg-slate-950/40">
                          <input
                            type="text"
                            value={dateVal}
                            onChange={e => handleFieldChange(doc.sn, m.dateKey as any, e.target.value)}
                            placeholder="-"
                            className="w-full py-1 px-1 bg-transparent text-center font-mono text-[10px] text-cyan-300 font-semibold focus:bg-slate-950 focus:outline-none"
                          />
                        </td>

                        {/* 🌟 Fully Editable ROI (₹) Cell */}
                        <td className="p-1 border-b border-r border-slate-800/60">
                          <input
                            type="text"
                            value={roiVal}
                            onChange={e => handleFieldChange(doc.sn, m.roiKey as any, e.target.value)}
                            placeholder="0"
                            className={`w-full py-1 px-1 bg-slate-950 rounded-md font-mono font-bold text-right text-xs border focus:outline-none ${
                              roiVal && roiVal !== '0' ? 'text-emerald-300 border-emerald-500/50' : 'text-slate-500 border-slate-800'
                            }`}
                          />
                        </td>
                      </React.Fragment>
                    );
                  })}

                  <td className="p-2 text-right font-mono font-black text-emerald-400 bg-emerald-950/20 border-b border-slate-800">
                    ₹{rowTotal.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Grand Total Footer */}
          <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-emerald-500/40 font-bold z-30 shadow-2xl text-xs">
            <tr>
              <td colSpan={7} className="p-3 text-white font-extrabold uppercase border-r border-slate-800">
                GRAND TOTAL (ALL DOCTORS ROI)
              </td>
              {MONTH_KEYS.map(m => {
                const monthSum = roiList.reduce((acc, d) => acc + (parseFloat(String((d as any)[m.roiKey] || '0').replace(/,/g, '')) || 0), 0);
                return (
                  <React.Fragment key={`foot_${m.key}`}>
                    <td className="p-2 text-center text-slate-500 font-mono border-r border-slate-800">-</td>
                    <td className="p-2 text-right font-mono font-bold text-emerald-400 bg-emerald-950/40 border-r border-slate-800">
                      {monthSum > 0 ? `₹${monthSum.toLocaleString()}` : '-'}
                    </td>
                  </React.Fragment>
                );
              })}
              <td className="p-3 text-right font-mono font-black text-sm text-emerald-300 bg-emerald-950">
                ₹{grandTotalRoi.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
