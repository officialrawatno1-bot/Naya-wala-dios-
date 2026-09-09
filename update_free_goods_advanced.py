import os, sys, subprocess

print("==========================================================================")
print("🧠 [1/3] UPDATING FREE GOODS STORE WITH MULTI-MONTH AGGREGATION...")
print("==========================================================================")

# 1. Update src/data/freeGoodsStore.ts
store_code = """import { MASTER_PRODUCTS, MasterProduct } from './masterProducts';
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
  monthCode: string;
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
  monthCodes: string[];
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

  // 🌟 MULTI-MONTH AUTO-SYNC FROM PARTYWISE ANALYSIS
  public syncMultiMonthFromPartywise(monthCodes: string[], partyId: string = 'dwarika'): { syncedCount: number; totalFreeUnits: number } {
    let syncedCount = 0;
    let totalFreeUnits = 0;

    monthCodes.forEach(mCode => {
      if (!this.data[mCode]) this.data[mCode] = {};
      if (!this.data[mCode][partyId]) this.data[mCode][partyId] = {};

      const partyRecords = partywiseAggregatorStore.data[mCode] || [];
      const productFreeMap: Record<number, number> = {};

      partyRecords.forEach(r => {
        if (r.freeQty > 0) {
          productFreeMap[r.productSn] = (productFreeMap[r.productSn] || 0) + r.freeQty;
          totalFreeUnits += r.freeQty;
        }
      });

      MASTER_PRODUCTS.forEach(p => {
        if (productFreeMap[p.sn] !== undefined && productFreeMap[p.sn] > 0) {
          this.data[mCode][partyId][p.sn] = productFreeMap[p.sn];
          syncedCount++;
        }
      });
    });

    this.persist();
    return { syncedCount, totalFreeUnits };
  }

  // 🌟 GET SPECIFIC CHEMISTS WHO RECEIVED FREE GOODS ACROSS SELECTED MONTHS
  public getMultiMonthChemistFreeDistribution(monthCodes: string[], partyId: string, productSn: number): ChemistFreeDistributionItem[] {
    const list: ChemistFreeDistributionItem[] = [];

    monthCodes.forEach(mCode => {
      const partyRecords = partywiseAggregatorStore.data[mCode] || [];
      partyRecords.forEach(r => {
        if (r.productSn === productSn && r.freeQty > 0) {
          const rate = r.rate || 0;
          list.push({
            monthCode: mCode,
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
    });

    return list.sort((a, b) => b.freeQty - a.freeQty);
  }

  // 🌟 MULTI-MONTH CONSOLIDATED SUMMARY PER PARTY
  public getMultiMonthPartySummary(monthCodes: string[], partyId: string, partyName: string): PartyFreeGoodsSummary {
    const items: Record<number, FreeGoodsItem> = {};
    let totalQty = 0;
    let totalAmount = 0;

    MASTER_PRODUCTS.forEach(p => {
      let aggregatedQty = 0;
      let hasValue = false;

      monthCodes.forEach(mCode => {
        const mQtys = this.data[mCode]?.[partyId] || {};
        if (mQtys[p.sn] !== undefined) {
          aggregatedQty += Number(mQtys[p.sn]) || 0;
          hasValue = true;
        }
      });

      // Count chemists receiving free goods across selected months
      let totalChemistsCount = 0;
      monthCodes.forEach(mCode => {
        const records = partywiseAggregatorStore.data[mCode] || [];
        totalChemistsCount += records.filter(r => r.productSn === p.sn && r.freeQty > 0).length;
      });

      const displayQty = (hasValue && aggregatedQty > 0) ? aggregatedQty : '';
      const numQty = typeof displayQty === 'number' ? displayQty : 0;
      const amt = Number((numQty * p.pts).toFixed(2));

      items[p.sn] = {
        sn: p.sn,
        productName: p.name,
        pts: p.pts,
        qty: displayQty,
        amount: amt,
        chemistCount: totalChemistsCount
      };

      totalQty += numQty;
      totalAmount += amt;
    });

    return {
      partyName,
      monthCodes,
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

  public clearMultiMonth(monthCodes: string[], partyId: string) {
    monthCodes.forEach(mCode => {
      if (this.data[mCode]) {
        this.data[mCode][partyId] = {};
      }
    });
    this.persist();
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
print("✅ Store updated.")

# 2. Update src/exporters/freeGoodsExporter.ts with EXACT Screenshot Matching Style & Multi-Sheet Support
exporter_code = """import * as XLSX from 'xlsx-js-style';
import { MASTER_PRODUCTS } from '../data/masterProducts';
import { freeGoodsStore, FREE_GOODS_PARTIES } from '../data/freeGoodsStore';

