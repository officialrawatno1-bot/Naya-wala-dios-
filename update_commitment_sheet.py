import os, subprocess

file_path = 'src/components/review/CommitmentSheet.tsx'

component_code = '''import React, { useState, useMemo, useRef } from 'react';
import { 
  CheckCircle2, Download, Check, RefreshCw, Plus, Trash2, 
  Search, Stethoscope, Gift, DollarSign, X, Edit3, Sparkles
} from 'lucide-react';
import { memoryStore, MslDoctor } from '../../data/memoryStore';
import { MASTER_123_MSL_DOCTORS } from './MslSheet';
import { CloudSyncBar } from '../CloudSyncBar';

const MONTH_CODES = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];
const MONTH_FULL = ['Apr-2026', 'May-2026', 'Jun-2026', 'Jul-2026', 'Aug-2026', 'Sep-2026', 'Oct-2026', 'Nov-2026', 'Dec-2026', 'Jan-2027', 'Feb-2027', 'Mar-2027'];

const MONTHS_DATA = [
  { code: 'APR', label: 'APRIL' },
  { code: 'MAY', label: 'MAY' },
  { code: 'JUN', label: 'JUNE' },
  { code: 'JUL', label: 'JULY' },
  { code: 'AUG', label: 'AUGUST' },
  { code: 'SEP', label: 'SEPTEMBER' },
  { code: 'OCT', label: 'OCTOBER' },
  { code: 'NOV', label: 'NOVEMBER' },
  { code: 'DEC', label: 'DECEMBER' },
  { code: 'JAN', label: 'JANUARY' },
  { code: 'FEB', label: 'FEBRUARY' },
  { code: 'MAR', label: 'MARCH' }
];

const SUPPORT_TYPE_PRESETS = [
  'GIFT CARDS',
  'CASH',
  'SPECIAL PLAN',
  'CONFERENCE',
  'DINNER',
  'IPHONE',
  'HOTEL',
  'CHEQUE',
  'TREADMILL',
  'BOOK'
];

interface SupportRow {
  sn: number;
  hq: string;
  drName: string;
  typeOfSupport: string;
  amount: string;
  expectedRoi: string;
}

const DEFAULT_INITIAL_DOCTORS: SupportRow[] = [
  { sn: 1, hq: 'UDAIPUR', drName: 'JIMESH PANDYA', typeOfSupport: 'GIFT CARDS', amount: '30000', expectedRoi: '15000' },
  { sn: 2, hq: 'UDAIPUR', drName: 'VIJAY GOYAL', typeOfSupport: 'GIFT CARDS', amount: '10000', expectedRoi: '10000' },
  { sn: 3, hq: 'UDAIPUR', drName: 'JAYESH GANDHI', typeOfSupport: 'SPECIAL PLAN', amount: '50000', expectedRoi: '50000' },
  { sn: 4, hq: 'UDAIPUR', drName: 'AK VATS', typeOfSupport: 'GIFT CARDS', amount: '30000', expectedRoi: '15000' },
  { sn: 5, hq: 'UDAIPUR', drName: 'SANDEEP BHATNAGAR', typeOfSupport: 'GIFT CARDS', amount: '30000', expectedRoi: '150000' },
  { sn: 6, drName: 'RK MALOT', hq: 'UDAIPUR', typeOfSupport: 'GIFT CARDS', amount: '40000', expectedRoi: '20000' },
  { sn: 7, drName: 'BS BOMB', hq: 'UDAIPUR', typeOfSupport: 'GIFT CARDS', amount: '30000', expectedRoi: '30000' },
  { sn: 8, drName: 'RAHUL PANCHAL', hq: 'UDAIPUR', typeOfSupport: 'GIFT CARDS', amount: '30000', expectedRoi: '15000' },
  { sn: 9, drName: 'KC JAIN', hq: 'UDAIPUR', typeOfSupport: 'SPECIAL PLAN', amount: '20000', expectedRoi: '20000' },
  { sn: 10, drName: 'DP SINGH', hq: 'UDAIPUR', typeOfSupport: 'GIFT CARDS', amount: '30000', expectedRoi: '15000' },
  { sn: 11, drName: 'JC DEVPURA', hq: 'UDAIPUR', typeOfSupport: 'GIFT CARDS', amount: '10000', expectedRoi: '10000' },
  { sn: 12, drName: 'BALDEV MEENA', hq: 'UDAIPUR', typeOfSupport: 'TREADMILL', amount: '85000', expectedRoi: '40000' },
  { sn: 13, drName: 'KRIPA SHANKAR', hq: 'UDAIPUR', typeOfSupport: 'GIFT CARDS', amount: '20000', expectedRoi: '10000' }
];

export const CommitmentSheet: React.FC = () => {
  const [selectedPrevIdx, setSelectedPrevIdx] = useState<number>(() => {
    try {
      const draft = localStorage.getItem('dios_draft_sheet_06_commitment');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.selectedPrevIdx !== undefined) return parsed.selectedPrevIdx;
      }
    } catch (e) {}
    return 3;
  });

  const [commitmentData, setCommitmentData] = useState(() => {
    try {
      const draft = localStorage.getItem('dios_draft_sheet_06_commitment');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.commitmentData) return parsed.commitmentData;
      }
    } catch (e) {}
    return memoryStore.commitmentTopData || {
      prevBudget: '4.83',
      prevAch: '4.84',
      currSec: '4.85',
      currInventory: '7.01',
      currBudget: '4.83',
      commitmentVal: '5.50'
    };
  });

  const [monthlyCA, setMonthlyCA] = useState<Record<string, { commitment: string; achievement: string }>>(() => {
    try {
      const draft = localStorage.getItem('dios_draft_sheet_06_commitment');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.monthlyCA) return parsed.monthlyCA;
      }
    } catch (e) {}
    if (memoryStore.commitmentMonthlyCA) {
      return memoryStore.commitmentMonthlyCA;
    }
    const initial: Record<string, { commitment: string; achievement: string }> = {};
    MONTHS_DATA.forEach(m => {
      initial[m.code] = { commitment: '', achievement: '' };
    });
    return initial;
  });

  const [doctorsRows, setDoctorsRows] = useState<SupportRow[]>(() => {
    try {
      const draft = localStorage.getItem('dios_draft_sheet_06_commitment');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.doctorsRows && Array.isArray(parsed.doctorsRows) && parsed.doctorsRows.length > 0) return parsed.doctorsRows;
      }
    } catch (e) {}
    return (memoryStore.commitmentDoctors && memoryStore.commitmentDoctors.length > 0) 
      ? memoryStore.commitmentDoctors 
      : DEFAULT_INITIAL_DOCTORS;
  });

  // Doctor Auto-Complete State
  const [activeSearchSn, setActiveSearchSn] = useState<number | null>(null);
  const [docSearchQuery, setDocSearchQuery] = useState('');

  const allMslDoctors: MslDoctor[] = useMemo(() => {
    if (memoryStore.mslData && memoryStore.mslData.length > 0) return memoryStore.mslData;
    try {
      const saved = localStorage.getItem('dios_msl_schedule_permanent_v5');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return MASTER_123_MSL_DOCTORS || [];
  }, []);

  const filteredMslDocs = useMemo(() => {
    if (!docSearchQuery.trim()) return allMslDoctors.slice(0, 15);
    const q = docSearchQuery.toLowerCase();
    return allMslDoctors.filter(d => 
      d.doctorName.toLowerCase().includes(q) || 
      (d.speciality || '').toLowerCase().includes(q) ||
      String(d.srNo).includes(q)
    ).slice(0, 10);
  }, [allMslDoctors, docSearchQuery]);

  const handleSelectDoctorForSupport = (sn: number, doc: MslDoctor) => {
    handleDoctorFieldChange(sn, 'drName', doc.doctorName);
    if (doc.activityType && !doctorsRows.find(d => d.sn === sn)?.typeOfSupport) {
      handleDoctorFieldChange(sn, 'typeOfSupport', doc.activityType);
    }
    setActiveSearchSn(null);
    setDocSearchQuery('');
  };

  const handleAutoFillFromPerformance = () => {
    const sp = memoryStore.salesPerformanceData;
    if (!sp) {
      alert('Pehle "3. Sales Performance" section me data save karein!');
      return;
    }

    const prevCode = MONTH_CODES[selectedPrevIdx];
    const currCode = MONTH_CODES[(selectedPrevIdx + 1) % 12];

    const prevBud = sp.budget?.[prevCode] || '4.83';
    const prevAc = sp.primary_curr?.[prevCode] || '4.84';
    const sec = sp.sec_curr?.[currCode] || '4.85';
    const inv = sp.closing_stock?.[currCode] || '7.01';
    const curBud = sp.budget?.[currCode] || '4.83';
    
    const comm = (parseFloat(curBud) * 1.2).toFixed(2);

    const newTop = {
      prevBudget: prevBud,
      prevAch: prevAc,
      currSec: sec,
      currInventory: inv,
      currBudget: curBud,
      commitmentVal: comm
    };

    setCommitmentData(newTop);
    memoryStore.commitmentTopData = newTop;

    const updated: Record<string, { commitment: string; achievement: string }> = {};
    MONTHS_DATA.forEach(m => {
      const budgetVal = sp.budget?.[m.code] || '';
      const primaryVal = sp.primary_curr?.[m.code] || '';
      updated[m.code] = {
        commitment: budgetVal,
        achievement: primaryVal
      };
    });

    setMonthlyCA(updated);
    memoryStore.commitmentMonthlyCA = updated;
  };

  const handleCAMonthChange = (code: string, field: 'commitment' | 'achievement', val: string) => {
    setMonthlyCA(prev => {
      const updated = {
        ...prev,
        [code]: {
          ...prev[code],
          [field]: val
        }
      };
      memoryStore.commitmentMonthlyCA = updated;
      return updated;
    });
  };

  const handleTopFieldChange = (field: string, val: string) => {
    setCommitmentData(prev => {
      const updated = { ...prev, [field]: val };
      memoryStore.commitmentTopData = updated;
      return updated;
    });
  };

  const handleDoctorFieldChange = (sn: number, field: keyof SupportRow, val: string) => {
    setDoctorsRows(prev => {
      const updated = prev.map(d => d.sn === sn ? { ...d, [field]: val } : d);
      memoryStore.commitmentDoctors = updated;
      return updated;
    });
  };

  const handleAddDoctor = () => {
    setDoctorsRows(prev => {
      const newSn = prev.length > 0 ? Math.max(...prev.map(p => p.sn)) + 1 : 1;
      const updated = [
        ...prev,
        { sn: newSn, hq: 'UDAIPUR', drName: '', typeOfSupport: 'GIFT CARDS', amount: '30000', expectedRoi: '15000' }
      ];
      memoryStore.commitmentDoctors = updated;
      return updated;
    });
  };

  const handleDeleteDoctor = (sn: number) => {
    setDoctorsRows(prev => {
      const updated = prev.filter(d => d.sn !== sn);
      memoryStore.commitmentDoctors = updated;
      return updated;
    });
  };

  const handleExportCSV = () => {
    let csv = `COMMITMENT OF MONTH\\n`;
    csv += `H.Q. NAME,PREVIOUS MONTH BUDGET,PREVIOUS MONTH ACH.,CURRENT SECONDARY,CURRENT INVENTORY,CURRENT MONTH BUDGET,COMMITMENT\\n`;
    csv += `UDAIPUR,${commitmentData.prevBudget},${commitmentData.prevAch},${commitmentData.currSec},${commitmentData.currInventory},${commitmentData.currBudget},${commitmentData.commitmentVal}\\n\\n`;
    
    csv += `12-MONTH COMMITMENT & ACHIEVEMENT\\n`;
    csv += `MONTH,COMMITMENT,ACHIEVEMENT\\n`;
    MONTHS_DATA.forEach(m => {
      const item = monthlyCA[m.code] || { commitment: '', achievement: '' };
      csv += `${m.label},${item.commitment},${item.achievement}\\n`;
    });

    csv += `\\nSUPPORT REQUIREMENT\\n`;
    csv += `S.N.,H.Q.NAME,DR.NAME,TYPE OF SUPPORT,AMOUNT,EXPECTED ROI\\n`;
    doctorsRows.forEach(d => {
      csv += `${d.sn},${d.hq},"${d.drName}","${d.typeOfSupport}",${d.amount},${d.expectedRoi}\\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '6_COMMITMENT.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const prevMonthLabel = MONTH_FULL[selectedPrevIdx];
  const currMonthLabel = MONTH_FULL[(selectedPrevIdx + 1) % 12];

  const totalSupportAmount = doctorsRows.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  const totalExpectedRoi = doctorsRows.reduce((sum, d) => sum + (parseFloat(d.expectedRoi) || 0), 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      
      {/* GLOBAL ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><CheckCircle2 size={18} /></span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              6. COMMITMENT MASTER HUB
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <Sparkles size={10} /> Searchable MSL Doctors &amp; Support Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">Manage monthly commitments, 12M C/A grid, and doctor support with instant autocomplete</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-950 px-3 py-1.5 rounded-xl border border-cyan-500/40">
            <span className="text-xs text-slate-400 mr-2 font-medium">Prev Month:</span>
            <select
              value={selectedPrevIdx}
              onChange={e => setSelectedPrevIdx(parseInt(e.target.value))}
              className="bg-transparent text-xs font-bold text-cyan-400 focus:outline-none cursor-pointer"
            >
              {MONTH_FULL.map((mFull, idx) => (
                <option key={mFull} value={idx} className="bg-slate-900 text-white">{mFull}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAutoFillFromPerformance}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
          >
            <RefreshCw size={14} className="text-yellow-300" /> Auto-Sync from Performance
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <CloudSyncBar
        storageKey="review/sheet_06_commitment"
        sheetTitle="6. Commitment Master Hub"
        getData={() => ({
          commitmentData,
          monthlyCA,
          doctorsRows,
          selectedPrevIdx
        })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.commitmentData) {
            setCommitmentData(cloudData.commitmentData);
            memoryStore.commitmentTopData = cloudData.commitmentData;
          }
          if (cloudData.monthlyCA) {
            setMonthlyCA(cloudData.monthlyCA);
            memoryStore.commitmentMonthlyCA = cloudData.monthlyCA;
          }
          if (cloudData.doctorsRows && Array.isArray(cloudData.doctorsRows)) {
            setDoctorsRows(cloudData.doctorsRows);
            memoryStore.commitmentDoctors = cloudData.doctorsRows;
          }
          if (cloudData.selectedPrevIdx !== undefined) {
            setSelectedPrevIdx(cloudData.selectedPrevIdx);
          }
        }}
        onSaveLocal={() => {
          memoryStore.commitmentTopData = commitmentData;
          memoryStore.commitmentMonthlyCA = monthlyCA;
          memoryStore.commitmentDoctors = doctorsRows;
          try {
            localStorage.setItem('dios_draft_sheet_06_commitment', JSON.stringify({
              commitmentData,
              monthlyCA,
              doctorsRows,
              selectedPrevIdx
            }));
          } catch (e) {}
        }}
      />

      {/* SECTION 1: COMMITMENT OF MONTH (TOP SUMMARY BOX) */}
      <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-lg">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Commitment of Month (HQ Summary)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 font-bold uppercase border-b border-slate-800">
                <th className="p-2.5">H.Q. NAME</th>
                <th className="p-2.5 text-center">Prev Month Budget ({prevMonthLabel})</th>
                <th className="p-2.5 text-center">Prev Month Ach. (Primary)</th>
                <th className="p-2.5 text-center">Current Secondary ({currMonthLabel})</th>
                <th className="p-2.5 text-center">Current Inventory (Closing)</th>
                <th className="p-2.5 text-center">Current Month Budget</th>
                <th className="p-2.5 text-center text-emerald-400">Commitment (120%)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800 hover:bg-slate-900/40">
                <td className="p-2.5 font-bold text-white">UDAIPUR</td>
                <td className="p-1 text-center">
                  <input
                    type="text"
                    value={commitmentData.prevBudget}
                    onChange={e => handleTopFieldChange('prevBudget', e.target.value)}
                    className="w-20 bg-slate-900 border border-slate-700 text-center font-mono text-xs text-white rounded-lg py-1 focus:border-cyan-500 focus:outline-none"
                  />
                </td>
                <td className="p-1 text-center">
                  <input
                    type="text"
                    value={commitmentData.prevAch}
                    onChange={e => handleTopFieldChange('prevAch', e.target.value)}
                    className="w-20 bg-slate-900 border border-slate-700 text-center font-mono text-xs text-cyan-400 rounded-lg py-1 focus:border-cyan-500 focus:outline-none font-bold"
                  />
                </td>
                <td className="p-1 text-center">
                  <input
                    type="text"
                    value={commitmentData.currSec}
                    onChange={e => handleTopFieldChange('currSec', e.target.value)}
                    className="w-20 bg-slate-900 border border-slate-700 text-center font-mono text-xs text-white rounded-lg py-1 focus:border-cyan-500 focus:outline-none"
                  />
                </td>
                <td className="p-1 text-center">
                  <input
                    type="text"
                    value={commitmentData.currInventory}
                    onChange={e => handleTopFieldChange('currInventory', e.target.value)}
                    className="w-20 bg-slate-900 border border-slate-700 text-center font-mono text-xs text-white rounded-lg py-1 focus:border-cyan-500 focus:outline-none"
                  />
                </td>
                <td className="p-1 text-center">
                  <input
                    type="text"
                    value={commitmentData.currBudget}
                    onChange={e => handleTopFieldChange('currBudget', e.target.value)}
                    className="w-20 bg-slate-900 border border-slate-700 text-center font-mono text-xs text-white rounded-lg py-1 focus:border-cyan-500 focus:outline-none"
                  />
                </td>
                <td className="p-1 text-center">
                  <input
                    type="text"
                    value={commitmentData.commitmentVal}
                    onChange={e => handleTopFieldChange('commitmentVal', e.target.value)}
                    className="w-24 bg-slate-900 border border-emerald-500/60 text-center font-mono font-bold text-xs text-emerald-400 rounded-lg py-1 focus:outline-none shadow-sm shadow-emerald-950"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: 12-MONTH COMMITMENT & ACHIEVEMENT GRID */}
      <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-lg">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">12-Month Commitment &amp; Achievement Grid</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MONTHS_DATA.map(m => {
            const dataItem = monthlyCA[m.code] || { commitment: '', achievement: '' };
            return (
              <div key={m.code} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow flex flex-col justify-between">
                <div className="bg-slate-950 border-b border-slate-800 py-2 px-3 text-center">
                  <span className="text-xs font-black tracking-wider text-amber-300">{m.label}</span>
                </div>

                <div className="grid grid-cols-2 text-center divide-x divide-slate-800 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase bg-slate-950/60">
                  <div className="py-1 px-1">Commitment</div>
                  <div className="py-1 px-1">Achievement</div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-800 p-2 gap-2 bg-slate-900/60">
                  <div>
                    <input
                      type="text"
                      value={dataItem.commitment}
                      onChange={e => handleCAMonthChange(m.code, 'commitment', e.target.value)}
                      placeholder="-"
                      className="w-full py-1.5 px-1 bg-slate-950 rounded-lg text-center font-mono font-bold text-cyan-400 text-xs border border-slate-800 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={dataItem.achievement}
                      onChange={e => handleCAMonthChange(m.code, 'achievement', e.target.value)}
                      placeholder="-"
                      className="w-full py-1.5 px-1 bg-slate-950 rounded-lg text-center font-mono font-bold text-emerald-400 text-xs border border-slate-800 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🌟 SECTION 3: SEARCHABLE SUPPORT REQUIREMENT TABLE WITH PRESETS + MANUAL INPUT */}
      <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope size={14} className="text-purple-400" /> Support Requirement (Doctor-wise Investment Analysis)
            </h3>
            <p className="text-xs text-slate-400">Select doctor from MSL or type &bull; Presets (Gift Cards, Cash, Special Plan, Book) + Manual edit</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-slate-300">
              Total Support: <b className="text-amber-400">₹{totalSupportAmount.toLocaleString()}</b> &bull; Expected ROI: <b className="text-emerald-400">₹{totalExpectedRoi.toLocaleString()}</b>
            </div>

            <button
              onClick={handleAddDoctor}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
            >
              <Plus size={14} /> Add Support Row
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px] border border-slate-800 rounded-xl relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-20">
              <tr>
                <th className="p-2.5 text-center w-12">S.N.</th>
                <th className="p-2.5 min-w-[240px]">Doctor Name (Search MSL)</th>
                <th className="p-2.5 min-w-[220px] text-amber-400">Type of Support (Preset / Manual)</th>
                <th className="p-2.5 text-right w-36">Amount (₹)</th>
                <th className="p-2.5 text-right w-36 text-emerald-400">Expected ROI (₹)</th>
                <th className="p-2.5 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {doctorsRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    No support rows added yet. Click <b>"Add Support Row"</b> above to add doctor support.
                  </td>
                </tr>
              ) : (
                doctorsRows.map(doc => (
                  <tr key={doc.sn} className="hover:bg-slate-800/40 transition group">
                    <td className="p-2 text-center text-slate-500 font-mono">{doc.sn}</td>
                    
                    {/* 🌟 DOCTOR NAME SEARCHABLE INPUT */}
                    <td className="p-1.5 font-sans relative">
                      <div className="relative">
                        <input
                          type="text"
                          value={doc.drName}
                          onChange={e => {
                            handleDoctorFieldChange(doc.sn, 'drName', e.target.value);
                            setDocSearchQuery(e.target.value);
                            setActiveSearchSn(doc.sn);
                          }}
                          onFocus={() => {
                            setActiveSearchSn(doc.sn);
                            setDocSearchQuery(doc.drName);
                          }}
                          placeholder="Search or type Doctor Name..."
                          className="w-full py-1.5 pl-2 pr-7 bg-slate-900 rounded-xl font-bold text-white border border-slate-700 focus:border-purple-500 focus:outline-none text-xs"
                        />
                        <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>

                      {/* Doctor Search Auto-Complete Dropdown */}
                      {activeSearchSn === doc.sn && docSearchQuery.trim().length > 0 && (
                        <div className="absolute top-full left-1.5 right-1.5 mt-1 bg-slate-900 border-2 border-purple-500/80 rounded-2xl shadow-2xl p-1.5 z-50 max-h-48 overflow-y-auto space-y-1">
                          <div className="flex items-center justify-between px-2 py-1 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-800">
                            <span>Select MSL Doctor:</span>
                            <button onClick={() => setActiveSearchSn(null)} className="text-slate-400 hover:text-white p-0.5"><X size={12} /></button>
                          </div>
                          {filteredMslDocs.map(mslDoc => (
                            <div
                              key={mslDoc.srNo}
                              onClick={() => handleSelectDoctorForSupport(doc.sn, mslDoc)}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-950 hover:bg-purple-950/70 border border-transparent hover:border-purple-500/40 text-xs cursor-pointer transition"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-mono text-slate-500 text-[10px]">#{mslDoc.srNo}</span>
                                <span className="font-bold text-white truncate">Dr. {mslDoc.doctorName}</span>
                                {mslDoc.speciality && (
                                  <span className="text-[10px] text-cyan-300 font-mono">({mslDoc.speciality})</span>
                                )}
                              </div>
                              <span className="text-[10px] text-purple-400 font-bold">Pick ➔</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* 🌟 TYPE OF SUPPORT: PRESETS + MANUAL INPUT */}
                    <td className="p-1.5 font-sans">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={SUPPORT_TYPE_PRESETS.includes(doc.typeOfSupport) ? doc.typeOfSupport : 'CUSTOM'}
                          onChange={e => {
                            if (e.target.value !== 'CUSTOM') {
                              handleDoctorFieldChange(doc.sn, 'typeOfSupport', e.target.value);
                            }
                          }}
                          className="bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs rounded-xl px-2 py-1.5 focus:border-amber-400 focus:outline-none cursor-pointer shrink-0"
                        >
                          {SUPPORT_TYPE_PRESETS.map(preset => (
                            <option key={preset} value={preset} className="bg-slate-900 text-white">
                              {preset}
                            </option>
                          ))}
                          <option value="CUSTOM" className="bg-slate-900 text-slate-400">&bull; Manual / Custom &bull;</option>
                        </select>

                        {/* Free manual input text */}
                        <input
                          type="text"
                          value={doc.typeOfSupport}
                          onChange={e => handleDoctorFieldChange(doc.sn, 'typeOfSupport', e.target.value)}
                          placeholder="or type custom note..."
                          className="flex-1 py-1.5 px-2 bg-slate-900 rounded-xl text-slate-200 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs font-semibold"
                        />
                      </div>
                    </td>

                    <td className="p-1.5">
                      <input
                        type="text"
                        value={doc.amount}
                        onChange={e => handleDoctorFieldChange(doc.sn, 'amount', e.target.value)}
                        placeholder="0"
                        className="w-full py-1.5 px-2 bg-slate-900 rounded-xl font-mono text-right text-slate-200 border border-slate-700 focus:border-cyan-500 focus:outline-none text-xs font-bold"
                      />
                    </td>

                    <td className="p-1.5">
                      <input
                        type="text"
                        value={doc.expectedRoi}
                        onChange={e => handleDoctorFieldChange(doc.sn, 'expectedRoi', e.target.value)}
                        placeholder="0"
                        className="w-full py-1.5 px-2 bg-slate-900 rounded-xl font-mono font-bold text-right text-emerald-400 border border-slate-700 focus:border-emerald-500 focus:outline-none text-xs"
                      />
                    </td>

                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteDoctor(doc.sn)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title="Delete Support Row"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
''';

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(component_code)
print("✅ CommitmentSheet.tsx cleanly updated with Searchable MSL Doctors & Book/Manual presets.")

# Compile & Deploy
print("\n📦 Compiling Production Bundle (npm run build)...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build 100% Successful!")

print("\n☁️ Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Sheet 6 Support Requirement with 123 Doctor Search & Book preset is Live on Cloudflare!")
