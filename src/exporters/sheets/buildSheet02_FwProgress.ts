import { standardTheme, borderThin } from '../styles/standardTheme';
import { memoryStore, FwDayEntry } from '../../data/memoryStore';

export function buildSheet02_FwProgress(data?: any) {
  const hqName = data?.hqName || memoryStore.hqName || 'UDAIPUR';
  const selectedMonth = data?.selectedMonth || memoryStore.currentDcrMonth || 'Aug-2026';
  const monthCode = selectedMonth.substring(0, 3).toUpperCase();
  const entries: FwDayEntry[] = data?.dcrDataByMonth?.[monthCode] || memoryStore.dcrDataByMonth?.[monthCode] || [];

  const wsData: any[][] = [];

  // ROW 1: Blank Spacer
  wsData.push([
    { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, 
    { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }
  ]);

  // ROW 2: HQ NAME (Left) & MONTH FIELD WORK PROGRESS (Right Cols E-F)
  wsData.push([
    { v: `HQ NAME: ${hqName}`, s: { font: { name: 'Calibri', sz: 10, bold: true }, alignment: { horizontal: 'left', vertical: 'center' } } },
    { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} },
    { v: 'MONTH FIELD WORK PROGRESS', s: standardTheme.headerPlainBold },
    { v: '', s: standardTheme.headerPlainBold }
  ]);

  // ROW 3: NEED TO SEND WEEKLY TO REPORTING MANAGER (Cols E-F)
  wsData.push([
    { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} }, { v: '', s: {} },
    { v: 'NEED TO SEND WEEKLY TO REPORTING MANAGER', s: standardTheme.headerPlainSmall },
    { v: '', s: standardTheme.headerPlainSmall }
  ]);

  // ROW 4: Table Headers
  wsData.push([
    { v: 'DATE', s: standardTheme.colHeader },
    { v: 'Day', s: standardTheme.colHeader },
    { v: 'AREA WORKED', s: standardTheme.colHeader },
    { v: 'TP Submitted', s: standardTheme.colHeader },
    { v: "No. of Dr's Met", s: standardTheme.colHeader },
    { v: 'No. of Chemists/Stockiest Met', s: standardTheme.colHeader }
  ]);

  // Day Rows (1 to 31)
  // If entries exist, use them. Otherwise generate standard 31 days.
  const totalDays = entries.length > 0 ? entries.length : 31;

  for (let i = 0; i < totalDays; i++) {
    const entry = entries[i] || {
      date: i + 1,
      day: '',
      areaWorked: '',
      tpSubmitted: '',
      drsMet: '',
      chemistsMet: ''
    };

    const isSunday = String(entry.day).toUpperCase() === 'SUNDAY' || String(entry.areaWorked).toUpperCase() === 'SUNDAY';

    if (isSunday) {
      // 🛑 Solid Maroon Bar for Sunday row (Cols A to F)
      wsData.push([
        { v: '', s: standardTheme.sundayBar },
        { v: '', s: standardTheme.sundayBar },
        { v: '', s: standardTheme.sundayBar },
        { v: '', s: standardTheme.sundayBar },
        { v: '', s: standardTheme.sundayBar },
        { v: '', s: standardTheme.sundayBar }
      ]);
    } else {
      wsData.push([
        { v: entry.date, s: standardTheme.cellCenter },
        { v: entry.day || '', s: standardTheme.cellCenter },
        { v: entry.areaWorked || '', s: standardTheme.cellCenter },
        { v: entry.tpSubmitted || '', s: standardTheme.cellCenter },
        { v: entry.drsMet !== '' && entry.drsMet !== undefined ? entry.drsMet : '', s: standardTheme.cellCenter },
        { v: entry.chemistsMet !== '' && entry.chemistsMet !== undefined ? entry.chemistsMet : '', s: standardTheme.cellCenter }
      ]);
    }
  }

  return {
    wsData,
    sheetName: '2_MONTH FW PROGRESS',
    merges: [
      { s: { r: 1, c: 4 }, e: { r: 1, c: 5 } }, // MONTH FIELD WORK PROGRESS merge E2:F2
      { s: { r: 2, c: 4 }, e: { r: 2, c: 5 } }, // NEED TO SEND WEEKLY merge E3:F3
    ],
    cols: [
      { wch: 8 },  // DATE
      { wch: 14 }, // Day
      { wch: 18 }, // AREA WORKED
      { wch: 18 }, // TP Submitted
      { wch: 16 }, // No. of Dr's Met
      { wch: 26 }  // No. of Chemists/Stockiest Met
    ]
  };
}
