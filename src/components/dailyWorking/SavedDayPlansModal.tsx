import React, { useState, useMemo } from 'react';
import { 
  Calendar, MapPin, Search, Trash2, X, 
  CheckCircle2, AlertTriangle, Sparkles,
  FolderOpen, Stethoscope, ArrowRight
} from 'lucide-react';
import { DayPlanRecord, dailyWorkingStore } from '../../data/dailyWorkingStore';

interface SavedDayPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (dateStr: string) => void;
  currentActiveDate: string;
}

export const SavedDayPlansModal: React.FC<SavedDayPlansModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  currentActiveDate
}) => {
  const [search, setSearch] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const allPlans = useMemo(() => {
    return dailyWorkingStore.getAllSavedPlansList();
  }, [isOpen, refreshTrigger]);

  const filteredPlans = useMemo(() => {
    if (!search.trim()) return allPlans;
    const q = search.toLowerCase().trim();
    return allPlans.filter(p => {
      const matchDate = p.date.toLowerCase().includes(q);
      const matchDay = (p.dayOfWeek || '').toLowerCase().includes(q);
      const matchArea = (p.selectedAreas || []).some(a => a.toLowerCase().includes(q));
      const matchDoc = (p.plannedCalls || []).some(c => c.doctorName.toLowerCase().includes(q));
      return matchDate || matchDay || matchArea || matchDoc;
    });
  }, [allPlans, search]);

  if (!isOpen) return null;

  const handleDelete = (e: React.MouseEvent, dateStr: string) => {
    e.stopPropagation();
    if (window.confirm(`Kya aap ${dateStr} ka saved day plan delete karna chahte hain?`)) {
      dailyWorkingStore.deleteDayPlan(dateStr);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-purple-500/70 rounded-3xl max-w-3xl w-full p-5 md:p-6 shadow-2xl flex flex-col max-h-[92vh] space-y-4 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
              <FolderOpen size={22} />
            </span>
            <div>
              <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                All Saved Day Plans &amp; History
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  {allPlans.length} Total Saved Days
                </span>
              </h3>
              <p className="text-xs text-slate-400">View, search, or 1-click load and edit any previous day working plan</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by date (e.g. 21/09), day name, hospital area, or doctor name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs focus:border-purple-400 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Saved Plans List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[500px]">
          {filteredPlans.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono space-y-2">
              <Calendar size={28} className="mx-auto text-slate-600 mb-1" />
              <div>Koi saved day plan nahi mila.</div>
              {search && <div className="text-[11px] text-slate-400">Search query '{search}' clear karke dekhein.</div>}
            </div>
          ) : (
            filteredPlans.map(plan => {
              const isCurrentlyActive = plan.date === currentActiveDate;
              const callCount = plan.plannedCalls?.length || 0;
              const sampleDocs = (plan.plannedCalls || []).slice(0, 3).map(c => `Dr. ${c.doctorName}`).join(', ');

              return (
                <div
                  key={plan.date}
                  onClick={() => {
                    onSelectPlan(plan.date);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                    isCurrentlyActive
                      ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950'
                      : 'bg-slate-950 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-cyan-300">
                        {plan.date}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 font-sans">
                        ({plan.dayOfWeek})
                      </span>
                      {isCurrentlyActive && (
                        <span className="text-[9px] bg-purple-500 text-white font-black px-1.5 py-0.2 rounded-full uppercase tracking-tight">
                          Currently Active
                        </span>
                      )}
                      {plan.isSunday && (
                        <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded">
                          Sunday
                        </span>
                      )}
                      {plan.isHoliday && (
                        <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded">
                          {plan.holidayName || 'Holiday'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-amber-300 font-sans truncate">
                      <MapPin size={12} className="text-amber-400 shrink-0" />
                      <span className="truncate">{plan.selectedAreas?.join(', ') || 'No area set'}</span>
                    </div>

                    {sampleDocs && (
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        👨‍⚕️ {sampleDocs} {callCount > 3 ? `+${callCount - 3} more` : ''}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-400">
                      {callCount} Calls
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, plan.date)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition cursor-pointer"
                      title="Delete this saved plan"
                    >
                      <Trash2 size={15} />
                    </button>

                    <span className="p-1 text-slate-500 group-hover:text-purple-400 transition">
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Tip: Tap on any card above to instantly load that day's plan and route on screen.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
