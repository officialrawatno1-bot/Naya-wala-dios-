import React, { useState, useMemo } from 'react';
import { 
  Layers, Search, Save, Download, Check, Plus, Trash2, 
  RefreshCw, X, Stethoscope, Sparkles, Filter, Calendar, 
  CheckCircle2, ShieldAlert 
} from 'lucide-react';
import { memoryStore, MslDoctor } from '../../data/memoryStore';
import { MASTER_123_MSL_DOCTORS } from './MslSheet';

const STORAGE_KEY = 'dios_a2_ghee_valros_permanent_v2';

export interface A2GheeRow {
  sn: number;
  drName: string;
  hq: string;
  dmCard: string;
  dateOfActivity: string;
  prescriberStatus: 'PRESCRIBER' | 'NON' | '-';
  rxPerMonth: string;
  apr: string; may: string; jun: string; jul: string; aug: string; sept: string;
  oct: string; nov: string; dec: string; jan: string; feb: string; mar: string;
}

const MONTH_KEYS = [
  { key: 'apr', label: 'APRIL' }, { key: 'may', label: 'MAY' }, { key: 'jun', label: 'JUNE' },
  { key: 'jul', label: 'JULY' }, { key: 'aug', label: 'AUG' }, { key: 'sept', label: 'SEP' },
  { key: 'oct', label: 'OCT' }, { key: 'nov', label: 'NOV' }, { key: 'dec', label: 'DEC' },
  { key: 'jan', label: 'JAN' }, { key: 'feb', label: 'FEB' }, { key: 'mar', label: 'MAR' }
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

const INITIAL_A2_SEED: A2GheeRow[] = [
  { sn: 1, drName: 'SANJAY GANDHI', hq: 'UDAIPUR', dmCard: 'CARDIOLOGIST', dateOfActivity: '13-Jun', prescriberStatus: 'NON', rxPerMonth: '', apr: '', may: '', jun: '13', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { sn: 2, drName: 'SK KAUSHIQ', hq: 'UDAIPUR', dmCard: 'CARD', dateOfActivity: '13-Jun', prescriberStatus: 'NON', rxPerMonth: '', apr: '2,17,27', may: '6,27', jun: '13,24', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' }
];

const cleanStr = (s: string) => (s || '').toLowerCase().replace(/^(dr\\.?|dr\\s+)/i, '').replace(/[^a-z0-9]/g, '').trim();

export const A2GheeValrosSheet: React.FC = () => {
  const [selectedSyncMonth, setSelectedSyncMonth] = useState('ALL');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Modals State
  const [showAddMslModal, setShowAddMslModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [mslSearchQuery, setMslSearchQuery] = useState('');
  const [selectedMslDoc, setSelectedMslDoc] = useState<MslDoctor | null>(null);

  const [newDocForm, setNewDocForm] = useState({
    dateOfActivity: '13-Jun',
    prescriberStatus: 'NON' as 'PRESCRIBER' | 'NON' | '-',
    rxPerMonth: ''
  });

  const [rows, setRows] = useState<A2GheeRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_A2_SEED;
  });

  const persistRows = (updated: A2GheeRow[]) => {
    setRows(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

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
    return !q || d.doctorName.toLowerCase().includes(q) || (d.speciality || '').toLowerCase().includes(q) || String(d.srNo).includes(q);
  });

  const handleFieldChange = (sn: number, field: keyof A2GheeRow, val: any) => {
    const updated = rows.map(r => r.sn === sn ? { ...r, [field]: val } : r);
    persistRows(updated);
  };

  const handleAutoSyncFromMsl = () => {
    let updatedCount = 0;
    const updated = rows.map(row => {
      const docClean = cleanStr(row.drName);
      const match = allMslDoctors.find(d => {
        const mClean = cleanStr(d.doctorName);
        return mClean === docClean || mClean.includes(docClean) || docClean.includes(mClean);
      });

      if (!match) return row;

      const copy: any = { ...row };
      if (selectedSyncMonth === 'ALL') {
        MONTH_KEYS.forEach(m => {
          copy[m.key] = (match as any)[m.key] || copy[m.key] || '';
        });
        updatedCount++;
      } else {
        copy[selectedSyncMonth] = (match as any)[selectedSyncMonth] || copy[selectedSyncMonth] || '';
        updatedCount++;
      }
      return copy;
    });

    persistRows(updated);
    const mLabel = SYNC_MONTH_OPTIONS.find(o => o.key === selectedSyncMonth)?.label || selectedSyncMonth;
    setStatusMsg(`🎉 SUCCESS: [${mLabel}] ki Visit Dates MSL Schedule se auto-sync ho gayi hain!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleSelectMslDoctor = (doc: MslDoctor) => {
    setSelectedMslDoc(doc);
  };

  const handleConfirmAddMslDoctor = () => {
    if (!selectedMslDoc) {
      alert("Kripya MSL se doctor select karein!");
      return;
    }

    const nextSn = rows.length > 0 ? Math.max(...rows.map(r => r.sn)) + 1 : 1;
    const newRow: any = {
      sn: nextSn,
      drName: selectedMslDoc.doctorName,
      hq: 'UDAIPUR',
      dmCard: selectedMslDoc.speciality || 'CARDIOLOGIST',
      dateOfActivity: newDocForm.dateOfActivity,
      prescriberStatus: newDocForm.prescriberStatus,
      rxPerMonth: newDocForm.rxPerMonth,
      apr: '', may: '', jun: '', jul: '', aug: '', sept: '',
      oct: '', nov: '', dec: '', jan: '', feb: '', mar: ''
    };

    // Copy visit dates from MSL
    MONTH_KEYS.forEach(m => {
      newRow[m.key] = (selectedMslDoc as any)[m.key] || '';
    });

    persistRows([...rows, newRow]);
    setShowAddMslModal(false);
    setSelectedMslDoc(null);
    setMslSearchQuery('');
    setStatusMsg(`🎉 Dr. ${newRow.drName} successfully A2 Ghee campaign me add ho gaye!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleRemoveDoctor = (sn: number, name: string) => {
    if (window.confirm(`⚠️ Kya aap Dr. ${name || '#' + sn} ko A2 Ghee campaign se delete karna chahte hain?`)) {
      persistRows(rows.filter(r => r.sn !== sn));
      setStatusMsg(`🗑️ Dr. ${name || '#' + sn} list se remove ho gaye.`);
      setTimeout(() => setStatusMsg(null), 2500);
    }
  };

  const handleSave = () => {
    persistRows(rows);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push('PRODUCT NAME,,VALROS,A2 GHEE CAMPAIGN,,,,VISIT DATES,,,,,,,,,,,');
    lines.push('S.NO.,DR NAME,HQ,DM CARD,DATE OF ACTIVITY,PRESCRIBER/NON PRESCRIBER,NO. OF PRESCRIPTION/MONTH, APRIL,MAY,JUNE,JULY,AUG,SEP,OCT,NOV,DEC,JAN,FEB,MAR');

    rows.forEach(r => {
      const q = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      const row = [
        r.sn, q(r.drName), q(r.hq), q(r.dmCard), q(r.dateOfActivity), q(r.prescriberStatus), q(r.rxPerMonth),
        q(r.apr), q(r.may), q(r.jun), q(r.jul), q(r.aug), q(r.sept),
        q(r.oct), q(r.nov), q(r.dec), q(r.jan), q(r.feb), q(r.mar)
      ];
      lines.push(row.join(','));
    });

    const csvContent = lines.join('\\r\\n');
    const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '8_A2_GHEE_VALROS.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><Layers size={18} /></span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              8. A2 GHEE VALROS CAMPAIGN
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                Extended Dates View &amp; MSL Picker
              </span>
            </h2>
            <p className="text-xs text-slate-400">PRODUCT: VALROS • Wider Columns (115px) for Clear Date Visibility • Add/Remove Doctors</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selective Month Auto-Sync */}
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
              title="Sync visit dates from MSL Schedule"
            >
              <RefreshCw size={12} className="text-yellow-300" /> ⚡ Sync MSL Dates
            </button>
          </div>

          {/* 🌟 ADD DOCTOR FROM MSL BUTTON */}
          <button
            onClick={() => setShowAddMslModal(true)}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Plus size={14} /> + Add Doctor (From MSL)
          </button>

          {/* 🌟 SAFE REMOVE DOCTOR BUTTON */}
          <button
            onClick={() => setShowRemoveModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Trash2 size={13} /> Remove Doctor
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

      {statusMsg && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="p-1 hover:text-white cursor-pointer"><X size={15} /></button>
        </div>
      )}

      {/* 🌟 ADD DOCTOR FROM MSL MODAL */}
      {showAddMslModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/60 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40"><Stethoscope size={20} /></span>
                <div>
                  <h3 className="text-base font-bold text-white">Select Doctor from MSL Schedule</h3>
                  <p className="text-xs text-slate-400">Search doctor from MSL to add in A2 Ghee Campaign</p>
                </div>
              </div>
              <button onClick={() => setShowAddMslModal(false)} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>1. Search &amp; Pick Doctor:</span>
                {selectedMslDoc && <span className="text-amber-400 font-bold flex items-center gap-1"><CheckCircle2 size={13} /> Selected: #{selectedMslDoc.srNo} {selectedMslDoc.doctorName}</span>}
              </label>
              
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Type doctor name..."
                  value={mslSearchQuery}
                  onChange={e => setMslSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-xl pl-9 pr-3 py-2 focus:border-amber-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="overflow-y-auto max-h-[140px] border border-slate-800 rounded-2xl p-1.5 space-y-1 bg-slate-950/80">
                {filteredMslDocs.map(doc => {
                  const isSelected = selectedMslDoc?.srNo === doc.srNo;
                  return (
                    <div
                      key={doc.srNo}
                      onClick={() => handleSelectMslDoctor(doc)}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition ${
                        isSelected ? 'bg-amber-950 border border-amber-500 text-white font-bold' : 'bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-[10px] w-8">#{doc.srNo}</span>
                        <span className="font-semibold text-white">{doc.doctorName}</span>
                        {doc.speciality && <span className="text-[10px] text-blue-300 bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-500/30">{doc.speciality}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="text-xs font-bold text-amber-400">2. Campaign Activity Details:</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Date of Activity</label>
                  <input type="text" placeholder="e.g. 13-Jun" value={newDocForm.dateOfActivity} onChange={e => setNewDocForm({ ...newDocForm, dateOfActivity: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Prescriber Status</label>
                  <select value={newDocForm.prescriberStatus} onChange={e => setNewDocForm({ ...newDocForm, prescriberStatus: e.target.value as any })} className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-bold rounded-xl px-3 py-1.5">
                    <option value="NON">NON</option>
                    <option value="PRESCRIBER">PRESCRIBER</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowAddMslModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
              <button type="button" onClick={handleConfirmAddMslDoctor} disabled={!selectedMslDoc} className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-xl shadow-lg cursor-pointer">
                <Check size={15} /> Add to A2 Ghee Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 SAFE REMOVE DOCTOR MODAL */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40"><ShieldAlert size={20} /></span>
                <div>
                  <h3 className="text-base font-bold text-white">Remove Doctor</h3>
                  <p className="text-xs text-slate-400">Select doctor to remove from A2 Ghee list</p>
                </div>
              </div>
              <button onClick={() => setShowRemoveModal(false)} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-2xl p-2 space-y-1.5 bg-slate-950/80 max-h-[300px]">
              {rows.map(doc => (
                <div key={doc.sn} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 text-[10px] w-8">#{doc.sn}</span>
                    <span className="font-bold text-white">{doc.drName || '(Unnamed)'}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveDoctor(doc.sn, doc.drName)}
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

      {/* Main 2-Tier Table with WIDER (115px) Columns */}
      <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 bg-slate-950">
              {/* Tier 1 Header */}
              <tr>
                <th colSpan={7} className="p-2.5 bg-slate-900 border-b border-r border-slate-800 text-amber-300 font-extrabold uppercase tracking-wider">
                  PRODUCT NAME: VALROS | A2 GHEE CAMPAIGN
                </th>
                <th colSpan={12} className="p-2.5 text-center bg-cyan-950/70 border-b border-r border-slate-800 text-cyan-300 font-extrabold uppercase tracking-wider">
                  VISIT DATES (2026-2027)
                </th>
                <th className="p-2.5 text-center bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase w-12">
                  Action
                </th>
              </tr>

              {/* Tier 2 Header */}
              <tr>
                <th className="p-2 text-center w-10 bg-slate-950 border-b border-r border-slate-800 text-slate-400 font-bold uppercase">S.NO.</th>
                <th className="p-2 min-w-[170px] bg-slate-950 border-b border-r border-slate-800 text-white font-bold uppercase">DR NAME</th>
                <th className="p-2 text-center w-24 bg-slate-950 border-b border-r border-slate-800 text-slate-400 font-bold uppercase">HQ</th>
                <th className="p-2 text-center w-28 bg-slate-950 border-b border-r border-slate-800 text-slate-300 font-bold uppercase">DM CARD</th>
                <th className="p-2 text-center w-28 bg-slate-950 border-b border-r border-slate-800 text-amber-400 font-bold uppercase">DATE OF ACTIVITY</th>
                <th className="p-2 text-center min-w-[140px] bg-slate-950 border-b border-r border-slate-800 text-blue-300 font-bold uppercase">PRESCRIBER / NON</th>
                <th className="p-2 text-center min-w-[130px] bg-slate-950 border-b border-r border-slate-800 text-emerald-400 font-bold uppercase">NO. OF Rx / MONTH</th>

                {/* 🌟 1. WIDER MONTH COLUMNS (115px) SO VISIT DATES FIT COMFORTABLY */}
                {MONTH_KEYS.map(m => (
                  <th key={m.key} className="p-2 text-center bg-slate-950 text-[11px] text-cyan-300 border-b border-r border-slate-800 font-black w-[115px] min-w-[115px]">
                    {m.label}
                  </th>
                ))}

                <th className="p-2 text-center bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase w-12">Del</th>
              </tr>
            </thead>

            <tbody className="bg-slate-900 divide-y divide-slate-800/60">
              {rows.map(row => (
                <tr key={row.sn} className="hover:bg-slate-800/60 transition group">
                  <td className="p-2 text-center font-mono text-slate-400 border-b border-r border-slate-800/80">
                    {row.sn}
                  </td>

                  <td className="p-1 border-b border-r border-slate-800/80">
                    <input
                      type="text"
                      value={row.drName}
                      onChange={e => handleFieldChange(row.sn, 'drName', e.target.value)}
                      placeholder="Doctor Name"
                      className="w-full py-1.5 px-2 bg-slate-950 rounded-md font-bold text-white text-xs border border-slate-800 focus:border-amber-500 focus:outline-none"
                    />
                  </td>

                  <td className="p-1 text-center border-b border-r border-slate-800/80">
                    <input type="text" value={row.hq} onChange={e => handleFieldChange(row.sn, 'hq', e.target.value)} className="w-full py-1.5 bg-slate-950 border border-slate-800 text-center text-slate-300 rounded text-xs" />
                  </td>

                  <td className="p-1 text-center border-b border-r border-slate-800/80">
                    <input type="text" value={row.dmCard} onChange={e => handleFieldChange(row.sn, 'dmCard', e.target.value)} className="w-full py-1.5 bg-slate-950 border border-slate-800 text-center font-semibold text-slate-300 rounded text-xs uppercase" />
                  </td>

                  <td className="p-1 text-center border-b border-r border-slate-800/80">
                    <input type="text" value={row.dateOfActivity} onChange={e => handleFieldChange(row.sn, 'dateOfActivity', e.target.value)} placeholder="13-Jun" className="w-full py-1.5 bg-slate-950 border border-slate-800 text-center font-mono font-bold text-amber-300 rounded text-xs" />
                  </td>

                  <td className="p-1 text-center border-b border-r border-slate-800/80">
                    <select
                      value={row.prescriberStatus || '-'}
                      onChange={e => handleFieldChange(row.sn, 'prescriberStatus', e.target.value as any)}
                      className={`w-full py-1.5 px-1 rounded-md font-bold text-xs border focus:outline-none cursor-pointer text-center ${
                        row.prescriberStatus === 'PRESCRIBER'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-500/50'
                          : row.prescriberStatus === 'NON'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <option value="PRESCRIBER" className="bg-slate-900 text-blue-300">PRESCRIBER</option>
                      <option value="NON" className="bg-slate-900 text-amber-300">NON</option>
                      <option value="-" className="bg-slate-900 text-slate-500">-</option>
                    </select>
                  </td>

                  <td className="p-1 text-center border-b border-r border-slate-800/80">
                    <input type="text" value={row.rxPerMonth} onChange={e => handleFieldChange(row.sn, 'rxPerMonth', e.target.value)} placeholder="0" className="w-full py-1.5 px-1 bg-slate-950 border border-slate-800 text-center font-mono font-bold text-emerald-300 rounded text-xs focus:border-emerald-500 focus:outline-none" />
                  </td>

                  {/* 🌟 WIDE (115px) VISIT DATE CELLS */}
                  {MONTH_KEYS.map(m => (
                    <td key={m.key} className="p-1 text-center border-b border-r border-slate-800/60 w-[115px] min-w-[115px]">
                      <input
                        type="text"
                        value={(row as any)[m.key] || ''}
                        onChange={e => handleFieldChange(row.sn, m.key as any, e.target.value)}
                        placeholder="-"
                        className="w-full py-1.5 px-1 bg-slate-950 rounded-md font-mono font-bold text-center text-xs text-cyan-300 border border-slate-800 focus:border-cyan-500 focus:outline-none"
                      />
                    </td>
                  ))}

                  <td className="p-1 text-center border-b border-slate-800">
                    <button
                      onClick={() => handleRemoveDoctor(row.sn, row.drName)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                      title="Delete Doctor"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
