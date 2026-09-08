import React, { useState, useMemo } from 'react';
import { 
  Award, TrendingUp, Download, Check, RefreshCw, 
  Layers, Search, DollarSign, Sparkles, X, Target, Zap, Calendar
} from 'lucide-react';
import { CloudSyncBar } from '../CloudSyncBar';
import { unProgressionStore } from '../../data/unProgressionStore';
import { MASTER_PRODUCTS } from '../../data/masterProducts';
import { memoryStore } from '../../data/memoryStore';

const STORAGE_KEY = 'dios_product_incentive_sheet16_v4';

export interface ProductIncentiveRow {
  sn: number;
  name: string;
  keyword: string;
  ratePerStrip: number;
  janToMar: number | string;
  apr: number | string; may: number | string; jun: number | string;
  jul: number | string; aug: number | string; sept: number | string;
  oct: number | string; nov: number | string; dec: number | string;
  jan: number | string; feb: number | string; mar: number | string;
}

export interface SpecialIncentiveRow {
  sn: number;
  name: string;
  amountPerUnit: number;
  criteria: string;
  apr: number | string; may: number | string; jun: number | string;
  jul: number | string; aug: number | string; sept: number | string;
  oct: number | string; nov: number | string; dec: number | string;
  jan: number | string; feb: number | string; mar: number | string;
}

