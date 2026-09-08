import React, { useState } from 'react';
import { 
  ArrowLeft, FileSpreadsheet, Bot, Download, Loader2, 
  Building2, Check, AlertTriangle, RefreshCw, Layers, Calendar
} from 'lucide-react';
import { memoryStore, DEFAULT_STOCKISTS } from '../data/memoryStore';

interface Props {
  onBack: () => void;
}

const MONTH_OPTIONS = [
  { label: 'Apr-2026', value: 'Apr-2026' },
  { label: 'May-2026', value: 'May-2026' },
  { label: 'Jun-2026', value: 'Jun-2026' },
  { label: 'Jul-2026', value: 'Jul-2026' },
  { label: 'Aug-2026', value: 'Aug-2026' },
  { label: 'Sep-2026', value: 'Sep-2026' },
  { label: 'Oct-2026', value: 'Oct-2026' },
  { label: 'Nov-2026', value: 'Nov-2026' },
  { label: 'Dec-2026', value: 'Dec-2026' },
  { label: 'Jan-2027', value: 'Jan-2027' },
  { label: 'Feb-2027', value: 'Feb-2027' },
  { label: 'Mar-2027', value: 'Mar-2027' },
];

export const StockwiseStatementWorkspace: React.FC<Props> = ({ onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState('Aug-2026');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mCode = selectedMonth.substring(0, 3).toUpperCase();
  const returnItems = memoryStore.salesBreakdown[`sales_returns_${mCode}`] || [];
  const expiryItems = memoryStore.salesBreakdown[`expiry_${mCode}`] || [];

  const handleFetchStockwise = async () => {
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(`CBO se ${selectedMonth} ka Stockwise Statement live fetch ho raha hai...`);

    try {
      const res = await fetch('/api/fetch-sales-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_month: selectedMonth,
          to_month: selectedMonth,
          fy_year: '2026-2027'
        })
      });

      const data = await res.json();

      if (data && data.success) {
        if (data.sales_return_breakdown) {
          memoryStore.salesBreakdown[`sales_returns_${mCode}`] = data.sales_return_breakdown;
        }
        if (data.expiry_breakdown) {
          memoryStore.salesBreakdown[`expiry_${mCode}`] = data.expiry_breakdown;
        }

        setStatusMsg(`🎉 SUCCESS! ${selectedMonth} Stockwise Statement loaded successfully!`);
      } else {
        throw new Error(data?.error || 'Stockwise statement fetch failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'CBO fetch error');
      setStatusMsg('');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    let csv = `STOCKWISE STATEMENT - ${selectedMonth}\n`;
    csv += `S.N.,STOCKIST NAME,CATEGORY,AMOUNT (Rs),REMARKS\n`;
    let sn = 1;
    returnItems.forEach(it => {
      csv += `${sn++},"${it.partyName}","Sales Return",${it.amount},"${it.note || ''}"\n`;
    });
    expiryItems.forEach(it => {
      csv += `${sn++},"${it.partyName}","Expiry Return",${it.amount},"${it.note || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Stockwise_Statement_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft size={16} /> Back to Hub
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span>Web Data ➔ Statement ➔</span>
          <span className="text-amber-400 font-bold">Stockwise Statement</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl text-slate-950 shadow-lg shadow-amber-500/20">
              <FileSpreadsheet size={24} />
            </span>
            Stockwise Statement
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Live CBO SPO Stockist-wise sales, returns, and expiry breakdown
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
            <Calendar size={14} className="text-amber-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
            >
              {MONTH_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleFetchStockwise}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Bot size={15} />}
            {loading ? 'Fetching CBO...' : '⚡ Auto-Fetch Stockwise'}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <Check size={16} className="text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-950/70 border border-rose-500/50 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Returns */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={16} /> Stockist Sales Returns ({selectedMonth})
            </h3>
            <span className="text-xs font-mono font-bold text-cyan-300">
              Total: ₹{returnItems.reduce((acc, it) => acc + (it.amount || 0), 0).toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[350px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <th className="p-2.5 text-center w-12">#</th>
                  <th className="p-2.5">Stockist Name</th>
                  <th className="p-2.5 text-right w-28">Amount (₹)</th>
                  <th className="p-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {returnItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500">
                      No sales returns recorded for {selectedMonth}.
                    </td>
                  </tr>
                ) : (
                  returnItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-2 font-bold text-white">{item.partyName}</td>
                      <td className="p-2 text-right font-mono font-bold text-cyan-300">₹{Number(item.amount).toLocaleString()}</td>
                      <td className="p-2 text-slate-400">{item.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expiry */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} /> Stockist Expiry Breakdown ({selectedMonth})
            </h3>
            <span className="text-xs font-mono font-bold text-amber-300">
              Total: ₹{expiryItems.reduce((acc, it) => acc + (it.amount || 0), 0).toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[350px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <th className="p-2.5 text-center w-12">#</th>
                  <th className="p-2.5">Stockist Name</th>
                  <th className="p-2.5 text-right w-28">Amount (₹)</th>
                  <th className="p-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expiryItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500">
                      No expiry records for {selectedMonth}.
                    </td>
                  </tr>
                ) : (
                  expiryItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-2 font-bold text-white">{item.partyName}</td>
                      <td className="p-2 text-right font-mono font-bold text-amber-300">₹{Number(item.amount).toLocaleString()}</td>
                      <td className="p-2 text-slate-400">{item.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
