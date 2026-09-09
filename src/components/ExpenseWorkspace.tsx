import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Wallet, Calendar, Download, 
  CheckCircle2, AlertTriangle, UploadCloud, 
  DollarSign, Car, Building2, Check, 
  Sparkles, Plus, Trash2, Calculator, X, Eye, EyeOff, FileText, Award,
  Search, Stethoscope
} from 'lucide-react';
import { CloudSyncBar } from './CloudSyncBar';
import { parseCboExpenseFile, ExpenseDayRow, CboExpenseParsedData } from '../parsers/expenseParser';
import { exportExpenseStatementToPdf } from '../exporters/expensePdfExporter';
import { MASTER_123_MSL_DOCTORS } from './review/MslSheet';
import { memoryStore, MslDoctor } from '../data/memoryStore';

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

export interface SmartExpenseItem {
  id: string;
  category: string;
  doctorName?: string;
  label: string;
  amount: number | '';
}

export const ExpenseWorkspace: React.FC<Props> = ({ onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState('Aug-2026');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  // 🌟 IN-APP PDF PREVIEW MODAL STATE
  const [pdfPreviewModal, setPdfPreviewModal] = useState<{ doc: any; blobUrl: string; fileName: string } | null>(null);

  // 🌟 OPTION: PRINT PERFORMANCE SUMMARY AS BLANK VALUES OR REAL VALUES
  const [blankPerfValues, setBlankPerfValues] = useState<boolean>(false);
  const [hideMiscValues, setHideMiscValues] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`dios_expense_hide_misc_${selectedMonth}`);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return false;
  });

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

  const [performanceMetrics, setPerformanceMetrics] = useState<any>(() => {
    try {
      const saved = localStorage.getItem(`dios_expense_statement_${selectedMonth}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.performanceMetrics) return parsed.performanceMetrics;
      }
    } catch (e) {}
    return {
      srNo: '1',
      totalDr: '130',
      missDrs: '46',
      workingDays: '18',
      drCallAvg: '8.72',
      drCoverage: '65',
      totalDrCalls: '157',
      chemCall: '7',
      chemCallAvg: '0.39',
      achPct: '',
      primaryAmt: '4,32,271',
      secondaryAmt: ''
    };
  });

  // 🌟 SMART OTHER EXPENSE MODAL STATE
  const [activeSmartRowIdx, setActiveSmartRowIdx] = useState<number | null>(null);
  const [smartItems, setSmartItems] = useState<SmartExpenseItem[]>([]);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [activeDoctorSearchCategory, setActiveDoctorSearchCategory] = useState<'DOB' | 'DOA' | 'FRUITS' | null>(null);
  // 🌟 MANUAL / CUSTOM CATEGORY STATE
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryAmount, setCustomCategoryAmount] = useState('');

  const allMslDoctors: MslDoctor[] = useMemo(() => {
    if (memoryStore.mslData && memoryStore.mslData.length > 0) return memoryStore.mslData;
    return MASTER_123_MSL_DOCTORS || [];
  }, []);

  const filteredMslDoctors = useMemo(() => {
    if (!doctorSearchQuery.trim()) return allMslDoctors.slice(0, 15);
    const q = doctorSearchQuery.toLowerCase();
    return allMslDoctors.filter(d => 
      d.doctorName.toLowerCase().includes(q) || (d.speciality || '').toLowerCase().includes(q) || String(d.srNo).includes(q)
    ).slice(0, 12);
  }, [allMslDoctors, doctorSearchQuery]);

  const persistData = (
    newRows: ExpenseDayRow[],
    newHeader = headerInfo,
    newAllow = allowanceSummary,
    newMisc = miscSummary,
    newPerf = performanceMetrics,
    newHideMisc = hideMiscValues
  ) => {
    setRows(newRows);
    setHeaderInfo(newHeader);
    setAllowanceSummary(newAllow);
    setMiscSummary(newMisc);
    setPerformanceMetrics(newPerf);
    setHideMiscValues(newHideMisc);

    try {
      localStorage.setItem(`dios_expense_statement_${selectedMonth}`, JSON.stringify({
        month: selectedMonth,
        header: newHeader,
        rows: newRows,
        allowanceSummary: newAllow,
        miscSummary: newMisc,
        performanceMetrics: newPerf
      }));
      localStorage.setItem(`dios_expense_hide_misc_${selectedMonth}`, JSON.stringify(newHideMisc));
    } catch (e) {}
  };

  const handleCellChange = (index: number, field: keyof ExpenseDayRow, val: any) => {
    const copy = [...rows];
    copy[index] = { ...copy[index], [field]: val };

    const station = String(copy[index].actualStation || '').toUpperCase();
    const route = String(copy[index].workingRoute || '').toUpperCase();

    // Banswara Rule: Always 372 KM
    if (station.includes('BANSWA') || route.includes('BANSWA')) {
      copy[index].routeKm = 372;
      copy[index].payableKm = 372;
    }

    if (field === 'payableKm' || field === 'rate' || field === 'actualStation' || field === 'workingRoute') {
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

    const fare = parseFloat(String(copy[index].fareTa || 0)) || 0;
    const da = parseFloat(String(copy[index].daAmt || 0)) || 0;
    const other = parseFloat(String(copy[index].otherExpense || 0)) || 0;
    copy[index].total = Number((fare + da + other).toFixed(2));

    persistData(copy);
  };

  // 🌟 FIX: LOAD EXISTING ITEMS FROM ROW INSTEAD OF EMPTYING!
  const handleOpenSmartExpense = (rowIdx: number) => {
    setActiveSmartRowIdx(rowIdx);
    const targetRow = rows[rowIdx];
    
    // Check if this row already has saved otherExpenseItems
    if (targetRow.otherExpenseItems && Array.isArray(targetRow.otherExpenseItems) && targetRow.otherExpenseItems.length > 0) {
      setSmartItems(JSON.parse(JSON.stringify(targetRow.otherExpenseItems)));
    } else if (Number(targetRow.otherExpense) > 0) {
      // If amount exists, prefill as an editable item
      const initialLabel = (targetRow.remark && targetRow.remark !== 'ok' && !targetRow.remark.includes('Approved By'))
        ? targetRow.remark
        : 'Other Expense';
      setSmartItems([
        {
          id: 'existing_' + Date.now(),
          category: 'Other',
          label: initialLabel,
          amount: Number(targetRow.otherExpense)
        }
      ]);
    } else {
      setSmartItems([]);
    }

    setActiveDoctorSearchCategory(null);
    setDoctorSearchQuery('');
  };

  // Add General category item (appends to existing list)
  const handleAddGeneralCategory = (catName: string) => {
    setSmartItems(prev => [
      ...prev,
      {
        id: 'item_' + Date.now() + Math.random().toString(36).substring(2, 6),
        category: catName,
        label: catName,
        amount: ''
      }
    ]);
  };

  const handleStartDoctorCategory = (cat: 'DOB' | 'DOA' | 'FRUITS') => {
    setActiveDoctorSearchCategory(cat);
    setDoctorSearchQuery('');
  };

  // Confirm doctor selection (appends to existing list)
  const handleSelectDoctorForCategory = (doc: MslDoctor) => {
    if (!activeDoctorSearchCategory) return;
    
    let title = '';
    if (activeDoctorSearchCategory === 'DOB') title = `DOB Bill (Dr. ${doc.doctorName})`;
    else if (activeDoctorSearchCategory === 'DOA') title = `DOA Bill (Dr. ${doc.doctorName})`;
    else if (activeDoctorSearchCategory === 'FRUITS') title = `Fruits (Dr. ${doc.doctorName})`;

    setSmartItems(prev => [
      ...prev,
      {
        id: 'doc_' + Date.now() + Math.random().toString(36).substring(2, 6),
        category: activeDoctorSearchCategory,
        doctorName: doc.doctorName,
        label: title,
        amount: ''
      }
    ]);

    setActiveDoctorSearchCategory(null);
    setDoctorSearchQuery('');
  };

  const handleUpdateSmartItemAmount = (id: string, amtVal: string) => {
    const num = amtVal === '' ? '' : (parseFloat(amtVal) || 0);
    setSmartItems(prev => prev.map(it => it.id === id ? { ...it, amount: num } : it));
  };

  const handleDeleteSmartItem = (id: string) => {
    setSmartItems(prev => prev.filter(it => it.id !== id));
  };

  // 🌟 FIX: PERSIST ITEMS IN ROW OBJECT & UPDATE REMARK INSTANTLY!
  // 🌟 MANUAL / CUSTOM CATEGORY ADD HANDLER
  const handleAddCustomCategory = () => {
    if (!customCategoryName.trim()) {
      alert("Kripya Category ka naam (e.g. Toll, Courier, Room) zaroor likhein!");
      return;
    }
    const amt = customCategoryAmount === '' ? '' : (parseFloat(customCategoryAmount) || '');
    setSmartItems(prev => [
      ...prev,
      {
        id: 'custom_' + Date.now() + Math.random().toString(36).substring(2, 6),
        category: 'Custom',
        label: customCategoryName.trim(),
        amount: amt
      }
    ]);
    setCustomCategoryName('');
    setCustomCategoryAmount('');
  };

  const handleApplySmartExpense = () => {
    if (activeSmartRowIdx === null) return;
    
    const copy = [...rows];
    const targetRow = { ...copy[activeSmartRowIdx] };

    // Calculate sum of all non-empty amounts
    const validItems = smartItems.filter(it => it.amount !== '' && Number(it.amount) > 0);
    const sumOther = validItems.reduce((acc, it) => acc + Number(it.amount), 0);
    
    targetRow.otherExpense = sumOther > 0 ? sumOther : 0;
    // 🌟 PERMANENTLY SAVE ITEMS INTO ROW
    targetRow.otherExpenseItems = JSON.parse(JSON.stringify(smartItems));

    // Generate formatted breakdown remark string: e.g. "Fruits (Dr. Mahesh Dave): 200, WCFYH Activity: 500"
    const breakdownText = validItems.map(it => `${it.label}: ${it.amount}`).join(', ');

    if (breakdownText) {
      targetRow.remark = breakdownText;
    } else if (sumOther === 0) {
      targetRow.remark = 'ok';
    }

    // Auto recalculate daily line total: Fare + DA + Other Exp
    const fare = parseFloat(String(targetRow.fareTa || 0)) || 0;
    const da = parseFloat(String(targetRow.daAmt || 0)) || 0;
    targetRow.total = Number((fare + da + (sumOther || 0)).toFixed(2));

    copy[activeSmartRowIdx] = targetRow;
    persistData(copy);
    setActiveSmartRowIdx(null);
    setStatusMsg(`🎉 Day #${targetRow.srNo} Other Expenses updated (Total: ₹${sumOther}). Remark synced!`);
    setTimeout(() => setStatusMsg(null), 3500);
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

    const activeMiscVal = hideMiscValues ? 0 : (parseFloat(String(miscSummary[0]?.amount || 270)) || 0);
    const finalClaim = totClaim + (hideMiscValues ? 0 : activeMiscVal);

    return {
      totKm, totTa, totDa, totOther, totClaim: finalClaim,
      totDrs, totChem, totStk,
      localDays, localAmt, exDays, exAmt, osDays, osAmt,
      activeMiscVal
    };
  }, [rows, miscSummary, hideMiscValues]);

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

      const hasMisc = parsed.miscSummary.length > 0 && parseFloat(parsed.miscSummary[0].amount) > 0;
      const autoHide = !hasMisc;

      persistData(
        parsed.rows,
        parsed.header,
        parsed.allowanceSummary.length > 0 ? parsed.allowanceSummary : allowanceSummary,
        parsed.miscSummary.length > 0 ? parsed.miscSummary : miscSummary,
        parsed.performanceMetrics || performanceMetrics,
        autoHide
      );

      setStatusMsg(`🎉 SUCCESS! '${file.name}' imported: ${parsed.monthCode} (${parsed.rows.length} Days) loaded!`);
    } catch (err: any) {
      setErrorMsg(`Import Error: ${err.message || String(err)}`);
    } finally {
      setIsImporting(false);
    }
  };

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
  };

  // 🌟 IN-APP PREVIEW & SAFE DOWNLOAD (SAFARI SAFE - NO REDIRECT TO HOME!)
  const handleExportPDF = () => {
    try {
      const res = exportExpenseStatementToPdf({
        selectedMonth,
        headerInfo,
        rows,
        totals,
        allowanceSummary,
        miscSummary,
        performanceMetrics,
        hideMiscValues,
        blankPerfValues
      });
      setPdfPreviewModal(res);
      setStatusMsg("🎉 In-App PDF Preview Ready! Check preview modal below.");
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (e: any) {
      alert("PDF Error: " + e.message);
    }
  };

  // Export CSV matching exact 5-block CBO layout
  const handleExportCSV = () => {
    const csvLines: string[] = [];
    csvLines.push('DIOS LIFESCIENCES PVT LTD,,,,,,,,,,,,,,,,,');
    csvLines.push('Expense Statement,,,,,,,,,,,,,,,,,');
    csvLines.push(`Name: ${headerInfo.name},,,Division: ${headerInfo.division},,Head Qtr: ${headerInfo.hq},,Designation: ${headerInfo.designation},,,,,,,,,,,`);
    csvLines.push(`Code: ${headerInfo.code},,,State Name: ${headerInfo.state},,Approval Status: ${headerInfo.approvalStatus},,Month: ${headerInfo.monthDateStr},,,,,,,,,,,`);
    csvLines.push('SrNo,Date,Actual Station,Working Type,Working Route,DA Type,Work With,Dr Call,Chem Call,Stk Call,Route KM,Payable KM,Rate,FARE(TA),HQ/Ex/Out Station,Other Expense,Total,Remark,Attachment');

    rows.forEach(r => {
      const q = (v: any) => `"${String(v !== undefined && v !== null ? v : '').replace(/"/g, '""')}"`;
      csvLines.push(`${r.srNo},${r.date},${q(r.actualStation)},${q(r.workingType)},${q(r.workingRoute)},${q(r.daType)},${q(r.workWith)},${r.drCall || ''},${r.chemCall || ''},${r.stkCall || ''},${r.routeKm || ''},${r.payableKm || ''},${r.rate || ''},${r.fareTa || ''},${r.daAmt || ''},${r.otherExpense || ''},${r.total || ''},${q(r.remark || '')},${r.attachment || ''}`);
    });

    csvLines.push(`, Total, , , , , , ${totals.totDrs}, ${totals.totChem}, ${totals.totStk}," ${totals.totKm.toLocaleString()}"," ${totals.totKm.toLocaleString()}", ," ${totals.totTa.toLocaleString()}"," ${totals.totDa.toLocaleString()}", ${totals.totOther.toFixed(2)}," ${totals.totClaim.toLocaleString()}", , `);

    csvLines.push('SrNo,Head,Days,Amount,,,,,,,,,,,,,,,');
    csvLines.push(`1,Local,${totals.localDays},"${totals.localAmt.toLocaleString()}",,,,,,,,,,,,,,,`);
    csvLines.push(`2,Ex-Station,${totals.exDays},"${totals.exAmt.toLocaleString()}",,,,,,,,,,,,,,,`);
    csvLines.push(`3,Out Station,${totals.osDays},"${totals.osAmt.toLocaleString()}",,,,,,,,,,,,,,,`);
    csvLines.push(`4,Total DA Amount,${totals.localDays + totals.exDays + totals.osDays},"${totals.totDa.toLocaleString()}",,,,,,,,,,,,,,,`);
    csvLines.push(`5,Fare Amount,${totals.totKm} km,"${totals.totTa.toLocaleString()}",,,,,,,,,,,,,,,`);
    csvLines.push(`, Total (DA+Fare), ," ${(totals.totDa + totals.totTa).toLocaleString()}",,,,,,,,,,,,,,,`);

    csvLines.push('SrNo,Head,Type,Amount,,,,,,,,,,,,,,,');
    if (!hideMiscValues) {
      miscSummary.forEach(m => {
        csvLines.push(`${m.srNo},${m.head},${m.type},${m.amount},,,,,,,,,,,,,,,`);
      });
      csvLines.push(`, Total, , ${totals.activeMiscVal.toFixed(2)}, ,,,,,,,,,,,,,,`);
    }

    if (performanceMetrics) {
      csvLines.push('SrNo,Total Dr.,Miss Drs,Working Days,Dr. Call Avg,Dr. Coverage,Total Dr Calls,Chem Call,Chem Call Avg,Ach%,Primary Amt,Secondary Amt,,,,,,,');
      csvLines.push(`1,${performanceMetrics.totalDr},${performanceMetrics.missDrs},${performanceMetrics.workingDays},${performanceMetrics.drCallAvg},${performanceMetrics.drCoverage},${performanceMetrics.totalDrCalls},${performanceMetrics.chemCall},${performanceMetrics.chemCallAvg},,"${performanceMetrics.primaryAmt}",,,,,,,,`);
    }

    csvLines.push('');
    csvLines.push(`Net Expense Claimed: ${totals.totClaim.toFixed(0)},,,,,,,,,,,,,,,,,,`);

    const csvContent = csvLines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Expense_Statement_${selectedMonth}_Official.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-7xl mx-auto space-y-5">
      
      {/* TOP NAVBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer text-xs font-semibold"
        >
          <ArrowLeft size={16} /> Back to Earn Hub
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50">
            <Sparkles size={13} className="text-emerald-400 animate-pulse" /> FREEZE PANE &bull; PERSISTENT SMART EXPENSE &bull; CBO METRICS
          </span>
        </div>
      </div>

      {/* HEADER CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <Wallet size={24} />
            </span>
            Monthly Expense Statement
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            BE: {headerInfo.name} ({headerInfo.code}) &bull; HQ: {headerInfo.hq} &bull; Freeze Pane Active (Cols #, Date, Station)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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

          {/* 📄 EXPORT PDF (A4 LANDSCAPE) BUTTON */}
          <button
            onClick={handleExportPDF}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950 transition cursor-pointer disabled:opacity-50"
            title="Download Official A4 Landscape Vector PDF"
          >
            <FileText size={15} /> 📄 Export PDF (A4)
          </button>

          <button
            onClick={handleExportCSV}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <Download size={15} /> Export Official CSV
          </button>
        </div>
      </div>

      <CloudSyncBar
        storageKey={`expenses/statement_${selectedMonth}`}
        sheetTitle={`Expense Statement (${selectedMonth})`}
        getData={() => ({
          month: selectedMonth,
          header: headerInfo,
          rows: rows,
          allowanceSummary: allowanceSummary,
          miscSummary: miscSummary,
          performanceMetrics: performanceMetrics,
          hideMiscValues: hideMiscValues
        })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.header) setHeaderInfo(cloudData.header);
          if (cloudData.rows && Array.isArray(cloudData.rows)) setRows(cloudData.rows);
          if (cloudData.allowanceSummary) setAllowanceSummary(cloudData.allowanceSummary);
          if (cloudData.miscSummary) setMiscSummary(cloudData.miscSummary);
          if (cloudData.performanceMetrics) setPerformanceMetrics(cloudData.performanceMetrics);
          if (cloudData.hideMiscValues !== undefined) setHideMiscValues(cloudData.hideMiscValues);
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

      {/* STAT SUMMARY CARDS */}
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
          <div className="text-xs text-slate-400 font-mono mt-0.5">{totals.localDays} Local &bull; {totals.exDays} Ex-Station</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="text-[10px] text-purple-400 uppercase font-semibold">Doctor &amp; Chemist Calls</div>
          <div className="text-xl font-black text-purple-300 font-mono mt-1">
            {totals.totDrs} <span className="text-xs font-normal text-slate-400">Dr</span> &bull; {totals.totChem} <span className="text-xs font-normal text-slate-400">Chem</span>
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

      {/* 19-COLUMN DAY-WISE EXPENSE TABLE (FROZEN UP TO ACTUAL STATION) */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Car size={16} className="text-cyan-400" />
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              19-Column Day-Wise Field Work Expense Statement ({selectedMonth})
            </h3>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
              ❄️ Pane Frozen (Col 1-3)
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {rows.length} Days Recorded
          </span>
        </div>

        <div className="overflow-x-auto max-h-[540px] border border-slate-800 rounded-xl relative">
          <table className="w-full text-left text-xs border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 bg-slate-950">
              <tr>
                <th style={{ width: '42px', minWidth: '42px', left: 0 }} className="p-2.5 text-center bg-slate-950 text-slate-400 font-bold uppercase border-b border-r border-slate-800 sticky z-40">
                  #
                </th>
                <th style={{ width: '95px', minWidth: '95px', left: '42px' }} className="p-2.5 bg-slate-950 text-cyan-400 font-bold uppercase border-b border-r border-slate-800 sticky z-40">
                  Date
                </th>
                <th style={{ width: '150px', minWidth: '150px', left: '137px' }} className="p-2.5 bg-slate-950 text-white font-bold uppercase border-b border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)] sticky z-40">
                  Actual Station
                </th>
                <th className="p-2.5 min-w-[110px] bg-slate-950 text-slate-400 font-bold uppercase border-b border-r border-slate-800">Work Type</th>
                <th className="p-2.5 min-w-[130px] bg-slate-950 text-slate-400 font-bold uppercase border-b border-r border-slate-800">Working Route</th>
                <th className="p-2.5 text-center w-16 bg-slate-950 text-amber-400 font-bold uppercase border-b border-r border-slate-800">DA Type</th>
                <th className="p-2.5 min-w-[120px] bg-slate-950 text-slate-400 font-bold uppercase border-b border-r border-slate-800">Work With</th>
                <th className="p-2.5 text-center w-14 bg-slate-950 text-purple-300 font-bold uppercase border-b border-r border-slate-800">Dr Call</th>
                <th className="p-2.5 text-center w-14 bg-slate-950 text-purple-300 font-bold uppercase border-b border-r border-slate-800">Chem</th>
                <th className="p-2.5 text-center w-14 bg-slate-950 text-purple-300 font-bold uppercase border-b border-r border-slate-800">Stk</th>
                <th className="p-2.5 text-center w-16 bg-slate-950 text-slate-400 font-bold uppercase border-b border-r border-slate-800">Route KM</th>
                <th className="p-2.5 text-center w-16 bg-slate-950 text-slate-200 font-bold uppercase border-b border-r border-slate-800">Payable KM</th>
                <th className="p-2.5 text-center w-12 bg-slate-950 text-slate-400 font-bold uppercase border-b border-r border-slate-800">Rate</th>
                <th className="p-2.5 text-right w-20 bg-slate-950 text-cyan-300 font-bold uppercase border-b border-r border-slate-800">FARE(TA)</th>
                <th className="p-2.5 text-right w-20 bg-slate-950 text-amber-300 font-bold uppercase border-b border-r border-slate-800">DA Amt</th>
                <th className="p-2.5 text-center w-28 bg-slate-950 text-yellow-300 font-bold uppercase border-b border-r border-slate-800">Other Exp (⚡)</th>
                <th className="p-2.5 text-right w-24 bg-slate-950 text-emerald-300 font-black uppercase border-b border-r border-slate-800">Total (₹)</th>
                <th className="p-2.5 min-w-[160px] bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={18} className="p-8 text-center text-slate-500 font-sans">
                    No expense data loaded. Click <b>"📥 Import CBO Expense (.csv / .xls)"</b> above to upload your CBO statement.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const isSunday = row.actualStation === 'Sunday' || row.workingRoute === 'Sunday';
                  const isLeave = String(row.workingType).includes('Leave') || row.actualStation === 'Absent';
                  const isHoliday = String(row.workingType).includes('Holiday') || row.actualStation === 'Holiday';
                  const isBanswara = String(row.actualStation).toUpperCase().includes('BANSWA') || String(row.workingRoute).toUpperCase().includes('BANSWA');

                  return (
                    <tr key={idx} className={`transition group ${
                      isSunday ? 'bg-rose-950/20 hover:bg-rose-950/30' : isLeave ? 'bg-amber-950/15 hover:bg-amber-950/25' : isHoliday ? 'bg-purple-950/20 hover:bg-purple-950/30' : 'hover:bg-slate-800/60'
                    }`}>
                      <td style={{ width: '42px', minWidth: '42px', left: 0 }} className="p-2 text-center text-slate-500 font-mono border-b border-r border-slate-800/80 sticky left-0 bg-slate-900 group-hover:bg-slate-800 z-20">
                        {row.srNo}
                      </td>
                      <td style={{ width: '95px', minWidth: '95px', left: '42px' }} className="p-2 text-cyan-300 font-mono border-b border-r border-slate-800/80 sticky left-[42px] bg-slate-900 group-hover:bg-slate-800 z-20">
                        {row.date}
                      </td>
                      <td style={{ width: '150px', minWidth: '150px', left: '137px' }} className="p-1 border-b border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)] sticky left-[137px] bg-slate-900 group-hover:bg-slate-800 z-20">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={row.actualStation}
                            onChange={e => handleCellChange(idx, 'actualStation', e.target.value)}
                            className="w-full py-1 px-1.5 bg-transparent font-sans font-semibold text-white rounded focus:bg-slate-950"
                          />
                          {isBanswara && (
                            <span className="text-[8px] bg-amber-500 text-slate-950 font-black px-1 rounded uppercase tracking-tighter shrink-0" title="Banswara rule: 372 KM active">
                              372K
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-1 border-b border-r border-slate-800/60">
                        <input
                          type="text"
                          value={row.workingType}
                          onChange={e => handleCellChange(idx, 'workingType', e.target.value)}
                          className="w-full py-1 px-1.5 bg-transparent font-sans text-slate-300 rounded focus:bg-slate-950"
                        />
                      </td>

                      <td className="p-1 border-b border-r border-slate-800/60">
                        <input
                          type="text"
                          value={row.workingRoute}
                          onChange={e => handleCellChange(idx, 'workingRoute', e.target.value)}
                          className="w-full py-1 px-1.5 bg-transparent font-sans text-slate-300 rounded focus:bg-slate-950"
                        />
                      </td>

                      <td className="p-1 text-center border-b border-r border-slate-800/60">
                        <select
                          value={row.daType || '-'}
                          onChange={e => handleCellChange(idx, 'daType', e.target.value)}
                          className="bg-slate-950 text-amber-300 font-bold rounded px-1.5 py-1 text-center border border-slate-800 focus:outline-none cursor-pointer"
                        >
                          <option value="L">L (Local ₹260)</option>
                          <option value="EX">EX (Ex-Stn ₹285)</option>
                          <option value="OS">OS (Out-Stn ₹400)</option>
                          <option value="NS">NS (Night ₹0)</option>
                          <option value="-">-</option>
                        </select>
                      </td>

                      <td className="p-1 border-b border-r border-slate-800/60">
                        <input
                          type="text"
                          value={row.workWith}
                          onChange={e => handleCellChange(idx, 'workWith', e.target.value)}
                          placeholder="-"
                          className="w-full py-1 px-1.5 bg-transparent font-sans text-slate-400 rounded focus:bg-slate-950 text-[11px]"
                        />
                      </td>

                      <td className="p-1 text-center font-bold text-purple-300 border-b border-r border-slate-800/60">
                        <input
                          type="text"
                          value={row.drCall}
                          onChange={e => handleCellChange(idx, 'drCall', e.target.value)}
                          className="w-10 py-1 text-center bg-transparent rounded focus:bg-slate-950"
                        />
                      </td>

                      <td className="p-1 text-center text-slate-400 border-b border-r border-slate-800/60">
                        <input
                          type="text"
                          value={row.chemCall || ''}
                          onChange={e => handleCellChange(idx, 'chemCall', e.target.value)}
                          placeholder="-"
                          className="w-8 py-1 text-center bg-transparent rounded focus:bg-slate-950"
                        />
                      </td>

                      <td className="p-1 text-center text-slate-400 border-b border-r border-slate-800/60">
                        <input
                          type="text"
                          value={row.stkCall || ''}
                          onChange={e => handleCellChange(idx, 'stkCall', e.target.value)}
                          placeholder="-"
                          className="w-8 py-1 text-center bg-transparent rounded focus:bg-slate-950"
                        />
                      </td>

                      <td className="p-1 text-center text-slate-400 border-b border-r border-slate-800/60">
                        <input
                          type="text"
                          value={row.routeKm || ''}
                          onChange={e => handleCellChange(idx, 'routeKm', e.target.value)}
                          className="w-12 py-1 text-center bg-transparent rounded focus:bg-slate-950 font-mono"
                        />
                      </td>

                      <td className="p-1 text-center border-b border-r border-slate-800/60">
                        <input
                          type="text"
                          value={row.payableKm}
                          onChange={e => handleCellChange(idx, 'payableKm', e.target.value)}
                          className="w-12 py-1 text-center bg-transparent text-slate-200 rounded focus:bg-slate-950 font-bold font-mono"
                        />
                      </td>

                      <td className="p-2 text-center text-slate-400 text-[11px] border-b border-r border-slate-800/60">{row.rate}</td>

                      <td className="p-2 text-right font-bold text-cyan-300 border-b border-r border-slate-800/60">
                        {Number(row.fareTa) > 0 ? `₹${Number(row.fareTa).toFixed(2)}` : '-'}
                      </td>

                      <td className="p-2 text-right font-bold text-amber-300 border-b border-r border-slate-800/60">
                        {Number(row.daAmt) > 0 ? `₹${Number(row.daAmt).toFixed(2)}` : '-'}
                      </td>

                      {/* SMART OTHER EXPENSE TRIGGER */}
                      <td className="p-1 border-b border-r border-slate-800/60">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={row.otherExpense || ''}
                            onChange={e => handleCellChange(idx, 'otherExpense', e.target.value)}
                            placeholder="0"
                            className="w-full py-1 text-right bg-transparent text-yellow-300 font-bold rounded focus:bg-slate-950"
                          />
                          <button
                            type="button"
                            onClick={() => handleOpenSmartExpense(idx)}
                            className="p-1 text-yellow-400 hover:text-white bg-yellow-950/60 hover:bg-yellow-900 border border-yellow-500/30 rounded transition cursor-pointer shrink-0"
                            title="Open Smart Breakdown (WCFYH, Rapido, Auto, Doctor DOB/DOA, Fruits)"
                          >
                            <Calculator size={12} />
                          </button>
                        </div>
                      </td>

                      <td className="p-2 text-right font-black text-emerald-300 bg-emerald-950/20 border-b border-r border-slate-800/60">
                        {Number(row.total) > 0 ? `₹${Number(row.total).toFixed(2)}` : '-'}
                      </td>

                      <td className="p-1 border-b border-slate-800/60">
                        <input
                          type="text"
                          value={row.remark || ''}
                          onChange={e => handleCellChange(idx, 'remark', e.target.value)}
                          placeholder="-"
                          className="w-full py-1 px-1.5 bg-transparent font-sans text-slate-300 text-[11px] rounded focus:bg-slate-950"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* TFOOT */}
            <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-slate-700 font-bold z-30 text-xs">
              <tr>
                <td style={{ width: '42px', minWidth: '42px', left: 0 }} className="p-2.5 text-center text-cyan-400 font-mono border-r border-slate-800 sticky left-0 bg-slate-950 z-40">Σ</td>
                <td style={{ width: '95px', minWidth: '95px', left: '42px' }} className="p-2.5 text-white font-sans uppercase border-r border-slate-800 sticky left-[42px] bg-slate-950 z-40">TOTAL</td>
                <td style={{ width: '150px', minWidth: '150px', left: '137px' }} className="p-2.5 text-slate-300 font-mono border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)] sticky left-[137px] bg-slate-950 z-40">{selectedMonth}</td>
                
                <td colSpan={4} className="p-2.5 text-slate-400 font-mono border-r border-slate-800">-</td>
                <td className="p-2.5 text-center font-bold text-purple-300 font-mono border-r border-slate-800">{totals.totDrs}</td>
                <td className="p-2.5 text-center font-bold text-purple-300 font-mono border-r border-slate-800">{totals.totChem}</td>
                <td className="p-2.5 text-center font-bold text-purple-300 font-mono border-r border-slate-800">{totals.totStk}</td>
                <td className="p-2.5 text-center font-bold text-slate-400 font-mono border-r border-slate-800">{totals.totKm}</td>
                <td className="p-2.5 text-center font-bold text-slate-200 font-mono border-r border-slate-800">{totals.totKm}</td>
                <td className="p-2.5 text-center text-slate-500 border-r border-slate-800">-</td>
                <td className="p-2.5 text-right font-black text-cyan-300 font-mono border-r border-slate-800">₹{totals.totTa.toLocaleString()}</td>
                <td className="p-2.5 text-right font-black text-amber-300 font-mono border-r border-slate-800">₹{totals.totDa.toLocaleString()}</td>
                <td className="p-2.5 text-right font-black text-yellow-300 font-mono border-r border-slate-800">₹{totals.totOther.toFixed(2)}</td>
                <td className="p-2.5 text-right font-black text-emerald-300 font-mono bg-emerald-950/60 border-r border-slate-800">₹{totals.totClaim.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 🌟 6. ALLOWANCE CALCULATION BOX & HEAD/TYPE/AMOUNT (WITH HIDE VALUE) */}
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
                  <td className="p-2 text-center text-amber-400">Σ</td>
                  <td className="p-2 text-white">TOTAL (DA + FARE)</td>
                  <td className="p-2 text-center text-slate-300 font-mono">{totals.localDays + totals.exDays + totals.osDays} Days</td>
                  <td className="p-2 text-right font-black text-amber-300 font-mono">₹{(totals.totDa + totals.totTa).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Block 4: COMPLETE HEAD | TYPE | AMOUNT BOX (WITH HIDE VALUE TOGGLE) */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={16} /> Head &bull; Type &bull; Amount (Other Expenses)
            </h3>

            <button
              type="button"
              onClick={() => {
                const next = !hideMiscValues;
                setHideMiscValues(next);
                persistData(rows, headerInfo, allowanceSummary, miscSummary, performanceMetrics, next);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                hideMiscValues 
                  ? 'bg-rose-950 text-rose-300 border-rose-500/50' 
                  : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
              }`}
              title="Toggle to send blank values in CSV export"
            >
              {hideMiscValues ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{hideMiscValues ? '🙈 Values Hidden (Send Blank)' : '👁️ Values Visible'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <th className="p-2 text-center w-10">SrNo</th>
                  <th className="p-2">Head</th>
                  <th className="p-2 text-center w-24">Type</th>
                  <th className="p-2 text-right w-28 text-emerald-400">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {miscSummary.map((m, mIdx) => (
                  <tr key={mIdx}>
                    <td className="p-2 text-center text-slate-500">{m.srNo}</td>
                    <td className="p-2 font-sans text-white">{m.head}</td>
                    <td className="p-2 text-center text-slate-300">{m.type}</td>
                    <td className="p-2 text-right font-bold text-emerald-300">
                      {hideMiscValues ? '-' : `₹${m.amount}`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950 border-t border-slate-700 font-bold text-xs">
                <tr>
                  <td className="p-2 text-center text-emerald-400">Σ</td>
                  <td className="p-2 text-white">TOTAL MISC</td>
                  <td className="p-2 text-center text-slate-500">-</td>
                  <td className="p-2 text-right font-black text-emerald-300 font-mono">
                    {hideMiscValues ? '-' : `₹${totals.activeMiscVal.toFixed(2)}`}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-sans text-slate-300">Total Travel Allowance (Fare TA):</span>
              <span className="font-bold text-cyan-300">₹{totals.totTa.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-sans text-slate-300">Total Daily Allowance (Total DA):</span>
              <span className="font-bold text-amber-300">₹{totals.totDa.toLocaleString()}</span>
            </div>
          </div>

        </div>

      </div>

      {/* 🌟 7. SCREENSHOT EXACT PERFORMANCE METRICS TABLE */}
      {performanceMetrics && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-purple-500/50 shadow-2xl space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
              <Award size={16} className="text-purple-400" />
              CBO Monthly Performance Summary (Exact Screenshot Table)
            </h3>

            {/* 🌟 ADVANCED CHOOSE OPTION: PRINT WITH VALUES OR BLANK VALUES */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Print Mode:</span>
              <button
                type="button"
                onClick={() => setBlankPerfValues(!blankPerfValues)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  blankPerfValues 
                    ? 'bg-amber-950 text-amber-300 border-amber-500/60 shadow-md' 
                    : 'bg-slate-950 text-purple-300 border-purple-500/40'
                }`}
                title="Toggle whether table values should be printed or left blank"
              >
                {blankPerfValues ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{blankPerfValues ? '🔲 Values Blank (Structure Only)' : '📊 Print Real Values'}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-purple-900/50 rounded-xl shadow-lg">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-[#B4C6E7] text-slate-950 font-black uppercase text-[11px] border-b border-slate-600">
                  <th className="p-2.5 border-r border-slate-500 w-12">SrNo</th>
                  <th className="p-2.5 border-r border-slate-500">Total Dr.</th>
                  <th className="p-2.5 border-r border-slate-500">Miss Drs</th>
                  <th className="p-2.5 border-r border-slate-500">Working Days</th>
                  <th className="p-2.5 border-r border-slate-500">Dr. Call Avg</th>
                  <th className="p-2.5 border-r border-slate-500">Dr. Coverage</th>
                  <th className="p-2.5 border-r border-slate-500">Total Dr Calls</th>
                  <th className="p-2.5 border-r border-slate-500">Chem Call</th>
                  <th className="p-2.5 border-r border-slate-500">Chem Call Avg</th>
                  <th className="p-2.5 border-r border-slate-500">Ach%</th>
                  <th className="p-2.5 border-r border-slate-500">Primary Amt</th>
                  <th className="p-2.5">Secondary Amt</th>
                </tr>
              </thead>
              <tbody className="bg-slate-950 font-mono text-xs divide-y divide-slate-800">
                <tr>
                  <td className="p-3 border-r border-slate-800 text-slate-500 font-bold">{performanceMetrics.srNo || 1}</td>
                  <td className="p-3 border-r border-slate-800 text-white font-bold">{blankPerfValues ? '-' : performanceMetrics.totalDr}</td>
                  <td className="p-3 border-r border-slate-800 text-rose-400 font-bold">{blankPerfValues ? '-' : performanceMetrics.missDrs}</td>
                  <td className="p-3 border-r border-slate-800 text-cyan-300 font-bold">{blankPerfValues ? '-' : performanceMetrics.workingDays}</td>
                  <td className="p-3 border-r border-slate-800 text-amber-300 font-bold">{blankPerfValues ? '-' : performanceMetrics.drCallAvg}</td>
                  <td className="p-3 border-r border-slate-800 text-emerald-400 font-bold">{blankPerfValues ? '-' : `${performanceMetrics.drCoverage}%`}</td>
                  <td className="p-3 border-r border-slate-800 text-purple-300 font-bold">{blankPerfValues ? '-' : performanceMetrics.totalDrCalls}</td>
                  <td className="p-3 border-r border-slate-800 text-slate-300">{blankPerfValues ? '-' : (performanceMetrics.chemCall || '-')}</td>
                  <td className="p-3 border-r border-slate-800 text-slate-300">{blankPerfValues ? '-' : (performanceMetrics.chemCallAvg || '-')}</td>
                  <td className="p-3 border-r border-slate-800 text-slate-400">{blankPerfValues ? '-' : (performanceMetrics.achPct || '-')}</td>
                  <td className="p-3 border-r border-slate-800 text-yellow-300 font-black">{blankPerfValues ? '-' : `₹${performanceMetrics.primaryAmt}`}</td>
                  <td className="p-3 text-slate-400">{blankPerfValues ? '-' : (performanceMetrics.secondaryAmt || '-')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#D9E1F2] border-2 border-[#8EA9DB] text-slate-950 shadow-xl">
            <span className="text-xl md:text-2xl font-black font-sans tracking-tight">
              Net Expense Claimed:
            </span>
            <span className="text-2xl md:text-3xl font-black font-mono text-emerald-900 tracking-wide">
              ₹ {totals.totClaim.toLocaleString()}
            </span>
          </div>

        </div>
      )}

      {/* 🌟 8. SMART OTHER EXPENSE MODAL WITH SAVED ITEM MEMORY & DOCTOR SEARCH */}
      {activeSmartRowIdx !== null && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-4">
          <div className="bg-slate-900 border-2 border-yellow-500/60 rounded-3xl max-w-xl w-full p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-yellow-500/20 text-yellow-400 rounded-xl border border-yellow-500/40">
                  <Calculator size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Smart Other Expense Builder</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Day #{rows[activeSmartRowIdx]?.srNo} ({rows[activeSmartRowIdx]?.date}) &bull; {rows[activeSmartRowIdx]?.actualStation}
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveSmartRowIdx(null)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            {/* NEW PRESET OPTIONS */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Select Expense Category (Add as many as needed):
              </span>

              {/* General Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddGeneralCategory('WCFYH Activity')}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={12} /> WCFYH Activity
                </button>

                <button
                  type="button"
                  onClick={() => handleAddGeneralCategory('Rapido')}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={12} /> Rapido
                </button>

                <button
                  type="button"
                  onClick={() => handleAddGeneralCategory('Auto Fare')}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={12} /> Auto Fare
                </button>
              </div>

              {/* Doctor Specific Categories */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleStartDoctorCategory('DOB')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                    activeDoctorSearchCategory === 'DOB'
                      ? 'bg-pink-600 text-white border-pink-400 shadow-md'
                      : 'bg-slate-950 text-pink-300 border-pink-500/40 hover:bg-slate-800'
                  }`}
                >
                  <Stethoscope size={13} /> 🎂 DOB Bill of Doctor
                </button>

                <button
                  type="button"
                  onClick={() => handleStartDoctorCategory('DOA')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                    activeDoctorSearchCategory === 'DOA'
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : 'bg-slate-950 text-purple-300 border-purple-500/40 hover:bg-slate-800'
                  }`}
                >
                  <Stethoscope size={13} /> 💍 DOA Bill of Doctor
                </button>

                <button
                  type="button"
                  onClick={() => handleStartDoctorCategory('FRUITS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                    activeDoctorSearchCategory === 'FRUITS'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                      : 'bg-slate-950 text-emerald-300 border-emerald-500/40 hover:bg-slate-800'
                  }`}
                >
                  <Stethoscope size={13} /> 🍏 Fruits Doctor
                </button>
              </div>
            </div>

                        {/* 🌟 MANUAL / CUSTOM CATEGORY INPUT ROW */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-amber-500/40 space-y-2 text-xs">
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Plus size={13} className="text-amber-300" />
                <span>Custom / Manual Category (Inke alawa kuch aur kharcha):</span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Category Name (e.g. Toll Tax, Courier, Station Tea, Room)..."
                  value={customCategoryName}
                  onChange={e => setCustomCategoryName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-400"
                />
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={customCategoryAmount}
                    onChange={e => setCustomCategoryAmount(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 text-yellow-300 font-mono font-bold text-right rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCategory}
                    className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1 shrink-0"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* MASTER DOCTOR SEARCH BOX */}
            {activeDoctorSearchCategory && (
              <div className="p-3 bg-slate-950 rounded-2xl border-2 border-cyan-500/50 space-y-2 text-xs">
                <div className="flex items-center justify-between text-cyan-300 font-bold">
                  <span>Search Doctor from Master List for {activeDoctorSearchCategory}:</span>
                  <button onClick={() => setActiveDoctorSearchCategory(null)} className="text-slate-400 hover:text-white p-0.5"><X size={14} /></button>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Type doctor name (e.g. Abhay, Dave, Bomb, Chirag)..."
                    value={doctorSearchQuery}
                    onChange={e => setDoctorSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:border-cyan-400 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="overflow-y-auto max-h-36 space-y-1 pr-1">
                  {filteredMslDoctors.map(doc => (
                    <div
                      key={doc.srNo}
                      onClick={() => handleSelectDoctorForCategory(doc)}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 hover:bg-cyan-950/70 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 text-[10px]">#{doc.srNo}</span>
                        <span className="font-bold text-white">{doc.doctorName}</span>
                        {doc.speciality && <span className="text-[10px] text-cyan-400 font-mono">({doc.speciality})</span>}
                      </div>
                      <span className="text-cyan-400 text-[11px] font-bold">Pick ➔</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🌟 SAVED ITEMS LIST (SHOWS ALL PREVIOUS ITEMS + NEW ONES) */}
            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-800 rounded-2xl p-2.5 bg-slate-950/70 max-h-[240px]">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Active Saved Items for this Day:</span>
                <span className="text-[10px] text-yellow-400 font-mono">{smartItems.length} items</span>
              </div>
              
              {smartItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 font-mono">
                  No items in list yet. Tap any button above to add (e.g. Fruits, WCFYH, etc.).
                </div>
              ) : (
                smartItems.map((it, itemIdx) => (
                  <div key={it.id || itemIdx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 gap-2 text-xs">
                    <div className="truncate max-w-[240px]">
                      <span className="font-semibold text-white block truncate">{it.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Item #{itemIdx + 1}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        placeholder="Amount"
                        value={it.amount}
                        onChange={e => handleUpdateSmartItemAmount(it.id, e.target.value)}
                        className="w-24 py-1 px-2 bg-slate-950 border border-yellow-500/40 text-yellow-300 font-mono font-bold rounded-lg text-right focus:border-yellow-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteSmartItem(it.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                        title="Delete this item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total & Apply */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Total Other Expense:</div>
                <div className="text-lg font-black text-yellow-300 font-mono">
                  ₹{smartItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSmartRowIdx(null)}
                  className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplySmartExpense}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={15} /> Save &amp; Update Remark
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div
      {/* 🌟 IN-APP PDF PREVIEW MODAL (SAFARI-SAFE, NO REDIRECT TO MAIN SCREEN) */}
      {pdfPreviewModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-purple-500/70 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-purple-500/20 text-purple-300 rounded-lg"><FileText size={16} /></span>
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-white flex items-center gap-2">
                    PDF Preview: {pdfPreviewModal.fileName}
                    <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                      A4 Landscape
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">Tapping Close keeps you right inside Expense Statement!</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    pdfPreviewModal.doc.save(pdfPreviewModal.fileName);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950 transition cursor-pointer"
                >
                  <Download size={14} /> ⬇️ Save to iPad
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try { URL.revokeObjectURL(pdfPreviewModal.blobUrl); } catch(e) {}
                    setPdfPreviewModal(null);
                  }}
                  className="flex items-center gap-1 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <X size={16} /> ✕ Wapas Jayein (Close)
                </button>
              </div>
            </div>

            {/* In-App PDF Viewer Frame */}
            <div className="flex-1 bg-slate-950 p-2 overflow-hidden">
              <iframe
                src={pdfPreviewModal.blobUrl}
                title="Expense Statement PDF Preview"
                className="w-full h-full rounded-2xl border border-slate-800"
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
