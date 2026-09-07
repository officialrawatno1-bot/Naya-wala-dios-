import React, { useState, useEffect } from 'react';
import { Calendar, Bot, Loader2, Save, Download, Check, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { memoryStore, FwDayEntry } from '../../data/memoryStore';

const MONTH_OPTIONS = [
  { label: 'Apr-2026', value: 'Apr-2026', code: 'APR', year: 2026, monthIdx: 3, days: 30 },
  { label: 'May-2026', value: 'May-2026', code: 'MAY', year: 2026, monthIdx: 4, days: 31 },
  { label: 'Jun-2026', value: 'Jun-2026', code: 'JUN', year: 2026, monthIdx: 5, days: 30 },
  { label: 'Jul-2026', value: 'Jul-2026', code: 'JUL', year: 2026, monthIdx: 6, days: 31 },
  { label: 'Aug-2026', value: 'Aug-2026', code: 'AUG', year: 2026, monthIdx: 7, days: 31 },
  { label: 'Sep-2026', value: 'Sep-2026', code: 'SEP', year: 2026, monthIdx: 8, days: 30 },
  { label: 'Oct-2026', value: 'Oct-2026', code: 'OCT', year: 2026, monthIdx: 9, days: 31 },
  { label: 'Nov-2026', value: 'Nov-2026', code: 'NOV', year: 2026, monthIdx: 10, days: 30 },
  { label: 'Dec-2026', value: 'Dec-2026', code: 'DEC', year: 2026, monthIdx: 11, days: 31 },
  { label: 'Jan-2027', value: 'Jan-2027', code: 'JAN', year: 2027, monthIdx: 0, days: 31 },
  { label: 'Feb-2027', value: 'Feb-2027', code: 'FEB', year: 2027, monthIdx: 1, days: 28 },
  { label: 'Mar-2027', value: 'Mar-2027', code: 'MAR', year: 2027, monthIdx: 2, days: 31 },
];

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const buildEmptyMonth = (monthConfig: typeof MONTH_OPTIONS[0]): FwDayEntry[] => {
  return Array.from({ length: monthConfig.days }, (_, i) => {
    const dNum = i + 1;
    const dateObj = new Date(monthConfig.year, monthConfig.monthIdx, dNum);
    const dayName = DAY_NAMES[dateObj.getDay()];
    return {
      date: dNum,
      day: dayName,
      areaWorked: dayName === 'SUNDAY' ? 'SUNDAY' : '',
      tpSubmitted: '',
      drsMet: '',
      chemistsMet: '',
      withManager: false,
      workType: dayName === 'SUNDAY' ? 'Sunday' : 'Working'
    };
  });
};

export const MonthFwProgressSheet: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => memoryStore.currentDcrMonth || 'Aug-2026');
  
  const [entries, setEntries] = useState<FwDayEntry[]>(() => {
    const opt = MONTH_OPTIONS.find(m => m.value === (memoryStore.currentDcrMonth || 'Aug-2026')) || MONTH_OPTIONS[4];
    if (memoryStore.dcrDataByMonth[opt.code]) {
      return memoryStore.dcrDataByMonth[opt.code];
    }
    return buildEmptyMonth(opt);
  });

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleMonthSelect = (newMonth: string) => {
    setSelectedMonth(newMonth);
    memoryStore.currentDcrMonth = newMonth;
    const cfg = MONTH_OPTIONS.find(m => m.value === newMonth) || MONTH_OPTIONS[4];
    
    if (memoryStore.dcrDataByMonth[cfg.code]) {
      setEntries(memoryStore.dcrDataByMonth[cfg.code]);
    } else {
      setEntries(buildEmptyMonth(cfg));
    }
    setStatusMsg('');
    setErrorMsg(null);
  };

  const handleCellChange = (index: number, field: keyof FwDayEntry, value: string) => {
    setEntries(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      
      const opt = MONTH_OPTIONS.find(m => m.value === selectedMonth);
      if (opt) memoryStore.dcrDataByMonth[opt.code] = copy;
      return copy;
    });
  };

  const handleFetchFromCbo = async () => {
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(`CBO se ${selectedMonth} ki DCR Excel live download ho rahi hai...`);

    const cfg = MONTH_OPTIONS.find(m => m.value === selectedMonth) || MONTH_OPTIONS[4];

    try {
      const res = await fetch('/api/fetch-dcr-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_month: selectedMonth,
          to_month: selectedMonth,
          fy_year: '2026-2027'
        })
      });

      if (!res.ok) throw new Error(`Server returned error: ${res.status}`);

      const arrayBuffer = await res.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      let dateCol = 4;
      let workTypeCol = 6;
      let tpRouteCol = 12;
      let workedRouteCol = 13;
      let drCallsCol = 24;
      let remarkCol = 46;
      let employeeCol = 38;
      let startRow = 0;

      for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
        const rowStr = (rawRows[r] || []).join(' ').toUpperCase();
        if (rowStr.includes('SRNO') || rowStr.includes('EMPLOYEE') || rowStr.includes('DATE')) {
          startRow = r + 1;
          (rawRows[r] || []).forEach((cell: any, idx: number) => {
            const c = String(cell || '').trim().toUpperCase();
            if (c === 'DATE') dateCol = idx;
            if (c.includes('WORKING TYPE')) workTypeCol = idx;
            if (c.includes('TP ROUTE')) tpRouteCol = idx;
            if (c.includes('WORKED ROUTE')) workedRouteCol = idx;
            if (c.includes('TOTAL DR') || c.includes('DR. CALLS')) drCallsCol = idx;
            if (c.includes('REMARK')) remarkCol = idx;
            if (c.includes('EMPLOYEE') && idx > 20) employeeCol = idx;
          });
          break;
        }
      }

      const cboMap: Record<number, any> = {};
      for (let r = startRow; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length < 5) continue;
        const dateVal = String(row[dateCol] || '');
        if (dateVal && dateVal.includes('/')) {
          const dNum = parseInt(dateVal.split('/')[0]);
          if (!isNaN(dNum)) {
            const empName = String(row[employeeCol] || '').toUpperCase();
            cboMap[dNum] = {
              workType: String(row[workTypeCol] || '').trim(),
              tpRoute: String(row[tpRouteCol] || '').trim(),
              workedRoute: String(row[workedRouteCol] || '').trim(),
              drCalls: row[drCallsCol] !== undefined ? String(row[drCallsCol]).trim() : '',
              remark: String(row[remarkCol] || '').trim(),
              withManager: empName.includes('AVINASH') || empName.includes('MANAGER') || empName.includes('SONI')
            };
          }
        }
      }

      const populated = buildEmptyMonth(cfg).map(dayEntry => {
        const dNum = dayEntry.date;
        const cboInfo = cboMap[dNum];

        if (!cboInfo) {
          return dayEntry;
        }

        const wt = cboInfo.workType.toUpperCase();
        const routeText = (cboInfo.workedRoute + ' ' + cboInfo.tpRoute + ' ' + cboInfo.remark).toUpperCase();

        if (wt.includes('LEAVE')) {
          return { ...dayEntry, areaWorked: 'LEAVE', tpSubmitted: '', drsMet: '', chemistsMet: '', workType: 'Leave' };
        }
        if (wt.includes('HOLIDAY')) {
          return { ...dayEntry, areaWorked: cboInfo.remark || 'HOLIDAY', tpSubmitted: '', drsMet: '', chemistsMet: '', workType: 'Holiday' };
        }
        if (wt.includes('MEETING') || routeText.includes('MEETING') || routeText.includes('CONFERENCE') || routeText.includes('REVIEW')) {
          return { ...dayEntry, areaWorked: 'MEETING', tpSubmitted: cboInfo.tpRoute, drsMet: '', chemistsMet: '', workType: 'Meeting' };
        }
        if (wt.includes('TRANSIT') || routeText.includes('TRANSIT')) {
          return { ...dayEntry, areaWorked: 'TRANSIT', tpSubmitted: cboInfo.tpRoute, drsMet: '', chemistsMet: '', workType: 'Transit' };
        }
        if (wt.includes('ADMIN') || routeText.includes('ADMIN')) {
          return { ...dayEntry, areaWorked: 'ADMIN', tpSubmitted: cboInfo.tpRoute, drsMet: '', chemistsMet: '', workType: 'Admin' };
        }

        const drCount = parseFloat(cboInfo.drCalls) || 0;
        return {
          ...dayEntry,
          areaWorked: cboInfo.workedRoute || 'UDAIPUR',
          tpSubmitted: cboInfo.tpRoute || 'UDAIPUR',
          drsMet: drCount > 0 ? drCount : 0,
          chemistsMet: 10,
          withManager: cboInfo.withManager || false,
          workType: 'Working'
        };
      });

      setEntries(populated);
      memoryStore.dcrDataByMonth[cfg.code] = populated;
      memoryStore.lastSyncedMonthCode = cfg.code;

      setStatusMsg(`🎉 SUCCESS! ${selectedMonth} ka DCR CBO se live fetch hokar auto-fill ho gaya!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'CBO se DCR fetch karne me error aaya.');
      setStatusMsg('');
    } finally {
      setLoading(false);
    }
  };

  const totalDrs = entries.reduce((sum, e) => sum + (parseFloat(String(e.drsMet)) || 0), 0);
  const totalChemists = entries.reduce((sum, e) => sum + (parseFloat(String(e.chemistsMet)) || 0), 0);
  const activeFwDays = entries.filter(e => {
    const a = String(e.areaWorked).toUpperCase();
    return a && !a.includes('LEAVE') && !a.includes('HOLIDAY') && !a.includes('SUNDAY') && !a.includes('DAY') && !a.includes('BANDHAN') && !a.includes('MEETING') && !a.includes('TRANSIT') && !a.includes('ADMIN');
  }).length;

  const handleSave = () => {
    const opt = MONTH_OPTIONS.find(m => m.value === selectedMonth);
    if (opt) memoryStore.dcrDataByMonth[opt.code] = entries;
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportCSV = () => {
    let csv = `BE NAME: BANWARI LAL MEENA,HQ NAME: UDAIPUR,MONTH: ${selectedMonth}\n`;
    csv += `DATE,Day,AREA WORKED,TP Submitted ,No. of Dr's Met,No. of Chemists/Stockiest Met\n`;
    entries.forEach(e => {
      csv += `${e.date},${e.day},${e.areaWorked},${e.tpSubmitted},${e.drsMet},${e.chemistsMet}\n`;
    });
    csv += `TOTAL,,${activeFwDays} Active Days,,${totalDrs},${totalChemists}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `2_MONTH_FW_PROGRESS_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Calendar size={22} />
          </span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              2. MONTH FIELD WORK PROGRESS
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                Live CBO Excel Sync
              </span>
            </h2>
            <p className="text-xs text-slate-400">BE: BANWARI LAL MEENA • HQ: UDAIPUR • {selectedMonth}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Month:</span>
            <select
              value={selectedMonth}
              onChange={e => handleMonthSelect(e.target.value)}
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

          <button
            onClick={handleFetchFromCbo}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
            {loading ? 'Fetching CBO Excel...' : '⚡ Auto-Fetch DCR'}
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-700"
          >
            {savedSuccess ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
            {savedSuccess ? 'Saved' : 'Save'}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Download size={14} /> Export CSV
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

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
          <div className="text-[11px] text-slate-400 uppercase">Field Work Days</div>
          <div className="text-xl font-bold text-white font-mono">{activeFwDays} Days</div>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
          <div className="text-[11px] text-cyan-400 uppercase">Total Dr's Met</div>
          <div className="text-xl font-bold text-cyan-400 font-mono">{totalDrs}</div>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
          <div className="text-[11px] text-emerald-400 uppercase">Total Chemists Met</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">{totalChemists}</div>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[550px] border border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
            <tr>
              <th className="p-2.5 text-center w-14">Date</th>
              <th className="p-2.5 min-w-[120px]">Day</th>
              <th className="p-2.5 min-w-[180px]">Area Worked</th>
              <th className="p-2.5 min-w-[140px]">TP Submitted</th>
              <th className="p-2.5 text-center min-w-[100px] text-cyan-400">No. of Dr's Met</th>
              <th className="p-2.5 text-center min-w-[120px] text-emerald-400">No. of Chemists Met</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {entries.map((item, idx) => {
              const isSunday = item.day === 'SUNDAY';
              const isLeave = String(item.areaWorked).toUpperCase().includes('LEAVE');
              const isHoliday = String(item.areaWorked).toUpperCase().includes('DAY') || String(item.areaWorked).toUpperCase().includes('BANDHAN') || String(item.areaWorked).toUpperCase().includes('HOLIDAY');
              const isMeeting = String(item.areaWorked).toUpperCase().includes('MEETING') || String(item.areaWorked).toUpperCase().includes('ADMIN') || String(item.areaWorked).toUpperCase().includes('TRANSIT');

              return (
                <tr key={item.date} className={`transition ${
                  isSunday ? 'bg-rose-950/20' : isLeave ? 'bg-amber-950/20' : isHoliday ? 'bg-purple-950/20' : isMeeting ? 'bg-blue-950/30' : 'hover:bg-slate-800/40'
                }`}>
                  <td className="p-2 text-center text-slate-400 font-mono font-bold bg-slate-950/40">{item.date}</td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={item.day}
                      onChange={e => handleCellChange(idx, 'day', e.target.value)}
                      className={`w-full py-1.5 px-2 bg-slate-950 rounded-lg font-bold border border-slate-800 focus:border-cyan-500 focus:outline-none uppercase text-xs ${
                        isSunday ? 'text-rose-400' : 'text-slate-300'
                      }`}
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={item.areaWorked}
                      onChange={e => handleCellChange(idx, 'areaWorked', e.target.value)}
                      placeholder="Area / Station"
                      className={`w-full py-1.5 px-2 bg-slate-950 rounded-lg font-semibold border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs ${
                        isSunday ? 'text-rose-400' : isLeave ? 'text-amber-400' : isHoliday ? 'text-purple-400' : isMeeting ? 'text-blue-400 font-bold' : 'text-white'
                      }`}
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={item.tpSubmitted}
                      onChange={e => handleCellChange(idx, 'tpSubmitted', e.target.value)}
                      placeholder="-"
                      className="w-full py-1.5 px-2 bg-slate-950 rounded-lg text-slate-300 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={item.drsMet}
                      onChange={e => handleCellChange(idx, 'drsMet', e.target.value)}
                      placeholder="-"
                      className="w-full py-1.5 px-2 bg-slate-950 rounded-lg font-mono font-bold text-cyan-400 border border-slate-800 focus:border-cyan-500 focus:outline-none text-center text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={item.chemistsMet}
                      onChange={e => handleCellChange(idx, 'chemistsMet', e.target.value)}
                      placeholder="-"
                      className="w-full py-1.5 px-2 bg-slate-950 rounded-lg font-mono font-bold text-emerald-400 border border-slate-800 focus:border-cyan-500 focus:outline-none text-center text-xs"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-cyan-500/40 font-bold z-10">
            <tr>
              <td className="p-3 text-center text-cyan-400 font-mono">Σ</td>
              <td className="p-3 text-white">TOTAL</td>
              <td className="p-3 text-slate-300 font-mono">{activeFwDays} Active Days</td>
              <td className="p-3 text-slate-500">-</td>
              <td className="p-3 text-center font-mono text-cyan-300 text-sm">{totalDrs}</td>
              <td className="p-3 text-center font-mono text-emerald-300 text-sm">{totalChemists}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
