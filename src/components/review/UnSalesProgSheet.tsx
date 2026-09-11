import React, { useState } from 'react';
import { Table2, Search, Zap, Download, Check, Info, Trash2, RefreshCw } from 'lucide-react';
import { MASTER_PRODUCTS } from '../../data/masterProducts';
import { unProgressionStore, MONTH_CODES } from '../../data/unProgressionStore';
import { memoryStore } from '../../data/memoryStore';
import { CloudSyncBar } from '../CloudSyncBar';

const INITIAL_BASE_PRIMARY: Record<string, string> = {
  APR: '4.34', MAY: '4.75', JUN: '5.07', JUL: '4.84', AUG: '4.98', SEP: '5.28', OCT: '4.70', NOV: '4.93', DEC: '5.30', JAN: '4.97', FEB: '4.69', MAR: '4.55'
};

export const UnSalesProgSheet: React.FC = () => {
  const [search, setSearch] = useState('');
  const [targetMonth, setTargetMonth] = useState(() => {
    try {
      return localStorage.getItem('dios_draft_sheet_04_target_month') || 'AUG';
    } catch (e) {
      return 'AUG';
    }
  });
  const [gridData, setGridData] = useState(() => {
    try {
      const saved = localStorage.getItem('dios_un_sales_progression_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return unProgressionStore.getData();
  });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const filtered = MASTER_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || String(p.sn).includes(search)
  );

  const handleCellChange = (month: string, sn: number, field: 'netPri' | 'netSec' | 'closing', valStr: string) => {
    const val = parseFloat(valStr) || 0;
    unProgressionStore.updateCell(month, sn, field, val);
    setGridData({ ...unProgressionStore.getData() });
  };

  const handleAutoSyncFromMemory = () => {
    setGridData({ ...unProgressionStore.getData() });
    setStatusMsg(`🎉 Synced '${targetMonth}' from Statement Aggregator!`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleSyncWithPerformance = () => {
    let secValSum = 0;
    const monthMap: Record<string, string> = { APR: 'APR', MAY: 'MAY', JUN: 'JUN', JUL: 'JUL', AUG: 'AUG', SEP: 'SEP', OCT: 'OCT', NOV: 'NOV', DEC: 'DEC', JAN: 'JAN', FEB: 'FEB', MAR: 'MAR' };
    const code = monthMap[targetMonth] || 'AUG';
    
    MASTER_PRODUCTS.forEach(p => {
      const it = gridData[targetMonth]?.[p.sn];
      if (it) {
        secValSum += (it.netSec || 0) * p.pts;
      }
    });

    const secLacs = (secValSum / 100000).toFixed(2);
    
    if (!memoryStore.salesPerformanceData) {
      memoryStore.salesPerformanceData = {};
    }
    if (!memoryStore.salesPerformanceData.sec_curr) {
      memoryStore.salesPerformanceData.sec_curr = { ...INITIAL_BASE_PRIMARY };
    }
    memoryStore.salesPerformanceData.sec_curr[code] = secLacs;

    setStatusMsg(`🔄 Synced ${targetMonth}: Secondary Sales ₹${secLacs}L updated in Sales Performance section!`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleClearMonth = () => {
    if (window.confirm(`Are you sure you want to clear all quantities for ${targetMonth} 2026?`)) {
      unProgressionStore.clearMonth(targetMonth);
      setGridData({ ...unProgressionStore.getData() });
      setStatusMsg(`🧹 Cleared all data for ${targetMonth}!`);
      setTimeout(() => setStatusMsg(null), 2500);
    }
  };

  // 100% UNTOUCHED Export CSV
  const handleExportCSV = () => {
    let csv = `UNIT SALES PROGRESSION (HQ TOTAL)\n`;
    csv += `S.N.,PRODUCT NAME,PTS,` + MONTH_CODES.map(m => `${m} PRI,${m} SEC,${m} CL`).join(',') + `,CUMM PRI,CUMM SEC,CUMM CL,TOTAL SEC VAL (Rs)\n`;
    
    MASTER_PRODUCTS.forEach(p => {
      let cummPri = 0;
      let cummSec = 0;
      let cummCl = 0;
      
      const mCells: string[] = [];
      MONTH_CODES.forEach(m => {
        const item = gridData[m]?.[p.sn] || { netPri: 0, netSec: 0, closing: 0 };
        cummPri += item.netPri || 0;
        cummSec += item.netSec || 0;
        cummCl += item.closing || 0;
        mCells.push(`${item.netPri || ''},${item.netSec || ''},${item.closing || ''}`);
      });

      const totalVal = cummSec * p.pts;
      csv += `${p.sn},"${p.name}",${p.pts.toFixed(2)},${mCells.join(',')},${cummPri},${cummSec},${cummCl},${Math.round(totalVal)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `4_UN_SALES_PROG_HQ_TOTAL.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">
      
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
            <Table2 size={22} />
          </span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              4. UNIT SALES PROGRESSION (HQ TOTAL)
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                Cloud Sync Ready
              </span>
            </h2>
            <p className="text-xs text-slate-400">Fixed Column Widths • Mutual Sync with Sales Performance</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-cyan-500/40">
            <span className="text-xs text-slate-400 font-semibold">Month:</span>
            <select
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-400 focus:outline-none cursor-pointer"
            >
              {MONTH_CODES.map(m => (
                <option key={m} value={m} className="bg-slate-900 text-white">{m} 2026</option>
              ))}
            </select>

            <button
              onClick={handleAutoSyncFromMemory}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-cyan-600/20 transition cursor-pointer"
            >
              <Zap size={14} className="text-yellow-300" /> Auto-Sync {targetMonth}
            </button>
          </div>

          <button
            onClick={handleSyncWithPerformance}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            title="Push secondary valuation to Sales Performance section"
          >
            <RefreshCw size={14} /> Sync ↔ Performance
          </button>

          <button
            onClick={handleClearMonth}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-semibold transition cursor-pointer"
            title="Clear all quantities for selected month"
          >
            <Trash2 size={14} /> Clear Month
          </button>

          {/* 100% UNTOUCHED Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* ☁️ DEDICATED CLOUD SYNC TOOLBAR */}
      <CloudSyncBar
        storageKey="review/sheet_04_un_sales_progression"
        sheetTitle="4. Unit Sales Progression (HQ Total)"
        getData={() => ({
          progressionData: unProgressionStore.getData(),
          targetMonth
        })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.progressionData) {
            setGridData(cloudData.progressionData);
            unProgressionStore.syncFromAggregator('AUG', []); // refresh store
            try {
              localStorage.setItem('dios_un_sales_progression_v1', JSON.stringify(cloudData.progressionData));
            } catch (e) {}
          }
          if (cloudData.targetMonth) {
            setTargetMonth(cloudData.targetMonth);
          }
        }}
        onSaveLocal={() => {
          try {
            localStorage.setItem('dios_un_sales_progression_v1', JSON.stringify(gridData));
            localStorage.setItem('dios_draft_sheet_04_target_month', targetMonth);
          } catch (e) {}
        }}
      />

      {statusMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <Check size={16} className="text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search in 73 products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Info size={14} className="text-cyan-400" />
          <span>Column widths are fixed so table never collapses when clearing data!</span>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[620px] border border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-30">
            <tr>
              <th rowSpan={2} className="p-2.5 text-center w-10 bg-slate-950 border-r border-slate-800 sticky left-0 z-40">S.N.</th>
              <th rowSpan={2} className="p-2.5 min-w-[200px] bg-slate-950 border-r border-slate-800 sticky left-10 z-40">Product Name</th>
              <th rowSpan={2} className="p-2.5 text-right w-20 bg-slate-950 border-r border-slate-800 sticky left-[240px] z-40">PTS (₹)</th>
              {MONTH_CODES.map(m => (
                <th
                  key={m}
                  colSpan={3}
                  className={`p-2 text-center border-r border-slate-800 ${m === targetMonth ? 'bg-cyan-950/60 text-cyan-300 font-extrabold border-b-2 border-cyan-400' : 'bg-slate-950'}`}
                >
                  {m} 2026
                </th>
              ))}
              <th colSpan={3} className="p-2 text-center bg-purple-950/40 text-purple-300 border-r border-slate-800">CUMM UNITS</th>
              <th rowSpan={2} className="p-2.5 text-right min-w-[110px] bg-emerald-950/40 text-emerald-300 font-bold">TOTAL SEC (₹)</th>
            </tr>
            <tr className="border-b border-slate-800 text-[10px]">
              {MONTH_CODES.map(m => (
                <React.Fragment key={m}>
                  <th className="p-1 text-center text-blue-400 bg-slate-950/80 w-16 min-w-[64px]">PRI</th>
                  <th className="p-1 text-center text-cyan-400 bg-slate-950/80 w-16 min-w-[64px]">SEC</th>
                  <th className="p-1 text-center text-emerald-400 bg-slate-950/80 w-16 min-w-[64px] border-r border-slate-800">CL</th>
                </React.Fragment>
              ))}
              <th className="p-1 text-center text-blue-300 bg-purple-950/30 w-16 min-w-[64px]">PRI</th>
              <th className="p-1 text-center text-cyan-300 bg-purple-950/30 w-16 min-w-[64px]">SEC</th>
              <th className="p-1 text-center text-emerald-300 bg-purple-950/30 w-16 min-w-[64px] border-r border-slate-800">CL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map(p => {
              let cummPri = 0;
              let cummSec = 0;
              let cummCl = 0;

              return (
                <tr key={p.sn} className="hover:bg-slate-800/40 transition">
                  <td className="p-2 text-center text-slate-500 font-mono border-r border-slate-800/60 sticky left-0 bg-slate-900 z-25 w-10">{p.sn}</td>
                  <td className="p-2 font-medium text-white border-r border-slate-800/60 sticky left-10 bg-slate-900 z-25 min-w-[200px]">{p.name}</td>
                  <td className="p-2 text-right font-mono text-amber-300 border-r border-slate-800/60 sticky left-[240px] bg-slate-900 z-25 w-20">{p.pts.toFixed(2)}</td>

                  {MONTH_CODES.map(m => {
                    const item = gridData[m]?.[p.sn] || { netPri: 0, netSec: 0, closing: 0 };
                    cummPri += item.netPri || 0;
                    cummSec += item.netSec || 0;
                    cummCl += item.closing || 0;
                    const isTarget = m === targetMonth;

                    return (
                      <React.Fragment key={m}>
                        <td className={`p-0.5 text-center w-16 min-w-[64px] ${isTarget ? 'bg-blue-950/20' : ''}`}>
                          <input
                            type="text"
                            value={item.netPri !== 0 ? item.netPri : ''}
                            onChange={e => handleCellChange(m, p.sn, 'netPri', e.target.value)}
                            placeholder="-"
                            className="w-full py-1 px-1 bg-transparent text-center font-mono text-xs text-blue-300 focus:bg-slate-950 focus:outline-none"
                          />
                        </td>
                        <td className={`p-0.5 text-center w-16 min-w-[64px] ${isTarget ? 'bg-cyan-950/20' : ''}`}>
                          <input
                            type="text"
                            value={item.netSec !== 0 ? item.netSec : ''}
                            onChange={e => handleCellChange(m, p.sn, 'netSec', e.target.value)}
                            placeholder="-"
                            className="w-full py-1 px-1 bg-transparent text-center font-mono text-xs text-cyan-300 font-bold focus:bg-slate-950 focus:outline-none"
                          />
                        </td>
                        <td className={`p-0.5 text-center w-16 min-w-[64px] border-r border-slate-800/60 ${isTarget ? 'bg-emerald-950/20' : ''}`}>
                          <input
                            type="text"
                            value={item.closing !== 0 ? item.closing : ''}
                            onChange={e => handleCellChange(m, p.sn, 'closing', e.target.value)}
                            placeholder="-"
                            className="w-full py-1 px-1 bg-transparent text-center font-mono text-xs text-emerald-300 font-bold focus:bg-slate-950 focus:outline-none"
                          />
                        </td>
                      </React.Fragment>
                    );
                  })}

                  <td className="p-2 text-center font-mono text-blue-300 bg-purple-950/10 w-16 min-w-[64px]">{cummPri || '-'}</td>
                  <td className="p-2 text-center font-mono text-cyan-300 font-bold bg-purple-950/10 w-16 min-w-[64px]">{cummSec || '-'}</td>
                  <td className="p-2 text-center font-mono text-emerald-300 font-bold bg-purple-950/10 border-r border-slate-800/60 w-16 min-w-[64px]">{cummCl || '-'}</td>

                  <td className="p-2 text-right font-mono text-emerald-400 font-bold bg-emerald-950/10 min-w-[110px]">
                    {cummSec > 0 ? `₹${Math.round(cummSec * p.pts).toLocaleString()}` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-cyan-500/40 font-bold z-30 shadow-2xl text-[11px]">
            <tr>
              <td className="p-2.5 text-center text-cyan-400 font-mono border-r border-slate-800 sticky left-0 bg-slate-950 z-40">Σ</td>
              <td className="p-2.5 text-white border-r border-slate-800 sticky left-10 bg-slate-950 z-40">TOTAL UNITS</td>
              <td className="p-2.5 text-right font-mono text-slate-500 border-r border-slate-800 sticky left-[240px] bg-slate-950 z-40">-</td>
              {MONTH_CODES.map(m => {
                let priSum = 0, secSum = 0, clSum = 0;
                MASTER_PRODUCTS.forEach(p => {
                  const it = gridData[m]?.[p.sn];
                  if (it) {
                    priSum += it.netPri || 0;
                    secSum += it.netSec || 0;
                    clSum += it.closing || 0;
                  }
                });
                return (
                  <React.Fragment key={m}>
                    <td className="p-2 text-center font-mono text-blue-300 bg-blue-950/40 w-16 min-w-[64px]">{priSum || '-'}</td>
                    <td className="p-2 text-center font-mono text-cyan-300 bg-cyan-950/40 w-16 min-w-[64px]">{secSum || '-'}</td>
                    <td className="p-2 text-center font-mono text-emerald-300 bg-emerald-950/40 border-r border-slate-800 w-16 min-w-[64px]">{clSum || '-'}</td>
                  </React.Fragment>
                );
              })}
              <td colSpan={3} className="p-2 text-center text-purple-300 font-mono bg-purple-950/40 border-r border-slate-800">12M Units</td>
              <td className="p-2 text-right font-mono text-emerald-300 bg-emerald-950/40">-</td>
            </tr>

            {/* METHOD 1: CALCULATED PRIMARY VALUE */}
            <tr>
              <td className="p-2.5 text-center text-blue-400 font-mono border-r border-slate-800 sticky left-0 bg-slate-950 z-40">Pri 1</td>
              <td className="p-2.5 text-blue-300 border-r border-slate-800 sticky left-10 bg-slate-950 z-40">PRIMARY VALUE (Calculated Units × PTS)</td>
              <td className="p-2.5 text-right font-mono text-slate-500 border-r border-slate-800 sticky left-[240px] bg-slate-950 z-40">₹</td>
              {MONTH_CODES.map(m => {
                let priValSum = 0;
                MASTER_PRODUCTS.forEach(p => {
                  const it = gridData[m]?.[p.sn];
                  if (it) {
                    priValSum += (it.netPri || 0) * p.pts;
                  }
                });
                return (
                  <td key={m} colSpan={3} className="p-2 text-center font-mono text-blue-300 bg-blue-950/20 border-r border-slate-800">
                    {priValSum > 0 ? `₹${(priValSum / 100000).toFixed(2)}L` : '-'}
                  </td>
                );
              })}
              <td colSpan={4} className="p-2 text-center text-blue-300 font-mono bg-blue-950/30">Calc Pri Total</td>
            </tr>

            {/* METHOD 2: SALES PERFORMANCE SECTION SYNC */}
            <tr>
              <td className="p-2.5 text-center text-indigo-400 font-mono border-r border-slate-800 sticky left-0 bg-slate-950 z-40">Pri 2</td>
              <td className="p-2.5 text-indigo-300 border-r border-slate-800 sticky left-10 bg-slate-950 z-40">PRIMARY VALUE (Sales Performance Section Sync)</td>
              <td className="p-2.5 text-right font-mono text-slate-500 border-r border-slate-800 sticky left-[240px] bg-slate-950 z-40">₹</td>
              {MONTH_CODES.map(m => {
                const perfMap = memoryStore.salesPerformanceData?.primary_curr || INITIAL_BASE_PRIMARY;
                const lacsVal = parseFloat(perfMap[m] || '0') || 0;
                return (
                  <td key={m} colSpan={3} className="p-2 text-center font-mono text-indigo-300 bg-indigo-950/20 border-r border-slate-800">
                    {lacsVal > 0 ? `₹${lacsVal}L` : '-'}
                  </td>
                );
              })}
              <td colSpan={4} className="p-2 text-center text-indigo-300 font-mono bg-indigo-950/30">Section Sync Total</td>
            </tr>

            {/* SECONDARY VALUE */}
            <tr>
              <td className="p-2.5 text-center text-cyan-400 font-mono border-r border-slate-800 sticky left-0 bg-slate-950 z-40">Sec</td>
              <td className="p-2.5 text-cyan-300 border-r border-slate-800 sticky left-10 bg-slate-950 z-40">SECONDARY VALUE (Sec × PTS)</td>
              <td className="p-2.5 text-right font-mono text-slate-500 border-r border-slate-800 sticky left-[240px] bg-slate-950 z-40">₹</td>
              {MONTH_CODES.map(m => {
                let secValSum = 0;
                MASTER_PRODUCTS.forEach(p => {
                  const it = gridData[m]?.[p.sn];
                  if (it) {
                    secValSum += (it.netSec || 0) * p.pts;
                  }
                });
                return (
                  <td key={m} colSpan={3} className="p-2 text-center font-mono text-cyan-300 bg-cyan-950/20 border-r border-slate-800">
                    {secValSum > 0 ? `₹${(secValSum / 100000).toFixed(2)}L` : '-'}
                  </td>
                );
              })}
              <td colSpan={4} className="p-2 text-center text-cyan-300 font-mono bg-cyan-950/30">Total Sec Value</td>
            </tr>

            {/* CLOSING VALUE */}
            <tr>
              <td className="p-2.5 text-center text-emerald-400 font-mono border-r border-slate-800 sticky left-0 bg-slate-950 z-40">Cl</td>
              <td className="p-2.5 text-emerald-300 border-r border-slate-800 sticky left-10 bg-slate-950 z-40">CLOSING VALUE (Closing × PTS)</td>
              <td className="p-2.5 text-right font-mono text-slate-500 border-r border-slate-800 sticky left-[240px] bg-slate-950 z-40">₹</td>
              {MONTH_CODES.map(m => {
                let clValSum = 0;
                MASTER_PRODUCTS.forEach(p => {
                  const it = gridData[m]?.[p.sn];
                  if (it) {
                    clValSum += (it.closing || 0) * p.pts;
                  }
                });
                return (
                  <td key={m} colSpan={3} className="p-2 text-center font-mono text-emerald-300 bg-emerald-950/20 border-r border-slate-800">
                    {clValSum > 0 ? `₹${(clValSum / 100000).toFixed(2)}L` : '-'}
                  </td>
                );
              })}
              <td colSpan={4} className="p-2 text-center text-emerald-300 font-mono bg-emerald-950/30">Total Closing Value</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
