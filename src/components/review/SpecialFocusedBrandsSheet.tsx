import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Search, Save, Download, Check, RefreshCw, 
  Layers, Sparkles, Filter, Info, ArrowUpRight 
} from 'lucide-react';
import { MASTER_PRODUCTS } from '../../data/masterProducts';
import { unProgressionStore, MONTH_CODES } from '../../data/unProgressionStore';

const STORAGE_KEY = 'dios_special_focused_brands_permanent_v1';

export interface BrandRowData {
  sn: number;
  name: string;
  familyKeyword: string;
  janToMar: string | number;
  apr: string | number; may: string | number; jun: string | number;
  jul: string | number; aug: string | number; sept: string | number;
  oct: string | number; nov: string | number; dec: string | number;
  jan: string | number; feb: string | number; mar: string | number;
}

const BRAND_FAMILIES = [
  { sn: 1, name: 'VINTEL', keyword: 'VINTEL', defaultJanMarPri: 3246, defaultJanMarSec: 4819 },
  { sn: 2, name: 'VINVES', keyword: 'VINVES', defaultJanMarPri: 0, defaultJanMarSec: 21 },
  { sn: 3, name: 'LINAGET', keyword: 'LINAGET', defaultJanMarPri: 214, defaultJanMarSec: 390 },
  { sn: 4, name: 'VALROS', keyword: 'VALROS', defaultJanMarPri: 817, defaultJanMarSec: 1234 },
  { sn: 5, name: 'DIOSGLT', keyword: 'DIOSGLT', defaultJanMarPri: 0, defaultJanMarSec: 71 },
];

const MONTH_SELECT_OPTIONS = [
  { label: 'All Months (Full Year)', key: 'ALL' },
  { label: 'Apr-2026', key: 'APR' },
  { label: 'May-2026', key: 'MAY' },
  { label: 'Jun-2026', key: 'JUN' },
  { label: 'Jul-2026', key: 'JUL' },
  { label: 'Aug-2026', key: 'AUG' },
  { label: 'Sep-2026', key: 'SEP' },
  { label: 'Oct-2026', key: 'OCT' },
  { label: 'Nov-2026', key: 'NOV' },
  { label: 'Dec-2026', key: 'DEC' },
  { label: 'Jan-2027', key: 'JAN' },
  { label: 'Feb-2027', key: 'FEB' },
  { label: 'Mar-2027', key: 'MAR' },
];

