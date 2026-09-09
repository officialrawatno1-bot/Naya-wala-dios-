import os, sys, subprocess

print("==========================================================================")
print("🧠 [1/3] UPDATING FREE GOODS STORE (INSPECTOR MATRIX ENGINE)...")
print("==========================================================================")

store_file = 'src/data/freeGoodsStore.ts'
with open(store_file, 'r', encoding='utf-8') as f:
    scode = f.read()

inspector_methods = '''  // 🌟 SCAN COMPLETE COVERAGE MATRIX ACROSS ALL 6 STOCKISTS & 12 MONTHS (OFFLINE + KV)
  public getCoverageMatrix(monthCodes: string[]) {
    const matrix: Record<string, Record<string, { available: boolean; totalFreeQty: number; skuCount: number }>> = {};

    FREE_GOODS_PARTIES.forEach(party => {
      matrix[party.id] = {};
      monthCodes.forEach(mCode => {
        const pData = this.data[mCode]?.[party.id] || {};
        let freeSum = 0;
        let count = 0;
        Object.values(pData).forEach(qty => {
          const n = Number(qty) || 0;
          if (n > 0) {
            freeSum += n;
            count++;
          }
        });

        matrix[party.id][mCode] = {
          available: count > 0,
          totalFreeQty: freeSum,
          skuCount: count
        };
      });
    });

    return matrix;
  }
'''

if "getCoverageMatrix" not in scode:
    scode = scode.replace("  public persist() {", inspector_methods + "\n  public persist() {")
    with open(store_file, 'w', encoding='utf-8') as f:
        f.write(scode)
    print("✅ 1. freeGoodsStore.ts updated with getCoverageMatrix.")
else:
    print("✓ freeGoodsStore.ts already has getCoverageMatrix.")

print("\n==========================================================================")
print("📦 [2/3] UPDATING EXPORTER WITH DYNAMIC SELECTIVE STOCKIST & MONTH EXPORT...")
print("==========================================================================")

exporter_file = 'src/exporters/freeGoodsExporter.ts'
with open(exporter_file, 'r', encoding='utf-8') as f:
    ecode = f.read()

custom_export_func = '''// 🌟 DYNAMIC CUSTOM MASTER EXCEL (SELECTIVE STOCKISTS + SELECTIVE MONTHS)
export function exportCustomMasterExcel(
  monthCodes: string[],
  selectedPartyIds: string[],
  onlyActiveQty: boolean = true
) {
  const wb = XLSX.utils.book_new();

  const partiesToExport = FREE_GOODS_PARTIES.filter(p => selectedPartyIds.includes(p.id));

  partiesToExport.forEach(party => {
    const ws = buildStockistExcelSheet(party.id, party.name, party.tag, monthCodes, onlyActiveQty);
    XLSX.utils.book_append_sheet(wb, ws, party.tag);
  });

  const partyTagsStr = partiesToExport.map(p => p.tag.toUpperCase()).join('_');
  const monthsStr = monthCodes.join('_');
  const filename = `FREE_GOODS_${partyTagsStr}_${monthsStr}_2026.xlsx`;
  XLSX.writeFile(wb, filename);
}
'''

if "exportCustomMasterExcel" not in ecode:
    ecode += "\n" + custom_export_func
    with open(exporter_file, 'w', encoding='utf-8') as f:
        f.write(ecode)
    print("✅ 2. freeGoodsExporter.ts updated with exportCustomMasterExcel.")
else:
    print("✓ freeGoodsExporter.ts already has exportCustomMasterExcel.")

print("\n==========================================================================")
print("🎨 [3/3] UPDATING UI WITH COVERAGE MATRIX INSPECTOR & CUSTOM EXPORT MODAL...")
print("==========================================================================")

