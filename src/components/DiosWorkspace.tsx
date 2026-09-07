import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Zap, Upload, FileSpreadsheet, Download, CheckCircle2, 
  Trash2, Eye, X, RefreshCw, Layers, Building2, Search, Calculator,
  Package, Bot, Sparkles, Check, Loader2, Calendar, AlertTriangle, 
  FileSpreadsheet as ExcelIcon, Edit3
} from 'lucide-react';
import { MASTER_PRODUCTS } from '../data/masterProducts';
import { parsePartyFile, parsePrimaryFile, PartyParseSummary, matchMasterProduct } from '../parsers';
import { exportToExcel } from '../utils/excelExporter';
import { unProgressionStore, MONTH_CODES } from '../data/unProgressionStore';
import { AggregatedProduct } from '../parsers/common';
import { DhruviManualModal } from './DhruviManualModal';
import { memoryStore } from '../data/memoryStore';

const MONTHS = [
  'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 
  'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH'
];

const MONTH_MAP_REVERSE: Record<string, string> = {
  'APR': 'APRIL', 'MAY': 'MAY', 'JUN': 'JUNE', 'JUL': 'JULY', 'AUG': 'AUGUST', 'SEP': 'SEPTEMBER',
  'OCT': 'OCTOBER', 'NOV': 'NOVEMBER', 'DEC': 'DECEMBER', 'JAN': 'JANUARY', 'FEB': 'FEBRUARY', 'MAR': 'MARCH'
};

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

