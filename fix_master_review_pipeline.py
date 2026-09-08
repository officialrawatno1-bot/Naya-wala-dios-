import os

print("==========================================================================")
print("🛠️ [FIXING MASTER REVIEW EXCEL PIPELINE] UPDATING EXPORTERS & WORKBOOK...")
print("==========================================================================")

# 1. Update masterReviewWorkbook.ts
master_workbook_code = """import * as XLSX from 'xlsx-js-style';
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
import { buildSheet16_ProductIncentive } from './sheets/buildSheet16_ProductIncentive';
import { memoryStore } from '../data/memoryStore';
import { unProgressionStore } from '../data/unProgressionStore';

export async function generateMasterReviewWorkbook() {
  let sheet01Data: any = null;
  let sheet02Data: any = null;
  let sheet03Data: any = null;
  let sheet04Data: any = null;
  let sheet05Data: any = null;
  let sheet06Data: any = null;
  let sheet07Data: any = null;
  let sheet08Data: any = null;
  let sheet09Data: any = null;
  let sheet10Data: any = null;
  let sheet11Data: any = null;
  let sheet12Data: any = null;
  let sheet13Data: any = null;
  let sheet14Data: any = null;
  let sheet16Data: any = null;

  // 🌟 STEP 1: PRIORITY #1 - Read directly from iPad LocalStorage & Active Memory first
  if (typeof window !== 'undefined') {
    try {
      const s01 = localStorage.getItem('dios_draft_sheet_01_effort_level');
      if (s01) sheet01Data = JSON.parse(s01);

      const s02 = localStorage.getItem('dios_draft_sheet_02_fw_progress');
      if (s02) sheet02Data = JSON.parse(s02);

      const s03 = localStorage.getItem('dios_draft_sheet_03_sales_perf');
      if (s03) sheet03Data = JSON.parse(s03);

      const s04 = localStorage.getItem('dios_un_sales_progression_v1');
      if (s04) sheet04Data = { progressionData: JSON.parse(s04) };

      const s05 = localStorage.getItem('dios_draft_sheet_05_expiry');
      if (s05) sheet05Data = JSON.parse(s05);

      const s06 = localStorage.getItem('dios_draft_sheet_06_commitment');
      if (s06) sheet06Data = JSON.parse(s06);

      const s07 = localStorage.getItem('dios_wcfyh_campaign_permanent_v2');
      if (s07) sheet07Data = { rows: JSON.parse(s07) };

      const s08 = localStorage.getItem('dios_a2_ghee_valros_permanent_v2');
      if (s08) sheet08Data = { rows: JSON.parse(s08) };

      const s09 = localStorage.getItem('dios_table_top_campaign_permanent_v2');
      const s09Title = localStorage.getItem('dios_table_top_title_permanent_v1');
      if (s09) sheet09Data = { sections: JSON.parse(s09), campaignTitle: s09Title || 'TABLE TOP CAMPAIGN' };

      const s10Docs = localStorage.getItem('dios_glucometer_camp_permanent_v1_docs');
      const s10Pats = localStorage.getItem('dios_glucometer_camp_permanent_v1_patients');
      if (s10Docs || s10Pats) {
        sheet10Data = {
          campDocs: s10Docs ? JSON.parse(s10Docs) : [],
          patients: s10Pats ? JSON.parse(s10Pats) : []
        };
      }

      const s11Pri = localStorage.getItem('dios_special_focused_brands_permanent_v1_pri');
      const s11Sec = localStorage.getItem('dios_special_focused_brands_permanent_v1_sec');
      if (s11Pri || s11Sec) {
        sheet11Data = {
          primaryRows: s11Pri ? JSON.parse(s11Pri) : [],
          secondaryRows: s11Sec ? JSON.parse(s11Sec) : []
        };
      }

      const s12 = localStorage.getItem('dios_focused_brands_permanent_v3');
      if (s12) sheet12Data = { items: JSON.parse(s12) };

      const s13 = localStorage.getItem('dios_roi_analysis_permanent_v2');
      if (s13) sheet13Data = { roiList: JSON.parse(s13) };

      const s14 = localStorage.getItem('dios_msl_schedule_permanent_v5');
      const s14Rules = localStorage.getItem('dios_msl_custom_priority_rules_v1');
      if (s14) sheet14Data = { doctors: JSON.parse(s14), customPriorityRules: s14Rules ? JSON.parse(s14Rules) : [] };

      const s16Prods = localStorage.getItem('dios_product_incentive_sheet16_v4_products');
      const s16Spec = localStorage.getItem('dios_product_incentive_sheet16_v4_special');
      if (s16Prods || s16Spec) {
        sheet16Data = {
          products: s16Prods ? JSON.parse(s16Prods) : [],
          specialList: s16Spec ? JSON.parse(s16Spec) : []
        };
      }
    } catch (e) {
      console.warn("LocalStorage read error in exporter:", e);
    }
  }

  // 🌟 STEP 2: PRIORITY #2 - Fetch with Anti-Cache headers if LocalStorage was empty
  try {
    const ts = Date.now();
    const fetchAntiCache = (key: string) => 
      fetch(`/api/cloud-storage?key=${encodeURIComponent(key)}&t=${ts}&_r=${Math.random()}`, { cache: 'no-store' })
        .then(r => r.json())
        .catch(() => ({ success: false }));

    const [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r16] = await Promise.all([
      fetchAntiCache('review/sheet_01_effort_level'),
      fetchAntiCache('review/sheet_02_fw_progress'),
      fetchAntiCache('review/sheet_03_sales_performance'),
      fetchAntiCache('review/sheet_04_un_sales_progression'),
      fetchAntiCache('review/sheet_05_near_by_expiry'),
      fetchAntiCache('review/sheet_06_commitment'),
      fetchAntiCache('campaigns/sheet_07_wcfyh'),
      fetchAntiCache('campaigns/sheet_08_a2_ghee_valros'),
      fetchAntiCache('campaigns/sheet_09_table_top'),
      fetchAntiCache('campaigns/sheet_10_glucometer'),
      fetchAntiCache('review/sheet_11_special_focused'),
      fetchAntiCache('review/sheet_12_focused_brands'),
      fetchAntiCache('review/sheet_13_roi'),
      fetchAntiCache('review/sheet_14_msl_schedule'),
      fetchAntiCache('review/sheet_16_product_incentive')
    ]);

    if (!sheet01Data && r1.success && r1.data) sheet01Data = r1.data;
    if (!sheet02Data && r2.success && r2.data) sheet02Data = r2.data;
    if (!sheet03Data && r3.success && r3.data) sheet03Data = r3.data;
    if (!sheet04Data && r4.success && r4.data) sheet04Data = r4.data;
    if (!sheet05Data && r5.success && r5.data) sheet05Data = r5.data;
    if (!sheet06Data && r6.success && r6.data) sheet06Data = r6.data;
    if (!sheet07Data && r7.success && r7.data) sheet07Data = r7.data;
    if (!sheet08Data && r8.success && r8.data) sheet08Data = r8.data;
    if (!sheet09Data && r9.success && r9.data) sheet09Data = r9.data;
    if (!sheet10Data && r10.success && r10.data) sheet10Data = r10.data;
    if (!sheet11Data && r11.success && r11.data) sheet11Data = r11.data;
    if (!sheet12Data && r12.success && r12.data) sheet12Data = r12.data;
    if (!sheet13Data && r13.success && r13.data) sheet13Data = r13.data;
    if (!sheet14Data && r14.success && r14.data) sheet14Data = r14.data;
    if (!sheet16Data && r16 && r16.success && r16.data) sheet16Data = r16.data;
  } catch (e) {
    console.warn("Cloud anti-cache fetch skipped:", e);
  }

  // 🌟 STEP 3: Fallback to MemoryStore if still unassigned
  if (!sheet01Data && memoryStore.effortLevelData) {
    sheet01Data = { formData: memoryStore.effortLevelData, beName: memoryStore.beName, hqName: memoryStore.hqName };
  }
  if (!sheet03Data && memoryStore.salesPerformanceData) {
    sheet03Data = { formData: memoryStore.salesPerformanceData, salesBreakdown: memoryStore.salesBreakdown };
  }
  if (!sheet04Data) {
    sheet04Data = { progressionData: unProgressionStore.getData() };
  }
  if (!sheet14Data && memoryStore.mslData && memoryStore.mslData.length > 0) {
    sheet14Data = { doctors: memoryStore.mslData };
  }

  const wb = XLSX.utils.book_new();

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
  ws6['!merges'] = s6.merges; ws6['!cols'] = s6.cols; ws6['!rows'] = s6.rows;
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

  const s14 = buildSheet14_Msl(sheet14Data);
  const ws14 = XLSX.utils.aoa_to_sheet(s14.wsData);
  ws14['!merges'] = s14.merges; ws14['!cols'] = s14.cols; ws14['!rows'] = s14.rows;
  XLSX.utils.book_append_sheet(wb, ws14, s14.sheetName);

  const s16 = buildSheet16_ProductIncentive(sheet16Data);
  const ws16 = XLSX.utils.aoa_to_sheet(s16.wsData);
  ws16['!merges'] = s16.merges; ws16['!cols'] = s16.cols; ws16['!rows'] = s16.rows;
  XLSX.utils.book_append_sheet(wb, ws16, s16.sheetName);

  const filename = `DIOS_Performance_Review_Master_2026.xlsx`;
  XLSX.writeFile(wb, filename);
}
"""

