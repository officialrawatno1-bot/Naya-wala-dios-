import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, PackageCheck, Zap, Upload, FileSpreadsheet, Download, CheckCircle2, 
  Trash2, Eye, X, RefreshCw, Layers, Building2, Search, Calculator,
  Package, Bot, Sparkles, Check, Loader2, Calendar, AlertTriangle, 
  FileSpreadsheet as ExcelIcon, Edit3, Database, Cloud
} from 'lucide-react';
import { MASTER_PRODUCTS } from '../data/masterProducts';
import { parsePartyFile, parsePrimaryFile, PartyParseSummary, matchMasterProduct } from '../parsers';
import { exportToExcel } from '../utils/excelExporter';
import { unProgressionStoreV2, MONTH_CODES } from '../data/unProgressionStore_v2';
import { AggregatedProduct } from '../parsers/common';
import { DhruviManualModal } from './DhruviManualModal';
import { memoryStore } from '../data/memoryStore';
import { CloudSyncBar } from './CloudSyncBar';

const MONTH_CODE_TO_FULL: Record<string, string> = {
  'APR': 'APRIL', 'MAY': 'MAY', 'JUN': 'JUNE', 'JUL': 'JULY', 'AUG': 'AUGUST', 'SEP': 'SEPTEMBER',
  'OCT': 'OCTOBER', 'NOV': 'NOVEMBER', 'DEC': 'DECEMBER', 'JAN': 'JANUARY', 'FEB': 'FEBRUARY', 'MAR': 'MARCH'
};

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

interface PartySlot {
  id: string;
  name: string;
  location: string;
  software: string;
  isManual?: boolean;
}

const PARTIES_CONFIG: PartySlot[] = [
  { id: 'sun', name: 'Sun Distributors', location: 'Banswara', software: 'SwilERP (7-Col PDF/XLS)' },
  { id: 'rp', name: 'R.P. Agencies', location: 'Bus Stand', software: 'SwilERP (8-Col PDF/XLS)' },
  { id: 'vardhman', name: 'Shree Vardhman', location: 'Dungarpur', software: 'Standard ERP (PDF/XLS)' },
  { id: 'modi', name: 'Modi Distributors', location: 'Udaipur', software: 'Marg / Prompt (PDF/XLS)' },
  { id: 'dwarika', name: 'Dwarika Medicals', location: 'Udaipur', software: 'Marg ERP Nano (XLS/CSV)' },
  { id: 'nagda', name: 'Nagda Distributors', location: 'Udaipur', software: 'Marg ERP Nano (All Formats)' },
  { id: 'dhruvi', name: 'Dhruvi', location: 'Manual Entry', software: 'In-Cell Math (+6+6, +6-2)', isManual: true },
];

export interface FullAggregatedProduct extends AggregatedProduct {
  netPri: number;
  priValue: number;
}

