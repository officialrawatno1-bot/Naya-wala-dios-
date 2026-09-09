import os, sys

print("==========================================================================")
print("🚀 [UNIVERSAL EXPENSE PARSER & WORKSPACE] GENERATING PRODUCTION CODE...")
print("==========================================================================")

# 1. Create src/parsers/expenseParser.ts
expense_parser_code = """import * as XLSX from 'xlsx';

export interface ExpenseDayRow {
  srNo: number | string;
  date: string;
  actualStation: string;
  workingType: string;
  workingRoute: string;
  daType: string;
  workWith: string;
  drCall: number | string;
  chemCall: number | string;
  stkCall: number | string;
  routeKm: number | string;
  payableKm: number | string;
  rate: number | string;
  fareTa: number | string;
  daAmt: number | string;
  otherExpense: number | string;
  total: number | string;
  remark: string;
  attachment: string;
}

export interface CboExpenseParsedData {
  monthCode: string; // e.g. "Aug-2026", "Jul-2026"
  header: {
    name: string;
    division: string;
    hq: string;
    designation: string;
    code: string;
    state: string;
    approvalStatus: string;
    monthDateStr: string;
  };
  rows: ExpenseDayRow[];
  allowanceSummary: Array<{ srNo: string; head: string; days: string; amount: string }>;
  miscSummary: Array<{ srNo: string; head: string; type: string; amount: string }>;
  performanceMetrics?: {
    totalDr: string;
    missDrs: string;
    workingDays: string;
    drCallAvg: string;
    drCoverage: string;
    totalDrCalls: string;
    chemCall: string;
    chemCallAvg: string;
    primaryAmt: string;
  };
  netClaimed: number;
}

const MONTH_NUM_MAP: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
};

export async function parseCboExpenseFile(file: File): Promise<CboExpenseParsedData> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const result: CboExpenseParsedData = {
    monthCode: 'Aug-2026',
    header: {
      name: 'BANWARI LAL MEENA',
      division: 'DIOS GROUP',
      hq: 'UDAIPUR',
      designation: 'BUSINESS EXECUTIVE',
      code: 'RJ/SL/0042',
      state: 'RAJASTHAN',
      approvalStatus: 'Pending',
      monthDateStr: '01/08/2026'
    },
    rows: [],
    allowanceSummary: [],
    miscSummary: [],
    netClaimed: 0
  };

  let section: 'HEADER' | 'DAILY' | 'ALLOWANCE' | 'MISC' | 'PERF' = 'HEADER';

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r] || [];
    const lineText = row.map((c: any) => String(c || '').trim()).join(' | ');

    // 1. Parse Header Fields & Detect Month
    if (section === 'HEADER') {
      row.forEach((cell: any) => {
        const str = String(cell || '').trim();
        if (str.startsWith('Name:')) result.header.name = str.replace('Name:', '').trim();
        if (str.startsWith('Division:')) result.header.division = str.replace('Division:', '').trim();
        if (str.startsWith('Head Qtr:')) result.header.hq = str.replace('Head Qtr:', '').trim();
        if (str.startsWith('Designation:')) result.header.designation = str.replace('Designation:', '').trim();
        if (str.startsWith('Code:')) result.header.code = str.replace('Code:', '').trim();
        if (str.startsWith('State Name:')) result.header.state = str.replace('State Name:', '').trim();
        if (str.startsWith('Approval Status:')) result.header.approvalStatus = str.replace('Approval Status:', '').trim();

        if (str.startsWith('Month:')) {
          const mPart = str.replace('Month:', '').trim();
          result.header.monthDateStr = mPart;
          const match = mPart.match(/\\d{2}\\/(\\d{2})\\/(\\d{4})/);
          if (match) {
            const mNum = match[1];
            const mYear = match[2];
            const mName = MONTH_NUM_MAP[mNum] || 'Aug';
            result.monthCode = `${mName}-${mYear}`;
          }
        }
      });

      if (row[0] === 'SrNo' && row[1] === 'Date' && row[2] === 'Actual Station') {
        section = 'DAILY';
        continue;
      }
    }

    // 2. Parse 19-Column Day-Wise Rows
    if (section === 'DAILY') {
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();

      // End of Daily section (Reached Total Row or next table)
      if (col1.toLowerCase() === 'total' || col0.toLowerCase() === 'total' || col1 === 'Head') {
        if (col1 === 'Head') section = 'ALLOWANCE';
        continue;
      }

      if (col0 === 'SrNo' && col1 === 'Head') {
        section = 'ALLOWANCE';
        continue;
      }

      if (/^[0-9]+$/.test(col0) && col1.includes('/')) {
        const parseNum = (v: any) => {
          if (!v) return 0;
          const n = parseFloat(String(v).replace(/,/g, '').trim());
          return isNaN(n) ? 0 : n;
        };

        const km = parseNum(row[11] || row[10]);
        const rate = parseNum(row[12]) || 2.50;
        const fare = parseNum(row[13]) || (km > 0 ? Number((km * rate).toFixed(2)) : 0);
        const da = parseNum(row[14]);
        const other = parseNum(row[15]);
        const tot = parseNum(row[16]) || (fare + da + other);

        result.rows.push({
          srNo: col0,
          date: col1,
          actualStation: String(row[2] || '').trim(),
          workingType: String(row[3] || '').trim(),
          workingRoute: String(row[4] || '').trim(),
          daType: String(row[5] || '').trim(),
          workWith: String(row[6] || '').trim(),
          drCall: parseNum(row[7]),
          chemCall: parseNum(row[8]),
          stkCall: parseNum(row[9]),
          routeKm: parseNum(row[10]),
          payableKm: km,
          rate: rate.toFixed(2),
          fareTa: fare,
          daAmt: da,
          otherExpense: other,
          total: tot,
          remark: String(row[17] || '').trim(),
          attachment: String(row[18] || '').trim()
        });
      }
      continue;
    }

    // 3. Parse Allowance Summary Box
    if (section === 'ALLOWANCE') {
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();

      if (col1 === 'MISC EXP.' || (row[1] && String(row[1]).includes('MISC'))) {
        section = 'MISC';
      } else if (col1 === 'Total Dr.' || (row[1] && String(row[1]).includes('Total Dr'))) {
        section = 'PERF';
      } else if (col0 && col1 && col0 !== 'SrNo') {
        result.allowanceSummary.push({
          srNo: col0,
          head: col1,
          days: String(row[2] || '').trim(),
          amount: String(row[3] || '').trim()
        });
      }
    }

    // 4. Parse Misc Expense Box
    if (section === 'MISC') {
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();

      if (col1 === 'Total Dr.' || (row[1] && String(row[1]).includes('Total Dr'))) {
        section = 'PERF';
      } else if (col0 && col1 && col0 !== 'SrNo') {
        result.miscSummary.push({
          srNo: col0,
          head: col1,
          type: String(row[2] || '').trim(),
          amount: String(row[3] || '').trim()
        });
      }
    }

    // 5. Parse Performance Summary & Net Claim
    if (section === 'PERF') {
      const col0 = String(row[0] || '').trim();
      if (/^[0-9]+$/.test(col0) && row[1]) {
        result.performanceMetrics = {
          totalDr: String(row[1] || '').trim(),
          missDrs: String(row[2] || '').trim(),
          workingDays: String(row[3] || '').trim(),
          drCallAvg: String(row[4] || '').trim(),
          drCoverage: String(row[5] || '').trim(),
          totalDrCalls: String(row[6] || '').trim(),
          chemCall: String(row[7] || '').trim(),
          chemCallAvg: String(row[8] || '').trim(),
          primaryAmt: String(row[10] || '').trim()
        };
      }
    }

    // Net Expense Claimed line
    if (lineText.includes('Net Expense Claimed:')) {
      const match = lineText.match(/Net Expense Claimed:\\s*([0-9.]+)/i);
      if (match) result.netClaimed = parseFloat(match[1]) || 0;
    }
  }

  // If netClaimed wasn't in text, calculate from rows + misc
  if (!result.netClaimed && result.rows.length > 0) {
    const sumRows = result.rows.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
    result.netClaimed = sumRows;
  }

  return result;
}
"""

