import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Calendar, Download, RefreshCw, Search, 
  CheckCircle2, AlertTriangle, Layers, FileSpreadsheet, 
  Sparkles
} from 'lucide-react';
import { MASTER_PRODUCTS } from '../data/masterProducts';

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

const PARTIES_CONFIG = [
  { id: 'nagda', name: 'Nagda Distributors', tag: 'Nagda', location: 'Udaipur' },
  { id: 'modi', name: 'Modi Distributors', tag: 'Modi', location: 'Udaipur' },
  { id: 'dwarika', name: 'Dwarika Medicals', tag: 'Dwarika', location: 'Udaipur' },
  { id: 'vardhman', name: 'Shree Vardhman', tag: 'Vardhman', location: 'Dungarpur' },
  { id: 'sun', name: 'Sun Distributors', tag: 'Sun', location: 'Banswara' },
  { id: 'rp', name: 'R.P. Agencies', tag: 'R.P.', location: 'Bus Stand' },
  { id: 'dhruvi', name: 'Dhruvi (Manual)', tag: 'Dhruvi', location: 'In-Cell Math' },
  { id: 'primary', name: 'Company Primary', tag: 'Primary', location: 'CBO' },
];

const MATRIX_PARTIES = PARTIES_CONFIG.slice(0, 7);

interface Props {
  onBack?: () => void;
}

