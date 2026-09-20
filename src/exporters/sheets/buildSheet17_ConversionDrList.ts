import { standardTheme, borderThin } from "../styles/standardTheme";
import { INITIAL_CONVERSION_DRS_SEED, ConversionDoctorRow } from "../../data/seedConversionDoctors";

export function buildSheet17_ConversionDrList(data?: any) {
  let rowsList: ConversionDoctorRow[] = [];

  if (data?.rows && Array.isArray(data.rows) && data.rows.length > 0) {
    rowsList = data.rows;
  } else if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("dios_draft_sheet_17_conversion_drs");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) rowsList = parsed;
      }
    } catch (e) {}
  }

  if (rowsList.length === 0) {
    rowsList = INITIAL_CONVERSION_DRS_SEED;
  }

  const wsData: any[][] = [];
  const merges: any[] = [];

  // ROW 1: Blank in D-G, VISIT DATES Banner
  const r1: any[] = [
    { v: "", s: {} }, { v: "", s: {} }, { v: "", s: {} },
    { v: "", s: {} }, { v: "", s: {} }, { v: "", s: {} },
    { v: "", s: {} },
    { v: "VISIT DATES", s: standardTheme.headerYellowCenterBold }
  ];
  for (let c = 8; c < 17; c++) {
    r1.push({ v: "", s: standardTheme.headerYellowCenterBold });
  }
  wsData.push(r1);
  merges.push({ s: { r: 0, c: 7 }, e: { r: 0, c: 16 } });

  // ROW 2: Main Headers (Solid Bright Yellow)
  const r2: any[] = [
    { v: "", s: {} }, { v: "", s: {} }, { v: "", s: {} },
    { v: "S No", s: standardTheme.headerYellowCol },
    { v: "BE Name", s: standardTheme.headerYellowColLeft },
    { v: "HQ", s: standardTheme.headerYellowColLeft },
    { v: "Dr Name", s: standardTheme.headerYellowColLeft },
    { v: "July", s: standardTheme.headerYellowCenterBold }, { v: "", s: standardTheme.headerYellowCenterBold },
    { v: "Aug", s: standardTheme.headerYellowCenterBold }, { v: "", s: standardTheme.headerYellowCenterBold },
    { v: "Sept", s: standardTheme.headerYellowCenterBold }, { v: "", s: standardTheme.headerYellowCenterBold },
    { v: "Oct", s: standardTheme.headerYellowCenterBold }, { v: "", s: standardTheme.headerYellowCenterBold },
    { v: "Nov", s: standardTheme.headerYellowCenterBold }, { v: "", s: standardTheme.headerYellowCenterBold }
  ];
  wsData.push(r2);

  merges.push({ s: { r: 1, c: 7 }, e: { r: 1, c: 8 } });
  merges.push({ s: { r: 1, c: 9 }, e: { r: 1, c: 10 } });
  merges.push({ s: { r: 1, c: 11 }, e: { r: 1, c: 12 } });
  merges.push({ s: { r: 1, c: 13 }, e: { r: 1, c: 14 } });
  merges.push({ s: { r: 1, c: 15 }, e: { r: 1, c: 16 } });

  // ROW 3: Sub-Headers (Call / Reminder)
  const r3: any[] = [
    { v: "", s: {} }, { v: "", s: {} }, { v: "", s: {} },
    { v: "", s: standardTheme.headerYellowCol },
    { v: "", s: standardTheme.headerYellowColLeft },
    { v: "", s: standardTheme.headerYellowColLeft },
    { v: "", s: standardTheme.headerYellowColLeft },
    { v: "Call", s: standardTheme.colHeader }, { v: "Reminder", s: standardTheme.colHeader },
    { v: "Call", s: standardTheme.colHeader }, { v: "Reminder", s: standardTheme.colHeader },
    { v: "Call", s: standardTheme.colHeader }, { v: "Reminder", s: standardTheme.colHeader },
    { v: "Call", s: standardTheme.colHeader }, { v: "Reminder", s: standardTheme.colHeader },
    { v: "Call", s: standardTheme.colHeader }, { v: "Reminder", s: standardTheme.colHeader }
  ];
  wsData.push(r3);

  merges.push({ s: { r: 1, c: 3 }, e: { r: 2, c: 3 } });
  merges.push({ s: { r: 1, c: 4 }, e: { r: 2, c: 4 } });
  merges.push({ s: { r: 1, c: 5 }, e: { r: 2, c: 5 } });
  merges.push({ s: { r: 1, c: 6 }, e: { r: 2, c: 6 } });

  // 🌟 RE-GROUPING: Saare Udaipur / Banwari Meena doctors ko ek saath Banwari section me rakhein
  const isUdaipur = (r: any) =>
    (r.beName || "").toUpperCase().includes("BANWARI") ||
    (r.hq || "").toUpperCase().includes("UDAIPUR");

  const beforeUdaipur: any[] = [];
  const udaipurDoctors: any[] = [];
  const afterUdaipur: any[] = [];
  let foundUdaipur = false;

  rowsList.forEach(r => {
    if (isUdaipur(r)) {
      udaipurDoctors.push(r);
      foundUdaipur = true;
    } else {
      if (!foundUdaipur) {
        beforeUdaipur.push(r);
      } else {
        afterUdaipur.push(r);
      }
    }
  });

  const finalOrderedRows = [...beforeUdaipur, ...udaipurDoctors, ...afterUdaipur];

  // Data Rows Write
  finalOrderedRows.forEach(r => {
    const isBanwari = isUdaipur(r);

    // Normal Yellow Style like Sanjay Gandhi / Dilip Jain (NO BLUE COLOR)
    const rowStyle = isBanwari
      ? { ...standardTheme.cellLeft, fill: { fgColor: { rgb: "FEF9C3" } } }
      : standardTheme.cellLeft;

    wsData.push([
      { v: "", s: {} }, { v: "", s: {} }, { v: "", s: {} },
      { v: r.sNo !== undefined && r.sNo !== null ? r.sNo : "", s: standardTheme.cellCenter },
      { v: r.beName || "", s: rowStyle },
      { v: r.hq || "", s: standardTheme.cellCenter },
      { v: r.drName || "", s: rowStyle },
      { v: r.july?.call || "", s: standardTheme.cellCenter },
      { v: r.july?.reminder || "", s: standardTheme.cellCenter },
      { v: r.aug?.call || "", s: standardTheme.cellCenter },
      { v: r.aug?.reminder || "", s: standardTheme.cellCenter },
      { v: r.sept?.call || "", s: standardTheme.cellCenter },
      { v: r.sept?.reminder || "", s: standardTheme.cellCenter },
      { v: r.oct?.call || "", s: standardTheme.cellCenter },
      { v: r.oct?.reminder || "", s: standardTheme.cellCenter },
      { v: r.nov?.call || "", s: standardTheme.cellCenter },
      { v: r.nov?.reminder || "", s: standardTheme.cellCenter }
    ]);
  });

  return {
    wsData,
    sheetName: "17_CONVERSION DR LIST",
    merges,
    cols: [
      { wch: 3 }, { wch: 3 }, { wch: 3 },
      { wch: 8 },   // S No
      { wch: 22 },  // BE Name
      { wch: 14 },  // HQ
      { wch: 26 },  // Dr Name
      { wch: 16 }, { wch: 12 },
      { wch: 16 }, { wch: 12 },
      { wch: 16 }, { wch: 12 },
      { wch: 16 }, { wch: 12 },
      { wch: 16 }, { wch: 12 }
    ],
    rows: [
      { hpt: 22 },
      { hpt: 24 },
      { hpt: 20 }
    ]
  };
}
