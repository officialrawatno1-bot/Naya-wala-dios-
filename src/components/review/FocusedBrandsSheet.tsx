import React, { useState, useMemo } from 'react';
import { 
  Target, Search, Download, Check, Plus, Trash2, 
  RefreshCw, X, Stethoscope, CheckCircle2, 
  Dices
} from 'lucide-react';
import { memoryStore, MslDoctor } from '../../data/memoryStore';
import { MASTER_123_MSL_DOCTORS } from './MslSheet';
import { CloudSyncBar } from '../CloudSyncBar';

const STORAGE_KEY = 'dios_focused_brands_permanent_v3';

export interface FocusedBrandItem {
  id: string;
  sn: number;
  drName: string;
  productName: string;
  speciality: string;
  activityDone: string; // Holds Visit Date from MSL or custom text
  prescriberType: 'PRESCRIBER' | 'NON RXBER' | '-';
  rxGenerated: string;  // Blank manual input
  apr: string; may: string; jun: string; jul: string; aug: string; sept: string;
  oct: string; nov: string; dec: string; jan: string; feb: string; mar: string;
}

const MONTH_KEYS = [
  { key: 'apr', label: 'APRIL' }, { key: 'may', label: 'MAY' }, { key: 'jun', label: 'JUNE' },
  { key: 'jul', label: 'JULY' }, { key: 'aug', label: 'AUG' }, { key: 'sept', label: 'SEP' },
  { key: 'oct', label: 'OCT' }, { key: 'nov', label: 'NOV' }, { key: 'dec', label: 'DEC' },
  { key: 'jan', label: 'JAN' }, { key: 'feb', label: 'FEB' }, { key: 'mar', label: 'MAR' }
];

const FOCUSED_PRODUCTS_MASTER = [
  'CALGYM 60K',
  'DIOFLAM',
  'FITJEE Q10',
  'VINTEL',
  'VALROS',
  'LINAGET',
  'VIDGLIT',
  'CITICURE PLUS'
];

