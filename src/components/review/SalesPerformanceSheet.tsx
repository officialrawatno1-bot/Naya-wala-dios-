import React, { useState, useRef } from 'react';
import { 
  TrendingUp, Bot, Loader2, Save, Download, Check, AlertTriangle, 
  MessageSquare, Plus, Trash2, X, Info, UploadCloud, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { memoryStore, PartyBreakdownItem, DEFAULT_STOCKISTS } from '../../data/memoryStore';
import { unProgressionStore } from '../../data/unProgressionStore';
import { MASTER_PRODUCTS } from '../../data/masterProducts';
import '../../data/seedRemarks';

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

interface MetricConfig {
  sn: string;
  id: string;
  name: string;
  isCalculated?: boolean;
  hasBreakdown?: boolean;
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
  { sn: '10', id: 'investment', name: 'INVESTMENT' }
];

const INITIAL_BASE: Record<string, Record<string, string>> = {
  budget: { APR: '4.34', MAY: '4.55', JUN: '4.89', JUL: '4.83', AUG: '4.98', SEP: '5.28', OCT: '4.70', NOV: '4.93', DEC: '5.30', JAN: '4.97', FEB: '4.69', MAR: '4.55' },
  primary_curr: { APR: '4.34', MAY: '4.75', JUN: '5.07', JUL: '4.84', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  primary_prev: { APR: '4.34', MAY: '4.66', JUN: '4.89', JUL: '4.36', AUG: '4.98', SEP: '1.82', OCT: '4.70', NOV: '4.01', DEC: '2.83', JAN: '3.50', FEB: '3.66', MAR: '2.22' },
  prm_ach: {},
  prm_growth: {},
  sec_curr: { APR: '5.11', MAY: '4.74', JUN: '5.28', JUL: '4.80', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  sec_prev: { APR: '4.06', MAY: '4.44', JUN: '4.48', JUL: '4.95', AUG: '4.51', SEP: '4.28', OCT: '4.53', NOV: '4.47', DEC: '4.72', JAN: '4.73', FEB: '4.04', MAR: '4.51' },
  sec_growth: {},
  sales_returns: { APR: '52875', MAY: '0', JUN: '14244', JUL: '0', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  expiry: { APR: '37317', MAY: '0', JUN: '0', JUL: '26845', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  closing_stock: { APR: '5.13', MAY: '8.12', JUN: '7.80', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  investment: { APR: '12.5k', MAY: '150k', JUN: '0', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
};


import React, { Component, ErrorInfo, ReactNode } from 'react';

class SalesPerformanceErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: any}> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("SalesPerformance Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-950/90 border-2 border-rose-500 text-rose-200 rounded-3xl space-y-3 shadow-2xl m-4">
          <h3 className="font-bold text-lg flex items-center gap-2">⚠️ Sales Performance Crash Error</h3>
          <p className="text-xs text-rose-300">Yeh error blank screen ki vajah ban raha tha:</p>
          <div className="bg-slate-950 p-4 rounded-2xl border border-rose-900 space-y-2">
            <div className="text-sm font-bold text-white font-mono">Exact Error Message:</div>
            <div className="text-sm text-rose-300 font-mono bg-rose-950/50 p-3 rounded-xl border border-rose-800">
              {String(this.state.error?.message || this.state.error)}
            </div>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Clear Memory &amp; Reload App
          </button>
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
  if (!memoryStore.salesPerformanceData) {
    memoryStore.salesPerformanceData = INITIAL_BASE;
  }
  return memoryStore.salesPerformanceData;
});
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 📝 Modal State for Remarks / Party Breakdown
  const [activeModal, setActiveModal] = useState<{
    rowId: string;
    rowName: string;
    month: string;
  } | null>(null);

  const [modalItems, setModalItems] = useState<PartyBreakdownItem[]>([]);

  const openBreakdownModal = (rowId: string, rowName: string, month: string) => {
    const key = `${rowId}_${month}`;
    const existing = memoryStore.salesBreakdown[key] || [];
    setModalItems(JSON.parse(JSON.stringify(existing)));
    setActiveModal({ rowId, rowName, month });
  };

  const handleAddModalItem = () => {
    setModalItems(prev => [
      ...prev,
      {
        id: 'item_' + Date.now(),
        partyName: DEFAULT_STOCKISTS[0],
        amount: 0,
        note: ''
      }
    ]);
  };

  const handleModalItemChange = (idx: number, field: keyof PartyBreakdownItem, val: any) => {
    setModalItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveModalItem = (idx: number) => {
    setModalItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveModal = () => {
    if (!activeModal) return;
    const key = `${activeModal.rowId}_${activeModal.month}`;
    memoryStore.salesBreakdown[key] = modalItems;

    // Auto calculate total and update ONLY this specific month cell value
    const total = modalItems.reduce((sum, it) => sum + (parseFloat(String(it.amount)) || 0), 0);
    setFormData(prev => ({
      ...prev,
      [activeModal.rowId]: {
        ...prev[activeModal.rowId],
        [activeModal.month]: total > 0 ? String(total) : '0'
      }
    }));

    setActiveModal(null);
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
      return updated;
    });
  };

    const handleAutoSyncFromDataHub = () => {
    const gridData = unProgressionStore.getData();
    const newSecCurr: Record<string, string> = { ...(formData.sec_curr || {}) };
    const newClosingStock: Record<string, string> = { ...(formData.closing_stock || {}) };

    MONTHS.forEach(code => {
      const monthGrid = gridData[code] || {};
      let secTotalVal = 0;
      let closingTotalVal = 0;

      MASTER_PRODUCTS.forEach(p => {
        const item = monthGrid[p.sn];
        if (item) {
          secTotalVal += (item.netSec || 0) * p.pts;
          closingTotalVal += (item.closing || 0) * p.pts;
        }
      });

      if (secTotalVal > 0) {
        newSecCurr[code] = (secTotalVal / 100000).toFixed(2);
      }
      if (closingTotalVal > 0) {
        newClosingStock[code] = (closingTotalVal / 100000).toFixed(2);
      }
    });

    setFormData(prev => {
      const updated = {
        ...prev,
        sec_curr: newSecCurr,
        closing_stock: newClosingStock
      };
      memoryStore.salesPerformanceData = updated;
      return updated;
    });

    setStatusMsg('🎉 Successfully auto-synced Secondary 26-27 & Closing Stock from Data Hub!');
    setTimeout(() => setStatusMsg(null), 3500);
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
    if (rowId === 'prm_growth') {
      let totCurr = 0, totPrev = 0;
      MONTHS.forEach(m => {
        const c = parseFloat(formData.primary_curr?.[m] || '0');
        const p = parseFloat(formData.primary_prev?.[m] || '0');
        if (c > 0) { totCurr += c; totPrev += p; }
      });
      return totPrev > 0 ? ((totCurr - totPrev) / totPrev * 100).toFixed(0) + '%' : '-';
    }
    if (rowId === 'sec_growth') {
      let totCurr = 0, totPrev = 0;
      MONTHS.forEach(m => {
        const c = parseFloat(formData.sec_curr?.[m] || '0');
        const p = parseFloat(formData.sec_prev?.[m] || '0');
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

  // 🤖 1. AUTO-FETCH CBO SALES (Multi-Month safe)
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
        body: JSON.stringify({
          from_month: selectedMonth,
          to_month: selectedMonth,
          fy_year: '2026-2027'
        })
      });

      const data = await res.json();

      if (data && data.success) {
        setFormData(prev => ({
          ...prev,
          primary_curr: { ...prev.primary_curr, [targetCode]: String(data.net_sales_lacs || '0') },
          sales_returns: { ...prev.sales_returns, [targetCode]: String(data.sales_return || '0') },
          expiry: { ...prev.expiry, [targetCode]: String(data.expiry || '0') },
        }));

        if (data.sales_return_breakdown) {
          memoryStore.salesBreakdown[`sales_returns_${targetCode}`] = data.sales_return_breakdown;
        }
        if (data.expiry_breakdown) {
          memoryStore.salesBreakdown[`expiry_${targetCode}`] = data.expiry_breakdown;
        }

        setStatusMsg(`🎉 SUCCESS! ${selectedMonth} auto-filled: Net Primary ${data.net_sales_lacs}L, Returns ₹${data.sales_return}, Expiry ₹${data.expiry}!`);
      } else {
        throw new Error(data?.error || 'Failed to fetch sales performance data');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'CBO fetch error');
      setStatusMsg('');
    } finally {
      setLoading(false);
    }
  };

  // 📂 2. DIRECT UPLOAD & PARSE SPO EXCEL (Instant In-Browser Processing)
  const handleUploadSpoExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMsg(`Reading & Parsing ${file.name}...`);
    setErrorMsg(null);

    const opt = MONTH_OPTIONS.find(m => m.value === selectedMonth);
    const targetCode = opt ? opt.code : 'AUG';

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      let totalNetSales = 0;
      let totalGoodsReturn = 0;
      let totalBreakageExpiry = 0;

      const returnBreakdown: PartyBreakdownItem[] = [];
      const expiryBreakdown: PartyBreakdownItem[] = [];

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length < 5) continue;

        const stockistName = String(row[1] || '').trim();
        if (!stockistName) continue;

        const uName = stockistName.toUpperCase();
        if (uName.includes('STOCKIST') || uName.includes('REPORT') || uName.includes('SRNO') || uName.includes('DIOS') || uName === 'TOTAL') continue;

        const parseNum = (val: any) => {
          if (!val) return 0;
          const clean = String(val).replace(/,/g, '').replace(/₹/g, '').trim();
          const n = parseFloat(clean);
          return isNaN(n) ? 0 : n;
        };

        const goodsReturn = parseNum(row[5]) || parseNum(row[7]);
        const breakageExpiry = parseNum(row[11]) || parseNum(row[9]);
        const netSales = parseNum(row[14]);

        if (goodsReturn > 0) {
          totalGoodsReturn += goodsReturn;
          returnBreakdown.push({
            id: 'ret_' + r,
            partyName: stockistName,
            amount: goodsReturn,
            note: 'Goods Return'
          });
        }

        if (breakageExpiry > 0) {
          totalBreakageExpiry += breakageExpiry;
          expiryBreakdown.push({
            id: 'exp_' + r,
            partyName: stockistName,
            amount: breakageExpiry,
            note: 'Expiry Return'
          });
        }

        if (netSales !== 0) {
          totalNetSales += netSales;
        }
      }

      const netSalesLacs = (totalNetSales / 100000).toFixed(2);

      // Update targeted month cleanly in React state
      setFormData(prev => ({
        ...prev,
        primary_curr: { ...prev.primary_curr, [targetCode]: netSalesLacs },
        sales_returns: { ...prev.sales_returns, [targetCode]: String(Math.round(totalGoodsReturn)) },
        expiry: { ...prev.expiry, [targetCode]: String(Math.round(totalBreakageExpiry)) }
      }));

      // Store remarks breakdown in memoryStore
      memoryStore.salesBreakdown[`sales_returns_${targetCode}`] = returnBreakdown;
      memoryStore.salesBreakdown[`expiry_${targetCode}`] = expiryBreakdown;

      setStatusMsg(`🎉 SUCCESS! '${file.name}' parsed: Net Primary ${netSalesLacs}L, Returns ₹${totalGoodsReturn.toLocaleString()}, Expiry ₹${totalBreakageExpiry.toLocaleString()}!`);
    } catch (err: any) {
      setErrorMsg(`Excel reading error: ${err.message || String(err)}`);
      setStatusMsg('');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 📊 3. EXPORT EXCEL WITH NATIVE HOVER COMMENTS
  const handleExportExcelWithComments = () => {
    const wb = XLSX.utils.book_new();
    const headers = ['S.N.', 'PARTICULARS', ...MONTHS, 'CUMM'];
    const wsData: any[][] = [];

    wsData.push([{ v: 'DIOS LIFESCIENCES PVT LTD', s: { font: { sz: 14, bold: true } } }]);
    wsData.push([{ v: '3. SALES PERFORMANCE (WITH STOCKIST-WISE REMARKS COMMENTS)', s: { font: { sz: 12, bold: true, color: { rgb: '0284C7' } } } }]);
    wsData.push(headers.map(h => ({
      v: h,
      s: {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '0F172A' } },
        alignment: { horizontal: 'center' }
      }
    })));

    METRICS_CONFIG.forEach(row => {
      const rCells: any[] = [
        { v: row.sn, s: { alignment: { horizontal: 'center' } } },
        { v: row.name, s: { font: { bold: true } } }
      ];

      MONTHS.forEach(m => {
        const val = row.isCalculated ? calculateCell(row.id, m) : (formData[row.id]?.[m] || '');
        const cellObj: any = {
          v: val,
          s: { alignment: { horizontal: 'center' } }
        };

        if (row.hasBreakdown) {
          const key = `${row.id}_${m}`;
          const items = memoryStore.salesBreakdown[key];
          if (items && items.length > 0) {
            const commentLines = items.map(it => `• ${it.partyName}: ₹${Number(it.amount).toLocaleString()} ${it.note ? '(' + it.note + ')' : ''}`);
            cellObj.c = [
              {
                a: 'DIOS Review System',
                t: `Party-wise Breakdown (${row.name} - ${m}):\n${commentLines.join('\n')}\nTotal: ₹${Number(val).toLocaleString()}`
              }
            ];
            cellObj.s.fill = { fgColor: { rgb: 'FEF3C7' } }; // Yellow tint
          }
        }

        rCells.push(cellObj);
      });

      rCells.push({
        v: calculateCumm(row.id),
        s: { font: { bold: true, color: { rgb: '059669' } }, alignment: { horizontal: 'center' } }
      });

      wsData.push(rCells);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 6 }, { wch: 32 }, ...MONTHS.map(() => ({ wch: 11 })), { wch: 14 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Sales Performance');
    XLSX.writeFile(wb, `Sales_Performance_Review_${selectedMonth}.xlsx`);
  };

  const handleSave = () => {
    memoryStore.salesPerformanceData = formData;
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
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
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                <MessageSquare size={10} /> Dual Mode (Fetch + Upload)
              </span>
            </h2>
            <p className="text-xs text-slate-400">BE: BANWARI LAL MEENA • HQ: UDAIPUR • Net Primary Engine</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Target:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              disabled={loading}
              className="bg-transparent text-xs font-bold text-cyan-400 focus:outline-none cursor-pointer"
            >
              {MONTH_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 📂 Option 1: Direct File Upload */}
          <button
        onClick={handleAutoSyncFromDataHub}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 transition cursor-pointer"
        title="Auto-sync Secondary 26-27 & Closing Stock from Data Hub"
      >
        <RefreshCw size={14} /> Auto-Sync Sec &amp; Stock
      </button>

      <label className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer">
            <UploadCloud size={14} />
            Upload SPO Excel
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleUploadSpoExcel}
              className="hidden"
            />
          </label>

          {/* ⚡ Option 2: Live Auto-Fetch */}
          <button
            onClick={handleFetchFromCbo}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 transition cursor-pointer"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
            Auto-Fetch {selectedMonth}
          </button>

          {/* 📊 Option 3: Export with Comments */}
          <button
            onClick={handleExportExcelWithComments}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            title="Download Excel with native hover comments"
          >
            <Download size={14} /> Export Excel
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-700"
          >
            {savedSuccess ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
            {savedSuccess ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {statusMsg && !errorMsg && (
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

      <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400">
        <Info size={14} className="text-amber-400 shrink-0" />
        <span>
          Aap chahe <b>"Auto-Fetch"</b> karein ya CBO se download ki hui <b>"Upload SPO Excel"</b> karein — dono se <b>Net Primary (4.32L)</b>, <b>Returns (₹5,590)</b> aur <b>Expiry (₹21,498)</b> stockist-wise load ho jayenge!
        </span>
      </div>

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
                  {row.hasBreakdown && (
                    <span className="text-[10px] text-amber-400/80 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20 font-mono">
                      Breakdown
                    </span>
                  )}
                </td>
                
                {MONTHS.map((m) => {
                  const val = row.isCalculated ? calculateCell(row.id, m) : (formData[row.id]?.[m] ?? '');
                  const breakdownKey = `${row.id}_${m}`;
                  const items = memoryStore.salesBreakdown[breakdownKey] || [];
                  const hasItems = items.length > 0;
                  const isSelectedCol = m === selectedMonth.substring(0,3).toUpperCase();

                  return (
                    <td key={m} className={`p-1 text-center ${isSelectedCol ? 'bg-cyan-950/10' : ''}`}>
                      {row.isCalculated ? (
                        <div className="w-full py-1.5 px-2 bg-slate-950/80 rounded-lg font-mono font-bold text-cyan-400 border border-slate-800/60 text-center">
                          {val}
                        </div>
                      ) : row.hasBreakdown ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={val}
                            onClick={() => openBreakdownModal(row.id, row.name, m)}
                            onChange={(e) => handleCellChange(row.id, m, e.target.value)}
                            placeholder="-"
                            className={`w-full py-1.5 px-2 bg-slate-950 rounded-lg font-mono border focus:outline-none text-center transition text-xs cursor-pointer ${
                              hasItems 
                                ? 'text-amber-300 font-bold border-amber-500/50 hover:bg-amber-950/30 shadow-sm shadow-amber-950/40' 
                                : 'text-slate-100 border-slate-800 hover:border-slate-600'
                            }`}
                            title="Click to view/edit stockist remarks breakdown"
                          />
                          {hasItems && (
                            <span 
                              onClick={() => openBreakdownModal(row.id, row.name, m)}
                              className="absolute -top-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-950 shadow cursor-pointer"
                              title={`${items.length} stockists breakdown`}
                            >
                              {items.length}
                            </span>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleCellChange(row.id, m, e.target.value)}
                          placeholder="-"
                          className="w-full py-1.5 px-2 bg-slate-950 rounded-lg font-mono text-slate-100 border border-slate-800 focus:border-purple-500 focus:bg-slate-900 focus:outline-none text-center transition text-xs"
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

      {/* 📝 STOCKIST REMARKS & BREAKDOWN MODAL */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <MessageSquare size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Stockist Remarks &amp; Breakdown
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {activeModal.rowName} • <span className="text-amber-400 font-bold">{activeModal.month} 2026</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {modalItems.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                  Koi stockist breakdown add nahi hai. Click "+ Add Stockist" to add manual remarks.
                </div>
              ) : (
                modalItems.map((item, idx) => (
                  <div key={item.id || idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-400 font-semibold block mb-1">Distributor / Stockist</label>
                      <select
                        value={item.partyName}
                        onChange={(e) => handleModalItemChange(idx, 'partyName', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
                      >
                        {DEFAULT_STOCKISTS.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-32">
                      <label className="text-[10px] text-slate-400 font-semibold block mb-1">Amount (₹)</label>
                      <input
                        type="number"
                        value={item.amount || ''}
                        onChange={(e) => handleModalItemChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400 text-right"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="text-[10px] text-slate-400 font-semibold block mb-1">Reason / Remarks Note</label>
                      <input
                        type="text"
                        value={item.note || ''}
                        onChange={(e) => handleModalItemChange(idx, 'note', e.target.value)}
                        placeholder="e.g. Goods Return or Expiry batch"
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveModalItem(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400 self-end sm:self-center mt-2 sm:mt-4 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleAddModalItem}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                <Plus size={14} /> Add Stockist
              </button>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Breakdown</div>
                  <div className="text-sm font-bold text-amber-400 font-mono">
                    ₹ {modalItems.reduce((s, it) => s + (parseFloat(String(it.amount)) || 0), 0).toLocaleString()}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  Save Remarks &amp; Update Cell
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
