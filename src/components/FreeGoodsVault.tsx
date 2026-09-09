import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Download, RefreshCw, Search, 
  CheckCircle2, Layers, FileSpreadsheet, Sparkles, Building2, Trash2, Calendar
} from 'lucide-react';
import { MASTER_PRODUCTS } from '../data/masterProducts';
import { freeGoodsStore, FREE_GOODS_PARTIES } from '../data/freeGoodsStore';
import { exportFreeGoodsPartyCSV, exportFreeGoodsMasterExcel } from '../exporters/freeGoodsExporter';
import { CloudSyncBar } from './CloudSyncBar';

const MONTH_OPTIONS = [
  { label: 'Apr-2026', code: 'APR' },
  { label: 'May-2026', code: 'MAY' },
  { label: 'Jun-2026', code: 'JUN' },
  { label: 'Jul-2026', code: 'JUL' },
  { label: 'Aug-2026', code: 'AUG' },
  { label: 'Sep-2026', code: 'SEP' },
  { label: 'Oct-2026', code: 'OCT' },
  { label: 'Nov-2026', code: 'NOV' },
  { label: 'Dec-2026', code: 'DEC' },
  { label: 'Jan-2027', code: 'JAN' },
  { label: 'Feb-2027', code: 'FEB' },
  { label: 'Mar-2027', code: 'MAR' },
];

interface Props {
  onBack: () => void;
}