const INITIAL_FOCUS_PRODUCTS: ProductIncentiveRow[] = [
  { sn: 1, name: 'VINTEL', keyword: 'VINTEL', ratePerStrip: 1.0, janToMar: 3246, apr: 1605, may: 1498, jun: 1920, jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { sn: 2, name: 'VINVES', keyword: 'VINVES', ratePerStrip: 2.0, janToMar: 0, apr: 0, may: 0, jun: 0, jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { sn: 3, name: 'LINAGET', keyword: 'LINAGET', ratePerStrip: 1.5, janToMar: 264, apr: 24, may: 84, jun: 75, jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { sn: 4, name: 'VALROS', keyword: 'VALROS', ratePerStrip: 1.5, janToMar: 817, apr: 126, may: 430, jun: 424, jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { sn: 5, name: 'DIOSGLT', keyword: 'DIOSGLT', ratePerStrip: 1.75, janToMar: 1, apr: -1, may: 65, jun: 0, jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
];

const INITIAL_SPECIAL_INCENTIVE: SpecialIncentiveRow[] = [
  { sn: 1, name: 'CONVERSION SI', amountPerUnit: 1000, criteria: 'MINIMUM 3 DrS / MONTH', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { sn: 2, name: 'CAMP SI', amountPerUnit: 1000, criteria: 'MINIMUM 5 Rx in Camp', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { sn: 3, name: 'WCFYH SI', amountPerUnit: 1000, criteria: 'EVERY CONVERSION (Campaign Enrolled)', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
];

export const ProductIncentiveSheet: React.FC = () => {
  const [beName, setBeName] = useState(() => memoryStore.beName || 'BANWARI LAL MEENA');
  const [hqName, setHqName] = useState(() => memoryStore.hqName || 'UDAIPUR');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [activeQtrView, setActiveQtrView] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [autoFillQtr, setAutoFillQtr] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');

  const [products, setProducts] = useState<ProductIncentiveRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_FOCUS_PRODUCTS;
  });

  const [specialList, setSpecialList] = useState<SpecialIncentiveRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_special');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_SPECIAL_INCENTIVE;
  });

  const persistData = (newProds: ProductIncentiveRow[], newSpecials: SpecialIncentiveRow[]) => {
    setProducts(newProds);
    setSpecialList(newSpecials);
    try {
      localStorage.setItem(STORAGE_KEY + '_products', JSON.stringify(newProds));
      localStorage.setItem(STORAGE_KEY + '_special', JSON.stringify(newSpecials));
    } catch (e) {}
  };

  const handleProductChange = (sn: number, field: keyof ProductIncentiveRow, val: any) => {
    const updated = products.map(p => p.sn === sn ? { ...p, [field]: val } : p);
    persistData(updated, specialList);
  };

  const handleSpecialChange = (sn: number, field: keyof SpecialIncentiveRow, val: any) => {
    const updated = specialList.map(s => s.sn === sn ? { ...s, [field]: val } : s);
    persistData(products, updated);
  };

  const parseNum = (v: any) => {
    const n = parseFloat(String(v || '0').replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const getQtrDetails = (row: ProductIncentiveRow, m1: any, m2: any, m3: any, prevBase: number) => {
    const qtrSale = parseNum(m1) + parseNum(m2) + parseNum(m3);
    const growth = prevBase > 0 ? ((qtrSale - prevBase) / prevBase) * 100 : 0;
    const minRequired = Math.round(prevBase * 1.15);
    const isEligible = qtrSale >= minRequired || growth > 0;
    const incEarned = isEligible ? Number((qtrSale * row.ratePerStrip).toFixed(1)) : 0;

    return { qtrSale, growth, minRequired, incEarned };
  };

  const handleAutoFillFromSheets = () => {
    const unGrid = unProgressionStore.getData();

    let m1 = 'APR', m2 = 'MAY', m3 = 'JUN';
    let m1Key: keyof SpecialIncentiveRow = 'apr', m2Key: keyof SpecialIncentiveRow = 'may', m3Key: keyof SpecialIncentiveRow = 'jun';

    if (autoFillQtr === 'Q2') { m1 = 'JUL'; m2 = 'AUG'; m3 = 'SEP'; m1Key = 'jul'; m2Key = 'aug'; m3Key = 'sept'; }
    if (autoFillQtr === 'Q3') { m1 = 'OCT'; m2 = 'NOV'; m3 = 'DEC'; m1Key = 'oct'; m2Key = 'nov'; m3Key = 'dec'; }
    if (autoFillQtr === 'Q4') { m1 = 'JAN'; m2 = 'FEB'; m3 = 'MAR'; m1Key = 'jan'; m2Key = 'feb'; m3Key = 'mar'; }

    const getPrimaryStrips = (keyword: string, monthCode: string): number => {
      const monthData = unGrid[monthCode] || {};
      let total = 0;
      MASTER_PRODUCTS.forEach(p => {
        const pName = p.name.toUpperCase();
        const match = keyword === 'VINVES' 
          ? (pName.includes('VINVES') || pName.includes('VINVSE'))
          : pName.includes(keyword);
        if (match && monthData[p.sn]) {
          total += monthData[p.sn].netPri || 0;
        }
      });
      return total;
    };

    const updatedProds = products.map(p => {
      const s1 = getPrimaryStrips(p.keyword, m1);
      const s2 = getPrimaryStrips(p.keyword, m2);
      const s3 = getPrimaryStrips(p.keyword, m3);

      const copy: any = { ...p };
      copy[m1Key] = s1;
      copy[m2Key] = s2;
      copy[m3Key] = s3;
      return copy;
    });

    const efData = memoryStore.effortLevelData;
    const convM1 = efData?.dr_conversion?.[m1] || 0;
    const convM2 = efData?.dr_conversion?.[m2] || 0;
    const convM3 = efData?.dr_conversion?.[m3] || 0;

    const updatedSpecial = specialList.map(s => {
      if (s.sn === 1) { // Conversion SI
        return {
          ...s,
          [m1Key]: convM1,
          [m2Key]: convM2,
          [m3Key]: convM3
        };
      }
      return s;
    });

    persistData(updatedProds, updatedSpecial);
    setStatusMsg(`🎉 Sheet 4 & 1 se [${autoFillQtr}] ka data successfully auto-fill ho gaya!`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const activeQtrValue = useMemo(() => {
    let totalQtrInc = 0;
    let totalQtrStrips = 0;

    const productBreakdown = products.map(p => {
      const b = parseNum(p.janToMar);
      const q1 = getQtrDetails(p, p.apr, p.may, p.jun, b);
      const q2 = getQtrDetails(p, p.jul, p.aug, p.sept, q1.qtrSale || b);
      const q3 = getQtrDetails(p, p.oct, p.nov, p.dec, q2.qtrSale || b);
      const q4 = getQtrDetails(p, p.jan, p.feb, p.mar, q3.qtrSale || b);

      let activeQtrObj = q1;
      if (activeQtrView === 'Q2') activeQtrObj = q2;
      if (activeQtrView === 'Q3') activeQtrObj = q3;
      if (activeQtrView === 'Q4') activeQtrObj = q4;

      totalQtrInc += activeQtrObj.incEarned;
      totalQtrStrips += activeQtrObj.qtrSale;

      return { ...p, activeQtrObj };
    });

    return { productBreakdown, totalQtrInc, totalQtrStrips };
  }, [products, activeQtrView]);

  const activeSpecialIncentiveTotal = useMemo(() => {
    let m1Key: keyof SpecialIncentiveRow = 'apr';
    let m2Key: keyof SpecialIncentiveRow = 'may';
    let m3Key: keyof SpecialIncentiveRow = 'jun';

    if (activeQtrView === 'Q2') { m1Key = 'jul'; m2Key = 'aug'; m3Key = 'sept'; }
    if (activeQtrView === 'Q3') { m1Key = 'oct'; m2Key = 'nov'; m3Key = 'dec'; }
    if (activeQtrView === 'Q4') { m1Key = 'jan'; m2Key = 'feb'; m3Key = 'mar'; }

    return specialList.reduce((sum, s) => {
      const v1 = parseNum(s[m1Key]) * s.amountPerUnit;
      const v2 = parseNum(s[m2Key]) * s.amountPerUnit;
      const v3 = parseNum(s[m3Key]) * s.amountPerUnit;
      return sum + v1 + v2 + v3;
    }, 0);
  }, [specialList, activeQtrView]);

  const activeSpecialBreakdown = useMemo(() => {
    let m1Key: keyof SpecialIncentiveRow = 'apr';
    let m2Key: keyof SpecialIncentiveRow = 'may';
    let m3Key: keyof SpecialIncentiveRow = 'jun';
    let m1Name = 'APR', m2Name = 'MAY', m3Name = 'JUN';

    if (activeQtrView === 'Q2') { m1Key = 'jul'; m2Key = 'aug'; m3Key = 'sept'; m1Name = 'JUL'; m2Name = 'AUG'; m3Name = 'SEP'; }
    if (activeQtrView === 'Q3') { m1Key = 'oct'; m2Key = 'nov'; m3Key = 'dec'; m1Name = 'OCT'; m2Name = 'NOV'; m3Name = 'DEC'; }
    if (activeQtrView === 'Q4') { m1Key = 'jan'; m2Key = 'feb'; m3Key = 'mar'; m1Name = 'JAN'; m2Name = 'FEB'; m3Name = 'MAR'; }

    return specialList.map(s => {
      const v1 = parseNum(s[m1Key]);
      const v2 = parseNum(s[m2Key]);
      const v3 = parseNum(s[m3Key]);
      const e1 = v1 * s.amountPerUnit;
      const e2 = v2 * s.amountPerUnit;
      const e3 = v3 * s.amountPerUnit;
      const tot = e1 + e2 + e3;
      return { ...s, v1, v2, v3, e1, e2, e3, tot, m1Name, m2Name, m3Name, m1Key, m2Key, m3Key };
    });
  }, [specialList, activeQtrView]);

  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push(`HQ,${hqName},BE NAME,${beName},,,,,,,,,,,,,,,,,,,,,,`);
    lines.push(`,,,,PRIMARY IN STRIPS,,,,,,,,,,,,,,,,,,,,,`);
    lines.push(`S.NO.,PRODUCT NAME,INCENTIVE/STRIP ( Rs.), JAN TO MARCH PRIMARY SALE, APRIL,MAY,JUNE,QTR SALE,%GROWTH OVER LAST QTR,MINIMUM STRIPS REQUIRED FOR ELIGIBILITY,INCENTIVE AMOUNT,JULY,AUG,SEP,QTR SALE,GROWTH OVER LAST QTR,OCT,NOV,DEC,QTR SALE,GROWTH OVER LAST QTR,JAN,FEB,MAR,QTR SALE,GROWTH OVER LAST QTR`);

    products.forEach(p => {
      const q1 = getQtrDetails(p, p.apr, p.may, p.jun, parseNum(p.janToMar));
      const q2 = getQtrDetails(p, p.jul, p.aug, p.sept, q1.qtrSale);
      const q3 = getQtrDetails(p, p.oct, p.nov, p.dec, q2.qtrSale);
      const q4 = getQtrDetails(p, p.jan, p.feb, p.mar, q3.qtrSale);

      lines.push(`${p.sn},${p.name},${p.ratePerStrip},${p.janToMar},${p.apr},${p.may},${p.jun},${q1.qtrSale},${q1.growth.toFixed(2)},${q1.minRequired},${q1.incEarned},${p.jul},${p.aug},${p.sept},${q2.qtrSale},${q2.growth.toFixed(2)},${p.oct},${p.nov},${p.dec},${q3.qtrSale},${q3.growth.toFixed(2)},${p.jan},${p.feb},${p.mar},${q4.qtrSale},${q4.growth.toFixed(2)}`);
    });

    const csvContent = lines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '16_PRODUCT_INCENTIVE_BANWARI.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-xl space-y-6">
      
      {/* 1. TOP HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
            <Target size={24} />
          </span>
          <div>
            <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              16. PRODUCT &amp; SPECIAL INCENTIVE
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-mono font-bold">
                Fully Dynamic Q1-Q4 Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">BE: {beName} • HQ: {hqName} • 5 Focus Brands + 3 Special Incentives</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-amber-500/40">
            <span className="text-xs text-slate-400 font-semibold pl-1">Auto-Fill:</span>
            <select
              value={autoFillQtr}
              onChange={(e) => setAutoFillQtr(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="Q1" className="bg-slate-900">Q1 (Apr-Jun)</option>
              <option value="Q2" className="bg-slate-900">Q2 (Jul-Sep)</option>
              <option value="Q3" className="bg-slate-900">Q3 (Oct-Dec)</option>
              <option value="Q4" className="bg-slate-900">Q4 (Jan-Mar)</option>
            </select>
            <button
              onClick={handleAutoFillFromSheets}
              className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <Zap size={13} /> Run
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <CloudSyncBar
        storageKey="review/sheet_16_product_incentive"
        sheetTitle="16. Product & Special Incentive"
        getData={() => ({ beName, hqName, products, specialList })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.products && Array.isArray(cloudData.products)) setProducts(cloudData.products);
          if (cloudData.specialList && Array.isArray(cloudData.specialList)) setSpecialList(cloudData.specialList);
          if (cloudData.beName) setBeName(cloudData.beName);
          if (cloudData.hqName) setHqName(cloudData.hqName);
        }}
        onSaveLocal={() => {
          persistData(products, specialList);
        }}
      />

      {statusMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="p-1 hover:text-white">✕</button>
        </div>
      )}

      {/* Quarter View Switcher */}
      <div className="flex items-center justify-between bg-slate-950 p-2 rounded-2xl border border-slate-800">
        <span className="text-xs text-slate-300 font-bold pl-2">Active Summary Quarter:</span>
        <div className="flex items-center gap-1.5">
          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
            <button
              key={q}
              onClick={() => setActiveQtrView(q)}
              className={`px-3.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeQtrView === q
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Representative &amp; HQ</div>
          <div className="text-sm font-bold text-white mt-1 truncate">{beName}</div>
          <div className="text-xs text-amber-400 font-mono font-semibold mt-0.5">BE • {hqName} HQ</div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-cyan-400 uppercase font-semibold">{activeQtrView} Focus Brands Strips</div>
          <div className="text-lg font-black text-cyan-300 font-mono mt-1">
            {activeQtrValue.totalQtrStrips.toLocaleString()} <span className="text-xs font-normal text-slate-400">Strips</span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">5 Focus Products Active</div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-emerald-400 uppercase font-semibold">{activeQtrView} Product Incentive</div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            ₹{activeQtrValue.totalQtrInc.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">Special Incentive: ₹{activeSpecialIncentiveTotal.toLocaleString()}</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-950/90 to-slate-950 p-4 rounded-2xl border-2 border-emerald-500/50 shadow-xl flex flex-col justify-between">
          <div className="text-[10px] text-emerald-300 uppercase font-black tracking-wide flex items-center justify-between">
            <span>TOTAL EARNINGS ({activeQtrView})</span>
            <Sparkles size={14} className="text-yellow-300 animate-pulse" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-emerald-300 font-mono mt-1">
            ₹{(activeQtrValue.totalQtrInc + activeSpecialIncentiveTotal).toLocaleString()}
          </div>
        </div>
      </div>

      {/* TABLE 1 */}
      <div className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-xs md:text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Layers size={16} /> Table 1: Product Incentive (Primary in Strips) — 5 Focus Brands (Full Q1 to Q4)
          </h3>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            {activeQtrView} Earned: ₹{activeQtrValue.totalQtrInc.toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[520px] border border-slate-800 rounded-2xl shadow-xl bg-slate-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase z-30 border-b border-slate-800">
              <tr className="border-b border-slate-800 text-[11px]">
                <th rowSpan={2} style={{ width: '45px', minWidth: '45px', left: 0 }} className="p-3 text-center bg-slate-950 border-r border-slate-800 sticky z-40 text-slate-400">#</th>
                <th rowSpan={2} style={{ width: '150px', minWidth: '150px', left: '45px' }} className="p-3 bg-slate-950 border-r border-slate-800 sticky z-40 text-white">PRODUCT NAME</th>
                <th rowSpan={2} style={{ width: '110px', minWidth: '110px', left: '195px' }} className="p-3 text-right bg-slate-950 border-r-2 border-slate-700 sticky z-40 text-amber-400">INC/STRIP</th>
                <th rowSpan={2} className="p-3 text-center w-32 min-w-[120px] bg-slate-950 border-r border-slate-800 text-slate-300">JAN-MAR BASE</th>
                <th colSpan={7} className="p-2 text-center text-cyan-300 bg-cyan-950/80 border-r border-slate-800 font-black">QTR 1 (APR - JUN)</th>
                <th colSpan={5} className="p-2 text-center text-blue-300 bg-blue-950/80 border-r border-slate-800 font-black">QTR 2 (JUL - SEP)</th>
                <th colSpan={5} className="p-2 text-center text-purple-300 bg-purple-950/80 border-r border-slate-800 font-black">QTR 3 (OCT - DEC)</th>
                <th colSpan={5} className="p-2 text-center text-amber-300 bg-amber-950/80 font-black">QTR 4 (JAN - MAR)</th>
              </tr>
              <tr className="border-b border-slate-800 text-[10px] font-mono">
                <th className="p-2 text-center w-20 min-w-[75px] bg-slate-950 border-r border-slate-800/60">APR</th>
                <th className="p-2 text-center w-20 min-w-[75px] bg-slate-950 border-r border-slate-800/60">MAY</th>
                <th className="p-2 text-center w-20 min-w-[75px] bg-slate-950 border-r border-slate-800/60">JUN</th>
                <th className="p-2 text-center w-24 min-w-[90px] bg-slate-950 border-r border-slate-800 text-cyan-300 font-bold">Q1 SALE</th>
                <th className="p-2 text-center w-24 min-w-[90px] bg-slate-950 border-r border-slate-800 text-emerald-400 font-bold">% GROWTH</th>
                <th className="p-2 text-center w-28 min-w-[100px] bg-slate-950 border-r border-slate-800 text-amber-300 font-bold">MIN REQ.</th>
                <th className="p-2 text-right w-28 min-w-[110px] bg-slate-950 border-r border-slate-800 text-yellow-300 font-black">Q1 INC (₹)</th>
                <th className="p-2 text-center w-20 min-w-[75px] bg-slate-950 border-r border-slate-800/60">JUL</th>
                <th className="p-2 text-center w-20 min-w-[75px] bg-slate-950 border-r border-slate-800/60">AUG</th>
                <th className="p-2 text-center w-20 min-w-[75px] bg-slate-950 border-r border-slate-800/60">SEP</th>
                <th className="p-2 text-center w-24 min-w-[90px] bg-slate-950 border-r border-slate-800 text-cyan-300 font-bold">Q2 SALE</th>
                <th className="p-2 text-center w-24 min-w-[90px] bg-slate-950 border-r border-slate-800 text-emerald-400 font-bold">% GROWTH</th>
                <th className="p-2 text-center w-20 min-w-[75px] bg-slate-950 border-r border-slate-800/60">OCT</th>
                <th className="p-2 text-center w-20 min-w-[75px] bg-slate-950 border-r border-slate-800/60">NOV</th>
                <th className="p-2 text-center w-20 min-w-[75px] bg-slate-950 border-r border-slate-800/60">DEC</th>
                <th className="p-2 text-center w-24 min-w-[90px] bg-slate-950 border-r border-slate-800 text-cyan-300 font-bold">Q3 SALE</th>
                <th className="p-2 text-center w-24 min-w-[90px] bg-slate-950 border-r border-slate-800 text-emerald-400 font-bold">% GROWTH</th>
                <th className="p-2 text-center w-20 min-w-[75px] bg-slate-950 border-r border-slate-800/60">JAN</th>
                <th className="p-2 text-center w-20 min-w-[75px] bg-slate-950 border-r border-slate-800/60">FEB</th>
                <th className="p-2 text-center w-20 min-w-[75px] bg-slate-950 border-r border-slate-800/60">MAR</th>
                <th className="p-2 text-center w-24 min-w-[90px] bg-slate-950 border-r border-slate-800 text-cyan-300 font-bold">Q4 SALE</th>
                <th className="p-2 text-center w-24 min-w-[90px] bg-slate-950 text-emerald-400 font-bold">% GROWTH</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
              {activeQtrValue.productBreakdown.map(p => {
                const q1 = getQtrDetails(p, p.apr, p.may, p.jun, parseNum(p.janToMar));
                const q2 = getQtrDetails(p, p.jul, p.aug, p.sept, q1.qtrSale || parseNum(p.janToMar));
                const q3 = getQtrDetails(p, p.oct, p.nov, p.dec, q2.qtrSale || parseNum(p.janToMar));
                const q4 = getQtrDetails(p, p.jan, p.feb, p.mar, q3.qtrSale || parseNum(p.janToMar));

                return (
                  <tr key={p.sn} className="hover:bg-slate-800/40 transition">
                    <td style={{ width: '45px', minWidth: '45px', left: 0 }} className="p-2.5 text-center text-slate-500 border-r border-slate-800/60 sticky z-20 bg-slate-900">{p.sn}</td>
                    <td style={{ width: '150px', minWidth: '150px', left: '45px' }} className="p-2.5 font-sans font-bold text-white border-r border-slate-800/60 sticky z-20 bg-slate-900 truncate">{p.name}</td>
                    <td style={{ width: '110px', minWidth: '110px', left: '195px' }} className="p-2.5 text-right text-amber-400 font-bold border-r-2 border-slate-700 sticky z-20 bg-slate-900">₹{p.ratePerStrip.toFixed(2)}</td>

                    <td className="p-2 text-center border-r border-slate-800/60 text-slate-300">
                      <input type="text" value={p.janToMar} onChange={e => handleProductChange(p.sn, 'janToMar', e.target.value)} className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-slate-300 font-bold rounded" />
                    </td>

                    <td className="p-1.5 text-center border-r border-slate-800/50"><input type="text" value={p.apr} onChange={e => handleProductChange(p.sn, 'apr', e.target.value)} className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-white rounded" /></td>
                    <td className="p-1.5 text-center border-r border-slate-800/50"><input type="text" value={p.may} onChange={e => handleProductChange(p.sn, 'may', e.target.value)} className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-white rounded" /></td>
                    <td className="p-1.5 text-center border-r border-slate-800/50"><input type="text" value={p.jun} onChange={e => handleProductChange(p.sn, 'jun', e.target.value)} className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-white rounded" /></td>
                    <td className="p-2.5 text-center font-bold text-cyan-300 bg-cyan-950/20 border-r border-slate-800/60">{q1.qtrSale}</td>
                    <td className={`p-2.5 text-center font-bold border-r border-slate-800/60 ${q1.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{q1.growth.toFixed(1)}%</td>
                    <td className="p-2.5 text-center font-bold text-amber-300 bg-amber-950/20 border-r border-slate-800/60">{q1.minRequired}</td>
                    <td className="p-2.5 text-right font-black text-yellow-300 bg-yellow-950/30 border-r border-slate-800">₹{q1.incEarned.toLocaleString()}</td>

                    <td className="p-1.5 text-center border-r border-slate-800/50"><input type="text" value={p.jul} onChange={e => handleProductChange(p.sn, 'jul', e.target.value)} className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-white rounded" /></td>
                    <td className="p-1.5 text-center border-r border-slate-800/50"><input type="text" value={p.aug} onChange={e => handleProductChange(p.sn, 'aug', e.target.value)} className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-white rounded" /></td>
                    <td className="p-1.5 text-center border-r border-slate-800/50"><input type="text" value={p.sept} onChange={e => handleProductChange(p.sn, 'sept', e.target.value)} className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-white rounded" /></td>
                    <td className="p-2.5 text-center font-bold text-cyan-300 bg-cyan-950/20 border-r border-slate-800/60">{q2.qtrSale || '-'}</td>
                    <td className={`p-2.5 text-center font-bold border-r border-slate-800/60 ${q2.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{q2.growth ? `${q2.growth.toFixed(1)}%` : '-'}</td>

                    <td className="p-1.5 text-center border-r border-slate-800/50"><input type="text" value={p.oct} onChange={e => handleProductChange(p.sn, 'oct', e.target.value)} className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-white rounded" /></td>
                    <td className="p-1.5 text-center border-r border-slate-800/50"><input type="text" value={p.nov} onChange={e => handleProductChange(p.sn, 'nov', e.target.value)} className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-white rounded" /></td>
                    <td className="p-1.5 text-center border-r border-slate-800/50"><input type="text" value={p.dec} onChange={e => handleProductChange(p.sn, 'dec', e.target.value)} className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-white rounded" /></td>
                    <td className="p-2.5 text-center font-bold text-cyan-300 bg-cyan-950/20 border-r border-slate-800/60">{q3.qtrSale || '-'}</td>
                    <td className={`p-2.5 text-center font-bold border-r border-slate-800/60 ${q3.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{q3.growth ? `${q3.growth.toFixed(1)}%` : '-'}</td>

                    <td className="p-1.5 text-center border-r border-slate-800/50"><input type="text" value={p.jan} onChange={e => handleProductChange(p.sn, 'jan', e.target.value)} className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-white rounded" /></td>
                    <td className="p-1.5 text-center border-r border-slate-800/50"><input type="text" value={p.feb} onChange={e => handleProductChange(p.sn, 'feb', e.target.value)} className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-white rounded" /></td>
                    <td className="p-1.5 text-center border-r border-slate-800/50"><input type="text" value={p.mar} onChange={e => handleProductChange(p.sn, 'mar', e.target.value)} className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-white rounded" /></td>
                    <td className="p-2.5 text-center font-bold text-cyan-300 bg-cyan-950/20 border-r border-slate-800/60">{q4.qtrSale || '-'}</td>
                    <td className={`p-2.5 text-center font-bold ${q4.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{q4.growth ? `${q4.growth.toFixed(1)}%` : '-'}</td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-slate-700 font-bold z-30 text-xs font-mono">
              <tr>
                <td style={{ width: '45px', minWidth: '45px', left: 0 }} className="p-3 text-center text-amber-400 sticky z-40 bg-slate-950 border-r border-slate-800">Σ</td>
                <td style={{ width: '150px', minWidth: '150px', left: '45px' }} className="p-3 text-white font-sans uppercase sticky z-40 bg-slate-950 border-r border-slate-800">TOTAL {activeQtrView}</td>
                <td style={{ width: '110px', minWidth: '110px', left: '195px' }} className="p-3 text-right font-mono text-slate-500 sticky z-40 bg-slate-950 border-r-2 border-slate-700">-</td>
                
                <td className="p-3 text-center text-slate-500 border-r border-slate-800">-</td>
                <td colSpan={3} className="p-3 text-center text-slate-500 border-r border-slate-800">-</td>
                <td className="p-3 text-center text-cyan-300 bg-cyan-950/40 font-black border-r border-slate-800">
                  {activeQtrValue.totalQtrStrips}
                </td>
                <td colSpan={2} className="p-3 text-center text-slate-500 border-r border-slate-800">-</td>
                <td className="p-3 text-right font-black text-sm text-yellow-300 bg-yellow-950/50 border-r border-slate-800">
                  ₹{activeQtrValue.totalQtrInc.toLocaleString()}
                </td>
                <td colSpan={15} className="p-3 text-slate-500">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 🌟 TABLE 2: SPECIAL INCENTIVE (FULLY DYNAMIC BASED ON ACTIVE QUARTER VIEW) */}
      <div className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-xs md:text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Award size={16} /> Table 2: Special Incentive (SI) — Promotional Campaigns ({activeQtrView})
          </h3>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            {activeQtrView} SI Earned: ₹{activeSpecialIncentiveTotal.toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px] border border-slate-800 rounded-2xl shadow-xl bg-slate-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase z-30 border-b border-slate-800">
              <tr className="border-b border-slate-800 text-[11px]">
                <th rowSpan={2} style={{ width: '45px', minWidth: '45px', left: 0 }} className="p-3 text-center bg-slate-950 border-r border-slate-800 sticky z-40">#</th>
                <th rowSpan={2} style={{ width: '160px', minWidth: '160px', left: '45px' }} className="p-3 bg-slate-950 border-r border-slate-800 sticky z-40 text-white">NAME OF SI</th>
                <th rowSpan={2} style={{ width: '100px', minWidth: '100px', left: '205px' }} className="p-3 text-right bg-slate-950 border-r border-slate-800 sticky z-40 text-emerald-400">AMOUNT</th>
                <th rowSpan={2} style={{ width: '220px', minWidth: '220px', left: '305px' }} className="p-3 bg-slate-950 border-r-4 border-emerald-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)] sticky z-40 text-slate-300">CRITERIA</th>

                <th colSpan={3} className="p-2 text-center text-cyan-300 bg-cyan-950/80 border-r border-slate-800 font-bold">{activeQtrView} CONVERSIONS / Rx</th>
                <th colSpan={4} className="p-2 text-center text-yellow-300 bg-yellow-950/80 font-black">{activeQtrView} INCENTIVE AMOUNT (₹)</th>
              </tr>
              <tr className="border-b border-slate-800 text-[10px] font-mono">
                <th className="p-2 text-center w-24 min-w-[85px] bg-slate-950 border-r border-slate-800/60">{activeSpecialBreakdown[0]?.m1Name}</th>
                <th className="p-2 text-center w-24 min-w-[85px] bg-slate-950 border-r border-slate-800/60">{activeSpecialBreakdown[0]?.m2Name}</th>
                <th className="p-2 text-center w-24 min-w-[85px] bg-slate-950 border-r border-slate-800/60">{activeSpecialBreakdown[0]?.m3Name}</th>
                <th className="p-2 text-center w-28 min-w-[100px] bg-slate-950 border-r border-slate-800/60 text-yellow-300">{activeSpecialBreakdown[0]?.m1Name} (₹)</th>
                <th className="p-2 text-center w-28 min-w-[100px] bg-slate-950 border-r border-slate-800/60 text-yellow-300">{activeSpecialBreakdown[0]?.m2Name} (₹)</th>
                <th className="p-2 text-center w-28 min-w-[100px] bg-slate-950 border-r border-slate-800/60 text-yellow-300">{activeSpecialBreakdown[0]?.m3Name} (₹)</th>
                <th className="p-2 text-right w-32 min-w-[120px] bg-slate-950 text-emerald-400 font-black">{activeQtrView} TOT (₹)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
              {activeSpecialBreakdown.map(s => (
                <tr key={s.sn} className="hover:bg-slate-800/40 transition">
                  <td style={{ width: '45px', minWidth: '45px', left: 0 }} className="p-2.5 text-center text-slate-500 border-r border-slate-800/60 sticky z-20 bg-slate-900">{s.sn}</td>
                  <td style={{ width: '160px', minWidth: '160px', left: '45px' }} className="p-2.5 font-sans font-bold text-white border-r border-slate-800/60 sticky z-20 bg-slate-900 truncate">{s.name}</td>
                  <td style={{ width: '100px', minWidth: '100px', left: '205px' }} className="p-2.5 text-right text-emerald-400 font-bold border-r border-slate-800/60 sticky z-20 bg-slate-900">₹{s.amountPerUnit.toLocaleString()}</td>
                  <td style={{ width: '220px', minWidth: '220px', left: '305px' }} className="p-2.5 font-sans text-slate-300 text-xs border-r-4 border-emerald-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)] sticky z-20 bg-slate-900 truncate">{s.criteria}</td>

                  <td className="p-1.5 text-center border-r border-slate-800/50"><input type="text" value={s[s.m1Key]} onChange={e => handleSpecialChange(s.sn, s.m1Key, e.target.value)} placeholder="0" className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-cyan-300 font-bold rounded" /></td>
                  <td className="p-1.5 text-center border-r border-slate-800/50"><input type="text" value={s[s.m2Key]} onChange={e => handleSpecialChange(s.sn, s.m2Key, e.target.value)} placeholder="0" className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-cyan-300 font-bold rounded" /></td>
                  <td className="p-1.5 text-center border-r border-slate-800/50"><input type="text" value={s[s.m3Key]} onChange={e => handleSpecialChange(s.sn, s.m3Key, e.target.value)} placeholder="0" className="w-full py-1 bg-transparent text-center focus:bg-slate-950 text-cyan-300 font-bold rounded" /></td>

                  <td className="p-2.5 text-center text-yellow-300 font-bold border-r border-slate-800/60 bg-yellow-950/10">₹{s.e1}</td>
                  <td className="p-2.5 text-center text-yellow-300 font-bold border-r border-slate-800/60 bg-yellow-950/10">₹{s.e2}</td>
                  <td className="p-2.5 text-center text-yellow-300 font-bold border-r border-slate-800/60 bg-yellow-950/10">₹{s.e3}</td>
                  <td className="p-2.5 text-right font-black text-emerald-300 bg-emerald-950/40 text-xs">₹{s.tot.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>

            <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-emerald-500/40 font-bold z-30 text-xs font-mono">
              <tr>
                <td style={{ width: '45px', minWidth: '45px', left: 0 }} className="p-3 text-center text-emerald-400 sticky z-40 bg-slate-950 border-r border-slate-800">Σ</td>
                <td style={{ width: '160px', minWidth: '160px', left: '45px' }} className="p-3 text-white font-sans uppercase sticky z-40 bg-slate-950 border-r border-slate-800">TOTAL SI ({activeQtrView})</td>
                <td style={{ width: '100px', minWidth: '100px', left: '205px' }} className="p-3 text-right font-mono text-slate-500 sticky z-40 bg-slate-950 border-r border-slate-800">-</td>
                <td style={{ width: '220px', minWidth: '220px', left: '305px' }} className="p-3 text-slate-500 sticky z-40 bg-slate-950 border-r-4 border-emerald-500">-</td>

                <td colSpan={3} className="p-3 text-center text-slate-500 border-r border-slate-800">-</td>
                <td colSpan={3} className="p-3 text-center text-slate-500 border-r border-slate-800">-</td>
                <td className="p-3 text-right font-black text-sm text-emerald-300 bg-emerald-950/50">
                  ₹{activeSpecialIncentiveTotal.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
