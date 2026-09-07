import React, { useState } from 'react';
import { Activity, Save, Download, Check, User, MapPin, Zap } from 'lucide-react';
import { memoryStore, FwDayEntry } from '../../data/memoryStore';

const MONTHS = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];

const MONTH_METADATA: Record<string, { year: number; monthIdx: number; days: number }> = {
  APR: { year: 2026, monthIdx: 3, days: 30 },
  MAY: { year: 2026, monthIdx: 4, days: 31 },
  JUN: { year: 2026, monthIdx: 5, days: 30 },
  JUL: { year: 2026, monthIdx: 6, days: 31 },
  AUG: { year: 2026, monthIdx: 7, days: 31 },
  SEP: { year: 2026, monthIdx: 8, days: 30 },
  OCT: { year: 2026, monthIdx: 9, days: 31 },
  NOV: { year: 2026, monthIdx: 10, days: 30 },
  DEC: { year: 2026, monthIdx: 11, days: 31 },
  JAN: { year: 2027, monthIdx: 0, days: 31 },
  FEB: { year: 2027, monthIdx: 1, days: 28 },
  MAR: { year: 2027, monthIdx: 2, days: 31 },
};

// Calculate exact number of Sundays in any given month
export const getSundaysCount = (monthCode: string): number => {
  const meta = MONTH_METADATA[monthCode];
  if (!meta) return 4;
  let count = 0;
  for (let d = 1; d <= meta.days; d++) {
    const dt = new Date(meta.year, meta.monthIdx, d);
    if (dt.getDay() === 0) count++;
  }
  return count;
};