export const FreeGoodsVault: React.FC<Props> = ({ onBack }) => {
  const [selectedMonthCode, setSelectedMonthCode] = useState('JUN');
  const [activeTab, setActiveTab] = useState<string>('dwarika');
  const [search, setSearch] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const currentPartyMeta = FREE_GOODS_PARTIES.find(p => p.id === activeTab) || FREE_GOODS_PARTIES[0];

  const currentSummary = useMemo(() => {
    return freeGoodsStore.getPartySummary(selectedMonthCode, activeTab, currentPartyMeta.name);
  }, [selectedMonthCode, activeTab, currentPartyMeta, refreshTrigger]);

  const filteredProducts = useMemo(() => {
    return MASTER_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || String(p.sn).includes(search)
    );
  }, [search]);

  const handleQtyChange = (sn: number, val: string) => {
    freeGoodsStore.updateCell(selectedMonthCode, activeTab, sn, val);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleClearParty = () => {
    if (window.confirm(`Kya aap ${currentPartyMeta.name} ke ${selectedMonthCode} ke saare Free Goods clear karna chahte hain?`)) {
      freeGoodsStore.clearMonth(selectedMonthCode, activeTab);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const grandMetrics = useMemo(() => {
    let totQ = 0;
    let totA = 0;
    FREE_GOODS_PARTIES.forEach(pt => {
      const s = freeGoodsStore.getPartySummary(selectedMonthCode, pt.id, pt.name);
      totQ += s.totalQty;
      totA += s.totalAmount;
    });
    return { totQ, totA: Number(totA.toFixed(2)) };
  }, [selectedMonthCode, refreshTrigger]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 transition cursor-pointer text-xs font-semibold"
          >
            <ArrowLeft size={15} /> Back to Statement
          </button>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              FREE GOODS REPOSITORY (73 MASTER PRODUCTS)
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <Sparkles size={10} /> CSV Format Matching
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              BE: BANWARI LAL MEENA • HQ: UDAIPUR • Party-wise Free Goods Qty &amp; Valuation
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-500/40">
            <Calendar size={13} className="text-amber-400" />
            <span className="text-xs text-slate-400 font-semibold">Month:</span>
            <select
              value={selectedMonthCode}
              onChange={(e) => setSelectedMonthCode(e.target.value)}
              className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
            >
              {MONTH_OPTIONS.map(opt => (
                <option key={opt.code} value={opt.code} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => exportFreeGoodsPartyCSV(selectedMonthCode, activeTab, currentPartyMeta.name)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow"
            title="Download CSV matching exact user template format"
          >
            <Download size={14} /> Export Party CSV
          </button>

          <button
            onClick={() => exportFreeGoodsMasterExcel(selectedMonthCode)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow"
          >
            <FileSpreadsheet size={14} /> Master Excel
          </button>
        </div>
      </div>

      <CloudSyncBar
        storageKey={`statements/free_goods_${selectedMonthCode}_2026`}
        sheetTitle={`Free Goods Repository (${selectedMonthCode})`}
        getData={() => ({ selectedMonthCode, store: freeGoodsStore['data'] })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.store) {
            freeGoodsStore['data'] = cloudData.store;
            setRefreshTrigger(prev => prev + 1);
          }
        }}
        onSaveLocal={() => {
          setRefreshTrigger(prev => prev + 1);
        }}
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Selected Party</div>
          <div className="text-sm font-bold text-white font-mono mt-0.5 truncate">
            {currentSummary.partyName}
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-cyan-400 uppercase font-semibold">Party Free Qty</div>
          <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
            {currentSummary.totalQty.toLocaleString()} Units
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-amber-400 uppercase font-semibold">Party Free Amount</div>
          <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
            ₹ {currentSummary.totalAmount.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-emerald-400 uppercase font-semibold">Grand Total ({selectedMonthCode})</div>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
            ₹ {grandMetrics.totA.toLocaleString()} ({grandMetrics.totQ} Qty)
          </div>
        </div>
      </div>

      {/* Party Switcher Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800">
        {FREE_GOODS_PARTIES.map(party => {
          const isSelected = activeTab === party.id;
          const sum = freeGoodsStore.getPartySummary(selectedMonthCode, party.id, party.name);
          const hasQty = sum.totalQty > 0;

          return (
            <button
              key={party.id}
              onClick={() => setActiveTab(party.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                isSelected 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md' 
                  : hasQty
                  ? 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${hasQty ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
              <span>{party.name}</span>
              {hasQty && <span className="text-[10px] font-mono opacity-85">({sum.totalQty})</span>}
            </button>
          );
        })}
      </div>

      {/* Search & Clear Bar */}
      <div className="flex items-center justify-between gap-3">
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

        <button
          onClick={handleClearParty}
          className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          <Trash2 size={13} /> Clear {currentPartyMeta.tag}
        </button>
      </div>

      {/* 73 Master Products Free Goods Table */}
      <div className="overflow-x-auto max-h-[520px] border border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
            <tr>
              <th className="p-2.5 text-center w-12">S.NO.</th>
              <th className="p-2.5 min-w-[220px]">BRAND NAME (Product)</th>
              <th className="p-2.5 text-right w-24 text-slate-300">PTS (₹)</th>
              <th className="p-2.5 text-center w-28 text-amber-400 bg-amber-950/20">QTY. (Free)</th>
              <th className="p-2.5 text-right min-w-[130px] text-emerald-400 bg-emerald-950/20">AMOUNT (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {filteredProducts.map(p => {
              const it = currentSummary.items[p.sn];
              const qVal = it ? it.qty : '';
              const amtVal = it ? it.amount : 0;
              const hasQty = qVal !== '' && Number(qVal) > 0;

              return (
                <tr key={p.sn} className={`hover:bg-slate-800/40 transition ${hasQty ? 'bg-amber-950/15' : ''}`}>
                  <td className="p-2 text-center text-slate-500">{p.sn}</td>
                  <td className="p-2 font-sans font-semibold text-white">{p.name}</td>
                  <td className="p-2 text-right text-slate-300">{p.pts.toFixed(2)}</td>
                  
                  <td className="p-1 text-center bg-amber-950/10">
                    <input
                      type="text"
                      value={qVal}
                      onChange={e => handleQtyChange(p.sn, e.target.value)}
                      placeholder="-"
                      className="w-20 py-1 px-1 bg-slate-950 text-amber-300 font-mono font-bold rounded-lg border border-slate-800 focus:border-amber-400 focus:outline-none text-center text-xs"
                    />
                  </td>

                  <td className="p-2 text-right font-bold text-emerald-400 bg-emerald-950/10">
                    {amtVal > 0 ? `₹${amtVal.toLocaleString()}` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-amber-500/40 font-bold z-10 text-xs">
            <tr>
              <td className="p-3 text-center text-amber-400 font-mono">Σ</td>
              <td className="p-3 text-white uppercase" colSpan={2}>TOTAL FOR {currentSummary.partyName}</td>
              <td className="p-3 text-center font-mono font-black text-amber-300 bg-amber-950/40 text-sm">
                {currentSummary.totalQty.toLocaleString()}
              </td>
              <td className="p-3 text-right font-mono font-black text-emerald-300 bg-emerald-950/40 text-sm">
                ₹{currentSummary.totalAmount.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  );
};
