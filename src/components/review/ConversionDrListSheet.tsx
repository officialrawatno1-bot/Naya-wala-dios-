import React, { useState, useMemo, useRef } from "react";
import { 
  UserCheck, Search, Download, Plus, Trash2, 
  Upload, RefreshCw, X, Check, CheckCircle2, Sparkles, 
  FileSpreadsheet, Filter, Building2, UserPlus, AlertCircle
} from "lucide-react";
import { INITIAL_CONVERSION_DRS_SEED, ConversionDoctorRow } from "../../data/seedConversionDoctors";
import { CloudSyncBar } from "../CloudSyncBar";
import { exportConversionDrListExcel } from "../../exporters/conversionDrExcelExporter";
import { memoryStore, MslDoctor } from "../../data/memoryStore";
import { MASTER_123_MSL_DOCTORS } from "./MslSheet";

const STORAGE_KEY = "dios_draft_sheet_17_conversion_drs";

const MONTHS_LIST = [
  { key: "july", label: "July" },
  { key: "aug", label: "Aug" },
  { key: "sept", label: "Sept" },
  { key: "oct", label: "Oct" },
  { key: "nov", label: "Nov" }
];

const KNOWN_UDAIPUR_NAMES = [
  "DILIP JAIN", "DEEPAK AMETA", "SK KAUSHIQ", "SK KAUSHIK", 
  "RAHUL SEHLOT", "ANIS JUKARWAL", "ANIS JUKARWALA", "SANJAY GANDHI"
];

const cleanDoc = (s: string) => (s || "").toUpperCase().replace(/^(DR\.?|DR\s+)/i, "").replace(/[^A-Z]/g, "");

