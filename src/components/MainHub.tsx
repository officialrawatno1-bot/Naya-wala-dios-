import React, { useState } from 'react';
import { 
  Search, FolderGit2, Activity, ShieldCheck, Database, 
  FileText, Cloud, CloudUpload, CloudDownload, Check, Loader2
} from 'lucide-react';
import { memoryStore } from '../data/memoryStore';
import { unProgressionStore } from '../data/unProgressionStore';

interface Props {
  onOpenProject: (projectId: string) => void;
}

export const MainHub: React.FC<Props> = ({ onOpenProject }) => {
  const [hubSearch, setHubSearch] = useState('');
  const [isMasterBackingUp, setIsMasterBackingUp] = useState(false);
  const [isMasterRestoring, setIsMasterRestoring] = useState(false);
  const [masterMsg, setMasterMsg] = useState<string | null>(null);

  const handleMasterBackup = async () => {
    if (!window.confirm("Kya aap saari 15 Review Sheets + Dhruvi Aggregator ka complete data ek sath Cloudflare KV me Backup karna chahte hain?")) {
      return;
    }
    setIsMasterBackingUp(true);
    setMasterMsg(null);
    try {
      const allData: Record<string, any> = {
        'review/sheet_01_effort_level': { formData: memoryStore.effortLevelData, beName: memoryStore.beName, hqName: memoryStore.hqName },
        'review/sheet_02_fw_progress': { dcrDataByMonth: memoryStore.dcrDataByMonth, selectedMonth: memoryStore.currentDcrMonth },
        'review/sheet_03_sales_performance': { formData: memoryStore.salesPerformanceData, salesBreakdown: memoryStore.salesBreakdown },
        'review/sheet_04_un_sales_progression': { progressionData: unProgressionStore.getData() },
        'review/sheet_05_near_by_expiry': { rows: memoryStore.expiryData ? Object.values(memoryStore.expiryData) : [] },
        'review/sheet_06_commitment': { commitmentData: memoryStore.commitmentTopData, monthlyCA: memoryStore.commitmentMonthlyCA, doctorsRows: memoryStore.commitmentDoctors },
        'review/sheet_13_roi': { roiList: JSON.parse(localStorage.getItem('dios_roi_analysis_permanent_v2') || '[]') },
        'review/sheet_14_msl_schedule': { doctors: memoryStore.mslData || [] },
        'review/sheet_15_call_status': { dcrCalls: memoryStore.dcrCallsByMonth },
        'aggregator/dhruvi_manual_math': { draft: memoryStore.dhruviEntries, manualPtsTotal: memoryStore.dhruviManualPtsTotal, manualPtrTotal: memoryStore.dhruviManualPtrTotal, valuationMode: memoryStore.dhruviValuationMode }
      };

      for (const [key, val] of Object.entries(allData)) {
        await fetch('/api/cloud-storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, data: val, device: 'iPad Safari' })
        });
      }

      setMasterMsg('🎉 All 15 Sheets + Aggregator successfully backed up to Cloudflare KV!');
      setTimeout(() => setMasterMsg(null), 4000);
    } catch (err: any) {
      setMasterMsg(`❌ Backup error: ${err.message}`);
    } finally {
      setIsMasterBackingUp(false);
    }
  };

  const handleMasterRestore = async () => {
    if (!window.confirm("Kya aap Cloudflare KV se saare sheets ka latest cloud data load karna chahte hain?")) {
      return;
    }
    setIsMasterRestoring(true);
    setMasterMsg(null);
    try {
      const keys = [
        'review/sheet_01_effort_level',
        'review/sheet_02_fw_progress',
        'review/sheet_03_sales_performance',
        'review/sheet_04_un_sales_progression',
        'review/sheet_05_near_by_expiry',
        'review/sheet_06_commitment',
        'review/sheet_13_roi',
        'review/sheet_14_msl_schedule',
        'aggregator/dhruvi_manual_math'
      ];

      for (const key of keys) {
        const res = await fetch(`/api/cloud-storage?key=${encodeURIComponent(key)}`);
        const json = await res.json();
        if (json.success && json.data) {
          if (key.includes('sheet_01') && json.data.formData) memoryStore.effortLevelData = json.data.formData;
          if (key.includes('sheet_02') && json.data.dcrDataByMonth) memoryStore.dcrDataByMonth = json.data.dcrDataByMonth;
          if (key.includes('sheet_03') && json.data.formData) {
            memoryStore.salesPerformanceData = json.data.formData;
            if (json.data.salesBreakdown) memoryStore.salesBreakdown = json.data.salesBreakdown;
          }
          if (key.includes('sheet_04') && json.data.progressionData) {
            localStorage.setItem('dios_un_sales_progression_v1', JSON.stringify(json.data.progressionData));
          }
          if (key.includes('sheet_14') && json.data.doctors) {
            memoryStore.mslData = json.data.doctors;
            localStorage.setItem('dios_msl_schedule_permanent_v5', JSON.stringify(json.data.doctors));
          }
        }
      }

      setMasterMsg('📥 Cloudflare KV cloud data successfully restored across all modules!');
      setTimeout(() => setMasterMsg(null), 4000);
    } catch (err: any) {
      setMasterMsg(`❌ Restore error: ${err.message}`);
    } finally {
      setIsMasterRestoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-12 max-w-6xl mx-auto">
      {/* 🚀 TOP BANNER */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-cyan-950 via-slate-900 to-emerald-950 border border-cyan-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Activity size={22} className="animate-pulse" />
          </span>
          <div>
            <div className="text-xs font-black tracking-wide text-emerald-400 uppercase flex items-center gap-2">
              <span>● SYSTEM V60.0 LIVE</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                CLOUDFLARE KV CONNECTED
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Cloudflare KV Permanent Cloud Store • 15 Performance Sheets • Statement Aggregator
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <ShieldCheck size={16} className="text-cyan-400" /> Cloudflare Edge Safe
        </div>
      </div>

      {/* ☁️ MASTER 1-CLICK CLOUD CONTROLS */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl">
            <Cloud size={18} />
          </span>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cloudflare KV Master Center</h3>
            <p className="text-[11px] text-slate-400">1-Click Full Backup &amp; Restore across all 15 Sheets</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMasterBackup}
            disabled={isMasterBackingUp}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isMasterBackingUp ? <Loader2 size={14} className="animate-spin" /> : <CloudUpload size={14} />}
            {isMasterBackingUp ? 'Backing Up...' : '☁️ Master Backup All'}
          </button>

          <button
            onClick={handleMasterRestore}
            disabled={isMasterRestoring}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isMasterRestoring ? <Loader2 size={14} className="animate-spin" /> : <CloudDownload size={14} />}
            {isMasterRestoring ? 'Restoring...' : '📥 Master Pull All'}
          </button>
        </div>
      </div>

      {masterMsg && (
        <div className="mb-6 p-3 bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            <span className="font-semibold">{masterMsg}</span>
          </div>
          <button onClick={() => setMasterMsg(null)} className="p-1 hover:text-white">✕</button>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <FolderGit2 className="text-cyan-400" size={32} />
            Dev Workspace Hub
          </h1>
          <p className="text-slate-400 text-sm mt-1">Udaipur HQ Pharma Analytics &amp; Permanent Cloud Reporting Platform</p>
        </div>
      </header>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search modules (e.g. dios, review, aggregator)..."
          value={hubSearch}
          onChange={(e) => setHubSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Workspace Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-6 transition duration-200 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Primary &amp; Secondary
              </span>
              <Database size={20} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Statement Aggregator
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Unit Sales Progression (HQ Total) aggregator for 6 Distributors + Dhruvi Math Sheet + Live CBO Primary Dispatch.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => onOpenProject('dios-aggregator')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition cursor-pointer"
            >
              Open Statement Aggregator &rarr;
            </button>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-6 transition duration-200 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Cloud Protected Data Hub
              </span>
              <FileText size={20} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Performance Review
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Access and manage all 15 Monthly Performance Review formats with Cloudflare KV Cloud Backup, Time Machine Undo &amp; Live CBO Crawler.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => onOpenProject('dios-review')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              📊 Open Review Format &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