const INITIAL_FOCUSED_SEED: FocusedBrandItem[] = [
  { id: 'f1', sn: 1, drName: 'ABHIJEET BASU', productName: 'CALGYM 60K', speciality: 'GP', activityDone: '7,9,11,17,24', prescriberType: 'PRESCRIBER', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'f2', sn: 2, drName: 'AMIT MEHTA', productName: 'CALGYM 60K', speciality: 'GP', activityDone: '3,13,17,24,27', prescriberType: 'PRESCRIBER', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'f3', sn: 3, drName: 'ANISH BAHL', productName: 'CALGYM 60K', speciality: 'GP', activityDone: '', prescriberType: 'NON RXBER', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'f4', sn: 4, drName: 'JAGDISH VISHNOI', productName: 'CALGYM 60K', speciality: 'GP', activityDone: '14,21,23,28', prescriberType: 'PRESCRIBER', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'f5', sn: 5, drName: 'LALIT SHREEMALI', productName: 'CALGYM 60K', speciality: 'GP', activityDone: '3,11,17,24,27', prescriberType: 'PRESCRIBER', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'f6', sn: 6, drName: 'KB BADOLIYA', productName: 'DIOFLAM', speciality: 'GP', activityDone: '13', prescriberType: 'PRESCRIBER', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'f7', sn: 7, drName: 'RAVI MANGALIYA', productName: 'DIOFLAM', speciality: 'GP', activityDone: '3,17,22', prescriberType: 'PRESCRIBER', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'f8', sn: 8, drName: 'YN VERMA', productName: 'DIOFLAM', speciality: 'GP', activityDone: '11,22', prescriberType: 'NON RXBER', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'f9', sn: 9, drName: 'RN LADDHA', productName: 'DIOFLAM', speciality: 'GP', activityDone: '21', prescriberType: 'PRESCRIBER', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'f10', sn: 10, drName: 'LALIT SHRIMALI', productName: 'DIOFLAM', speciality: 'GP', activityDone: '3,11,17', prescriberType: 'PRESCRIBER', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'f11', sn: 11, drName: 'POOJA GANDHI', productName: 'FITJEE Q10', speciality: 'PHY/GYN/GP', activityDone: '', prescriberType: 'PRESCRIBER', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'f12', sn: 12, drName: 'RADHA RASTOGI', productName: 'FITJEE Q10', speciality: 'PHY/GYN/GP', activityDone: '', prescriberType: 'PRESCRIBER', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'f13', sn: 13, drName: 'LALIT JAINANI', productName: 'FITJEE Q10', speciality: 'PHY/GYN/GP', activityDone: '11', prescriberType: 'NON RXBER', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'f14', sn: 14, drName: 'ANMOL PAGARIYA', productName: 'FITJEE Q10', speciality: 'PHY/GYN/GP', activityDone: '6,22', prescriberType: 'PRESCRIBER', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { id: 'f15', sn: 15, drName: 'BS BOMB', productName: 'FITJEE Q10', speciality: 'PHY/GYN/GP', activityDone: '4,11,15', prescriberType: 'PRESCRIBER', rxGenerated: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' }
];

const cleanStr = (s: string) => (s || '').toLowerCase().replace(/^(dr\\.?|dr\\s+)/i, '').replace(/[^a-z0-9]/g, '').trim();

export const FocusedBrandsSheet: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState('ALL');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const [showAddMslModal, setShowAddMslModal] = useState(false);
  const [mslSearchQuery, setMslSearchQuery] = useState('');
  const [selectedMslDoc, setSelectedMslDoc] = useState<MslDoctor | null>(null);

  const [newBrandForm, setNewBrandForm] = useState({
    productName: 'CALGYM 60K',
    speciality: 'GP',
    activityDone: '',
    prescriberType: 'PRESCRIBER' as 'PRESCRIBER' | 'NON RXBER',
    rxGenerated: ''
  });

  const [items, setItems] = useState<FocusedBrandItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_FOCUSED_SEED;
  });

  const persistItems = (updated: FocusedBrandItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleFieldChange = (id: string, field: keyof FocusedBrandItem, val: any) => {
    const updated = items.map(it => it.id === id ? { ...it, [field]: val } : it);
    persistItems(updated);
  };

  const getMslVisitDates = (drName: string): string => {
    const mslDocs: MslDoctor[] = (memoryStore.mslData && memoryStore.mslData.length > 0) 
      ? memoryStore.mslData 
      : MASTER_123_MSL_DOCTORS;

    const docClean = cleanStr(drName);
    const found = mslDocs.find(d => cleanStr(d.doctorName) === docClean);
    if (!found) return '';

    const dateParts: string[] = [];
    ['apr', 'may', 'jun', 'jul', 'aug', 'sept'].forEach(mKey => {
      const dVal = (found as any)[mKey];
      if (dVal && String(dVal).trim().length > 0) {
        dateParts.push(String(dVal).trim());
      }
    });

    return dateParts.length > 0 ? dateParts[dateParts.length - 1] : '';
  };

  const handleAutoFillFromMsl = () => {
    let filledCount = 0;
    const updated = items.map(it => {
      const mslDate = getMslVisitDates(it.drName);
      if (mslDate) {
        filledCount++;
        return { ...it, activityDone: mslDate };
      }
      return it;
    });

    persistItems(updated);
    setAlertMsg(`⚡ MSL Sync: ${filledCount} Doctors ki Visit Dates MSL se auto-fill ho gayi hain!`);
    setTimeout(() => setAlertMsg(null), 3500);
  };

  const handleRandomizeDates = () => {
    const sampleDates = ['7,17', '12,24', '5,19', '10,22', '14,28', '8,20', '3,15', '9,23', '6,18'];
    const updated = items.map((it, idx) => ({
      ...it,
      activityDone: sampleDates[idx % sampleDates.length]
    }));
    persistItems(updated);
    setAlertMsg('🎲 Random Action: Saare doctors par sample visit dates assign ho gayi hain!');
    setTimeout(() => setAlertMsg(null), 3000);
  };

  const calculateRowTotal = (it: FocusedBrandItem): number => {
    const months = [it.apr, it.may, it.jun, it.jul, it.aug, it.sept, it.oct, it.nov, it.dec, it.jan, it.feb, it.mar];
    return months.reduce((acc, m) => acc + (parseFloat(String(m || '0')) || 0), 0);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`Kya aap Dr. ${name} ko Focused Brands list se hatana chahte hain?`)) {
      persistItems(items.filter(it => it.id !== id));
    }
  };

  const handleSelectMslDoc = (doc: MslDoctor) => {
    setSelectedMslDoc(doc);
    const mslDate = getMslVisitDates(doc.doctorName);
    setNewBrandForm(prev => ({
      ...prev,
      speciality: doc.speciality || 'GP',
      activityDone: mslDate || ''
    }));
  };

  const handleConfirmAddMslDoctor = () => {
    if (!selectedMslDoc) {
      alert("Kripya MSL se Doctor select karein!");
      return;
    }

    const nextSn = items.length > 0 ? Math.max(...items.map(i => i.sn)) + 1 : 1;
    const newItem: FocusedBrandItem = {
      id: 'f_' + Date.now(),
      sn: nextSn,
      drName: selectedMslDoc.doctorName,
      productName: newBrandForm.productName,
      speciality: selectedMslDoc.speciality || newBrandForm.speciality,
      activityDone: newBrandForm.activityDone,
      prescriberType: newBrandForm.prescriberType,
      rxGenerated: newBrandForm.rxGenerated,
      apr: '', may: '', jun: '', jul: '', aug: '', sept: '',
      oct: '', nov: '', dec: '', jan: '', feb: '', mar: ''
    };

    persistItems([...items, newItem]);
    setShowAddMslModal(false);
    setSelectedMslDoc(null);
    setMslSearchQuery('');
    setAlertMsg(`🎉 Dr. ${newItem.drName} (${newItem.productName}) list me add ho gaye!`);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  // 100% UNTOUCHED Export CSV
  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push('HQ,UDAIPUR,,,,,,,,,,,,,,,,,');
    lines.push('S.NO.,DR NAME,PRODUCT NAME,SPECIALITY,ACTIVITY DONE/NOT,,,SECONDARY IN STRIPS,,,,,,,,,,,');
    lines.push(',,,,,PRESCRIBER / NON RXBER,NO. OF PRESCRIPTION GENERATED, APRIL,MAY,JUNE,JULY,AUG,SEP,OCT,NOV,DEC,JAN,FEB,MAR,TOTAL');

    items.forEach(d => {
      const q = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      const row = [
        d.sn,
        q(d.drName),
        q(d.productName),
        q(d.speciality),
        q(d.activityDone),
        q(d.prescriberType),
        q(d.rxGenerated),
        q(d.apr), q(d.may), q(d.jun), q(d.jul), q(d.aug), q(d.sept),
        q(d.oct), q(d.nov), q(d.dec), q(d.jan), q(d.feb), q(d.mar),
        calculateRowTotal(d)
      ];
      lines.push(row.join(','));
    });

    const csvContent = lines.join('\\r\\n');
    const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '12_FOCUSED_BRANDS.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = useMemo(() => {
    return items.filter(it => {
      const q = search.toLowerCase();
      const matchSearch = !q || it.drName.toLowerCase().includes(q) || it.speciality.toLowerCase().includes(q) || it.productName.toLowerCase().includes(q);
      const matchProd = selectedProductFilter === 'ALL' || it.productName === selectedProductFilter;
      return matchSearch && matchProd;
    });
  }, [items, search, selectedProductFilter]);

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
    return !q || d.doctorName.toLowerCase().includes(q) || (d.speciality || '').toLowerCase().includes(q);
  });

  const grandTotalStrips = items.reduce((sum, it) => sum + calculateRowTotal(it), 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><Target size={18} /></span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              12. FOCUSED BRANDS (Doctor-wise Rx &amp; Secondary in Strips)
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                Cloud Sync Ready
              </span>
            </h2>
            <p className="text-xs text-slate-400">HQ: UDAIPUR • Visit Dates Auto-Synced from MSL • Editable Strips &amp; Prescriptions</p>
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Brand:</span>
            <select
              value={selectedProductFilter}
              onChange={e => setSelectedProductFilter(e.target.value)}
              className="bg-transparent font-bold text-indigo-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Brands</option>
              {FOCUSED_PRODUCTS_MASTER.map(b => (
                <option key={b} value={b} className="bg-slate-900 text-white">{b}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddMslModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Plus size={14} /> + Add Doctor
          </button>

          {/* 100% UNTOUCHED Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* ☁️ DEDICATED CLOUD SYNC TOOLBAR */}
      <CloudSyncBar
        storageKey="review/sheet_12_focused_brands"
        sheetTitle="12. Focused Brands"
        getData={() => ({
          items,
          selectedProductFilter
        })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.items && Array.isArray(cloudData.items)) {
            persistItems(cloudData.items);
          }
          if (cloudData.selectedProductFilter) {
            setSelectedProductFilter(cloudData.selectedProductFilter);
          }
        }}
        onSaveLocal={() => {
          persistItems(items);
        }}
      />

      {alertMsg && (
        <div className="p-3 bg-indigo-950/80 border border-indigo-500/60 text-indigo-200 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            <span className="font-semibold">{alertMsg}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="p-1 hover:text-white cursor-pointer"><X size={15} /></button>
        </div>
      )}

      {/* 2 TOP BULK ACTION BUTTONS */}
      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Activity / Visit Date Tools:</span>

          <button
            onClick={handleAutoFillFromMsl}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 rounded-xl font-bold transition cursor-pointer shadow-sm"
            title="Auto-fill visit dates from MSL Schedule"
          >
            <RefreshCw size={13} className="text-yellow-300" /> ⚡ Visit Date Auto-Fill from MSL
          </button>

          <button
            onClick={handleRandomizeDates}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 rounded-xl font-bold transition cursor-pointer"
            title="Assign sample random visit dates"
          >
            <Dices size={13} className="text-amber-400" /> 🎲 Random Dates
          </button>
        </div>

        <div className="text-[11px] text-slate-400">
          Showing <b className="text-indigo-300 font-mono">{filtered.length}</b> Focused Brand Doctors
        </div>
      </div>

      {/* Add Doctor from MSL Modal */}
      {showAddMslModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/60 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/40"><Stethoscope size={20} /></span>
                <div>
                  <h3 className="text-base font-bold text-white">Add Doctor to Focused Brands</h3>
                  <p className="text-xs text-slate-400">Search doctor from MSL &amp; assign focused brand</p>
                </div>
              </div>
              <button onClick={() => setShowAddMslModal(false)} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>1. Select MSL Doctor:</span>
                {selectedMslDoc && <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 size={13} /> Selected: #{selectedMslDoc.srNo} {selectedMslDoc.doctorName}</span>}
              </label>
              
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Type doctor name..."
                  value={mslSearchQuery}
                  onChange={e => setMslSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-xl pl-9 pr-3 py-2 focus:border-indigo-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="overflow-y-auto max-h-[140px] border border-slate-800 rounded-2xl p-1.5 space-y-1 bg-slate-950/80">
                {filteredMslDocs.map(doc => {
                  const isSelected = selectedMslDoc?.srNo === doc.srNo;
                  return (
                    <div
                      key={doc.srNo}
                      onClick={() => handleSelectMslDoc(doc)}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition ${
                        isSelected ? 'bg-indigo-950 border border-indigo-500 text-white font-bold' : 'bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 text-slate-200'
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
              <div className="text-xs font-bold text-indigo-400">2. Focused Brand Details:</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Focused Brand</label>
                  <select value={newBrandForm.productName} onChange={e => setNewBrandForm({ ...newBrandForm, productName: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-bold rounded-xl px-3 py-1.5">
                    {FOCUSED_PRODUCTS_MASTER.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-amber-400 font-semibold mb-1">Visit Date / Activity</label>
                  <input type="text" placeholder="e.g. 7,17" value={newBrandForm.activityDone} onChange={e => setNewBrandForm({ ...newBrandForm, activityDone: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-bold rounded-xl px-3 py-1.5" />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowAddMslModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl">Cancel</button>
              <button type="button" onClick={handleConfirmAddMslDoctor} disabled={!selectedMslDoc} className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer">
                <Check size={15} /> Add to Focused Brands
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Tier Table */}
      <div className="overflow-x-auto max-h-[640px] border border-slate-800 rounded-2xl relative shadow-2xl">
        <table className="w-full text-left text-xs border-separate border-spacing-0">
          <thead className="sticky top-0 z-40 bg-slate-950">
            <tr>
              <th rowSpan={2} className="p-2 text-center bg-slate-950 border-b border-r border-slate-800 sticky left-0 z-50 text-slate-400 font-bold uppercase w-10">S.N.</th>
              <th rowSpan={2} className="p-2 bg-slate-950 border-b border-r border-slate-800 sticky left-10 z-50 text-slate-400 font-bold uppercase min-w-[170px]">DR NAME</th>
              <th rowSpan={2} className="p-2 bg-slate-950 border-b border-r border-slate-800 text-cyan-400 font-bold uppercase min-w-[130px]">PRODUCT NAME</th>
              <th rowSpan={2} className="p-2 bg-slate-950 border-b border-r border-slate-800 text-slate-400 font-bold uppercase min-w-[110px]">SPECIALITY</th>
              
              <th rowSpan={2} className="p-2 text-center bg-slate-950 border-b border-r border-slate-800 text-amber-400 font-bold uppercase min-w-[130px]">
                ACTIVITY DONE/NOT (VISIT DATE)
              </th>

              <th rowSpan={2} className="p-2 text-center bg-slate-950 border-b border-r border-slate-800 text-blue-300 font-bold uppercase min-w-[130px]">
                PRESCRIBER / NON RXBER
              </th>

              <th rowSpan={2} className="p-2 text-center bg-slate-950 border-b border-r border-slate-800 text-purple-300 font-bold uppercase w-20">
                NO. OF Rx
              </th>

              <th colSpan={12} className="p-2 text-center bg-indigo-950/70 border-b border-r border-slate-800 text-indigo-200 font-black uppercase">
                SECONDARY IN STRIPS (2026-2027)
              </th>

              <th rowSpan={2} className="p-2 text-right bg-emerald-950/80 border-b border-slate-800 text-emerald-300 font-black uppercase min-w-[90px]">TOTAL</th>
              <th rowSpan={2} className="p-2 text-center bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase w-12">Action</th>
            </tr>

            <tr>
              {MONTH_KEYS.map(m => (
                <th key={m.key} className="p-1 text-center bg-slate-950 text-[10px] text-indigo-300 border-b border-r border-slate-800 font-bold w-16 min-w-[55px]">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-slate-900 divide-y divide-slate-800/60">
            {filtered.map(item => {
              const rowTotal = calculateRowTotal(item);

              return (
                <tr key={item.id} className="hover:bg-slate-800/60 transition group">
                  <td className="p-1 text-center font-mono text-slate-400 border-b border-r border-slate-800/80 sticky left-0 bg-slate-900 group-hover:bg-slate-800 z-20">
                    {item.sn}
                  </td>

                  <td className="p-1 border-b border-r border-slate-800/80 sticky left-10 bg-slate-900 group-hover:bg-slate-800 z-20">
                    <input
                      type="text"
                      value={item.drName}
                      onChange={e => handleFieldChange(item.id, 'drName', e.target.value)}
                      className="w-full py-1 px-1.5 bg-slate-950 rounded-md font-bold text-white text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </td>

                  <td className="p-1 border-b border-r border-slate-800/80">
                    <select
                      value={item.productName}
                      onChange={e => handleFieldChange(item.id, 'productName', e.target.value)}
                      className="w-full py-1 px-1.5 bg-slate-950 rounded-md font-bold text-cyan-300 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none cursor-pointer"
                    >
                      {FOCUSED_PRODUCTS_MASTER.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>

                  <td className="p-1 border-b border-r border-slate-800/80">
                    <input
                      type="text"
                      value={item.speciality}
                      onChange={e => handleFieldChange(item.id, 'speciality', e.target.value)}
                      className="w-full py-1 px-1.5 bg-slate-950 rounded-md text-slate-300 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </td>

                  <td className="p-1 border-b border-r border-slate-800/80 text-center">
                    <input
                      type="text"
                      value={item.activityDone || ''}
                      onChange={e => handleFieldChange(item.id, 'activityDone', e.target.value)}
                      placeholder="-"
                      className="w-full py-1 px-1.5 bg-slate-950 rounded-md font-mono font-bold text-center text-[10px] text-amber-300 border border-slate-800 focus:border-amber-400 focus:outline-none"
                    />
                  </td>

                  <td className="p-1 border-b border-r border-slate-800/80 text-center">
                    <select
                      value={item.prescriberType || '-'}
                      onChange={e => handleFieldChange(item.id, 'prescriberType', e.target.value as any)}
                      className="w-full py-1 px-1 bg-slate-950 rounded-md font-bold text-[10px] text-blue-300 border border-slate-800 focus:outline-none cursor-pointer text-center"
                    >
                      <option value="PRESCRIBER" className="bg-slate-900 text-blue-300">PRESCRIBER</option>
                      <option value="NON RXBER" className="bg-slate-900 text-slate-400">NON RXBER</option>
                      <option value="-" className="bg-slate-900 text-slate-500">-</option>
                    </select>
                  </td>

                  <td className="p-1 border-b border-r border-slate-800/80 text-center">
                    <input
                      type="text"
                      value={item.rxGenerated || ''}
                      onChange={e => handleFieldChange(item.id, 'rxGenerated', e.target.value)}
                      placeholder="-"
                      className="w-full py-1 px-1 bg-slate-950 rounded-md font-mono font-bold text-purple-300 text-xs border border-slate-800 focus:border-indigo-500 focus:outline-none text-center"
                    />
                  </td>

                  {MONTH_KEYS.map(m => (
                    <td key={m.key} className="p-1 border-b border-r border-slate-800/60 text-center">
                      <input
                        type="text"
                        value={(item as any)[m.key] || ''}
                        onChange={e => handleFieldChange(item.id, m.key as any, e.target.value)}
                        placeholder="-"
                        className="w-full py-1 px-0.5 bg-slate-950 rounded-md font-mono font-bold text-center text-xs text-slate-100 border border-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                  ))}

                  <td className="p-2 text-right font-mono font-black text-emerald-400 bg-emerald-950/20 border-b border-r border-slate-800">
                    {rowTotal > 0 ? rowTotal.toLocaleString() : '-'}
                  </td>

                  <td className="p-1 text-center border-b border-slate-800">
                    <button
                      onClick={() => handleDeleteItem(item.id, item.drName)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                      title="Delete Row"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-indigo-500/40 font-bold z-30 shadow-2xl text-xs">
            <tr>
              <td colSpan={7} className="p-3 text-white font-extrabold uppercase border-r border-slate-800">
                GRAND TOTAL (SECONDARY STRIPS)
              </td>
              {MONTH_KEYS.map(m => {
                const monthSum = items.reduce((acc, it) => acc + (parseFloat(String((it as any)[m.key] || '0')) || 0), 0);
                return (
                  <td key={`foot_${m.key}`} className="p-2 text-center font-mono font-bold text-indigo-300 bg-indigo-950/40 border-r border-slate-800">
                    {monthSum > 0 ? monthSum.toLocaleString() : '-'}
                  </td>
                );
              })}
              <td className="p-3 text-right font-mono font-black text-sm text-emerald-300 bg-emerald-950 border-r border-slate-800">
                {grandTotalStrips.toLocaleString()}
              </td>
              <td className="p-2 text-center text-slate-500">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
