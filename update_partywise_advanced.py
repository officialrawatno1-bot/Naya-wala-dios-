import os, sys, subprocess

print("==========================================================================")
print("🧠 [1/3] UPDATING PARTYWISE DATA STORE WITH DUAL-QTY & MSL DOCTOR ENGINE...")
print("==========================================================================")

# 1. Update partywiseAggregatorStore.ts
store_code = """import { MASTER_PRODUCTS, MasterProduct } from '../data/masterProducts';
import { RetailerSaleRecord } from '../parsers/retailerParsers/dwarikaRetailerParser';

const STORAGE_KEY = 'dios_partywise_aggregator_vault_v1';
const MAPPINGS_KEY = 'dios_retailer_doctor_mappings_v2';

export interface RetailerConsolidatedProfile {
  key: string;
  retailerName: string;
  address: string;
  linkedDoctor?: string;
  stockists: string[];
  salesQty: number;
  freeQty: number;
  totalQty: number;
  salesAmount: number;
  freeAmount: number;
  grossAmount: number;
  items: Record<number, { 
    productName: string; 
    salesQty: number; 
    freeQty: number; 
    totalQty: number; 
    rate: number; 
    salesAmount: number; 
    freeAmount: number; 
    grossAmount: number; 
    stockists: string[] 
  }>;
}

export interface DoctorLinkedAnalyticsProfile {
  doctorName: string;
  speciality: string;
  linkedRetailers: Array<{ retailerName: string; address: string }>;
  salesQty: number;
  freeQty: number;
  totalQty: number;
  salesAmount: number;
  freeAmount: number;
  grossAmount: number;
  products: Record<number, {
    productName: string;
    salesQty: number;
    freeQty: number;
    totalQty: number;
    salesAmount: number;
    grossAmount: number;
  }>;
}

export class PartywiseAggregatorStore {
  public data: Record<string, RetailerSaleRecord[]>;

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

  public setPartyRecords(monthCode: string, records: RetailerSaleRecord[]) {
    this.data[monthCode] = records;
    this.persist();
  }

  public clearMonth(monthCode: string) {
    delete this.data[monthCode];
    this.persist();
  }

  public getMonthRetailers(monthCode: string): RetailerConsolidatedProfile[] {
    const records = this.data[monthCode] || [];
    const map: Record<string, RetailerConsolidatedProfile> = {};

    records.forEach(r => {
      const cleanKey = `${r.retailerName} (${r.address})`.toUpperCase().trim();
      const linkedDoc = this.getLinkedDoctor(cleanKey);

      if (!map[cleanKey]) {
        map[cleanKey] = {
          key: cleanKey,
          retailerName: r.retailerName,
          address: r.address,
          linkedDoctor: linkedDoc,
          stockists: ['Dwarika'],
          salesQty: 0,
          freeQty: 0,
          totalQty: 0,
          salesAmount: 0,
          freeAmount: 0,
          grossAmount: 0,
          items: {}
        };
      }

      const prof = map[cleanKey];
      const sQty = r.salesQty || 0;
      const fQty = r.freeQty || 0;
      const totU = sQty + fQty;
      const rate = r.rate || 0;
      const sAmt = r.amount || Number((sQty * rate).toFixed(2));
      const fAmt = Number((fQty * rate).toFixed(2));
      const gAmt = Number((sAmt + fAmt).toFixed(2));

      prof.salesQty += sQty;
      prof.freeQty += fQty;
      prof.totalQty += totU;
      prof.salesAmount = Number((prof.salesAmount + sAmt).toFixed(2));
      prof.freeAmount = Number((prof.freeAmount + fAmt).toFixed(2));
      prof.grossAmount = Number((prof.grossAmount + gAmt).toFixed(2));

      if (!prof.items[r.productSn]) {
        prof.items[r.productSn] = {
          productName: r.productName,
          salesQty: 0,
          freeQty: 0,
          totalQty: 0,
          rate: rate,
          salesAmount: 0,
          freeAmount: 0,
          grossAmount: 0,
          stockists: ['Dwarika']
        };
      }

      const item = prof.items[r.productSn];
      item.salesQty += sQty;
      item.freeQty += fQty;
      item.totalQty += totU;
      item.rate = rate || item.rate;
      item.salesAmount = Number((item.salesAmount + sAmt).toFixed(2));
      item.freeAmount = Number((item.freeAmount + fAmt).toFixed(2));
      item.grossAmount = Number((item.grossAmount + gAmt).toFixed(2));
    });

    return Object.values(map).sort((a, b) => b.salesAmount - a.salesAmount);
  }

  // 🌟 MSL DOCTOR LINKED INTELLIGENCE AGGREGATOR
  public getDoctorLinkedAnalytics(monthCode: string, allMslDocs: any[]): DoctorLinkedAnalyticsProfile[] {
    const retailers = this.getMonthRetailers(monthCode);
    const docMap: Record<string, DoctorLinkedAnalyticsProfile> = {};

    retailers.forEach(r => {
      const docName = r.linkedDoctor;
      if (!docName || docName === '-' || docName === '-- Select MSL Doctor --') return;

      const cleanDocKey = docName.toUpperCase().trim();
      const mslMeta = allMslDocs.find((d: any) => d.doctorName.toUpperCase().trim() === cleanDocKey);

      if (!docMap[cleanDocKey]) {
        docMap[cleanDocKey] = {
          doctorName: docName,
          speciality: mslMeta?.speciality || 'CONSULTANT',
          linkedRetailers: [],
          salesQty: 0,
          freeQty: 0,
          totalQty: 0,
          salesAmount: 0,
          freeAmount: 0,
          grossAmount: 0,
          products: {}
        };
      }

      const dProf = docMap[cleanDocKey];
      if (!dProf.linkedRetailers.some(lr => lr.retailerName === r.retailerName)) {
        dProf.linkedRetailers.push({ retailerName: r.retailerName, address: r.address });
      }

      dProf.salesQty += r.salesQty;
      dProf.freeQty += r.freeQty;
      dProf.totalQty += r.totalQty;
      dProf.salesAmount = Number((dProf.salesAmount + r.salesAmount).toFixed(2));
      dProf.freeAmount = Number((dProf.freeAmount + r.freeAmount).toFixed(2));
      dProf.grossAmount = Number((dProf.grossAmount + r.grossAmount).toFixed(2));

      Object.entries(r.items).forEach(([snStr, it]) => {
        const sn = Number(snStr);
        if (!dProf.products[sn]) {
          dProf.products[sn] = {
            productName: it.productName,
            salesQty: 0,
            freeQty: 0,
            totalQty: 0,
            salesAmount: 0,
            grossAmount: 0
          };
        }
        const p = dProf.products[sn];
        p.salesQty += it.salesQty;
        p.freeQty += it.freeQty;
        p.totalQty += it.totalQty;
        p.salesAmount = Number((p.salesAmount + it.salesAmount).toFixed(2));
        p.grossAmount = Number((p.grossAmount + it.grossAmount).toFixed(2));
      });
    });

    return Object.values(docMap).sort((a, b) => b.salesAmount - a.salesAmount);
  }

  public linkDoctorToRetailer(monthCode: string, retailerKey: string, doctorName: string) {
    try {
      const mappings = JSON.parse(localStorage.getItem(MAPPINGS_KEY) || '{}');
      if (!doctorName || doctorName === '-') {
        delete mappings[retailerKey];
      } else {
        mappings[retailerKey] = doctorName;
      }
      localStorage.setItem(MAPPINGS_KEY, JSON.stringify(mappings));
    } catch (e) {}
  }

  public getLinkedDoctor(retailerKey: string): string {
    try {
      const mappings = JSON.parse(localStorage.getItem(MAPPINGS_KEY) || '{}');
      return mappings[retailerKey] || '';
    } catch (e) {
      return '';
    }
  }

  public persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {}
  }
}

export const partywiseAggregatorStore = new PartywiseAggregatorStore();
"""

