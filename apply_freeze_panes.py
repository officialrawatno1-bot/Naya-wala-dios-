import os, sys, subprocess

print("==========================================================================")
print("❄️ [FREEZE PANES] FREEZING COLUMNS UP TO ADDRESS IN PARTYWISE ANALYSIS...")
print("==========================================================================")

with open('src/components/PartywiseAggregatorVault.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the Chemist Table with Freeze Panes up to Address
old_table_start = """      {/* VIEW 1: CHEMIST DIRECTORY TABLE */}
      {activeTabMode === 'CHEMISTS' ? (
        <div className="overflow-x-auto max-h-[550px] border border-slate-800 rounded-2xl shadow-xl bg-slate-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3 min-w-[220px]">Retailer / Chemist Name</th>
                <th className="p-3 min-w-[130px] text-cyan-300">Address</th>
                <th className="p-3 min-w-[120px] text-slate-400">Stockist</th>
                <th className="p-3 min-w-[240px] text-amber-400">Allocated MSL Doctors</th>
                <th className="p-3 text-center w-24 text-cyan-400">Sales Qty</th>
                <th className="p-3 text-center w-20 text-amber-400">Free Qty</th>
                <th className="p-3 text-center w-24 text-slate-200">Total Units</th>
                <th className="p-3 text-right min-w-[130px] text-emerald-400">Sales Amount (₹)</th>
                <th className="p-3 text-right min-w-[140px] text-emerald-300">Gross (₹ Qty+Free)</th>
                <th className="p-3 text-center w-16">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
              {filteredRetailers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500 font-sans">
                    No retailer records for {selectedMonthCode} ({selectedStockist.toUpperCase()}). Upload statement PDF above to populate data!
                  </td>
                </tr>
              ) : (
                filteredRetailers.map((r, idx) => {
                  const allocs = partywiseAggregatorStore.getAllocationsForRetailer(selectedMonthCode, r.key);
                  const hasAllocs = allocs.length > 0;

                  return (
                    <tr key={r.key} className="hover:bg-slate-800/40 transition">
                      <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-sans font-bold text-white">{r.retailerName}</td>
                      <td className="p-2.5 text-cyan-300">{r.address}</td>
                      <td className="p-2.5 font-sans text-slate-400">
                        {r.stockists.map(st => (
                          <span key={st} className={`inline-block px-1.5 py-0.5 rounded text-[10px] mr-1 ${st === 'Modi' ? 'bg-purple-950 text-purple-300 border border-purple-500/40' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'}`}>
                            {st}
                          </span>
                        ))}
                      </td>"""

new_table_start = """      {/* VIEW 1: CHEMIST DIRECTORY TABLE (FREEZE PANES UP TO ADDRESS) */}
      {activeTabMode === 'CHEMISTS' ? (
        <div className="overflow-x-auto max-h-[550px] border border-slate-800 rounded-2xl shadow-xl bg-slate-950 relative">
          <table className="w-full text-left text-xs border-separate border-spacing-0">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-30">
              <tr>
                {/* ❄️ FROZEN COL 1: # (SrNo) */}
                <th style={{ width: '44px', minWidth: '44px', maxWidth: '44px', left: 0 }} className="p-3 text-center bg-slate-950 border-b border-r border-slate-800 sticky z-40 text-slate-400">
                  #
                </th>
                {/* ❄️ FROZEN COL 2: CHEMIST NAME */}
                <th style={{ width: '220px', minWidth: '220px', maxWidth: '220px', left: '44px' }} className="p-3 bg-slate-950 border-b border-r border-slate-800 sticky z-40 text-white">
                  Retailer / Chemist Name
                </th>
                {/* ❄️ FROZEN COL 3: ADDRESS (DIVIDER WITH CYAN BORDER) */}
                <th style={{ width: '130px', minWidth: '130px', maxWidth: '130px', left: '264px' }} className="p-3 bg-slate-950 border-b border-r-2 border-cyan-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky z-40 text-cyan-300">
                  Address
                </th>
                <th className="p-3 min-w-[120px] text-slate-400 border-b border-r border-slate-800">Stockist</th>
                <th className="p-3 min-w-[240px] text-amber-400 border-b border-r border-slate-800">Allocated MSL Doctors</th>
                <th className="p-3 text-center w-24 text-cyan-400 border-b border-r border-slate-800">Sales Qty</th>
                <th className="p-3 text-center w-20 text-amber-400 border-b border-r border-slate-800">Free Qty</th>
                <th className="p-3 text-center w-24 text-slate-200 border-b border-r border-slate-800">Total Units</th>
                <th className="p-3 text-right min-w-[130px] text-emerald-400 border-b border-r border-slate-800">Sales Amount (₹)</th>
                <th className="p-3 text-right min-w-[140px] text-emerald-300 border-b border-r border-slate-800">Gross (₹ Qty+Free)</th>
                <th className="p-3 text-center w-16 border-b border-slate-800">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs bg-slate-900">
              {filteredRetailers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500 font-sans">
                    No retailer records for {selectedMonthCode} ({selectedStockist.toUpperCase()}). Upload statement PDF above to populate data!
                  </td>
                </tr>
              ) : (
                filteredRetailers.map((r, idx) => {
                  const allocs = partywiseAggregatorStore.getAllocationsForRetailer(selectedMonthCode, r.key);
                  const hasAllocs = allocs.length > 0;

                  return (
                    <tr key={r.key} className="hover:bg-slate-800/60 transition group">
                      {/* ❄️ FROZEN TD 1: # */}
                      <td style={{ width: '44px', minWidth: '44px', maxWidth: '44px', left: 0 }} className="p-2.5 text-center text-slate-500 border-b border-r border-slate-800/80 sticky z-20 bg-slate-900 group-hover:bg-slate-800">
                        {idx + 1}
                      </td>
                      {/* ❄️ FROZEN TD 2: NAME */}
                      <td style={{ width: '220px', minWidth: '220px', maxWidth: '220px', left: '44px' }} className="p-2.5 font-sans font-bold text-white border-b border-r border-slate-800/80 sticky z-20 bg-slate-900 group-hover:bg-slate-800 truncate">
                        {r.retailerName}
                      </td>
                      {/* ❄️ FROZEN TD 3: ADDRESS (DIVIDER) */}
                      <td style={{ width: '130px', minWidth: '130px', maxWidth: '130px', left: '264px' }} className="p-2.5 text-cyan-300 border-b border-r-2 border-cyan-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky z-20 bg-slate-900 group-hover:bg-slate-800">
                        {r.address}
                      </td>
                      <td className="p-2.5 font-sans text-slate-400 border-b border-r border-slate-800/80">
                        {r.stockists.map(st => (
                          <span key={st} className={`inline-block px-1.5 py-0.5 rounded text-[10px] mr-1 ${st === 'Modi' ? 'bg-purple-950 text-purple-300 border border-purple-500/40' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'}`}>
                            {st}
                          </span>
                        ))}
                      </td>"""

code = code.replace(old_table_start, new_table_start)

# Update the Chemist Directory Table Footer for Freeze Alignment
old_tfoot = """            <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-slate-700 font-bold z-10 text-xs font-mono">
              <tr>
                <td className="p-3 text-center text-cyan-400">Σ</td>
                <td className="p-3 text-white font-sans uppercase" colSpan={4}>GRAND TOTAL ({selectedMonthCode} - {selectedStockist.toUpperCase()})</td>
                <td className="p-3 text-center text-cyan-300 font-black">{grandMetrics.totSalesQty.toLocaleString()}</td>
                <td className="p-3 text-center text-amber-300 font-black">{grandMetrics.totFreeQty.toLocaleString()}</td>
                <td className="p-3 text-center text-white font-black bg-slate-900">{grandMetrics.totUnits.toLocaleString()}</td>
                <td className="p-3 text-right text-emerald-400 font-black">₹{grandMetrics.totSalesAmt.toLocaleString()}</td>
                <td className="p-3 text-right text-emerald-300 font-black bg-emerald-950/50">₹{grandMetrics.totGrossAmt.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>"""

new_tfoot = """            <tfoot className="sticky bottom-0 bg-slate-950 border-t-2 border-slate-700 font-bold z-30 text-xs font-mono">
              <tr>
                {/* ❄️ FROZEN FOOTER CELLS */}
                <td style={{ width: '44px', minWidth: '44px', maxWidth: '44px', left: 0 }} className="p-3 text-center text-cyan-400 border-r border-slate-800 sticky z-40 bg-slate-950">
                  Σ
                </td>
                <td style={{ width: '220px', minWidth: '220px', maxWidth: '220px', left: '44px' }} className="p-3 text-white font-sans uppercase border-r border-slate-800 sticky z-40 bg-slate-950">
                  GRAND TOTAL
                </td>
                <td style={{ width: '130px', minWidth: '130px', maxWidth: '130px', left: '264px' }} className="p-3 text-slate-300 font-mono border-r-2 border-cyan-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky z-40 bg-slate-950">
                  {selectedMonthCode}
                </td>
                <td colSpan={2} className="p-3 text-slate-400 font-sans border-r border-slate-800">
                  {selectedStockist.toUpperCase()}
                </td>
                <td className="p-3 text-center text-cyan-300 font-black border-r border-slate-800/80">{grandMetrics.totSalesQty.toLocaleString()}</td>
                <td className="p-3 text-center text-amber-300 font-black border-r border-slate-800/80">{grandMetrics.totFreeQty.toLocaleString()}</td>
                <td className="p-3 text-center text-white font-black bg-slate-900 border-r border-slate-800/80">{grandMetrics.totUnits.toLocaleString()}</td>
                <td className="p-3 text-right text-emerald-400 font-black border-r border-slate-800/80">₹{grandMetrics.totSalesAmt.toLocaleString()}</td>
                <td className="p-3 text-right text-emerald-300 font-black bg-emerald-950/50 border-r border-slate-800/80">₹{grandMetrics.totGrossAmt.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>"""

code = code.replace(old_tfoot, new_tfoot)

# Also freeze Doctor Name & Speciality in View 2 (MSL Doctor Intelligence)
old_doc_table_start = """      ) : (
        /* VIEW 2: MSL DOCTOR LINKED INTELLIGENCE SHEET */
        <div className="overflow-x-auto max-h-[550px] border border-slate-800 rounded-2xl shadow-xl bg-slate-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3 min-w-[200px] text-amber-400">MSL Doctor Name</th>
                <th className="p-3 min-w-[130px] text-slate-300">Speciality</th>
                <th className="p-3 min-w-[240px]">Contributing Chemist Stores</th>"""

new_doc_table_start = """      ) : (
        /* VIEW 2: MSL DOCTOR LINKED INTELLIGENCE SHEET (FROZEN DOCTOR PANES) */
        <div className="overflow-x-auto max-h-[550px] border border-slate-800 rounded-2xl shadow-xl bg-slate-950 relative">
          <table className="w-full text-left text-xs border-separate border-spacing-0">
            <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-30">
              <tr>
                <th style={{ width: '44px', minWidth: '44px', maxWidth: '44px', left: 0 }} className="p-3 text-center bg-slate-950 border-b border-r border-slate-800 sticky z-40 text-slate-400">
                  #
                </th>
                <th style={{ width: '200px', minWidth: '200px', maxWidth: '200px', left: '44px' }} className="p-3 bg-slate-950 border-b border-r border-slate-800 sticky z-40 text-amber-400">
                  MSL Doctor Name
                </th>
                <th style={{ width: '130px', minWidth: '130px', maxWidth: '130px', left: '244px' }} className="p-3 bg-slate-950 border-b border-r-2 border-amber-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky z-40 text-slate-300">
                  Speciality
                </th>
                <th className="p-3 min-w-[240px] border-b border-r border-slate-800">Contributing Chemist Stores</th>"""

code = code.replace(old_doc_table_start, new_doc_table_start)

# Update rows in Doctor View
old_doc_row = """                filteredDoctorAnalytics.map((doc, idx) => (
                  <tr key={doc.doctorName} className="hover:bg-slate-800/40 transition">
                    <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                    <td className="p-2.5 font-sans font-bold text-amber-300">Dr. {doc.doctorName}</td>
                    <td className="p-2.5 text-slate-300">{doc.speciality}</td>"""

new_doc_row = """                filteredDoctorAnalytics.map((doc, idx) => (
                  <tr key={doc.doctorName} className="hover:bg-slate-800/60 transition group">
                    <td style={{ width: '44px', minWidth: '44px', maxWidth: '44px', left: 0 }} className="p-2.5 text-center text-slate-500 border-b border-r border-slate-800/80 sticky z-20 bg-slate-900 group-hover:bg-slate-800">
                      {idx + 1}
                    </td>
                    <td style={{ width: '200px', minWidth: '200px', maxWidth: '200px', left: '44px' }} className="p-2.5 font-sans font-bold text-amber-300 border-b border-r border-slate-800/80 sticky z-20 bg-slate-900 group-hover:bg-slate-800 truncate">
                      Dr. {doc.doctorName}
                    </td>
                    <td style={{ width: '130px', minWidth: '130px', maxWidth: '130px', left: '244px' }} className="p-2.5 text-slate-300 border-b border-r-2 border-amber-500 shadow-[3px_0_10px_rgba(0,0,0,0.5)] sticky z-20 bg-slate-900 group-hover:bg-slate-800">
                      {doc.speciality}
                    </td>"""

code = code.replace(old_doc_row, new_doc_row)

with open('src/components/PartywiseAggregatorVault.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("✅ PartywiseAggregatorVault.tsx updated with freeze panes.")

# Build & Deploy
print("\n📦 Compiling Production Bundle (npm run build)...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful.")

print("\n☁️ Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Freeze Panes deployed live to Cloudflare Pages!")
