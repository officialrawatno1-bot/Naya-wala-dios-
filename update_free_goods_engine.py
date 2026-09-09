import os, sys, subprocess

print("==========================================================================")
print("🧠 [1/3] UPDATING FREE GOODS STORE WITH PARTYWISE SYNC & BREAKDOWN ENGINE...")
print("==========================================================================")

# 1. Update src/data/freeGoodsStore.ts
store_code = """import { MASTER_PRODUCTS } from './masterProducts';
import { partywiseAggregatorStore } from './partywiseAggregatorStore';

export interface FreeGoodsItem {
  sn: number;
  productName: string;
  pts: number;
  qty: number | '';
  amount: number;
  chemistCount?: number;
}

export interface ChemistFreeDistributionItem {
  retailerName: string;
  address: string;
  salesQty: number;
  freeQty: number;
  totalUnits: number;
  rate: number;
  freeAmount: number;
}

export interface PartyFreeGoodsSummary {
  partyName: string;
  monthCode: string;
  items: Record<number, FreeGoodsItem>;
  totalQty: number;
  totalAmount: number;
}

export const FREE_GOODS_PARTIES = [
  { id: 'dwarika', name: 'Dwarika Medicals', tag: 'Dwarika' },
  { id: 'modi', name: 'Modi Distributors', tag: 'Modi' },
  { id: 'vardhman', name: 'Shree Vardhman', tag: 'Vardhman' },
  { id: 'nagda', name: 'Nagda Distributors', tag: 'Nagda' },
  { id: 'sun', name: 'Sun Distributors', tag: 'Sun' },
  { id: 'rp', name: 'R.P. Agencies', tag: 'R.P.' },
];

const STORAGE_KEY = 'dios_free_goods_vault_v1';

export class FreeGoodsStore {
  public data: Record<string, Record<string, Record<number, number>>>;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  }

  // 🌟 AUTO-SYNC FROM PARTYWISE ANALYSIS (Dwarika / All Stockists)
  public syncFromPartywise(monthCode: string, partyId: string = 'dwarika'): { syncedCount: number; totalFreeUnits: number } {
    if (!this.data[monthCode]) this.data[monthCode] = {};
    if (!this.data[monthCode][partyId]) this.data[monthCode][partyId] = {};

    const partyRecords = partywiseAggregatorStore.data[monthCode] || [];
    let syncedCount = 0;
    let totalFreeUnits = 0;

    const productFreeMap: Record<number, number> = {};

    partyRecords.forEach(r => {
      if (r.freeQty > 0) {
        productFreeMap[r.productSn] = (productFreeMap[r.productSn] || 0) + r.freeQty;
        totalFreeUnits += r.freeQty;
      }
    });

    MASTER_PRODUCTS.forEach(p => {
      if (productFreeMap[p.sn] !== undefined && productFreeMap[p.sn] > 0) {
        this.data[monthCode][partyId][p.sn] = productFreeMap[p.sn];
        syncedCount++;
      }
    });

    this.persist();
    return { syncedCount, totalFreeUnits };
  }

  // 🌟 GET SPECIFIC CHEMISTS WHO RECEIVED FREE GOODS FOR A PRODUCT
  public getChemistFreeDistribution(monthCode: string, partyId: string, productSn: number): ChemistFreeDistributionItem[] {
    const partyRecords = partywiseAggregatorStore.data[monthCode] || [];
    const list: ChemistFreeDistributionItem[] = [];

    partyRecords.forEach(r => {
      if (r.productSn === productSn && r.freeQty > 0) {
        const rate = r.rate || 0;
        list.push({
          retailerName: r.retailerName,
          address: r.address,
          salesQty: r.salesQty || 0,
          freeQty: r.freeQty,
          totalUnits: (r.salesQty || 0) + r.freeQty,
          rate: rate,
          freeAmount: Number((r.freeQty * rate).toFixed(2))
        });
      }
    });

    return list.sort((a, b) => b.freeQty - a.freeQty);
  }

  public getPartySummary(monthCode: string, partyId: string, partyName: string): PartyFreeGoodsSummary {
    if (!this.data[monthCode]) this.data[monthCode] = {};
    if (!this.data[monthCode][partyId]) {
      this.data[monthCode][partyId] = {};
      // Attempt auto-fill from partywise if available
      this.syncFromPartywise(monthCode, partyId);
    }

    const partyQtys = this.data[monthCode][partyId] || {};
    const items: Record<number, FreeGoodsItem> = {};
    let totalQty = 0;
    let totalAmount = 0;

    const partyRecords = partywiseAggregatorStore.data[monthCode] || [];

    MASTER_PRODUCTS.forEach(p => {
      const q = partyQtys[p.sn] !== undefined ? partyQtys[p.sn] : '';
      const qtyNum = typeof q === 'number' ? q : 0;
      const amount = Number((qtyNum * p.pts).toFixed(2));

      // Calculate how many distinct chemists got this free item
      const chemistsForThisProduct = partyRecords.filter(r => r.productSn === p.sn && r.freeQty > 0).length;

      items[p.sn] = {
        sn: p.sn,
        productName: p.name,
        pts: p.pts,
        qty: q,
        amount,
        chemistCount: chemistsForThisProduct
      };

      totalQty += qtyNum;
      totalAmount += amount;
    });

    return {
      partyName,
      monthCode,
      items,
      totalQty,
      totalAmount: Number(totalAmount.toFixed(2))
    };
  }

  public updateCell(monthCode: string, partyId: string, sn: number, qtyVal: any) {
    if (!this.data[monthCode]) this.data[monthCode] = {};
    if (!this.data[monthCode][partyId]) this.data[monthCode][partyId] = {};

    const num = qtyVal === '' ? 0 : (parseFloat(qtyVal) || 0);
    if (num === 0) {
      delete this.data[monthCode][partyId][sn];
    } else {
      this.data[monthCode][partyId][sn] = num;
    }
    this.persist();
  }

  public clearMonth(monthCode: string, partyId: string) {
    if (this.data[monthCode]) {
      this.data[monthCode][partyId] = {};
      this.persist();
    }
  }

  public persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {}
  }
}

export const freeGoodsStore = new FreeGoodsStore();
"""

