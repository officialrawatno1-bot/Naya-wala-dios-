import React, { useState, useMemo } from 'react';
import { 
  HeartPulse, Search, Download, Check, Plus, Trash2, 
  RefreshCw, X, Stethoscope, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { memoryStore, MslDoctor } from '../../data/memoryStore';
import { MASTER_123_MSL_DOCTORS } from './MslSheet';
import { CloudSyncBar } from '../CloudSyncBar';

const STORAGE_KEY = 'dios_wcfyh_campaign_permanent_v2';

export interface WcfyhRow {
  id: string;
  sn: number;
  brand: 'VINTEL' | 'VALROS';
  drName: string;
  speciality: string;
  dateOfCampaign: string;
  campaignDoneOn: string;
  rxGenerated: string;
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

const INITIAL_WCFYH_SEED: WcfyhRow[] = [
  { id: 'w1', sn: 1, brand: 'VINTEL', drName: 'PRIYANKA MINOCHA', speciality: 'MD MBBS, NEUROLOGY', dateOfCampaign: '10TH OF EVERY MONTH', campaignDoneOn: 'na', rxGenerated: '', apr: '3,17,24', may: '8,19,29', jun: '12', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'w2', sn: 2, brand: 'VINTEL', drName: 'Mona dingra', speciality: 'DM ENDOCRINOLOGIST', dateOfCampaign: '10TH OF EVERY MONTH', campaignDoneOn: '10-Jul', rxGenerated: '', apr: '18,23', may: '21,28', jun: '22', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'w3', sn: 3, brand: 'VINTEL', drName: 'UDAY BHOMIK', speciality: 'MCH NEUROSURGERY', dateOfCampaign: '10TH OF EVERY MONTH', campaignDoneOn: '17-Jul', rxGenerated: '', apr: '30', may: '15', jun: '12', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'w4', sn: 1, brand: 'VALROS', drName: 'DEEPAK AAMETHA', speciality: 'DM CARD.', dateOfCampaign: '20TH OF EVERY MONTH', campaignDoneOn: '22-Jul', rxGenerated: '', apr: '7,10,17', may: '12,19,26', jun: '16,19', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'w5', sn: 2, brand: 'VALROS', drName: 'MUKESH SHARMA', speciality: 'DM CARD.', dateOfCampaign: '20TH OF EVERY MONTH', campaignDoneOn: '22-Jul', rxGenerated: '', apr: '2,21,29', may: '12,19', jun: '3,24', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'w6', sn: 3, brand: 'VALROS', drName: 'CPPUROHIT', speciality: 'DM CARD.', dateOfCampaign: '20TH OF EVERY MONTH', campaignDoneOn: '22-Jul', rxGenerated: '', apr: '4,14,21,28', may: '12,18', jun: '20', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'w7', sn: 4, brand: 'VALROS', drName: 'RAMESH PATEL', speciality: 'DM CARD.', dateOfCampaign: '20TH OF EVERY MONTH', campaignDoneOn: '22-Jul', rxGenerated: '', apr: '1,17,22', may: '8,15,18,19,29', jun: '12,19,24', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'w8', sn: 5, brand: 'VALROS', drName: 'Sanjay Gandhi', speciality: 'MS, MCH, CARDIOLOGY', dateOfCampaign: '20TH OF EVERY MONTH', campaignDoneOn: '', rxGenerated: '', apr: '', may: '', jun: '13', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'w9', sn: 6, brand: 'VALROS', drName: 'RAVIRAJ SINGH AHADA', speciality: 'DM CARD.', dateOfCampaign: '20TH OF EVERY MONTH', campaignDoneOn: '22-Jul', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'w10', sn: 7, brand: 'VALROS', drName: 'Dilip jain', speciality: 'DM CARD.', dateOfCampaign: '20TH OF EVERY MONTH', campaignDoneOn: '23-Jul', rxGenerated: '', apr: '4,13,17,21,27', may: '18,26,29', jun: '9,19,29', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' }
];

const cleanStr = (s: string) => (s || '').toLowerCase().replace(/^(dr\.?|dr\s+)/i, '').replace(/[^a-z0-9]/g, '').trim();

// 🌟 STRICT AUTO-GROUPING & SERIAL NUMBER RE-INDEXING
const organizeAndIndexRows = (rawList: WcfyhRow[]): WcfyhRow[] => {
  const vintelList = rawList.filter(r => (r.brand || '').toUpperCase().trim() === 'VINTEL');
  const valrosList = rawList.filter(r => (r.brand || '').toUpperCase().trim() !== 'VINTEL');

  const indexedVintel = vintelList.map((r, i) => ({
    ...r,
    sn: i + 1,
    brand: 'VINTEL' as const,
    dateOfCampaign: r.dateOfCampaign || '10TH OF EVERY MONTH'
  }));

  const indexedValros = valrosList.map((r, i) => ({
    ...r,
    sn: i + 1,
    brand: 'VALROS' as const,
    dateOfCampaign: r.dateOfCampaign || '20TH OF EVERY MONTH'
  }));

  return [...indexedVintel, ...indexedValros];
};

export const WcfyhSheet: React.FC = () => {
  const [selectedSyncMonth, setSelectedSyncMonth] = useState('ALL');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [showAddMslModal, setShowAddMslModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [mslSearchQuery, setMslSearchQuery] = useState('');
  const [selectedMslDoc, setSelectedMslDoc] = useState<MslDoctor | null>(null);

  const [newDocForm, setNewDocForm] = useState<{
    brand: 'VINTEL' | 'VALROS';
    speciality: string;
    dateOfCampaign: string;
    campaignDoneOn: string;
    rxGenerated: string;
  }>({
    brand: 'VINTEL',
    speciality: 'MD MBBS, NEUROLOGY',
    dateOfCampaign: '10TH OF EVERY MONTH',
    campaignDoneOn: 'na',
    rxGenerated: ''
  });

  const [rows, setRows] = useState<WcfyhRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return organizeAndIndexRows(parsed);
        }
      }
    } catch (e) {}
    return organizeAndIndexRows(INITIAL_WCFYH_SEED);
  });

  const persistRows = (updated: WcfyhRow[]) => {
    const sorted = organizeAndIndexRows(updated);
    setRows(sorted);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
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

  const handleFieldChange = (id: string, field: keyof WcfyhRow, val: any) => {
    const updated = rows.map(r => r.id === id ? { ...r, [field]: val } : r);
    persistRows(updated);
  };

  const handleAutoSyncFromMsl = () => {
    let updatedCount = 0;
    const updated = rows.map(row => {
      const docClean = cleanStr(row.drName);
      const match = allMslDoctors.find(d => cleanStr(d.doctorName) === docClean || cleanStr(d.doctorName).includes(docClean) || docClean.includes(cleanStr(d.doctorName)));
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
    setStatusMsg(`🎉 SUCCESS: [${mLabel}] ki Visit Dates MSL Schedule se auto-sync ho gayi!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleSelectMslDoctor = (doc: MslDoctor) => {
    setSelectedMslDoc(doc);
    setNewDocForm(prev => ({
      ...prev,
      speciality: doc.speciality || (newDocForm.brand === 'VINTEL' ? 'MD MED' : 'DM CARD.')
    }));
  };

  const handleBrandSelectionChange = (newBrand: 'VINTEL' | 'VALROS') => {
    setNewDocForm(prev => ({
      ...prev,
      brand: newBrand,
      dateOfCampaign: newBrand === 'VINTEL' ? '10TH OF EVERY MONTH' : '20TH OF EVERY MONTH',
      speciality: prev.speciality || (newBrand === 'VINTEL' ? 'MD MED' : 'DM CARD.')
    }));
  };

  // 🌟 INSERT INSIDE EXACT BRAND SECTION (Vintel top, Valros bottom)
  const handleConfirmAddMslDoctor = () => {
    if (!selectedMslDoc) {
      alert("Kripya MSL se Doctor select karein!");
      return;
    }

    const newRow: WcfyhRow = {
      id: 'w_' + Date.now(),
      sn: 999, // Will be auto-indexed
      brand: newDocForm.brand,
      drName: selectedMslDoc.doctorName,
      speciality: selectedMslDoc.speciality || newDocForm.speciality,
      dateOfCampaign: newDocForm.dateOfCampaign,
      campaignDoneOn: newDocForm.campaignDoneOn,
      rxGenerated: newDocForm.rxGenerated,
      apr: '', may: '', jun: '', jul: '', aug: '', sept: '',
      oct: '', nov: '', dec: '', jan: '', feb: '', mar: ''
    };

    MONTH_KEYS.forEach(m => {
      (newRow as any)[m.key] = (selectedMslDoc as any)[m.key] || '';
    });

    // Auto-organize ensures Vintel rows stay on top and Valros rows stay at bottom
    persistRows([...rows, newRow]);
    setShowAddMslModal(false);
    setSelectedMslDoc(null);
    setMslSearchQuery('');
    setStatusMsg(`🎉 Dr. ${newRow.drName} WCFYH (${newRow.brand} Section) me successfully add ho gaye!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleRemoveDoctorDirect = (id: string, name: string) => {
    if (window.confirm(`⚠️ Kya aap Dr. ${name} ko WCFYH list se delete karna chahte hain?`)) {
      const remaining = rows.filter(r => r.id !== id);
      persistRows(remaining);
      setStatusMsg(`🗑️ Dr. ${name} list se remove ho gaye aur Serial Numbers auto-adjust ho gaye.`);
      setTimeout(() => setStatusMsg(null), 2500);
    }
  };

  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push('WE CARE FOR YOUR HEALTH CAMPAIGN,,,,,,,VISIT DATES,,,,,,,,,,,');
    lines.push('S.NO.,BRAND,NAME OF THE DR.,SPECIALITY,DATE OF CAMPAIGN,CAMPAIGN DONE ON,RX GENERATED, APRIL,MAY,JUNE,JULY,AUG,SEP,OCT,NOV,DEC,JAN,FEB,MAR');

    const vintel = rows.filter(r => r.brand === 'VINTEL');
    const valros = rows.filter(r => r.brand === 'VALROS');

    vintel.forEach(r => {
      const q = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      const row = [
        r.sn, q(r.brand), q(r.drName), q(r.speciality), q(r.dateOfCampaign),
        q(r.campaignDoneOn), q(r.rxGenerated),
        q(r.apr), q(r.may), q(r.jun), q(r.jul), q(r.aug), q(r.sept),
        q(r.oct), q(r.nov), q(r.dec), q(r.jan), q(r.feb), q(r.mar)
      ];
      lines.push(row.join(','));
    });

    lines.push(',,,,,,,,,,,,,,,,,,');
    lines.push(',,,,,p,,,,,,,,,,,,,');
    lines.push(',,,,,,,,,,,,,,,,,,');

    valros.forEach(r => {
      const q = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      const row = [
        r.sn, q(r.brand), q(r.drName), q(r.speciality), q(r.dateOfCampaign),
        q(r.campaignDoneOn), q(r.rxGenerated),
        q(r.apr), q(r.may), q(r.jun), q(r.jul), q(r.aug), q(r.sept),
        q(r.oct), q(r.nov), q(r.dec), q(r.jan), q(r.feb), q(r.mar)
      ];
      lines.push(row.join(','));
    });

    const csvContent = lines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '7_WCFYH.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Grouped rows for visual display
  const vintelRows = useMemo(() => {
    return rows
      .filter(r => r.brand === 'VINTEL')
      .filter(r => !search || r.drName.toLowerCase().includes(search.toLowerCase()) || r.speciality.toLowerCase().includes(search.toLowerCase()));
  }, [rows, search]);

  const valrosRows = useMemo(() => {
    return rows
      .filter(r => r.brand === 'VALROS')
      .filter(r => !search || r.drName.toLowerCase().includes(search.toLowerCase()) || r.speciality.toLowerCase().includes(search.toLowerCase()));
  }, [rows, search]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-rose-500/20 text-rose-400 rounded-lg"><HeartPulse size={18} /></span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              7. WE CARE FOR YOUR HEALTH (WCFYH) CAMPAIGN
              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                Strict Brand Ordering Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">Vintel (10th) Always Top • Valros (20th) Always Bottom • Auto S.N. Sequence</p>
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

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
              <RefreshCw size={12} className="text-yellow-300" /> ⚡ Sync MSL
            </button>
          </div>

          <button
            onClick={() => setShowAddMslModal(true)}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Plus size={14} /> + Add Doctor
          </button>

          <button
            onClick={() => setShowRemoveModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Trash2 size={13} /> Remove Doctor
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Cloud Sync Toolbar */}
      <CloudSyncBar
        storageKey="campaigns/sheet_07_wcfyh"
        sheetTitle="7. WCFYH Campaign (Vintel & Valros)"
        getData={() => ({ rows })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.rows && Array.isArray(cloudData.rows)) {
            persistRows(cloudData.rows);
          }
        }}
        onSaveLocal={() => {
          persistRows(rows);
        }}
      />

      {statusMsg && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="p-1 hover:text-white cursor-pointer"><X size={15} /></button>
        </div>
      )}

      {/* ADD DOCTOR MODAL */}
      {showAddMslModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/60 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40"><Stethoscope size={20} /></span>
                <div>
                  <h3 className="text-base font-bold text-white">Add Doctor to WCFYH Campaign</h3>
                  <p className="text-xs text-slate-400">Select Doctor &amp; Assign to Vintel (Top) or Valros (Bottom)</p>
                </div>
              </div>
              <button onClick={() => setShowAddMslModal(false)} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>1. Search MSL Doctor:</span>
                {selectedMslDoc && <span className="text-rose-400 font-bold flex items-center gap-1"><CheckCircle2 size={13} /> Selected: #{selectedMslDoc.srNo} {selectedMslDoc.doctorName}</span>}
              </label>
              
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Type doctor name..."
                  value={mslSearchQuery}
                  onChange={e => setMslSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-xl pl-9 pr-3 py-2 focus:border-rose-500 focus:outline-none"
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
                        isSelected ? 'bg-rose-950 border border-rose-500 text-white font-bold' : 'bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 text-slate-200'
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
              <div className="text-xs font-bold text-rose-400">2. Campaign Placement:</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Target Section (Brand)</label>
                  <select 
                    value={newDocForm.brand} 
                    onChange={e => handleBrandSelectionChange(e.target.value as any)} 
                    className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-bold rounded-xl px-3 py-1.5 cursor-pointer"
                  >
                    <option value="VINTEL">🔵 VINTEL (Top Section - 10th)</option>
                    <option value="VALROS">🔴 VALROS (Bottom Section - 20th)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Date of Campaign</label>
                  <input 
                    type="text" 
                    value={newDocForm.dateOfCampaign} 
                    onChange={e => setNewDocForm({ ...newDocForm, dateOfCampaign: e.target.value })} 
                    className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-semibold rounded-xl px-3 py-1.5" 
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowAddMslModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
              <button type="button" onClick={handleConfirmAddMslDoctor} disabled={!selectedMslDoc} className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer">
                <Check size={15} /> Add to {newDocForm.brand} Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE DOCTOR MODAL */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40"><ShieldAlert size={20} /></span>
                <div>
                  <h3 className="text-base font-bold text-white">Remove Doctor</h3>
                  <p className="text-xs text-slate-400">Select doctor to delete from WCFYH list</p>
                </div>
              </div>
              <button onClick={() => setShowRemoveModal(false)} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-2xl p-2 space-y-1.5 bg-slate-950/80 max-h-[300px]">
              {rows.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${doc.brand === 'VINTEL' ? 'bg-cyan-950 text-cyan-300' : 'bg-rose-950 text-rose-300'}`}>
                      {doc.brand} #{doc.sn}
                    </span>
                    <span className="font-bold text-white">{doc.drName || '(Unnamed)'}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveDoctorDirect(doc.id, doc.drName)}
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

      {/* Main Table with Visual Section Dividers */}
      <div className="overflow-x-auto max-h-[640px] border border-slate-800 rounded-2xl relative shadow-2xl">
        <table className="w-full text-left text-xs border-separate border-spacing-0">
          <thead className="sticky top-0 z-40 bg-slate-950">
            <tr>
              <th colSpan={7} className="p-2.5 bg-slate-900 border-b border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)] text-rose-300 font-extrabold uppercase tracking-wider sticky left-0 z-50">
                WE CARE FOR YOUR HEALTH CAMPAIGN
              </th>
              <th colSpan={12} className="p-2.5 text-center bg-cyan-950/70 border-b border-r border-slate-800 text-cyan-300 font-extrabold uppercase tracking-wider">
                VISIT DATES (2026-2027)
              </th>
              <th className="p-2.5 text-center bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase w-12">
                Action
              </th>
            </tr>

            <tr>
              <th style={{ width: '42px', minWidth: '42px', left: 0 }} className="p-2 text-center bg-slate-950 border-b border-r border-slate-800 text-slate-400 font-bold uppercase sticky z-50">
                S.NO.
              </th>
              <th style={{ width: '85px', minWidth: '85px', left: '42px' }} className="p-2 bg-slate-950 border-b border-r border-slate-800 text-cyan-400 font-bold uppercase sticky z-50">
                BRAND
              </th>
              <th style={{ width: '180px', minWidth: '180px', left: '127px' }} className="p-2 bg-slate-950 border-b border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)] text-white font-bold uppercase sticky z-50">
                NAME OF THE DR.
              </th>

              <th className="p-2 min-w-[150px] bg-slate-950 border-b border-r border-slate-800 text-slate-300 font-bold uppercase">SPECIALITY</th>
              <th className="p-2 min-w-[160px] bg-slate-950 border-b border-r border-slate-800 text-amber-400 font-bold uppercase">DATE OF CAMPAIGN</th>
              <th className="p-2 text-center min-w-[130px] bg-slate-950 border-b border-r border-slate-800 text-emerald-400 font-bold uppercase">CAMPAIGN DONE ON</th>
              <th className="p-2 text-center min-w-[110px] bg-slate-950 border-b border-r border-slate-800 text-purple-300 font-bold uppercase">RX GENERATED</th>

              {MONTH_KEYS.map(m => (
                <th key={m.key} className="p-2 text-center bg-slate-950 text-[11px] text-cyan-300 border-b border-r border-slate-800 font-black w-[120px] min-w-[120px]">
                  {m.label}
                </th>
              ))}

              <th className="p-2 text-center bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase w-12">Action</th>
            </tr>
          </thead>

          <tbody className="bg-slate-900 divide-y divide-slate-800/60">
            
            {/* 🔵 SECTION 1: VINTEL HEADER */}
            <tr>
              <td colSpan={20} className="bg-cyan-950/90 px-3 py-2 text-xs font-black text-cyan-300 border-y-2 border-cyan-500/60 uppercase tracking-wider">
                🔵 SECTION 1: VINTEL CAMPAIGN (10TH OF EVERY MONTH) — ({vintelRows.length} Doctors)
              </td>
            </tr>

            {vintelRows.map(row => (
              <tr key={row.id} className="hover:bg-slate-800/60 transition group">
                <td style={{ width: '42px', minWidth: '42px', left: 0 }} className="p-2 text-center font-mono text-cyan-300 font-bold border-b border-r border-slate-800/80 sticky bg-slate-900 group-hover:bg-slate-800 z-20">
                  {row.sn}
                </td>

                <td style={{ width: '85px', minWidth: '85px', left: '42px' }} className="p-1 border-b border-r border-slate-800/80 sticky bg-slate-900 group-hover:bg-slate-800 z-20">
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    VINTEL
                  </span>
                </td>

                <td style={{ width: '180px', minWidth: '180px', left: '127px' }} className="p-1 border-b border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)] sticky bg-slate-900 group-hover:bg-slate-800 z-20">
                  <input
                    type="text"
                    value={row.drName}
                    onChange={e => handleFieldChange(row.id, 'drName', e.target.value)}
                    placeholder="Doctor Name"
                    className="w-full py-1.5 px-2 bg-slate-950 rounded-md font-bold text-white text-xs border border-slate-800 focus:border-cyan-500 focus:outline-none"
                  />
                </td>

                <td className="p-1 border-b border-r border-slate-800/80">
                  <input type="text" value={row.speciality} onChange={e => handleFieldChange(row.id, 'speciality', e.target.value)} className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 text-slate-300 rounded text-xs" />
                </td>

                <td className="p-1 border-b border-r border-slate-800/80">
                  <input type="text" value={row.dateOfCampaign} onChange={e => handleFieldChange(row.id, 'dateOfCampaign', e.target.value)} className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 text-amber-300 text-xs font-semibold" />
                </td>

                <td className="p-1 text-center border-b border-r border-slate-800/80">
                  <input type="text" value={row.campaignDoneOn} onChange={e => handleFieldChange(row.id, 'campaignDoneOn', e.target.value)} placeholder="e.g. 10-Jul" className="w-full py-1.5 bg-slate-950 border border-slate-800 text-center font-mono font-bold text-cyan-300 rounded text-xs" />
                </td>

                <td className="p-1 text-center border-b border-r border-slate-800/80">
                  <input type="text" value={row.rxGenerated} onChange={e => handleFieldChange(row.id, 'rxGenerated', e.target.value)} placeholder="-" className="w-full py-1.5 bg-slate-950 border border-slate-800 text-center font-mono font-bold text-purple-300 rounded text-xs" />
                </td>

                {MONTH_KEYS.map(m => (
                  <td key={m.key} className="p-1 text-center border-b border-r border-slate-800/60 w-[120px] min-w-[120px]">
                    <input
                      type="text"
                      value={(row as any)[m.key] || ''}
                      onChange={e => handleFieldChange(row.id, m.key as any, e.target.value)}
                      placeholder="-"
                      className="w-full py-1.5 px-1 bg-slate-950 rounded-md font-mono font-bold text-center text-xs text-cyan-300 border border-slate-800 focus:border-cyan-500 focus:outline-none"
                    />
                  </td>
                ))}

                <td className="p-1 text-center border-b border-slate-800">
                  <button
                    onClick={() => handleRemoveDoctorDirect(row.id, row.drName)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                    title="Delete Row"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}

            {/* 🔴 SECTION 2: VALROS HEADER */}
            <tr>
              <td colSpan={20} className="bg-rose-950/90 px-3 py-2 text-xs font-black text-rose-300 border-y-2 border-rose-500/60 uppercase tracking-wider mt-4">
                🔴 SECTION 2: VALROS CAMPAIGN (20TH OF EVERY MONTH) — ({valrosRows.length} Doctors)
              </td>
            </tr>

            {valrosRows.map(row => (
              <tr key={row.id} className="hover:bg-slate-800/60 transition group">
                <td style={{ width: '42px', minWidth: '42px', left: 0 }} className="p-2 text-center font-mono text-rose-300 font-bold border-b border-r border-slate-800/80 sticky bg-slate-900 group-hover:bg-slate-800 z-20">
                  {row.sn}
                </td>

                <td style={{ width: '85px', minWidth: '85px', left: '42px' }} className="p-1 border-b border-r border-slate-800/80 sticky bg-slate-900 group-hover:bg-slate-800 z-20">
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-500/40">
                    VALROS
                  </span>
                </td>

                <td style={{ width: '180px', minWidth: '180px', left: '127px' }} className="p-1 border-b border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)] sticky bg-slate-900 group-hover:bg-slate-800 z-20">
                  <input
                    type="text"
                    value={row.drName}
                    onChange={e => handleFieldChange(row.id, 'drName', e.target.value)}
                    placeholder="Doctor Name"
                    className="w-full py-1.5 px-2 bg-slate-950 rounded-md font-bold text-white text-xs border border-slate-800 focus:border-rose-500 focus:outline-none"
                  />
                </td>

                <td className="p-1 border-b border-r border-slate-800/80">
                  <input type="text" value={row.speciality} onChange={e => handleFieldChange(row.id, 'speciality', e.target.value)} className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 text-slate-300 rounded text-xs" />
                </td>

                <td className="p-1 border-b border-r border-slate-800/80">
                  <input type="text" value={row.dateOfCampaign} onChange={e => handleFieldChange(row.id, 'dateOfCampaign', e.target.value)} className="w-full py-1.5 px-2 bg-slate-950 border border-slate-800 text-amber-300 text-xs font-semibold" />
                </td>

                <td className="p-1 text-center border-b border-r border-slate-800/80">
                  <input type="text" value={row.campaignDoneOn} onChange={e => handleFieldChange(row.id, 'campaignDoneOn', e.target.value)} placeholder="e.g. 22-Jul" className="w-full py-1.5 bg-slate-950 border border-slate-800 text-center font-mono font-bold text-emerald-400 rounded text-xs" />
                </td>

                <td className="p-1 text-center border-b border-r border-slate-800/80">
                  <input type="text" value={row.rxGenerated} onChange={e => handleFieldChange(row.id, 'rxGenerated', e.target.value)} placeholder="-" className="w-full py-1.5 bg-slate-950 border border-slate-800 text-center font-mono font-bold text-purple-300 rounded text-xs" />
                </td>

                {MONTH_KEYS.map(m => (
                  <td key={m.key} className="p-1 text-center border-b border-r border-slate-800/60 w-[120px] min-w-[120px]">
                    <input
                      type="text"
                      value={(row as any)[m.key] || ''}
                      onChange={e => handleFieldChange(row.id, m.key as any, e.target.value)}
                      placeholder="-"
                      className="w-full py-1.5 px-1 bg-slate-950 rounded-md font-mono font-bold text-center text-xs text-cyan-300 border border-slate-800 focus:border-cyan-500 focus:outline-none"
                    />
                  </td>
                ))}

                <td className="p-1 text-center border-b border-slate-800">
                  <button
                    onClick={() => handleRemoveDoctorDirect(row.id, row.drName)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                    title="Delete Row"
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
  );
};
