import React, { useState } from 'react';
import { 
  ArrowLeft, Globe, FileText, FileSpreadsheet, Download, 
  CheckCircle2, Sparkles, Loader2, Award, Coins, Wallet, DollarSign, Gift, Layers,
  Cake, Heart
} from 'lucide-react';
import { generateMasterReviewWorkbook } from '../exporters/masterReviewWorkbook';
import { StockwiseStatementVault } from './StockwiseStatementVault';
import { FreeGoodsVault } from './FreeGoodsVault';
import { PartywiseAggregatorVault } from './PartywiseAggregatorVault';
import { IncentiveWorkspace } from './IncentiveWorkspace';
import { ExpenseWorkspace } from './ExpenseWorkspace';
import { BirthdayAnniversaryWorkspace } from './BirthdayAnniversaryWorkspace';

interface Props {
  onBack: () => void;
}

type ViewState = 
  | 'web-data' 
  | 'statement' 
  | 'stockwise-statement' 
  | 'free-goods' 
  | 'partywise-analysis' 
  | 'earn' 
  | 'incentive' 
  | 'expense'
  | 'celebrations';

export const WebDataWorkspace: React.FC<Props> = ({ onBack }) => {
  const [currentView, setCurrentView] = useState<ViewState>('web-data');
  const [isDownloading, setIsDownloading] = useState(false);

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
            if (currentView === 'stockwise-statement' || currentView === 'free-goods' || currentView === 'partywise-analysis') setCurrentView('statement');
            else if (currentView === 'statement') setCurrentView('web-data');
            else if (currentView === 'incentive') setCurrentView('earn');
            else if (currentView === 'earn') setCurrentView('web-data');
            else if (currentView === 'celebrations') setCurrentView('web-data');
            else onBack();
          }}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft size={16} /> 
          {currentView === 'stockwise-statement' || currentView === 'free-goods' || currentView === 'partywise-analysis'
            ? 'Back to Statement' 
            : currentView === 'statement' 
            ? 'Back to Web Data' 
            : currentView === 'incentive' 
            ? 'Back to Earn' 
            : currentView === 'earn' 
            ? 'Back to Web Data' 
            : currentView === 'celebrations'
            ? 'Back to Web Data'
            : 'Back to Hub'}
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[11px] bg-amber-950 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-amber-950/50">
            <Sparkles size={13} className="text-amber-400 animate-pulse" /> DIOS REPOSITORY &amp; EARNINGS
          </span>
        </div>
      </div>

      {/* 1️⃣ LEVEL 1: WEB DATA HOME (4 MAIN CARDS) */}
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
              Archived Stockist Statements, Birthday &amp; Anniversary Hub, Free Goods Vault &amp; Master Review.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            
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
                  Access stockist statements, Free Goods Repository and Partywise Retailer Analysis.
                </p>
              </div>
              <button
                onClick={() => setCurrentView('statement')}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              >
                Open Statement &rarr;
              </button>
            </div>

            {/* 🌟 MODULE 2: BIRTHDAY & ANNIVERSARY HUB (NEW) */}
            <div className="bg-slate-900 border-2 border-pink-500/60 hover:border-pink-400 rounded-2xl p-6 transition shadow-2xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 bg-pink-500/20 text-pink-400 rounded-xl">
                    <Cake size={22} />
                  </span>
                  <span className="text-[10px] text-pink-300 font-black bg-pink-950 px-2.5 py-0.5 rounded-full border border-pink-500/40 font-mono">
                    NEW &bull; CELEBRATIONS
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">Birthday &amp; Anniversary</h3>
                <p className="text-xs text-slate-400 mt-1">
                  MSL Doctors DOB/DOA, 5 Stations (HQ &amp; Ex-HQ), Family Celebrations (Sons, Daughters, Father) &amp; Two-way MSL Sync.
                </p>
              </div>
              <button
                onClick={() => setCurrentView('celebrations')}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-950 transition cursor-pointer"
              >
                🎂 Open Celebrations &rarr;
              </button>
            </div>

            {/* MODULE 3: EARN */}
            <div className="bg-slate-900 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-2xl p-6 transition shadow-2xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <Coins size={22} />
                  </span>
                  <span className="text-[10px] text-emerald-300 font-black bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500/40 font-mono">
                    EARNINGS
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">Earn</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Quarterly &amp; Monthly Incentive calculations (Q1 to Q4) and Expense management.
                </p>
              </div>
              <button
                onClick={() => setCurrentView('earn')}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition cursor-pointer"
              >
                Open Earn &rarr;
              </button>
            </div>

            {/* MODULE 4: MASTER EXCEL */}
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

      {/* 2️⃣ LEVEL 2: STATEMENT REPOSITORIES */}
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
              Select stockist statements vault, Free Goods Repository, or Partywise Retailer Analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-6 transition shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl"><FileSpreadsheet size={22} /></span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">Archive Active</span>
                </div>
                <h3 className="text-lg font-bold text-white">Stockwise Statement</h3>
                <p className="text-xs text-slate-400 mt-1">Archived 7-distributor statements across all 12 months with product-level details.</p>
              </div>
              <button onClick={() => setCurrentView('stockwise-statement')} className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer">Open Stockwise Statement &rarr;</button>
            </div>

            <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-6 transition shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl"><Gift size={22} /></span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono font-bold">73 Master Products</span>
                </div>
                <h3 className="text-lg font-bold text-white">Free Goods Repository</h3>
                <p className="text-xs text-slate-400 mt-1">Party-wise free goods quantity entry, PTS rate validation &amp; CSV export.</p>
              </div>
              <button onClick={() => setCurrentView('free-goods')} className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer">Open Free Goods &rarr;</button>
            </div>

            <div className="bg-slate-900 border-2 border-cyan-500/50 hover:border-cyan-400 rounded-2xl p-6 transition shadow-2xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl"><Layers size={22} /></span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded font-mono font-bold">RETAILER INTELLIGENCE</span>
                </div>
                <h3 className="text-lg font-bold text-white">Partywise Analysis</h3>
                <p className="text-xs text-slate-400 mt-1">Consolidate retailer bills across stockists, parse addresses and link to MSL doctors.</p>
              </div>
              <button onClick={() => setCurrentView('partywise-analysis')} className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer">Open Partywise Analysis &rarr;</button>
            </div>
          </div>
        </div>
      )}

      {/* 2️⃣ LEVEL 2: EARN HUB */}
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
            <div className="bg-slate-900 border-2 border-emerald-500/60 hover:border-emerald-400 rounded-2xl p-6 transition shadow-2xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl"><Award size={22} /></span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">Q1 to Q4 Active</span>
                </div>
                <h3 className="text-lg font-bold text-white">1. Incentive</h3>
                <p className="text-xs text-slate-400 mt-1">Quarterly &amp; monthly incentive calculations for Rajasthan Zone with live auto-fill for Udaipur HQ.</p>
              </div>
              <button onClick={() => setCurrentView('incentive')} className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer">Open Incentive &rarr;</button>
            </div>

            <div className="bg-slate-900 border-2 border-cyan-500/50 hover:border-cyan-400 rounded-2xl p-6 transition shadow-2xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl"><Wallet size={22} /></span>
                  <span className="text-[10px] bg-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30 font-mono">LIVE CBO EXPENSE</span>
                </div>
                <h3 className="text-lg font-bold text-white">2. Expense Statement</h3>
                <p className="text-xs text-slate-400 mt-1">Daily allowance (DA), travel fare (TA), doctor calls &amp; monthly tour claim submissions.</p>
              </div>
              <button onClick={() => setCurrentView('expense')} className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer">Open Expense Statement &rarr;</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEWS RENDER */}
      {currentView === 'stockwise-statement' && (
        <StockwiseStatementVault onBack={() => setCurrentView('statement')} />
      )}

      {currentView === 'free-goods' && (
        <FreeGoodsVault onBack={() => setCurrentView('statement')} />
      )}

      {currentView === 'partywise-analysis' && (
        <PartywiseAggregatorVault onBack={() => setCurrentView('statement')} />
      )}

      {currentView === 'incentive' && (
        <IncentiveWorkspace onBack={() => setCurrentView('earn')} />
      )}

      {currentView === 'expense' && (
        <ExpenseWorkspace onBack={() => setCurrentView('earn')} />
      )}

      {currentView === 'celebrations' && (
        <BirthdayAnniversaryWorkspace onBack={() => setCurrentView('web-data')} />
      )}

    </div>
  );
};