with open('src/data/freeGoodsStore.ts', 'w', encoding='utf-8') as f:
    f.write(store_code)
print("✅ 1. freeGoodsStore.ts updated.")

# 2. Update src/components/FreeGoodsVault.tsx with Auto-Sync & Tap Breakdown Modal
vault_code = """import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Download, RefreshCw, Search, 
  CheckCircle2, Layers, FileSpreadsheet, Sparkles, Building2, 
  Trash2, Calendar, Eye, Zap, X, Gift, Store, TrendingUp, HelpCircle
} from 'lucide-react';
import { MASTER_PRODUCTS, MasterProduct } from '../data/masterProducts';
import { freeGoodsStore, FREE_GOODS_PARTIES, ChemistFreeDistributionItem } from '../data/freeGoodsStore';
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
  const [selectedMonthCode, setSelectedMonthCode] = useState('AUG');
  const [activeTab, setActiveTab] = useState<string>('dwarika');
  const [search, setSearch] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // 🌟 BREAKDOWN MODAL STATE
  const [breakdownTargetProduct, setBreakdownTargetProduct] = useState<MasterProduct | null>(null);

  const currentPartyMeta = FREE_GOODS_PARTIES.find(p => p.id === activeTab) || FREE_GOODS_PARTIES[0];

  const currentSummary = useMemo(() => {
    return freeGoodsStore.getPartySummary(selectedMonthCode, activeTab, currentPartyMeta.name);
  }, [selectedMonthCode, activeTab, currentPartyMeta, refreshTrigger]);

  const chemistBreakdownList = useMemo(() => {
    if (!breakdownTargetProduct) return [];
    return freeGoodsStore.getChemistFreeDistribution(selectedMonthCode, activeTab, breakdownTargetProduct.sn);
  }, [selectedMonthCode, activeTab, breakdownTargetProduct, refreshTrigger]);

  const filteredProducts = useMemo(() => {
    return MASTER_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || String(p.sn).includes(search)
    );
  }, [search]);

  const handleQtyChange = (sn: number, val: string) => {
    freeGoodsStore.updateCell(selectedMonthCode, activeTab, sn, val);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAutoSyncFromPartywise = () => {
    const { syncedCount, totalFreeUnits } = freeGoodsStore.syncFromPartywise(selectedMonthCode, activeTab);
    setRefreshTrigger(prev => prev + 1);
    if (syncedCount > 0) {
      setStatusMsg(`🎉 SUCCESS! Partywise Analysis se ${syncedCount} Products ke ${totalFreeUnits} Free Units auto-fetch ho gaye!`);
    } else {
      setStatusMsg(`ℹ️ Partywise Analysis me ${selectedMonthCode} ke liye koi Free Goods record nahi mila.`);
    }
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleClearParty = () => {
    if (window.confirm(`Kya aap ${currentPartyMeta.name} ke ${selectedMonthCode} ke saare Free Goods clear karna chahte hain?`)) {
      freeGoodsStore.clearMonth(selectedMonthCode, activeTab);
      setRefreshTrigger(prev => prev + 1);
      setStatusMsg(`🧹 ${currentPartyMeta.name} data cleared.`);
      setTimeout(() => setStatusMsg(null), 2500);
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
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <Sparkles size={10} /> Auto-Fetch &bull; Tap Qty for Breakdown
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              BE: BANWARI LAL MEENA &bull; HQ: UDAIPUR &bull; Auto-Synced with Partywise Analysis Chemist Distribution
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
            onClick={handleAutoSyncFromPartywise}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
            title="Auto-fetch free quantities directly from Partywise Analysis"
          >
            <Zap size={14} /> ⚡ Auto-Sync from Partywise
          </button>

          <button
            onClick={() => exportFreeGoodsPartyCSV(selectedMonthCode, activeTab, currentPartyMeta.name)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow"
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
        getData={() => ({ selectedMonthCode, store: freeGoodsStore.data })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.store) {
            freeGoodsStore.data = cloudData.store;
            freeGoodsStore.persist();
            setRefreshTrigger(prev => prev + 1);
          }
        }}
        onSaveLocal={() => {
          freeGoodsStore.persist();
          setRefreshTrigger(prev => prev + 1);
        }}
      />

      {statusMsg && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="p-1 hover:text-white cursor-pointer"><X size={15} /></button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Selected Stockist</div>
          <div className="text-sm font-bold text-white font-mono mt-0.5 truncate">
            {currentSummary.partyName}
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-cyan-400 uppercase font-semibold">Stockist Free Units</div>
          <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
            {currentSummary.totalQty.toLocaleString()} <span className="text-xs text-slate-400">Free Qty</span>
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-amber-400 uppercase font-semibold">Free Stock Value (PTS)</div>
          <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
            ₹{currentSummary.totalAmount.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-emerald-400 uppercase font-semibold">Grand Total ({selectedMonthCode})</div>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
            {grandMetrics.totQ.toLocaleString()} Units &bull; ₹{grandMetrics.totA.toLocaleString()}
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

      {/* 🌟 73 MASTER PRODUCTS FREE GOODS TABLE (TAP QTY TO VIEW CHEMISTS BREAKDOWN) */}
      <div className="overflow-x-auto max-h-[540px] border border-slate-800 rounded-2xl shadow-xl bg-slate-950">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
            <tr>
              <th className="p-3 text-center w-12">S.NO.</th>
              <th className="p-3 min-w-[220px]">BRAND NAME (Product)</th>
              <th className="p-3 text-right w-24 text-slate-300">PTS (₹)</th>
              <th className="p-3 text-center w-40 text-amber-400 bg-amber-950/30">
                QTY. (Free Goods) 💡
              </th>
              <th className="p-3 text-right min-w-[130px] text-emerald-400 bg-emerald-950/20">
                FREE AMOUNT (₹)
              </th>
              <th className="p-3 text-center w-36">Chemist Distribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
            {filteredProducts.map(p => {
              const it = currentSummary.items[p.sn];
              const qVal = it ? it.qty : '';
              const amtVal = it ? it.amount : 0;
              const hasQty = qVal !== '' && Number(qVal) > 0;
              const chemistCount = it?.chemistCount || 0;

              return (
                <tr key={p.sn} className={`hover:bg-slate-800/50 transition ${hasQty ? 'bg-amber-950/15' : ''}`}>
                  <td className="p-2.5 text-center text-slate-500">{p.sn}</td>
                  <td className="p-2.5 font-sans font-bold text-white">{p.name}</td>
                  <td className="p-2.5 text-right text-slate-300">{p.pts.toFixed(2)}</td>
                  
                  {/* 🌟 CLICKABLE FREE QTY CELL WITH INPUT & BADGE */}
                  <td className="p-1.5 text-center bg-amber-950/10">
                    <div className="flex items-center justify-center gap-1.5">
                      <input
                        type="text"
                        value={qVal}
                        onChange={e => handleQtyChange(p.sn, e.target.value)}
                        placeholder="-"
                        className="w-16 py-1 px-1 bg-slate-950 text-amber-300 font-mono font-black rounded-lg border border-slate-800 focus:border-amber-400 focus:outline-none text-center text-xs"
                      />
                      {hasQty && (
                        <button
                          type="button"
                          onClick={() => setBreakdownTargetProduct(p)}
                          className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md text-[10px] transition cursor-pointer shadow-sm flex items-center gap-0.5 shrink-0"
                          title="Click to view which chemists received free goods"
                        >
                          <Eye size={10} /> View
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="p-2.5 text-right font-black text-emerald-400 bg-emerald-950/10">
                    {amtVal > 0 ? `₹${amtVal.toLocaleString()}` : '-'}
                  </td>

                  {/* Chemist Distribution Button */}
                  <td className="p-2 text-center font-sans">
                    {hasQty ? (
                      <button
                        type="button"
                        onClick={() => setBreakdownTargetProduct(p)}
                        className="px-3 py-1 bg-slate-950 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                      >
                        <Store size={12} className="text-cyan-400" />
                        <span>{chemistCount > 0 ? `${chemistCount} Chemists` : 'View List'}</span>
                      </button>
                    ) : (
                      <span className="text-slate-600 text-[11px]">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-amber-500/40 font-bold z-10 text-xs font-mono">
            <tr>
              <td className="p-3 text-center text-amber-400">Σ</td>
              <td className="p-3 text-white uppercase font-sans" colSpan={2}>TOTAL FOR {currentSummary.partyName}</td>
              <td className="p-3 text-center font-black text-amber-300 bg-amber-950/40 text-sm">
                {currentSummary.totalQty.toLocaleString()} Units
              </td>
              <td className="p-3 text-right font-black text-emerald-300 bg-emerald-950/40 text-sm">
                ₹{currentSummary.totalAmount.toLocaleString()}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 🌟 CHEMIST FREE GOODS DISTRIBUTION BREAKDOWN MODAL */}
      {breakdownTargetProduct && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-5">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-3xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                  <Gift size={22} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {breakdownTargetProduct.name}
                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                      PTS: ₹{breakdownTargetProduct.pts.toFixed(2)}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Free Goods Distribution Breakdown &bull; {currentPartyMeta.name} ({selectedMonthCode} 2026)
                  </p>
                </div>
              </div>
              <button onClick={() => setBreakdownTargetProduct(null)} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            {/* Distribution Summary Strip */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-sans block">Total Free Given</span>
                <span className="text-base font-black text-amber-400">
                  {chemistBreakdownList.reduce((acc, c) => acc + c.freeQty, 0)} Units
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-sans block">Total Chemist Stores</span>
                <span className="text-base font-black text-cyan-300">
                  {chemistBreakdownList.length} Stores
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-sans block">Free Stock Valuation</span>
                <span className="text-base font-black text-emerald-400">
                  ₹{chemistBreakdownList.reduce((acc, c) => acc + c.freeAmount, 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Chemists List Table */}
            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 text-center w-10">#</th>
                    <th className="p-2.5 min-w-[200px]">Chemist / Retailer Name</th>
                    <th className="p-2.5 min-w-[120px] text-cyan-300">Location</th>
                    <th className="p-2.5 text-center w-24 text-cyan-400">Billed Qty</th>
                    <th className="p-2.5 text-center w-24 text-amber-400 bg-amber-950/30">Free Qty 🎁</th>
                    <th className="p-2.5 text-center w-24 text-white">Total Units</th>
                    <th className="p-2.5 text-right w-28 text-emerald-400">Free Value (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
                  {chemistBreakdownList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                        Is month me kisi chemist ko is product par free goods nahi gaye ya Partywise Analysis me Dwarika statement upload nahi hai.
                      </td>
                    </tr>
                  ) : (
                    chemistBreakdownList.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                        <td className="p-2.5 font-sans font-bold text-white">{c.retailerName}</td>
                        <td className="p-2.5 text-cyan-300">{c.address}</td>
                        <td className="p-2.5 text-center font-bold text-cyan-300">{c.salesQty}</td>
                        <td className="p-2.5 text-center font-black text-amber-300 bg-amber-950/20">{c.freeQty}</td>
                        <td className="p-2.5 text-center font-black text-white">{c.totalUnits}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-400">₹{c.freeAmount.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                Stockist: <b className="text-white">{currentPartyMeta.name}</b> &bull; Month: <b className="text-amber-400">{selectedMonthCode} 2026</b>
              </span>
              <button
                type="button"
                onClick={() => setBreakdownTargetProduct(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
"""

with open('src/components/FreeGoodsVault.tsx', 'w', encoding='utf-8') as f:
    f.write(vault_code)
print("✅ 2. FreeGoodsVault.tsx updated.")

# 3. Build Production Bundle & Deploy
print("\n📦 [2/3] Compiling Production Bundle (npm run build)...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful.")

print("\n☁️ [3/3] Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Free Goods Auto-Fetch & Chemist Distribution Tap Feature Live on Cloudflare!")