// 🧠 Smart Slash Parser: '1/1/1' -> 3, '1/0/0' -> 1, '0/0/0' -> 0, or number '2' -> 2
export const parseSlashSum = (val: string | number | undefined): number => {
  if (val === undefined || val === null) return 0;
  const s = String(val).trim();
  if (!s || s === '-' || s === '#DIV/0!') return 0;
  if (s.includes('/')) {
    return s.split('/').reduce((acc, part) => {
      const num = parseFloat(part.trim());
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }
  const direct = parseFloat(s);
  return isNaN(direct) ? 0 : direct;
};

interface RowConfig {
  sn: number;
  id: string;
  title: string;
  isCalculated?: boolean;
}

const ROW_DEFINITIONS: RowConfig[] = [
  { sn: 1, id: 'days_in_month', title: 'NO. OF DAYS IN MONTH' },
  { sn: 2, id: 'avail_fw_days', title: 'NO. OF AVAILABLE F.W. DAYS', isCalculated: true },
  { sn: 3, id: 'actual_fw_days', title: 'NO. OF ACTUAL F.W. DAYS', isCalculated: true },
  { sn: 4, id: 'days_on_leave', title: 'NO. OF DAYS ON LEAVE' },
  { sn: 5, id: 'holidays', title: 'NO. OF DAYS OF HOLIDAYS' },
  { sn: 6, id: 'meeting_admin_transit', title: 'NO. OF DAYS MEETING/ ADMIN /TRANSIT' },
  { sn: 7, id: 'total_dr_calls', title: 'TOTAL NO. OF DR. CALL' },
  { sn: 8, id: 'dr_call_avg', title: 'DR. CALL AVERAGE', isCalculated: true },
  { sn: 9, id: 'total_chemist_calls', title: 'TOTAL NO. OF CHEMIST CALL' },
  { sn: 10, id: 'chemist_call_avg', title: 'CHEMIST CALL AVERAGE', isCalculated: true },
  { sn: 11, id: 'activities', title: 'NO. OF ACTIVITIES (CAMP, DOB, DOA, RTM, DINNER, CME)' },
  { sn: 12, id: 'dr_conversion', title: 'NO. OF DR. CONVERSION IN AREA' },
  { sn: 13, id: 'drs_added_new_brand', title: 'NO. OF DRS. ADDED NEW BRAND' },
  { sn: 14, id: 'drs_stopped', title: 'NO. OF DRS. STOPPED' },
  { sn: 15, id: 'fw_days_with_manager', title: 'NO. OF F.W. DAYS WITH MANAGER' },
  { sn: 16, id: 'fw_days_independent', title: 'NO. OF F.W. DAYS INDEPENDENT', isCalculated: true },
];

const INITIAL_BASE: Record<string, Record<string, string>> = {
  days_in_month: { APR: '30', MAY: '31', JUN: '30', JUL: '31', AUG: '31', SEP: '30', OCT: '31', NOV: '30', DEC: '31', JAN: '31', FEB: '28', MAR: '31' },
  avail_fw_days: { APR: '', MAY: '', JUN: '', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  actual_fw_days: { APR: '', MAY: '', JUN: '', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  days_on_leave: { APR: '0', MAY: '1', JUN: '1', JUL: '1', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  holidays: { APR: '0', MAY: '1', JUN: '0', JUL: '0', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  meeting_admin_transit: { APR: '0/0/0', MAY: '1/0/0', JUN: '1/0/0/0', JUL: '1/1/0/0', AUG: '0/0/0', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  total_dr_calls: { APR: '239', MAY: '209', JUN: '213', JUL: '208', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  dr_call_avg: { APR: '', MAY: '', JUN: '', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  total_chemist_calls: { APR: '234', MAY: '208', JUN: '250', JUL: '239', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  chemist_call_avg: { APR: '', MAY: '', JUN: '', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  activities: { APR: '2/2/4/0/0/0', MAY: '2/6/5/0/0/0', JUN: '3/4/1/0/0/0', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  dr_conversion: { APR: '', MAY: '1', JUN: '1', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  drs_added_new_brand: { APR: '', MAY: '', JUN: '', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  drs_stopped: { APR: '', MAY: '', JUN: '', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  fw_days_with_manager: { APR: '6', MAY: '3', JUN: '3', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
  fw_days_independent: { APR: '', MAY: '', JUN: '', JUL: '', AUG: '', SEP: '', OCT: '', NOV: '', DEC: '', JAN: '', FEB: '', MAR: '' },
};

export const EffortLevelSheet: React.FC = () => {
  const [beName, setBeName] = useState(() => memoryStore.beName || 'BANWARI LAL MEENA');
  const [hqName, setHqName] = useState(() => memoryStore.hqName || 'UDAIPUR');
  
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>(() => {
    return memoryStore.effortLevelData || INITIAL_BASE;
  });

  const detectedMonthCode = memoryStore.lastSyncedMonthCode || 'AUG';
  const [targetMonth, setTargetMonth] = useState(detectedMonthCode);
  const [syncedAlert, setSyncedAlert] = useState<string | null>(null);

  const handleCellChange = (rowId: string, month: string, value: string) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [rowId]: {
          ...prev[rowId],
          [month]: value
        }
      };
      memoryStore.effortLevelData = updated;
      return updated;
    });
  };

  // 1️⃣ NO. OF AVAILABLE F.W. DAYS = Total Days - Sundays - Holidays (ONLY Sunday & Holiday minus)
  const getAvailFwDaysNum = (month: string): number => {
    const totalDays = parseFloat(formData.days_in_month?.[month] || '') || (MONTH_METADATA[month]?.days || 30);
    const sundays = getSundaysCount(month);
    const holidays = parseSlashSum(formData.holidays?.[month]);
    return Math.max(0, totalDays - sundays - holidays);
  };

  // 2️⃣ NO. OF ACTUAL F.W. DAYS = Available Days - Leaves - Meeting/Admin/Transit
  const getActualFwDaysNum = (month: string): number => {
    const availDays = getAvailFwDaysNum(month);
    const leaves = parseSlashSum(formData.days_on_leave?.[month]);
    const meetingTransit = parseSlashSum(formData.meeting_admin_transit?.[month]);
    return Math.max(0, availDays - leaves - meetingTransit);
  };

  // 🧠 Cell Value Calculator
  const calculateCell = (rowId: string, month: string): string => {
    if (rowId === 'avail_fw_days') {
      const avail = getAvailFwDaysNum(month);
      return avail > 0 ? String(avail) : '-';
    }
    if (rowId === 'actual_fw_days') {
      const actual = getActualFwDaysNum(month);
      return actual > 0 ? String(actual) : '-';
    }
    if (rowId === 'dr_call_avg') {
      const calls = parseFloat(formData.total_dr_calls?.[month] || '0') || 0;
      const days = getActualFwDaysNum(month);
      return days > 0 ? (calls / days).toFixed(1) : '-';
    }
    if (rowId === 'chemist_call_avg') {
      const calls = parseFloat(formData.total_chemist_calls?.[month] || '0') || 0;
      const days = getActualFwDaysNum(month);
      return days > 0 ? (calls / days).toFixed(1) : '-';
    }
    if (rowId === 'fw_days_independent') {
      const actual = getActualFwDaysNum(month);
      const manager = parseFloat(formData.fw_days_with_manager?.[month] || '0') || 0;
      return actual > 0 ? String(Math.max(0, actual - manager)) : '-';
    }
    return formData[rowId]?.[month] || '';
  };

  // 🧠 Cumulative (CUMM) Calculator
  const calculateCumm = (rowId: string): string => {
    if (rowId === 'avail_fw_days') {
      let total = 0;
      MONTHS.forEach(m => { total += getAvailFwDaysNum(m); });
      return total > 0 ? String(total) : '-';
    }
    if (rowId === 'actual_fw_days') {
      let total = 0;
      MONTHS.forEach(m => { total += getActualFwDaysNum(m); });
      return total > 0 ? String(total) : '-';
    }
    if (rowId === 'dr_call_avg') {
      let totalCalls = 0;
      let totalDays = 0;
      MONTHS.forEach(m => {
        totalCalls += parseFloat(formData.total_dr_calls?.[m] || '0') || 0;
        totalDays += getActualFwDaysNum(m);
      });
      return totalDays > 0 ? (totalCalls / totalDays).toFixed(1) : '0';
    }
    if (rowId === 'chemist_call_avg') {
      let totalCalls = 0;
      let totalDays = 0;
      MONTHS.forEach(m => {
        totalCalls += parseFloat(formData.total_chemist_calls?.[m] || '0') || 0;
        totalDays += getActualFwDaysNum(m);
      });
      return totalDays > 0 ? (totalCalls / totalDays).toFixed(1) : '0';
    }
    if (rowId === 'fw_days_independent') {
      let totalActual = 0;
      let totalManager = 0;
      MONTHS.forEach(m => {
        totalActual += getActualFwDaysNum(m);
        totalManager += parseFloat(formData.fw_days_with_manager?.[m] || '0') || 0;
      });
      return totalActual > 0 ? String(Math.max(0, totalActual - totalManager)) : '-';
    }

    let sum = 0;
    let hasNumeric = false;
    MONTHS.forEach(m => {
      const num = parseSlashSum(formData[rowId]?.[m]);
      if (num > 0) {
        sum += num;
        hasNumeric = true;
      }
    });

    return hasNumeric ? String(sum) : '-';
  };

  // 🧠 1000 IQ: Auto-Fill strictly the matching month column from FW Progress
  const handleAutoFillFromFwProgress = () => {
    const fwEntries: FwDayEntry[] = memoryStore.dcrDataByMonth[targetMonth];

    if (!fwEntries || fwEntries.length === 0) {
      alert(`⚠️ '${targetMonth}' ka koi FW Progress data memory mein nahi hai! Pehle 'FW Progress' tab me jakar ${targetMonth} ka data fetch karein.`);
      return;
    }

    const totalDays = fwEntries.length;
    let holidays = 0;
    let leaves = 0;
    let meetings = 0;
    let admin = 0;
    let transit = 0;
    let totalDrCalls = 0;
    let totalChemistCalls = 0;
    let managerDays = 0;

    fwEntries.forEach(entry => {
      const area = String(entry.areaWorked || '').toUpperCase();
      const wt = String(entry.workType || '').toUpperCase();

      if (entry.day === 'SUNDAY') {
        // Handled automatically by calendar formula
      } else if (wt.includes('HOLIDAY') || area.includes('HOLIDAY') || area.includes('DAY') || area.includes('BANDHAN')) {
        holidays++;
      } else if (wt.includes('LEAVE') || area.includes('LEAVE')) {
        leaves++;
      } else if (wt.includes('MEETING') || area.includes('MEETING')) {
        meetings++;
      } else if (wt.includes('ADMIN') || area.includes('ADMIN')) {
        admin++;
      } else if (wt.includes('TRANSIT') || area.includes('TRANSIT')) {
        transit++;
      } else if (area !== '') {
        totalDrCalls += parseFloat(String(entry.drsMet)) || 0;
        totalChemistCalls += parseFloat(String(entry.chemistsMet)) || 0;
        if (entry.withManager) managerDays++;
      }
    });

    const meetingSlashString = `${meetings}/${admin}/${transit}`;

    setFormData(prev => {
      const updated = {
        ...prev,
        days_in_month: { ...prev.days_in_month, [targetMonth]: String(totalDays) },
        days_on_leave: { ...prev.days_on_leave, [targetMonth]: String(leaves) },
        holidays: { ...prev.holidays, [targetMonth]: String(holidays) },
        meeting_admin_transit: { ...prev.meeting_admin_transit, [targetMonth]: meetingSlashString },
        total_dr_calls: { ...prev.total_dr_calls, [targetMonth]: String(totalDrCalls) },
        total_chemist_calls: { ...prev.total_chemist_calls, [targetMonth]: String(totalChemistCalls) },
        fw_days_with_manager: { ...prev.fw_days_with_manager, [targetMonth]: String(managerDays) }
      };
      memoryStore.effortLevelData = updated;
      return updated;
    });

    const avail = totalDays - getSundaysCount(targetMonth) - holidays;
    const actual = avail - leaves - (meetings + admin + transit);

    setSyncedAlert(`🎉 SUCCESS! '${targetMonth}' Auto-Filled: Available = ${avail} (Sundays & Holidays deducted), Actual = ${actual} (Leaves & Meetings deducted)!`);
    setTimeout(() => setSyncedAlert(null), 3500);
  };

  const handleExportCSV = () => {
    let csv = `BE Name - ,${beName},FIELD WORK ACTIVITY,,,,,,,,,,,,\n`;
    csv += `H.Q- ,${hqName},,,,,,,,,,,,,,\n`;
    csv += `S.N.,PARTICULARS,${MONTHS.join(',')},CUMM\n`;

    ROW_DEFINITIONS.forEach(row => {
      const monthVals = MONTHS.map(m => row.isCalculated ? calculateCell(row.id, m) : (formData[row.id]?.[m] || ''));
      const cumm = calculateCumm(row.id);
      csv += `${row.sn},"${row.title}",${monthVals.join(',')},${cumm}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `1_EFFORT_LEVEL_${hqName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasFwDataForTarget = !!(memoryStore.dcrDataByMonth[targetMonth] && memoryStore.dcrDataByMonth[targetMonth].length > 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Activity size={22} />
          </span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              1. EFFORT LEVEL (Field Work Activity)
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                Formula Verified
              </span>
            </h2>
            <p className="text-xs text-slate-400">BE: {beName} • HQ: {hqName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-cyan-500/40 shadow-lg shadow-cyan-950/40">
            <span className="text-[11px] text-slate-400 pl-2 pr-1 font-semibold">Month:</span>
            <select
              value={targetMonth}
              onChange={e => setTargetMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-400 px-2 py-1 focus:outline-none cursor-pointer"
            >
              {MONTHS.map(m => (
                <option key={m} value={m} className="bg-slate-900 text-white">
                  {m} {memoryStore.dcrDataByMonth[m] ? '● (Data Ready)' : ''}
                </option>
              ))}
            </select>

            <button
              onClick={handleAutoFillFromFwProgress}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow ${
                hasFwDataForTarget 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/20'
              }`}
            >
              <Zap size={14} className={hasFwDataForTarget ? 'text-yellow-300 animate-pulse' : ''} />
              Auto-Fill {targetMonth} Column
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {syncedAlert && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <Check size={16} className="text-emerald-400 shrink-0" />
          <span>{syncedAlert}</span>
        </div>
      )}

      {/* Rules Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">1. Available Days:</span>
          <span className="text-slate-300">Days in Month − Sundays − Holidays</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">2. Actual FW Days:</span>
          <span className="text-slate-300">Available Days − Leaves − Meeting/Admin/Transit (1/1/1 = −3)</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
              <th className="p-3 w-10 text-center">S.N.</th>
              <th className="p-3 min-w-[260px]">Particulars</th>
              {MONTHS.map(m => (
                <th key={m} className={`p-3 text-center min-w-[75px] ${m === targetMonth ? 'text-cyan-400 bg-cyan-950/40 border-b-2 border-cyan-400' : ''}`}>
                  {m}
                </th>
              ))}
              <th className="p-3 text-center min-w-[80px] bg-emerald-950/40 text-emerald-300 font-bold">CUMM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {ROW_DEFINITIONS.map((row) => (
              <tr key={row.sn} className="hover:bg-slate-800/30 transition">
                <td className="p-2 text-center text-slate-500 font-mono">{row.sn}</td>
                <td className="p-2 font-medium text-slate-200">{row.title}</td>
                
                {MONTHS.map((m) => {
                  const val = row.isCalculated ? calculateCell(row.id, m) : (formData[row.id]?.[m] ?? '');
                  const isHighlight = m === targetMonth;

                  return (
                    <td key={m} className={`p-1 text-center ${isHighlight ? 'bg-cyan-950/20' : ''}`}>
                      {row.isCalculated ? (
                        <div className="w-full py-1.5 px-2 bg-slate-950/80 rounded-lg font-mono font-bold text-cyan-400 border border-slate-800/60 text-center">
                          {val}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleCellChange(row.id, m, e.target.value)}
                          placeholder="-"
                          className={`w-full py-1.5 px-2 bg-slate-950 rounded-lg font-mono text-slate-100 border border-slate-800 focus:border-cyan-500 focus:bg-slate-900 focus:outline-none text-center transition ${
                            isHighlight && val ? 'text-cyan-300 font-bold' : ''
                          }`}
                        />
                      )}
                    </td>
                  );
                })}

                <td className="p-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">
                  {calculateCumm(row.id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
