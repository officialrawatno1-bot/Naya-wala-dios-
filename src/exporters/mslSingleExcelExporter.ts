import * as XLSX from 'xlsx-js-style';
import { buildSheet14_Msl } from './sheets/buildSheet14_Msl';

export function exportSingleMslExcel(customDoctors?: any[], customRules?: any[], sortMode?: string) {
  const wb = XLSX.utils.book_new();

  const s14 = buildSheet14_Msl({
    doctors: customDoctors,
    customPriorityRules: customRules,
    sortMode: sortMode
  });

  const ws14 = XLSX.utils.aoa_to_sheet(s14.wsData);
  ws14['!merges'] = s14.merges;
  ws14['!cols'] = s14.cols;
  ws14['!rows'] = s14.rows;

  XLSX.utils.book_append_sheet(wb, ws14, s14.sheetName);

  const filename = `14_MSL_Schedule_2026.xlsx`;
  XLSX.writeFile(wb, filename);
}