export const DiosWorkspaceV2: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [selectedMonthCode, setSelectedMonthCode] = useState<string>('AUG');
  const [tableSearch, setTableSearch] = useState('');
  const [loadingPartyId, setLoadingPartyId] = useState<string | null>(null);

  const [partyDataMap, setPartyDataMap] = useState<Record<string, PartyParseSummary>>({});
  const [primaryData, setPrimaryData] = useState<PartyParseSummary | null>(null);
  const [selectedProductForModal, setSelectedProductForModal] = useState<FullAggregatedProduct | null>(null);

  // Dhruvi Modal State
  const [showDhruviModal, setShowDhruviModal] = useState(false);
  const [isSavingStockwise, setIsSavingStockwise] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // CBO Modal State
  const [showCboModal, setShowCboModal] = useState(false);
  const [fromMonth, setFromMonth] = useState('Aug-2026');
  const [toMonth, setToMonth] = useState('Aug-2026');
  const [botLoading, setBotLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [botStatus, setBotStatus] = useState<string>('');
  const [botError, setBotError] = useState<string | null>(null);

  // 🌟 SCAN WHICH MONTHS HAVE DATA SAVED LOCALLY / IN VAULT
  const availableMonthsMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (typeof window !== 'undefined') {
      MONTH_CODES.forEach(m => {
        try {
          const rawAgg = localStorage.getItem(`dios_aggregator_snapshot_${m}_2026`);
          const rawStk = localStorage.getItem(`dios_stockwise_statement_${m}_2026`);
          map[m] = !!(rawAgg || rawStk);
        } catch (e) {
          map[m] = false;
        }
      });
    }
    return map;
  }, [selectedMonthCode, partyDataMap, primaryData, statusMsg]);

  // 🌟 AUTO-POPULATE ON MONTH SWITCH (Loads previously saved data for selected month)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const snapKey = `dios_aggregator_snapshot_${selectedMonthCode}_2026`;
      const stkKey = `dios_stockwise_statement_${selectedMonthCode}_2026`;

      let loaded = false;
      const rawSnap = localStorage.getItem(snapKey);
      if (rawSnap) {
        const parsed = JSON.parse(rawSnap);
        if (parsed) {
          setPartyDataMap(parsed.partyDataMap || {});
          setPrimaryData(parsed.primaryData || null);
          loaded = true;
        }
      }

      if (!loaded) {
        const rawStk = localStorage.getItem(stkKey);
        if (rawStk) {
          const parsedStk = JSON.parse(rawStk);
          if (parsedStk) {
            setPartyDataMap(parsedStk.partyDataMap || parsedStk.parties || {});
            setPrimaryData(parsedStk.primaryData || parsedStk.primary || null);
            loaded = true;
          }
        }
      }

      if (!loaded) {
        // Clean slate for new un-uploaded month without bleeding other months' files
        setPartyDataMap({});
        setPrimaryData(null);
      }
    } catch (e) {
      setPartyDataMap({});
      setPrimaryData(null);
    }
  }, [selectedMonthCode]);

  const activePartyNames = Object.values(partyDataMap).map(p => p.partyName);
  const selectedFullMonth = MONTH_CODE_TO_FULL[selectedMonthCode] || 'AUGUST';

  const { products, summary } = useMemo(() => {
    let totalSalesUnits = 0;
    let totalClosingUnits = 0;
    let totalPriUnits = 0;
    let totalSalesValue = 0;
    let totalClosingValue = 0;
    let totalPriValue = 0;

    const computedProducts: FullAggregatedProduct[] = MASTER_PRODUCTS.map(m => {
      let netSec = 0;
      let closing = 0;
      let netPri = primaryData?.items[m.sn]?.sales || 0;

      const partyBreakdown: Record<string, { partyName: string; sales: number; closing: number }> = {};

      Object.values(partyDataMap).forEach(summary => {
        const item = summary.items[m.sn] || { sales: 0, closing: 0 };
        netSec += item.sales;
        closing += item.closing;
        partyBreakdown[summary.partyName] = {
          partyName: summary.partyName,
          sales: item.sales,
          closing: item.closing,
        };
      });

      const salesValue = netSec * m.pts;
      const closingValue = closing * m.pts;
      const priValue = netPri * m.pts;

      totalSalesUnits += netSec;
      totalClosingUnits += closing;
      totalPriUnits += netPri;
      totalSalesValue += salesValue;
      totalClosingValue += closingValue;
      totalPriValue += priValue;

      return {
        sn: m.sn,
        name: m.name,
        pts: m.pts,
        netPri,
        netSec,
        closing,
        priValue,
        salesValue,
        closingValue,
        partyBreakdown,
      };
    });

    return {
      products: computedProducts,
      summary: {
        totalPriUnits,
        totalSalesUnits,
        totalClosingUnits,
        totalPriValue,
        totalSalesValue,
        totalClosingValue,
      },
    };
  }, [partyDataMap, primaryData]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
    String(p.sn).includes(tableSearch)
  );

  const saveCurrentMonthSnapshotLocally = () => {
    try {
      const snapKey = `dios_aggregator_snapshot_${selectedMonthCode}_2026`;
      localStorage.setItem(snapKey, JSON.stringify({
        monthCode: selectedMonthCode,
        partyDataMap,
        primaryData,
        summary,
        savedAt: new Date().toISOString()
      }));
    } catch (e) {}
  };

  const handleSingleFileUpload = async (partyId: string, partyName: string, file: File) => {
    setLoadingPartyId(partyId);
    try {
      const parsedSummary = await parsePartyFile(partyId, partyName, file);
      if (partyId === 'primary') {
        setPrimaryData(parsedSummary);
      } else {
        setPartyDataMap(prev => {
          const next = { ...prev, [partyId]: parsedSummary };
          return next;
        });
      }
      setTimeout(() => saveCurrentMonthSnapshotLocally(), 100);
    } catch (err) {
      alert(`Error reading file for ${partyName}.`);
    } finally {
      setLoadingPartyId(null);
    }
  };

  const handleDhruviSave = (summary: PartyParseSummary) => {
    if (summary.itemCount > 0) {
      setPartyDataMap(prev => ({ ...prev, dhruvi: summary }));
    } else {
      setPartyDataMap(prev => {
        const copy = { ...prev };
        delete copy.dhruvi;
        return copy;
      });
    }
    setShowDhruviModal(false);
    setTimeout(() => saveCurrentMonthSnapshotLocally(), 100);
  };

  const handleDhruviClear = () => {
    setPartyDataMap(prev => {
      const copy = { ...prev };
      delete copy.dhruvi;
      return copy;
    });
    setShowDhruviModal(false);
    setTimeout(() => saveCurrentMonthSnapshotLocally(), 100);
  };

  // CBO Live Scraper Handler
  const handleTriggerLiveSync = async () => {
    setBotLoading(true);
    setBotStatus('Fetching live data via CBO Scraper...');
    setBotError(null);

    try {
      const res = await fetch('/api/fetch-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_month: fromMonth, to_month: toMonth, fy_year: '2026-2027' })
      });
      const resultData = await res.json();

      if (resultData && resultData.success && resultData.items && resultData.items.length > 0) {
        const itemsMap: Record<number, { sales: number; closing: number }> = {};
        let matchedCount = 0;

        resultData.items.forEach((scrapedItem: any) => {
          const matched = matchMasterProduct(scrapedItem.name);
          if (matched) {
            if (!itemsMap[matched.sn]) {
              itemsMap[matched.sn] = { sales: 0, closing: 0 };
              matchedCount++;
            }
            itemsMap[matched.sn].sales += Number(scrapedItem.qty) || 0;
          }
        });

        const parsedSummary: PartyParseSummary = {
          partyName: 'Company Primary Dispatch (Live CBO JSON)',
          fileName: `CBO_${fromMonth}_to_${toMonth}`,
          itemCount: matchedCount,
          totalSales: resultData.total_qty,
          totalClosing: 0,
          items: itemsMap,
        };

        setPrimaryData(parsedSummary);
        setBotStatus(`🎉 SUCCESS! Loaded ${matchedCount} Products (${resultData.total_qty} Units)`);
        setTimeout(() => {
          setShowCboModal(false);
          saveCurrentMonthSnapshotLocally();
        }, 1000);
      } else {
        setBotError(resultData?.error || 'No items extracted.');
      }
    } catch (err: any) {
      setBotError(err.message || 'Network error');
    } finally {
      setBotLoading(false);
    }
  };

  // 🌟 ATOMIC SYNC TO DATA HUB (USES V2 STORE: NEVER WIPES AUGUST OR ANY MONTH!)
  const handleSyncToDataHub = () => {
    unProgressionStoreV2.syncFromAggregator(selectedMonthCode, products);
    saveCurrentMonthSnapshotLocally();
    setStatusMsg(`🎉 SUCCESS! Synced ${selectedMonthCode} to Data Hub (Sheet 4) with zero data loss! August & all other months are 100% preserved.`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Save to Stockwise Vault
  const handleSaveToStockwiseStatement = async () => {
    if (activePartyNames.length === 0 && !primaryData) {
      alert("Kripya pehle kisi party ka statement upload ya fill karein!");
      return;
    }
    setIsSavingStockwise(true);
    const storageKey = `statements/stockwise_${selectedMonthCode}_2026`;
    const payload = {
      month: selectedFullMonth,
      monthCode: selectedMonthCode,
      year: '2026',
      savedAt: new Date().toISOString(),
      activePartiesCount: activePartyNames.length,
      partyDataMap,
      primaryData,
      summary
    };

    try {
      localStorage.setItem(`dios_stockwise_statement_${selectedMonthCode}_2026`, JSON.stringify(payload));
      saveCurrentMonthSnapshotLocally();
      await fetch('/api/cloud-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: storageKey, data: payload, device: 'iPad Safari' })
      });
      setStatusMsg(`🎉 ${selectedMonthCode} Statements saved to Stockwise Vault & Cloudflare KV!`);
    } catch (err: any) {
      setStatusMsg(`💾 ${selectedMonthCode} Statements saved to Local Draft.`);
    } finally {
      setIsSavingStockwise(false);
      setTimeout(() => setStatusMsg(null), 3500);
    }
  };

  const handleRemoveParty = (partyId: string) => {
    if (partyId === 'primary') setPrimaryData(null);
    else if (partyId === 'dhruvi') {
      memoryStore.dhruviEntries = {};
      setPartyDataMap(prev => { const c = { ...prev }; delete c.dhruvi; return c; });
    } else {
      setPartyDataMap(prev => { const c = { ...prev }; delete c[partyId]; return c; });
    }
    setTimeout(() => saveCurrentMonthSnapshotLocally(), 100);
  };

  const handleExport = () => {
    exportToExcel(products as any, selectedFullMonth, activePartyNames, summary);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-7xl mx-auto space-y-5">
      
      {/* 1. TOP NAVBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft size={16} /> Back to Hub
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[11px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/50">
            <Sparkles size={13} className="text-cyan-400 animate-pulse" /> AGGREGATOR &bull; ZERO-LOSS MONTH PERSISTENCE
          </span>
          <span className="text-xs text-slate-400 font-medium">Month:</span>
          <select
            value={selectedMonthCode}
            onChange={(e) => setSelectedMonthCode(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-cyan-400 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {MONTH_OPTIONS.map(m => (
              <option key={m.code} value={m.code}>{m.label} ({MONTH_CODE_TO_FULL[m.code]})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. TITLE & ACTION BUTTONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
              <FileSpreadsheet size={24} />
            </span>
            DIOS Statement Aggregator
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Month-Wise Cloud Storage &bull; Live KV Availability Strip &bull; Zero-Loss Data Hub Sync
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSaveToStockwiseStatement}
            disabled={isSavingStockwise || (activePartyNames.length === 0 && !primaryData)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-40"
          >
            {isSavingStockwise ? <Loader2 size={14} className="animate-spin" /> : <PackageCheck size={14} />}
            <span>📦 Save to Stockwise ({selectedMonthCode})</span>
          </button>

          <button
            onClick={handleSyncToDataHub}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
            title="Safe multi-month sync: September adds without erasing August"
          >
            <Zap size={14} className="text-yellow-300" /> 💾 Sync to Data Hub
          </button>

          <button
            onClick={handleExport}
            disabled={activePartyNames.length === 0 && !primaryData}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
          >
            <Download size={14} /> Download Excel
          </button>
        </div>
      </div>

      {/* 🌟 3. DEDICATED CLOUDSYNCBAR FOR STATEMENT AGGREGATOR */}
      <CloudSyncBar
        storageKey={`aggregator/month_${selectedMonthCode}_2026`}
        sheetTitle={`Statement Aggregator (${selectedMonthCode} 2026)`}
        getData={() => ({
          monthCode: selectedMonthCode,
          fullMonth: selectedFullMonth,
          partyDataMap,
          primaryData,
          summary
        })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.partyDataMap) setPartyDataMap(cloudData.partyDataMap);
          if (cloudData.primaryData !== undefined) setPrimaryData(cloudData.primaryData);
          saveCurrentMonthSnapshotLocally();
          setStatusMsg(`📥 Fresh ${selectedMonthCode} Statements loaded from Cloudflare KV!`);
          setTimeout(() => setStatusMsg(null), 3000);
        }}
        onSaveLocal={() => {
          saveCurrentMonthSnapshotLocally();
          setStatusMsg(`💾 ${selectedMonthCode} Draft saved locally.`);
          setTimeout(() => setStatusMsg(null), 2500);
        }}
      />

      {statusMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="p-1 hover:text-white cursor-pointer"><X size={15} /></button>
        </div>
      )}

      {/* 🌟 4. MONTH AVAILABILITY RIBBON (LIVE KV & DRAFT STATUS BADGES) */}
      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
            <Database size={13} className="text-cyan-400" />
            Live Saved Month Detector (Tap to 1-Click Load):
          </span>
          <span className="text-[10px] text-slate-500 font-mono">🟢 = Saved Data Available in Storage</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {MONTH_CODES.map(m => {
            const hasData = availableMonthsMap[m];
            const isSelected = selectedMonthCode === m;

            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMonthCode(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-md font-black'
                    : hasData
                    ? 'bg-slate-900 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
                    : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                }`}
              >
                <span>{m}</span>
                {hasData ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. PRIMARY ENGINE CARD */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/40 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Package size={22} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Company Primary Sales (NET PRI Dispatch) - {selectedMonthCode}
                {primaryData && <CheckCircle2 size={16} className="text-emerald-400" />}
              </h3>
              <p className="text-xs text-slate-400">
                {primaryData 
                  ? `Active: ${primaryData.fileName} • Total: ${primaryData.totalSales.toLocaleString()} Units`
                  : 'Live 1-Click Auto Sync (JSON / Excel) or Local File Upload'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {primaryData ? (
              <button
                onClick={() => handleRemoveParty('primary')}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-400 text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Clear Primary
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowCboModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
                >
                  <Bot size={15} /> ⚡ Live CBO Fetch
                </button>

                <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer">
                  <Upload size={14} /> Upload File
                  <input
                    type="file"
                    accept=".xls,.xlsx,.csv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSingleFileUpload('primary', 'Company Primary Dispatch', e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 6. 7 DISTRIBUTOR SLOTS (6 Statement Uploads + Dhruvi Manual Slot) */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers size={14} className="text-cyan-400" /> Distributor Secondary Slots ({activePartyNames.length}/7 Active in {selectedMonthCode})
          </span>
          <span className="text-[11px] text-slate-500 normal-case">Statements saved per month</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PARTIES_CONFIG.map((party) => {
            const data = partyDataMap[party.id];
            const isUploaded = !!data;
            const isLoading = loadingPartyId === party.id;
            const isDhruvi = party.isManual;

            return (
              <div
                key={party.id}
                className={`p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                  isUploaded 
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-950/40' 
                    : isDhruvi
                    ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Building2 size={16} className={isUploaded ? 'text-emerald-400' : isDhruvi ? 'text-amber-400' : 'text-slate-500'} />
                        {party.name}
                        {isUploaded && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                        {isDhruvi && <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">Manual</span>}
                      </h3>
                      <p className="text-[11px] text-slate-400">{party.location} • <span className={isDhruvi ? 'text-amber-400 font-semibold' : 'text-cyan-400'}>{party.software}</span></p>
                    </div>

                    {isUploaded && (
                      <button
                        onClick={() => handleRemoveParty(party.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  {isUploaded && (
                    <div className="my-2.5 p-2.5 bg-slate-950/90 rounded-xl border border-emerald-500/30 text-xs space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Status:</span> <span className="text-emerald-300 font-bold">{data.fileName}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Sales Units:</span> <span className="text-cyan-400 font-bold">{data.totalSales.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Closing Stock:</span> <span className="text-emerald-400 font-bold">{data.totalClosing.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  {isDhruvi ? (
                    <button
                      type="button"
                      onClick={() => setShowDhruviModal(true)}
                      className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold cursor-pointer transition ${
                        isUploaded 
                          ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60' 
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                      }`}
                    >
                      <Edit3 size={14} />
                      {isUploaded ? 'Edit Dhruvi Math Sheet' : 'Open Dhruvi Math Sheet'}
                    </button>
                  ) : (
                    <label className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition ${
                      isUploaded 
                        ? 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300' 
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20'
                    }`}>
                      <Upload size={14} className={isLoading ? 'animate-spin' : ''} />
                      {isLoading ? 'Processing File...' : isUploaded ? 'Replace Statement' : 'Upload Statement'}
                      <input
                        type="file"
                        accept=".xls,.xlsx,.csv,.pdf,application/pdf"
                        disabled={isLoading}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleSingleFileUpload(party.id, party.name, e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-blue-400 uppercase font-semibold">Total Primary Dispatch ({selectedMonthCode})</div>
          <div className="text-xl font-bold text-blue-400 mt-1">{summary.totalPriUnits.toLocaleString()} Units</div>
          <div className="text-xs text-slate-400 mt-0.5">₹ {Math.round(summary.totalPriValue).toLocaleString()}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-cyan-400 uppercase font-semibold">Total Secondary Sales ({selectedMonthCode})</div>
          <div className="text-xl font-bold text-cyan-400 mt-1">{summary.totalSalesUnits.toLocaleString()} Units</div>
          <div className="text-xs text-slate-400 mt-0.5">₹ {Math.round(summary.totalSalesValue).toLocaleString()}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-emerald-400 uppercase font-semibold">Total Closing Stock ({selectedMonthCode})</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{summary.totalClosingUnits.toLocaleString()} Units</div>
          <div className="text-xs text-slate-400 mt-0.5">₹ {Math.round(summary.totalClosingValue).toLocaleString()}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-purple-400 uppercase font-semibold">Active Distributors</div>
          <div className="text-xl font-bold text-purple-400 mt-1">{activePartyNames.length} / 7 Active</div>
          <div className="text-xs text-slate-400 mt-0.5">73 Master Products</div>
        </div>
      </div>

      {/* 8. TABLE SEARCH & 73 PRODUCTS GRID */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <input
            type="text"
            placeholder="Search in 73 products..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-400">
          Showing <span className="text-cyan-400 font-bold">{filteredProducts.length}</span> of 73
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-2xl max-h-[600px] flex flex-col">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase z-20">
            <tr>
              <th className="p-3 text-center w-12 bg-slate-900">S.N.</th>
              <th className="p-3 bg-slate-900">Product Name</th>
              <th className="p-3 text-right bg-slate-900">PTS (₹)</th>
              <th className="p-3 text-center text-blue-400 bg-blue-950/40 border-l border-r border-slate-800">
                {selectedMonthCode} NET PRI (Dispatch)
              </th>
              <th className="p-3 text-center text-cyan-400 bg-cyan-950/40 border-r border-slate-800">
                {selectedMonthCode} NET SEC (Sales)
              </th>
              <th className="p-3 text-center text-emerald-400 bg-emerald-950/40 border-r border-slate-800">
                {selectedMonthCode} CLOSING (Stock)
              </th>
              <th className="p-3 text-right bg-slate-900">Sales Value (₹)</th>
              <th className="p-3 text-center bg-slate-900">Breakdown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredProducts.map((p) => (
              <tr key={p.sn} className="hover:bg-slate-800/50">
                <td className="p-3 text-center text-slate-500 font-mono">{p.sn}</td>
                <td className="p-3 text-white font-semibold">{p.name}</td>
                <td className="p-3 text-right text-slate-400 font-mono">{p.pts.toFixed(2)}</td>
                <td className="p-3 text-center font-bold text-blue-400 bg-blue-950/10 border-l border-r border-slate-800/80 font-mono text-sm">
                  {p.netPri !== 0 ? p.netPri.toLocaleString() : '-'}
                </td>
                <td className="p-3 text-center font-bold text-cyan-400 bg-cyan-950/10 border-r border-slate-800/80 font-mono text-sm">
                  {p.netSec > 0 ? p.netSec.toLocaleString() : '-'}
                </td>
                <td className="p-3 text-center font-bold text-emerald-400 bg-emerald-950/10 border-r border-slate-800/80 font-mono text-sm">
                  {p.closing > 0 ? p.closing.toLocaleString() : '-'}
                </td>
                <td className="p-3 text-right text-slate-300 font-mono">
                  {p.salesValue > 0 ? Math.round(p.salesValue).toLocaleString() : '-'}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => setSelectedProductForModal(p)}
                    className="p-1 text-cyan-400 hover:bg-cyan-500/20 rounded cursor-pointer"
                    title="View Distributor Breakdown"
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-cyan-500/40 z-20 shadow-2xl">
            <tr className="font-extrabold text-white text-xs bg-slate-950/95">
              <td className="p-3.5 text-center text-cyan-400 font-mono">Σ</td>
              <td className="p-3.5 text-white flex items-center gap-2">
                <Calculator size={15} className="text-cyan-400" /> TOTAL ({selectedMonthCode} 2026)
              </td>
              <td className="p-3.5 text-right text-slate-400 font-mono">-</td>
              <td className="p-3.5 text-center font-mono text-sm bg-blue-950/50 text-blue-300 border-l border-r border-slate-800">
                {summary.totalPriUnits.toLocaleString()} Units
              </td>
              <td className="p-3.5 text-center font-mono text-sm bg-cyan-950/50 text-cyan-300 border-r border-slate-800">
                {summary.totalSalesUnits.toLocaleString()} Units
              </td>
              <td className="p-3.5 text-center font-mono text-sm bg-emerald-950/50 text-emerald-300 border-r border-slate-800">
                {summary.totalClosingUnits.toLocaleString()} Units
              </td>
              <td className="p-3.5 text-right font-mono text-sm text-cyan-300">
                ₹ {Math.round(summary.totalSalesValue).toLocaleString()}
              </td>
              <td className="p-3.5 text-center text-slate-500">-</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* DHRUVI MODAL */}
      <DhruviManualModal
        isOpen={showDhruviModal}
        onClose={() => setShowDhruviModal(false)}
        onSave={handleDhruviSave}
        onClear={handleDhruviClear}
      />

      {/* CBO MODAL */}
      {showCboModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/40">
                  <Bot size={22} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">CBO Primary Sales Auto-Sync</h3>
                  <p className="text-xs text-slate-400">Select Month &amp; Choose Auto-Fetch Mode</p>
                </div>
              </div>
              <button onClick={() => { setShowCboModal(false); setBotError(null); }} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-cyan-400" /> From Month:
                </label>
                <select
                  value={fromMonth}
                  onChange={(e) => setFromMonth(e.target.value)}
                  disabled={botLoading || excelLoading}
                  className="w-full bg-slate-950 border border-slate-700 text-cyan-300 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {MONTH_OPTIONS.map(opt => (
                    <option key={opt.code} value={opt.label}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-cyan-400" /> To Month:
                </label>
                <select
                  value={toMonth}
                  onChange={(e) => setToMonth(e.target.value)}
                  disabled={botLoading || excelLoading}
                  className="w-full bg-slate-950 border border-slate-700 text-cyan-300 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {MONTH_OPTIONS.map(opt => (
                    <option key={opt.code} value={opt.label}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {botStatus && !botError && (
              <div className="p-3.5 rounded-xl text-xs mb-4 bg-slate-950 border border-slate-800 text-cyan-300 flex items-center gap-2">
                {botLoading ? <Loader2 size={16} className="animate-spin text-cyan-400" /> : <Check size={16} className="text-emerald-400" />}
                <span>{botStatus}</span>
              </div>
            )}

            {botError && (
              <div className="p-3.5 rounded-xl text-xs mb-4 bg-rose-950/60 border border-rose-500/40 text-rose-300">
                {botError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowCboModal(false); setBotError(null); }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTriggerLiveSync}
                disabled={botLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                {botLoading ? <Loader2 size={15} className="animate-spin" /> : <Bot size={15} />}
                <span>{botLoading ? 'Syncing...' : '⚡ Via Web Scraper'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE PRODUCT BREAKDOWN MODAL */}
      {selectedProductForModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedProductForModal.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">PTS: ₹{selectedProductForModal.pts.toFixed(2)}</p>
              </div>
              <button onClick={() => setSelectedProductForModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              <div className="p-2.5 bg-blue-950/40 rounded-xl flex justify-between text-xs border border-blue-500/20">
                <span className="font-semibold text-blue-300">Company Primary Dispatch</span>
                <span className="text-blue-300 font-bold">{selectedProductForModal.netPri} Units</span>
              </div>
              {activePartyNames.map(party => {
                const data = selectedProductForModal.partyBreakdown[party] || { sales: 0, closing: 0 };
                return (
                  <div key={party} className="p-2.5 bg-slate-950 rounded-xl flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">{party}</span>
                    <div className="flex gap-3">
                      <span className="text-cyan-400">Sales: <b>{data.sales}</b></span>
                      <span className="text-emerald-400">Stock: <b>{data.closing}</b></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