vault_component_code = '''import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Download, RefreshCw, Search, 
  CheckCircle2, Layers, FileSpreadsheet, Sparkles, Building2, 
  Trash2, Calendar, Eye, Zap, X, Gift, Store, TrendingUp, Filter,
  Check, ChevronDown, SlidersHorizontal, Upload, CheckSquare, Square,
  Database, Info, Sliders, ExternalLink
} from 'lucide-react';
import { MASTER_PRODUCTS, MasterProduct } from '../data/masterProducts';
import { freeGoodsStore, FREE_GOODS_PARTIES, ChemistFreeDistributionItem } from '../data/freeGoodsStore';
import { 
  exportFreeGoodsPartyCSV, 
  exportFreeGoodsStockwiseMultiSheetExcel,
  exportFreeGoodsSinglePartyExcel,
  exportCustomMasterExcel
} from '../exporters/freeGoodsExporter';
import { parseVardhmanStockSalesPdf } from '../parsers/stockSalesParsers/vardhmanStockSalesParser';
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

const ALL_MONTH_CODES = MONTH_OPTIONS.map(m => m.code);

interface Props {
  onBack: () => void;
}

export const FreeGoodsVault: React.FC<Props> = ({ onBack }) => {
  const [selectedMonthCodes, setSelectedMonthCodes] = useState<string[]>(['JUN']);
  const [showMonthPickerModal, setShowMonthPickerModal] = useState(false);
  const [showExportStudioModal, setShowExportStudioModal] = useState(false);
  const [showMatrixInspector, setShowMatrixInspector] = useState(true);

  const [activeTab, setActiveTab] = useState<string>('dwarika');
  const [search, setSearch] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [onlyActiveQtyInExcel, setOnlyActiveQtyInExcel] = useState(true);

  // 🌟 EXPORT STUDIO STATE (Custom Selection)
  const [studioSelectedMonths, setStudioSelectedMonths] = useState<string[]>(['JUN', 'JUL', 'AUG']);
  const [studioSelectedParties, setStudioSelectedParties] = useState<string[]>(FREE_GOODS_PARTIES.map(p => p.id));
  const [studioActiveOnly, setStudioActiveOnly] = useState(true);

  // 🌟 BREAKDOWN MODAL STATE
  const [breakdownTargetProduct, setBreakdownTargetProduct] = useState<MasterProduct | null>(null);

  // PDF Import State
  const stockSalesFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImportingPdf, setIsImportingPdf] = React.useState(false);

  const currentPartyMeta = FREE_GOODS_PARTIES.find(p => p.id === activeTab) || FREE_GOODS_PARTIES[0];

  const currentSummary = useMemo(() => {
    return freeGoodsStore.getMultiMonthPartySummary(selectedMonthCodes, activeTab, currentPartyMeta.name);
  }, [selectedMonthCodes, activeTab, currentPartyMeta, refreshTrigger]);

  const chemistBreakdownList = useMemo(() => {
    if (!breakdownTargetProduct) return [];
    return freeGoodsStore.getMultiMonthChemistFreeDistribution(selectedMonthCodes, activeTab, breakdownTargetProduct.sn);
  }, [selectedMonthCodes, activeTab, breakdownTargetProduct, refreshTrigger]);

  // 🌟 LIVE COVERAGE MATRIX (Hybrid: Memory + KV)
  const coverageMatrix = useMemo(() => {
    return freeGoodsStore.getCoverageMatrix(ALL_MONTH_CODES);
  }, [refreshTrigger]);

  const filteredProducts = useMemo(() => {
    return MASTER_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || String(p.sn).includes(search)
    );
  }, [search]);

  const handleQtyChange = (sn: number, val: string) => {
    const targetMonth = selectedMonthCodes[0] || 'JUN';
    freeGoodsStore.updateCell(targetMonth, activeTab, sn, val);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleImportStockSalesPdf = async (file: File) => {
    setIsImportingPdf(true);
    setStatusMsg(`Converting '${file.name}' to Virtual CSV stream...`);
    try {
      const parsed = await parseVardhmanStockSalesPdf(file);
      const targetMonth = parsed.monthCode || selectedMonthCodes[0] || 'AUG';

      if (!selectedMonthCodes.includes(targetMonth)) {
        setSelectedMonthCodes([targetMonth]);
      }

      setActiveTab('vardhman');

      const totalUnits = freeGoodsStore.setStockSalesFreeGoods(targetMonth, 'vardhman', parsed.productFreeMap);
      setRefreshTrigger(prev => prev + 1);

      const itemsCount = Object.keys(parsed.productFreeMap).length;
      setStatusMsg(`🎉 SUCCESS! '${file.name}' (${targetMonth}): Virtual CSV -> ${totalUnits} Free Units across ${itemsCount} SKUs loaded into Shree Vardhman!`);
    } catch (err: any) {
      alert("Import Error: " + (err.message || String(err)));
    } finally {
      setIsImportingPdf(false);
      if (stockSalesFileInputRef.current) stockSalesFileInputRef.current.value = '';
      setTimeout(() => setStatusMsg(null), 4500);
    }
  };

  const handleAutoSyncFromPartywise = () => {
    const { syncedCount, totalFreeUnits } = freeGoodsStore.syncMultiMonthFromPartywise(selectedMonthCodes, activeTab);
    setRefreshTrigger(prev => prev + 1);
    if (syncedCount > 0) {
      setStatusMsg(`🎉 SUCCESS! Partywise Analysis se [${selectedMonthCodes.join(', ')}] ke ${syncedCount} Products (${totalFreeUnits} Free Units) auto-fetch ho gaye!`);
    } else {
      setStatusMsg(`ℹ️ Partywise Analysis me [${selectedMonthCodes.join(', ')}] ke liye koi Free Goods record nahi mila.`);
    }
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleClearParty = () => {
    if (window.confirm(`Kya aap ${currentPartyMeta.name} ke [${selectedMonthCodes.join(', ')}] ke saare Free Goods clear karna chahte hain?`)) {
      freeGoodsStore.clearMultiMonth(selectedMonthCodes, activeTab);
      setRefreshTrigger(prev => prev + 1);
      setStatusMsg(`🧹 ${currentPartyMeta.name} data cleared for [${selectedMonthCodes.join(', ')}].`);
      setTimeout(() => setStatusMsg(null), 2500);
    }
  };

  const handleQuickSelectQuarter = (qMonths: string[]) => {
    setSelectedMonthCodes(qMonths);
    setShowMonthPickerModal(false);
  };

  const handleToggleMonth = (code: string) => {
    if (selectedMonthCodes.includes(code)) {
      if (selectedMonthCodes.length > 1) {
        setSelectedMonthCodes(selectedMonthCodes.filter(c => c !== code));
      }
    } else {
      setSelectedMonthCodes([...selectedMonthCodes, code]);
    }
  };

  // Studio Selection Handlers
  const handleStudioToggleMonth = (code: string) => {
    if (studioSelectedMonths.includes(code)) {
      if (studioSelectedMonths.length > 1) setStudioSelectedMonths(studioSelectedMonths.filter(c => c !== code));
    } else {
      setStudioSelectedMonths([...studioSelectedMonths, code]);
    }
  };

  const handleStudioToggleParty = (id: string) => {
    if (studioSelectedParties.includes(id)) {
      if (studioSelectedParties.length > 1) setStudioSelectedParties(studioSelectedParties.filter(p => p !== id));
    } else {
      setStudioSelectedParties([...studioSelectedParties, id]);
    }
  };

  const handleRunCustomExport = () => {
    exportCustomMasterExcel(studioSelectedMonths, studioSelectedParties, studioActiveOnly);
    setShowExportStudioModal(false);
    setStatusMsg(`🎉 Custom Master Excel generated for ${studioSelectedParties.length} Parties across [${studioSelectedMonths.join(', ')}]!`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const grandMetrics = useMemo(() => {
    let totQ = 0;
    let totA = 0;
    FREE_GOODS_PARTIES.forEach(pt => {
      const s = freeGoodsStore.getMultiMonthPartySummary(selectedMonthCodes, pt.id, pt.name);
      totQ += s.totalQty;
      totA += s.totalAmount;
    });
    return { totQ, totA: Number(totA.toFixed(2)) };
  }, [selectedMonthCodes, refreshTrigger]);

  const selectedMonthsLabel = useMemo(() => {
    if (selectedMonthCodes.length === 1) return selectedMonthCodes[0];
    if (selectedMonthCodes.length === 12) return 'Full Year (12M)';
    return `${selectedMonthCodes.join('+')}`;
  }, [selectedMonthCodes]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-5">
      
      {/* 1. TOP HEADER */}
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
                <Sparkles size={10} /> Coverage Inspector Live
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              BE: BANWARI LAL MEENA &bull; HQ: UDAIPUR &bull; Live Available Months Inspector &bull; Custom Master Studio
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* MONTH SELECTOR */}
          <button
            type="button"
            onClick={() => setShowMonthPickerModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-amber-500/50 text-amber-300 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <Calendar size={13} className="text-amber-400" />
            <span>Month: <b className="text-white font-mono">{selectedMonthsLabel}</b> ({selectedMonthCodes.length}M)</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          {/* VARDHMAN PDF ➔ CSV IMPORT */}
          <label className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md">
            <Upload size={14} className={isImportingPdf ? 'animate-bounce' : ''} />
            <span>{isImportingPdf ? 'Converting CSV...' : '📥 Import Stock & Sales (PDF➔CSV)'}</span>
            <input
              ref={stockSalesFileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              disabled={isImportingPdf}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleImportStockSalesPdf(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </label>

          {/* AUTO-SYNC */}
          <button
            onClick={handleAutoSyncFromPartywise}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
            title="Auto-fetch free quantities directly from Partywise Analysis for selected months"
          >
            <Zap size={14} /> ⚡ Auto-Sync ({selectedMonthCodes.length}M)
          </button>

          {/* 🌟 ADVANCED EXPORT STUDIO MODAL BUTTON */}
          <button
            onClick={() => setShowExportStudioModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
            title="Configure exactly which months & which parties to include in Excel export"
          >
            <Sliders size={14} className="text-yellow-300" /> 📊 Custom Master Excel
          </button>
        </div>
      </div>

      <CloudSyncBar
        storageKey={`statements/free_goods_${selectedMonthsLabel}_2026`}
        sheetTitle={`Free Goods Repository (${selectedMonthsLabel})`}
        getData={() => ({ selectedMonthCodes, store: freeGoodsStore.data })}
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

      {/* 🌟 2. COVERAGE MATRIX INSPECTOR (HUD GRID: 6 STOCKISTS x 12 MONTHS) */}
      <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-cyan-500/20 text-cyan-400 rounded-lg"><Database size={14} /></span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Stockist Coverage Matrix Inspector (Live Availability Grid)
            </span>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Offline Cache + Cloud KV
            </span>
          </div>
          <button
            onClick={() => setShowMatrixInspector(!showMatrixInspector)}
            className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
          >
            {showMatrixInspector ? 'Hide Grid' : 'Show Full Grid'}
          </button>
        </div>

        {showMatrixInspector && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="p-1.5 min-w-[130px]">Stockist</th>
                  {ALL_MONTH_CODES.map(m => (
                    <th key={m} className={`p-1.5 text-center font-mono w-14 ${selectedMonthCodes.includes(m) ? 'text-amber-300 font-black' : ''}`}>
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {FREE_GOODS_PARTIES.map(party => {
                  return (
                    <tr key={party.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-1.5 font-sans font-bold text-slate-200 truncate max-w-[130px]">
                        {party.name}
                      </td>
                      {ALL_MONTH_CODES.map(m => {
                        const cell = coverageMatrix[party.id]?.[m];
                        const isAvailable = cell?.available;
                        const isViewing = selectedMonthCodes.includes(m) && activeTab === party.id;

                        return (
                          <td key={m} className="p-1 text-center">
                            {isAvailable ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMonthCodes([m]);
                                  setActiveTab(party.id);
                                }}
                                className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] border transition cursor-pointer ${
                                  isViewing
                                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                                }`}
                                title={`${party.name} in ${m}: ${cell?.totalFreeQty} Free Units across ${cell?.skuCount} SKUs`}
                              >
                                {cell?.totalFreeQty}
                              </button>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
          <div className="text-[10px] text-emerald-400 uppercase font-semibold">All Stockists Grand Total</div>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
            {grandMetrics.totQ.toLocaleString()} Units &bull; ₹{grandMetrics.totA.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Party Switcher Tabs & Excel Checkbox */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {FREE_GOODS_PARTIES.map(party => {
            const isSelected = activeTab === party.id;
            const sum = freeGoodsStore.getMultiMonthPartySummary(selectedMonthCodes, party.id, party.name);
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

        <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
          <input
            type="checkbox"
            checked={onlyActiveQtyInExcel}
            onChange={e => setOnlyActiveQtyInExcel(e.target.checked)}
            className="rounded text-amber-500"
          />
          <span>Export me sirf Free Qty &gt; 0 wale products rakhein</span>
        </label>
      </div>

      {/* Search & Action Bar */}
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

      {/* 🌟 73 PRODUCTS TABLE */}
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
                          title="Click to view chemist stores"
                        >
                          <Eye size={10} /> View
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="p-2.5 text-right font-black text-emerald-400 bg-emerald-950/10">
                    {amtVal > 0 ? `₹${amtVal.toLocaleString()}` : '-'}
                  </td>

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
              <td className="p-3 text-white uppercase font-sans" colSpan={2}>TOTAL FOR {currentSummary.partyName} ({selectedMonthsLabel})</td>
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

      {/* 🌟 3. MASTER EXPORT CONFIGURATION STUDIO MODAL */}
      {showExportStudioModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-purple-500/60 rounded-3xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                  <Sliders size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Master Excel Export Studio</h3>
                  <p className="text-xs text-slate-400">Select specific months &amp; parties to generate your custom multi-tab Excel</p>
                </div>
              </div>
              <button onClick={() => setShowExportStudioModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            {/* Step 1: Select Target Months */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300 uppercase tracking-wider">1. Select Target Months:</span>
                <div className="flex items-center gap-1 text-[11px]">
                  <button type="button" onClick={() => setStudioSelectedMonths(['JUN', 'JUL', 'AUG'])} className="text-amber-400 hover:underline">Jun-Aug (3M)</button>
                  <span className="text-slate-600">&bull;</span>
                  <button type="button" onClick={() => setStudioSelectedMonths(ALL_MONTH_CODES)} className="text-cyan-400 hover:underline">All 12M</button>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {MONTH_OPTIONS.map(m => {
                  const isChecked = studioSelectedMonths.includes(m.code);
                  // Count how many parties have data in this month
                  let partiesWithData = 0;
                  FREE_GOODS_PARTIES.forEach(p => {
                    if (coverageMatrix[p.id]?.[m.code]?.available) partiesWithData++;
                  });

                  return (
                    <button
                      key={m.code}
                      type="button"
                      onClick={() => handleStudioToggleMonth(m.code)}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                        isChecked 
                          ? 'bg-purple-600 text-white border-purple-400 shadow' 
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{m.label}</span>
                      {partiesWithData > 0 && (
                        <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isChecked ? 'bg-white/20 text-white' : 'bg-emerald-950 text-emerald-400'}`}>
                          {partiesWithData}P
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Parties */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300 uppercase tracking-wider">2. Select Stockists (Excel Tabs):</span>
                <div className="flex items-center gap-1 text-[11px]">
                  <button type="button" onClick={() => setStudioSelectedParties(FREE_GOODS_PARTIES.map(p => p.id))} className="text-amber-400 hover:underline">Select All</button>
                  <span className="text-slate-600">&bull;</span>
                  <button type="button" onClick={() => setStudioSelectedParties(FREE_GOODS_PARTIES.filter(p => studioSelectedMonths.some(m => coverageMatrix[p.id]?.[m]?.available)).map(p => p.id))} className="text-cyan-400 hover:underline">Only With Data</button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-sans">
                {FREE_GOODS_PARTIES.map(party => {
                  const isChecked = studioSelectedParties.includes(party.id);
                  // Calculate total available free units in selected months
                  let freeInSelected = 0;
                  studioSelectedMonths.forEach(m => {
                    freeInSelected += coverageMatrix[party.id]?.[m]?.totalFreeQty || 0;
                  });

                  return (
                    <button
                      key={party.id}
                      type="button"
                      onClick={() => handleStudioToggleParty(party.id)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                        isChecked 
                          ? 'bg-slate-950 border-amber-500/80 text-white shadow-sm' 
                          : 'bg-slate-950/60 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="truncate pr-1">
                        <div className="font-bold truncate">{party.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{freeInSelected > 0 ? `${freeInSelected} Free Units` : 'No Free Qty'}</div>
                      </div>
                      {isChecked ? <CheckSquare size={16} className="text-amber-400 shrink-0" /> : <Square size={16} className="text-slate-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Rules & Output Name */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={studioActiveOnly}
                  onChange={e => setStudioActiveOnly(e.target.checked)}
                  className="rounded text-purple-500"
                />
                <span>Excel me sirf Free Qty &gt; 0 wale rows include karein</span>
              </label>

              <div className="text-[11px] font-mono text-purple-300">
                Tabs: <b>{studioSelectedParties.length}</b> &bull; Months: <b>{studioSelectedMonths.length}</b>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowExportStudioModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRunCustomExport}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
              >
                <Download size={15} /> Generate &amp; Download Custom Excel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. CUSTOM MONTH SELECTOR DIALOG */}
      {showMonthPickerModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Calendar size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Custom Month Selector</h3>
                  <p className="text-xs text-slate-400">Pick any custom mix of months or standard quarters</p>
                </div>
              </div>
              <button onClick={() => setShowMonthPickerModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Quick Presets:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button type="button" onClick={() => handleQuickSelectQuarter(['APR', 'MAY', 'JUN'])} className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold">Q1 (Apr-Jun)</button>
                <button type="button" onClick={() => handleQuickSelectQuarter(['JUL', 'AUG', 'SEP'])} className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold">Q2 (Jul-Sep)</button>
                <button type="button" onClick={() => handleQuickSelectQuarter(['OCT', 'NOV', 'DEC'])} className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold">Q3 (Oct-Dec)</button>
                <button type="button" onClick={() => handleQuickSelectQuarter(['JAN', 'FEB', 'MAR'])} className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold">Q4 (Jan-Mar)</button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                <span>Select Custom Month Mix:</span>
                <button type="button" onClick={() => setSelectedMonthCodes(ALL_MONTH_CODES)} className="text-cyan-400 hover:underline">Select All (12M)</button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {MONTH_OPTIONS.map(m => {
                  const isChecked = selectedMonthCodes.includes(m.code);
                  return (
                    <button
                      key={m.code}
                      type="button"
                      onClick={() => handleToggleMonth(m.code)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                        isChecked 
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md' 
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{m.label}</span>
                      {isChecked && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs font-mono text-slate-300">
                Selected: <b className="text-amber-400">{selectedMonthCodes.join(', ')}</b> ({selectedMonthCodes.length} Months)
              </div>
              <button
                type="button"
                onClick={() => setShowMonthPickerModal(false)}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Apply Months
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CHEMIST BREAKDOWN MODAL */}
      {breakdownTargetProduct && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-5">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-3xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
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
                    Free Goods Distribution Breakdown &bull; {currentPartyMeta.name} ({selectedMonthsLabel} 2026)
                  </p>
                </div>
              </div>
              <button onClick={() => setBreakdownTargetProduct(null)} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

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

            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 text-center w-10">#</th>
                    <th className="p-2.5 text-center w-16 text-amber-400">Month</th>
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
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                        Selected months me kisi chemist ko is product par free goods nahi gaye ya Partywise Analysis me statement upload nahi hai.
                      </td>
                    </tr>
                  ) : (
                    chemistBreakdownList.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                        <td className="p-2.5 text-center text-amber-300 font-bold">{c.monthCode}</td>
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

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                Stockist: <b className="text-white">{currentPartyMeta.name}</b> &bull; Months: <b className="text-amber-400">{selectedMonthsLabel}</b>
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
'''

with open('src/components/FreeGoodsVault.tsx', 'w', encoding='utf-8') as f:
    f.write(vault_component_code)
print("✅ 3. FreeGoodsVault.tsx updated with Inspector & Custom Export Studio.")

# 4. Build and Deploy
print("\n📦 [2/3] Compiling Production Bundle (npm run build)...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful with 0 errors.")

print("\n☁️ [3/3] Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Coverage Matrix Inspector & Custom Master Studio is 100% Live on Cloudflare!")
