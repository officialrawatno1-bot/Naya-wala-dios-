import React, { useState } from 'react';
import { Calculator, Search, X, Check, Trash2, Edit3, Settings2 } from 'lucide-react';
import { MASTER_PRODUCTS } from '../data/masterProducts';
import { PartyParseSummary } from '../parsers/common';
import { memoryStore, DhruviProductEntry, DhruviValuationMode } from '../data/memoryStore';

export function evalExcelFormula(input: string): number {
  if (!input) return 0;
  let expr = String(input).trim();
  if (expr.startsWith('+')) expr = expr.substring(1).trim();
  if (!expr) return 0;

  if (!/^[\d\s+\-*/.]+$/.test(expr)) {
    const num = parseFloat(expr);
    return isNaN(num) ? 0 : num;
  }

  try {
    const res = new Function(`return (${expr})`)();
    const val = Number(res);
    return isNaN(val) ? 0 : Math.round(val * 100) / 100;
  } catch {
    const num = parseFloat(expr);
    return isNaN(num) ? 0 : num;
  }
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (summary: PartyParseSummary) => void;
  onClear: () => void;
}

export const DhruviManualModal: React.FC<Props> = ({ isOpen, onClose, onSave, onClear }) => {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Record<number, DhruviProductEntry>>(() => {
    return memoryStore.dhruviEntries || {};
  });

  const [manualPtsTotal, setManualPtsTotal] = useState<string>(() => {
    return memoryStore.dhruviManualPtsTotal || '';
  });

  const [manualPtrTotal, setManualPtrTotal] = useState<string>(() => {
    return memoryStore.dhruviManualPtrTotal || '';
  });

  const [valuationMode, setValuationMode] = useState<DhruviValuationMode>(() => {
    return memoryStore.dhruviValuationMode || 'PTS';
  });

  if (!isOpen) return null;

  const handleCellChange = (sn: number, field: 'sales' | 'closing', textVal: string) => {
    setDraft(prev => {
      const current = prev[sn] || { sn, salesFormula: '', salesQty: 0, closingFormula: '', closingQty: 0 };
      const evaluated = evalExcelFormula(textVal);

      return {
        ...prev,
        [sn]: {
          ...current,
          ...(field === 'sales'
            ? { salesFormula: textVal, salesQty: evaluated }
            : { closingFormula: textVal, closingQty: evaluated })
        }
      };
    });
  };

  const handleApply = () => {
    memoryStore.dhruviEntries = draft;
    memoryStore.dhruviManualPtsTotal = manualPtsTotal;
    memoryStore.dhruviManualPtrTotal = manualPtrTotal;
    memoryStore.dhruviValuationMode = valuationMode;

    const itemsMap: Record<number, { sales: number; closing: number }> = {};
    let totalSales = 0;
    let totalClosing = 0;
    let count = 0;

    MASTER_PRODUCTS.forEach(p => {
      const entry = draft[p.sn];
      if (entry && (entry.salesQty !== 0 || entry.closingQty !== 0)) {
        itemsMap[p.sn] = { sales: entry.salesQty, closing: entry.closingQty };
        totalSales += entry.salesQty;
        totalClosing += entry.closingQty;
        count++;
      }
    });

    const summary: PartyParseSummary = {
      partyName: 'Dhruvi',
      fileName: 'Manual Formula Entry',
      itemCount: count,
      totalSales,
      totalClosing,
      items: itemsMap
    };

    onSave(summary);
  };

  const handleReset = () => {
    if (window.confirm("Dhruvi ka saara data clear karna hai?")) {
      setDraft({});
      setManualPtsTotal('');
      setManualPtrTotal('');
      setValuationMode('PTS');
      memoryStore.dhruviEntries = {};
      memoryStore.dhruviManualPtsTotal = '';
      memoryStore.dhruviManualPtrTotal = '';
      memoryStore.dhruviValuationMode = 'PTS';
      onClear();
    }
  };

  // Calculations
  let totalLiveSalesUnits = 0;
  let totalLiveClosingUnits = 0;
  let totalLiveSalesPtsVal = 0;
  let totalLiveSalesPtrVal = 0;
  let totalLiveClosingPtsVal = 0;
  let totalLiveClosingPtrVal = 0;

  MASTER_PRODUCTS.forEach(p => {
    const entry = draft[p.sn];
    if (entry) {
      const sQty = entry.salesQty || 0;
      const cQty = entry.closingQty || 0;
      totalLiveSalesUnits += sQty;
      totalLiveClosingUnits += cQty;
      totalLiveSalesPtsVal += sQty * p.pts;
      totalLiveSalesPtrVal += sQty * (p.ptr || p.pts);
      totalLiveClosingPtsVal += cQty * p.pts;
      totalLiveClosingPtrVal += cQty * (p.ptr || p.pts);
    }
  });

  const parsedManualPts = parseFloat(manualPtsTotal.replace(/,/g, '')) || 0;
  const ptsVariance = parsedManualPts > 0 ? (totalLiveSalesPtsVal - parsedManualPts) : 0;

  const parsedManualPtr = parseFloat(manualPtrTotal.replace(/,/g, '')) || 0;
  const ptrVariance = parsedManualPtr > 0 ? (totalLiveSalesPtrVal - parsedManualPtr) : 0;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-5">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-7xl w-full p-4 md:p-6 shadow-2xl flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Calculator size={22} />
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Dhruvi Manual Sheet (PTS &amp; PTR Dual Valuation Engine)
              </h3>
              <p className="text-xs text-slate-400">
                Formula Support: <span className="text-amber-300 font-mono font-bold">+6+6 (=12)</span> or <span className="text-amber-300 font-mono font-bold">+6-2 (=4)</span>
              </p>
            </div>
          </div>

          {/* 🌟 EXCEL VALUATION MODE SELECTION DROPDOWN */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-2xl border-2 border-amber-500/50 shadow-md">
            <span className="text-[11px] text-amber-300 font-bold uppercase flex items-center gap-1">
              <Settings2 size={13} /> Excel Value Mode:
            </span>
            <select
              value={valuationMode}
              onChange={(e) => setValuationMode(e.target.value as DhruviValuationMode)}
              className="bg-slate-900 border border-slate-700 text-amber-300 text-xs font-bold font-mono rounded-xl px-2.5 py-1 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="PTS">🔹 Calculated PTS (₹{Math.round(totalLiveSalesPtsVal).toLocaleString()})</option>
              <option value="PTR">🔸 Calculated PTR (₹{Math.round(totalLiveSalesPtrVal).toLocaleString()})</option>
              <option value="MANUAL_PTS">✏️ Manual Target PTS (₹{manualPtsTotal ? Number(manualPtsTotal).toLocaleString() : '0'})</option>
              <option value="MANUAL_PTR">✏️ Manual Target PTR (₹{manualPtrTotal ? Number(manualPtrTotal).toLocaleString() : '0'})</option>
            </select>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* 🌟 4 TOP CARDS: SUMMARY & DUAL MANUAL TARGET BOXES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          
          {/* Card 1: Sales Secondary Summary */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-cyan-500/30 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Sales Units (SEC)</span>
              <span className="text-cyan-400 font-bold font-mono">{totalLiveSalesUnits.toLocaleString()} Units</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">PTS Val:</span>
              <span className="text-cyan-300 font-bold">₹ {Math.round(totalLiveSalesPtsVal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-amber-400 font-semibold">PTR Val:</span>
              <span className="text-amber-300 font-bold">₹ {Math.round(totalLiveSalesPtrVal).toLocaleString()}</span>
            </div>
          </div>

          {/* Card 2: Closing Stock Summary */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-emerald-500/30 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              <span>Closing Stock (CL)</span>
              <span className="text-emerald-400 font-bold font-mono">{totalLiveClosingUnits.toLocaleString()} Units</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">PTS Val:</span>
              <span className="text-emerald-300 font-bold">₹ {Math.round(totalLiveClosingPtsVal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-amber-400 font-semibold">PTR Val:</span>
              <span className="text-amber-300 font-bold">₹ {Math.round(totalLiveClosingPtrVal).toLocaleString()}</span>
            </div>
          </div>

          {/* Card 3: 🟡 USER MANUAL PTS TARGET INPUT BOX */}
          <div className="p-3 bg-slate-950 rounded-2xl border-2 border-cyan-500/60 shadow-lg shadow-cyan-950/30 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-cyan-300 uppercase font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Edit3 size={13} className="text-cyan-400" /> Manual Target PTS (₹)</span>
                {parsedManualPts > 0 && (
                  <span className={`text-[10px] font-mono font-bold ${ptsVariance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {ptsVariance >= 0 ? '+' : ''}₹{Math.round(ptsVariance).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Enter custom PTS target value:</p>
            </div>
            <input
              type="text"
              placeholder="e.g. 45000"
              value={manualPtsTotal}
              onChange={(e) => setManualPtsTotal(e.target.value)}
              className="w-full bg-slate-900 border border-cyan-500/50 text-cyan-300 font-mono font-bold text-sm rounded-xl px-3 py-1.5 mt-1.5 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Card 4: 🟠 USER MANUAL PTR TARGET INPUT BOX */}
          <div className="p-3 bg-slate-950 rounded-2xl border-2 border-amber-500/60 shadow-lg shadow-amber-950/30 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-amber-300 uppercase font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Edit3 size={13} className="text-amber-400" /> Manual Target PTR (₹)</span>
                {parsedManualPtr > 0 && (
                  <span className={`text-[10px] font-mono font-bold ${ptrVariance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {ptrVariance >= 0 ? '+' : ''}₹{Math.round(ptrVariance).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Enter custom PTR target value:</p>
            </div>
            <input
              type="text"
              placeholder="e.g. 50000"
              value={manualPtrTotal}
              onChange={(e) => setManualPtrTotal(e.target.value)}
              className="w-full bg-slate-900 border border-amber-500/50 text-amber-300 font-mono font-bold text-sm rounded-xl px-3 py-1.5 mt-1.5 focus:outline-none focus:border-amber-400"
            />
          </div>

        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search in 73 products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* 73 Products Table */}
        <div className="overflow-y-auto flex-1 border border-slate-800 rounded-xl pr-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
              <tr>
                <th className="p-2 text-center w-10">S.N.</th>
                <th className="p-2 min-w-[180px]">Product Name</th>
                <th className="p-2 text-center w-16">Pack</th>
                <th className="p-2 text-right w-20 text-slate-300">PTS (₹)</th>
                <th className="p-2 text-right w-20 text-amber-300">PTR (₹)</th>
                <th className="p-2 text-center min-w-[150px] text-cyan-400 bg-cyan-950/20">
                  Sec Sales (Formula)
                </th>
                <th className="p-2 text-right min-w-[110px] text-cyan-300 bg-cyan-950/10">
                  Sales (PTS / PTR ₹)
                </th>
                <th className="p-2 text-center min-w-[150px] text-emerald-400 bg-emerald-950/20">
                  Closing (Formula)
                </th>
                <th className="p-2 text-right min-w-[110px] text-emerald-300 bg-emerald-950/10">
                  Closing (PTS / PTR ₹)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {MASTER_PRODUCTS
                .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || String(p.sn).includes(search))
                .map(p => {
                  const entry = draft[p.sn] || { sn: p.sn, salesFormula: '', salesQty: 0, closingFormula: '', closingQty: 0 };
                  const lineSalesPts = entry.salesQty * p.pts;
                  const lineSalesPtr = entry.salesQty * (p.ptr || p.pts);
                  const lineClosingPts = entry.closingQty * p.pts;
                  const lineClosingPtr = entry.closingQty * (p.ptr || p.pts);

                  return (
                    <tr key={p.sn} className="hover:bg-slate-800/40 transition">
                      <td className="p-2 text-center text-slate-500 font-mono">{p.sn}</td>
                      <td className="p-2 font-medium text-white">{p.name}</td>
                      <td className="p-2 text-center text-slate-400 font-mono">{p.pack || '-'}</td>
                      <td className="p-2 text-right font-mono text-slate-300">{p.pts.toFixed(2)}</td>
                      <td className="p-2 text-right font-mono text-amber-300 font-bold">{p.ptr.toFixed(2)}</td>

                      {/* Sales Formula Cell */}
                      <td className="p-1 text-center bg-cyan-950/10">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={entry.salesFormula}
                            onChange={e => handleCellChange(p.sn, 'sales', e.target.value)}
                            placeholder="0"
                            className="w-full py-1 px-2 bg-slate-950 rounded-lg font-mono text-xs text-cyan-300 font-bold border border-slate-800 focus:border-cyan-400 focus:outline-none text-center"
                          />
                          {entry.salesFormula && entry.salesFormula !== String(entry.salesQty) && (
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded font-mono font-bold shrink-0">
                              ={entry.salesQty}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sales Values (PTS & PTR) */}
                      <td className="p-1.5 text-right font-mono bg-cyan-950/5">
                        {entry.salesQty > 0 ? (
                          <div className="leading-tight">
                            <div className="text-cyan-300 font-bold">₹{Math.round(lineSalesPts).toLocaleString()} <span className="text-[9px] text-slate-400">PTS</span></div>
                            <div className="text-amber-300 font-semibold text-[10px]">₹{Math.round(lineSalesPtr).toLocaleString()} <span className="text-[9px] text-slate-400">PTR</span></div>
                          </div>
                        ) : '-'}
                      </td>

                      {/* Closing Formula Cell */}
                      <td className="p-1 text-center bg-emerald-950/10">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={entry.closingFormula}
                            onChange={e => handleCellChange(p.sn, 'closing', e.target.value)}
                            placeholder="0"
                            className="w-full py-1 px-2 bg-slate-950 rounded-lg font-mono text-xs text-emerald-300 font-bold border border-slate-800 focus:border-emerald-400 focus:outline-none text-center"
                          />
                          {entry.closingFormula && entry.closingFormula !== String(entry.closingQty) && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded font-mono font-bold shrink-0">
                              ={entry.closingQty}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Closing Values (PTS & PTR) */}
                      <td className="p-1.5 text-right font-mono bg-emerald-950/5">
                        {entry.closingQty > 0 ? (
                          <div className="leading-tight">
                            <div className="text-emerald-300 font-bold">₹{Math.round(lineClosingPts).toLocaleString()} <span className="text-[9px] text-slate-400">PTS</span></div>
                            <div className="text-amber-300 font-semibold text-[10px]">₹{Math.round(lineClosingPtr).toLocaleString()} <span className="text-[9px] text-slate-400">PTR</span></div>
                          </div>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 mt-2">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 size={13} /> Clear Dhruvi Data
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Check size={15} /> Save &amp; Sync With Aggregator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