with open('src/data/partywiseAggregatorStore.ts', 'w', encoding='utf-8') as f:
    f.write(store_code)
print("✅ 1. src/data/partywiseAggregatorStore.ts updated.")

# 2. Update partywiseExporter.ts with Detailed Qty, Free, Gross Amounts & Doctor Analytics Export
exporter_code = """import * as XLSX from 'xlsx-js-style';
import { partywiseAggregatorStore } from '../data/partywiseAggregatorStore';
import { standardTheme } from './styles/standardTheme';

export function exportPartywiseConsolidatedExcel(monthCode: string) {
  const retailers = partywiseAggregatorStore.getMonthRetailers(monthCode);
  const wsData: any[][] = [];

  wsData.push([
    { v: 'S.N.', s: standardTheme.colHeader },
    { v: 'RETAILER / CHEMIST NAME', s: standardTheme.colHeader },
    { v: 'ADDRESS / LOCATION', s: standardTheme.colHeader },
    { v: 'LINKED DOCTOR (MSL)', s: standardTheme.colHeader },
    { v: 'SALES QTY', s: standardTheme.colHeader },
    { v: 'FREE QTY', s: standardTheme.colHeader },
    { v: 'TOTAL UNITS', s: standardTheme.colHeader },
    { v: 'SALES AMOUNT (₹)', s: standardTheme.colHeader },
    { v: 'FREE VALUE (₹)', s: standardTheme.colHeader },
    { v: 'GROSS AMOUNT (₹)', s: standardTheme.colHeader }
  ]);

  retailers.forEach((r, idx) => {
    const doc = partywiseAggregatorStore.getLinkedDoctor(r.key) || '-';
    wsData.push([
      { v: idx + 1, s: standardTheme.cellCenter },
      { v: r.retailerName, s: standardTheme.cellLeft },
      { v: r.address, s: standardTheme.cellCenter },
      { v: doc, s: standardTheme.cellCenterBold },
      { v: r.salesQty, s: standardTheme.cellCenter },
      { v: r.freeQty > 0 ? r.freeQty : '-', s: standardTheme.cellCenter },
      { v: r.totalQty, s: standardTheme.cellCenterBold },
      { v: r.salesAmount, s: standardTheme.cellRight },
      { v: r.freeAmount > 0 ? r.freeAmount : '-', s: standardTheme.cellRight },
      { v: r.grossAmount, s: standardTheme.cellRight }
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 18 }, { wch: 24 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 18 }];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Retailers_${monthCode}`);
  XLSX.writeFile(wb, `Partywise_Retailer_Analysis_${monthCode}_2026.xlsx`);
}

export function exportPartywiseConsolidatedCSV(monthCode: string) {
  const retailers = partywiseAggregatorStore.getMonthRetailers(monthCode);
  const lines: string[] = [];

  lines.push('S.N.,RETAILER / CHEMIST NAME,ADDRESS / LOCATION,LINKED DOCTOR (MSL),SALES QTY,FREE QTY,TOTAL UNITS,SALES AMOUNT (₹),FREE VALUE (₹),GROSS AMOUNT (₹)');

  retailers.forEach((r, idx) => {
    const doc = partywiseAggregatorStore.getLinkedDoctor(r.key) || '-';
    const q = (v: any) => `"${String(v || '').replace(/"/g, '""')}"`;
    lines.push(`${idx + 1},${q(r.retailerName)},${q(r.address)},${q(doc)},${r.salesQty},${r.freeQty},${r.totalQty},${r.salesAmount},${r.freeAmount},${r.grossAmount}`);
  });

  const csvContent = lines.join('\\r\\n');
  const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Partywise_Retailer_Analysis_${monthCode}_2026.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
"""