export const SpecialFocusedBrandsSheet: React.FC = () => {
  const [selectedMonthSync, setSelectedMonthSync] = useState('ALL');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // 🌟 Helper: Sums all SKUs of a Brand Family from Un. Sales Progression
  const getFamilyUnits = (keyword: string, monthCode: string, type: 'netPri' | 'netSec'): number => {
    const unGrid = unProgressionStore.getData();
    const monthData = unGrid[monthCode] || {};
    let total = 0;

    MASTER_PRODUCTS.forEach(p => {
      const pName = p.name.toUpperCase();
      const match = keyword === 'VINVES' 
        ? (pName.includes('VINVES') || pName.includes('VINVSE'))
        : pName.includes(keyword);

      if (match) {
        const item = monthData[p.sn];
        if (item) {
          total += item[type] || 0;
        }
      }
    });

    return total;
  };

  const initialPrimaryRows: BrandRowData[] = BRAND_FAMILIES.map(b => ({
    sn: b.sn,
    name: b.name,
    familyKeyword: b.keyword,
    janToMar: b.defaultJanMarPri,
    apr: getFamilyUnits(b.keyword, 'APR', 'netPri') || '',
    may: getFamilyUnits(b.keyword, 'MAY', 'netPri') || '',
    jun: getFamilyUnits(b.keyword, 'JUN', 'netPri') || '',
    jul: getFamilyUnits(b.keyword, 'JUL', 'netPri') || '',
    aug: getFamilyUnits(b.keyword, 'AUG', 'netPri') || '',
    sept: getFamilyUnits(b.keyword, 'SEP', 'netPri') || '',
    oct: '', nov: '', dec: '', jan: '', feb: '', mar: ''
  }));

  const initialSecondaryRows: BrandRowData[] = BRAND_FAMILIES.map(b => ({
    sn: b.sn,
    name: b.name,
    familyKeyword: b.keyword,
    janToMar: b.defaultJanMarSec,
    apr: getFamilyUnits(b.keyword, 'APR', 'netSec') || '',
    may: getFamilyUnits(b.keyword, 'MAY', 'netSec') || '',
    jun: getFamilyUnits(b.keyword, 'JUN', 'netSec') || '',
    jul: getFamilyUnits(b.keyword, 'JUL', 'netSec') || '',
    aug: getFamilyUnits(b.keyword, 'AUG', 'netSec') || '',
    sept: getFamilyUnits(b.keyword, 'SEP', 'netSec') || '',
    oct: '', nov: '', dec: '', jan: '', feb: '', mar: ''
  }));

  const [primaryRows, setPrimaryRows] = useState<BrandRowData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_pri');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialPrimaryRows;
  });

  const [secondaryRows, setSecondaryRows] = useState<BrandRowData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_sec');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialSecondaryRows;
  });

  const persistData = (pri: BrandRowData[], sec: BrandRowData[]) => {
    setPrimaryRows(pri);
    setSecondaryRows(sec);
    try {
      localStorage.setItem(STORAGE_KEY + '_pri', JSON.stringify(pri));
      localStorage.setItem(STORAGE_KEY + '_sec', JSON.stringify(sec));
    } catch (e) {}
  };

  const handlePriChange = (sn: number, field: keyof BrandRowData, val: string) => {
    const updated = primaryRows.map(r => r.sn === sn ? { ...r, [field]: val } : r);
    persistData(updated, secondaryRows);
  };

  const handleSecChange = (sn: number, field: keyof BrandRowData, val: string) => {
    const updated = secondaryRows.map(r => r.sn === sn ? { ...r, [field]: val } : r);
    persistData(primaryRows, updated);
  };

  // 🌟 1. AUTO-FILL PRIMARY & SECONDARY FROM UN. SALES PROGRESSION (Single Month or All)
  const handleAutoFillFromUnSales = () => {
    const monthsToSync = selectedMonthSync === 'ALL' 
      ? MONTH_CODES 
      : [selectedMonthSync];

    const updatedPri = primaryRows.map(row => {
      const copy: any = { ...row };
      monthsToSync.forEach(m => {
        const mKey = m.toLowerCase() === 'sep' ? 'sept' : m.toLowerCase();
        const sumVal = getFamilyUnits(row.familyKeyword, m, 'netPri');
        copy[mKey] = sumVal !== 0 ? sumVal : '';
      });
      return copy;
    });

    const updatedSec = secondaryRows.map(row => {
      const copy: any = { ...row };
      monthsToSync.forEach(m => {
        const mKey = m.toLowerCase() === 'sep' ? 'sept' : m.toLowerCase();
        const sumVal = getFamilyUnits(row.familyKeyword, m, 'netSec');
        copy[mKey] = sumVal !== 0 ? sumVal : '';
      });
      return copy;
    });

    persistData(updatedPri, updatedSec);
    const mLabel = MONTH_SELECT_OPTIONS.find(o => o.key === selectedMonthSync)?.label || selectedMonthSync;
    setStatusMsg(`🎉 SUCCESS: [${mLabel}] ka Primary aur Secondary data Un. Sales Prog se SKU sum hokar auto-fill ho gaya!`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleSave = () => {
    persistData(primaryRows, secondaryRows);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // 🧮 Math Calculations for Quarters & % Growth
  const parseNum = (v: any) => {
    const n = parseFloat(String(v || '0').replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const calculateQtr = (m1: any, m2: any, m3: any): number => {
    return parseNum(m1) + parseNum(m2) + parseNum(m3);
  };

  const calculateGrowth = (currentQtr: number, prevQtr: number): string => {
    if (prevQtr <= 0 && currentQtr <= 0) return '-';
    if (prevQtr <= 0) return currentQtr > 0 ? '+100%' : '-';
    const g = ((currentQtr - prevQtr) / prevQtr) * 100;
    return `${g >= 0 ? '+' : ''}${g.toFixed(1)}%`;
  };

  // 📥 Export Exact 2-Tier CSV matching csv_output/11_SPECIAL FOCUSED BRANDS.csv
  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push('HQ,UDAIPUR,,,,,,,,,,,,,,,,,,,,,');
    lines.push(',,,PRIMARY IN STRIPS,,,,,,,,,,,,,,,,,,,');
    lines.push('S.NO.,PRODUCT NAME, JAN TO MARCH PRIMARY SALE, APRIL,MAY,JUNE,QTR SALE,%GROWTH OVER LAST QTR,JULY,AUG,SEP,QTR SALE,GROWTH OVER LAST QTR,OCT,NOV,DEC,QTR SALE,GROWTH OVER LAST QTR,JAN,FEB,MAR,QTR SALE,GROWTH OVER LAST QTR');

    primaryRows.forEach(r => {
      const q1 = calculateQtr(r.apr, r.may, r.jun);
      const g1 = calculateGrowth(q1, parseNum(r.janToMar));
      const q2 = calculateQtr(r.jul, r.aug, r.sept);
      const g2 = calculateGrowth(q2, q1);
      const q3 = calculateQtr(r.oct, r.nov, r.dec);
      const g3 = calculateGrowth(q3, q2);
      const q4 = calculateQtr(r.jan, r.feb, r.mar);
      const g4 = calculateGrowth(q4, q3);

      lines.push(`${r.sn},${r.name},${r.janToMar},${r.apr},${r.may},${r.jun},${q1},${g1},${r.jul},${r.aug},${r.sept},${q2},${g2},${r.oct},${r.nov},${r.dec},${q3},${g3},${r.jan},${r.feb},${r.mar},${q4},${g4}`);
    });

    lines.push(',,,,,,,,,,,,,,,,,,,,,,');
    lines.push(',,,,,,,,,,,,,,,,,,,,,,');
    lines.push(',,,SECONDARY IN STRIPS,,,,,,,,,,,,,,,,,,,');
    lines.push('S.NO.,PRODUCT NAME, JAN TO MARCH SECONDARY SALE, APRIL,MAY,JUNE,QTR SALE,%GROWTH OVER LAST QTR,JULY,AUG,SEP,QTR SALE,GROWTH OVER LAST QTR,OCT,NOV,DEC,QTR SALE,GROWTH OVER LAST QTR,JAN,FEB,MAR,QTR SALE,GROWTH OVER LAST QTR');

    secondaryRows.forEach(r => {
      const q1 = calculateQtr(r.apr, r.may, r.jun);
      const g1 = calculateGrowth(q1, parseNum(r.janToMar));
      const q2 = calculateQtr(r.jul, r.aug, r.sept);
      const g2 = calculateGrowth(q2, q1);
      const q3 = calculateQtr(r.oct, r.nov, r.dec);
      const g3 = calculateGrowth(q3, q2);
      const q4 = calculateQtr(r.jan, r.feb, r.mar);
      const g4 = calculateGrowth(q4, q3);

      lines.push(`${r.sn},${r.name},${r.janToMar},${r.apr},${r.may},${r.jun},${q1},${g1},${r.jul},${r.aug},${r.sept},${q2},${g2},${r.oct},${r.nov},${r.dec},${q3},${g3},${r.jan},${r.feb},${r.mar},${q4},${g4}`);
    });

    const csvContent = lines.join('\\r\\n');
    const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '11_SPECIAL_FOCUSED_BRANDS.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><TrendingUp size={18} /></span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              11. SPECIAL FOCUSED BRANDS (Primary &amp; Secondary in Strips)
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                Auto-Synced from Un. Sales Prog
              </span>
            </h2>
            <p className="text-xs text-slate-400">HQ: UDAIPUR • VINTEL, VINVES, LINAGET, VALROS &amp; DIOSGLT All SKUs Aggregated</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 🌟 1. SELECTIVE MONTH AUTO-SYNC FROM UN. SALES PROG */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-cyan-500/50">
            <select
              value={selectedMonthSync}
              onChange={e => setSelectedMonthSync(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-400 px-2 py-1 focus:outline-none cursor-pointer"
            >
              {MONTH_SELECT_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key} className="bg-slate-900 text-white">{opt.label}</option>
              ))}
            </select>

            <button
              onClick={handleAutoFillFromUnSales}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
            >
              <RefreshCw size={12} className="text-yellow-300" /> ⚡ Auto-Fill Un. Sales
            </button>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            {savedSuccess ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
            {savedSuccess ? 'Saved' : 'Save Data'}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-blue-950/80 border border-blue-500/60 text-blue-200 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="p-1 hover:text-white cursor-pointer"><X size={15} /></button>
        </div>
      )}

      {/* 🌟 TABLE 1: PRIMARY IN STRIPS */}
      <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={14} /> Primary in Strips (Quarterly Analysis &amp; Growth %)
        </h3>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 font-bold uppercase border-b border-slate-800">
                <th className="p-2 text-center w-10">#</th>
                <th className="p-2 min-w-[120px]">Product Name</th>
                <th className="p-2 text-center min-w-[100px] text-slate-300">Jan-Mar Sale</th>
                <th className="p-2 text-center w-16">APR</th>
                <th className="p-2 text-center w-16">MAY</th>
                <th className="p-2 text-center w-16">JUNE</th>
                <th className="p-2 text-center w-20 text-blue-400 bg-blue-950/40">Q1 Sale</th>
                <th className="p-2 text-center w-20 text-emerald-400 bg-emerald-950/40">% Growth</th>
                <th className="p-2 text-center w-16">JULY</th>
                <th className="p-2 text-center w-16">AUG</th>
                <th className="p-2 text-center w-16">SEP</th>
                <th className="p-2 text-center w-20 text-blue-400 bg-blue-950/40">Q2 Sale</th>
                <th className="p-2 text-center w-20 text-emerald-400 bg-emerald-950/40">% Growth</th>
                <th className="p-2 text-center w-16">OCT</th>
                <th className="p-2 text-center w-16">NOV</th>
                <th className="p-2 text-center w-16">DEC</th>
                <th className="p-2 text-center w-20 text-blue-400 bg-blue-950/40">Q3 Sale</th>
                <th className="p-2 text-center w-20 text-emerald-400 bg-emerald-950/40">% Growth</th>
                <th className="p-2 text-center w-16">JAN</th>
                <th className="p-2 text-center w-16">FEB</th>
                <th className="p-2 text-center w-16">MAR</th>
                <th className="p-2 text-center w-20 text-blue-400 bg-blue-950/40">Q4 Sale</th>
                <th className="p-2 text-center w-20 text-emerald-400 bg-emerald-950/40">% Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {primaryRows.map(row => {
                const q1 = calculateQtr(row.apr, row.may, row.jun);
                const g1 = calculateGrowth(q1, parseNum(row.janToMar));
                const q2 = calculateQtr(row.jul, row.aug, row.sept);
                const g2 = calculateGrowth(q2, q1);
                const q3 = calculateQtr(row.oct, row.nov, row.dec);
                const g3 = calculateGrowth(q3, q2);
                const q4 = calculateQtr(row.jan, row.feb, row.mar);
                const g4 = calculateGrowth(q4, q3);

                return (
                  <tr key={row.sn} className="hover:bg-slate-900/60 transition">
                    <td className="p-2 text-center text-slate-500 font-mono">{row.sn}</td>
                    <td className="p-2 font-bold text-white">{row.name}</td>
                    <td className="p-1 text-center">
                      <input type="text" value={row.janToMar} onChange={e => handlePriChange(row.sn, 'janToMar', e.target.value)} className="w-16 bg-slate-900 border border-slate-700 text-center font-mono text-slate-300 font-bold rounded py-1" />
                    </td>

                    {/* Q1 */}
                    <td className="p-1"><input type="text" value={row.apr} onChange={e => handlePriChange(row.sn, 'apr', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.may} onChange={e => handlePriChange(row.sn, 'may', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.jun} onChange={e => handlePriChange(row.sn, 'jun', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-2 text-center font-mono font-bold text-blue-300 bg-blue-950/20">{q1 || '-'}</td>
                    <td className="p-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">{g1}</td>

                    {/* Q2 */}
                    <td className="p-1"><input type="text" value={row.jul} onChange={e => handlePriChange(row.sn, 'jul', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.aug} onChange={e => handlePriChange(row.sn, 'aug', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.sept} onChange={e => handlePriChange(row.sn, 'sept', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-2 text-center font-mono font-bold text-blue-300 bg-blue-950/20">{q2 || '-'}</td>
                    <td className="p-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">{g2}</td>

                    {/* Q3 */}
                    <td className="p-1"><input type="text" value={row.oct} onChange={e => handlePriChange(row.sn, 'oct', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.nov} onChange={e => handlePriChange(row.sn, 'nov', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.dec} onChange={e => handlePriChange(row.sn, 'dec', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-2 text-center font-mono font-bold text-blue-300 bg-blue-950/20">{q3 || '-'}</td>
                    <td className="p-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">{g3}</td>

                    {/* Q4 */}
                    <td className="p-1"><input type="text" value={row.jan} onChange={e => handlePriChange(row.sn, 'jan', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.feb} onChange={e => handlePriChange(row.sn, 'feb', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.mar} onChange={e => handlePriChange(row.sn, 'mar', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-2 text-center font-mono font-bold text-blue-300 bg-blue-950/20">{q4 || '-'}</td>
                    <td className="p-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">{g4}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🌟 TABLE 2: SECONDARY IN STRIPS */}
      <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={14} /> Secondary in Strips (Quarterly Analysis &amp; Growth %)
        </h3>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 font-bold uppercase border-b border-slate-800">
                <th className="p-2 text-center w-10">#</th>
                <th className="p-2 min-w-[120px]">Product Name</th>
                <th className="p-2 text-center min-w-[100px] text-slate-300">Jan-Mar Sale</th>
                <th className="p-2 text-center w-16">APR</th>
                <th className="p-2 text-center w-16">MAY</th>
                <th className="p-2 text-center w-16">JUNE</th>
                <th className="p-2 text-center w-20 text-cyan-400 bg-cyan-950/40">Q1 Sale</th>
                <th className="p-2 text-center w-20 text-emerald-400 bg-emerald-950/40">% Growth</th>
                <th className="p-2 text-center w-16">JULY</th>
                <th className="p-2 text-center w-16">AUG</th>
                <th className="p-2 text-center w-16">SEP</th>
                <th className="p-2 text-center w-20 text-cyan-400 bg-cyan-950/40">Q2 Sale</th>
                <th className="p-2 text-center w-20 text-emerald-400 bg-emerald-950/40">% Growth</th>
                <th className="p-2 text-center w-16">OCT</th>
                <th className="p-2 text-center w-16">NOV</th>
                <th className="p-2 text-center w-16">DEC</th>
                <th className="p-2 text-center w-20 text-cyan-400 bg-cyan-950/40">Q3 Sale</th>
                <th className="p-2 text-center w-20 text-emerald-400 bg-emerald-950/40">% Growth</th>
                <th className="p-2 text-center w-16">JAN</th>
                <th className="p-2 text-center w-16">FEB</th>
                <th className="p-2 text-center w-16">MAR</th>
                <th className="p-2 text-center w-20 text-cyan-400 bg-cyan-950/40">Q4 Sale</th>
                <th className="p-2 text-center w-20 text-emerald-400 bg-emerald-950/40">% Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {secondaryRows.map(row => {
                const q1 = calculateQtr(row.apr, row.may, row.jun);
                const g1 = calculateGrowth(q1, parseNum(row.janToMar));
                const q2 = calculateQtr(row.jul, row.aug, row.sept);
                const g2 = calculateGrowth(q2, q1);
                const q3 = calculateQtr(row.oct, row.nov, row.dec);
                const g3 = calculateGrowth(q3, q2);
                const q4 = calculateQtr(row.jan, row.feb, row.mar);
                const g4 = calculateGrowth(q4, q3);

                return (
                  <tr key={row.sn} className="hover:bg-slate-900/60 transition">
                    <td className="p-2 text-center text-slate-500 font-mono">{row.sn}</td>
                    <td className="p-2 font-bold text-white">{row.name}</td>
                    <td className="p-1 text-center">
                      <input type="text" value={row.janToMar} onChange={e => handleSecChange(row.sn, 'janToMar', e.target.value)} className="w-16 bg-slate-900 border border-slate-700 text-center font-mono text-slate-300 font-bold rounded py-1" />
                    </td>

                    {/* Q1 */}
                    <td className="p-1"><input type="text" value={row.apr} onChange={e => handleSecChange(row.sn, 'apr', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.may} onChange={e => handleSecChange(row.sn, 'may', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.jun} onChange={e => handleSecChange(row.sn, 'jun', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-2 text-center font-mono font-bold text-cyan-300 bg-cyan-950/20">{q1 || '-'}</td>
                    <td className="p-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">{g1}</td>

                    {/* Q2 */}
                    <td className="p-1"><input type="text" value={row.jul} onChange={e => handleSecChange(row.sn, 'jul', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.aug} onChange={e => handleSecChange(row.sn, 'aug', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.sept} onChange={e => handleSecChange(row.sn, 'sept', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-2 text-center font-mono font-bold text-cyan-300 bg-cyan-950/20">{q2 || '-'}</td>
                    <td className="p-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">{g2}</td>

                    {/* Q3 */}
                    <td className="p-1"><input type="text" value={row.oct} onChange={e => handleSecChange(row.sn, 'oct', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.nov} onChange={e => handleSecChange(row.sn, 'nov', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.dec} onChange={e => handleSecChange(row.sn, 'dec', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-2 text-center font-mono font-bold text-cyan-300 bg-cyan-950/20">{q3 || '-'}</td>
                    <td className="p-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">{g3}</td>

                    {/* Q4 */}
                    <td className="p-1"><input type="text" value={row.jan} onChange={e => handleSecChange(row.sn, 'jan', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.feb} onChange={e => handleSecChange(row.sn, 'feb', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-1"><input type="text" value={row.mar} onChange={e => handleSecChange(row.sn, 'mar', e.target.value)} placeholder="-" className="w-14 bg-slate-900 border border-slate-800 text-center font-mono text-white rounded py-1" /></td>
                    <td className="p-2 text-center font-mono font-bold text-cyan-300 bg-cyan-950/20">{q4 || '-'}</td>
                    <td className="p-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">{g4}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