const borderBlackThin = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } }
};

// 🌟 EXACT SCREENSHOT STYLES
const styleYellowBanner = {
  font: { name: 'Arial', sz: 12, bold: true, color: { rgb: '000000' } },
  fill: { fgColor: { rgb: 'FFFF00' } }, // Bright Solid Yellow
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderBlackThin
};

const styleBlackHeader = {
  font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '000000' } }, // Solid Black Header
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderBlackThin
};

const styleCellCenter = {
  font: { name: 'Arial', sz: 10, color: { rgb: '000000' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderBlackThin
};

const styleCellLeft = {
  font: { name: 'Arial', sz: 10, color: { rgb: '000000' } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: borderBlackThin
};

const styleCellRight = {
  font: { name: 'Arial', sz: 10, color: { rgb: '000000' } },
  alignment: { horizontal: 'right', vertical: 'center' },
  border: borderBlackThin
};

const styleCellQtyBold = {
  font: { name: 'Arial', sz: 12, bold: true, color: { rgb: '000000' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderBlackThin
};

const styleYellowFooter = {
  font: { name: 'Arial', sz: 11, bold: true, color: { rgb: '000000' } },
  fill: { fgColor: { rgb: 'FFFF00' } }, // Bright Solid Yellow Footer
  alignment: { horizontal: 'center', vertical: 'center' },
  border: borderBlackThin
};

const styleYellowFooterRight = {
  font: { name: 'Arial', sz: 11, bold: true, color: { rgb: '000000' } },
  fill: { fgColor: { rgb: 'FFFF00' } },
  alignment: { horizontal: 'right', vertical: 'center' },
  border: borderBlackThin
};

// 🌟 BUILD EXCEL SHEET MATCHING EXACT SCREENSHOT TEMPLATE
function buildStockistExcelSheet(partyId: string, partyName: string, tag: string, monthCodes: string[], onlyActiveQty: boolean = false) {
  const summary = freeGoodsStore.getMultiMonthPartySummary(monthCodes, partyId, partyName);
  const monthsLabel = monthCodes.length === 1 ? `${monthCodes[0]}'26` : monthCodes.join('-');
  const bannerTitle = `FREE GOODS ${tag.toUpperCase()} ${monthsLabel}`;

  const wsData: any[][] = [];

  // ROW 1: Bright Yellow Banner (Merged A1:E1)
  wsData.push([
    { v: bannerTitle, s: styleYellowBanner },
    { v: '', s: styleYellowBanner },
    { v: '', s: styleYellowBanner },
    { v: '', s: styleYellowBanner },
    { v: '', s: styleYellowBanner }
  ]);

  // ROW 2: Solid Black Header with White Text
  wsData.push([
    { v: 'S.NO.', s: styleBlackHeader },
    { v: 'BRAND NAME', s: styleBlackHeader },
    { v: 'PTS', s: styleBlackHeader },
    { v: 'QTY.', s: styleBlackHeader },
    { v: 'AMOUNT', s: styleBlackHeader }
  ]);

  // DATA ROWS: 73 Master Products
  let rowCount = 0;
  MASTER_PRODUCTS.forEach(p => {
    const item = summary.items[p.sn];
    const qtyVal = item ? item.qty : '';
    const numQty = typeof qtyVal === 'number' ? qtyVal : 0;
    const amtVal = item ? item.amount : 0;

    if (onlyActiveQty && numQty <= 0) return; // Skip zero if onlyActiveQty is true

    rowCount++;
    wsData.push([
      { v: onlyActiveQty ? rowCount : p.sn, s: styleCellCenter },
      { v: p.name, s: styleCellLeft },
      { v: Number(p.pts.toFixed(2)), s: styleCellRight },
      { v: numQty > 0 ? numQty : '', s: numQty > 0 ? styleCellQtyBold : styleCellCenter },
      { v: Number(amtVal.toFixed(2)), s: styleCellRight }
    ]);
  });

  // ROW LAST: Solid Yellow Total Footer
  wsData.push([
    { v: 'TOTAL', s: styleYellowFooter },
    { v: '', s: styleYellowFooter },
    { v: '', s: styleYellowFooter },
    { v: summary.totalQty > 0 ? summary.totalQty : '', s: styleYellowFooter },
    { v: Number(summary.totalAmount.toFixed(2)), s: styleYellowFooterRight }
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Merge Banner A1:E1
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 2 } } // Merge Total A:C
  ];

  ws['!cols'] = [
    { wch: 8 },  // S.NO.
    { wch: 34 }, // BRAND NAME
    { wch: 12 }, // PTS
    { wch: 12 }, // QTY.
    { wch: 16 }  // AMOUNT
  ];

  ws['!rows'] = [
    { hpt: 26 }, // Row 1: Banner
    { hpt: 22 }  // Row 2: Header
  ];

  return ws;
}

// 🌟 MULTI-SHEET EXCEL WORKBOOK (EVERY STOCKIST GETS A SEPARATE SHEET!)
export function exportFreeGoodsStockwiseMultiSheetExcel(monthCodes: string[], onlyActiveQty: boolean = false) {
  const wb = XLSX.utils.book_new();

  FREE_GOODS_PARTIES.forEach(party => {
    const ws = buildStockistExcelSheet(party.id, party.name, party.tag, monthCodes, onlyActiveQty);
    XLSX.utils.book_append_sheet(wb, ws, party.tag); // Dedicated tab for Dwarika, Modi, Vardhman, etc.
  });

  const monthsStr = monthCodes.join('_');
  const filename = `FREE_GOODS_ALL_STOCKISTS_${monthsStr}_2026.xlsx`;
  XLSX.writeFile(wb, filename);
}

// Single Party Excel Export
export function exportFreeGoodsSinglePartyExcel(monthCodes: string[], partyId: string, partyName: string, tag: string, onlyActiveQty: boolean = false) {
  const wb = XLSX.utils.book_new();
  const ws = buildStockistExcelSheet(partyId, partyName, tag, monthCodes, onlyActiveQty);
  XLSX.utils.book_append_sheet(wb, ws, tag);

  const monthsStr = monthCodes.join('_');
  const filename = `FREE_GOODS_${tag.toUpperCase()}_${monthsStr}_2026.xlsx`;
  XLSX.writeFile(wb, filename);
}

// Single Party CSV Export
export function exportFreeGoodsPartyCSV(monthCodes: string[], partyId: string, partyName: string, onlyActiveQty: boolean = false) {
  const summary = freeGoodsStore.getMultiMonthPartySummary(monthCodes, partyId, partyName);
  const monthsLabel = monthCodes.join('-');
  const lines: string[] = [];

  lines.push(`FREE GOODS ${partyName.toUpperCase()} ${monthsLabel}'26,,,,`);
  lines.push(',,,,');
  lines.push('S.NO.,BRAND NAME,PTS,QTY.,AMOUNT');

  let rowIdx = 1;
  MASTER_PRODUCTS.forEach(p => {
    const item = summary.items[p.sn];
    const qtyVal = item ? item.qty : '';
    const numQty = typeof qtyVal === 'number' ? qtyVal : 0;
    const amt = item ? item.amount.toFixed(2) : '0.00';

    if (onlyActiveQty && numQty <= 0) return;

    lines.push(`${onlyActiveQty ? rowIdx++ : p.sn},"${p.name}",${p.pts.toFixed(2)},${numQty > 0 ? numQty : ''},${amt}`);
  });

  lines.push(`TOTAL,,,${summary.totalQty},${summary.totalAmount.toFixed(2)}`);

  const csvContent = lines.join('\\r\\n');
  const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Free_Goods_${partyName}_${monthsLabel}_2026.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
"""

with open('src/exporters/freeGoodsExporter.ts', 'w', encoding='utf-8') as f:
    f.write(exporter_code)
print("✅ Exporter updated.")

# 3. Update src/components/FreeGoodsVault.tsx with Custom Multi-Month Selection, Auto-Sync & Multi-Sheet Excel Buttons
vault_code = """import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Download, RefreshCw, Search, 
  CheckCircle2, Layers, FileSpreadsheet, Sparkles, Building2, 
  Trash2, Calendar, Eye, Zap, X, Gift, Store, TrendingUp, Filter,
  Check, ChevronDown, SlidersHorizontal
} from 'lucide-react';
import { MASTER_PRODUCTS, MasterProduct } from '../data/masterProducts';
import { freeGoodsStore, FREE_GOODS_PARTIES, ChemistFreeDistributionItem } from '../data/freeGoodsStore';
import { 
  exportFreeGoodsPartyCSV, 
  exportFreeGoodsStockwiseMultiSheetExcel,
  exportFreeGoodsSinglePartyExcel 
} from '../exporters/freeGoodsExporter';
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
  // 🌟 CUSTOM MULTI-MONTH SELECTION STATE
  const [selectedMonthCodes, setSelectedMonthCodes] = useState<string[]>(['JUN']);
  const [showMonthPickerModal, setShowMonthPickerModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dwarika');
  const [search, setSearch] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [onlyActiveQtyInExcel, setOnlyActiveQtyInExcel] = useState(false);

  // 🌟 BREAKDOWN MODAL STATE
  const [breakdownTargetProduct, setBreakdownTargetProduct] = useState<MasterProduct | null>(null);

  const currentPartyMeta = FREE_GOODS_PARTIES.find(p => p.id === activeTab) || FREE_GOODS_PARTIES[0];

  const currentSummary = useMemo(() => {
    return freeGoodsStore.getMultiMonthPartySummary(selectedMonthCodes, activeTab, currentPartyMeta.name);
  }, [selectedMonthCodes, activeTab, currentPartyMeta, refreshTrigger]);

  const chemistBreakdownList = useMemo(() => {
    if (!breakdownTargetProduct) return [];
    return freeGoodsStore.getMultiMonthChemistFreeDistribution(selectedMonthCodes, activeTab, breakdownTargetProduct.sn);
  }, [selectedMonthCodes, activeTab, breakdownTargetProduct, refreshTrigger]);

  const filteredProducts = useMemo(() => {
    return MASTER_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || String(p.sn).includes(search)
    );
  }, [search]);

  const handleQtyChange = (sn: number, val: string) => {
    // If single month, update directly. If multiple, update first month in selection
    const targetMonth = selectedMonthCodes[0] || 'JUN';
    freeGoodsStore.updateCell(targetMonth, activeTab, sn, val);
    setRefreshTrigger(prev => prev + 1);
  };

  // 🌟 MULTI-MONTH AUTO-SYNC FROM PARTYWISE ANALYSIS
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

  // Quick Quarter Selection Handlers
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
                <Sparkles size={10} /> Multi-Month Mix &bull; Dedicated Stockist Sheets
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              BE: BANWARI LAL MEENA &bull; HQ: UDAIPUR &bull; Screenshot Exact Yellow/Black Template &bull; Multi-Sheet Excel
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 🌟 CUSTOM MULTI-MONTH TRIGGER BUTTON */}
          <button
            type="button"
            onClick={() => setShowMonthPickerModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-amber-500/50 text-amber-300 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <Calendar size={13} className="text-amber-400" />
            <span>Month: <b className="text-white font-mono">{selectedMonthsLabel}</b> ({selectedMonthCodes.length}M)</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          {/* AUTO-SYNC BUTTON */}
          <button
            onClick={handleAutoSyncFromPartywise}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
            title="Auto-fetch free quantities directly from Partywise Analysis for selected months"
          >
            <Zap size={14} /> ⚡ Auto-Sync ({selectedMonthCodes.length}M)
          </button>

          {/* EXCEL EXPORT (SINGLE STOCKIST - EXACT TEMPLATE) */}
          <button
            onClick={() => exportFreeGoodsSinglePartyExcel(selectedMonthCodes, activeTab, currentPartyMeta.name, currentPartyMeta.tag, onlyActiveQtyInExcel)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow"
            title="Export this Stockist in Exact Yellow/Black Template format"
          >
            <Download size={14} /> Export {currentPartyMeta.tag} Excel
          </button>

          {/* 🌟 MULTI-SHEET MASTER EXCEL (ALL 6 STOCKISTS SEPARATE SHEETS) */}
          <button
            onClick={() => exportFreeGoodsStockwiseMultiSheetExcel(selectedMonthCodes, onlyActiveQtyInExcel)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
            title="Download Master Excel where every stockist has its own separate tab sheet!"
          >
            <FileSpreadsheet size={14} /> 📊 Master Excel (All Sheets)
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

      {/* Party Switcher Tabs & Excel Options Strip */}
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

        {/* Excel Filter Checkbox */}
        <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
          <input
            type="checkbox"
            checked={onlyActiveQtyInExcel}
            onChange={e => setOnlyActiveQtyInExcel(e.target.checked)}
            className="rounded text-amber-500"
          />
          <span>Excel me sirf Free Qty &gt; 0 wale products export karein</span>
        </label>
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

      {/* 🌟 CUSTOM MULTI-MONTH SELECTION MODAL POPUP */}
      {showMonthPickerModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Calendar size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Custom Multi-Month Selector</h3>
                  <p className="text-xs text-slate-400">Pick any custom mix of months or standard quarters</p>
                </div>
              </div>
              <button onClick={() => setShowMonthPickerModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            {/* Quick Quarter Chips */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Quick Presets:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickSelectQuarter(['APR', 'MAY', 'JUN'])}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold"
                >
                  Q1 (Apr-Jun)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelectQuarter(['JUL', 'AUG', 'SEP'])}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold"
                >
                  Q2 (Jul-Sep)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelectQuarter(['OCT', 'NOV', 'DEC'])}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold"
                >
                  Q3 (Oct-Dec)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelectQuarter(['JAN', 'FEB', 'MAR'])}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold"
                >
                  Q4 (Jan-Mar)
                </button>
              </div>
            </div>

            {/* Checkbox Grid for All 12 Months */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                <span>Select Custom Month Mix:</span>
                <button
                  type="button"
                  onClick={() => setSelectedMonthCodes(MONTH_OPTIONS.map(m => m.code))}
                  className="text-cyan-400 hover:underline"
                >
                  Select All (12M)
                </button>
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

            {/* Modal Footer */}
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
                    Free Goods Distribution Breakdown &bull; {currentPartyMeta.name} ({selectedMonthsLabel} 2026)
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
                        Selected months me kisi chemist ko is product par free goods nahi gaye ya Partywise Analysis me Dwarika statement upload nahi hai.
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

            {/* Modal Footer */}
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
"""

with open('src/components/FreeGoodsVault.tsx', 'w', encoding='utf-8') as f:
    f.write(vault_code)
print("✅ FreeGoodsVault.tsx updated.")

# 4. Build Vite Bundle
print("\n📦 [2/3] Compiling Production Bundle (npm run build)...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful.")

# 5. Direct Cloudflare Pages Deploy
print("\n☁️ [3/3] Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Multi-Month Free Goods & Screenshot Exact Multi-Sheet Excel Live on Cloudflare!")