with open('src/exporters/partywiseExporter.ts', 'w', encoding='utf-8') as f:
    f.write(exporter_code)
print("✅ 2. src/exporters/partywiseExporter.ts updated.")

# 3. Update PartywiseAggregatorVault.tsx with Searchable Doctor Modal, Doctor Intelligence Sheet Tab & Dual Totals
vault_code = """import React, { useState, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Download, RefreshCw, Search, 
  CheckCircle2, Layers, FileSpreadsheet, Sparkles, Building2, 
  Upload, Stethoscope, Eye, X, Calendar, Trash2, RotateCcw, 
  FileText, Link2, UserCheck, ShieldCheck, ChevronRight
} from 'lucide-react';
import { partywiseAggregatorStore, RetailerConsolidatedProfile, DoctorLinkedAnalyticsProfile } from '../data/partywiseAggregatorStore';
import { parseDwarikaRetailerPdf, RetailerSaleRecord } from '../parsers/retailerParsers/dwarikaRetailerParser';
import { exportPartywiseConsolidatedExcel, exportPartywiseConsolidatedCSV } from '../exporters/partywiseExporter';
import { memoryStore, MslDoctor } from '../data/memoryStore';
import { MASTER_123_MSL_DOCTORS } from './review/MslSheet';
import { MASTER_PRODUCTS } from '../data/masterProducts';
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

export const PartywiseAggregatorVault: React.FC<Props> = ({ onBack }) => {
  const [selectedMonthCode, setSelectedMonthCode] = useState('AUG');
  const [activeTabMode, setActiveTabMode] = useState<'CHEMISTS' | 'MSL_DOCTORS'>('CHEMISTS');
  const [search, setSearch] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Searchable Doctor Selector Modal State
  const [linkingTargetRetailer, setLinkingTargetRetailer] = useState<RetailerConsolidatedProfile | null>(null);
  const [doctorSearchText, setDoctorSearchText] = useState('');

  // 360° Detail Modals
  const [selectedRetailer, setSelectedRetailer] = useState<RetailerConsolidatedProfile | null>(null);
  const [selectedDoctorAnalytics, setSelectedDoctorAnalytics] = useState<DoctorLinkedAnalyticsProfile | null>(null);

  const allMslDoctors: MslDoctor[] = useMemo(() => {
    if (memoryStore.mslData && memoryStore.mslData.length > 0) return memoryStore.mslData;
    return MASTER_123_MSL_DOCTORS;
  }, []);

  const filteredMslDocsForSelector = useMemo(() => {
    const q = doctorSearchText.toLowerCase().trim();
    if (!q) return allMslDoctors.slice(0, 20);
    return allMslDoctors.filter(d => 
      d.doctorName.toLowerCase().includes(q) || 
      (d.speciality || '').toLowerCase().includes(q) ||
      (d.activityType || '').toLowerCase().includes(q) ||
      String(d.srNo).includes(q)
    ).slice(0, 15);
  }, [allMslDoctors, doctorSearchText]);

  const retailersList = useMemo(() => {
    return partywiseAggregatorStore.getMonthRetailers(selectedMonthCode);
  }, [selectedMonthCode, refreshTrigger]);

  const doctorAnalyticsList = useMemo(() => {
    return partywiseAggregatorStore.getDoctorLinkedAnalytics(selectedMonthCode, allMslDoctors);
  }, [selectedMonthCode, allMslDoctors, refreshTrigger]);

  const filteredRetailers = useMemo(() => {
    const q = search.toLowerCase();
    return retailersList.filter(r => 
      r.retailerName.toLowerCase().includes(q) || 
      r.address.toLowerCase().includes(q) ||
      (r.linkedDoctor || '').toLowerCase().includes(q)
    );
  }, [retailersList, search]);

  const filteredDoctorAnalytics = useMemo(() => {
    const q = search.toLowerCase();
    return doctorAnalyticsList.filter(d => 
      d.doctorName.toLowerCase().includes(q) || 
      d.speciality.toLowerCase().includes(q) ||
      d.linkedRetailers.some(lr => lr.retailerName.toLowerCase().includes(q) || lr.address.toLowerCase().includes(q))
    );
  }, [doctorAnalyticsList, search]);

  const grandMetrics = useMemo(() => {
    let totSalesQty = 0;
    let totFreeQty = 0;
    let totUnits = 0;
    let totSalesAmt = 0;
    let totFreeAmt = 0;
    let totGrossAmt = 0;

    retailersList.forEach(r => {
      totSalesQty += r.salesQty;
      totFreeQty += r.freeQty;
      totUnits += r.totalQty;
      totSalesAmt += r.salesAmount;
      totFreeAmt += r.freeAmount;
      totGrossAmt += r.grossAmount;
    });

    return {
      totSalesQty,
      totFreeQty,
      totUnits,
      totSalesAmt: Number(totSalesAmt.toFixed(2)),
      totFreeAmt: Number(totFreeAmt.toFixed(2)),
      totGrossAmt: Number(totGrossAmt.toFixed(2)),
      linkedChemistsCount: retailersList.filter(r => !!r.linkedDoctor && r.linkedDoctor !== '-').length
    };
  }, [retailersList]);

  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setStatusMsg(`Converting PDF to CSV & Analyzing '${file.name}'...`);
    try {
      const { records, detectedMonthCode } = await parseDwarikaRetailerPdf(file);
      if (records.length === 0) {
        throw new Error('Koi valid product ya chemist record nahi mila. Dwarika PDF layout check karein.');
      }

      const targetMonth = detectedMonthCode || selectedMonthCode;
      if (detectedMonthCode && detectedMonthCode !== selectedMonthCode) {
        setSelectedMonthCode(detectedMonthCode);
      }

      partywiseAggregatorStore.setPartyRecords(targetMonth, records);
      setRefreshTrigger(prev => prev + 1);
      setStatusMsg(`🎉 SUCCESS! '${file.name}' (${targetMonth}) se ${records.length} clean entries save ho gayi hain!`);
    } catch (err: any) {
      alert("Parse Error: " + (err.message || String(err)));
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleResetMonthData = () => {
    if (window.confirm(`⚠️ Kya aap ${selectedMonthCode} 2026 ka poora Partywise data clear karna chahte hain?`)) {
      partywiseAggregatorStore.clearMonth(selectedMonthCode);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setRefreshTrigger(prev => prev + 1);
      setStatusMsg(`🧹 ${selectedMonthCode} ka partywise data successfully reset ho gaya!`);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleSelectDoctorFromModal = (docName: string) => {
    if (!linkingTargetRetailer) return;
    partywiseAggregatorStore.linkDoctorToRetailer(selectedMonthCode, linkingTargetRetailer.key, docName);
    setLinkingTargetRetailer(null);
    setDoctorSearchText('');
    setRefreshTrigger(prev => prev + 1);
    setStatusMsg(`🔗 ${linkingTargetRetailer.retailerName} ko Dr. ${docName} se permanently link kar diya gaya!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

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
              PARTYWISE &amp; MSL DOCTOR LINKED INTELLIGENCE
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <Sparkles size={10} /> Dual Qty &amp; Amount Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              BE: BANWARI LAL MEENA • HQ: UDAIPUR • Distinct Sales &amp; Free Units + Doctor Level Revenue Rollup
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-cyan-500/40">
            <Calendar size={13} className="text-cyan-400" />
            <span className="text-xs text-slate-400 font-semibold">Month:</span>
            <select
              value={selectedMonthCode}
              onChange={(e) => setSelectedMonthCode(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer"
            >
              {MONTH_OPTIONS.map(opt => (
                <option key={opt.code} value={opt.code} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleResetMonthData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Clear all parsed data for selected month"
          >
            <RotateCcw size={13} /> Reset {selectedMonthCode}
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow">
            <Upload size={14} className={isParsing ? 'animate-bounce' : ''} />
            <span>{isParsing ? 'Processing...' : 'Upload Dwarika PDF'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf,.csv"
              disabled={isParsing}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </label>

          <button
            onClick={() => exportPartywiseConsolidatedCSV(selectedMonthCode)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow"
            title="Download Clean CSV of Partywise Analysis"
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            onClick={() => exportPartywiseConsolidatedExcel(selectedMonthCode)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow"
          >
            <FileSpreadsheet size={14} /> Export Master Excel
          </button>
        </div>
      </div>

      <CloudSyncBar
        storageKey={`statements/partywise_aggregator_${selectedMonthCode}_2026`}
        sheetTitle={`Partywise Analysis (${selectedMonthCode})`}
        getData={() => ({ selectedMonthCode, store: partywiseAggregatorStore.data })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.store) {
            partywiseAggregatorStore.data = cloudData.store;
            partywiseAggregatorStore.persist();
            setRefreshTrigger(prev => prev + 1);
          }
        }}
        onSaveLocal={() => {
          partywiseAggregatorStore.persist();
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

      {/* 🌟 4 DUAL-METRIC KPI STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Unique Retailers</div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {retailersList.length} <span className="text-xs font-normal text-slate-400">Chemists</span>
          </div>
          <div className="text-xs text-amber-400 font-mono mt-0.5">
            🔗 {grandMetrics.linkedChemistsCount} Chemists Linked to MSL
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-cyan-400 uppercase font-semibold">Total Billed &amp; Free Units</div>
          <div className="text-lg font-black text-cyan-300 font-mono mt-1">
            {grandMetrics.totSalesQty.toLocaleString()} <span className="text-xs text-cyan-400">Sales</span> + {grandMetrics.totFreeQty.toLocaleString()} <span className="text-xs text-amber-400">Free</span>
          </div>
          <div className="text-xs text-slate-300 font-mono font-bold mt-0.5">
            = {grandMetrics.totUnits.toLocaleString()} Total Units
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-emerald-400 uppercase font-semibold">Total Revenue (Sales Only)</div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            ₹{grandMetrics.totSalesAmt.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            Free Value: ₹{grandMetrics.totFreeAmt.toLocaleString()}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-950/90 to-slate-950 p-3.5 rounded-2xl border-2 border-emerald-500/50 shadow-xl flex flex-col justify-between">
          <div className="text-[10px] text-emerald-300 uppercase font-black tracking-wide flex items-center justify-between">
            <span>TOTAL GROSS BUSINESS (QTY+FREE)</span>
            <Sparkles size={14} className="text-yellow-300 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono mt-1">
            ₹{grandMetrics.totGrossAmt.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 🌟 VIEW SWITCHER TABS: CHEMIST DIRECTORY VS MSL DOCTOR LINKED SHEET */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveTabMode('CHEMISTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTabMode === 'CHEMISTS'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 size={15} />
            <span>🏢 Chemist Directory ({retailersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTabMode('MSL_DOCTORS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTabMode === 'MSL_DOCTORS'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-md shadow-amber-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Stethoscope size={15} />
            <span>👨‍⚕️ MSL Linked Doctor Intelligence ({doctorAnalyticsList.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={activeTabMode === 'CHEMISTS' ? "Search chemist, address, or doctor..." : "Search doctor, speciality, or chemist..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* 🌟 VIEW 1: CHEMIST DIRECTORY TABLE */}
      {activeTabMode === 'CHEMISTS' ? (
        <div className="overflow-x-auto max-h-[550px] border border-slate-800 rounded-2xl shadow-xl bg-slate-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3 min-w-[220px]">Retailer / Chemist Name</th>
                <th className="p-3 min-w-[130px] text-cyan-300">Address</th>
                <th className="p-3 min-w-[220px] text-amber-400">Linked MSL Doctor</th>
                <th className="p-3 text-center w-24 text-cyan-400">Sales Qty</th>
                <th className="p-3 text-center w-20 text-amber-400">Free Qty</th>
                <th className="p-3 text-center w-24 text-slate-200">Total Units</th>
                <th className="p-3 text-right min-w-[130px] text-emerald-400">Sales Amount (₹)</th>
                <th className="p-3 text-right min-w-[140px] text-emerald-300">Gross (₹ Qty+Free)</th>
                <th className="p-3 text-center w-16">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
              {filteredRetailers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 font-sans">
                    No retailer records for {selectedMonthCode}. Upload a Dwarika PDF statement above to populate data!
                  </td>
                </tr>
              ) : (
                filteredRetailers.map((r, idx) => (
                  <tr key={r.key} className="hover:bg-slate-800/40 transition">
                    <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                    <td className="p-2.5 font-sans font-bold text-white">{r.retailerName}</td>
                    <td className="p-2.5 text-cyan-300">{r.address}</td>
                    
                    {/* SEARCHABLE DOCTOR LINK BUTTON */}
                    <td className="p-2 font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          setLinkingTargetRetailer(r);
                          setDoctorSearchText('');
                        }}
                        className={`w-full py-1 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-between gap-1 text-left ${
                          r.linkedDoctor && r.linkedDoctor !== '-'
                            ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 hover:bg-amber-900'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate">
                          {r.linkedDoctor && r.linkedDoctor !== '-' ? `👨‍⚕️ Dr. ${r.linkedDoctor}` : '+ Link MSL Doctor'}
                        </span>
                        <Link2 size={13} className="shrink-0 text-amber-400" />
                      </button>
                    </td>

                    <td className="p-2.5 text-center font-bold text-cyan-300">{r.salesQty}</td>
                    <td className="p-2.5 text-center font-bold text-amber-300">{r.freeQty > 0 ? r.freeQty : '-'}</td>
                    <td className="p-2.5 text-center font-black text-white bg-slate-950/40">{r.totalQty}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-400">₹{r.salesAmount.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-black text-emerald-300 bg-emerald-950/20">₹{r.grossAmount.toLocaleString()}</td>
                    
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => setSelectedRetailer(r)}
                        className="p-1.5 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition cursor-pointer"
                        title="View 360° Breakdown"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-slate-700 font-bold z-10 text-xs font-mono">
              <tr>
                <td className="p-3 text-center text-cyan-400">Σ</td>
                <td className="p-3 text-white font-sans uppercase" colSpan={3}>GRAND TOTAL ({selectedMonthCode})</td>
                <td className="p-3 text-center text-cyan-300 font-black">{grandMetrics.totSalesQty.toLocaleString()}</td>
                <td className="p-3 text-center text-amber-300 font-black">{grandMetrics.totFreeQty.toLocaleString()}</td>
                <td className="p-3 text-center text-white font-black bg-slate-900">{grandMetrics.totUnits.toLocaleString()}</td>
                <td className="p-3 text-right text-emerald-400 font-black">₹{grandMetrics.totSalesAmt.toLocaleString()}</td>
                <td className="p-3 text-right text-emerald-300 font-black bg-emerald-950/50">₹{grandMetrics.totGrossAmt.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        /* 🌟 VIEW 2: NEW MSL DOCTOR LINKED INTELLIGENCE SHEET */
        <div className="overflow-x-auto max-h-[550px] border border-slate-800 rounded-2xl shadow-xl bg-slate-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3 min-w-[200px] text-amber-400">MSL Doctor Name</th>
                <th className="p-3 min-w-[130px] text-slate-300">Speciality</th>
                <th className="p-3 min-w-[240px]">Linked Chemist Stores</th>
                <th className="p-3 text-center w-24 text-cyan-400">Sales Qty</th>
                <th className="p-3 text-center w-20 text-amber-400">Free Qty</th>
                <th className="p-3 text-center w-24 text-slate-200">Total Units</th>
                <th className="p-3 text-right min-w-[130px] text-emerald-400">Sales Amount (₹)</th>
                <th className="p-3 text-right min-w-[140px] text-emerald-300">Gross (₹ Qty+Free)</th>
                <th className="p-3 text-center w-20">Products</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
              {filteredDoctorAnalytics.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 font-sans">
                    Abhi tak koi bhi Chemist MSL Doctor se link nahi kiya gaya hai. <br />
                    Upar <b>"Chemist Directory"</b> tab par jakar <b>"+ Link MSL Doctor"</b> button se link karein!
                  </td>
                </tr>
              ) : (
                filteredDoctorAnalytics.map((doc, idx) => (
                  <tr key={doc.doctorName} className="hover:bg-slate-800/40 transition">
                    <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                    <td className="p-2.5 font-sans font-bold text-amber-300">Dr. {doc.doctorName}</td>
                    <td className="p-2.5 text-slate-300">{doc.speciality}</td>
                    
                    {/* Linked Chemists Badge List */}
                    <td className="p-2.5 font-sans">
                      <div className="flex flex-wrap gap-1">
                        {doc.linkedRetailers.map((lr, lIdx) => (
                          <span key={lIdx} className="bg-slate-950 border border-slate-800 text-cyan-300 text-[10px] px-2 py-0.5 rounded-lg">
                            🏢 {lr.retailerName} ({lr.address})
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-2.5 text-center font-bold text-cyan-300">{doc.salesQty}</td>
                    <td className="p-2.5 text-center font-bold text-amber-300">{doc.freeQty > 0 ? doc.freeQty : '-'}</td>
                    <td className="p-2.5 text-center font-black text-white bg-slate-950/40">{doc.totalQty}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-400">₹{doc.salesAmount.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-black text-emerald-300 bg-emerald-950/20">₹{doc.grossAmount.toLocaleString()}</td>
                    
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => setSelectedDoctorAnalytics(doc)}
                        className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 font-bold rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1 mx-auto"
                      >
                        <Eye size={12} /> {Object.keys(doc.products).length} SKUs
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 🌟 SEARCHABLE MSL DOCTOR SELECTOR POPUP MODAL */}
      {linkingTargetRetailer && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40">
                  <Stethoscope size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Link Chemist to MSL Doctor</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Store: <b className="text-cyan-300">{linkingTargetRetailer.retailerName}</b> ({linkingTargetRetailer.address})
                  </p>
                </div>
              </div>
              <button onClick={() => setLinkingTargetRetailer(null)} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Type doctor name, speciality (e.g. Abhay, Dave, Cardio)..."
                value={doctorSearchText}
                onChange={e => setDoctorSearchText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:border-amber-400 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-2xl p-1.5 space-y-1 bg-slate-950/80 max-h-[320px]">
              {/* Unlink Option */}
              <div
                onClick={() => handleSelectDoctorFromModal('-')}
                className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-rose-950/50 border border-slate-800 text-rose-300 text-xs font-semibold cursor-pointer transition flex items-center justify-between"
              >
                <span>🚫 Unlink / Clear Doctor</span>
                <span className="text-[10px] text-slate-500 font-mono">Remove</span>
              </div>

              {filteredMslDocsForSelector.map(doc => {
                const isCurrent = linkingTargetRetailer.linkedDoctor === doc.doctorName;
                return (
                  <div
                    key={doc.srNo}
                    onClick={() => handleSelectDoctorFromModal(doc.doctorName)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition ${
                      isCurrent 
                        ? 'bg-amber-950 border border-amber-500 text-white font-bold' 
                        : 'bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-slate-500 text-[10px] w-7">#{doc.srNo}</span>
                      <span className="font-bold text-white truncate">Dr. {doc.doctorName}</span>
                      {doc.speciality && (
                        <span className="text-[10px] text-blue-300 bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-500/30">
                          {doc.speciality}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-amber-400 font-bold shrink-0">Select ➔</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button onClick={() => setLinkingTargetRetailer(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 360-DEGREE DOCTOR PRODUCT ANALYTICS MODAL */}
      {selectedDoctorAnalytics && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Stethoscope size={22} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Dr. {selectedDoctorAnalytics.doctorName}</h3>
                  <p className="text-xs text-amber-300 font-mono">
                    Speciality: {selectedDoctorAnalytics.speciality} • Month: {selectedMonthCode} 2026
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedDoctorAnalytics(null)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            {/* Linked Chemists strip */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Contributing Chemist Stores:</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedDoctorAnalytics.linkedRetailers.map((lr, i) => (
                  <span key={i} className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs px-2.5 py-1 rounded-xl">
                    🏢 {lr.retailerName} ({lr.address})
                  </span>
                ))}
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 text-center w-10">#</th>
                    <th className="p-2.5">Product Name</th>
                    <th className="p-2.5 text-center w-24 text-cyan-400">Sales Qty</th>
                    <th className="p-2.5 text-center w-20 text-amber-400">Free Qty</th>
                    <th className="p-2.5 text-center w-24 text-slate-200">Total Units</th>
                    <th className="p-2.5 text-right w-28 text-emerald-400">Sales Amount (₹)</th>
                    <th className="p-2.5 text-right w-28 text-emerald-300">Gross (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {Object.entries(selectedDoctorAnalytics.products).map(([snStr, p], idx) => (
                    <tr key={snStr} className="hover:bg-slate-800/40">
                      <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-sans font-semibold text-white">{p.productName}</td>
                      <td className="p-2.5 text-center font-bold text-cyan-300">{p.salesQty}</td>
                      <td className="p-2.5 text-center font-bold text-amber-300">{p.freeQty > 0 ? p.freeQty : '-'}</td>
                      <td className="p-2.5 text-center font-black text-white">{p.totalQty}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-400">₹{p.salesAmount.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-black text-emerald-300">₹{p.grossAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">
                Total Revenue: <b className="text-emerald-400 text-sm">₹{selectedDoctorAnalytics.salesAmount.toLocaleString()}</b> (Gross: ₹{selectedDoctorAnalytics.grossAmount.toLocaleString()})
              </span>
              <button onClick={() => setSelectedDoctorAnalytics(null)} className="px-5 py-2 bg-slate-800 text-white font-bold rounded-xl cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 360-DEGREE RETAILER DETAIL MODAL */}
      {selectedRetailer && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl">
                  <Building2 size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedRetailer.retailerName}</h3>
                  <p className="text-xs text-cyan-400 font-mono">Location: {selectedRetailer.address} • Month: {selectedMonthCode}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRetailer(null)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 text-center w-10">#</th>
                    <th className="p-2.5">Product Name</th>
                    <th className="p-2.5 text-center w-20 text-cyan-400">Sales Qty</th>
                    <th className="p-2.5 text-center w-20 text-amber-400">Free Qty</th>
                    <th className="p-2.5 text-center w-20 text-white">Total</th>
                    <th className="p-2.5 text-right w-24 text-emerald-400">Sales (₹)</th>
                    <th className="p-2.5 text-right w-24 text-emerald-300">Gross (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {Object.entries(selectedRetailer.items).map(([snStr, it], idx) => (
                    <tr key={snStr} className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2 font-sans font-semibold text-white">{it.productName || itemDesc(Number(snStr))}</td>
                      <td className="p-2 text-center font-bold text-cyan-300">{it.salesQty}</td>
                      <td className="p-2 text-center font-bold text-amber-300">{it.freeQty > 0 ? it.freeQty : '-'}</td>
                      <td className="p-2 text-center font-black text-white">{it.totalQty}</td>
                      <td className="p-2 text-right font-bold text-emerald-300">₹{it.salesAmount.toLocaleString()}</td>
                      <td className="p-2 text-right font-black text-emerald-300">₹{it.grossAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono">
                Total Business: <b className="text-emerald-400">₹{selectedRetailer.salesAmount.toLocaleString()}</b> (Gross: ₹{selectedRetailer.grossAmount.toLocaleString()})
              </span>
              <button onClick={() => setSelectedRetailer(null)} className="px-5 py-2 bg-slate-800 text-white font-bold rounded-xl cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

function itemDesc(sn: number): string {
  const found = MASTER_PRODUCTS.find((p: any) => p.sn === sn);
  return found ? found.name : `Product #${sn}`;
}
"""

with open('src/components/PartywiseAggregatorVault.tsx', 'w', encoding='utf-8') as f:
    f.write(vault_code)
print("✅ 3. src/components/PartywiseAggregatorVault.tsx updated.")

# 4. Compile and Deploy to Cloudflare
print("\n📦 [2/3] Compiling Production Bundle (npm run build)...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful.")

print("\n☁️ [3/3] Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Dual-Qty, Gross Amounts & MSL Doctor Intelligence Deployed to Cloudflare!")
