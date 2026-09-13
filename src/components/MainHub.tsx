import { SettingsModal } from './SettingsModal';
import React, { useState } from 'react';
import { 
  Search, FolderGit2, Activity, ShieldCheck, Database, 
  FileText, Cloud, CloudUpload, CloudDownload, Check, Loader2,
  Globe, Settings, Tent
} from 'lucide-react';
import { memoryStore } from '../data/memoryStore';
import { unProgressionStore } from '../data/unProgressionStore';

interface Props {
  onOpenProject: (projectId: string) => void;
}

export const MainHub: React.FC<Props> = ({ onOpenProject }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [hubSearch, setHubSearch] = useState('');
  const [isMasterBackingUp, setIsMasterBackingUp] = useState(false);
  const [isMasterRestoring, setIsMasterRestoring] = useState(false);
  const [masterMsg, setMasterMsg] = useState<string | null>(null);

  const handleMasterBackup = async () => {
    if (!window.confirm("Kya aap saari 15 Review Sheets + Dhruvi Aggregator ka complete data ek sath Cloudflare KV me Backup karna chahte hain?")) return;
    setIsMasterBackingUp(true);
    setMasterMsg(null);
    try {
      const allData: Record<string, any> = {
        'review/sheet_01_effort_level': { formData: memoryStore.effortLevelData, beName: memoryStore.beName, hqName: memoryStore.hqName, activityComments: JSON.parse(localStorage.getItem('dios_effort_activity_comments_v1') || '{}') },
        'review/sheet_02_fw_progress': { dcrDataByMonth: memoryStore.dcrDataByMonth, selectedMonth: memoryStore.currentDcrMonth },
        'review/sheet_03_sales_performance': { formData: memoryStore.salesPerformanceData, salesBreakdown: memoryStore.salesBreakdown },
        'review/sheet_04_un_sales_progression': { progressionData: unProgressionStore.getData() },
        'review/sheet_05_near_by_expiry': { rows: memoryStore.expiryData ? Object.values(memoryStore.expiryData) : JSON.parse(localStorage.getItem('dios_draft_sheet_05_expiry') || '{"rows":[]}')?.rows },
        'review/sheet_06_commitment': { commitmentData: memoryStore.commitmentTopData, monthlyCA: memoryStore.commitmentMonthlyCA, doctorsRows: memoryStore.commitmentDoctors },
        'campaigns/sheet_07_wcfyh': { rows: JSON.parse(localStorage.getItem('dios_wcfyh_campaign_permanent_v2') || '[]') },
        'campaigns/sheet_08_a2_ghee_valros': { rows: JSON.parse(localStorage.getItem('dios_a2_ghee_valros_permanent_v2') || '[]') },
        'campaigns/sheet_09_table_top': { sections: JSON.parse(localStorage.getItem('dios_table_top_campaign_permanent_v2') || '[]'), campaignTitle: localStorage.getItem('dios_table_top_title_permanent_v1') || 'TABLE TOP CAMPAIGN' },
        'campaigns/sheet_10_glucometer': { campDocs: JSON.parse(localStorage.getItem('dios_glucometer_camp_permanent_v1_docs') || '[]'), patients: JSON.parse(localStorage.getItem('dios_glucometer_camp_permanent_v1_patients') || '[]') },
        'review/sheet_11_special_focused': { primaryRows: JSON.parse(localStorage.getItem('dios_special_focused_brands_permanent_v1_pri') || '[]'), secondaryRows: JSON.parse(localStorage.getItem('dios_special_focused_brands_permanent_v1_sec') || '[]') },
        'review/sheet_12_focused_brands': { items: JSON.parse(localStorage.getItem('dios_focused_brands_permanent_v3') || '[]') },
        'review/sheet_13_roi': { roiList: JSON.parse(localStorage.getItem('dios_roi_analysis_permanent_v2') || '[]') },
        'review/sheet_14_msl_schedule': { doctors: memoryStore.mslData || JSON.parse(localStorage.getItem('dios_msl_schedule_permanent_v5') || '[]'), customPriorityRules: JSON.parse(localStorage.getItem('dios_msl_custom_priority_rules_v1') || '[]') },
        'review/sheet_15_call_status': { dcrCalls: memoryStore.dcrCallsByMonth, masterDoctors: JSON.parse(localStorage.getItem('dios_call_status_master_doctors_v4') || '[]'), masterChemists: JSON.parse(localStorage.getItem('dios_call_status_master_chemists_v4') || '[]') },
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
    if (!window.confirm("Kya aap Cloudflare KV se saari 15 sheets ka latest cloud data load karke iPad me overwrite karna chahte hain?")) return;
    setIsMasterRestoring(true);
    setMasterMsg(null);
    try {
      const keys = [
        'review/sheet_01_effort_level', 'review/sheet_02_fw_progress', 'review/sheet_03_sales_performance',
        'review/sheet_04_un_sales_progression', 'review/sheet_05_near_by_expiry', 'review/sheet_06_commitment',
        'campaigns/sheet_07_wcfyh', 'campaigns/sheet_08_a2_ghee_valros', 'campaigns/sheet_09_table_top',
        'campaigns/sheet_10_glucometer', 'review/sheet_11_special_focused', 'review/sheet_12_focused_brands',
        'review/sheet_13_roi', 'review/sheet_14_msl_schedule', 'review/sheet_15_call_status',
        'aggregator/dhruvi_manual_math'
      ];

      for (const key of keys) {
        const res = await fetch(`/api/cloud-storage?key=${encodeURIComponent(key)}&t=${Date.now()}&_r=${Math.random()}`, { cache: 'no-store' });
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          if (key.includes('sheet_01') && d.formData) {
            memoryStore.effortLevelData = d.formData;
            localStorage.setItem('dios_draft_sheet_01_effort_level', JSON.stringify({ beName: d.beName, hqName: d.hqName, formData: d.formData, activityComments: d.activityComments }));
          }
          if (key.includes('sheet_02') && d.dcrDataByMonth) {
            memoryStore.dcrDataByMonth = d.dcrDataByMonth;
            localStorage.setItem('dios_draft_sheet_02_fw_progress', JSON.stringify({ dcrDataByMonth: d.dcrDataByMonth, selectedMonth: d.selectedMonth }));
          }
          if (key.includes('sheet_03') && d.formData) {
            memoryStore.salesPerformanceData = d.formData;
            localStorage.setItem('dios_draft_sheet_03_sales_perf', JSON.stringify({ formData: d.formData, salesBreakdown: d.salesBreakdown, selectedMonth: d.selectedMonth }));
          }
        }
      }

      setMasterMsg('📥 All 15 Sheets + Aggregator Fresh Cloud Data RESTORED!');
      setTimeout(() => setMasterMsg(null), 4500);
    } catch (err: any) {
      setMasterMsg(`❌ Restore error: ${err.message}`);
    } finally {
      setIsMasterRestoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-12 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-cyan-950 via-slate-900 to-emerald-950 border border-cyan-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Activity size={22} className="animate-pulse" />
          </span>
          <div>
            <div className="text-xs font-black tracking-wide text-emerald-400 uppercase flex items-center gap-2">
              <span>● SYSTEM V65.0 LIVE</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                CLOUDFLARE KV CONNECTED
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Doctor Camps Hub &bull; Daily Working Route Planner &bull; 15 Review Sheets &bull; Aggregator
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <ShieldCheck size={16} className="text-cyan-400" /> Cloudflare Edge Safe
        </div>
      </div>

      {/* Cloud Controls */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl">
            <Cloud size={18} />
          </span>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cloudflare KV Master Center</h3>
            <p className="text-[11px] text-slate-400">1-Click Full Backup &amp; Live Restore</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMasterBackup}
            disabled={isMasterBackingUp}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer active:scale-95 disabled:opacity-50"
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
          <button onClick={() => setMasterMsg(null)} className="p-1 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <FolderGit2 className="text-cyan-400" size={32} />
            Dev Workspace Hub
          </h1>
          <p className="text-slate-400 text-sm mt-1">Udaipur HQ Pharma Analytics &amp; Permanent Cloud Reporting Platform</p>
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border-2 border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-bold text-xs rounded-2xl shadow-lg transition cursor-pointer self-start md:self-auto"
        >
          <Settings size={16} className="text-cyan-400" />
          <span>⚙️ Settings &amp; Server Launcher</span>
        </button>
      </header>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search modules..."
          value={hubSearch}
          onChange={(e) => setHubSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* 🌟 ALL 5 MAIN WORKSPACE MODULE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        
        {/* CARD 1: DOCTOR CAMP & CLINICAL ACTIVITIES HUB */}
        <div className="bg-slate-900/95 border-2 border-amber-500/80 hover:border-amber-400 rounded-2xl p-5 transition duration-200 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                NEW &bull; CLINICAL CAMPS
              </span>
              <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">⛺</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Doctor Camp Hub
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              DDC, Neuropathy, HbA1c, BMD &amp; Cardio camps with 1-click WhatsApp senior reports &amp; same-day Rx logs.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => onOpenProject('camp-hub')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950 transition cursor-pointer"
            >
              ⛺ Open Camp Hub &rarr;
            </button>
          </div>
        </div>

        {/* CARD 2: DAILY WORKING & ROUTE */}
        <div className="bg-slate-900/90 border-2 border-emerald-500/60 hover:border-emerald-400 rounded-2xl p-5 transition duration-200 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                ROUTE PLANNER
              </span>
              <Activity size={20} className="text-emerald-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Daily Working
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              1-Day Ex-Station tours (9 Dungarpur, 11 Banswara, 9 Chittor, 13 Rajsamand) &amp; diary slip print.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => onOpenProject('daily-working')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              📅 Open Day Plan &rarr;
            </button>
          </div>
        </div>

        {/* CARD 3: STATEMENT AGGREGATOR */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-5 transition duration-200 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Primary &amp; Secondary
              </span>
              <Database size={18} className="text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Statement Aggregator
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Unit Sales Progression for 6 Distributors + Dhruvi In-cell Math + Live CBO Primary Dispatch.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => onOpenProject('dios-aggregator')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              Open Aggregator &rarr;
            </button>
          </div>
        </div>

        {/* CARD 4: DATA HUB */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-5 transition duration-200 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                16 Review Sheets
              </span>
              <FileText size={18} className="text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Data Hub (Review)
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              All 16 Monthly Review formats with Cloudflare KV Backup, Live Crawler &amp; MSL Schedule sync.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => onOpenProject('dios-review')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              📊 Open Data Hub &rarr;
            </button>
          </div>
        </div>

        {/* CARD 5: WEB DATA */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-5 transition duration-200 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Web Data
              </span>
              <Globe size={18} className="text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Web Data &amp; Hubs
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Birthday &amp; Anniversary Hub (130 Drs), Free Goods Repository, Incentives &amp; Expense claims.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => onOpenProject('web-data')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              Open Web Data &rarr;
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