with open('src/exporters/masterReviewWorkbook.ts', 'w', encoding='utf-8') as f:
    f.write(master_workbook_code)
print("✅ masterReviewWorkbook.ts updated with LocalStorage-First & Anti-Cache Pipeline.")

# 2. Update buildSheet13_Roi.ts to fix the hardcoded bug
roi_builder_code = """import { standardTheme, borderThin } from '../styles/standardTheme';
import { INITIAL_ROI_SEED, RoiDoctorItem } from '../../data/seedRoi';

const ACTIVE_2026_MONTHS = [
  { label: 'Jan-26', dateKey: 'jan26_date', roiKey: 'jan26_roi' },
  { label: 'Feb-26', dateKey: 'feb26_date', roiKey: 'feb26_roi' },
  { label: 'Mar-26', dateKey: 'mar26_date', roiKey: 'mar26_roi' },
  { label: 'Apr-26', dateKey: 'apr_date', roiKey: 'apr_roi' },
  { label: 'May-26', dateKey: 'may_date', roiKey: 'may_roi' },
  { label: 'Jun-26', dateKey: 'jun_date', roiKey: 'jun_roi' },
  { label: 'Jul-26', dateKey: 'jul_date', roiKey: 'jul_roi' },
  { label: 'Aug-26', dateKey: 'aug_date', roiKey: 'aug_roi' },
  { label: 'Sep-26', dateKey: 'sept_date', roiKey: 'sept_roi' },
  { label: 'Oct-26', dateKey: 'oct_date', roiKey: 'oct_roi' },
  { label: 'Nov-26', dateKey: 'nov_date', roiKey: 'nov_roi' },
  { label: 'Dec-26', dateKey: 'dec_date', roiKey: 'dec_roi' },
  { label: 'Jan-27', dateKey: 'jan_date', roiKey: 'jan_roi' },
  { label: 'Feb-27', dateKey: 'feb_date', roiKey: 'feb_roi' },
  { label: 'Mar-27', dateKey: 'mar_date', roiKey: 'mar_roi' },
];

export function buildSheet13_Roi(data?: any) {
  // 🌟 DYNAMIC PIPELINE: Load from passed data OR localStorage OR default seed
  let roiList: any[] = [];

  if (data?.roiList && Array.isArray(data.roiList) && data.roiList.length > 0) {
    roiList = data.roiList;
  } else if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('dios_roi_analysis_permanent_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) roiList = parsed;
      }
    } catch (e) {}
  }

  if (roiList.length === 0) {
    roiList = INITIAL_ROI_SEED;
  }

  const wsData: any[][] = [];
  const merges: any[] = [];

  const totalCols = 8 + ACTIVE_2026_MONTHS.length * 2 + 2;

  // ROW 1: INVESTMENT AND COVERAGE ANALYSIS . (Yellow Banner Merged A1 to H1)
  const r1: any[] = [
    { v: 'INVESTMENT AND COVERAGE ANALYSIS . ', s: standardTheme.headerYellowLeft }
  ];
  for (let c = 1; c < 8; c++) r1.push({ v: '', s: standardTheme.headerYellowLeft });
  for (let c = 8; c < totalCols; c++) r1.push({ v: '', s: {} });
  wsData.push(r1);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } });

  // ROW 2: Main Headers (Solid Yellow)
  const r2: any[] = [
    { v: 'S.N.', s: standardTheme.headerYellowCol },
    { v: 'DR.NAME', s: standardTheme.headerYellowColLeft },
    { v: 'EXECUTIVE NAME', s: standardTheme.headerYellowColLeft },
    { v: 'MOBILE NO.', s: standardTheme.headerYellowCol },
    { v: 'ACTIVITY TYPE', s: standardTheme.headerYellowCol },
    { v: 'ACTIVITY AMOUNT', s: standardTheme.headerYellowCol },
    { v: 'DATE OF ACTIVITY', s: standardTheme.headerYellowCol },
    { v: 'OLD/NEW', s: standardTheme.headerYellowCol }
  ];

  ACTIVE_2026_MONTHS.forEach(m => {
    r2.push(
      { v: m.label, s: standardTheme.headerYellowCol },
      { v: '', s: standardTheme.headerYellowCol }
    );
  });
  r2.push({ v: 'OLD/NEW', s: standardTheme.headerYellowCol });
  r2.push({ v: 'TOTAL', s: standardTheme.headerYellowCol });
  wsData.push(r2);

  // 2-Row Vertical Merges for Left Headers
  merges.push({ s: { r: 1, c: 0 }, e: { r: 2, c: 0 } }); // S.N.
  merges.push({ s: { r: 1, c: 1 }, e: { r: 2, c: 1 } }); // DR.NAME
  merges.push({ s: { r: 1, c: 2 }, e: { r: 2, c: 2 } }); // EXECUTIVE NAME
  merges.push({ s: { r: 1, c: 3 }, e: { r: 2, c: 3 } }); // MOBILE NO.
  merges.push({ s: { r: 1, c: 4 }, e: { r: 2, c: 4 } }); // ACTIVITY TYPE
  merges.push({ s: { r: 1, c: 5 }, e: { r: 2, c: 5 } }); // ACTIVITY AMOUNT
  merges.push({ s: { r: 1, c: 6 }, e: { r: 2, c: 6 } }); // DATE OF ACTIVITY
  merges.push({ s: { r: 1, c: 7 }, e: { r: 2, c: 7 } }); // OLD/NEW

  // Month 2-Col Horizontal Merges
  ACTIVE_2026_MONTHS.forEach((_, idx) => {
    const startCol = 8 + idx * 2;
    merges.push({ s: { r: 1, c: startCol }, e: { r: 1, c: startCol + 1 } });
  });

  const lastCol = 8 + ACTIVE_2026_MONTHS.length * 2;
  merges.push({ s: { r: 1, c: lastCol }, e: { r: 2, c: lastCol } });
  merges.push({ s: { r: 1, c: lastCol + 1 }, e: { r: 2, c: lastCol + 1 } });

  // ROW 3: Sub-Headers (Solid Red Background)
  const r3: any[] = [
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol },
    { v: '', s: standardTheme.headerYellowCol }
  ];

  ACTIVE_2026_MONTHS.forEach(() => {
    r3.push(
      { v: 'DATE of visit', s: standardTheme.subHeaderRed },
      { v: 'ROI', s: standardTheme.subHeaderRed }
    );
  });
  r3.push({ v: '', s: standardTheme.headerYellowCol });
  r3.push({ v: '', s: standardTheme.headerYellowCol });
  wsData.push(r3);

  // ROWS 4 onwards: DYNAMIC DOCTORS DATA
  roiList.forEach((d: any) => {
    const mCells: any[] = [];
    let rowSum = 0;

    ACTIVE_2026_MONTHS.forEach(m => {
      const dVal = d[m.dateKey] || '';
      const rVal = d[m.roiKey] || '';
      const rNum = parseFloat(String(rVal).replace(/,/g, '')) || 0;
      if (rNum > 0) rowSum += rNum;

      mCells.push(
        { v: dVal, s: standardTheme.cellCenter },
        { v: rNum > 0 ? rNum : (rVal !== '' ? rVal : ''), s: rNum > 0 ? standardTheme.cellRight : standardTheme.cellCenter }
      );
    });

    const displayTotal = rowSum > 0 ? rowSum : (parseFloat(String(d.total || '0').replace(/,/g, '')) || '');

    const row = [
      { v: d.sn || '', s: standardTheme.cellCenter },
      { v: d.drName || d.name || '', s: standardTheme.cellLeft },
      { v: d.execName || d.exec || 'BANWARI LAL MEENA', s: standardTheme.cellLeft },
      { v: d.mobileNo || d.mob || '', s: standardTheme.cellCenter },
      { v: d.activityType || d.actType || '', s: standardTheme.cellCenter },
      { v: d.activityAmount || d.actAmt || '', s: standardTheme.cellRight },
      { v: d.dateOfActivity || d.actDate || '', s: standardTheme.cellCenter },
      { v: d.category || d.cat || 'OLD', s: standardTheme.cellCenter },
      ...mCells,
      { v: d.category || d.cat || 'OLD', s: standardTheme.cellCenter },
      { v: displayTotal, s: standardTheme.cellRight }
    ];

    wsData.push(row);
  });

  return {
    wsData,
    sheetName: '13_ROI',
    merges,
    cols: [
      { wch: 6 },
      { wch: 22 },
      { wch: 22 },
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      ...ACTIVE_2026_MONTHS.flatMap(() => [{ wch: 18 }, { wch: 10 }]),
      { wch: 10 },
      { wch: 14 }
    ],
    rows: [
      { hpt: 22 },
      { hpt: 26 },
      { hpt: 26 }
    ]
  };
}
"""

with open('src/exporters/sheets/buildSheet13_Roi.ts', 'w', encoding='utf-8') as f:
    f.write(roi_builder_code)
print("✅ buildSheet13_Roi.ts fixed (Dynamic Data & Dates Mapping Active).")