export const StockwiseStatementVault: React.FC<Props> = ({ onBack }) => {
  const [selectedMonthCode, setSelectedMonthCode] = useState('AUG');
  const [activeTab, setActiveTab] = useState<string>('nagda');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statementData, setStatementData] = useState<any>(null);

  const loadMonthData = async (mCode: string) => {
    setIsLoading(true);
    const storageKey = `statements/stockwise_${mCode}_2026`;
    const localKey = `dios_stockwise_statement_${mCode}_2026`;

    let foundData = null;

    try {
      const localRaw = localStorage.getItem(localKey);
      if (localRaw) foundData = JSON.parse(localRaw);
    } catch (e) {}

    try {
      const res = await fetch(`/api/cloud-storage?key=${encodeURIComponent(storageKey)}&t=${Date.now()}&_r=${Math.random()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json && json.success && json.data) {
        foundData = json.data;
        try { localStorage.setItem(localKey, JSON.stringify(json.data)); } catch (e) {}
      }
    } catch (err) {}

    // Fallback seed for May & June
    if (!foundData && (mCode === 'MAY' || mCode === 'JUN')) {
      const sampleSales = mCode === 'MAY' ? 730 : 665;
      const sampleCl = mCode === 'MAY' ? 722 : 968;
      foundData = {
        month: mCode === 'MAY' ? 'MAY' : 'JUNE',
        monthCode: mCode,
        year: '2026',
        savedAt: new Date().toISOString(),
        activePartiesCount: 1,
        parties: {
          nagda: {
            partyName: 'Nagda Distributors',
            fileName: `${mCode}.csv`,
            itemCount: 45,
            totalSales: sampleSales,
            totalClosing: sampleCl,
            items: {
              1: { sales: mCode === 'MAY' ? 50 : 41, closing: mCode === 'MAY' ? 96 : 105 },
              2: { sales: mCode === 'MAY' ? 11 : 19, closing: mCode === 'MAY' ? 9 : 20 },
              4: { sales: 0, closing: 10 },
              6: { sales: 0, closing: 10 },
              8: { sales: 10, closing: 2 },
              12: { sales: mCode === 'MAY' ? 26 : 18, closing: mCode === 'MAY' ? 9 : 41 },
              13: { sales: mCode === 'MAY' ? 31 : 17, closing: mCode === 'MAY' ? 26 : 23 },
              14: { sales: 0, closing: 10 },
              17: { sales: mCode === 'MAY' ? 14 : 0, closing: -2 },
              31: { sales: mCode === 'MAY' ? 7 : 16, closing: mCode === 'MAY' ? 21 : 25 },
              32: { sales: mCode === 'MAY' ? 44 : 59, closing: mCode === 'MAY' ? 34 : 47 },
              37: { sales: mCode === 'MAY' ? 18 : 3, closing: mCode === 'MAY' ? 19 : 16 },
              38: { sales: 6, closing: 10 },
              45: { sales: mCode === 'MAY' ? 26 : 24, closing: mCode === 'MAY' ? 23 : -1 },
              50: { sales: mCode === 'MAY' ? 36 : 7, closing: mCode === 'MAY' ? 15 : 21 },
              52: { sales: mCode === 'MAY' ? 57 : 45, closing: mCode === 'MAY' ? 37 : 72 },
              54: { sales: mCode === 'MAY' ? 67 : 91, closing: -5 },
              56: { sales: mCode === 'MAY' ? 63 : 41, closing: -1 },
              58: { sales: mCode === 'MAY' ? 20 : 8, closing: 41 },
              60: { sales: mCode === 'MAY' ? 20 : 25, closing: 11 },
              62: { sales: mCode === 'MAY' ? 120 : 117, closing: 86 }
            }
          }
        }
      };
    }

    setStatementData(foundData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadMonthData(selectedMonthCode);
  }, [selectedMonthCode]);

  const partiesData = statementData?.partyDataMap || statementData?.parties || {};
  const primaryData = statementData?.primaryData || statementData?.primary;

  const currentPartySummary = activeTab === 'primary' 
    ? primaryData 
    : partiesData[activeTab];

  const filteredProducts = useMemo(() => {
    return MASTER_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || String(p.sn).includes(search)
    );
  }, [search]);

  // Calculations for current selected single tab
  const partyMetrics = useMemo(() => {
    if (!currentPartySummary?.items) return { totalSales: 0, totalClosing: 0, salesVal: 0, closingVal: 0 };
    let totalSales = 0;
    let totalClosing = 0;
    let salesVal = 0;
    let closingVal = 0;

    MASTER_PRODUCTS.forEach(p => {
      const it = currentPartySummary.items[p.sn];
      if (it) {
        const s = it.sales || 0;
        const c = it.closing || 0;
        totalSales += s;
        totalClosing += c;
        salesVal += s * p.pts;
        closingVal += c * p.pts;
      }
    });

    return { totalSales, totalClosing, salesVal, closingVal };
  }, [currentPartySummary]);

  // Calculations for All-Parties Matrix View
  const matrixTotals = useMemo(() => {
    const partySecTotals: Record<string, number> = {};
    const partyClTotals: Record<string, number> = {};
    const partySecVal: Record<string, number> = {};
    const partyClVal: Record<string, number> = {};

    let grandSecUnits = 0;
    let grandClUnits = 0;
    let grandSecVal = 0;
    let grandClVal = 0;

    MATRIX_PARTIES.forEach(pt => {
      let sUnits = 0;
      let cUnits = 0;
      let sVal = 0;
      let cVal = 0;

      MASTER_PRODUCTS.forEach(p => {
        const it = partiesData[pt.id]?.items?.[p.sn];
        const s = it?.sales || 0;
        const c = it?.closing || 0;
        sUnits += s;
        cUnits += c;
        sVal += s * p.pts;
        cVal += c * p.pts;
      });

      partySecTotals[pt.id] = sUnits;
      partyClTotals[pt.id] = cUnits;
      partySecVal[pt.id] = sVal;
      partyClVal[pt.id] = cVal;

      grandSecUnits += sUnits;
      grandClUnits += cUnits;
      grandSecVal += sVal;
      grandClVal += cVal;
    });

    return {
      partySecTotals,
      partyClTotals,
      partySecVal,
      partyClVal,
      grandSecUnits,
      grandClUnits,
      grandSecVal,
      grandClVal
    };
  }, [partiesData]);

  const activePartiesCount = Object.keys(partiesData).filter(k => partiesData[k]?.itemCount > 0).length;

  // Exact 2-Tier Statement Aggregator CSV Export
  const handleExportCSV = () => {
    if (!statementData) return;

    let csv = `S.N.,PRODUCT NAME,PTS (Rs),`;
    MATRIX_PARTIES.forEach(p => {
      csv += `"${p.name.toUpperCase()}",,`;
    });
    csv += `TOTAL ALL PARTIES,\n`;

    csv += `,,,`;
    MATRIX_PARTIES.forEach(() => {
      csv += `SEC,CLOSING,`;
    });
    csv += `TOTAL SEC,TOTAL CLOSING\n`;

    MASTER_PRODUCTS.forEach(p => {
      let totSec = 0;
      let totCl = 0;
      let partyCols = '';

      MATRIX_PARTIES.forEach(party => {
        const it = partiesData[party.id]?.items?.[p.sn];
        const s = it?.sales || 0;
        const c = it?.closing || 0;
        totSec += s;
        totCl += c;
        partyCols += `${s || 0},${c || 0},`;
      });

      csv += `${p.sn},"${p.name}",${p.pts.toFixed(2)},${partyCols}${totSec},${totCl}\n`;
    });

    // Row: Grand Total Units
    let rowUnits = `Σ,GRAND TOTAL (UNITS),-,`;
    MATRIX_PARTIES.forEach(p => {
      rowUnits += `${matrixTotals.partySecTotals[p.id] || 0},${matrixTotals.partyClTotals[p.id] || 0},`;
    });
    rowUnits += `${matrixTotals.grandSecUnits},${matrixTotals.grandClUnits}\n`;
    csv += rowUnits;

    // Row: Grand Total Value in Rupees
    let rowVal = `Rs,TOTAL VALUE (RUPEES),-,`;
    MATRIX_PARTIES.forEach(p => {
      rowVal += `"${Math.round(matrixTotals.partySecVal[p.id] || 0)}","${Math.round(matrixTotals.partyClVal[p.id] || 0)}",`;
    });
    rowVal += `"${Math.round(matrixTotals.grandSecVal)}","${Math.round(matrixTotals.grandClVal)}"\n`;
    csv += rowVal;

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Party_Breakdown_${selectedMonthCode}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
      
      {/* 1. HEADER (Inside Master Card) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <FileSpreadsheet size={20} />
          </span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              STOCKWISE STATEMENT REPOSITORY
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <Sparkles size={10} /> Cloudflare KV Connected
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              BE: BANWARI LAL MEENA • HQ: UDAIPUR • 2-Tier Party Breakdown (SEC &amp; CLOSING)
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
            onClick={() => loadMonthData(selectedMonthCode)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-cyan-400' : 'text-slate-400'} />
            {isLoading ? 'Syncing...' : 'Sync KV'}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!statementData}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* 2. COMPACT STATUS STRIP */}
      <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {statementData ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
              <CheckCircle2 size={14} /> 
              {selectedMonthCode} 2026 Statements Active ({activePartiesCount}/7 Stockists Logged)
            </span>
          ) : (
            <span className="text-amber-400/90 font-medium flex items-center gap-1.5">
              <AlertTriangle size={14} /> 
              No archive for {selectedMonthCode} 2026 yet. (Open Statement Aggregator &rarr; click "Save to Stockwise")
            </span>
          )}
        </div>

        {statementData?.savedAt && (
          <div className="text-[10px] text-slate-400 font-mono">
            Cloud Timestamp: <b className="text-slate-200">{new Date(statementData.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(statementData.savedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</b>
          </div>
        )}
      </div>

      {/* 3. PARTY SWITCHER TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
            activeTab === 'all'
              ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
              : 'bg-slate-950 text-cyan-300 border-cyan-500/30 hover:border-cyan-400'
          }`}
        >
          <Layers size={13} />
          <span>🌐 All 7 Stockists Matrix (2-Tier)</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1"></div>

        {PARTIES_CONFIG.map(party => {
          const summary = party.id === 'primary' ? primaryData : partiesData[party.id];
          const hasData = !!summary && summary.itemCount > 0;
          const isSelected = activeTab === party.id;

          return (
            <button
              key={party.id}
              onClick={() => setActiveTab(party.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                isSelected 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md' 
                  : hasData
                  ? 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${hasData ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
              <span>{party.tag}</span>
            </button>
          );
        })}
      </div>

      {/* 4. CONTENT & TABLE */}
      {activeTab === 'all' ? (
        /* 🌟 EXACT STATEMENT AGGREGATOR 2-TIER CSV / EXCEL MATRIX */
        <div className="space-y-3">
          
          {/* Top Info Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Layers size={14} className="text-cyan-400" />
              2-Tier Party Breakdown (SEC &amp; CLOSING for each of the 7 Stockists) • {selectedMonthCode} 2026:
            </span>
            <div className="relative w-full sm:w-64">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search products in matrix..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* 2-Tier Matrix Table */}
          <div className="overflow-x-auto max-h-[560px] border border-slate-800 rounded-xl shadow-2xl bg-slate-950">
            <table className="w-full text-left text-xs border-collapse">
              
              {/* THE EXACT 2-TIER THEAD */}
              <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase z-30 border-b border-slate-800">
                
                {/* TIER 1: Stockist Names (colSpan=2) */}
                <tr className="border-b border-slate-800 text-[11px]">
                  <th rowSpan={2} className="p-2 text-center w-8 bg-slate-950 border-r border-slate-800 sticky left-0 z-40 text-slate-400">#</th>
                  <th rowSpan={2} className="p-2 min-w-[190px] bg-slate-950 border-r border-slate-800 sticky left-8 z-40 text-white">PRODUCT NAME</th>
                  <th rowSpan={2} className="p-2 text-right w-16 bg-slate-950 border-r border-slate-800 sticky left-[222px] z-40 text-slate-400">PTS (₹)</th>

                  {MATRIX_PARTIES.map(p => (
                    <th
                      key={`h1_${p.id}`}
                      colSpan={2}
                      className="p-1.5 text-center text-slate-200 bg-slate-900 border-r border-slate-800 font-extrabold whitespace-nowrap"
                    >
                      {p.name.toUpperCase()}
                    </th>
                  ))}

                  <th colSpan={2} className="p-1.5 text-center text-cyan-300 bg-cyan-950/80 border-r border-slate-800 font-black">
                    TOTAL ALL PARTIES
                  </th>
                </tr>

                {/* TIER 2: Sub-Columns (SEC | CLOSING) */}
                <tr className="border-b border-slate-800 text-[10px]">
                  {MATRIX_PARTIES.map(p => (
                    <React.Fragment key={`h2_${p.id}`}>
                      <th className="p-1 text-center text-cyan-400 bg-slate-950/90 w-16 border-r border-slate-800/60 font-bold">SEC</th>
                      <th className="p-1 text-center text-emerald-400 bg-slate-950/90 w-16 border-r border-slate-800 font-bold">CLOSING</th>
                    </React.Fragment>
                  ))}
                  <th className="p-1 text-center text-cyan-300 bg-cyan-950/90 w-20 border-r border-slate-800/60 font-black">TOTAL SEC</th>
                  <th className="p-1 text-center text-emerald-300 bg-emerald-950/90 w-20 font-black">TOTAL CL</th>
                </tr>
              </thead>

              {/* BODY: 73 Master Products */}
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] bg-slate-900">
                {filteredProducts.map(p => {
                  let rowTotSec = 0;
                  let rowTotCl = 0;

                  return (
                    <tr key={p.sn} className="hover:bg-slate-800/50 transition">
                      <td className="p-1.5 text-center text-slate-500 border-r border-slate-800/60 sticky left-0 bg-slate-900 z-20 w-8">{p.sn}</td>
                      <td className="p-1.5 font-sans font-semibold text-white border-r border-slate-800/60 sticky left-8 bg-slate-900 z-20 truncate max-w-[190px]">{p.name}</td>
                      <td className="p-1.5 text-right text-slate-400 border-r border-slate-800/60 sticky left-[222px] bg-slate-900 z-20 w-16">{p.pts.toFixed(2)}</td>

                      {MATRIX_PARTIES.map(party => {
                        const it = partiesData[party.id]?.items?.[p.sn];
                        const s = it?.sales || 0;
                        const c = it?.closing || 0;
                        rowTotSec += s;
                        rowTotCl += c;

                        return (
                          <React.Fragment key={`cell_${party.id}_${p.sn}`}>
                            <td className={`p-1.5 text-center border-r border-slate-800/50 ${s > 0 ? 'text-cyan-300 font-bold bg-cyan-950/15' : 'text-slate-600'}`}>
                              {s > 0 ? s : '-'}
                            </td>
                            <td className={`p-1.5 text-center border-r border-slate-800 ${c > 0 ? 'text-emerald-300 font-bold bg-emerald-950/15' : 'text-slate-600'}`}>
                              {c > 0 ? c : '-'}
                            </td>
                          </React.Fragment>
                        );
                      })}

                      {/* Line Totals */}
                      <td className={`p-1.5 text-center font-bold border-r border-slate-800/60 ${rowTotSec > 0 ? 'text-cyan-300 bg-cyan-950/40' : 'text-slate-600'}`}>
                        {rowTotSec > 0 ? rowTotSec : '-'}
                      </td>
                      <td className={`p-1.5 text-center font-bold ${rowTotCl > 0 ? 'text-emerald-300 bg-emerald-950/40' : 'text-slate-600'}`}>
                        {rowTotCl > 0 ? rowTotCl : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* 🌟 EXACT 2-TIER FOOTER: UNITS & RUPEES VALUE */}
              <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-cyan-500/40 font-bold z-30 shadow-2xl text-[11px] font-mono">
                
                {/* FOOTER ROW 1: UNITS */}
                <tr className="border-b border-slate-800 bg-slate-950">
                  <td className="p-2 text-center text-cyan-400 border-r border-slate-800 sticky left-0 bg-slate-950 z-40">Σ</td>
                  <td className="p-2 text-white font-sans uppercase border-r border-slate-800 sticky left-8 bg-slate-950 z-40">GRAND TOTAL (UNITS)</td>
                  <td className="p-2 text-right text-slate-500 border-r border-slate-800 sticky left-[222px] bg-slate-950 z-40">-</td>

                  {MATRIX_PARTIES.map(p => (
                    <React.Fragment key={`foot_u_${p.id}`}>
                      <td className="p-2 text-center text-cyan-300 bg-cyan-950/30 border-r border-slate-800/60 font-black">
                        {matrixTotals.partySecTotals[p.id]?.toLocaleString() || '0'}
                      </td>
                      <td className="p-2 text-center text-emerald-300 bg-emerald-950/30 border-r border-slate-800 font-black">
                        {matrixTotals.partyClTotals[p.id]?.toLocaleString() || '0'}
                      </td>
                    </React.Fragment>
                  ))}

                  <td className="p-2 text-center text-cyan-300 bg-cyan-950 border-r border-slate-800 font-black text-xs">
                    {matrixTotals.grandSecUnits.toLocaleString()}
                  </td>
                  <td className="p-2 text-center text-emerald-300 bg-emerald-950 font-black text-xs">
                    {matrixTotals.grandClUnits.toLocaleString()}
                  </td>
                </tr>

                {/* FOOTER ROW 2: TOTAL VALUE IN RUPEES */}
                <tr className="bg-slate-950">
                  <td className="p-2 text-center text-amber-400 border-r border-slate-800 sticky left-0 bg-slate-950 z-40">₹</td>
                  <td className="p-2 text-amber-300 font-sans uppercase border-r border-slate-800 sticky left-8 bg-slate-950 z-40">TOTAL VALUE (RUPEES)</td>
                  <td className="p-2 text-right text-slate-500 border-r border-slate-800 sticky left-[222px] bg-slate-950 z-40">-</td>

                  {MATRIX_PARTIES.map(p => (
                    <React.Fragment key={`foot_v_${p.id}`}>
                      <td className="p-2 text-center text-cyan-300 bg-cyan-950/40 border-r border-slate-800/60 font-black text-[10px]">
                        ₹{Math.round(matrixTotals.partySecVal[p.id] || 0).toLocaleString()}
                      </td>
                      <td className="p-2 text-center text-emerald-300 bg-emerald-950/40 border-r border-slate-800 font-black text-[10px]">
                        ₹{Math.round(matrixTotals.partyClVal[p.id] || 0).toLocaleString()}
                      </td>
                    </React.Fragment>
                  ))}

                  <td className="p-2 text-center text-cyan-300 bg-cyan-950 border-r border-slate-800 font-black text-xs">
                    ₹{Math.round(matrixTotals.grandSecVal).toLocaleString()}
                  </td>
                  <td className="p-2 text-center text-emerald-300 bg-emerald-950 font-black text-xs">
                    ₹{Math.round(matrixTotals.grandClVal).toLocaleString()}
                  </td>
                </tr>

              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* SINGLE PARTY VIEW (Nagda, Modi, etc.) */
        <div className="space-y-4">
          
          {/* Executive Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Stockist</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5 truncate">
                {currentPartySummary?.partyName || activeTab.toUpperCase()}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-cyan-400 uppercase font-semibold">Secondary Sales</div>
              <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
                {partyMetrics.totalSales.toLocaleString()} Units
              </div>
              <div className="text-[10px] text-slate-400 font-mono">₹{Math.round(partyMetrics.salesVal).toLocaleString()} PTS</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-emerald-400 uppercase font-semibold">Closing Stock</div>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                {partyMetrics.totalClosing.toLocaleString()} Units
              </div>
              <div className="text-[10px] text-slate-400 font-mono">₹{Math.round(partyMetrics.closingVal).toLocaleString()} PTS</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-amber-400 uppercase font-semibold">Active Coverage</div>
              <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                {currentPartySummary?.itemCount || 0} / 73 SKUs
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="relative w-full sm:w-72">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search in 73 products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Showing {filteredProducts.length} of 73 Products
            </span>
          </div>

          {/* Single Party Table */}
          <div className="overflow-x-auto max-h-[500px] border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
                <tr>
                  <th className="p-2.5 text-center w-12">#</th>
                  <th className="p-2.5 min-w-[200px]">Product Name</th>
                  <th className="p-2.5 text-center w-16">Pack</th>
                  <th className="p-2.5 text-right w-20 text-slate-400">PTS (₹)</th>
                  <th className="p-2.5 text-center w-28 text-cyan-400 bg-cyan-950/20">Sale Qty</th>
                  <th className="p-2.5 text-center w-28 text-emerald-400 bg-emerald-950/20">Closing Stock</th>
                  <th className="p-2.5 text-right min-w-[110px] text-slate-300">Sales Val (₹)</th>
                  <th className="p-2.5 text-right min-w-[110px] text-slate-400">Closing Val (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map(p => {
                  const it = currentPartySummary?.items?.[p.sn];
                  const s = it?.sales || 0;
                  const c = it?.closing || 0;
                  const sVal = s * p.pts;
                  const cVal = c * p.pts;

                  return (
                    <tr key={p.sn} className="hover:bg-slate-800/40 transition">
                      <td className="p-2 text-center text-slate-500 font-mono">{p.sn}</td>
                      <td className="p-2 font-medium text-white">{p.name}</td>
                      <td className="p-2 text-center text-slate-400 font-mono text-[11px]">{p.pack || '-'}</td>
                      <td className="p-2 text-right font-mono text-slate-400">{p.pts.toFixed(2)}</td>
                      <td className={`p-2 text-center font-mono font-bold ${s > 0 ? 'text-cyan-300 bg-cyan-950/15' : 'text-slate-600'}`}>
                        {s > 0 ? s.toLocaleString() : '-'}
                      </td>
                      <td className={`p-2 text-center font-mono font-bold ${c > 0 ? 'text-emerald-300 bg-emerald-950/15' : 'text-slate-600'}`}>
                        {c > 0 ? c.toLocaleString() : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-slate-300">
                        {sVal > 0 ? `₹${Math.round(sVal).toLocaleString()}` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-slate-400">
                        {cVal > 0 ? `₹${Math.round(cVal).toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-slate-800 font-bold z-10 text-xs">
                <tr>
                  <td className="p-2.5 text-center text-cyan-400 font-mono">Σ</td>
                  <td className="p-2.5 text-white uppercase" colSpan={3}>TOTAL FOR {currentPartySummary?.partyName || activeTab.toUpperCase()}</td>
                  <td className="p-2.5 text-center font-mono font-black text-cyan-300 bg-cyan-950/40">
                    {partyMetrics.totalSales.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-center font-mono font-black text-emerald-300 bg-emerald-950/40">
                    {partyMetrics.totalClosing.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-mono font-black text-cyan-300">
                    ₹{Math.round(partyMetrics.salesVal).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-mono font-black text-emerald-300">
                    ₹{Math.round(partyMetrics.closingVal).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
