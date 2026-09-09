import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Globe, FileText, FileSpreadsheet, Download, 
  CheckCircle2, Sparkles, Loader2, Award, Coins, Wallet, DollarSign
} from 'lucide-react';
import { generateMasterReviewWorkbook } from '../exporters/masterReviewWorkbook';
import { StockwiseStatementVault } from './StockwiseStatementVault';
import { IncentiveWorkspace } from './IncentiveWorkspace';
import { ExpenseWorkspace } from './ExpenseWorkspace';

interface Props {
  onBack: () => void;
}

type ViewState = 'web-data' | 'statement' | 'stockwise-statement' | 'earn' | 'incentive' | 'expense';

export const WebDataWorkspace: React.FC<Props> = ({ onBack }) => {
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    try {
      const saved = sessionStorage.getItem('dios_web_data_view') as ViewState;
      if (saved && ['web-data', 'statement', 'stockwise-statement', 'earn', 'incentive', 'expense'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'web-data';
  });

  const setAndSaveView = (v: ViewState) => {
    setAndSaveView(v);
    try {
      sessionStorage.setItem('dios_web_data_view', v);
    } catch {}
  };
  const [isDownloading, setIsDownloading] = useState(false);
  const [kvStatus, setKvStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cloud-storage?key=review/sheet_01_effort_level')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.updatedAt) {
          const dt = new Date(d.updatedAt);
          setKvStatus(dt.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      })
      .catch(() => {});
  }, []);

  const handleDownloadMaster = async () => {
    setIsDownloading(true);
    try {
      await generateMasterReviewWorkbook();
    } catch (e: any) {
      alert("Error generating Excel: " + e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* 🔙 TOP NAVBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={() => {
            if (currentView === 'stockwise-statement') setAndSaveView('statement');
            else if (currentView === 'statement') setAndSaveView('web-data');
            else if (currentView === 'incentive') setAndSaveView('earn');
            else if (currentView === 'earn') setAndSaveView('web-data');
            else onBack();
          }}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft size={16} /> 
          {currentView === 'stockwise-statement' 
            ? 'Back to Statement' 
            : currentView === 'statement' 
            ? 'Back to Web Data' 
            : currentView === 'incentive' 
            ? 'Back to Earn' 
            : currentView === 'earn' 
            ? 'Back to Web Data' 
            : 'Back to Hub'}
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[11px] bg-amber-950 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-amber-950/50">
            <Sparkles size={13} className="text-amber-400 animate-pulse" /> DIOS REPOSITORY &amp; EARNINGS
          </span>
        </div>
      </div>

      {/* 1️⃣ LEVEL 1: WEB DATA HOME (3 MAIN MODULES) */}
      {currentView === 'web-data' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
              <span className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl text-slate-950 shadow-lg shadow-amber-500/20">
                <Globe size={24} />
              </span>
              Web Data &amp; Statements Hub
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Archived Stockist Statements, 14-in-1 Master Review Workbook &amp; Performance Earnings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* MODULE 1: STATEMENT */}
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-6 transition shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                    <FileText size={22} />
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
                    Statements Vault
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">Statement</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Access 7-stockist statements and secondary sales repositories across 12 months.
                </p>
              </div>
              <button
                onClick={() => setAndSaveView('statement')}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              >
                Open Statement &rarr;
              </button>
            </div>

            {/* MODULE 2: 🌟 EARN (NEW INCENTIVE & EXPENSE) */}
            <div className="bg-slate-900 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-2xl p-6 transition shadow-2xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <Coins size={22} />
                  </span>
                  <span className="text-[10px] text-emerald-300 font-black bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500/40 font-mono">
                    NEW • EARNINGS
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Earn
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Quarterly &amp; Monthly Incentive calculations (Q1 to Q4) and Expense management.
                </p>
              </div>
              <button
                onClick={() => setAndSaveView('earn')}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition cursor-pointer"
              >
                Open Earn &rarr;
              </button>
            </div>

            {/* MODULE 3: 14-in-1 MASTER REVIEW EXCEL */}
            <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-6 transition shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl">
                    <Award size={22} />
                  </span>
                  <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                    16 Sheets Complete
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">
                  14-in-1 Master Review
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Consolidated single Excel workbook with official DIOS theme colors &amp; styling.
                </p>
              </div>

              <button
                onClick={handleDownloadMaster}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {isDownloading ? 'Building...' : 'Download Master Excel'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2️⃣ LEVEL 2 (A): STATEMENT REPOSITORIES */}
      {currentView === 'statement' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
              <span className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl text-slate-950 shadow-lg shadow-amber-500/20">
                <FileText size={24} />
              </span>
              Statement Repositories
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Select available stockist statements and secondary repositories.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-6 transition shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                  <FileSpreadsheet size={22} />
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">Archive Active</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Stockwise Statement</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Archived 7-distributor statements across all 12 months with product-level details.
                </p>
              </div>
              <button
                onClick={() => setAndSaveView('stockwise-statement')}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                Stockwise Statement &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2️⃣ LEVEL 2 (B): 🌟 EARN HUB (1. INCENTIVE | 2. EXPENSE) */}
      {currentView === 'earn' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
              <span className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                <Coins size={24} />
              </span>
              Earn &amp; Claims Hub
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Select performance incentives calculation or travel/daily field expenses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            
            {/* OPTION 1: INCENTIVE */}
            <div className="bg-slate-900 border-2 border-emerald-500/60 hover:border-emerald-400 rounded-2xl p-6 transition shadow-2xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <Award size={22} />
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                    Q1 to Q4 Active
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">1. Incentive</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Quarterly &amp; monthly incentive calculations for Rajasthan Zone with live auto-fill for Udaipur HQ (Banwari Lal Meena).
                </p>
              </div>

              <button
                onClick={() => setAndSaveView('incentive')}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition cursor-pointer"
              >
                Open Incentive &rarr;
              </button>
            </div>

            {/* OPTION 2: 🌟 ACTIVE EXPENSE WORKSPACE */}
            <div className="bg-slate-900 border-2 border-cyan-500/50 hover:border-cyan-400 rounded-2xl p-6 transition shadow-2xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl">
                    <Wallet size={22} />
                  </span>
                  <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30 font-mono">
                    LIVE CBO EXPENSE
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">2. Expense Statement</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Daily allowance (DA), travel fare (TA), doctor calls &amp; monthly tour claim submissions auto-synced with CBO.
                </p>
              </div>

              <button
                onClick={() => setAndSaveView('expense')}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950 transition cursor-pointer"
              >
                Open Expense Statement &rarr;
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3️⃣ LEVEL 3 (A): STOCKWISE STATEMENT VAULT */}
      {currentView === 'stockwise-statement' && (
        <StockwiseStatementVault onBack={() => setAndSaveView('statement')} />
      )}

      {/* 3️⃣ LEVEL 3 (B): 🌟 INCENTIVE WORKSPACE */}
      {currentView === 'incentive' && (
        <IncentiveWorkspace onBack={() => setAndSaveView('earn')} />
      )}

      {/* 3️⃣ LEVEL 3 (C): 🌟 EXPENSE STATEMENT WORKSPACE */}
      {currentView === 'expense' && (
        <ExpenseWorkspace onBack={() => setAndSaveView('earn')} />
      )}

    </div>
  );
};