export const ConversionDrListSheet: React.FC = () => {
  const [rows, setRows] = useState<ConversionDoctorRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CONVERSION_DRS_SEED;
  });

  const [viewMode, setViewMode] = useState<"MY_HQ" | "ALL_TEAM">("MY_HQ");
  const [search, setSearch] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Doctor Form State
  const [newDocForm, setNewDocForm] = useState({
    beName: "Banwari Meena",
    hq: "Udaipur",
    drName: "",
    julyCall: "",
    julyRem: "",
    augCall: "",
    augRem: ""
  });
  const [mslSearchText, setMslSearchText] = useState("");

  const persistRows = (updated: ConversionDoctorRow[]) => {
    setRows(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const allMslDoctors: MslDoctor[] = useMemo(() => {
    if (memoryStore.mslData && memoryStore.mslData.length > 0) return memoryStore.mslData;
    try {
      const saved = localStorage.getItem("dios_msl_schedule_permanent_v5");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MASTER_123_MSL_DOCTORS;
  }, []);

  const filteredMslDocs = useMemo(() => {
    if (!mslSearchText.trim()) return [];
    const q = mslSearchText.toLowerCase();
    return allMslDoctors.filter(d => 
      d.doctorName.toLowerCase().includes(q) || (d.speciality || "").toLowerCase().includes(q)
    ).slice(0, 8);
  }, [allMslDoctors, mslSearchText]);

  // 🌟 SMART PARSER: Automatically recognizes Banwari Meena & Udaipur doctors regardless of row index shifting
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      const lines = content.split(/\r?\n/);
      let parsedRows: ConversionDoctorRow[] = [];
      let headerColIndex = {
        sNo: 3,
        beName: 4,
        hq: 5,
        drName: 6,
        julyCall: 7, julyRem: 8,
        augCall: 9, augRem: 10,
        septCall: 11, septRem: 12,
        octCall: 13, octRem: 14,
        novCall: 15, novRem: 16
      };

      let newUdaipurCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g)?.map(m => m.replace(/^,/, "").replace(/^"|"$/g, "").trim()) || [];
        if (cols.length < 5) continue;

        // Header dynamic index detector
        const lineUpper = line.toUpperCase();
        if (lineUpper.includes("BE NAME") && lineUpper.includes("DR NAME")) {
          cols.forEach((col, cIdx) => {
            const cu = col.toUpperCase();
            if (cu.includes("S NO") || cu === "S.NO") headerColIndex.sNo = cIdx;
            if (cu.includes("BE NAME")) headerColIndex.beName = cIdx;
            if (cu === "HQ") headerColIndex.hq = cIdx;
            if (cu.includes("DR NAME")) headerColIndex.drName = cIdx;
          });
          continue;
        }

        const beNameVal = cols[headerColIndex.beName] || "";
        const hqVal = cols[headerColIndex.hq] || "";
        const drNameVal = cols[headerColIndex.drName] || "";
        if (!drNameVal || drNameVal.toUpperCase().includes("DR NAME")) continue;

        const isBanwari = beNameVal.toUpperCase().includes("BANWARI") || hqVal.toUpperCase().includes("UDAIPUR");
        const cleanDr = cleanDoc(drNameVal);
        const isKnown = KNOWN_UDAIPUR_NAMES.some(kn => cleanDoc(kn) === cleanDr);
        const isNewDoctor = isBanwari && !isKnown;

        if (isNewDoctor) newUdaipurCount++;

        parsedRows.push({
          id: "imp_" + i + "_" + Date.now(),
          sNo: cols[headerColIndex.sNo] || "",
          beName: beNameVal,
          hq: hqVal,
          drName: drNameVal,
          isNew: isNewDoctor,
          july: { call: cols[headerColIndex.julyCall] || "", reminder: cols[headerColIndex.julyRem] || "" },
          aug: { call: cols[headerColIndex.augCall] || "", reminder: cols[headerColIndex.augRem] || "" },
          sept: { call: cols[headerColIndex.septCall] || "", reminder: cols[headerColIndex.septRem] || "" },
          oct: { call: cols[headerColIndex.octCall] || "", reminder: cols[headerColIndex.octRem] || "" },
          nov: { call: cols[headerColIndex.novCall] || "", reminder: cols[headerColIndex.novRem] || "" }
        });
      }

      if (parsedRows.length > 0) {
        persistRows(parsedRows);
        if (newUdaipurCount > 0) {
          setStatusMsg(`🎉 File Loaded! ${parsedRows.length} Doctors found. 🌟 Notice: ${newUdaipurCount} NEW doctor(s) detected in Udaipur & highlighted in Cyan!`);
        } else {
          setStatusMsg(`🎉 File Loaded! Successfully parsed ${parsedRows.length} Doctors across all HQs!`);
        }
        setTimeout(() => setStatusMsg(null), 4500);
      } else {
        alert("Could not parse rows from this file. Please check format.");
      }
    };
    reader.readAsText(file);
  };

  // 🌟 AUTO-SYNC FROM MSL SCHEDULE
  const handleAutoSyncFromMsl = () => {
    let syncedCount = 0;

    const updated = rows.map(r => {
      const isUdaipur = (r.beName || "").toUpperCase().includes("BANWARI") || (r.hq || "").toUpperCase().includes("UDAIPUR");
      if (!isUdaipur) return r;

      const cleanR = cleanDoc(r.drName);
      const matchedMsl = allMslDoctors.find(m => {
        const cM = cleanDoc(m.doctorName);
        return cM === cleanR || cM.includes(cleanR) || cleanR.includes(cM);
      });

      if (!matchedMsl) return r;

      syncedCount++;
      return {
        ...r,
        july: { ...r.july, call: matchedMsl.jul || r.july.call },
        aug: { ...r.aug, call: matchedMsl.aug || r.aug.call },
        sept: { ...r.sept, call: matchedMsl.sept || r.sept.call },
        oct: { ...r.oct, call: matchedMsl.oct || r.oct.call },
        nov: { ...r.nov, call: matchedMsl.nov || r.nov.call }
      };
    });

    persistRows(updated);
    setStatusMsg(`🎉 Auto-Sync Complete: ${syncedCount} Udaipur Conversion Doctors ki Visit Dates MSL Schedule se update ho gayi!`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleCellChange = (id: string, monthKey: "july" | "aug" | "sept" | "oct" | "nov", field: "call" | "reminder", val: string) => {
    const updated = rows.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        [monthKey]: {
          ...r[monthKey],
          [field]: val
        }
      };
    });
    persistRows(updated);
  };

  const handleManualAddDoctor = () => {
    if (!newDocForm.drName.trim()) {
      alert("Kripya Doctor Name zaroor enter karein!");
      return;
    }

    const clean = cleanDoc(newDocForm.drName);
    const isKnown = KNOWN_UDAIPUR_NAMES.some(kn => cleanDoc(kn) === clean);

    const newRow: ConversionDoctorRow = {
      id: "dr_" + Date.now(),
      sNo: "",
      beName: newDocForm.beName,
      hq: newDocForm.hq,
      drName: newDocForm.drName.trim(),
      isNew: !isKnown,
      july: { call: newDocForm.julyCall, reminder: newDocForm.julyRem },
      aug: { call: newDocForm.augCall, reminder: newDocForm.augRem },
      sept: { call: "", reminder: "" },
      oct: { call: "", reminder: "" },
      nov: { call: "", reminder: "" }
    };

    persistRows([...rows, newRow]);
    setShowAddModal(false);
    setNewDocForm({ beName: "Banwari Meena", hq: "Udaipur", drName: "", julyCall: "", julyRem: "", augCall: "", augRem: "" });
    setStatusMsg(`🎉 Dr. ${newRow.drName} successfully added to Conversion Dr List!`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleDeleteDoctor = (id: string, name: string) => {
    if (window.confirm(`Kya aap Dr. ${name} ko Conversion Dr List se remove karna chahte hain?`)) {
      persistRows(rows.filter(r => r.id !== id));
    }
  };

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const isUdaipur = (r.beName || "").toUpperCase().includes("BANWARI") || (r.hq || "").toUpperCase().includes("UDAIPUR");
      if (viewMode === "MY_HQ" && !isUdaipur) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.drName.toLowerCase().includes(q) ||
          r.beName.toLowerCase().includes(q) ||
          r.hq.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, viewMode, search]);

  const udaipurDoctorsCount = rows.filter(r => (r.beName || "").toUpperCase().includes("BANWARI") || (r.hq || "").toUpperCase().includes("UDAIPUR")).length;
  const newDoctorsCount = rows.filter(r => r.isNew).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-5">
      
      {/* 1. TOP HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <UserCheck size={24} />
          </span>
          <div>
            <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              17. CONVERSION DR LIST
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <Sparkles size={11} /> Smart Recognition Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              BE: BANWARI LAL MEENA &bull; HQ: UDAIPUR &bull; Auto-Detects Shifted Rows &bull; Real Time MSL Date Sync
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* UPLOAD FILE */}
          <label className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition">
            <Upload size={14} />
            <span>Import CSV / Excel</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </label>

          {/* SYNC FROM MSL */}
          <button
            type="button"
            onClick={handleAutoSyncFromMsl}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
            title="Auto-fill visit dates from Sheet 14 MSL"
          >
            <RefreshCw size={14} className="text-yellow-300" /> ⚡ Sync from MSL
          </button>

          {/* ADD DOCTOR */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-amber-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Plus size={14} /> + Add Doctor
          </button>

          {/* EXCEL EXPORT BUTTON (EXACT SCREENSHOT STYLING) */}
          <button
            type="button"
            onClick={() => exportConversionDrListExcel(filtered, viewMode === "MY_HQ" ? "Udaipur" : "ALL")}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-950 transition cursor-pointer"
            title="Download Excel with Bright Yellow Headers matching Screenshot"
          >
            <FileSpreadsheet size={15} /> 📊 Export Excel
          </button>
        </div>
      </div>

      {/* CLOUD SYNC BAR */}
      <CloudSyncBar
        storageKey="review/sheet_17_conversion_drs"
        sheetTitle="17. Conversion Dr List"
        getData={() => ({ rows })}
        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.rows && Array.isArray(cloudData.rows)) {
            persistRows(cloudData.rows);
          }
        }}
        onSaveLocal={() => {
          persistRows(rows);
        }}
      />

      {statusMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="p-1 hover:text-white cursor-pointer"><X size={15} /></button>
        </div>
      )}

      {/* VIEW FILTER TABS & SEARCH */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode("MY_HQ")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "MY_HQ"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>📍 My HQ (Udaipur - Banwari Meena)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-950/20 text-slate-950">
              {udaipurDoctorsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("ALL_TEAM")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "ALL_TEAM"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🌐 Full Team (Rajasthan + MP)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900 text-cyan-300">
              {rows.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {newDoctorsCount > 0 && (
            <span className="text-[11px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-xl font-bold flex items-center gap-1">
              <Sparkles size={12} className="text-cyan-400" /> {newDoctorsCount} New Doctor(s) Added
            </span>
          )}

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search doctor, HQ, BE..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* 🌟 2-TIER TABLE MATCHING SCREENSHOT EXACTLY */}
      <div className="overflow-x-auto max-h-[580px] border border-slate-800 rounded-2xl relative shadow-2xl bg-slate-950">
        <table className="w-full text-left text-xs border-collapse">
          
          <thead className="sticky top-0 z-30 bg-[#FFFF00] text-slate-950 font-black uppercase">
            {/* TIER 1: VISIT DATES BANNER */}
            <tr className="border-b border-black">
              <th colSpan={4} className="p-2.5 bg-slate-950 text-slate-400 border-r border-slate-800"></th>
              <th colSpan={10} className="p-2 text-center text-black bg-[#FFFF00] font-black tracking-wider text-xs border-b border-black">
                VISIT DATES
              </th>
              <th className="p-2 bg-slate-950 w-12 border-b border-slate-800"></th>
            </tr>

            {/* TIER 2: MAIN HEADERS (BRIGHT YELLOW #FFFF00) */}
            <tr className="border-b border-black text-[11px]">
              <th rowSpan={2} style={{ width: "50px", minWidth: "50px" }} className="p-2.5 text-center bg-[#FFFF00] border-r border-black font-black">
                S No
              </th>
              <th rowSpan={2} style={{ width: "160px", minWidth: "160px" }} className="p-2.5 bg-[#FFFF00] border-r border-black font-black">
                BE Name
              </th>
              <th rowSpan={2} style={{ width: "110px", minWidth: "110px" }} className="p-2.5 bg-[#FFFF00] border-r border-black font-black">
                HQ
              </th>
              <th rowSpan={2} style={{ width: "200px", minWidth: "200px" }} className="p-2.5 bg-[#FFFF00] border-r-2 border-black font-black">
                Dr Name
              </th>

              {MONTHS_LIST.map(m => (
                <th
                  key={`th_${m.key}`}
                  colSpan={2}
                  className="p-1.5 text-center bg-[#FFFF00] border-r border-black font-black whitespace-nowrap"
                >
                  {m.label}
                </th>
              ))}
              <th rowSpan={2} className="p-2 text-center bg-[#FFFF00] w-12 border-b border-black font-black text-[10px]">
                Del
              </th>
            </tr>

            {/* TIER 3: SUB-COLUMNS (Call | Reminder) */}
            <tr className="border-b border-black text-[10px] bg-[#FFFF00] text-black font-bold">
              {MONTHS_LIST.map(m => (
                <React.Fragment key={`sub_${m.key}`}>
                  <th className="p-1 text-center border-r border-black w-24 min-w-[85px]">Call</th>
                  <th className="p-1 text-center border-r border-black w-20 min-w-[70px]">Reminder</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={15} className="p-8 text-center text-slate-500 font-sans">
                  No conversion doctors found. Click <b>"Import CSV / Excel"</b> or <b>"+ Add Doctor"</b> above!
                </td>
              </tr>
            ) : (
              filtered.map((r, idx) => {
                const isBanwari = (r.beName || "").toUpperCase().includes("BANWARI") || (r.hq || "").toUpperCase().includes("UDAIPUR");
                const isNew = !!r.isNew;

                return (
                  <tr 
                    key={r.id || idx} 
                    className={`transition ${
                      isNew 
                        ? "bg-cyan-950/40 hover:bg-cyan-900/50 border-l-4 border-cyan-400" 
                        : isBanwari 
                        ? "bg-amber-950/20 hover:bg-amber-950/35" 
                        : "hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="p-2 text-center text-slate-400 border-r border-slate-800/70 w-12">
                      {r.sNo || idx + 1}
                    </td>

                    <td className="p-2 font-sans font-bold text-white border-r border-slate-800/70 truncate max-w-[160px]">
                      {r.beName}
                    </td>

                    <td className="p-2 font-sans text-amber-300 font-semibold border-r border-slate-800/70">
                      {r.hq}
                    </td>

                    <td className="p-2 font-sans border-r-2 border-slate-700 max-w-[200px] truncate">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${isNew ? "text-cyan-300" : isBanwari ? "text-amber-200" : "text-slate-100"}`}>
                          Dr. {r.drName}
                        </span>
                        {isNew && (
                          <span className="text-[9px] bg-cyan-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter shrink-0">
                            NEW
                          </span>
                        )}
                      </div>
                    </td>

                    {/* July */}
                    <td className="p-1 border-r border-slate-800/50">
                      <input
                        type="text"
                        value={r.july?.call || ""}
                        onChange={e => handleCellChange(r.id, "july", "call", e.target.value)}
                        placeholder="-"
                        className="w-full py-1 px-1 bg-transparent text-center text-cyan-300 font-bold text-xs rounded focus:bg-slate-950 focus:outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-800">
                      <input
                        type="text"
                        value={r.july?.reminder || ""}
                        onChange={e => handleCellChange(r.id, "july", "reminder", e.target.value)}
                        placeholder="-"
                        className="w-full py-1 px-1 bg-transparent text-center text-amber-300 font-semibold text-xs rounded focus:bg-slate-950 focus:outline-none"
                      />
                    </td>

                    {/* Aug */}
                    <td className="p-1 border-r border-slate-800/50">
                      <input
                        type="text"
                        value={r.aug?.call || ""}
                        onChange={e => handleCellChange(r.id, "aug", "call", e.target.value)}
                        placeholder="-"
                        className="w-full py-1 px-1 bg-transparent text-center text-cyan-300 font-bold text-xs rounded focus:bg-slate-950 focus:outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-800">
                      <input
                        type="text"
                        value={r.aug?.reminder || ""}
                        onChange={e => handleCellChange(r.id, "aug", "reminder", e.target.value)}
                        placeholder="-"
                        className="w-full py-1 px-1 bg-transparent text-center text-amber-300 font-semibold text-xs rounded focus:bg-slate-950 focus:outline-none"
                      />
                    </td>

                    {/* Sept */}
                    <td className="p-1 border-r border-slate-800/50">
                      <input
                        type="text"
                        value={r.sept?.call || ""}
                        onChange={e => handleCellChange(r.id, "sept", "call", e.target.value)}
                        placeholder="-"
                        className="w-full py-1 px-1 bg-transparent text-center text-cyan-300 font-bold text-xs rounded focus:bg-slate-950 focus:outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-800">
                      <input
                        type="text"
                        value={r.sept?.reminder || ""}
                        onChange={e => handleCellChange(r.id, "sept", "reminder", e.target.value)}
                        placeholder="-"
                        className="w-full py-1 px-1 bg-transparent text-center text-amber-300 font-semibold text-xs rounded focus:bg-slate-950 focus:outline-none"
                      />
                    </td>

                    {/* Oct */}
                    <td className="p-1 border-r border-slate-800/50">
                      <input
                        type="text"
                        value={r.oct?.call || ""}
                        onChange={e => handleCellChange(r.id, "oct", "call", e.target.value)}
                        placeholder="-"
                        className="w-full py-1 px-1 bg-transparent text-center text-cyan-300 font-bold text-xs rounded focus:bg-slate-950 focus:outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-800">
                      <input
                        type="text"
                        value={r.oct?.reminder || ""}
                        onChange={e => handleCellChange(r.id, "oct", "reminder", e.target.value)}
                        placeholder="-"
                        className="w-full py-1 px-1 bg-transparent text-center text-amber-300 font-semibold text-xs rounded focus:bg-slate-950 focus:outline-none"
                      />
                    </td>

                    {/* Nov */}
                    <td className="p-1 border-r border-slate-800/50">
                      <input
                        type="text"
                        value={r.nov?.call || ""}
                        onChange={e => handleCellChange(r.id, "nov", "call", e.target.value)}
                        placeholder="-"
                        className="w-full py-1 px-1 bg-transparent text-center text-cyan-300 font-bold text-xs rounded focus:bg-slate-950 focus:outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-800">
                      <input
                        type="text"
                        value={r.nov?.reminder || ""}
                        onChange={e => handleCellChange(r.id, "nov", "reminder", e.target.value)}
                        placeholder="-"
                        className="w-full py-1 px-1 bg-transparent text-center text-amber-300 font-semibold text-xs rounded focus:bg-slate-950 focus:outline-none"
                      />
                    </td>

                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteDoctor(r.id, r.drName)}
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                        title="Delete this Doctor Row"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ADD DOCTOR MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40">
                  <UserPlus size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Add Conversion Doctor</h3>
                  <p className="text-xs text-slate-400">Search from MSL or manually enter doctor name</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-slate-300 font-bold">Pick Doctor from MSL Schedule:</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search doctor name..."
                    value={mslSearchText}
                    onChange={e => setMslSearchText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {filteredMslDocs.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
                    {filteredMslDocs.map(doc => (
                      <div
                        key={doc.srNo}
                        onClick={() => {
                          setNewDocForm(prev => ({ ...prev, drName: doc.doctorName }));
                          setMslSearchText("");
                        }}
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-amber-950/60 text-xs cursor-pointer flex justify-between items-center text-white"
                      >
                        <span className="font-bold">Dr. {doc.doctorName}</span>
                        <span className="text-[10px] text-amber-400">+ Select</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Doctor Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Dilip Jain"
                  value={newDocForm.drName}
                  onChange={e => setNewDocForm({ ...newDocForm, drName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold rounded-xl px-3 py-2 text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">BE Name</label>
                  <input
                    type="text"
                    value={newDocForm.beName}
                    onChange={e => setNewDocForm({ ...newDocForm, beName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">HQ</label>
                  <input
                    type="text"
                    value={newDocForm.hq}
                    onChange={e => setNewDocForm({ ...newDocForm, hq: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-cyan-400 font-semibold mb-1">July Call Dates</label>
                  <input
                    type="text"
                    placeholder="e.g. 6,8,17,23"
                    value={newDocForm.julyCall}
                    onChange={e => setNewDocForm({ ...newDocForm, julyCall: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-mono rounded-xl px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-amber-400 font-semibold mb-1">July Reminder</label>
                  <input
                    type="text"
                    placeholder="e.g. 8"
                    value={newDocForm.julyRem}
                    onChange={e => setNewDocForm({ ...newDocForm, julyRem: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-mono rounded-xl px-3 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualAddDoctor}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Add Doctor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
