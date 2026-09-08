import * as XLSX from 'xlsx-js-style';
import { buildSheet01_EffortLevel } from './sheets/buildSheet01_EffortLevel';
import { buildSheet02_FwProgress } from './sheets/buildSheet02_FwProgress';
import { buildSheet03_SalesPerformance } from './sheets/buildSheet03_SalesPerformance';
import { buildSheet04_UnSalesProg } from './sheets/buildSheet04_UnSalesProg';
import { buildSheet05_NearByExpiry } from './sheets/buildSheet05_NearByExpiry';
import { buildSheet06_Commitment } from './sheets/buildSheet06_Commitment';
import { buildSheet07_Wcfyh } from './sheets/buildSheet07_Wcfyh';
import { buildSheet08_A2Ghee } from './sheets/buildSheet08_A2Ghee';
import { buildSheet09_TableTop } from './sheets/buildSheet09_TableTop';
import { buildSheet10_Glucometer } from './sheets/buildSheet10_Glucometer';
import { buildSheet11_SpecialFocused } from './sheets/buildSheet11_SpecialFocused';
import { buildSheet12_FocusedBrands } from './sheets/buildSheet12_FocusedBrands';
import { buildSheet13_Roi } from './sheets/buildSheet13_Roi';
import { buildSheet14_Msl } from './sheets/buildSheet14_Msl';

