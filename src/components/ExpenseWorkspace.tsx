import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Wallet, Calendar, Bot, Loader2, Download, 
  CheckCircle2, AlertTriangle, RefreshCw, Layers, DollarSign, 
  Car, Building2, User, FileSpreadsheet, Check, Sparkles, Plus, Trash2, Edit3
} from 'lucide-react';
import { CloudSyncBar } from './CloudSyncBar';

interface Props {
  onBack: () => void;
}

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

export interface ExpenseDayRow {
  srNo: number | string;
  date: string;
  actualStation: string;
  workingType: string;
  workingRoute: string;
  daType: string;
  workWith: string;
  drCall: number | string;
  chemCall?: number | string;
  stkCall?: number | string;
  routeKm: number | string;
  payableKm: number | string;
  rate: number | string;
  fareTa: number | string;
  daAmt: number | string;
}

export const ExpenseWorkspace: React.FC<Props> = ({ onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState('Aug-2026');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [headerInfo, setHeaderInfo] = useState({
    name: 'BANWARI LAL MEENA',
    code: 'RJ/SL/0042',
    hq: 'UDAIPUR',
    division: 'DIOS GROUP',
    state: 'RAJASTHAN',
    designation: 'BUSINESS EXECUTIVE',
    approvalStatus: 'Pending'
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

  const [miscExpense, setMiscExpense] = useState<number>(270);

  const persistData = (newRows: ExpenseDayRow[], newMisc: number = miscExpense) => {
    setRows(newRows);
    setMiscExpense(newMisc);
    try {
      localStorage.setItem(`dios_expense_statement_${selectedMonth}`, JSON.stringify({
        month: selectedMonth,
        header: headerInfo,
        rows: newRows,
        miscExpense: newMisc
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
      const t = String(val).toUpperCase();
      if (t === 'EX') copy[index].daAmt = 285;
      else if (t === 'L') copy[index].daAmt = 260;
      else if (t === 'OS') copy[index].daAmt = 400;
      else copy[index].daAmt = 0;
    }

    persistData(copy);
  };

  const totals = useMemo(() => {
    let totKm = 0;
    let totTa = 0;
    let totDa = 0;
    let totDrs = 0;
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
      const dr = parseInt(String(r.drCall || 0)) || 0;
      const daType = String(r.daType || '').toUpperCase().trim();

      totKm += km;
      totTa += ta;
      totDa += da;
      totDrs += dr;

      if (daType === 'L') { localDays++; localAmt += da; }
      else if (daType === 'EX') { exDays++; exAmt += da; }
      else if (daType === 'OS') { osDays++; osAmt += da; }
    });

    const grandTotal = totTa + totDa + miscExpense;

    return {
      totKm, totTa, totDa, totDrs,
      localDays, localAmt, exDays, exAmt, osDays, osAmt,
      grandTotal
    };
  }, [rows, miscExpense]);

  const handleFetchCboExpense = async () => {
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(`CBO se ${selectedMonth} ka live Expense Statement fetch ho raha hai...`);

    try {
      const res = await fetch('/api/fetch-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_month: selectedMonth, to_month: selectedMonth, fy_year: '2026-2027' })
      });

      const data = await res.json();

      if (data && data.success && data.rows && data.rows.length > 0) {
        if (data.employee) setHeaderInfo(data.employee);
        const newRows = data.rows.map((r: any, idx: number) => ({
          srNo: r.srNo || idx + 1,
          date: r.date || '',
          actualStation: r.actualStation || '',
          workingType: r.workingType || '',
          workingRoute: r.workingRoute || '',
          daType: r.daType || '',
          workWith: r.workWith || '',
          drCall: r.drCall || 0,
          chemCall: r.chemCall || '',
          stkCall: r.stkCall || '',
          routeKm: r.routeKm || 0,
          payableKm: r.payableKm || 0,
          rate: r.rate || '2.50',
          fareTa: r.fareTa || 0,
          daAmt: r.daAmt || 0
        }));

        persistData(newRows, 270);
        setStatusMsg(`🎉 SUCCESS! ${selectedMonth} ka CBO Expense Statement (${newRows.length} Days) load ho gaya!`);
      } else {
        throw new Error(data?.error || 'CBO return empty records.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'CBO fetch error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    let csv = `DIOS LIFESCIENCES PVT LTD (2026 - 2027)
`;
    csv += `EXPENSE STATEMENT - ${selectedMonth}
`;
    csv += `Name: ${headerInfo.name},Code: ${headerInfo.code},HQ: ${headerInfo.hq},Division: ${headerInfo.division},Designation: ${headerInfo.designation},State: ${headerInfo.state}

`;
    csv += `SrNo,Date,Actual Station,Working Type,Working Route,DA Type,Work With,Dr Call,Chem Call,Stk Call,Route KM,Payable KM,Rate,FARE(TA),DA Amount
`;

    rows.forEach(r => {
      csv += `"${r.srNo}","${r.date}","${r.actualStation}","${r.workingType}","${r.workingRoute}","${r.daType}","${r.workWith}",${r.drCall},"${r.chemCall || ''}","${r.stkCall || ''}",${r.routeKm},${r.payableKm},${r.rate},${r.fareTa},${r.daAmt}
`;
    });

    csv += `
SUMMARY ALLOWANCES
`;
    csv += `Head,Days,Amount (Rs)
`;
    csv += `Local,${totals.localDays},${totals.localAmt}
`;
    csv += `Ex-Station,${totals.exDays},${totals.exAmt}
`;
    csv += `Out Station,${totals.osDays},${totals.osAmt}
`;
    csv += `Total DA Amount,,${totals.totDa}
`;
    csv += `Total Fare TA Amount,${totals.totKm} KM,${totals.totTa}
`;
    csv += `MISC Expenses,,${miscExpense}
`;
    csv += `GRAND TOTAL MONTHLY CLAIM,,${totals.grandTotal}
`;

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Expense_Statement_${selectedMonth}.csv`;
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
          <ArrowLeft size={16} /> Back to Earn
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50">
            <Sparkles size={13} className="text-emerald-400 animate-pulse" /> EXPENSE STATEMENT ENGINE
          </span>
        </div>
      </div>

      {/* 2. HEADER & ACTION CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <Wallet size={24} />
            </span>
            Monthly Expense Statement
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            BE: {headerInfo.name} ({headerInfo.code}) • HQ: {headerInfo.hq} • TA &amp; DA Field Allowances
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
            <Calendar size={14} className="text-amber-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
            >
              {MONTH_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleFetchCboExpense}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition cursor-pointer"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Bot size={15} />}
            {loading ? 'Fetching CBO...' : '⚡ Auto-Fetch CBO Expense'}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* ☁️ CLOUD SYNC BAR */}
      <CloudSyncBar
        storageKey={`expenses/statement_${selectedMonth}`}
        sheetTitle={`Expense Statement (${selectedMonth})`}
        getData={() => ({
          month: selectedMonth,
          header: headerInfo,
          rows: rows,
          miscExpense: miscExpense
        })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.header) setHeaderInfo(cloudData.header);
          if (cloudData.rows && Array.isArray(cloudData.rows)) setRows(cloudData.rows);
          if (cloudData.miscExpense !== undefined) setMiscExpense(cloudData.miscExpense);
        }}
        onSaveLocal={() => {
          persistData(rows, miscExpense);
        }}
      />

      {statusMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-950/70 border border-rose-500/50 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. EXECUTIVE STAT SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <div className="text-[10px] text-purple-400 uppercase font-semibold">Doctor Calls Met</div>
          <div className="text-xl font-black text-purple-300 font-mono mt-1">
            {totals.totDrs} <span className="text-xs font-normal text-slate-400">Calls</span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">31 Days Field Record</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-950/90 to-slate-950 p-4 rounded-2xl border-2 border-emerald-500/50 shadow-xl flex flex-col justify-between">
          <div className="text-[10px] text-emerald-300 uppercase font-black tracking-wide flex items-center justify-between">
            <span>TOTAL MONTHLY CLAIM</span>
            <Sparkles size={14} className="text-yellow-300 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono mt-1">
            ₹{totals.grandTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 4. MAIN 31-DAY EXPENSE STATEMENT TABLE */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Car size={16} /> Day-Wise Field Work Expense Statement ({selectedMonth})
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
                <th className="p-2.5 text-center w-16 text-purple-300">Dr Call</th>
                <th className="p-2.5 text-center w-16">Payable KM</th>
                <th className="p-2.5 text-center w-14">Rate</th>
                <th className="p-2.5 text-right w-24 text-cyan-300">FARE(TA)</th>
                <th className="p-2.5 text-right w-24 text-amber-300">DA Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-500">
                    No expense data loaded. Click <b>"⚡ Auto-Fetch CBO Expense"</b> above to load live statement.
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
                          <option value="-">-</option>
                        </select>
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.workWith}
                          onChange={e => handleCellChange(idx, 'workWith', e.target.value)}
                          placeholder="-"
                          className="w-full py-1 px-1.5 bg-transparent font-sans text-slate-400 rounded focus:bg-slate-950"
                        />
                      </td>
                      <td className="p-1 text-center font-bold text-purple-300">
                        <input
                          type="text"
                          value={row.drCall}
                          onChange={e => handleCellChange(idx, 'drCall', e.target.value)}
                          className="w-12 py-1 text-center bg-transparent rounded focus:bg-slate-950"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="text"
                          value={row.payableKm}
                          onChange={e => handleCellChange(idx, 'payableKm', e.target.value)}
                          className="w-14 py-1 text-center bg-transparent text-slate-200 rounded focus:bg-slate-950"
                        />
                      </td>
                      <td className="p-2 text-center text-slate-400">{row.rate}</td>
                      <td className="p-2 text-right font-bold text-cyan-300">
                        {Number(row.fareTa) > 0 ? `₹${Number(row.fareTa).toFixed(2)}` : '-'}
                      </td>
                      <td className="p-2 text-right font-bold text-amber-300">
                        {Number(row.daAmt) > 0 ? `₹${Number(row.daAmt).toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-slate-700 font-bold z-10 text-xs">
              <tr>
                <td className="p-2.5 text-center text-cyan-400 font-mono">Σ</td>
                <td className="p-2.5 text-white" colSpan={6}>TOTAL SUMMARY ({selectedMonth})</td>
                <td className="p-2.5 text-center font-bold text-purple-300 font-mono">{totals.totDrs}</td>
                <td className="p-2.5 text-center font-bold text-slate-200 font-mono">{totals.totKm} KM</td>
                <td className="p-2.5 text-center text-slate-500">-</td>
                <td className="p-2.5 text-right font-black text-cyan-300 font-mono">₹{totals.totTa.toLocaleString()}</td>
                <td className="p-2.5 text-right font-black text-amber-300 font-mono">₹{totals.totDa.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. SUMMARY BOXES (ALLOWANCES + MISC) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Box 1: Allowances */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Building2 size={16} /> Daily Allowance Calculation
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <th className="p-2.5 text-center w-12">#</th>
                  <th className="p-2.5">Head</th>
                  <th className="p-2.5 text-center w-24">Days</th>
                  <th className="p-2.5 text-right w-32 text-amber-300">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                <tr>
                  <td className="p-2 text-center text-slate-500">1</td>
                  <td className="p-2 font-sans text-white">Local Allowance (@ ₹260)</td>
                  <td className="p-2 text-center font-bold text-slate-200">{totals.localDays}</td>
                  <td className="p-2 text-right font-bold text-amber-300">₹{totals.localAmt.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-2 text-center text-slate-500">2</td>
                  <td className="p-2 font-sans text-white">Ex-Station Allowance (@ ₹285)</td>
                  <td className="p-2 text-center font-bold text-slate-200">{totals.exDays}</td>
                  <td className="p-2 text-right font-bold text-amber-300">₹{totals.exAmt.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-2 text-center text-slate-500">3</td>
                  <td className="p-2 font-sans text-white">Out Station Allowance</td>
                  <td className="p-2 text-center font-bold text-slate-200">{totals.osDays}</td>
                  <td className="p-2 text-right font-bold text-amber-300">₹{totals.osAmt.toLocaleString()}</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-950 border-t border-slate-700 font-bold text-xs">
                <tr>
                  <td className="p-2 text-center text-amber-400">Σ</td>
                  <td className="p-2 text-white">TOTAL DA ALLOWANCE</td>
                  <td className="p-2 text-center text-slate-300 font-mono">{totals.localDays + totals.exDays + totals.osDays} Days</td>
                  <td className="p-2 text-right font-black text-amber-300 font-mono">₹{totals.totDa.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Box 2: Misc & Claim Breakdown */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <DollarSign size={16} /> Claim Summary Breakdown
          </h3>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-sans text-slate-300">Travel Allowance (Fare TA):</span>
              <span className="font-bold text-cyan-300">₹{totals.totTa.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-sans text-slate-300">Daily Allowance (Total DA):</span>
              <span className="font-bold text-amber-300">₹{totals.totDa.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-sans text-slate-300">Miscellaneous Expenses (MISC):</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={miscExpense}
                  onChange={e => persistData(rows, parseFloat(e.target.value) || 0)}
                  className="w-20 bg-slate-900 border border-slate-700 text-emerald-300 font-bold rounded-lg px-2 py-1 text-right focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-950/60 border-2 border-emerald-500/50 shadow-lg">
              <span className="font-sans font-bold text-white text-sm">💰 GRAND TOTAL CLAIM:</span>
              <span className="font-black text-emerald-300 text-base">₹{totals.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
