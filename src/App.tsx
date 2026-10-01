import React, { useState } from 'react';
import { MainHub } from './components/MainHub';

// V1 Original Modules (100% Intact)
import { DiosWorkspace } from './components/DiosWorkspace';
import { ReviewFormatWorkspace } from './components/ReviewFormatWorkspace';

// V2 Upgraded Modules
import { DiosWorkspaceV2 } from './components/DiosWorkspace_v2';
import { ReviewFormatWorkspaceV2 } from './components/ReviewFormatWorkspace_v2';

import { WebDataWorkspace } from './components/WebDataWorkspace';
import { DailyWorkingWorkspace } from './components/DailyWorkingWorkspace';
import { DoctorCampWorkspace } from './components/DoctorCampWorkspace';
import { Zap, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeProject, setActiveProject] = useState<string | null>(null);
  
  // 🌟 DUAL-ENGINE SWITCHER (Default is V2 with all 3 issues fixed!)
  const [engineMode, setEngineMode] = useState<'V2' | 'V1'>('V2');

  const renderActiveWorkspace = () => {
    if (activeProject === 'camp-hub') {
      return <DoctorCampWorkspace onBack={() => setActiveProject(null)} />;
    }

    if (activeProject === 'dios' || activeProject === 'dios-aggregator') {
      return engineMode === 'V2' 
        ? <DiosWorkspaceV2 onBack={() => setActiveProject(null)} />
        : <DiosWorkspace onBack={() => setActiveProject(null)} />;
    }

    if (activeProject === 'dios-review') {
      return engineMode === 'V2'
        ? <ReviewFormatWorkspaceV2 onBack={() => setActiveProject(null)} />
        : <ReviewFormatWorkspace onBack={() => setActiveProject(null)} />;
    }

    if (activeProject === 'daily-working') {
      return <DailyWorkingWorkspace onBack={() => setActiveProject(null)} />;
    }

    if (activeProject === 'web-data') {
      return <WebDataWorkspace onBack={() => setActiveProject(null)} />;
    }

    return <MainHub onOpenProject={(id) => setActiveProject(id)} />;
  };

  return (
    <div className="relative min-h-screen">
      {/* 🌟 FLOATING ENGINE SWITCHER BADGE (TOP-RIGHT ON IPAD) */}
      <div className="fixed bottom-3 right-3 z-50 flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl">
        <button
          type="button"
          onClick={() => setEngineMode('V2')}
          className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
            engineMode === 'V2'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
          title="V2 Active: Zero-Loss Month Persistence & Cloud SyncBar"
        >
          <Zap size={12} className={engineMode === 'V2' ? 'text-yellow-300' : ''} />
          <span>V2 (New Fixed)</span>
        </button>

        <button
          type="button"
          onClick={() => setEngineMode('V1')}
          className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
            engineMode === 'V1'
              ? 'bg-slate-800 text-amber-300 shadow-md border border-amber-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Original Legacy V1 Mode"
        >
          <ShieldCheck size={12} />
          <span>V1 (Original)</span>
        </button>
      </div>

      {renderActiveWorkspace()}
    </div>
  );
}
