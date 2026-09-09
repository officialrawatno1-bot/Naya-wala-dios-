with open('src/components/ExpenseWorkspace.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Import exportExpenseStatementToPdf
if "import { exportExpenseStatementToPdf } from '../exporters/expensePdfExporter';" not in code:
    code = code.replace(
        "import { parseCboExpenseFile, ExpenseDayRow, CboExpenseParsedData } from '../parsers/expenseParser';",
        "import { parseCboExpenseFile, ExpenseDayRow, CboExpenseParsedData } from '../parsers/expenseParser';\nimport { exportExpenseStatementToPdf } from '../exporters/expensePdfExporter';"
    )

# 2. Add blankPerfValues state
if "const [blankPerfValues, setBlankPerfValues] = useState<boolean>" not in code:
    code = code.replace(
        "const [hideMiscValues, setHideMiscValues] = useState<boolean>",
        "// 🌟 OPTION: PRINT PERFORMANCE SUMMARY AS BLANK VALUES OR REAL VALUES\n  const [blankPerfValues, setBlankPerfValues] = useState<boolean>(false);\n  const [hideMiscValues, setHideMiscValues] = useState<boolean>"
    )

# 3. Add handleExportPDF function
if "const handleExportPDF = () => {" not in code:
    pdf_handler = """  // 🌟 EXPORT CRYSTAL CLEAR A4 LANDSCAPE VECTOR PDF
  const handleExportPDF = () => {
    exportExpenseStatementToPdf({
      selectedMonth,
      headerInfo,
      rows,
      totals,
      allowanceSummary,
      miscSummary,
      performanceMetrics,
      hideMiscValues,
      blankPerfValues
    });
    setStatusMsg(`🎉 PDF Generated: 'Expense_Statement_${selectedMonth}_Official.pdf' downloaded!`);
    setTimeout(() => setStatusMsg(null), 3500);
  };
"""
    code = code.replace("  // Export CSV matching exact 5-block CBO layout", pdf_handler + "\n  // Export CSV matching exact 5-block CBO layout")

# 4. Add Export PDF button next to Export Official CSV button
if "Export PDF (A4)" not in code:
    old_csv_btn = """          <button
            onClick={handleExportCSV}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <Download size={15} /> Export Official CSV
          </button>"""

    new_btns = """          {/* 📄 EXPORT PDF (A4 LANDSCAPE) BUTTON */}
          <button
            onClick={handleExportPDF}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950 transition cursor-pointer disabled:opacity-50"
            title="Download Official A4 Landscape Vector PDF"
          >
            <FileText size={15} /> 📄 Export PDF (A4)
          </button>

          <button
            onClick={handleExportCSV}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <Download size={15} /> Export Official CSV
          </button>"""

    code = code.replace(old_csv_btn, new_btns)

# 5. Add Advanced Toggle for Blank Values in CBO Monthly Performance Summary Table
old_perf_header = """          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
              <Award size={16} className="text-purple-400" />
              CBO Monthly Performance Summary (Exact Screenshot Table)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Auto-Loaded from CSV Block 5</span>
          </div>"""

new_perf_header = """          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
              <Award size={16} className="text-purple-400" />
              CBO Monthly Performance Summary (Exact Screenshot Table)
            </h3>

            {/* 🌟 ADVANCED CHOOSE OPTION: PRINT WITH VALUES OR BLANK VALUES */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Print Mode:</span>
              <button
                type="button"
                onClick={() => setBlankPerfValues(!blankPerfValues)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  blankPerfValues 
                    ? 'bg-amber-950 text-amber-300 border-amber-500/60 shadow-md' 
                    : 'bg-slate-950 text-purple-300 border-purple-500/40'
                }`}
                title="Toggle whether table values should be printed or left blank"
              >
                {blankPerfValues ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{blankPerfValues ? '🔲 Values Blank (Structure Only)' : '📊 Print Real Values'}</span>
              </button>
            </div>
          </div>"""

if old_perf_header in code:
    code = code.replace(old_perf_header, new_perf_header)

# In the table row, reflect blankPerfValues on screen too if selected
old_perf_row = """                <tr>
                  <td className="p-3 border-r border-slate-800 text-slate-500 font-bold">{performanceMetrics.srNo || 1}</td>
                  <td className="p-3 border-r border-slate-800 text-white font-bold">{performanceMetrics.totalDr}</td>
                  <td className="p-3 border-r border-slate-800 text-rose-400 font-bold">{performanceMetrics.missDrs}</td>
                  <td className="p-3 border-r border-slate-800 text-cyan-300 font-bold">{performanceMetrics.workingDays}</td>
                  <td className="p-3 border-r border-slate-800 text-amber-300 font-bold">{performanceMetrics.drCallAvg}</td>
                  <td className="p-3 border-r border-slate-800 text-emerald-400 font-bold">{performanceMetrics.drCoverage}%</td>
                  <td className="p-3 border-r border-slate-800 text-purple-300 font-bold">{performanceMetrics.totalDrCalls}</td>
                  <td className="p-3 border-r border-slate-800 text-slate-300">{performanceMetrics.chemCall || '-'}</td>
                  <td className="p-3 border-r border-slate-800 text-slate-300">{performanceMetrics.chemCallAvg || '-'}</td>
                  <td className="p-3 border-r border-slate-800 text-slate-400">{performanceMetrics.achPct || '-'}</td>
                  <td className="p-3 border-r border-slate-800 text-yellow-300 font-black">₹{performanceMetrics.primaryAmt}</td>
                  <td className="p-3 text-slate-400">{performanceMetrics.secondaryAmt || '-'}</td>
                </tr>"""

new_perf_row = """                <tr>
                  <td className="p-3 border-r border-slate-800 text-slate-500 font-bold">{performanceMetrics.srNo || 1}</td>
                  <td className="p-3 border-r border-slate-800 text-white font-bold">{blankPerfValues ? '-' : performanceMetrics.totalDr}</td>
                  <td className="p-3 border-r border-slate-800 text-rose-400 font-bold">{blankPerfValues ? '-' : performanceMetrics.missDrs}</td>
                  <td className="p-3 border-r border-slate-800 text-cyan-300 font-bold">{blankPerfValues ? '-' : performanceMetrics.workingDays}</td>
                  <td className="p-3 border-r border-slate-800 text-amber-300 font-bold">{blankPerfValues ? '-' : performanceMetrics.drCallAvg}</td>
                  <td className="p-3 border-r border-slate-800 text-emerald-400 font-bold">{blankPerfValues ? '-' : `${performanceMetrics.drCoverage}%`}</td>
                  <td className="p-3 border-r border-slate-800 text-purple-300 font-bold">{blankPerfValues ? '-' : performanceMetrics.totalDrCalls}</td>
                  <td className="p-3 border-r border-slate-800 text-slate-300">{blankPerfValues ? '-' : (performanceMetrics.chemCall || '-')}</td>
                  <td className="p-3 border-r border-slate-800 text-slate-300">{blankPerfValues ? '-' : (performanceMetrics.chemCallAvg || '-')}</td>
                  <td className="p-3 border-r border-slate-800 text-slate-400">{blankPerfValues ? '-' : (performanceMetrics.achPct || '-')}</td>
                  <td className="p-3 border-r border-slate-800 text-yellow-300 font-black">{blankPerfValues ? '-' : `₹${performanceMetrics.primaryAmt}`}</td>
                  <td className="p-3 text-slate-400">{blankPerfValues ? '-' : (performanceMetrics.secondaryAmt || '-')}</td>
                </tr>"""

if old_perf_row in code:
    code = code.replace(old_perf_row, new_perf_row)

with open('src/components/ExpenseWorkspace.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("✅ src/components/ExpenseWorkspace.tsx cleanly updated with PDF button & Blank Table toggle!")
