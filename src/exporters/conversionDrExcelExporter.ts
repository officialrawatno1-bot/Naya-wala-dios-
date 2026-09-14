import * as XLSX from "xlsx-js-style";
import { buildSheet17_ConversionDrList } from "./sheets/buildSheet17_ConversionDrList";

export function exportConversionDrListExcel(customRows?: any[], hqFilter?: string) {
  const wb = XLSX.utils.book_new();

  const s17 = buildSheet17_ConversionDrList({
    rows: customRows
  });

  const ws17 = XLSX.utils.aoa_to_sheet(s17.wsData);
  ws17["!merges"] = s17.merges;
  ws17["!cols"] = s17.cols;
  ws17["!rows"] = s17.rows;

  XLSX.utils.book_append_sheet(wb, ws17, s17.sheetName);

  const suffix = hqFilter && hqFilter !== "ALL" ? `_${hqFilter}` : "_Rajasthan_MP";
  const filename = `17_Conversion_Dr_List${suffix}_2026.xlsx`;
  XLSX.writeFile(wb, filename);
}
