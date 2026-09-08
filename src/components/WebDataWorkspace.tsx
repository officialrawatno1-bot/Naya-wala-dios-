import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Globe, FileText, FileSpreadsheet, Download, 
  CheckCircle2, Sparkles, Loader2, Award 
} from 'lucide-react';
import { generateMasterReviewWorkbook } from '../exporters/masterReviewWorkbook';
import { StockwiseStatementVault } from './StockwiseStatementVault';

interface Props {
  onBack: () => void;
}

type ViewState = 'web-data' | 'statement' | 'stockwise-statement';

export const WebDataWorkspace: React.FC<Props> = ({ onBack }) => {
  const [currentView, setCurrentView] = useState<ViewState>('web-data');
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
      
      {/* 🔙 TOP NAVBAR: Exact Data Hub Style */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={() => {
            if (currentView === 'stockwise-statement') setCurrentView('statement');
            else if (currentView === 'statement') setCurrentView('web-data');
            else onBack();
          }}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft size={16} /> 
          {currentView === 'stockwise-statement' ? 'Back to Statement' : currentView === 'statement' ? 'Back to Web Data' : 'Back to Hub'}
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[11px] bg-amber-950 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-amber-950/50">
            <Sparkles size={13} className="text-amber-400 animate-pulse" /> DIOS WEB REPOSITORY
          </span>
        </div>
      </div>

      {/* 1️⃣ LEVEL 1: WEB DATA HOME */}
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
              Archived Stockist Statements, Monthly Performance Review Workbook &amp; CBO Reports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* BUTTON 1: STATEMENT */}
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
                  Access archived stockist-wise statements and secondary sales repositories.
                </p>
              </div>
              <button
                onClick={() => setCurrentView('statement')}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              >
                Open Statement &rarr;
              </button>
            </div>

            {/* BUTTON 2: 14-in-1 MASTER REVIEW EXCEL */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-6 transition shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <Award size={22} />
                  </span>
                  <span className="text-[10px] text-emerald-300 font-black bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                    <Sparkles size={11} className="animate-pulse" /> 100% COMPLETE (14 SHEETS)
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  14-in-1 Master Review Excel
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  All 14 company review sheets consolidated in 1 workbook (Exact Colors, Fonts &amp; Layout).
                </p>

                <div className="mt-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Cloud KV Sync:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> {kvStatus ? kvStatus : 'Connected'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownloadMaster}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {isDownloading ? 'Building Master Excel...' : '⚡ Download 14-in-1 Master Excel'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2️⃣ LEVEL 2: STATEMENT SELECTOR */}
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
                onClick={() => setCurrentView('stockwise-statement')}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                Stockwise Statement &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3️⃣ LEVEL 3: STOCKWISE STATEMENT (Data Hub Master Layout) */}
      {currentView === 'stockwise-statement' && (
        <StockwiseStatementVault onBack={() => setCurrentView('statement')} />
      )}

    </div>
  );
};
