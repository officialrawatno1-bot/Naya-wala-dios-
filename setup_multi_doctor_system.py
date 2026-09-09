import os, sys, subprocess

print("==========================================================================")
print("🧠 [1/3] UPDATING STORE WITH MULTI-DOCTOR & SKU ALLOCATION...")
print("==========================================================================")

# 1. Update src/data/partywiseAggregatorStore.ts
store_code = """import { MASTER_PRODUCTS, MasterProduct } from '../data/masterProducts';
import { RetailerSaleRecord } from '../parsers/retailerParsers/dwarikaRetailerParser';

const STORAGE_KEY = 'dios_partywise_aggregator_vault_v1';
const ALLOCATIONS_KEY = 'dios_chemist_doctor_allocations_v3';

export interface ProductAllocation {
  productSn: number;
  productName: string;
  salesQty: number;
  freeQty: number;
  rate: number;
  salesAmount: number;
  freeAmount: number;
  grossAmount: number;
}

export interface DoctorAllocation {
  doctorName: string;
  speciality: string;
  allocatedProducts: Record<number, ProductAllocation>;
}

export interface RetailerConsolidatedProfile {
  key: string;
  retailerName: string;
  address: string;
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
  linkedRetailers: Array<{ retailerName: string; address: string; contributionAmount: number }>;
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
    this.clearAllocationsForMonth(monthCode);
    this.persist();
  }

  public getMonthRetailers(monthCode: string): RetailerConsolidatedProfile[] {
    const records = this.data[monthCode] || [];
    const map: Record<string, RetailerConsolidatedProfile> = {};

    records.forEach(r => {
      const cleanKey = `${r.retailerName} (${r.address})`.toUpperCase().trim();

      if (!map[cleanKey]) {
        map[cleanKey] = {
          key: cleanKey,
          retailerName: r.retailerName,
          address: r.address,
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

  public getAllocationsForMonth(monthCode: string): Record<string, DoctorAllocation[]> {
    try {
      const all = JSON.parse(localStorage.getItem(ALLOCATIONS_KEY) || '{}');
      return all[monthCode] || {};
    } catch (e) {
      return {};
    }
  }

  public getAllocationsForRetailer(monthCode: string, retailerKey: string): DoctorAllocation[] {
    const monthAllocations = this.getAllocationsForMonth(monthCode);
    return monthAllocations[retailerKey] || [];
  }

  public saveRetailerAllocations(monthCode: string, retailerKey: string, allocations: DoctorAllocation[]) {
    try {
      const all = JSON.parse(localStorage.getItem(ALLOCATIONS_KEY) || '{}');
      if (!all[monthCode]) all[monthCode] = {};
      
      const valid = allocations.filter(a => a.doctorName && a.doctorName !== '-' && Object.keys(a.allocatedProducts).length > 0);
      if (valid.length > 0) {
        all[monthCode][retailerKey] = valid;
      } else {
        delete all[monthCode][retailerKey];
      }

      localStorage.setItem(ALLOCATIONS_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  public clearAllocationsForMonth(monthCode: string) {
    try {
      const all = JSON.parse(localStorage.getItem(ALLOCATIONS_KEY) || '{}');
      delete all[monthCode];
      localStorage.setItem(ALLOCATIONS_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  public getDoctorLinkedAnalytics(monthCode: string, allMslDocs: any[]): DoctorLinkedAnalyticsProfile[] {
    const retailers = this.getMonthRetailers(monthCode);
    const monthAllocations = this.getAllocationsForMonth(monthCode);
    const docMap: Record<string, DoctorLinkedAnalyticsProfile> = {};

    retailers.forEach(r => {
      const allocations = monthAllocations[r.key];

      if (allocations && allocations.length > 0) {
        allocations.forEach(alloc => {
          const docName = alloc.doctorName;
          if (!docName || docName === '-') return;

          const cleanDocKey = docName.toUpperCase().trim();
          const mslMeta = allMslDocs.find((d: any) => d.doctorName.toUpperCase().trim() === cleanDocKey);

          if (!docMap[cleanDocKey]) {
            docMap[cleanDocKey] = {
              doctorName: docName,
              speciality: mslMeta?.speciality || alloc.speciality || 'CONSULTANT',
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
          let doctorChemistContribution = 0;

          Object.values(alloc.allocatedProducts).forEach(ap => {
            if (ap.salesQty > 0 || ap.freeQty > 0) {
              dProf.salesQty += ap.salesQty;
              dProf.freeQty += ap.freeQty;
              dProf.totalQty += (ap.salesQty + ap.freeQty);
              dProf.salesAmount = Number((dProf.salesAmount + ap.salesAmount).toFixed(2));
              dProf.freeAmount = Number((dProf.freeAmount + ap.freeAmount).toFixed(2));
              dProf.grossAmount = Number((dProf.grossAmount + ap.grossAmount).toFixed(2));
              doctorChemistContribution = Number((doctorChemistContribution + ap.salesAmount).toFixed(2));

              if (!dProf.products[ap.productSn]) {
                dProf.products[ap.productSn] = {
                  productName: ap.productName,
                  salesQty: 0,
                  freeQty: 0,
                  totalQty: 0,
                  salesAmount: 0,
                  grossAmount: 0
                };
              }
              const p = dProf.products[ap.productSn];
              p.salesQty += ap.salesQty;
              p.freeQty += ap.freeQty;
              p.totalQty += (ap.salesQty + ap.freeQty);
              p.salesAmount = Number((p.salesAmount + ap.salesAmount).toFixed(2));
              p.grossAmount = Number((p.grossAmount + ap.grossAmount).toFixed(2));
            }
          });

          if (doctorChemistContribution > 0 && !dProf.linkedRetailers.some(lr => lr.retailerName === r.retailerName)) {
            dProf.linkedRetailers.push({
              retailerName: r.retailerName,
              address: r.address,
              contributionAmount: doctorChemistContribution
            });
          }
        });
      }
    });

    return Object.values(docMap).sort((a, b) => b.salesAmount - a.salesAmount);
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
print("✅ Store updated.")

# 2. Update src/exporters/partywiseExporter.ts
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
    { v: 'ALLOCATED MSL DOCTORS', s: standardTheme.colHeader },
    { v: 'SALES QTY', s: standardTheme.colHeader },
    { v: 'FREE QTY', s: standardTheme.colHeader },
    { v: 'TOTAL UNITS', s: standardTheme.colHeader },
    { v: 'SALES AMOUNT (₹)', s: standardTheme.colHeader },
    { v: 'FREE VALUE (₹)', s: standardTheme.colHeader },
    { v: 'GROSS AMOUNT (₹)', s: standardTheme.colHeader }
  ]);

  retailers.forEach((r, idx) => {
    const allocs = partywiseAggregatorStore.getAllocationsForRetailer(monthCode, r.key);
    const docSummary = allocs.length > 0 ? allocs.map(a => `${a.doctorName} (${Object.keys(a.allocatedProducts).length} SKUs)`).join('; ') : '-';

    wsData.push([
      { v: idx + 1, s: standardTheme.cellCenter },
      { v: r.retailerName, s: standardTheme.cellLeft },
      { v: r.address, s: standardTheme.cellCenter },
      { v: docSummary, s: standardTheme.cellLeft },
      { v: r.salesQty, s: standardTheme.cellCenter },
      { v: r.freeQty > 0 ? r.freeQty : '-', s: standardTheme.cellCenter },
      { v: r.totalQty, s: standardTheme.cellCenterBold },
      { v: r.salesAmount, s: standardTheme.cellRight },
      { v: r.freeAmount > 0 ? r.freeAmount : '-', s: standardTheme.cellRight },
      { v: r.grossAmount, s: standardTheme.cellRight }
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 18 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 18 }];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Retailers_${monthCode}`);
  XLSX.writeFile(wb, `Partywise_Retailer_Analysis_${monthCode}_2026.xlsx`);
}

export function exportPartywiseConsolidatedCSV(monthCode: string) {
  const retailers = partywiseAggregatorStore.getMonthRetailers(monthCode);
  const lines: string[] = [];

  lines.push('S.N.,RETAILER / CHEMIST NAME,ADDRESS / LOCATION,ALLOCATED MSL DOCTORS,SALES QTY,FREE QTY,TOTAL UNITS,SALES AMOUNT (₹),FREE VALUE (₹),GROSS AMOUNT (₹)');

  retailers.forEach((r, idx) => {
    const allocs = partywiseAggregatorStore.getAllocationsForRetailer(monthCode, r.key);
    const docSummary = allocs.length > 0 ? allocs.map(a => `${a.doctorName} (${Object.keys(a.allocatedProducts).length} SKUs)`).join('; ') : '-';
    const q = (v: any) => `"${String(v || '').replace(/"/g, '""')}"`;

    lines.push(`${idx + 1},${q(r.retailerName)},${q(r.address)},${q(docSummary)},${r.salesQty},${r.freeQty},${r.totalQty},${r.salesAmount},${r.freeAmount},${r.grossAmount}`);
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
print("✅ Exporter updated.")

# 3. Update src/components/PartywiseAggregatorVault.tsx
vault_code = """import React, { useState, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Download, RefreshCw, Search, 
  CheckCircle2, Layers, FileSpreadsheet, Sparkles, Building2, 
  Upload, Stethoscope, Eye, X, Calendar, Trash2, RotateCcw, 
  FileText, Link2, UserCheck, ShieldCheck, ChevronRight,
  Plus, Check, AlertCircle, Edit3, Award
} from 'lucide-react';
import { 
  partywiseAggregatorStore, 
  RetailerConsolidatedProfile, 
  DoctorLinkedAnalyticsProfile,
  DoctorAllocation,
  ProductAllocation
} from '../data/partywiseAggregatorStore';
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

  // 🌟 MULTI-DOCTOR & SKU ALLOCATION MODAL STATE
  const [allocatingRetailer, setAllocatingRetailer] = useState<RetailerConsolidatedProfile | null>(null);
  const [modalAllocations, setModalAllocations] = useState<DoctorAllocation[]>([]);
  const [activeDocIndex, setActiveDocIndex] = useState<number>(0);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

  // 360° Detail Modals
  const [selectedRetailer, setSelectedRetailer] = useState<RetailerConsolidatedProfile | null>(null);
  const [selectedDoctorAnalytics, setSelectedDoctorAnalytics] = useState<DoctorLinkedAnalyticsProfile | null>(null);

  const allMslDoctors: MslDoctor[] = useMemo(() => {
    if (memoryStore.mslData && memoryStore.mslData.length > 0) return memoryStore.mslData;
    return MASTER_123_MSL_DOCTORS;
  }, []);

  const filteredMslDocsForSelector = useMemo(() => {
    const q = doctorSearchQuery.toLowerCase().trim();
    if (!q) return allMslDoctors.slice(0, 15);
    return allMslDoctors.filter(d => 
      d.doctorName.toLowerCase().includes(q) || 
      (d.speciality || '').toLowerCase().includes(q) ||
      String(d.srNo).includes(q)
    ).slice(0, 10);
  }, [allMslDoctors, doctorSearchQuery]);

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
      r.address.toLowerCase().includes(q)
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

    const monthAllocations = partywiseAggregatorStore.getAllocationsForMonth(selectedMonthCode);
    const allocatedChemistsCount = Object.keys(monthAllocations).length;

    return {
      totSalesQty,
      totFreeQty,
      totUnits,
      totSalesAmt: Number(totSalesAmt.toFixed(2)),
      totFreeAmt: Number(totFreeAmt.toFixed(2)),
      totGrossAmt: Number(totGrossAmt.toFixed(2)),
      allocatedChemistsCount
    };
  }, [retailersList, selectedMonthCode, refreshTrigger]);

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
    if (window.confirm(`⚠️ Kya aap ${selectedMonthCode} 2026 ka poora Partywise & Doctor Allocation data clear karna chahte hain?`)) {
      partywiseAggregatorStore.clearMonth(selectedMonthCode);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setRefreshTrigger(prev => prev + 1);
      setStatusMsg(`🧹 ${selectedMonthCode} ka partywise data successfully reset ho gaya!`);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleOpenAllocationModal = (retailer: RetailerConsolidatedProfile) => {
    setAllocatingRetailer(retailer);
    const existingAllocations = partywiseAggregatorStore.getAllocationsForRetailer(selectedMonthCode, retailer.key);
    
    if (existingAllocations && existingAllocations.length > 0) {
      setModalAllocations(JSON.parse(JSON.stringify(existingAllocations)));
    } else {
      setModalAllocations([]);
    }

    setActiveDocIndex(0);
    setDoctorSearchQuery('');
  };

  const handleAddDoctorToChemist = (doc: MslDoctor) => {
    if (modalAllocations.some(a => a.doctorName.toUpperCase().trim() === doc.doctorName.toUpperCase().trim())) {
      alert(`Dr. ${doc.doctorName} pehle se is chemist me added hain!`);
      return;
    }

    const newDocAlloc: DoctorAllocation = {
      doctorName: doc.doctorName,
      speciality: doc.speciality || 'CONSULTANT',
      allocatedProducts: {}
    };

    const updated = [...modalAllocations, newDocAlloc];
    setModalAllocations(updated);
    setActiveDocIndex(updated.length - 1);
    setDoctorSearchQuery('');
  };

  const handleRemoveDoctorFromChemist = (docIdx: number) => {
    const updated = modalAllocations.filter((_, i) => i !== docIdx);
    setModalAllocations(updated);
    setActiveDocIndex(Math.max(0, docIdx - 1));
  };

  const getOtherDoctorsAllocatedQty = (productSn: number, currentDocIdx: number) => {
    let otherSales = 0;
    let otherFree = 0;

    modalAllocations.forEach((doc, idx) => {
      if (idx !== currentDocIdx && doc.allocatedProducts[productSn]) {
        otherSales += doc.allocatedProducts[productSn].salesQty || 0;
        otherFree += doc.allocatedProducts[productSn].freeQty || 0;
      }
    });

    return { otherSales, otherFree };
  };

  const handleToggleProductForDoctor = (productSn: number, itemMeta: any) => {
    if (!modalAllocations[activeDocIndex]) return;
    const currentDoc = { ...modalAllocations[activeDocIndex] };
    const { otherSales, otherFree } = getOtherDoctorsAllocatedQty(productSn, activeDocIndex);

    if (currentDoc.allocatedProducts[productSn]) {
      delete currentDoc.allocatedProducts[productSn];
    } else {
      const remSales = Math.max(0, itemMeta.salesQty - otherSales);
      const remFree = Math.max(0, itemMeta.freeQty - otherFree);
      const rate = itemMeta.rate || 0;
      const sAmt = Number((remSales * rate).toFixed(2));
      const fAmt = Number((remFree * rate).toFixed(2));

      currentDoc.allocatedProducts[productSn] = {
        productSn,
        productName: itemMeta.productName,
        salesQty: remSales,
        freeQty: remFree,
        rate: rate,
        salesAmount: sAmt,
        freeAmount: fAmt,
        grossAmount: Number((sAmt + fAmt).toFixed(2))
      };
    }

    const copy = [...modalAllocations];
    copy[activeDocIndex] = currentDoc;
    setModalAllocations(copy);
  };

  const handleSetCustomQty = (productSn: number, itemMeta: any, customSalesStr: string, customFreeStr: string) => {
    if (!modalAllocations[activeDocIndex]) return;
    const currentDoc = { ...modalAllocations[activeDocIndex] };
    const { otherSales, otherFree } = getOtherDoctorsAllocatedQty(productSn, activeDocIndex);

    const maxSales = Math.max(0, itemMeta.salesQty - otherSales);
    const maxFree = Math.max(0, itemMeta.freeQty - otherFree);

    const sQty = Math.min(maxSales, Math.max(0, parseFloat(customSalesStr) || 0));
    const fQty = Math.min(maxFree, Math.max(0, parseFloat(customFreeStr) || 0));
    const rate = itemMeta.rate || 0;
    const sAmt = Number((sQty * rate).toFixed(2));
    const fAmt = Number((fQty * rate).toFixed(2));

    if (sQty > 0 || fQty > 0) {
      currentDoc.allocatedProducts[productSn] = {
        productSn,
        productName: itemMeta.productName,
        salesQty: sQty,
        freeQty: fQty,
        rate: rate,
        salesAmount: sAmt,
        freeAmount: fAmt,
        grossAmount: Number((sAmt + fAmt).toFixed(2))
      };
    } else {
      delete currentDoc.allocatedProducts[productSn];
    }

    const copy = [...modalAllocations];
    copy[activeDocIndex] = currentDoc;
    setModalAllocations(copy);
  };

  const handleSaveAllocations = () => {
    if (!allocatingRetailer) return;
    partywiseAggregatorStore.saveRetailerAllocations(selectedMonthCode, allocatingRetailer.key, modalAllocations);
    setAllocatingRetailer(null);
    setRefreshTrigger(prev => prev + 1);
    setStatusMsg(`💾 ${allocatingRetailer.retailerName} ke ${modalAllocations.length} Doctors ki Product Allocations save ho gayi hain!`);
    setTimeout(() => setStatusMsg(null), 3500);
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
                <Sparkles size={10} /> Multi-Doctor SKU Allocator
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              BE: BANWARI LAL MEENA • HQ: UDAIPUR • Granular Full/Custom Qty Allocation per Chemist
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
        getData={() => ({ 
          selectedMonthCode, 
          store: partywiseAggregatorStore.data,
          allocations: partywiseAggregatorStore.getAllocationsForMonth(selectedMonthCode)
        })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.store) {
            partywiseAggregatorStore.data = cloudData.store;
            partywiseAggregatorStore.persist();
          }
          if (cloudData.allocations) {
            try {
              const all = JSON.parse(localStorage.getItem('dios_chemist_doctor_allocations_v3') || '{}');
              all[selectedMonthCode] = cloudData.allocations;
              localStorage.setItem('dios_chemist_doctor_allocations_v3', JSON.stringify(all));
            } catch (e) {}
          }
          setRefreshTrigger(prev => prev + 1);
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

      {/* 4 DUAL-METRIC KPI STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Unique Retailers</div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {retailersList.length} <span className="text-xs font-normal text-slate-400">Chemists</span>
          </div>
          <div className="text-xs text-amber-400 font-mono mt-0.5">
            👨‍⚕️ {grandMetrics.allocatedChemistsCount} Chemists Allocated to MSL Drs
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

      {/* VIEW SWITCHER TABS: CHEMIST DIRECTORY VS MSL DOCTOR LINKED SHEET */}
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
            placeholder={activeTabMode === 'CHEMISTS' ? "Search chemist or address..." : "Search doctor, speciality, or chemist..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* VIEW 1: CHEMIST DIRECTORY TABLE */}
      {activeTabMode === 'CHEMISTS' ? (
        <div className="overflow-x-auto max-h-[550px] border border-slate-800 rounded-2xl shadow-xl bg-slate-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3 min-w-[220px]">Retailer / Chemist Name</th>
                <th className="p-3 min-w-[130px] text-cyan-300">Address</th>
                <th className="p-3 min-w-[260px] text-amber-400">Allocated MSL Doctors</th>
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
                filteredRetailers.map((r, idx) => {
                  const allocs = partywiseAggregatorStore.getAllocationsForRetailer(selectedMonthCode, r.key);
                  const hasAllocs = allocs.length > 0;

                  return (
                    <tr key={r.key} className="hover:bg-slate-800/40 transition">
                      <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-sans font-bold text-white">{r.retailerName}</td>
                      <td className="p-2.5 text-cyan-300">{r.address}</td>
                      
                      {/* MULTI-DOCTOR ALLOCATION TRIGGER BUTTON */}
                      <td className="p-2 font-sans">
                        <button
                          type="button"
                          onClick={() => handleOpenAllocationModal(r)}
                          className={`w-full py-1.5 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-between gap-1.5 text-left ${
                            hasAllocs
                              ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 hover:bg-amber-900 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="truncate flex items-center gap-1.5">
                            {hasAllocs ? (
                              <>
                                <Stethoscope size={13} className="text-amber-400 shrink-0" />
                                <span className="truncate">
                                  {allocs.length === 1 
                                    ? `Dr. ${allocs[0].doctorName} (${Object.keys(allocs[0].allocatedProducts).length} SKUs)`
                                    : `${allocs.length} Doctors Allocated (${allocs.map(a => a.doctorName.split(' ')[0]).join(', ')})`
                                  }
                                </span>
                              </>
                            ) : (
                              <span>+ Allocate Doctors &amp; SKUs</span>
                            )}
                          </div>
                          <ChevronRight size={14} className="shrink-0 text-amber-400" />
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
                  );
                })
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
        /* VIEW 2: MSL DOCTOR LINKED INTELLIGENCE SHEET */
        <div className="overflow-x-auto max-h-[550px] border border-slate-800 rounded-2xl shadow-xl bg-slate-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3 min-w-[200px] text-amber-400">MSL Doctor Name</th>
                <th className="p-3 min-w-[130px] text-slate-300">Speciality</th>
                <th className="p-3 min-w-[240px]">Contributing Chemist Stores</th>
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
                    Abhi tak koi bhi Chemist/Product kisi MSL Doctor ko allocate nahi hua hai.<br />
                    Upar <b>"Chemist Directory"</b> tab par jakar <b>"+ Allocate Doctors &amp; SKUs"</b> button dabayein!
                  </td>
                </tr>
              ) : (
                filteredDoctorAnalytics.map((doc, idx) => (
                  <tr key={doc.doctorName} className="hover:bg-slate-800/40 transition">
                    <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                    <td className="p-2.5 font-sans font-bold text-amber-300">Dr. {doc.doctorName}</td>
                    <td className="p-2.5 text-slate-300">{doc.speciality}</td>
                    
                    <td className="p-2.5 font-sans">
                      <div className="flex flex-wrap gap-1">
                        {doc.linkedRetailers.map((lr, lIdx) => (
                          <span key={lIdx} className="bg-slate-950 border border-slate-800 text-cyan-300 text-[10px] px-2 py-0.5 rounded-lg">
                            🏢 {lr.retailerName} (₹{lr.contributionAmount.toLocaleString()})
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

      {/* 🌟 SMART MULTI-DOCTOR & SKU ALLOCATION MODAL (THE CORE HUB) */}
      {allocatingRetailer && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-4xl w-full p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40">
                  <Building2 size={22} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {allocatingRetailer.retailerName}
                    <span className="text-[11px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                      {allocatingRetailer.address}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Total Billed: <b className="text-white">{allocatingRetailer.salesQty} Sales + {allocatingRetailer.freeQty} Free Units</b> &bull; Total Value: <b className="text-emerald-400">₹{allocatingRetailer.salesAmount.toLocaleString()}</b>
                  </p>
                </div>
              </div>
              <button onClick={() => setAllocatingRetailer(null)} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            {/* Top: Add Doctor Search Bar */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
                <span>1. Search &amp; Add Doctor for {allocatingRetailer.retailerName}:</span>
                <span className="text-[10px] text-slate-400 font-mono">123 MSL Doctors Ready</span>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Type doctor name (e.g. Abhay, Dave, Deepak, Mona, Kapil)..."
                  value={doctorSearchQuery}
                  onChange={e => setDoctorSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:border-amber-400 focus:outline-none"
                />

                {doctorSearchQuery.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border-2 border-amber-500/60 rounded-xl shadow-2xl p-1.5 z-50 max-h-40 overflow-y-auto space-y-1">
                    {filteredMslDocsForSelector.map(doc => (
                      <div
                        key={doc.srNo}
                        onClick={() => handleAddDoctorToChemist(doc)}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950 hover:bg-amber-950/60 border border-transparent hover:border-amber-500/40 text-xs cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[10px]">#{doc.srNo}</span>
                          <span className="font-bold text-white">Dr. {doc.doctorName}</span>
                          {doc.speciality && <span className="text-[10px] text-cyan-300 font-mono">({doc.speciality})</span>}
                        </div>
                        <span className="text-[10px] text-amber-400 font-bold">+ Add to Chemist</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Doctors Tab Switcher */}
            {modalAllocations.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold pl-1">Allocating For:</span>
                {modalAllocations.map((alloc, idx) => {
                  const isActive = activeDocIndex === idx;
                  const allocatedSkuCount = Object.keys(alloc.allocatedProducts).length;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span onClick={() => setActiveDocIndex(idx)}>
                        👨‍⚕️ Dr. {alloc.doctorName} ({allocatedSkuCount} SKUs)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoctorFromChemist(idx)}
                        className="p-0.5 hover:text-rose-500 text-slate-500 rounded"
                        title="Remove doctor from this chemist"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Product SKU Allocation Grid */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl p-2.5 bg-slate-950/70 space-y-2 max-h-[300px]">
              {modalAllocations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-mono">
                  Upar search bar me doctor ka naam likh kar <b>"+ Add to Chemist"</b> karein.<br />
                  Uske baad yahan Grandlife ke saare products me se unhe quantity allocate karein!
                </div>
              ) : (
                <>
                  <div className="text-xs font-bold text-cyan-300 flex items-center justify-between pb-1 px-1 border-b border-slate-800/80">
                    <span>
                      2. Select &amp; Allocate Products for <b className="text-amber-400 font-bold">Dr. {modalAllocations[activeDocIndex]?.doctorName}</b>:
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Chemist SKU List ({Object.keys(allocatingRetailer.items).length} Items)
                    </span>
                  </div>

                  {Object.entries(allocatingRetailer.items).map(([snStr, it]) => {
                    const sn = Number(snStr);
                    const currentDoc = modalAllocations[activeDocIndex];
                    const allocData = currentDoc?.allocatedProducts[sn];
                    const isPrescribed = !!allocData;
                    const { otherSales, otherFree } = getOtherDoctorsAllocatedQty(sn, activeDocIndex);

                    const maxRemSales = Math.max(0, it.salesQty - otherSales);
                    const maxRemFree = Math.max(0, it.freeQty - otherFree);

                    return (
                      <div
                        key={sn}
                        className={`p-2.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isPrescribed
                            ? 'bg-slate-900 border-amber-500/60 shadow-sm'
                            : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {/* Left Product Details */}
                        <div className="flex items-center gap-2.5 min-w-[220px]">
                          <input
                            type="checkbox"
                            checked={isPrescribed}
                            onChange={() => handleToggleProductForDoctor(sn, it)}
                            className="rounded text-amber-500 cursor-pointer h-4 w-4"
                          />
                          <div>
                            <div className="font-bold text-white">{it.productName || itemDesc(sn)}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Chemist Total: <b className="text-cyan-300">{it.salesQty} Sales</b> {it.freeQty > 0 ? `+ ${it.freeQty} Free` : ''} &bull; Rate: ₹{it.rate}
                            </div>
                          </div>
                        </div>

                        {/* Middle: Live Balance Status */}
                        <div className="text-[10px] font-mono text-slate-400">
                          {otherSales > 0 ? (
                            <span className="text-purple-300">
                              Other Drs: {otherSales}/{it.salesQty} | Max Rem: {maxRemSales}
                            </span>
                          ) : (
                            <span className="text-emerald-400">Full {it.salesQty} available</span>
                          )}
                        </div>

                        {/* Right: Full vs Custom Qty Controls */}
                        {isPrescribed ? (
                          <div className="flex items-center gap-2">
                            {/* 1-Click Full Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleProductForDoctor(sn, it)}
                              className="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-lg text-[10px] font-bold transition cursor-pointer"
                              title="Assign full remaining quantity"
                            >
                              Full Rem ({maxRemSales})
                            </button>

                            {/* Custom Sales Input */}
                            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-700">
                              <span className="text-[10px] text-slate-400">Sales:</span>
                              <input
                                type="number"
                                value={allocData.salesQty}
                                onChange={e => handleSetCustomQty(sn, it, e.target.value, String(allocData.freeQty))}
                                className="w-12 bg-transparent text-cyan-300 font-mono font-bold text-xs text-center focus:outline-none"
                              />
                            </div>

                            {/* Custom Free Input */}
                            {it.freeQty > 0 && (
                              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-700">
                                <span className="text-[10px] text-slate-400">Free:</span>
                                <input
                                  type="number"
                                  value={allocData.freeQty}
                                  onChange={e => handleSetCustomQty(sn, it, String(allocData.salesQty), e.target.value)}
                                  className="w-10 bg-transparent text-amber-300 font-mono font-bold text-xs text-center focus:outline-none"
                                />
                              </div>
                            )}

                            <span className="text-emerald-400 font-mono font-bold w-20 text-right">
                              ₹{allocData.salesAmount.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleProductForDoctor(sn, it)}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            + Allocate
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs font-mono text-slate-300">
                Doctors Configured: <b className="text-amber-400 font-bold">{modalAllocations.length}</b>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllocatingRetailer(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveAllocations}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={15} /> Save &amp; Lock Allocations
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 360-DEGREE DOCTOR PRODUCT ANALYTICS MODAL */}
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
                    Speciality: {selectedDoctorAnalytics.speciality} &bull; Month: {selectedMonthCode} 2026
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedDoctorAnalytics(null)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Contributing Chemist Stores:</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedDoctorAnalytics.linkedRetailers.map((lr, i) => (
                  <span key={i} className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs px-2.5 py-1 rounded-xl">
                    🏢 {lr.retailerName} (₹{lr.contributionAmount.toLocaleString()})
                  </span>
                ))}
              </div>
            </div>

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

      {/* 360-DEGREE RETAILER DETAIL MODAL */}
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
                  <p className="text-xs text-cyan-400 font-mono">Location: {selectedRetailer.address} &bull; Month: {selectedMonthCode}</p>
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
print("✅ Vault updated.")

# 4. Build Vite
print("\n📦 [2/3] Compiling Production Bundle (npm run build)...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful.")

# 5. Direct Cloudflare Deploy
print("\n☁️ [3/3] Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Multi-Doctor & SKU Allocation System is 100% Deployed!")
