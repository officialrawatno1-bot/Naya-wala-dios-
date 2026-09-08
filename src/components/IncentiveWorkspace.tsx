import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, Calendar, DollarSign, Download, RefreshCw, Zap, 
  CheckCircle2, AlertTriangle, Layers, Search, Check, 
  Sparkles, Filter, ArrowLeft, ChevronRight, Database,
  Activity, Radio, ShieldCheck, Server
} from 'lucide-react';
import { 
  QUARTERS_CONFIG, 
  INITIAL_INCENTIVE_Q1, 
  buildEmptyQuarterRows, 
  EmployeeIncentiveRow 
} from '../data/seedIncentive';
import { memoryStore } from '../data/memoryStore';

interface Props {
  onBack?: () => void;
}

interface DataSourceTracker {
  salesSource: 'LIVE_MEMORY' | 'LOCAL_DRAFT' | 'CLOUDFLARE_KV' | 'DEFAULT';
  effortSource: 'LIVE_MEMORY' | 'LOCAL_DRAFT' | 'CLOUDFLARE_KV' | 'DEFAULT';
  lastSyncTime: string;
  activeMonths: string;
}

export const IncentiveWorkspace: React.FC<Props> = ({ onBack }) => {
  const [selectedQtr, setSelectedQtr] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q2');
  const [focusMode, setFocusMode] = useState<'MY_HQ' | 'ALL_TEAM'>('ALL_TEAM');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [sourceTracker, setSourceTracker] = useState<DataSourceTracker>({
    salesSource: 'LOCAL_DRAFT',
    effortSource: 'LOCAL_DRAFT',
    lastSyncTime: 'Live Session',
    activeMonths: 'JUL, AUG, SEP (Check: OCT)'
  });

  const [quarterData, setQuarterData] = useState<Record<string, EmployeeIncentiveRow[]>>(() => {
    const initial: Record<string, EmployeeIncentiveRow[]> = {
      Q1: INITIAL_INCENTIVE_Q1,
      Q2: buildEmptyQuarterRows('Q2'),
      Q3: buildEmptyQuarterRows('Q3'),
      Q4: buildEmptyQuarterRows('Q4')
    };

    ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
      try {
        const raw = localStorage.getItem(`dios_incentive_qtr_${q}_2026`);
        if (raw) initial[q] = JSON.parse(raw);
      } catch (e) {}
    });

    return initial;
  });

  const currentRows = quarterData[selectedQtr] || [];
  const qtrCfg = QUARTERS_CONFIG[selectedQtr];

  const persistRows = (updatedRows: EmployeeIncentiveRow[]) => {
    const copy = { ...quarterData, [selectedQtr]: updatedRows };
    setQuarterData(copy);

    try {
      localStorage.setItem(`dios_incentive_qtr_${selectedQtr}_2026`, JSON.stringify(updatedRows));
    } catch (e) {}

    fetch('/api/cloud-storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: `incentive/qtr_${selectedQtr}_2026`,
        data: updatedRows,
        device: 'iPad Safari'
      })
    }).catch(() => {});
  };

  // 🌟 SOURCE-TRACKING AUTO-SYNC LOGIC
  const syncBanwariData = (qCode: 'Q1' | 'Q2' | 'Q3' | 'Q4', rowsToUpdate: EmployeeIncentiveRow[]) => {
    let spData: any = null;
    let efData: any = null;
    let detectedSalesSource: DataSourceTracker['salesSource'] = 'DEFAULT';
    let detectedEffortSource: DataSourceTracker['effortSource'] = 'DEFAULT';

    // 1. Check Sheet 3 (Sales Performance)
    if (memoryStore.salesPerformanceData && Object.keys(memoryStore.salesPerformanceData).length > 0) {
      spData = memoryStore.salesPerformanceData;
      detectedSalesSource = 'LIVE_MEMORY';
    } else {
      try {
        const saved = localStorage.getItem('dios_draft_sheet_03_sales_perf');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.formData) {
            spData = parsed.formData;
            detectedSalesSource = 'LOCAL_DRAFT';
          }
        }
      } catch (e) {}
    }

    // 2. Check Sheet 1 (Effort Level)
    if (memoryStore.effortLevelData && Object.keys(memoryStore.effortLevelData).length > 0) {
      efData = memoryStore.effortLevelData;
      detectedEffortSource = 'LIVE_MEMORY';
    } else {
      try {
        const saved = localStorage.getItem('dios_draft_sheet_01_effort_level');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.formData) {
            efData = parsed.formData;
            detectedEffortSource = 'LOCAL_DRAFT';
          }
        }
      } catch (e) {}
    }

    // Defaults only as safety
    const defaultBudget: Record<string, number> = { APR: 4.34, MAY: 4.55, JUN: 4.89, JUL: 4.83, AUG: 4.98, SEP: 5.28, OCT: 4.70, NOV: 4.93, DEC: 5.30, JAN: 4.97, FEB: 4.69, MAR: 4.55 };
    const defaultPrimary: Record<string, number> = { APR: 4.34, MAY: 4.75, JUN: 5.07, JUL: 4.84, AUG: 4.98, SEP: 5.28, OCT: 4.70, NOV: 4.93, DEC: 5.30, JAN: 4.97, FEB: 4.69, MAR: 4.55 };
    const defaultSecondary: Record<string, number> = { APR: 5.11, MAY: 4.74, JUN: 5.31, JUL: 4.80, AUG: 4.85, SEP: 5.00, OCT: 4.70, NOV: 4.90, DEC: 5.10, JAN: 4.80, FEB: 4.60, MAR: 4.50 };
    const defaultCallsAvg: Record<string, number> = { APR: 9.19, MAY: 9.09, JUN: 9.26, JUL: 8.67, AUG: 9.50, SEP: 9.80, OCT: 9.20, NOV: 9.40, DEC: 9.50, JAN: 9.30, FEB: 9.20, MAR: 9.50 };

    let m1 = 'APR', m2 = 'MAY', m3 = 'JUN', chk = 'JUL';
    if (qCode === 'Q2') { m1 = 'JUL'; m2 = 'AUG'; m3 = 'SEP'; chk = 'OCT'; }
    if (qCode === 'Q3') { m1 = 'OCT'; m2 = 'NOV'; m3 = 'DEC'; chk = 'JAN'; }
    if (qCode === 'Q4') { m1 = 'JAN'; m2 = 'FEB'; m3 = 'MAR'; chk = 'APR'; }

    const getTgt = (c: string) => parseFloat(spData?.budget?.[c]) || defaultBudget[c] || 0;
    const getPri = (c: string) => parseFloat(spData?.primary_curr?.[c] || spData?.cbo_primary?.[c]) || defaultPrimary[c] || 0;
    const getSec = (c: string) => parseFloat(spData?.sec_curr?.[c]) || defaultSecondary[c] || 0;
    const getCallAvg = (c: string) => {
      const calls = parseFloat(efData?.total_dr_calls?.[c]);
      const days = parseFloat(efData?.actual_fw_days?.[c] || '24');
      if (calls > 0 && days > 0) return Number((calls / days).toFixed(2));
      return defaultCallsAvg[c] || 9.20;
    };

    const t1 = getTgt(m1), p1 = getPri(m1), s1 = getSec(m1), np1 = getPri(m2), ca1 = getCallAvg(m1);
    const t2 = getTgt(m2), p2 = getPri(m2), s2 = getSec(m2), np2 = getPri(m3), ca2 = getCallAvg(m2);
    const t3 = getTgt(m3), p3 = getPri(m3), s3 = getSec(m3), np3 = getPri(chk), ca3 = getCallAvg(m3);

    const ach1 = t1 > 0 ? Number(((p1 / t1) * 100).toFixed(2)) : 0;
    const ach2 = t2 > 0 ? Number(((p2 / t2) * 100).toFixed(2)) : 0;
    const ach3 = t3 > 0 ? Number(((p3 / t3) * 100).toFixed(2)) : 0;

    const inc1 = (ach1 >= 100 && ca1 >= 8.5) ? 4500 : 0;
    const inc2 = (ach2 >= 100 && ca2 >= 8.5) ? 4500 : 0;
    const inc3 = (ach3 >= 100 && ca3 >= 8.5) ? 5000 : 0;

    const qTgt = Number((t1 + t2 + t3).toFixed(2));
    const qSale = Number((p1 + p2 + p3).toFixed(2));
    const qAch = qTgt > 0 ? Number(((qSale / qTgt) * 100).toFixed(2)) : 0;

    const cTgt = getTgt(chk);
    const cAch = getPri(chk);
    const cAchPct = cTgt > 0 ? Number(((cAch / cTgt) * 100).toFixed(2)) : 0;

    const qInc = (qAch >= 100 && cAchPct >= 100) ? 22656 : 0;
    const grandInc = inc1 + inc2 + inc3 + qInc;

    // Update Tracker HUD State
    const now = new Date();
    setSourceTracker({
      salesSource: detectedSalesSource,
      effortSource: detectedEffortSource,
      lastSyncTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      activeMonths: `${m1}, ${m2}, ${m3} (Check: ${chk})`
    });

    return rowsToUpdate.map(r => {
      if (r.name.includes('BANWARI') || r.hq === 'UDAIPUR') {
        return {
          ...r,
          m1: { tgt: t1, primarySale: p1, secSale: s1, nextMonthPrimary: np1, achPct: ach1, pcpm: p1, drCallAvg: ca1, monthlyIncEarned: inc1 },
          m2: { tgt: t2, primarySale: p2, secSale: s2, nextMonthPrimary: np2, achPct: ach2, pcpm: p2, drCallAvg: ca2, monthlyIncEarned: inc2 },
          m3: { tgt: t3, primarySale: p3, secSale: s3, nextMonthPrimary: np3, achPct: ach3, pcpm: p3, drCallAvg: ca3, monthlyIncEarned: inc3 },
          qtrTgt: qTgt,
          qtrSale: qSale,
          qtrAchPct: qAch,
          checkMthTgt: cTgt,
          checkMthAch: cAch,
          checkMthAchPct: cAchPct,
          qtrIncEarned: qInc,
          totalIncEarned: grandInc
        };
      }
      return r;
    });
  };

  const loadFromKV = async (qCode: 'Q1' | 'Q2' | 'Q3' | 'Q4') => {
    setIsLoading(true);
    let loadedRows = quarterData[qCode] || [];

    try {
      const res = await fetch(`/api/cloud-storage?key=incentive/qtr_${qCode}_2026&t=${Date.now()}`);
      const json = await res.json();
      if (json && json.success && json.data && Array.isArray(json.data)) {
        loadedRows = json.data;
      }
    } catch (e) {}

    const synced = syncBanwariData(qCode, loadedRows);
    setQuarterData(prev => ({ ...prev, [qCode]: synced }));
    localStorage.setItem(`dios_incentive_qtr_${qCode}_2026`, JSON.stringify(synced));
    setIsLoading(false);
  };

  useEffect(() => {
    loadFromKV(selectedQtr);
  }, [selectedQtr]);

  const banwariRow = useMemo(() => {
    return currentRows.find(r => r.name.includes('BANWARI') || r.hq === 'UDAIPUR') || currentRows[3];
  }, [currentRows]);

  const handleManualAutoFill = () => {
    const updated = syncBanwariData(selectedQtr, currentRows);
    persistRows(updated);
    setStatusMsg(`⚡ Banwari Lal Meena (Udaipur HQ) ka ${selectedQtr} data Sheet 1 & 3 se auto-sync ho gaya!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleCellEdit = (empId: string, monthKey: 'm1' | 'm2' | 'm3' | 'root', field: string, val: any) => {
    const updated = currentRows.map(r => {
      if (r.id !== empId) return r;
      if (monthKey === 'root') {
        const copy: any = { ...r, [field]: val };
        if (field === 'qtrSale' || field === 'qtrTgt') {
          const s = parseFloat(copy.qtrSale) || 0;
          const t = parseFloat(copy.qtrTgt) || 0;
          copy.qtrAchPct = t > 0 ? Number(((s / t) * 100).toFixed(2)) : 0;
        }
        const mInc = (parseFloat(String(copy.m1.monthlyIncEarned)) || 0) + (parseFloat(String(copy.m2.monthlyIncEarned)) || 0) + (parseFloat(String(copy.m3.monthlyIncEarned)) || 0);
        const qInc = parseFloat(String(copy.qtrIncEarned)) || 0;
        copy.totalIncEarned = Math.round(mInc + qInc);
        return copy;
      } else {
        const mCopy: any = { ...r[monthKey], [field]: val };
        if (field === 'primarySale' || field === 'tgt') {
          const p = parseFloat(mCopy.primarySale) || 0;
          const t = parseFloat(mCopy.tgt) || 0;
          mCopy.achPct = t > 0 ? Number(((p / t) * 100).toFixed(2)) : 0;
        }
        const updatedEmp = { ...r, [monthKey]: mCopy };
        const totS = (parseFloat(String(updatedEmp.m1.primarySale)) || 0) + (parseFloat(String(updatedEmp.m2.primarySale)) || 0) + (parseFloat(String(updatedEmp.m3.primarySale)) || 0);
        const totT = (parseFloat(String(updatedEmp.m1.tgt)) || 0) + (parseFloat(String(updatedEmp.m2.tgt)) || 0) + (parseFloat(String(updatedEmp.m3.tgt)) || 0);
        updatedEmp.qtrSale = Number(totS.toFixed(2));
        updatedEmp.qtrTgt = Number(totT.toFixed(2));
        updatedEmp.qtrAchPct = totT > 0 ? Number(((totS / totT) * 100).toFixed(2)) : 0;
        const mInc = (parseFloat(String(updatedEmp.m1.monthlyIncEarned)) || 0) + (parseFloat(String(updatedEmp.m2.monthlyIncEarned)) || 0) + (parseFloat(String(updatedEmp.m3.monthlyIncEarned)) || 0);
        const qInc = parseFloat(String(updatedEmp.qtrIncEarned)) || 0;
        updatedEmp.totalIncEarned = Math.round(mInc + qInc);
        return updatedEmp;
      }
    });
    persistRows(updated);
  };

  const filtered = useMemo(() => {
    let list = currentRows;
    if (focusMode === 'MY_HQ') {
      list = list.filter(r => r.name.includes('BANWARI') || r.hq === 'UDAIPUR');
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.hq.toLowerCase().includes(q) || r.desig.toLowerCase().includes(q));
    }
    return list;
  }, [currentRows, focusMode, search]);

  const handleExportCSV = () => {
    let csv = `ZONE: ,RAJASTHAN,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n`;
    csv += `FY,2026-2027,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n`;
    csv += `,,,${qtrCfg.title} DETAILS,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n`;
    csv += `NAME OF EMPLOYEE,DESIG.,HQ,${qtrCfg.m1Name},,,,,,,,${qtrCfg.m2Name},,,,,,,,${qtrCfg.m3Name},,,,,,,,${qtrCfg.title} DETAILS ,,,,,,,TOTAL INC. EARNED\n`;
    csv += `,,,TGT,PRIMARY SALE,SEC SALE,PRIMARY SALE OF NEXT MTH,% ACH.,PCPM,DR CALL AVG,MONTHLY INC EARNED,TGT,PRIMARY SALE,SEC SALE,PRIMARY SALE OF NEXT MTH,% ACH.,PCPM,DR CALL AVG,MONTHLY INC EARNED,TGT,PRIMARY SALE,SEC SALE,PRIMARY SALE OF CHECK MTH,% ACH.,PCPM,DR CALL AVG,MONTHLY INC EARNED,${selectedQtr} TGT,${selectedQtr} SALE,${selectedQtr} ACH.%,${qtrCfg.checkMthName} TGT,${qtrCfg.checkMthName} ACH,${qtrCfg.checkMthName}% ACH,${selectedQtr} INC. EARNED,\n`;

    currentRows.forEach(r => {
      const q = (v: any) => `"${String(v !== undefined && v !== null ? v : '').replace(/"/g, '""')}"`;
      csv += `${q(r.name)},${q(r.desig)},${q(r.hq)},${r.m1.tgt},${r.m1.primarySale},${r.m1.secSale},${r.m1.nextMonthPrimary},${r.m1.achPct},${r.m1.pcpm},${r.m1.drCallAvg},${r.m1.monthlyIncEarned},${r.m2.tgt},${r.m2.primarySale},${r.m2.secSale},${r.m2.nextMonthPrimary},${r.m2.achPct},${r.m2.pcpm},${r.m2.drCallAvg},${r.m2.monthlyIncEarned},${r.m3.tgt},${r.m3.primarySale},${r.m3.secSale},${r.m3.nextMonthPrimary},${r.m3.achPct},${r.m3.pcpm},${r.m3.drCallAvg},${r.m3.monthlyIncEarned},${r.qtrTgt},${r.qtrSale},${r.qtrAchPct},${r.checkMthTgt},${r.checkMthAch},${r.checkMthAchPct},${r.qtrIncEarned},${r.totalIncEarned}\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `INCENTIVE_FORMAT_${selectedQtr}_2026_27.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const banwariTotal = banwariRow ? (parseFloat(String(banwariRow.totalIncEarned)) || 0) : 0;
  const banwariMonthlyTotal = banwariRow ? ((parseFloat(String(banwariRow.m1.monthlyIncEarned)) || 0) + (parseFloat(String(banwariRow.m2.monthlyIncEarned)) || 0) + (parseFloat(String(banwariRow.m3.monthlyIncEarned)) || 0)) : 0;
  const banwariQtrInc = banwariRow ? (parseFloat(String(banwariRow.qtrIncEarned)) || 0) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">
      
      {/* 1. TOP HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Award size={22} />
          </span>
          <div>
            <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              ZONE: RAJASTHAN • INCENTIVE DETAILS (FY 2026-2027)
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-mono font-bold">
                Source Inspector Live
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">BE / ABM Performance Slabs • Auto-Synced with Sheet 1 &amp; Sheet 3 across Q1-Q4</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quarter Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-emerald-500/40 shadow-inner">
            {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
              <button
                key={q}
                onClick={() => setSelectedQtr(q)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedQtr === q
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Auto-Fill Udaipur */}
          <button
            onClick={handleManualAutoFill}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
            title="Force Re-Sync Banwari Lal Meena from Sheet 1 & Sheet 3"
          >
            <Zap size={14} /> ⚡ Auto-Fill Udaipur
          </button>

          {/* Sync Cloud */}
          <button
            onClick={() => loadFromKV(selectedQtr)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-cyan-400' : ''} />
            Sync KV
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* 🌟 2. REAL-TIME DATA SOURCE INSPECTOR HUD (TRANSPARENCY BAR) */}
      <div className="p-3 bg-slate-950/90 rounded-2xl border border-cyan-500/30 shadow-inner space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Database size={13} className="text-cyan-400" /> Live Data Source Inspector ({selectedQtr})
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Synced: <b className="text-white">{sourceTracker.lastSyncTime}</b> • BE: <b className="text-amber-400">BANWARI LAL MEENA (UDAIPUR)</b>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
          {/* Badge 1: Sheet 3 Sales */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Activity size={12} className="text-cyan-400" /> Sheet 3 (Sales/Tgt):
            </span>
            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
              sourceTracker.salesSource === 'LIVE_MEMORY'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : sourceTracker.salesSource === 'LOCAL_DRAFT'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {sourceTracker.salesSource === 'LIVE_MEMORY' ? '🟢 Active Live Session' : sourceTracker.salesSource === 'LOCAL_DRAFT' ? '💾 iPad Local Draft (Sheet 3)' : '⚠️ Default Baseline'}
            </span>
          </div>

          {/* Badge 2: Sheet 1 Effort Calls */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Radio size={12} className="text-purple-400" /> Sheet 1 (DCR Calls):
            </span>
            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
              sourceTracker.effortSource === 'LIVE_MEMORY'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : sourceTracker.effortSource === 'LOCAL_DRAFT'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {sourceTracker.effortSource === 'LIVE_MEMORY' ? '🟢 Active Live Session' : sourceTracker.effortSource === 'LOCAL_DRAFT' ? '💾 iPad Local Draft (Sheet 1)' : '⚠️ Default Baseline'}
            </span>
          </div>

          {/* Badge 3: Quarter Scope */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Server size={12} className="text-amber-400" /> Active Quarter Months:
            </span>
            <span className="text-amber-300 font-bold font-mono text-[10px]">
              {sourceTracker.activeMonths}
            </span>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="p-1 hover:text-white">✕</button>
        </div>
      )}

      {/* 3. EXECUTIVE HIGHLIGHT STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Representative &amp; HQ</div>
          <div className="text-sm font-bold text-white mt-1 truncate">
            {banwariRow?.name || 'BANWARI LAL MEENA'}
          </div>
          <div className="text-xs text-amber-400 font-mono font-semibold mt-0.5">BE • UDAIPUR HQ</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-cyan-400 uppercase font-semibold">{selectedQtr} Target &rarr; Sales</div>
          <div className="text-base font-black text-cyan-300 font-mono mt-1">
            {banwariRow?.qtrTgt ? `${banwariRow.qtrTgt}L` : '-'} &rarr; {banwariRow?.qtrSale ? `${banwariRow.qtrSale}L` : '-'}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">Achievement: <b className="text-cyan-300 font-bold">{banwariRow?.qtrAchPct ? `${banwariRow.qtrAchPct}%` : '-'}</b></div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-emerald-400 uppercase font-semibold">Monthly Total Incentive</div>
          <div className="text-lg font-black text-emerald-400 font-mono mt-1">
            ₹{banwariMonthlyTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">Quarterly Bonus: ₹{banwariQtrInc.toLocaleString()}</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-950/90 to-slate-950 p-3.5 rounded-2xl border-2 border-emerald-500/50 shadow-xl flex flex-col justify-between">
          <div className="text-[10px] text-emerald-300 uppercase font-black tracking-wide flex items-center justify-between">
            <span>TOTAL INC. EARNED</span>
            <Sparkles size={14} className="text-yellow-300 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono mt-1">
            ₹{banwariTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 4. VIEW MODE SWITCHER & SEARCH */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setFocusMode('MY_HQ')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              focusMode === 'MY_HQ'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap size={14} /> My Incentive (Udaipur)
          </button>
          <button
            onClick={() => setFocusMode('ALL_TEAM')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              focusMode === 'ALL_TEAM'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={14} /> Full Rajasthan Team ({currentRows.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search employee / HQ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* 5. SPACIOUS 2-TIER TABLE */}
      <div className="overflow-x-auto max-h-[560px] border border-slate-800 rounded-2xl shadow-2xl bg-slate-950">
        <table className="w-full text-left text-xs border-collapse">
          
          <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase z-30 border-b border-slate-800">
            {/* TIER 1 */}
            <tr className="border-b border-slate-800 text-[11px]">
              <th rowSpan={2} style={{ width: '180px', minWidth: '180px', left: 0 }} className="p-2.5 bg-slate-950 border-r border-slate-800 sticky z-40 text-white">EMPLOYEE</th>
              <th rowSpan={2} style={{ width: '70px', minWidth: '70px', left: '180px' }} className="p-2.5 text-center bg-slate-950 border-r border-slate-800 sticky z-40 text-slate-400">DESIG.</th>
              <th rowSpan={2} style={{ width: '100px', minWidth: '100px', left: '250px' }} className="p-2.5 text-center bg-slate-950 border-r-4 border-emerald-500 shadow-[4px_0_10px_rgba(0,0,0,0.5)] sticky z-40 text-slate-300">HQ</th>

              <th colSpan={8} className="p-2 text-center text-cyan-300 bg-cyan-950/80 border-r border-slate-800 font-black tracking-wide">
                {qtrCfg.m1Name} DETAILS
              </th>
              <th colSpan={8} className="p-2 text-center text-blue-300 bg-blue-950/80 border-r border-slate-800 font-black tracking-wide">
                {qtrCfg.m2Name} DETAILS
              </th>
              <th colSpan={8} className="p-2 text-center text-purple-300 bg-purple-950/80 border-r border-slate-800 font-black tracking-wide">
                {qtrCfg.m3Name} DETAILS
              </th>
              <th colSpan={7} className="p-2 text-center text-amber-300 bg-amber-950/80 border-r border-slate-800 font-black tracking-wide">
                {qtrCfg.title} SUMMARY
              </th>
              <th rowSpan={2} className="p-2.5 text-right min-w-[140px] text-emerald-300 bg-emerald-950 border-l border-slate-800 font-black">
                TOTAL INC. EARNED
              </th>
            </tr>

            {/* TIER 2 */}
            <tr className="border-b border-slate-800 text-[10px] font-mono">
              {/* M1 */}
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60">TGT</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60 text-cyan-400">PRI</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60">SEC</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60">NEXT PRI</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60 text-emerald-400">% ACH</th>
              <th className="p-1.5 text-center w-16 min-w-[60px] bg-slate-950 border-r border-slate-800/60">PCPM</th>
              <th className="p-1.5 text-center w-16 min-w-[60px] bg-slate-950 border-r border-slate-800/60">CALLS</th>
              <th className="p-1.5 text-center w-24 min-w-[80px] bg-slate-950 border-r border-slate-800 text-yellow-300 font-bold">INC (₹)</th>

              {/* M2 */}
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60">TGT</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60 text-cyan-400">PRI</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60">SEC</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60">NEXT PRI</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60 text-emerald-400">% ACH</th>
              <th className="p-1.5 text-center w-16 min-w-[60px] bg-slate-950 border-r border-slate-800/60">PCPM</th>
              <th className="p-1.5 text-center w-16 min-w-[60px] bg-slate-950 border-r border-slate-800/60">CALLS</th>
              <th className="p-1.5 text-center w-24 min-w-[80px] bg-slate-950 border-r border-slate-800 text-yellow-300 font-bold">INC (₹)</th>

              {/* M3 */}
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60">TGT</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60 text-cyan-400">PRI</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60">SEC</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60">NEXT PRI</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60 text-emerald-400">% ACH</th>
              <th className="p-1.5 text-center w-16 min-w-[60px] bg-slate-950 border-r border-slate-800/60">PCPM</th>
              <th className="p-1.5 text-center w-16 min-w-[60px] bg-slate-950 border-r border-slate-800/60">CALLS</th>
              <th className="p-1.5 text-center w-24 min-w-[80px] bg-slate-950 border-r border-slate-800 text-yellow-300 font-bold">INC (₹)</th>

              {/* QTR */}
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60 text-amber-400 font-bold">Q TGT</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60 text-cyan-400 font-bold">Q SALE</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60 text-emerald-400 font-bold">Q ACH%</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60">{qtrCfg.checkMthName} TGT</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60">{qtrCfg.checkMthName} ACH</th>
              <th className="p-1.5 text-center w-20 min-w-[70px] bg-slate-950 border-r border-slate-800/60">{qtrCfg.checkMthName}%</th>
              <th className="p-1.5 text-center w-24 min-w-[80px] bg-slate-950 border-r border-slate-800 text-yellow-300 font-bold">Q INC (₹)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] bg-slate-900">
            {filtered.map(emp => {
              const isUdaipur = emp.hq === 'UDAIPUR' || emp.name.includes('BANWARI');

              return (
                <tr key={emp.id} className={`transition ${isUdaipur ? 'bg-amber-950/30 hover:bg-amber-950/50' : 'hover:bg-slate-800/40'}`}>
                  
                  {/* FROZEN LEFT COLS */}
                  <td style={{ width: '180px', minWidth: '180px', left: 0 }} className={`p-2.5 font-sans font-bold sticky z-20 truncate max-w-[180px] border-r border-slate-800/60 ${isUdaipur ? 'bg-slate-900 text-amber-300' : 'bg-slate-900 text-white'}`}>
                    {emp.name}
                  </td>
                  <td style={{ width: '70px', minWidth: '70px', left: '180px' }} className={`p-2.5 text-center sticky z-20 text-slate-400 font-semibold border-r border-slate-800/60 ${isUdaipur ? 'bg-slate-900' : 'bg-slate-900'}`}>
                    {emp.desig}
                  </td>
                  <td style={{ width: '100px', minWidth: '100px', left: '250px' }} className={`p-2.5 text-center sticky z-20 font-bold border-r-4 border-emerald-500 shadow-[4px_0_10px_rgba(0,0,0,0.5)] ${isUdaipur ? 'bg-slate-900 text-amber-400' : 'bg-slate-900 text-slate-300'}`}>
                    {emp.hq}
                  </td>

                  {/* M1 */}
                  <td className="p-1 text-center border-r border-slate-800/50 w-20 min-w-[70px]">
                    <input type="text" value={emp.m1.tgt} onChange={e => handleCellEdit(emp.id, 'm1', 'tgt', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 text-slate-300 rounded" />
                  </td>
                  <td className="p-1 text-center border-r border-slate-800/50 text-cyan-300 font-bold w-20 min-w-[70px]">
                    <input type="text" value={emp.m1.primarySale} onChange={e => handleCellEdit(emp.id, 'm1', 'primarySale', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 text-cyan-300 font-bold rounded" />
                  </td>
                  <td className="p-1 text-center border-r border-slate-800/50 text-slate-400 w-20 min-w-[70px]">
                    <input type="text" value={emp.m1.secSale} onChange={e => handleCellEdit(emp.id, 'm1', 'secSale', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 rounded" />
                  </td>
                  <td className="p-1 text-center border-r border-slate-800/50 text-slate-400 w-20 min-w-[70px]">
                    <input type="text" value={emp.m1.nextMonthPrimary} onChange={e => handleCellEdit(emp.id, 'm1', 'nextMonthPrimary', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 rounded" />
                  </td>
                  <td className="p-2 text-center border-r border-slate-800/50 text-emerald-400 font-bold w-20 min-w-[70px]">
                    {emp.m1.achPct ? `${emp.m1.achPct}%` : '-'}
                  </td>
                  <td className="p-2 text-center border-r border-slate-800/50 text-slate-400 w-16 min-w-[60px]">{emp.m1.pcpm || '-'}</td>
                  <td className="p-2 text-center border-r border-slate-800/50 text-slate-300 font-semibold w-16 min-w-[60px]">{emp.m1.drCallAvg || '-'}</td>
                  <td className="p-1 text-center border-r border-slate-800 text-yellow-300 font-bold bg-yellow-950/10 w-24 min-w-[80px]">
                    <input type="text" value={emp.m1.monthlyIncEarned} onChange={e => handleCellEdit(emp.id, 'm1', 'monthlyIncEarned', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 text-yellow-300 font-bold rounded" />
                  </td>

                  {/* M2 */}
                  <td className="p-1 text-center border-r border-slate-800/50 w-20 min-w-[70px]">
                    <input type="text" value={emp.m2.tgt} onChange={e => handleCellEdit(emp.id, 'm2', 'tgt', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 text-slate-300 rounded" />
                  </td>
                  <td className="p-1 text-center border-r border-slate-800/50 text-cyan-300 font-bold w-20 min-w-[70px]">
                    <input type="text" value={emp.m2.primarySale} onChange={e => handleCellEdit(emp.id, 'm2', 'primarySale', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 text-cyan-300 font-bold rounded" />
                  </td>
                  <td className="p-1 text-center border-r border-slate-800/50 text-slate-400 w-20 min-w-[70px]">
                    <input type="text" value={emp.m2.secSale} onChange={e => handleCellEdit(emp.id, 'm2', 'secSale', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 rounded" />
                  </td>
                  <td className="p-1 text-center border-r border-slate-800/50 text-slate-400 w-20 min-w-[70px]">
                    <input type="text" value={emp.m2.nextMonthPrimary} onChange={e => handleCellEdit(emp.id, 'm2', 'nextMonthPrimary', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 rounded" />
                  </td>
                  <td className="p-2 text-center border-r border-slate-800/50 text-emerald-400 font-bold w-20 min-w-[70px]">
                    {emp.m2.achPct ? `${emp.m2.achPct}%` : '-'}
                  </td>
                  <td className="p-2 text-center border-r border-slate-800/50 text-slate-400 w-16 min-w-[60px]">{emp.m2.pcpm || '-'}</td>
                  <td className="p-2 text-center border-r border-slate-800/50 text-slate-300 font-semibold w-16 min-w-[60px]">{emp.m2.drCallAvg || '-'}</td>
                  <td className="p-1 text-center border-r border-slate-800 text-yellow-300 font-bold bg-yellow-950/10 w-24 min-w-[80px]">
                    <input type="text" value={emp.m2.monthlyIncEarned} onChange={e => handleCellEdit(emp.id, 'm2', 'monthlyIncEarned', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 text-yellow-300 font-bold rounded" />
                  </td>

                  {/* M3 */}
                  <td className="p-1 text-center border-r border-slate-800/50 w-20 min-w-[70px]">
                    <input type="text" value={emp.m3.tgt} onChange={e => handleCellEdit(emp.id, 'm3', 'tgt', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 text-slate-300 rounded" />
                  </td>
                  <td className="p-1 text-center border-r border-slate-800/50 text-cyan-300 font-bold w-20 min-w-[70px]">
                    <input type="text" value={emp.m3.primarySale} onChange={e => handleCellEdit(emp.id, 'm3', 'primarySale', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 text-cyan-300 font-bold rounded" />
                  </td>
                  <td className="p-1 text-center border-r border-slate-800/50 text-slate-400 w-20 min-w-[70px]">
                    <input type="text" value={emp.m3.secSale} onChange={e => handleCellEdit(emp.id, 'm3', 'secSale', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 rounded" />
                  </td>
                  <td className="p-1 text-center border-r border-slate-800/50 text-slate-400 w-20 min-w-[70px]">
                    <input type="text" value={emp.m3.nextMonthPrimary} onChange={e => handleCellEdit(emp.id, 'm3', 'nextMonthPrimary', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 rounded" />
                  </td>
                  <td className="p-2 text-center border-r border-slate-800/50 text-emerald-400 font-bold w-20 min-w-[70px]">
                    {emp.m3.achPct ? `${emp.m3.achPct}%` : '-'}
                  </td>
                  <td className="p-2 text-center border-r border-slate-800/50 text-slate-400 w-16 min-w-[60px]">{emp.m3.pcpm || '-'}</td>
                  <td className="p-2 text-center border-r border-slate-800/50 text-slate-300 font-semibold w-16 min-w-[60px]">{emp.m3.drCallAvg || '-'}</td>
                  <td className="p-1 text-center border-r border-slate-800 text-yellow-300 font-bold bg-yellow-950/10 w-24 min-w-[80px]">
                    <input type="text" value={emp.m3.monthlyIncEarned} onChange={e => handleCellEdit(emp.id, 'm3', 'monthlyIncEarned', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 text-yellow-300 font-bold rounded" />
                  </td>

                  {/* QTR */}
                  <td className="p-2 text-center border-r border-slate-800/50 text-amber-300 font-bold w-20 min-w-[70px]">{emp.qtrTgt}</td>
                  <td className="p-2 text-center border-r border-slate-800/50 text-cyan-300 font-bold w-20 min-w-[70px]">{emp.qtrSale}</td>
                  <td className="p-2 text-center border-r border-slate-800/50 text-emerald-400 font-bold w-20 min-w-[70px]">{emp.qtrAchPct ? `${emp.qtrAchPct}%` : '-'}</td>
                  <td className="p-2 text-center border-r border-slate-800/50 text-slate-300 w-20 min-w-[70px]">{emp.checkMthTgt}</td>
                  <td className="p-2 text-center border-r border-slate-800/50 text-slate-300 w-20 min-w-[70px]">{emp.checkMthAch}</td>
                  <td className="p-2 text-center border-r border-slate-800/50 text-emerald-400 w-20 min-w-[70px]">{emp.checkMthAchPct ? `${emp.checkMthAchPct}%` : '-'}</td>
                  <td className="p-1 text-center border-r border-slate-800 text-yellow-300 font-bold bg-yellow-950/20 w-24 min-w-[80px]">
                    <input type="text" value={emp.qtrIncEarned} onChange={e => handleCellEdit(emp.id, 'root', 'qtrIncEarned', e.target.value)} className="w-full py-1 px-1 bg-transparent text-center focus:bg-slate-950 text-yellow-300 font-bold rounded" />
                  </td>

                  {/* TOTAL */}
                  <td className="p-2.5 text-right font-black text-emerald-300 bg-emerald-950/40 text-xs border-l border-slate-800 min-w-[140px]">
                    ₹{Number(emp.totalIncEarned || 0).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