export const DiosWorkspace: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('AUGUST');
  const [tableSearch, setTableSearch] = useState('');
  const [loadingPartyId, setLoadingPartyId] = useState<string | null>(null);

  const [partyDataMap, setPartyDataMap] = useState<Record<string, PartyParseSummary>>({});
  const [primaryData, setPrimaryData] = useState<PartyParseSummary | null>(null);
  const [selectedProductForModal, setSelectedProductForModal] = useState<FullAggregatedProduct | null>(null);

  // 📝 Dhruvi Modal State
  const [showDhruviModal, setShowDhruviModal] = useState(false);

  // CBO Modal State
  const [showCboModal, setShowCboModal] = useState(false);
  const [fromMonth, setFromMonth] = useState('Aug-2026');
  const [toMonth, setToMonth] = useState('Aug-2026');
  const [botLoading, setBotLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [botStatus, setBotStatus] = useState<string>('');
  const [botError, setBotError] = useState<string | null>(null);

  const activePartyNames = Object.values(partyDataMap).map(p => p.partyName);

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

  const handleSingleFileUpload = async (partyId: string, partyName: string, file: File) => {
    setLoadingPartyId(partyId);
    try {
      const parsedSummary = await parsePartyFile(partyId, partyName, file);
      if (partyId === 'primary') {
        setPrimaryData(parsedSummary);
      } else {
        setPartyDataMap(prev => ({
          ...prev,
          [partyId]: parsedSummary
        }));
      }
    } catch (err) {
      console.error(err);
      alert(`Error reading file for ${partyName}.`);
    } finally {
      setLoadingPartyId(null);
    }
  };

  // 🧮 Dhruvi Callbacks
  const handleDhruviSave = (summary: PartyParseSummary) => {
    if (summary.itemCount > 0) {
      setPartyDataMap(prev => ({
        ...prev,
        dhruvi: summary
      }));
    } else {
      setPartyDataMap(prev => {
        const copy = { ...prev };
        delete copy.dhruvi;
        return copy;
      });
    }
    setShowDhruviModal(false);
  };

  const handleDhruviClear = () => {
    setPartyDataMap(prev => {
      const copy = { ...prev };
      delete copy.dhruvi;
      return copy;
    });
    setShowDhruviModal(false);
  };

  // Method 1: Live JSON Web Scraper Auto-Fill (Untouched Original)
  const handleTriggerLiveSync = async () => {
    setBotLoading(true);
    setBotStatus('Fetching live data via CBO Scraper...');
    setBotError(null);

    const payload = {
      from_month: fromMonth,
      to_month: toMonth,
      fy_year: '2026-2027'
    };

    try {
      const res = await fetch('/api/fetch-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

        const monthPrefix = fromMonth.split('-')[0].toUpperCase();
        const targetFullMonth = MONTH_MAP_REVERSE[monthPrefix] || 'AUGUST';
        setSelectedMonth(targetFullMonth);

        setBotStatus(`🎉 SUCCESS! Loaded ${matchedCount} Products (${resultData.total_qty} Units)`);
        setTimeout(() => {
          setShowCboModal(false);
        }, 1000);
      } else {
        setBotError(resultData?.error || 'No items extracted.');
        setBotStatus('Fetch failed.');
      }
    } catch (err: any) {
      setBotError(err.message || 'Network error');
      setBotStatus('Fetch failed.');
    } finally {
      setBotLoading(false);
    }
  };

  // Method 2: Fetch CBO Excel in Background & Auto-Parse (Untouched Original)
  const handleFetchAndParseCboExcel = async () => {
    setExcelLoading(true);
    setBotError(null);
    setBotStatus('Bot is downloading CBO Excel file & auto-parsing...');

    try {
      const payload = {
        from_month: fromMonth,
        to_month: toMonth,
        fy_year: '2026-2027'
      };

      const res = await fetch('/api/fetch-cbo-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('CBO Excel download failed.');

      const blob = await res.blob();
      const excelFile = new File([blob], `CBO_Primary_${fromMonth}.xls`, { type: 'application/vnd.ms-excel' });

      const parsedSummary = await parsePrimaryFile(excelFile, 'Company Primary Dispatch (Live CBO Excel)');

      setPrimaryData(parsedSummary);

      const monthPrefix = fromMonth.split('-')[0].toUpperCase();
      const targetFullMonth = MONTH_MAP_REVERSE[monthPrefix] || 'AUGUST';
      setSelectedMonth(targetFullMonth);

      setBotStatus(`🎉 SUCCESS! Parsed ${parsedSummary.itemCount} Products (${parsedSummary.totalSales} Units) from Excel!`);
      setTimeout(() => {
        setShowCboModal(false);
      }, 1000);
    } catch (err: any) {
      setBotError(err.message || 'Excel auto-fetch failed.');
    } finally {
      setExcelLoading(false);
    }
  };

  const handleRemoveParty = (partyId: string) => {
    if (partyId === 'primary') {
      setPrimaryData(null);
    } else if (partyId === 'dhruvi') {
      memoryStore.dhruviEntries = {};
      setPartyDataMap(prev => {
        const copy = { ...prev };
        delete copy.dhruvi;
        return copy;
      });
    } else {
      setPartyDataMap(prev => {
        const copy = { ...prev };
        delete copy[partyId];
        return copy;
      });
    }
  };

  const handleResetAll = () => {
    if (window.confirm('Are you sure you want to reset all data on the screen?')) {
      setPartyDataMap({});
      setPrimaryData(null);
      memoryStore.dhruviEntries = {};
      setTableSearch('');
    }
  };

    // 💾 Sync Aggregated Month to Data Hub (Un. Sales Prog)
  const handleSyncToDataHub = () => {
    const mCode = selectedMonth.substring(0, 3).toUpperCase();
    unProgressionStore.syncFromAggregator(mCode, products);
    alert(`🎉 SUCCESS! Synced ${selectedMonth} (${products.reduce((a,b)=>a+b.netSec,0)} Sales Units, ${products.reduce((a,b)=>a+b.closing,0)} Closing Units) to Data Hub (4. Un. Sales Prog)!`);
  };

  const handleExport = () => {
    exportToExcel(products as any, selectedMonth, activePartyNames, summary);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Top Navbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft size={16} /> Back to Hub
        </button>
        
        <div className="flex items-center gap-3">
          <span className="text-[11px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/50">
            <Sparkles size={13} className="text-cyan-400 animate-pulse" /> DIOS V53.0 (WITH DHRUVI MANUAL SLOT)
          </span>
          <span className="text-xs text-slate-400 font-medium">Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-cyan-400 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {MONTHS.map(m => (
              <option key={m} value={m}>{m} 2026</option>
            ))}
          </select>
        </div>
      </div>

      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
              <FileSpreadsheet size={24} />
            </span>
            DIOS Statement Aggregator
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Unit Sales Progression (HQ Total) • 6 Local Distributors + Dhruvi (Manual Math) + CBO Primary
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(activePartyNames.length > 0 || primaryData) && (
            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-xl text-xs font-medium text-rose-300 transition cursor-pointer"
            >
              <RefreshCw size={14} /> Reset All
            </button>
          )}
                    <button
            onClick={handleSyncToDataHub}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition cursor-pointer"
            title="Save and Push aggregated data into Data Hub Un. Sales Prog"
          >
            <Zap size={15} className="text-yellow-300" /> 💾 Sync to Data Hub
          </button>

          <button
            onClick={handleExport}
            disabled={activePartyNames.length === 0 && !primaryData}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition ${
              (activePartyNames.length > 0 || primaryData)
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20 cursor-pointer' 
                : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
            }`}
          >
            <Download size={16} /> Download Banwari Excel
          </button>
        </div>
      </div>

      {/* PRIMARY ENGINE CARD */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/40 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Package size={22} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Company Primary Sales (NET PRI Dispatch)
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer"
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

      {/* 7 DISTRIBUTOR SLOTS (6 Statement Uploads + Dhruvi Manual Slot) */}
      <div className="mb-8">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers size={14} className="text-cyan-400" /> Distributor Secondary Slots ({activePartyNames.length}/7 Active)
          </span>
          <span className="text-[11px] text-slate-500 normal-case">6 Statement Uploads + Dhruvi Manual Formula Sheet</span>
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
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
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

      {/* METRICS SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-blue-400 uppercase font-semibold">Total Primary Dispatch</div>
          <div className="text-xl font-bold text-blue-400 mt-1">{summary.totalPriUnits.toLocaleString()} Units</div>
          <div className="text-xs text-slate-400 mt-0.5">₹ {Math.round(summary.totalPriValue).toLocaleString()}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-cyan-400 uppercase font-semibold">Total Secondary Sales</div>
          <div className="text-xl font-bold text-cyan-400 mt-1">{summary.totalSalesUnits.toLocaleString()} Units</div>
          <div className="text-xs text-slate-400 mt-0.5">₹ {Math.round(summary.totalSalesValue).toLocaleString()}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-emerald-400 uppercase font-semibold">Total Closing Stock</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{summary.totalClosingUnits.toLocaleString()} Units</div>
          <div className="text-xs text-slate-400 mt-0.5">₹ {Math.round(summary.totalClosingValue).toLocaleString()}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-purple-400 uppercase font-semibold">Active Distributors</div>
          <div className="text-xl font-bold text-purple-400 mt-1">{activePartyNames.length} / 7 Active</div>
          <div className="text-xs text-slate-400 mt-0.5">73 Master Products</div>
        </div>
      </div>

      {/* Search in 73 products */}
      <div className="flex items-center justify-between gap-4 mb-4">
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

      {/* 73 PRODUCTS HQ TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-2xl max-h-[600px] flex flex-col">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase z-20">
            <tr>
              <th className="p-3 text-center w-12 bg-slate-900">S.N.</th>
              <th className="p-3 bg-slate-900">Product Name</th>
              <th className="p-3 text-right bg-slate-900">PTS (₹)</th>
              <th className="p-3 text-center text-blue-400 bg-blue-950/40 border-l border-r border-slate-800">
                {selectedMonth} NET PRI (Dispatch)
              </th>
              <th className="p-3 text-center text-cyan-400 bg-cyan-950/40 border-r border-slate-800">
                {selectedMonth} NET SEC (Sales)
              </th>
              <th className="p-3 text-center text-emerald-400 bg-emerald-950/40 border-r border-slate-800">
                {selectedMonth} CLOSING (Stock)
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

          {/* GRAND TOTAL FOOTER */}
          <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-cyan-500/40 z-20 shadow-2xl">
            <tr className="font-extrabold text-white text-xs bg-slate-950/95">
              <td className="p-3.5 text-center text-cyan-400 font-mono">Σ</td>
              <td className="p-3.5 text-white flex items-center gap-2">
                <Calculator size={15} className="text-cyan-400" /> GRAND TOTAL (73 MASTER PRODUCTS)
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

      {/* 🧮 DHRUVI ISOLATED MODAL (Rendered From Separate Component) */}
      <DhruviManualModal
        isOpen={showDhruviModal}
        onClose={() => setShowDhruviModal(false)}
        onSave={handleDhruviSave}
        onClear={handleDhruviClear}
      />

      {/* CBO MODAL */}
      {showCboModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl shadow-cyan-950/60">
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
              <button 
                onClick={() => { setShowCboModal(false); setBotError(null); }}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
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
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {botStatus && !botError && (
              <div className="p-3.5 rounded-xl text-xs mb-4 bg-slate-950 border border-slate-800 text-cyan-300 flex items-center gap-2">
                {(botLoading || excelLoading) ? <Loader2 size={16} className="animate-spin text-cyan-400" /> : <Check size={16} className="text-emerald-400" />}
                <span>{botStatus}</span>
              </div>
            )}

            {botError && (
              <div className="p-3.5 rounded-xl text-xs mb-4 bg-rose-950/60 border border-rose-500/40 text-rose-300 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Sync Error:</div>
                    <div className="text-[11px] text-rose-200 mt-0.5">{botError}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleFetchAndParseCboExcel}
                disabled={botLoading || excelLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {excelLoading ? <Loader2 size={15} className="animate-spin" /> : <ExcelIcon size={15} />}
                {excelLoading ? 'Parsing Excel...' : '📊 Via CBO Excel'}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => { setShowCboModal(false); setBotError(null); }}
                  disabled={botLoading || excelLoading}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleTriggerLiveSync}
                  disabled={botLoading || excelLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                >
                  {botLoading ? <Loader2 size={15} className="animate-spin" /> : <Bot size={15} />}
                  {botLoading ? 'Syncing...' : '⚡ Via Web Scraper'}
                </button>
              </div>
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
