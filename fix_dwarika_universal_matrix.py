import os, sys, subprocess

print("==========================================================================")
print("🧠 [1000 IQ UNIVERSAL ENGINE] WRITING DUAL-INVARIANT MARG ERP PARSER...")
print("==========================================================================")

parser_code = """import * as pdfjsLib from 'pdfjs-dist';
import { matchMasterProduct, MasterProduct } from '../common';

export interface RetailerSaleRecord {
  retailerName: string;
  address: string;
  productSn: number;
  productName: string;
  salesQty: number;
  freeQty: number;
  rate: number;
  amount: number;
}

const LOCATION_KEYWORDS = [
  'FATEHNAGAR', 'DUNGARPUR', 'BANSWARA', 'SALUMBER', 'KHAMNOR', 'MADRI',
  'BHOPALPURA', 'SEVASHRAM', 'AYAD', 'BEDLA', 'BHUWANA', 'UDIAPOLE',
  'HOSPITAL ROAD', 'PRATAPNAGAR', 'PRATAPNA', 'CHOTI SADRI', 'KURABAD',
  'KANKROLI', 'NATHDWARA', 'KHERWARA', 'BADGAON', 'GOGUNDA', 'RAMGARH',
  'SECTOR 4', 'SECTOR-4', 'SECTOR 3', 'SECTOR-3', 'SECTOR 14', 'SEC 14',
  'SEC.14', 'DELHI GATE', 'DHAN MANDI', 'HATHIPOLE', 'ASHWINI BAZAR',
  'ASHWINI BAZARA', 'SUNDERWAS', 'SAVINA', 'SHOBHAGPURA', 'DABOK',
  'BARI SADRI', 'GARIYAWAS', 'BHETWAR', 'KELWARA', 'RAMPURA', 'SAIFAN',
  'NEW BHOPAL', 'H/R'
];

function extractAddressAndCleanName(rawName: string): { cleanName: string; address: string } {
  let clean = rawName.replace(/^[0-9.\\-\\s]+/, '').trim();
  let address = 'UDAIPUR';
  const upper = clean.toUpperCase();

  for (const loc of LOCATION_KEYWORDS) {
    if (upper.includes(loc)) {
      address = loc;
      break;
    }
  }

  return { cleanName: clean.toUpperCase(), address: address.toUpperCase() };
}

const MONTH_NUM_MAP: Record<string, string> = {
  '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR',
  '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AUG',
  '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC'
};

// 🌟 SMART 5-COLUMN MARG ERP TOKENIZER (Safely protects numbers inside product/chemist names)
function parseMargDataRow(line: string): { desc: string; qty: number; free: number; rate: number; amount: number } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('---') || trimmed.startsWith('===') || trimmed.startsWith('***')) return null;

  const upper = trimmed.toUpperCase().replace(/\\s+/g, '');
  if (
    upper.includes('DWARIKAMEDICALS') || upper.includes('PAGENO') ||
    upper.includes('DESCRIPTIONQTY') || upper.includes('GRANDTOTAL') ||
    upper.includes('ENDOFREPORT') || upper.includes('TOTAL:') ||
    upper.includes('CONTINUED') || upper.includes('REPORTFOR') ||
    upper.includes('DIOSLIFESCIENCE') || upper.includes('SHOPNO') ||
    upper.includes('GSTIN') || upper.includes('D.L.NO') ||
    upper.includes('FOODLIC') || upper.includes('PHONE:')
  ) {
    return null;
  }

  const rawTokens = trimmed.split(/\\s+/);
  if (rawTokens.length < 3) return null;

  const tailNums: number[] = [];
  let nameEndIdx = rawTokens.length;

  // Scan backwards from right to left: [percent], [amount], [rate], [free], [qty]
  for (let i = rawTokens.length - 1; i >= 0; i--) {
    const t = rawTokens[i].replace(/,/g, '').trim();
    if (/^-?\\d+(\\.\\d+)?$/.test(t)) {
      tailNums.unshift(parseFloat(t));
      nameEndIdx = i;
      if (tailNums.length === 5) break; // Reached exact 5 columns!
    } else if (t === '-' || t === '—' || t === '–') {
      tailNums.unshift(0);
      nameEndIdx = i;
      if (tailNums.length === 5) break;
    } else {
      break; // Hit text, stop scanning!
    }
  }

  if (tailNums.length >= 3 && nameEndIdx > 0) {
    const desc = rawTokens.slice(0, nameEndIdx).join(' ').trim();
    if (!desc) return null;

    let qty = 0, free = 0, rate = 0, amount = 0;

    if (tailNums.length === 5) {
      qty = tailNums[0];
      free = tailNums[1];
      rate = tailNums[2];
      amount = tailNums[3];
    } else if (tailNums.length === 4) {
      qty = tailNums[0];
      free = tailNums[1];
      rate = tailNums[2];
      amount = tailNums[3];
    } else if (tailNums.length === 3) {
      qty = tailNums[0];
      free = 0;
      rate = tailNums[1];
      amount = tailNums[2];
    }

    if (qty > 0 || free > 0 || amount > 0) {
      return { desc, qty, free, rate, amount: Number(amount.toFixed(2)) };
    }
  }

  return null;
}

export async function parseDwarikaRetailerPdf(file: File): Promise<{ records: RetailerSaleRecord[]; detectedMonthCode?: string; rawCsv?: string }> {
  let virtualLines: string[] = [];
  let detectedMonthCode: string | undefined = undefined;

  if (file.name.toLowerCase().endsWith('.csv')) {
    const text = await file.text();
    virtualLines = text.split(/\\r?\\n/);
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const rawItems: Array<{ x: number; y: number; text: string }> = [];
      textContent.items.forEach((it: any) => {
        if (it && it.transform && typeof it.str === 'string') {
          const text = it.str.trim();
          if (text.length > 0) {
            rawItems.push({ x: it.transform[4] || 0, y: it.transform[5] || 0, text });
          }
        }
      });

      rawItems.sort((a, b) => b.y - a.y || a.x - b.x);

      const lineBins: Array<Array<{ x: number; text: string }>> = [];
      const lineRefY: number[] = [];

      rawItems.forEach(item => {
        let matchedIdx = -1;
        for (let i = 0; i < lineRefY.length; i++) {
          if (Math.abs(lineRefY[i] - item.y) <= 4.8) {
            matchedIdx = i;
            break;
          }
        }
        if (matchedIdx !== -1) {
          lineBins[matchedIdx].push({ x: item.x, text: item.text });
        } else {
          lineRefY.push(item.y);
          lineBins.push([{ x: item.x, text: item.text }]);
        }
      });

      for (const lineItems of lineBins) {
        lineItems.sort((a, b) => a.x - b.x);
        const fullLine = lineItems.map(it => it.text).join(' ').trim();
        if (fullLine) {
          virtualLines.push(fullLine);
          if (!detectedMonthCode) {
            const dateMatch = fullLine.toUpperCase().match(/FROM\\s+\\d{2}\\/(\\d{2})\\/(\\d{4})/);
            if (dateMatch) detectedMonthCode = MONTH_NUM_MAP[dateMatch[1]];
          }
        }
      }
    }
  }

  // 🌟 UNIVERSAL DUAL-INVARIANT STATE MACHINE
  const records: RetailerSaleRecord[] = [];
  let currentProduct: MasterProduct | null = null;
  let currentParty: string = '';

  for (const line of virtualLines) {
    const dataRow = parseMargDataRow(line);

    // =========================================================================
    // CASE 1: HEADER LINE (No numeric tail)
    // =========================================================================
    if (!dataRow) {
      const prod = matchMasterProduct(line);
      if (prod) {
        currentProduct = prod;
      } else if (line.length > 2) {
        const upper = line.toUpperCase().replace(/\\s+/g, '');
        if (!upper.includes('TOTAL:') && !upper.includes('CONTINUED') && !upper.includes('REPORTFOR') && !upper.includes('DIOSLIFE') && !upper.includes('SHOPNO')) {
          currentParty = line;
        }
      }
      continue;
    }

    // =========================================================================
    // CASE 2: DATA ROW (Has Qty, Free, Rate, Amount)
    // =========================================================================
    const rowProd = matchMasterProduct(dataRow.desc);

    // Sub-case A: row.desc is a PRODUCT (Party-wise PDF layout)
    if (rowProd) {
      const partyToUse = currentParty || 'UDAIPUR MEDICAL';
      const { cleanName, address } = extractAddressAndCleanName(partyToUse);
      records.push({
        retailerName: cleanName,
        address: address,
        productSn: rowProd.sn,
        productName: rowProd.name,
        salesQty: dataRow.qty,
        freeQty: dataRow.free,
        rate: dataRow.rate,
        amount: dataRow.amount
      });
    }
    // Sub-case B: row.desc is a CHEMIST (Item-wise PDF layout)
    else if (currentProduct) {
      const { cleanName, address } = extractAddressAndCleanName(dataRow.desc);
      records.push({
        retailerName: cleanName,
        address: address,
        productSn: currentProduct.sn,
        productName: currentProduct.name,
        salesQty: dataRow.qty,
        freeQty: dataRow.free,
        rate: dataRow.rate,
        amount: dataRow.amount
      });
    }
  }

  return { records, detectedMonthCode };
}
"""