with open('src/parsers/expenseParser.ts', 'w', encoding='utf-8') as f:
    f.write(expense_parser_code)
print("✅ src/parsers/expenseParser.ts created.")

# 2. Create modern interactive ExpenseWorkspace.tsx
workspace_code = """import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Wallet, Calendar, Bot, Loader2, Download, 
  CheckCircle2, AlertTriangle, RefreshCw, UploadCloud, Layers, 
  DollarSign, Car, Building2, User, FileSpreadsheet, Check, 
  Sparkles, Plus, Trash2, Edit3, Award, FileText, Info
} from 'lucide-react';
import { CloudSyncBar } from './CloudSyncBar';
import { parseCboExpenseFile, ExpenseDayRow, CboExpenseParsedData } from '../parsers/expenseParser';

interface Props {
  onBack: () => void;
}

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

export const ExpenseWorkspace: React.FC<Props> = ({ onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState('Aug-2026');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [headerInfo, setHeaderInfo] = useState({
    name: 'BANWARI LAL MEENA',
    code: 'RJ/SL/0042',
    hq: 'UDAIPUR',
    division: 'DIOS GROUP',
    state: 'RAJASTHAN',
    designation: 'BUSINESS EXECUTIVE',
    approvalStatus: 'Pending',
    monthDateStr: '01/08/2026 12:00:00 AM'
  });

  const [rows, setRows] = useState<ExpenseDayRow[]>(() => {
    try {
      const saved = localStorage.getItem(`dios_expense_statement_${selectedMonth}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rows && Array.isArray(parsed.rows)) return parsed.rows;
      }
    } catch (e) {}
    return [];
  });

  const [allowanceSummary, setAllowanceSummary] = useState<Array<{ srNo: string; head: string; days: string; amount: string }>>([]);
  const [miscSummary, setMiscSummary] = useState<Array<{ srNo: string; head: string; type: string; amount: string }>>([
    { srNo: '1', head: 'MISC EXP.', type: 'Daily', amount: '270.00' }
  ]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  const persistData = (
    newRows: ExpenseDayRow[],
    newHeader = headerInfo,
    newAllow = allowanceSummary,
    newMisc = miscSummary,
    newPerf = performanceMetrics
  ) => {
    setRows(newRows);
    setHeaderInfo(newHeader);
    setAllowanceSummary(newAllow);
    setMiscSummary(newMisc);
    setPerformanceMetrics(newPerf);

    try {
      localStorage.setItem(`dios_expense_statement_${selectedMonth}`, JSON.stringify({
        month: selectedMonth,
        header: newHeader,
        rows: newRows,
        allowanceSummary: newAllow,
        miscSummary: newMisc,
        performanceMetrics: newPerf
      }));
    } catch (e) {}
  };

  const handleCellChange = (index: number, field: keyof ExpenseDayRow, val: any) => {
    const copy = [...rows];
    copy[index] = { ...copy[index], [field]: val };

    if (field === 'payableKm' || field === 'rate') {
      const km = parseFloat(String(copy[index].payableKm || 0)) || 0;
      const rate = parseFloat(String(copy[index].rate || 2.50)) || 2.50;
      copy[index].fareTa = Number((km * rate).toFixed(2));
    }

    if (field === 'daType') {
      const t = String(val).toUpperCase().trim();
      if (t === 'EX') copy[index].daAmt = 285;
      else if (t === 'L') copy[index].daAmt = 260;
      else if (t === 'OS') copy[index].daAmt = 400;
      else if (t === 'NS') copy[index].daAmt = 0;
      else copy[index].daAmt = 0;
    }

    // Auto-calculate daily total: Fare + DA + Other Exp
    const fare = parseFloat(String(copy[index].fareTa || 0)) || 0;
    const da = parseFloat(String(copy[index].daAmt || 0)) || 0;
    const other = parseFloat(String(copy[index].otherExpense || 0)) || 0;
    copy[index].total = Number((fare + da + other).toFixed(2));

    persistData(copy);
  };

  // Live Auto-Calculations
  const totals = useMemo(() => {
    let totKm = 0;
    let totTa = 0;
    let totDa = 0;
    let totOther = 0;
    let totClaim = 0;
    let totDrs = 0;
    let totChem = 0;
    let totStk = 0;
    let localDays = 0;
    let localAmt = 0;
    let exDays = 0;
    let exAmt = 0;
    let osDays = 0;
    let osAmt = 0;

    rows.forEach(r => {
      const km = parseFloat(String(r.payableKm || r.routeKm || 0)) || 0;
      const ta = parseFloat(String(r.fareTa || 0)) || 0;
      const da = parseFloat(String(r.daAmt || 0)) || 0;
      const other = parseFloat(String(r.otherExpense || 0)) || 0;
      const tot = parseFloat(String(r.total || (ta + da + other))) || 0;

      const dr = parseInt(String(r.drCall || 0)) || 0;
      const chem = parseInt(String(r.chemCall || 0)) || 0;
      const stk = parseInt(String(r.stkCall || 0)) || 0;
      const daType = String(r.daType || '').toUpperCase().trim();

      totKm += km;
      totTa += ta;
      totDa += da;
      totOther += other;
      totClaim += tot;
      totDrs += dr;
      totChem += chem;
      totStk += stk;

      if (daType === 'L') { localDays++; localAmt += da; }
      else if (daType === 'EX') { exDays++; exAmt += da; }
      else if (daType === 'OS') { osDays++; osAmt += da; }
    });

    return {
      totKm, totTa, totDa, totOther, totClaim,
      totDrs, totChem, totStk,
      localDays, localAmt, exDays, exAmt, osDays, osAmt
    };
  }, [rows]);

  // Universal File Importer
  const handleFileUpload = async (file: File) => {
    setIsImporting(true);
    setErrorMsg(null);
    setStatusMsg(`Parsing CBO file '${file.name}'...`);

    try {
      const parsed: CboExpenseParsedData = await parseCboExpenseFile(file);

      if (parsed.monthCode) {
        setSelectedMonth(parsed.monthCode);
      }

      persistData(
        parsed.rows,
        parsed.header,
        parsed.allowanceSummary.length > 0 ? parsed.allowanceSummary : allowanceSummary,
        parsed.miscSummary.length > 0 ? parsed.miscSummary : miscSummary,
        parsed.performanceMetrics || performanceMetrics
      );

      setStatusMsg(`🎉 SUCCESS! '${file.name}' uploaded: ${parsed.monthCode} (${parsed.rows.length} Days) loaded instantly!`);
    } catch (err: any) {
      setErrorMsg(`Import Error: ${err.message || String(err)}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Month Switch Handler
  const handleMonthSelect = (newMonth: string) => {
    setSelectedMonth(newMonth);
    try {
      const saved = localStorage.getItem(`dios_expense_statement_${newMonth}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rows) setRows(parsed.rows);
        if (parsed.header) setHeaderInfo(parsed.header);
        if (parsed.allowanceSummary) setAllowanceSummary(parsed.allowanceSummary);
        if (parsed.miscSummary) setMiscSummary(parsed.miscSummary);
        if (parsed.performanceMetrics) setPerformanceMetrics(parsed.performanceMetrics);
        return;
      }
    } catch (e) {}
    setRows([]);
    setPerformanceMetrics(null);
  };

  // Export CSV matching exact 5-block CBO layout
  const handleExportCSV = () => {
    let csv = `DIOS LIFESCIENCES PVT LTD,,,,,,,,,,,,,,,,,,\n`;
    csv += `Expense Statement,,,,,,,,,,,,,,,,,,\n`;
    csv += `Name: ${headerInfo.name},,,Division: ${headerInfo.division},,Head Qtr: ${headerInfo.hq},,Designation: ${headerInfo.designation},,,,,,,,,,,` + '\n';
    csv += `Code: ${headerInfo.code},,,State Name: ${headerInfo.state},,Approval Status: ${headerInfo.approvalStatus},,Month: ${headerInfo.monthDateStr},,,,,,,,,,,` + '\n';
    csv += `SrNo,Date,Actual Station,Working Type,Working Route,DA Type,Work With,Dr Call,Chem Call,Stk Call,Route KM,Payable KM,Rate,FARE(TA),HQ/Ex/Out Station,Other Expense,Total,Remark,Attachment\n`;

    rows.forEach(r => {
      const q = (v: any) => `"${String(v !== undefined && v !== null ? v : '').replace(/"/g, '""')}"`;
      csv += `${r.srNo},${r.date},${q(r.actualStation)},${q(r.workingType)},${q(r.workingRoute)},${q(r.daType)},${q(r.workWith)},${r.drCall || ''},${r.chemCall || ''},${r.stkCall || ''},${r.routeKm || ''},${r.payableKm || ''},${r.rate || ''},${r.fareTa || ''},${r.daAmt || ''},${r.otherExpense || ''},${r.total || ''},${q(r.remark || '')},${r.attachment || ''}\n`;
    });

    csv += `, Total, , , , , , ${totals.totDrs}, ${totals.totChem}, ${totals.totStk}," ${totals.totKm.toLocaleString()}"," ${totals.totKm.toLocaleString()}", ," ${totals.totTa.toLocaleString()}"," ${totals.totDa.toLocaleString()}", ${totals.totOther.toFixed(2)}," ${totals.totClaim.toLocaleString()}", , \n`;

    csv += `SrNo,Head,Days,Amount,,,,,,,,,,,,,,,\n`;
    csv += `1,Local,${totals.localDays},"${totals.localAmt.toLocaleString()}",,,,,,,,,,,,,,,\n`;
    csv += `2,Ex-Station,${totals.exDays},"${totals.exAmt.toLocaleString()}",,,,,,,,,,,,,,,\n`;
    csv += `3,Out Station,${totals.osDays},"${totals.osAmt.toLocaleString()}",,,,,,,,,,,,,,,\n`;
    csv += `4,Total DA Amount,${totals.localDays + totals.exDays + totals.osDays},"${totals.totDa.toLocaleString()}",,,,,,,,,,,,,,,\n`;
    csv += `5,Fare Amount,${totals.totKm} km,"${totals.totTa.toLocaleString()}",,,,,,,,,,,,,,,\n`;
    csv += `, Total (DA+Fare), ," ${(totals.totDa + totals.totTa).toLocaleString()}",,,,,,,,,,,,,,,\n`;

    csv += `SrNo,Head,Type,Amount,,,,,,,,,,,,,,,\n`;
    miscSummary.forEach(m => {
      csv += `${m.srNo},${m.head},${m.type},${m.amount},,,,,,,,,,,,,,,\n`;
    });

    if (performanceMetrics) {
      csv += `SrNo,Total Dr.,Miss Drs,Working Days,Dr. Call Avg,Dr. Coverage,Total Dr Calls,Chem Call,Chem Call Avg,Ach%,Primary Amt,Secondary Amt,,,,,,,\n`;
      csv += `1,${performanceMetrics.totalDr},${performanceMetrics.missDrs},${performanceMetrics.workingDays},${performanceMetrics.drCallAvg},${performanceMetrics.drCoverage},${performanceMetrics.totalDrCalls},${performanceMetrics.chemCall},${performanceMetrics.chemCallAvg},,"${performanceMetrics.primaryAmt}",,,,,,,,\n`;
    }

    csv += `\nNet Expense Claimed: ${totals.totClaim.toFixed(0)},,,,,,,,,,,,,,,,,,\n`;

    const blob = new Blob(['\\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Expense_Statement_${selectedMonth}_Official.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-7xl mx-auto space-y-5">
      
      {/* 1. TOP NAVBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft size={16} /> Back to Earn Hub
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50">
            <Sparkles size={13} className="text-emerald-400 animate-pulse" /> UNIVERSAL 19-COL CBO EXPENSE PARSER
          </span>
        </div>
      </div>

      {/* 2. TITLE & ACTION TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <Wallet size={24} />
            </span>
            Monthly Expense Statement
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            BE: {headerInfo.name} ({headerInfo.code}) • HQ: {headerInfo.hq} • TA (Fare), DA (Daily Allowance) &amp; Claim Calculation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
            <Calendar size={14} className="text-amber-400" />
            <select
              value={selectedMonth}
              onChange={e => handleMonthSelect(e.target.value)}
              className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
            >
              {MONTH_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 📥 UNIVERSAL IMPORT BUTTON */}
          <label className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-950 transition cursor-pointer">
            <UploadCloud size={16} className={isImporting ? "animate-bounce" : ""} />
            <span>📥 Import CBO Expense (.csv / .xls)</span>
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              disabled={isImporting}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </label>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <Download size={15} /> Export Official CSV
          </button>
        </div>
      </div>

      {/* ☁️ CLOUDFLARE KV SYNC BAR */}
      <CloudSyncBar
        storageKey={`expenses/statement_${selectedMonth}`}
        sheetTitle={`Expense Statement (${selectedMonth})`}
        getData={() => ({
          month: selectedMonth,
          header: headerInfo,
          rows: rows,
          allowanceSummary: allowanceSummary,
          miscSummary: miscSummary,
          performanceMetrics: performanceMetrics
        })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.header) setHeaderInfo(cloudData.header);
          if (cloudData.rows && Array.isArray(cloudData.rows)) setRows(cloudData.rows);
          if (cloudData.allowanceSummary) setAllowanceSummary(cloudData.allowanceSummary);
          if (cloudData.miscSummary) setMiscSummary(cloudData.miscSummary);
          if (cloudData.performanceMetrics) setPerformanceMetrics(cloudData.performanceMetrics);
        }}
        onSaveLocal={() => {
          persistData(rows);
        }}
      />

      {statusMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-2xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="p-1 hover:text-white">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-950/80 border border-rose-500/50 text-rose-300 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. EXECUTIVE STAT SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Route Distance (TA)</div>
          <div className="text-xl font-black text-cyan-300 font-mono mt-1">
            {totals.totKm.toLocaleString()} <span className="text-xs font-normal text-slate-400">KM</span>
          </div>
          <div className="text-xs text-cyan-400 font-mono mt-0.5">Fare: ₹{totals.totTa.toLocaleString()} (@ ₹2.50/KM)</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-amber-400 uppercase font-semibold">Daily Allowances (DA)</div>
          <div className="text-xl font-black text-amber-300 font-mono mt-1">
            ₹{totals.totDa.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">{totals.localDays} Local • {totals.exDays} Ex-Station</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-purple-400 uppercase font-semibold">Doctor &amp; Chemist Calls</div>
          <div className="text-xl font-black text-purple-300 font-mono mt-1">
            {totals.totDrs} <span className="text-xs font-normal text-slate-400">Dr</span> • {totals.totChem} <span className="text-xs font-normal text-slate-400">Chem</span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">{rows.length} Days Field Record</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-950/90 to-slate-950 p-4 rounded-2xl border-2 border-emerald-500/50 shadow-xl flex flex-col justify-between">
          <div className="text-[10px] text-emerald-300 uppercase font-black tracking-wide flex items-center justify-between">
            <span>TOTAL MONTHLY CLAIM</span>
            <Sparkles size={14} className="text-yellow-300 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono mt-1">
            ₹{totals.totClaim.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 4. PERFORMANCE ANALYTICAL METRICS BOX (FROM CBO CSV BLOCK 5) */}
      {performanceMetrics && (
        <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-purple-500/40 shadow-inner flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-500/20 text-purple-300 rounded-lg"><Award size={16} /></span>
            <div>
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">CBO Performance Analytics:</span>
              <div className="text-[10px] text-slate-400">Master List: {performanceMetrics.totalDr} Drs • Field Days: {performanceMetrics.workingDays}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <div>Dr. Call Avg: <b className="text-cyan-400 font-bold">{performanceMetrics.drCallAvg}</b></div>
            <div>Coverage: <b className="text-emerald-400 font-bold">{performanceMetrics.drCoverage}%</b></div>
            <div>Primary Sale: <b className="text-yellow-300 font-bold">₹{performanceMetrics.primaryAmt}</b></div>
          </div>
        </div>
      )}

      {/* 5. 19-COLUMN DAY-WISE EXPENSE TABLE */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Car size={16} /> 19-Column Day-Wise Field Work Expense Statement ({selectedMonth})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {rows.length} Days Recorded
          </span>
        </div>

        <div className="overflow-x-auto max-h-[520px] border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
              <tr>
                <th className="p-2.5 text-center w-10">#</th>
                <th className="p-2.5 min-w-[95px]">Date</th>
                <th className="p-2.5 min-w-[130px]">Actual Station</th>
                <th className="p-2.5 min-w-[110px]">Work Type</th>
                <th className="p-2.5 min-w-[130px]">Working Route</th>
                <th className="p-2.5 text-center w-16 text-amber-400">DA Type</th>
                <th className="p-2.5 min-w-[120px]">Work With</th>
                <th className="p-2.5 text-center w-14 text-purple-300">Dr Call</th>
                <th className="p-2.5 text-center w-14 text-purple-300">Chem</th>
                <th className="p-2.5 text-center w-14 text-purple-300">Stk</th>
                <th className="p-2.5 text-center w-16">Route KM</th>
                <th className="p-2.5 text-center w-16">Payable KM</th>
                <th className="p-2.5 text-center w-12">Rate</th>
                <th className="p-2.5 text-right w-20 text-cyan-300">FARE(TA)</th>
                <th className="p-2.5 text-right w-20 text-amber-300">DA Amt</th>
                <th className="p-2.5 text-right w-20 text-yellow-300">Other Exp</th>
                <th className="p-2.5 text-right w-24 text-emerald-300 font-black">Total (₹)</th>
                <th className="p-2.5 min-w-[140px]">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={18} className="p-8 text-center text-slate-500">
                    No expense data loaded. Click <b>"📥 Import CBO Expense (.csv / .xls)"</b> above to upload your CBO statement.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const isSunday = row.actualStation === 'Sunday' || row.workingRoute === 'Sunday';
                  const isLeave = String(row.workingType).includes('Leave') || row.actualStation === 'Absent';
                  const isHoliday = String(row.workingType).includes('Holiday') || row.actualStation === 'Holiday';

                  return (
                    <tr key={idx} className={`transition ${
                      isSunday ? 'bg-rose-950/20' : isLeave ? 'bg-amber-950/15' : isHoliday ? 'bg-purple-950/20' : 'hover:bg-slate-800/40'
                    }`}>
                      <td className="p-2 text-center text-slate-500 font-mono">{row.srNo}</td>
                      <td className="p-2 text-cyan-300">{row.date}</td>
                      
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.actualStation}
                          onChange={e => handleCellChange(idx, 'actualStation', e.target.value)}
                          className="w-full py-1 px-1.5 bg-transparent font-sans font-semibold text-white rounded focus:bg-slate-950"
                        />
                      </td>

                      <td className="p-1">
                        <input
                          type="text"
                          value={row.workingType}
                          onChange={e => handleCellChange(idx, 'workingType', e.target.value)}
                          className="w-full py-1 px-1.5 bg-transparent font-sans text-slate-300 rounded focus:bg-slate-950"
                        />
                      </td>

                      <td className="p-1">
                        <input
                          type="text"
                          value={row.workingRoute}
                          onChange={e => handleCellChange(idx, 'workingRoute', e.target.value)}
                          className="w-full py-1 px-1.5 bg-transparent font-sans text-slate-300 rounded focus:bg-slate-950"
                        />
                      </td>

                      <td className="p-1 text-center">
                        <select
                          value={row.daType || '-'}
                          onChange={e => handleCellChange(idx, 'daType', e.target.value)}
                          className="bg-slate-950 text-amber-300 font-bold rounded px-1.5 py-1 text-center border border-slate-800 focus:outline-none"
                        >
                          <option value="L">L (Local)</option>
                          <option value="EX">EX (Ex-Stn)</option>
                          <option value="OS">OS (Out-Stn)</option>
                          <option value="NS">NS (Night)</option>
                          <option value="-">-</option>
                        </select>
                      </td>

                      <td className="p-1">
                        <input
                          type="text"
                          value={row.workWith}
                          onChange={e => handleCellChange(idx, 'workWith', e.target.value)}
                          placeholder="-"
                          className="w-full py-1 px-1.5 bg-transparent font-sans text-slate-400 rounded focus:bg-slate-950 text-[11px]"
                        />
                      </td>

                      <td className="p-1 text-center font-bold text-purple-300">
                        <input
                          type="text"
                          value={row.drCall}
                          onChange={e => handleCellChange(idx, 'drCall', e.target.value)}
                          className="w-10 py-1 text-center bg-transparent rounded focus:bg-slate-950"
                        />
                      </td>

                      <td className="p-1 text-center text-slate-400">
                        <input
                          type="text"
                          value={row.chemCall || ''}
                          onChange={e => handleCellChange(idx, 'chemCall', e.target.value)}
                          placeholder="-"
                          className="w-8 py-1 text-center bg-transparent rounded focus:bg-slate-950"
                        />
                      </td>

                      <td className="p-1 text-center text-slate-400">
                        <input
                          type="text"
                          value={row.stkCall || ''}
                          onChange={e => handleCellChange(idx, 'stkCall', e.target.value)}
                          placeholder="-"
                          className="w-8 py-1 text-center bg-transparent rounded focus:bg-slate-950"
                        />
                      </td>

                      <td className="p-1 text-center text-slate-400">
                        <input
                          type="text"
                          value={row.routeKm || ''}
                          onChange={e => handleCellChange(idx, 'routeKm', e.target.value)}
                          className="w-12 py-1 text-center bg-transparent rounded focus:bg-slate-950"
                        />
                      </td>

                      <td className="p-1 text-center">
                        <input
                          type="text"
                          value={row.payableKm}
                          onChange={e => handleCellChange(idx, 'payableKm', e.target.value)}
                          className="w-12 py-1 text-center bg-transparent text-slate-200 rounded focus:bg-slate-950 font-bold"
                        />
                      </td>

                      <td className="p-2 text-center text-slate-400 text-[11px]">{row.rate}</td>

                      <td className="p-2 text-right font-bold text-cyan-300">
                        {Number(row.fareTa) > 0 ? `₹${Number(row.fareTa).toFixed(2)}` : '-'}
                      </td>

                      <td className="p-2 text-right font-bold text-amber-300">
                        {Number(row.daAmt) > 0 ? `₹${Number(row.daAmt).toFixed(2)}` : '-'}
                      </td>

                      <td className="p-1 text-right">
                        <input
                          type="text"
                          value={row.otherExpense || ''}
                          onChange={e => handleCellChange(idx, 'otherExpense', e.target.value)}
                          placeholder="-"
                          className="w-14 py-1 text-right bg-transparent text-yellow-300 font-bold rounded focus:bg-slate-950"
                        />
                      </td>

                      <td className="p-2 text-right font-black text-emerald-300 bg-emerald-950/20">
                        {Number(row.total) > 0 ? `₹${Number(row.total).toFixed(2)}` : '-'}
                      </td>

                      <td className="p-1">
                        <input
                          type="text"
                          value={row.remark || ''}
                          onChange={e => handleCellChange(idx, 'remark', e.target.value)}
                          placeholder="-"
                          className="w-full py-1 px-1.5 bg-transparent font-sans text-slate-400 text-[11px] rounded focus:bg-slate-950"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-slate-700 font-bold z-10 text-xs">
              <tr>
                <td className="p-2.5 text-center text-cyan-400 font-mono">Σ</td>
                <td className="p-2.5 text-white" colSpan={5}>TOTAL ({selectedMonth})</td>
                <td className="p-2.5 text-slate-400 font-mono">-</td>
                <td className="p-2.5 text-center font-bold text-purple-300 font-mono">{totals.totDrs}</td>
                <td className="p-2.5 text-center font-bold text-purple-300 font-mono">{totals.totChem}</td>
                <td className="p-2.5 text-center font-bold text-purple-300 font-mono">{totals.totStk}</td>
                <td className="p-2.5 text-center font-bold text-slate-400 font-mono">{totals.totKm}</td>
                <td className="p-2.5 text-center font-bold text-slate-200 font-mono">{totals.totKm}</td>
                <td className="p-2.5 text-center text-slate-500">-</td>
                <td className="p-2.5 text-right font-black text-cyan-300 font-mono">₹{totals.totTa.toLocaleString()}</td>
                <td className="p-2.5 text-right font-black text-amber-300 font-mono">₹{totals.totDa.toLocaleString()}</td>
                <td className="p-2.5 text-right font-black text-yellow-300 font-mono">₹{totals.totOther.toFixed(2)}</td>
                <td className="p-2.5 text-right font-black text-emerald-300 font-mono bg-emerald-950/60">₹{totals.totClaim.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 6. ALLOWANCE CALCULATION BOX & MISC EXPENSES (MATCHING CBO BLOCKS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Block 3: Allowances Box */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Building2 size={16} /> Daily Allowance &amp; Fare Summary
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <th className="p-2 text-center w-10">#</th>
                  <th className="p-2">Head</th>
                  <th className="p-2 text-center w-24">Days / Distance</th>
                  <th className="p-2 text-right w-28 text-amber-300">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                <tr>
                  <td className="p-2 text-center text-slate-500">1</td>
                  <td className="p-2 font-sans text-white">Local Allowance (@ ₹260)</td>
                  <td className="p-2 text-center font-bold text-slate-200">{totals.localDays} Days</td>
                  <td className="p-2 text-right font-bold text-amber-300">₹{totals.localAmt.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-2 text-center text-slate-500">2</td>
                  <td className="p-2 font-sans text-white">Ex-Station Allowance (@ ₹285)</td>
                  <td className="p-2 text-center font-bold text-slate-200">{totals.exDays} Days</td>
                  <td className="p-2 text-right font-bold text-amber-300">₹{totals.exAmt.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-2 text-center text-slate-500">3</td>
                  <td className="p-2 font-sans text-white">Out Station Allowance</td>
                  <td className="p-2 text-center font-bold text-slate-200">{totals.osDays} Days</td>
                  <td className="p-2 text-right font-bold text-amber-300">₹{totals.osAmt.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-2 text-center text-cyan-400 font-bold">4</td>
                  <td className="p-2 font-sans text-cyan-300 font-bold">Fare Amount (Travel Allowance)</td>
                  <td className="p-2 text-center font-bold text-cyan-300">{totals.totKm} KM</td>
                  <td className="p-2 text-right font-black text-cyan-300">₹{totals.totTa.toLocaleString()}</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-950 border-t border-slate-700 font-bold text-xs">
                <tr>
                  <td className="p-2 text-center text-amber-400 font-mono">Σ</td>
                  <td className="p-2 text-white">TOTAL (DA + FARE)</td>
                  <td className="p-2 text-center text-slate-300 font-mono">{totals.localDays + totals.exDays + totals.osDays} Days</td>
                  <td className="p-2 text-right font-black text-amber-300 font-mono">₹{(totals.totDa + totals.totTa).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Block 4: Misc Expenses & Final Net Claim */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <DollarSign size={16} /> Other Expenses &amp; Grand Claim
          </h3>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-sans text-slate-300">Total Travel Allowance (Fare TA):</span>
              <span className="font-bold text-cyan-300">₹{totals.totTa.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-sans text-slate-300">Total Daily Allowance (Total DA):</span>
              <span className="font-bold text-amber-300">₹{totals.totDa.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-sans text-slate-300">Other / Miscellaneous Expenses:</span>
              <span className="font-bold text-yellow-300">₹{totals.totOther.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-950/80 border-2 border-emerald-500/50 shadow-lg">
              <span className="font-sans font-bold text-white text-sm">💰 NET EXPENSE CLAIMED:</span>
              <span className="font-black text-emerald-300 text-lg">₹{totals.totClaim.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
"""

with open('src/components/ExpenseWorkspace.tsx', 'w', encoding='utf-8') as f:
    f.write(workspace_code)
print("✅ src/components/ExpenseWorkspace.tsx updated with 19-Col Table & Universal Importer.")