export async function generateMasterReviewWorkbook() {
  let sheet01Data = null;
  let sheet02Data = null;
  let sheet03Data = null;
  let sheet04Data = null;
  let sheet05Data = null;
  let sheet06Data = null;
  let sheet07Data = null;
  let sheet08Data = null;
  let sheet09Data = null;
  let sheet10Data = null;
  let sheet11Data = null;
  let sheet12Data = null;
  let sheet13Data = null;
  let sheet14Data = null;

  try {
    const [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14] = await Promise.all([
      fetch('/api/cloud-storage?key=review/sheet_01_effort_level').then(r => r.json()),
      fetch('/api/cloud-storage?key=review/sheet_02_fw_progress').then(r => r.json()),
      fetch('/api/cloud-storage?key=review/sheet_03_sales_performance').then(r => r.json()),
      fetch('/api/cloud-storage?key=review/sheet_04_un_sales_progression').then(r => r.json()),
      fetch('/api/cloud-storage?key=review/sheet_05_near_by_expiry').then(r => r.json()),
      fetch('/api/cloud-storage?key=review/sheet_06_commitment').then(r => r.json()),
      fetch('/api/cloud-storage?key=campaigns/sheet_07_wcfyh').then(r => r.json()),
      fetch('/api/cloud-storage?key=campaigns/sheet_08_a2_ghee_valros').then(r => r.json()),
      fetch('/api/cloud-storage?key=campaigns/sheet_09_table_top').then(r => r.json()),
      fetch('/api/cloud-storage?key=campaigns/sheet_10_glucometer').then(r => r.json()),
      fetch('/api/cloud-storage?key=review/sheet_11_special_focused').then(r => r.json()),
      fetch('/api/cloud-storage?key=review/sheet_12_focused_brands').then(r => r.json()),
      fetch('/api/cloud-storage?key=review/sheet_13_roi').then(r => r.json()),
      fetch('/api/cloud-storage?key=review/sheet_14_msl_schedule').then(r => r.json())
    ]);
    if (r1.success && r1.data) sheet01Data = r1.data;
    if (r2.success && r2.data) sheet02Data = r2.data;
    if (r3.success && r3.data) sheet03Data = r3.data;
    if (r4.success && r4.data) sheet04Data = r4.data;
    if (r5.success && r5.data) sheet05Data = r5.data;
    if (r6.success && r6.data) sheet06Data = r6.data;
    if (r7.success && r7.data) sheet07Data = r7.data;
    if (r8.success && r8.data) sheet08Data = r8.data;
    if (r9.success && r9.data) sheet09Data = r9.data;
    if (r10.success && r10.data) sheet10Data = r10.data;
    if (r11.success && r11.data) sheet11Data = r11.data;
    if (r12.success && r12.data) sheet12Data = r12.data;
    if (r13.success && r13.data) sheet13Data = r13.data;
    if (r14.success && r14.data) sheet14Data = r14.data;
  } catch (e) {}

  const wb = XLSX.utils.book_new();

  // 🌟 APPEND ALL 14 SHEETS (COMPLETE 14-IN-1 WORKBOOK)
  const s1 = buildSheet01_EffortLevel(sheet01Data);
  const ws1 = XLSX.utils.aoa_to_sheet(s1.wsData);
  ws1['!merges'] = s1.merges; ws1['!cols'] = s1.cols;
  XLSX.utils.book_append_sheet(wb, ws1, s1.sheetName);

  const s2 = buildSheet02_FwProgress(sheet02Data);
  const ws2 = XLSX.utils.aoa_to_sheet(s2.wsData);
  ws2['!merges'] = s2.merges; ws2['!cols'] = s2.cols;
  XLSX.utils.book_append_sheet(wb, ws2, s2.sheetName);

  const s3 = buildSheet03_SalesPerformance(sheet03Data);
  const ws3 = XLSX.utils.aoa_to_sheet(s3.wsData);
  ws3['!merges'] = s3.merges; ws3['!cols'] = s3.cols;
  XLSX.utils.book_append_sheet(wb, ws3, s3.sheetName);

  const s4 = buildSheet04_UnSalesProg(sheet04Data);
  const ws4 = XLSX.utils.aoa_to_sheet(s4.wsData);
  ws4['!merges'] = s4.merges; ws4['!cols'] = s4.cols;
  XLSX.utils.book_append_sheet(wb, ws4, s4.sheetName);

  const s5 = buildSheet05_NearByExpiry(sheet05Data);
  const ws5 = XLSX.utils.aoa_to_sheet(s5.wsData);
  ws5['!merges'] = s5.merges; ws5['!cols'] = s5.cols;
  XLSX.utils.book_append_sheet(wb, ws5, s5.sheetName);

  const s6 = buildSheet06_Commitment(sheet06Data);
  const ws6 = XLSX.utils.aoa_to_sheet(s6.wsData);
  ws6['!merges'] = s6.merges; ws6['!cols'] = s6.cols;
  XLSX.utils.book_append_sheet(wb, ws6, s6.sheetName);

  const s7 = buildSheet07_Wcfyh(sheet07Data);
  const ws7 = XLSX.utils.aoa_to_sheet(s7.wsData);
  ws7['!merges'] = s7.merges; ws7['!cols'] = s7.cols;
  XLSX.utils.book_append_sheet(wb, ws7, s7.sheetName);

  const s8 = buildSheet08_A2Ghee(sheet08Data);
  const ws8 = XLSX.utils.aoa_to_sheet(s8.wsData);
  ws8['!merges'] = s8.merges; ws8['!cols'] = s8.cols;
  XLSX.utils.book_append_sheet(wb, ws8, s8.sheetName);

  const s9 = buildSheet09_TableTop(sheet09Data);
  const ws9 = XLSX.utils.aoa_to_sheet(s9.wsData);
  ws9['!merges'] = s9.merges; ws9['!cols'] = s9.cols;
  XLSX.utils.book_append_sheet(wb, ws9, s9.sheetName);

  const s10 = buildSheet10_Glucometer(sheet10Data);
  const ws10 = XLSX.utils.aoa_to_sheet(s10.wsData);
  ws10['!merges'] = s10.merges; ws10['!cols'] = s10.cols;
  XLSX.utils.book_append_sheet(wb, ws10, s10.sheetName);

  const s11 = buildSheet11_SpecialFocused(sheet11Data);
  const ws11 = XLSX.utils.aoa_to_sheet(s11.wsData);
  ws11['!merges'] = s11.merges; ws11['!cols'] = s11.cols; ws11['!rows'] = s11.rows;
  XLSX.utils.book_append_sheet(wb, ws11, s11.sheetName);

  const s12 = buildSheet12_FocusedBrands(sheet12Data);
  const ws12 = XLSX.utils.aoa_to_sheet(s12.wsData);
  ws12['!merges'] = s12.merges; ws12['!cols'] = s12.cols; ws12['!rows'] = s12.rows;
  XLSX.utils.book_append_sheet(wb, ws12, s12.sheetName);

  const s13 = buildSheet13_Roi(sheet13Data);
  const ws13 = XLSX.utils.aoa_to_sheet(s13.wsData);
  ws13['!merges'] = s13.merges; ws13['!cols'] = s13.cols; ws13['!rows'] = s13.rows;
  XLSX.utils.book_append_sheet(wb, ws13, s13.sheetName);

  // 14. Sheet 14: MSL Schedule (Yellow Visit Dates + Navy Blue Headers + Yellow Doctor Highlight)
  const s14 = buildSheet14_Msl(sheet14Data);
  const ws14 = XLSX.utils.aoa_to_sheet(s14.wsData);
  ws14['!merges'] = s14.merges; ws14['!cols'] = s14.cols; ws14['!rows'] = s14.rows;
  XLSX.utils.book_append_sheet(wb, ws14, s14.sheetName);

  // 📥 Instant Download (14 Tabs Single Consolidated Workbook!)
  const filename = `DIOS_Performance_Review_Master_2026.xlsx`;
  XLSX.writeFile(wb, filename);
}
