import React, { useState } from 'react';
import { Search, FolderGit2, ChevronRight, Activity, ShieldCheck, Database, FileText } from 'lucide-react';

interface Props {
  onOpenProject: (projectId: string) => void;
}

export const MainHub: React.FC<Props> = ({ onOpenProject }) => {
  const [hubSearch, setHubSearch] = useState('');

  const projects = [
    {
      id: 'dios',
      name: 'DIOS Pharma Suite',
      description: 'Centralized Pharma Sales Automation & Review System for Udaipur HQ.',
      category: 'Pharma Analytics',
      status: 'Live (v52.0 Production)'
    }
  ];

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(hubSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(hubSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 max-w-6xl mx-auto">
      {/* 🚀 TOP BANNER */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-cyan-950 via-slate-900 to-emerald-950 border border-cyan-500/40 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Activity size={22} className="animate-pulse" />
          </span>
          <div>
            <div className="text-xs font-black tracking-wide text-emerald-400 uppercase flex items-center gap-2">
              <span>● SYSTEM V56.0 LIVE (COMPACT & COLUMN TOGGLES)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">DUAL ENGINE READY</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Live CBO Sync • Statement Aggregator • 14 Review Formats
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={16} className="text-cyan-400" /> Cloudflare Production
        </div>
      </div>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <FolderGit2 className="text-cyan-400" size={32} />
            Dev Workspace Hub
          </h1>
          <p className="text-slate-400 text-sm mt-1">iPad Codespace Managed Multi-Project Platform</p>
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
        {/* Card 1: Statement Aggregator */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-6 transition duration-200 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Primary & Secondary
              </span>
              <Database size={20} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Statement Aggregator
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Unit Sales Progression (HQ Total) aggregator for 6 Distributors + Live CBO Primary Dispatch (Dual Engine: Web Scraper & CBO Excel).
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

        {/* Card 2: Data Hub -> Review Format */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-6 transition duration-200 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Data Hub
              </span>
              <FileText size={20} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Performance Review
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Access and manage all 14 Monthly Performance Review formats (Effort Level, Sales Performance, ROI, MSL, Camp Details & more).
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