with open('src/parsers/retailerParsers/dwarikaRetailerParser.ts', 'w', encoding='utf-8') as f:
    f.write(parser_code)
print("✅ 1. dwarikaRetailerParser.ts updated.")

# 2. Update PartywiseAggregatorVault.tsx with Direct CSV Download and Instant Reset
vault_code = """import React, { useState, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Download, RefreshCw, Search, 
  CheckCircle2, Layers, FileSpreadsheet, Sparkles, Building2, 
  Upload, Stethoscope, Eye, X, Calendar, Trash2, RotateCcw, FileText
} from 'lucide-react';
import { partywiseAggregatorStore, RetailerConsolidatedProfile } from '../data/partywiseAggregatorStore';
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
  const [search, setSearch] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedRetailer, setSelectedRetailer] = useState<RetailerConsolidatedProfile | null>(null);

  const allMslDoctors: MslDoctor[] = useMemo(() => {
    if (memoryStore.mslData && memoryStore.mslData.length > 0) return memoryStore.mslData;
    return MASTER_123_MSL_DOCTORS;
  }, []);

  const retailersList = useMemo(() => {
    return partywiseAggregatorStore.getMonthRetailers(selectedMonthCode);
  }, [selectedMonthCode, refreshTrigger]);

  const filteredRetailers = useMemo(() => {
    const q = search.toLowerCase();
    return retailersList.filter(r => 
      r.retailerName.toLowerCase().includes(q) || 
      r.address.toLowerCase().includes(q)
    );
  }, [retailersList, search]);

  const grandMetrics = useMemo(() => {
    let totQ = 0;
    let totA = 0;
    retailersList.forEach(r => {
      totQ += r.totalQty;
      totA += r.totalAmount;
    });
    return { totQ, totA: Number(totA.toFixed(2)) };
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

  const handleLinkDoctor = (retailerKey: string, docName: string) => {
    partywiseAggregatorStore.linkDoctorToRetailer(selectedMonthCode, retailerKey, docName);
    setRefreshTrigger(prev => prev + 1);
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
              PARTYWISE ANALYSIS (RETAILER &amp; CHEMIST INTELLIGENCE)
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <Sparkles size={10} /> Universal Dual Parser Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              BE: BANWARI LAL MEENA • HQ: UDAIPUR • Item-Wise &amp; Party-Wise Dwarika PDFs Supported
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
        <div className="p-3 bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 rounded-xl text-xs flex items-center justify-between">
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
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Unique Retailers</div>
          <div className="text-lg font-bold text-white font-mono mt-0.5">
            {retailersList.length} Chemists
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-cyan-400 uppercase font-semibold">Total Retailer Qty</div>
          <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
            {grandMetrics.totQ.toLocaleString()} Units
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-amber-400 uppercase font-semibold">Total Retailer Amount</div>
          <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
            ₹ {grandMetrics.totA.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-[10px] text-emerald-400 uppercase font-semibold">Active Month</div>
          <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
            {selectedMonthCode} 2026
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search chemist or address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredRetailers.length} Chemists
        </span>
      </div>

      {/* Retailers Directory Table */}
      <div className="overflow-x-auto max-h-[520px] border border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
            <tr>
              <th className="p-2.5 text-center w-12">#</th>
              <th className="p-2.5 min-w-[220px]">Retailer / Chemist Name</th>
              <th className="p-2.5 min-w-[140px] text-cyan-300">Address / Location</th>
              <th className="p-2.5 min-w-[220px] text-amber-400">Linked Doctor (MSL)</th>
              <th className="p-2.5 text-center w-24 text-blue-300">Total Qty</th>
              <th className="p-2.5 text-right min-w-[120px] text-emerald-400">Total Amount (₹)</th>
              <th className="p-2.5 text-center w-16">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredRetailers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                  No retailer records for {selectedMonthCode}. Upload a Dwarika PDF statement above to populate data!
                </td>
              </tr>
            ) : (
              filteredRetailers.map((r, idx) => {
                const linkedDoc = partywiseAggregatorStore.getLinkedDoctor(r.key);

                return (
                  <tr key={r.key} className="hover:bg-slate-800/40 transition">
                    <td className="p-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                    <td className="p-2 font-bold text-white">{r.retailerName}</td>
                    <td className="p-2 font-mono text-cyan-300">{r.address}</td>
                    
                    <td className="p-1">
                      <select
                        value={linkedDoc}
                        onChange={e => handleLinkDoctor(r.key, e.target.value)}
                        className="w-full bg-slate-950 text-amber-300 font-bold text-xs rounded-lg px-2 py-1 border border-slate-800 focus:border-amber-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Select MSL Doctor --</option>
                        {allMslDoctors.map(doc => (
                          <option key={doc.srNo} value={doc.doctorName} className="bg-slate-900 text-white">
                            {doc.doctorName} ({doc.speciality || '-'})
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-2 text-center font-mono font-bold text-blue-300">{r.totalQty.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono font-bold text-emerald-400">₹{r.totalAmount.toLocaleString()}</td>
                    
                    <td className="p-2 text-center">
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
        </table>
      </div>

      {/* 360-Degree Retailer Detail Modal */}
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
                    <th className="p-2.5 text-right w-28 text-emerald-400">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {Object.entries(selectedRetailer.items).map(([snStr, it], idx) => (
                    <tr key={snStr} className="hover:bg-slate-800/40">
                      <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2 font-sans font-semibold text-white">{itemDesc(Number(snStr))}</td>
                      <td className="p-2 text-center font-bold text-cyan-300">{it.salesQty}</td>
                      <td className="p-2 text-center font-bold text-amber-300">{it.freeQty > 0 ? it.freeQty : '-'}</td>
                      <td className="p-2 text-right font-bold text-emerald-300">₹{it.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono">Total Business: <b className="text-emerald-400">₹{selectedRetailer.totalAmount.toLocaleString()}</b></span>
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
print("✅ 2. PartywiseAggregatorVault.tsx updated.")

# 3. Build Vite bundle
print("\n📦 [2/3] Compiling Vite Frontend (npm run build)...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful.")

# 4. Deploy to Cloudflare Pages
print("\n☁️ [3/3] Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Universal Dual-Invariant Engine & Direct CSV Exporter Deployed!")
