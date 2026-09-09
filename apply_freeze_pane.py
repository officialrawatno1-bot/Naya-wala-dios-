import os

print("==========================================================================")
print("❄️ [APPLYING IPAD-OPTIMIZED FREEZE PANE UP TO ACTUAL STATION]...")
print("==========================================================================")

with open('src/components/ExpenseWorkspace.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update Table Container and Table Tag
old_table_wrap = """        <div className="overflow-x-auto max-h-[540px] border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
              <tr>
                <th className="p-2.5 text-center w-10">#</th>
                <th className="p-2.5 min-w-[95px] text-cyan-400">Date</th>
                <th className="p-2.5 min-w-[140px] text-white">Actual Station</th>"""

new_table_wrap = """        <div className="overflow-x-auto max-h-[540px] border border-slate-800 rounded-xl relative shadow-xl">
          <table className="w-full text-left text-xs border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 bg-slate-950">
              <tr>
                {/* ❄️ FROZEN COL 1: SR NO */}
                <th style={{ width: '42px', minWidth: '42px', maxWidth: '42px', left: 0 }} className="p-2.5 text-center bg-slate-950 text-slate-400 font-bold uppercase border-b border-r border-slate-800 sticky z-40">
                  #
                </th>
                {/* ❄️ FROZEN COL 2: DATE */}
                <th style={{ width: '92px', minWidth: '92px', maxWidth: '92px', left: '42px' }} className="p-2.5 text-center bg-slate-950 text-cyan-400 font-bold uppercase border-b border-r border-slate-800 sticky z-40">
                  Date
                </th>
                {/* ❄️ FROZEN COL 3: ACTUAL STATION (DIVIDER WITH CYAN BORDER) */}
                <th style={{ width: '145px', minWidth: '145px', maxWidth: '145px', left: '134px' }} className="p-2.5 bg-slate-950 text-white font-bold uppercase border-b border-r-2 border-cyan-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky z-40">
                  Actual Station
                </th>"""

if old_table_wrap in code:
    code = code.replace(old_table_wrap, new_table_wrap)

# 2. Update tbody Row Cells for Col 1, 2, 3
old_body_cells = """                    <tr key={idx} className={`transition ${
                      isSunday ? 'bg-rose-950/20' : isLeave ? 'bg-amber-950/15' : isHoliday ? 'bg-purple-950/20' : 'hover:bg-slate-800/40'
                    }`}>
                      <td className="p-2 text-center text-slate-500 font-mono">{row.srNo}</td>
                      <td className="p-2 text-cyan-300 font-mono">{row.date}</td>
                      
                      <td className="p-1">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={row.actualStation}
                            onChange={e => handleCellChange(idx, 'actualStation', e.target.value)}
                            className="w-full py-1 px-1.5 bg-transparent font-sans font-semibold text-white rounded focus:bg-slate-950"
                          />
                          {isBanswara && (
                            <span className="text-[8px] bg-amber-500 text-slate-950 font-black px-1 rounded uppercase tracking-tighter shrink-0" title="Banswara rule: 372 KM active">
                              372K
                            </span>
                          )}
                        </div>
                      </td>"""

new_body_cells = """                    <tr key={idx} className={`transition group ${
                      isSunday ? 'bg-rose-950/20 hover:bg-rose-950/30' : isLeave ? 'bg-amber-950/15 hover:bg-amber-950/25' : isHoliday ? 'bg-purple-950/20 hover:bg-purple-950/30' : 'hover:bg-slate-800/60'
                    }`}>
                      {/* ❄️ FROZEN 1: SR NO */}
                      <td style={{ width: '42px', minWidth: '42px', maxWidth: '42px', left: 0 }} className="p-2 text-center text-slate-500 font-mono border-b border-r border-slate-800/80 sticky left-0 bg-slate-900 group-hover:bg-slate-800 z-20">
                        {row.srNo}
                      </td>

                      {/* ❄️ FROZEN 2: DATE */}
                      <td style={{ width: '92px', minWidth: '92px', maxWidth: '92px', left: '42px' }} className="p-2 text-cyan-300 font-mono text-center border-b border-r border-slate-800/80 sticky left-[42px] bg-slate-900 group-hover:bg-slate-800 z-20">
                        {row.date}
                      </td>

                      {/* ❄️ FROZEN 3: ACTUAL STATION (DIVIDER) */}
                      <td style={{ width: '145px', minWidth: '145px', maxWidth: '145px', left: '134px' }} className="p-1 border-b border-r-2 border-cyan-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky left-[134px] bg-slate-900 group-hover:bg-slate-800 z-20">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={row.actualStation}
                            onChange={e => handleCellChange(idx, 'actualStation', e.target.value)}
                            className="w-full py-1 px-1.5 bg-transparent font-sans font-semibold text-white rounded focus:bg-slate-950"
                          />
                          {isBanswara && (
                            <span className="text-[8px] bg-amber-500 text-slate-950 font-black px-1 rounded uppercase tracking-tighter shrink-0" title="Banswara rule: 372 KM active">
                              372K
                            </span>
                          )}
                        </div>
                      </td>"""

if old_body_cells in code:
    code = code.replace(old_body_cells, new_body_cells)

# 3. Update tfoot Cells for Col 1, 2, 3
old_tfoot = """            <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-slate-700 font-bold z-10 text-xs">
              <tr>
                <td className="p-2.5 text-center text-cyan-400 font-mono">Σ</td>
                <td className="p-2.5 text-white font-sans uppercase" colSpan={6}>TOTAL ({selectedMonth})</td>"""

new_tfoot = """            <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-slate-700 font-bold z-30 text-xs">
              <tr>
                {/* ❄️ FROZEN TFOOT COLUMNS */}
                <td style={{ width: '42px', minWidth: '42px', maxWidth: '42px', left: 0 }} className="p-2.5 text-center text-cyan-400 font-mono border-r border-slate-800 sticky left-0 bg-slate-950 z-40">Σ</td>
                <td style={{ width: '92px', minWidth: '92px', maxWidth: '92px', left: '42px' }} className="p-2.5 text-white font-sans uppercase border-r border-slate-800 sticky left-[42px] bg-slate-950 z-40 text-center">TOTAL</td>
                <td style={{ width: '145px', minWidth: '145px', maxWidth: '145px', left: '134px' }} className="p-2.5 text-slate-300 font-mono border-r-2 border-cyan-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky left-[134px] bg-slate-950 z-40">{selectedMonth}</td>
                <td colSpan={4} className="p-2.5 text-slate-400 font-mono border-r border-slate-800">-</td>"""

if old_tfoot in code:
    code = code.replace(old_tfoot, new_tfoot)

with open('src/components/ExpenseWorkspace.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("✅ Freeze pane up to Actual Station successfully applied to ExpenseWorkspace.tsx!")
