import React, { useState } from 'react';
import { 
  ArrowLeft, FileText, Sparkles, Activity, Calendar, 
  TrendingUp, Table2, AlertTriangle, CheckCircle2, Layers, DollarSign, Target, HeartPulse, UserCheck
} from 'lucide-react';

import {
  EffortLevelSheet,
  MonthFwProgressSheet,
  SalesPerformanceSheet,
  UnSalesProgSheet,
  NearByExpirySheet,
  CommitmentSheet,
  WcfyhSheet,
  A2GheeValrosSheet,
  TableTopSheet,
  GlucometerCampSheet,
  SpecialFocusedBrandsSheet,
  FocusedBrandsSheet,
  RoiSheet,
  MslSheet,
  DayWiseCallStatusSheet
} from './review';

interface Props {
  onBack: () => void;
}

const REVIEW_NAV = [
  { id: '1', title: '1. Effort Level', short: 'Effort Level', icon: Activity },
  { id: '2', title: '2. Month FW Progress', short: 'FW Progress', icon: Calendar },
  { id: '3', title: '3. Sales Performance', short: 'Performance', icon: TrendingUp },
  { id: '4', title: '4. Un. Sales Prog', short: 'Un. Sales Prog', icon: Table2 },
  { id: '5', title: '5. Near By Expiry', short: 'Expiry', icon: AlertTriangle },
  { id: '6', title: '6. Commitment', short: 'Commitment', icon: CheckCircle2 },
  { id: '7', title: '7. WCFYH', short: 'WCFYH', icon: HeartPulse },
  { id: '8', title: '8. A2 Ghee Valros', short: 'A2 Ghee', icon: Layers },
  { id: '9', title: '9. Table Top', short: 'Table Top', icon: Layers },
  { id: '10', title: '10. Glucometer Camp', short: 'Glucometer', icon: Activity },
  { id: '11', title: '11. Special Focused', short: 'Special Brands', icon: TrendingUp },
  { id: '12', title: '12. Focused Brands', short: 'Focused Brands', icon: Target },
  { id: '13', title: '13. ROI', short: 'ROI Analysis', icon: DollarSign },
  { id: '14', title: '14. MSL', short: 'MSL Schedule', icon: Calendar },
  { id: '15', title: '15. Day Wise Calls', short: 'Call Status', icon: UserCheck },
];

export const ReviewFormatWorkspace: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('15');

  const renderSheetContent = () => {
    switch (activeTab) {
      case '1': return <EffortLevelSheet />;
      case '2': return <MonthFwProgressSheet />;
      case '3': return <SalesPerformanceSheet />;
      case '4': return <UnSalesProgSheet />;
      case '5': return <NearByExpirySheet />;
      case '6': return <CommitmentSheet />;
      case '7': return <WcfyhSheet />;
      case '8': return <A2GheeValrosSheet />;
      case '9': return <TableTopSheet />;
      case '10': return <GlucometerCampSheet />;
      case '11': return <SpecialFocusedBrandsSheet />;
      case '12': return <FocusedBrandsSheet />;
      case '13': return <RoiSheet />;
      case '14': return <MslSheet />;
      case '15': return <DayWiseCallStatusSheet />;
      default: return <EffortLevelSheet />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft size={16} /> Back to Hub
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50">
            <Sparkles size={13} className="text-emerald-400 animate-pulse" /> DIOS V59.0 REVIEW HUB (AUTO MEMORY SYNC)
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
          <span className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
            <FileText size={24} />
          </span>
          Monthly Performance Review Format
        </h1>
        <p className="text-slate-400 text-xs md:text-sm mt-1">
          15 Modular Review Sheets with Live CBO DCR, Calls Status, and Sales Integration.
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {REVIEW_NAV.map((nav) => {
          const Icon = nav.icon;
          const isActive = activeTab === nav.id;
          return (
            <button
              key={nav.id}
              onClick={() => setActiveTab(nav.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <Icon size={14} />
              {nav.short}
            </button>
          );
        })}
      </div>

      <div className="transition-all duration-300">
        {renderSheetContent()}
      </div>
    </div>
  );
};
