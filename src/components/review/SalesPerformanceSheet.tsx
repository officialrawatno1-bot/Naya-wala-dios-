import React, { useState, useRef, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { 
  TrendingUp, Bot, Loader2, Download, Check, AlertTriangle, 
  MessageSquare, Plus, Trash2, X, Info, UploadCloud, RefreshCw,
  Search, DollarSign, Stethoscope, Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { memoryStore, PartyBreakdownItem, DEFAULT_STOCKISTS, MslDoctor } from '../../data/memoryStore';
import { MASTER_123_MSL_DOCTORS } from './MslSheet';
import { unProgressionStore } from '../../data/unProgressionStore';
import { MASTER_PRODUCTS } from '../../data/masterProducts';
import { CloudSyncBar } from '../CloudSyncBar';

const MONTHS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

const MONTH_OPTIONS = [
  { label: 'Apr-2026', value: 'Apr-2026', code: 'APR' },
  { label: 'May-2026', value: 'May-2026', code: 'MAY' },
  { label: 'Jun-2026', value: 'Jun-2026', code: 'JUN' },
  { label: 'Jul-2026', value: 'Jul-2026', code: 'JUL' },
  { label: 'Aug-2026', value: 'Aug-2026', code: 'AUG' },
  { label: 'Sep-2026', value: 'Sep-2026', code: 'SEP' },
  { label: 'Oct-2026', value: 'Oct-2026', code: 'OCT' },
  { label: 'Nov-2026', value: 'Nov-2026', code: 'NOV' },
  { label: 'Dec-2026', value: 'Dec-2026', code: 'DEC' },
  { label: 'Jan-2027', value: 'Jan-2027', code: 'JAN' },
  { label: 'Feb-2027', value: 'Feb-2027', code: 'FEB' },
  { label: 'Mar-2027', value: 'Mar-2027', code: 'MAR' },
];

const INVESTMENT_ACTIVITY_TYPES = [
  'CASH', 'GIFT CARDS', 'CONFERENCE', 'DINNER', 'IPHONE', 'HOTEL', 'SPECIAL PLAN', 'CHEQUE', 'HARRISON BOOK'
];

interface MetricConfig {
  sn: string;
  id: string;
  name: string;
  isCalculated?: boolean;
  hasBreakdown?: boolean;
  isInvestment?: boolean;
}

const METRICS_CONFIG: MetricConfig[] = [
  { sn: '1', id: 'budget', name: 'BUDGET (Lacs)' },
  { sn: '2', id: 'primary_curr', name: 'PRIMARY. 26-27 (Lacs)' },
  { sn: '', id: 'primary_prev', name: 'PRIMARY. 25-26 (Lacs)' },
  { sn: '3', id: 'prm_ach', name: '% PRM. ACHIEVEMENT', isCalculated: true },
  { sn: '', id: 'prm_growth', name: 'PRIMARY GROWTH %', isCalculated: true },
  { sn: '4', id: 'sec_curr', name: 'SECONDARY 26-27 (Lacs)' },
  { sn: '5', id: 'sec_prev', name: 'SECONDARY 25-26 (Lacs)' },
  { sn: '6', id: 'sec_growth', name: 'SECONDARY GROWTH %', isCalculated: true },
  { sn: '7', id: 'sales_returns', name: 'SALES RETURNS (₹)', hasBreakdown: true },
  { sn: '8', id: 'expiry', name: 'EXPIRY (₹)', hasBreakdown: true },
  { sn: '9', id: 'closing_stock', name: 'CLOSING STOCK (Lacs)' },
  { sn: '10', id: 'investment', name: 'INVESTMENT*', isInvestment: true }
];

const INITIAL_BASE: Record<string, Record<string, string>> = {
  budget: { APR: '4.34', MAY: '4.55', JUN: '4.89', JUL: '4.83', AUG: '4.98', SEP: '5.28', OCT: '4.70', NOV: '4.93', DEC: '5.30', JAN: '4.97', FEB: '4.69', MAR: '4.55' },
  primary_curr: { APR: '4.34', MAY: '4.75', JUN: '5.07', JUL: '4.84', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  primary_prev: { APR: '4.34', MAY: '4.66', JUN: '4.89', JUL: '4.36', AUG: '4.98', SEP: '1.82', OCT: '4.70', NOV: '4.01', DEC: '2.83', JAN: '3.50', FEB: '3.66', MAR: '2.22' },
  prm_ach: {}, prm_growth: {},
  sec_curr: { APR: '5.11', MAY: '4.74', JUN: '5.28', JUL: '4.80', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  sec_prev: { APR: '4.06', MAY: '4.44', JUN: '4.48', JUL: '4.95', AUG: '4.51', SEP: '4.28', OCT: '4.53', NOV: '4.47', DEC: '4.72', JAN: '4.73', FEB: '4.04', MAR: '4.51' },
  sec_growth: {},
  sales_returns: { APR: '52875', MAY: '0', JUN: '14244', JUL: '0', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  expiry: { APR: '37317', MAY: '0', JUN: '0', JUL: '26845', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  closing_stock: { APR: '5.13', MAY: '8.12', JUN: '7.80', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  investment: { APR: '12.5k', MAY: '150k', JUN: '0', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
};

class SalesPerformanceErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: any}> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("SalesPerformance Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-950/90 border-2 border-rose-500 text-rose-200 rounded-3xl space-y-3 m-4">
          <h3 className="font-bold text-lg">⚠️ Sales Performance Crash Error</h3>
          <p className="text-xs font-mono">{String(this.state.error?.message || this.state.error)}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export const SalesPerformanceSheet: React.FC = () => {
  return (
    <SalesPerformanceErrorBoundary>
      <SalesPerformanceContent />
    </SalesPerformanceErrorBoundary>
  );
};

const SalesPerformanceContent: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('Aug-2026');
  
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const draft = localStorage.getItem('dios_draft_sheet_03_sales_perf');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.salesBreakdown) memoryStore.salesBreakdown = { ...memoryStore.salesBreakdown, ...parsed.salesBreakdown };
        if (parsed.formData) return parsed.formData;
      }
    } catch (e) {}
    return memoryStore.salesPerformanceData || INITIAL_BASE;
  });

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🌟 Stockist Breakdown Modal State (For Returns & Expiry)
  const [activeStockistModal, setActiveStockistModal] = useState<{ rowId: string; rowName: string; month: string } | null>(null);
  const [stockistModalItems, setStockistModalItems] = useState<PartyBreakdownItem[]>([]);

  // 🌟 Doctor Investment Modal State (For INVESTMENT*)
  const [activeInvestmentModalMonth, setActiveInvestmentModalMonth] = useState<string | null>(null);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [newInvestmentEntry, setNewInvestmentEntry] = useState<{ doctorName: string; activityType: string; amount: number; note: string }>({
    doctorName: '', activityType: 'GIFT CARDS', amount: 0, note: ''
  });

  // MSL Master Doctors for Search
  const allMslDoctors: MslDoctor[] = useMemo(() => {
    if (memoryStore.mslData && memoryStore.mslData.length > 0) return memoryStore.mslData;
    try {
      const saved = localStorage.getItem('dios_msl_schedule_permanent_v5');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return MASTER_123_MSL_DOCTORS || [];
  }, []);

  const filteredMslDocs = useMemo(() => {
    if (!docSearchQuery.trim()) return [];
    const q = docSearchQuery.toLowerCase();
    return allMslDoctors.filter(d => 
      d.doctorName.toLowerCase().includes(q) || (d.speciality || '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [allMslDoctors, docSearchQuery]);

  // Handle Stockist Breakdown (Returns / Expiry)
  const openStockistBreakdown = (rowId: string, rowName: string, month: string) => {
    const key = `${rowId}_${month}`;
    const existing = memoryStore.salesBreakdown[key] || [];
    setStockistModalItems(JSON.parse(JSON.stringify(existing)));
    setActiveStockistModal({ rowId, rowName, month });
  };

  const handleAddStockistItem = () => {
    setStockistModalItems(prev => [
      ...prev,
      { id: 'item_' + Date.now(), partyName: DEFAULT_STOCKISTS[0], amount: 0, note: '' }
    ]);
  };

  const handleSaveStockistModal = () => {
    if (!activeStockistModal) return;
    const key = `${activeStockistModal.rowId}_${activeStockistModal.month}`;
    memoryStore.salesBreakdown[key] = stockistModalItems;

    const total = stockistModalItems.reduce((sum, it) => sum + (parseFloat(String(it.amount)) || 0), 0);
    setFormData(prev => {
      const updated = {
        ...prev,
        [activeStockistModal.rowId]: {
          ...prev[activeStockistModal.rowId],
          [activeStockistModal.month]: total > 0 ? String(total) : '0'
        }
      };
      memoryStore.salesPerformanceData = updated;
      try {
        localStorage.setItem('dios_draft_sheet_03_sales_perf', JSON.stringify({ formData: updated, salesBreakdown: memoryStore.salesBreakdown, selectedMonth }));
      } catch (e) {}
      return updated;
    });
    setActiveStockistModal(null);
  };

  // 🌟 Handle Doctor Investment Entries (Row 10)
  const handleSelectDoctorForInvestment = (doc: MslDoctor) => {
    setNewInvestmentEntry({
      ...newInvestmentEntry,
      doctorName: doc.doctorName,
      activityType: doc.activityType ? doc.activityType.toUpperCase() : 'GIFT CARDS'
    });
    setDocSearchQuery('');
  };

  const handleAddDoctorInvestment = () => {
    if (!activeInvestmentModalMonth) return;
    if (!newInvestmentEntry.doctorName.trim() && newInvestmentEntry.amount <= 0) {
      alert("Kripya Doctor ka naam aur Amount zaroor dalein!");
      return;
    }

    const key = `investment_${activeInvestmentModalMonth}`;
    const currentList: any[] = memoryStore.salesBreakdown[key] || [];
    const newItem = {
      id: 'inv_' + Date.now(),
      doctorName: newInvestmentEntry.doctorName.trim(),
      partyName: newInvestmentEntry.doctorName.trim(),
      activityType: newInvestmentEntry.activityType,
      amount: newInvestmentEntry.amount,
      note: newInvestmentEntry.note.trim()
    };

    const updatedList = [...currentList, newItem];
    memoryStore.salesBreakdown[key] = updatedList;

    // 🌟 Auto-Calculate Formatted 'k' String (e.g. ₹150,000 -> 150k, ₹12,500 -> 12.5k)
    const totalAmt = updatedList.reduce((sum, it) => sum + (parseFloat(String(it.amount)) || 0), 0);
    let formattedStr = '0';
    if (totalAmt >= 1000) {
      const inK = totalAmt / 1000;
      formattedStr = (inK % 1 === 0 ? inK.toFixed(0) : inK.toFixed(1)) + 'k';
    } else if (totalAmt > 0) {
      formattedStr = String(totalAmt);
    }

    handleCellChange('investment', activeInvestmentModalMonth, formattedStr);
    setNewInvestmentEntry({ doctorName: '', activityType: 'GIFT CARDS', amount: 0, note: '' });
  };

  const handleDeleteDoctorInvestment = (id: string) => {
    if (!activeInvestmentModalMonth) return;
    const key = `investment_${activeInvestmentModalMonth}`;
    const currentList: any[] = memoryStore.salesBreakdown[key] || [];
    const updatedList = currentList.filter(it => it.id !== id);
    memoryStore.salesBreakdown[key] = updatedList;

    const totalAmt = updatedList.reduce((sum, it) => sum + (parseFloat(String(it.amount)) || 0), 0);
    let formattedStr = '0';
    if (totalAmt >= 1000) {
      const inK = totalAmt / 1000;
      formattedStr = (inK % 1 === 0 ? inK.toFixed(0) : inK.toFixed(1)) + 'k';
    } else if (totalAmt > 0) {
      formattedStr = String(totalAmt);
    }

    handleCellChange('investment', activeInvestmentModalMonth, formattedStr);
  };

  const handleCellChange = (rowId: string, month: string, value: string) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [rowId]: {
          ...prev[rowId],
          [month]: value
        }
      };
      memoryStore.salesPerformanceData = updated;
      try {
        localStorage.setItem('dios_draft_sheet_03_sales_perf', JSON.stringify({ formData: updated, salesBreakdown: memoryStore.salesBreakdown, selectedMonth }));
      } catch (e) {}
      return updated;
    });
  };

  const handleAutoSyncFromDataHub = () => {
    const gridData = unProgressionStore.getData();
    const newSecCurr: Record<string, string> = { ...(formData.sec_curr || {}) };
    const newClosingStock: Record<string, string> = { ...(formData.closing_stock || {}) };

    MONTHS.forEach(code => {
      const monthGrid = gridData[code] || {};
      let secTotalVal = 0, closingTotalVal = 0;
      MASTER_PRODUCTS.forEach(p => {
        const item = monthGrid[p.sn];
        if (item) {
          secTotalVal += (item.netSec || 0) * p.pts;
          closingTotalVal += (item.closing || 0) * p.pts;
        }
      });
      if (secTotalVal > 0) newSecCurr[code] = (secTotalVal / 100000).toFixed(2);
      if (closingTotalVal > 0) newClosingStock[code] = (closingTotalVal / 100000).toFixed(2);
    });

    setFormData(prev => {
      const updated = { ...prev, sec_curr: newSecCurr, closing_stock: newClosingStock };
      memoryStore.salesPerformanceData = updated;
      return updated;
    });
    setStatusMsg('🎉 Successfully auto-synced Secondary 26-27 & Closing Stock from Data Hub!');
    setTimeout(() => setStatusMsg(''), 3500);
  };

  const calculateCell = (rowId: string, month: string): string => {
    if (rowId === 'prm_ach') {
      const pri = parseFloat(formData.primary_curr?.[month] || '0');
      const bud = parseFloat(formData.budget?.[month] || '0');
      return (pri > 0 && bud > 0) ? Math.round((pri / bud) * 100) + '%' : '-';
    }
    if (rowId === 'prm_growth') {
      const curr = parseFloat(formData.primary_curr?.[month] || '0');
      const prev = parseFloat(formData.primary_prev?.[month] || '0');
      if (curr > 0 && prev > 0) {
        const g = Math.round(((curr - prev) / prev) * 100);
        return (g > 0 ? '+' : '') + g + '%';
      }
      return '-';
    }
    if (rowId === 'sec_growth') {
      const curr = parseFloat(formData.sec_curr?.[month] || '0');
      const prev = parseFloat(formData.sec_prev?.[month] || '0');
      if (curr > 0 && prev > 0) {
        const g = Math.round(((curr - prev) / prev) * 100);
        return (g > 0 ? '+' : '') + g + '%';
      }
      return '-';
    }
    return formData[rowId]?.[month] || '';
  };

  const calculateCumm = (rowId: string): string => {
    if (rowId === 'prm_ach') {
      let totPri = 0, totBud = 0;
      MONTHS.forEach(m => {
        const p = parseFloat(formData.primary_curr?.[m] || '0');
        const b = parseFloat(formData.budget?.[m] || '0');
        if (p > 0) { totPri += p; totBud += b; }
      });
      return totBud > 0 ? Math.round((totPri / totBud) * 100) + '%' : '0%';
    }
    if (rowId === 'prm_growth' || rowId === 'sec_growth') {
      const fieldCurr = rowId === 'prm_growth' ? 'primary_curr' : 'sec_curr';
      const fieldPrev = rowId === 'prm_growth' ? 'primary_prev' : 'sec_prev';
      let totCurr = 0, totPrev = 0;
      MONTHS.forEach(m => {
        const c = parseFloat(formData[fieldCurr]?.[m] || '0');
        const p = parseFloat(formData[fieldPrev]?.[m] || '0');
        if (c > 0) { totCurr += c; totPrev += p; }
      });
      return totPrev > 0 ? ((totCurr - totPrev) / totPrev * 100).toFixed(0) + '%' : '-';
    }

    let sum = 0;
    let hasNumeric = false;
    MONTHS.forEach(m => {
      const v = parseFloat(formData[rowId]?.[m] || '');
      if (!isNaN(v)) { sum += v; hasNumeric = true; }
    });
    return hasNumeric ? (sum > 1000 ? Math.round(sum).toLocaleString() : sum.toFixed(2)) : '-';
  };

  const handleFetchFromCbo = async () => {
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(`CBO se ${selectedMonth} ka data fetch ho raha hai...`);
    const opt = MONTH_OPTIONS.find(m => m.value === selectedMonth);
    const targetCode = opt ? opt.code : 'AUG';

    try {
      const res = await fetch('/api/fetch-sales-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_month: selectedMonth, to_month: selectedMonth, fy_year: '2026-2027' })
      });
      const data = await res.json();
      if (data && data.success) {
        setFormData(prev => ({
          ...prev,
          primary_curr: { ...prev.primary_curr, [targetCode]: String(data.net_sales_lacs || '0') },
          sales_returns: { ...prev.sales_returns, [targetCode]: String(data.sales_return || '0') },
          expiry: { ...prev.expiry, [targetCode]: String(data.expiry || '0') },
        }));
        if (data.sales_return_breakdown) memoryStore.salesBreakdown[`sales_returns_${targetCode}`] = data.sales_return_breakdown;
        if (data.expiry_breakdown) memoryStore.salesBreakdown[`expiry_${targetCode}`] = data.expiry_breakdown;
        setStatusMsg(`🎉 SUCCESS! Net Primary ${data.net_sales_lacs}L, Returns ₹${data.sales_return}, Expiry ₹${data.expiry}!`);
      } else {
        throw new Error(data?.error || 'Failed to fetch');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'CBO fetch error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
            <TrendingUp size={22} />
          </span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              3. SALES PERFORMANCE
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <Sparkles size={10} /> Auto-Breakdown &amp; Investment Manager
              </span>
            </h2>
            <p className="text-xs text-slate-400">BE: BANWARI LAL MEENA • HQ: UDAIPUR • Returns, Expiry &amp; Doctor Investment Notes</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Target:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-400 focus:outline-none cursor-pointer"
            >
              {MONTH_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">{opt.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAutoSyncFromDataHub}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
          >
            <RefreshCw size={14} /> Auto-Sync Sec &amp; Stock
          </button>

          <button
            onClick={handleFetchFromCbo}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
            Auto-Fetch {selectedMonth}
          </button>
        </div>
      </div>

      {/* CloudSyncBar */}
      <CloudSyncBar
        storageKey="review/sheet_03_sales_performance"
        sheetTitle="3. Sales Performance"
        getData={() => ({ formData, salesBreakdown: memoryStore.salesBreakdown, selectedMonth })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.formData) {
            setFormData(cloudData.formData);
            memoryStore.salesPerformanceData = cloudData.formData;
          }
          if (cloudData.salesBreakdown) memoryStore.salesBreakdown = cloudData.salesBreakdown;
          if (cloudData.selectedMonth) setSelectedMonth(cloudData.selectedMonth);
        }}
        onSaveLocal={() => {
          memoryStore.salesPerformanceData = formData;
          try {
            localStorage.setItem('dios_draft_sheet_03_sales_perf', JSON.stringify({ formData, salesBreakdown: memoryStore.salesBreakdown, selectedMonth }));
          } catch (e) {}
        }}
      />

      {statusMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <Check size={16} className="text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
              <th className="p-3 w-10 text-center">S.N.</th>
              <th className="p-3 min-w-[240px]">Particulars</th>
              {MONTHS.map(m => (
                <th key={m} className={`p-3 text-center min-w-[75px] ${m === selectedMonth.substring(0,3).toUpperCase() ? 'text-cyan-400 bg-cyan-950/30 font-extrabold' : ''}`}>
                  {m}
                </th>
              ))}
              <th className="p-3 text-center min-w-[85px] bg-purple-950/50 text-purple-300 font-bold">CUMM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {METRICS_CONFIG.map((row) => (
              <tr key={row.id} className="hover:bg-slate-800/30 transition">
                <td className="p-2 text-center text-slate-500 font-mono">{row.sn}</td>
                <td className="p-2 font-medium text-slate-200 flex items-center justify-between">
                  <span>{row.name}</span>
                  {(row.hasBreakdown || row.isInvestment) && (
                    <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30 font-mono font-bold">
                      {row.isInvestment ? 'Dr. Manager' : 'Stockist Note'}
                    </span>
                  )}
                </td>
                
                {MONTHS.map((m) => {
                  const val = row.isCalculated ? calculateCell(row.id, m) : (formData[row.id]?.[m] ?? '');
                  const breakdownKey = `${row.id}_${m}`;
                  const items = memoryStore.salesBreakdown[breakdownKey] || [];
                  const hasItems = items.length > 0;

                  // 🌟 Investment Row 10 Click Handler
                  if (row.isInvestment) {
                    return (
                      <td key={m} className="p-1 text-center">
                        <div className="relative">
                          <input
                            type="text"
                            value={val}
                            onClick={() => { setActiveInvestmentModalMonth(m); setDocSearchQuery(''); }}
                            onChange={(e) => handleCellChange(row.id, m, e.target.value)}
                            placeholder="-"
                            className={`w-full py-1.5 px-2 rounded-lg font-mono text-xs border text-center transition cursor-pointer ${
                              hasItems 
                                ? 'bg-amber-950/40 text-amber-300 font-bold border-amber-500/60 shadow-sm' 
                                : 'bg-slate-950 text-slate-100 border-slate-800 hover:border-slate-600'
                            }`}
                            title="Click to open Doctor Investment Manager"
                          />
                          {hasItems && (
                            <span 
                              onClick={() => { setActiveInvestmentModalMonth(m); setDocSearchQuery(''); }}
                              className="absolute -top-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-950 cursor-pointer shadow"
                              title={`${items.length} Doctors Investment`}
                            >
                              {items.length}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  }

                  // 🌟 Sales Returns (Row 7) & Expiry (Row 8) Stockist Breakdown Click Handler
                  if (row.hasBreakdown) {
                    return (
                      <td key={m} className="p-1 text-center">
                        <div className="relative">
                          <input
                            type="text"
                            value={val}
                            onClick={() => openStockistBreakdown(row.id, row.name, m)}
                            onChange={(e) => handleCellChange(row.id, m, e.target.value)}
                            placeholder="-"
                            className={`w-full py-1.5 px-2 rounded-lg font-mono border text-center transition text-xs cursor-pointer ${
                              hasItems 
                                ? 'bg-amber-950/40 text-amber-300 font-bold border-amber-500/60 shadow-sm' 
                                : 'bg-slate-950 text-slate-100 border-slate-800 hover:border-slate-600'
                            }`}
                            title="Click to view/edit stockist breakdown"
                          />
                          {hasItems && (
                            <span 
                              onClick={() => openStockistBreakdown(row.id, row.name, m)}
                              className="absolute -top-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-950 cursor-pointer shadow"
                              title={`${items.length} Stockists`}
                            >
                              {items.length}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={m} className="p-1 text-center">
                      {row.isCalculated ? (
                        <div className="w-full py-1.5 px-2 bg-slate-950/80 rounded-lg font-mono font-bold text-cyan-400 border border-slate-800/60 text-center">
                          {val}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleCellChange(row.id, m, e.target.value)}
                          placeholder="-"
                          className="w-full py-1.5 px-2 bg-slate-950 rounded-lg font-mono text-slate-100 border border-slate-800 focus:border-purple-500 text-center transition text-xs"
                        />
                      )}
                    </td>
                  );
                })}

                <td className="p-2 text-center font-mono font-bold text-purple-300 bg-purple-950/20">
                  {calculateCumm(row.id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🌟 1. STOCKIST BREAKDOWN MODAL (FOR RETURNS & EXPIRY) */}
      {activeStockistModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <MessageSquare size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Stockist Breakdown &amp; Notes</h3>
                  <p className="text-xs text-slate-400 font-mono">{activeStockistModal.rowName} • {activeStockistModal.month} 2026</p>
                </div>
              </div>
              <button onClick={() => setActiveStockistModal(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer"><X size={20} /></button>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {stockistModalItems.map((item, idx) => (
                <div key={item.id || idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">Distributor / Stockist</label>
                    <select
                      value={item.partyName}
                      onChange={(e) => {
                        const copy = [...stockistModalItems];
                        copy[idx].partyName = e.target.value;
                        setStockistModalItems(copy);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-2.5 py-1.5 focus:border-amber-400 focus:outline-none"
                    >
                      {DEFAULT_STOCKISTS.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>

                  <div className="w-full sm:w-32">
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) => {
                        const copy = [...stockistModalItems];
                        copy[idx].amount = parseFloat(e.target.value) || 0;
                        setStockistModalItems(copy);
                      }}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-xs rounded-xl px-2.5 py-1.5 focus:border-amber-400 focus:outline-none text-right"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">Remarks / Note</label>
                    <input
                      type="text"
                      value={item.note || ''}
                      onChange={(e) => {
                        const copy = [...stockistModalItems];
                        copy[idx].note = e.target.value;
                        setStockistModalItems(copy);
                      }}
                      placeholder="e.g. Batch Pullback or Expiry return"
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setStockistModalItems(stockistModalItems.filter((_, i) => i !== idx))}
                    className="p-2 text-slate-500 hover:text-rose-400 self-end sm:self-center mt-2 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleAddStockistItem}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                <Plus size={14} /> Add Stockist
              </button>
              <button
                type="button"
                onClick={handleSaveStockistModal}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Save &amp; Update Cell
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 2. DOCTOR INVESTMENT MANAGER MODAL (WITH MASTER DOCTOR SEARCH) */}
      {activeInvestmentModalMonth && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-5">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40">
                  <DollarSign size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Doctor Investment Manager ({activeInvestmentModalMonth} 2026)
                  </h3>
                  <p className="text-xs text-slate-400">Search 123 Master Doctors • Select Activity • Auto-Calculates 'k'</p>
                </div>
              </div>
              <button onClick={() => setActiveInvestmentModalMonth(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer"><X size={20} /></button>
            </div>

            {/* Add Doctor Form */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs relative">
              <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
                <span>Add Doctor Investment Entry:</span>
                {newInvestmentEntry.doctorName && (
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <Check size={12} /> Selected: {newInvestmentEntry.doctorName}
                  </span>
                )}
              </div>

              {/* Master Doctor Search Autocomplete */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Master Doctor (e.g. Jayesh, Baldev, Abhay, DC Sharma)..."
                  value={docSearchQuery}
                  onChange={e => setDocSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:border-amber-400 focus:outline-none"
                />

                {filteredMslDocs.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border-2 border-amber-500/60 rounded-xl shadow-2xl p-1.5 z-50 max-h-44 overflow-y-auto space-y-1">
                    {filteredMslDocs.map(doc => (
                      <div
                        key={doc.srNo}
                        onClick={() => handleSelectDoctorForInvestment(doc)}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950 hover:bg-amber-950/60 border border-transparent hover:border-amber-500/40 text-xs cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[10px]">#{doc.srNo}</span>
                          <span className="font-bold text-white">{doc.doctorName}</span>
                          <span className="text-[10px] text-cyan-300 bg-cyan-950/60 px-1.5 py-0.2 rounded">{doc.speciality || '-'}</span>
                          {doc.activityType && <span className="text-[10px] text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded font-bold">{doc.activityType}</span>}
                        </div>
                        <span className="text-[10px] text-amber-400 font-bold">Pick ➔</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Doctor Name</label>
                  <input
                    type="text"
                    value={newInvestmentEntry.doctorName}
                    onChange={e => setNewInvestmentEntry({ ...newInvestmentEntry, doctorName: e.target.value })}
                    placeholder="Doctor Name"
                    className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-bold rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Activity / Support</label>
                  <select
                    value={newInvestmentEntry.activityType}
                    onChange={e => setNewInvestmentEntry({ ...newInvestmentEntry, activityType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded-xl px-2 py-1.5 text-xs focus:outline-none cursor-pointer"
                  >
                    {INVESTMENT_ACTIVITY_TYPES.map(act => <option key={act} value={act}>{act}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={newInvestmentEntry.amount || ''}
                    onChange={e => setNewInvestmentEntry({ ...newInvestmentEntry, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="50000"
                    className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold rounded-xl px-2.5 py-1.5 text-xs focus:outline-none text-right"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newInvestmentEntry.note}
                  onChange={e => setNewInvestmentEntry({ ...newInvestmentEntry, note: e.target.value })}
                  placeholder="Remarks / Note (e.g. Annual Support, Clinic Expansion)..."
                  className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddDoctorInvestment}
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Entry
                </button>
              </div>
            </div>

            {/* List of Added Investment Entries */}
            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-800 rounded-2xl p-2 bg-slate-950/60 max-h-[220px]">
              {(memoryStore.salesBreakdown[`investment_${activeInvestmentModalMonth}`] || []).length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs font-mono">
                  No doctor investment entries recorded yet for {activeInvestmentModalMonth}.
                </div>
              ) : (
                (memoryStore.salesBreakdown[`investment_${activeInvestmentModalMonth}`] || []).map((it: any) => (
                  <div key={it.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{it.doctorName || it.partyName}</span>
                        <span className="font-mono text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/30 font-bold">
                          {it.activityType || 'GIFT CARDS'}
                        </span>
                        {it.note && <span className="text-[11px] text-slate-400">({it.note})</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-emerald-400">₹{Number(it.amount).toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoctorInvestment(it.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="font-mono text-slate-400">
                Cell Value Preview: <b className="text-amber-400">{formData.investment?.[activeInvestmentModalMonth] || '0'}</b>
              </div>
              <button
                type="button"
                onClick={() => setActiveInvestmentModalMonth(null)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                Done &amp; Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
