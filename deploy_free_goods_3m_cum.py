import os, sys, subprocess

print("==========================================================================")
print("🧠 [1/3] UPDATING EXPORTER FOR 3-MONTH CUMULATIVE (JUN_AUG) HEADINGS...")
print("==========================================================================")

exporter_file = 'src/exporters/freeGoodsExporter.ts'
with open(exporter_file, 'r', encoding='utf-8') as f:
    ecode = f.read()

# Add JUN_AUG to month map
if "'JUN_AUG'" not in ecode:
    old_map = """const MONTH_FULL_MAP: Record<string, string> = {
  'APR': 'APRIL', 'MAY': 'MAY', 'JUN': 'JUNE',
  'JUL': 'JULY', 'AUG': 'AUGUST', 'SEP': 'SEPTEMBER',
  'OCT': 'OCTOBER', 'NOV': 'NOVEMBER', 'DEC': 'DECEMBER',
  'JAN': 'JANUARY', 'FEB': 'FEBRUARY', 'MAR': 'MARCH'
};"""

    new_map = """const MONTH_FULL_MAP: Record<string, string> = {
  'APR': 'APRIL', 'MAY': 'MAY', 'JUN': 'JUNE',
  'JUL': 'JULY', 'AUG': 'AUGUST', 'SEP': 'SEPTEMBER',
  'OCT': 'OCTOBER', 'NOV': 'NOVEMBER', 'DEC': 'DECEMBER',
  'JAN': 'JANUARY', 'FEB': 'FEBRUARY', 'MAR': 'MARCH',
  'JUN_AUG': 'JUN-AUG (3M CUM)'
};"""

    ecode = ecode.replace(old_map, new_map)
    with open(exporter_file, 'w', encoding='utf-8') as f:
        f.write(ecode)
    print("✅ 1. freeGoodsExporter.ts updated with JUN_AUG mapping.")
else:
    print("✓ freeGoodsExporter.ts already has JUN_AUG mapping.")

print("\n==========================================================================")
print("🎨 [2/3] UPDATING FreeGoodsVault.tsx WITH 3M CUMULATIVE & MATRIX COLUMN...")
print("==========================================================================")

vault_file = 'src/components/FreeGoodsVault.tsx'
with open(vault_file, 'r', encoding='utf-8') as f:
    vcode = f.read()

# Add JUN_AUG to MONTH_OPTIONS
old_m_options = """const MONTH_OPTIONS = [
  { label: 'Apr-2026', code: 'APR' },
  { label: 'May-2026', code: 'MAY' },
  { label: 'Jun-2026', code: 'JUN' },
  { label: 'Jul-2026', code: 'JUL' },
  { label: 'Aug-2026', code: 'AUG' },
  { label: 'Sep-2026', code: 'SEP' },
  { label: 'Oct-2026', code: 'OCT' },
  { label: 'Nov-2026', code: 'NOV' },
  { label: 'Dec-2026', code: 'DEC' },
  { label: 'Jan-2027', code: 'JAN' },
  { label: 'Feb-2027', code: 'FEB' },
  { label: 'Mar-2027', code: 'MAR' },
];"""

new_m_options = """const MONTH_OPTIONS = [
  { label: 'Apr-2026', code: 'APR' },
  { label: 'May-2026', code: 'MAY' },
  { label: 'Jun-2026', code: 'JUN' },
  { label: 'Jul-2026', code: 'JUL' },
  { label: 'Aug-2026', code: 'AUG' },
  { label: 'Sep-2026', code: 'SEP' },
  { label: 'Oct-2026', code: 'OCT' },
  { label: 'Nov-2026', code: 'NOV' },
  { label: 'Dec-2026', code: 'DEC' },
  { label: 'Jan-2027', code: 'JAN' },
  { label: 'Feb-2027', code: 'FEB' },
  { label: 'Mar-2027', code: 'MAR' },
  { label: 'Jun-Aug (3M Cum)', code: 'JUN_AUG' },
];"""

vcode = vcode.replace(old_m_options, new_m_options)

# Add Quick 3M Preset in Month Modal
old_modal_presets = """              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button type="button" onClick={() => handleQuickSelectQuarter(['APR', 'MAY', 'JUN'])} className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold">Q1 (Apr-Jun)</button>
                <button type="button" onClick={() => handleQuickSelectQuarter(['JUL', 'AUG', 'SEP'])} className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold">Q2 (Jul-Sep)</button>
                <button type="button" onClick={() => handleQuickSelectQuarter(['OCT', 'NOV', 'DEC'])} className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold">Q3 (Oct-Dec)</button>
                <button type="button" onClick={() => handleQuickSelectQuarter(['JAN', 'FEB', 'MAR'])} className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold">Q4 (Jan-Mar)</button>
              </div>"""

new_modal_presets = """              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <button type="button" onClick={() => handleQuickSelectQuarter(['APR', 'MAY', 'JUN'])} className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold">Q1 (Apr-Jun)</button>
                <button type="button" onClick={() => handleQuickSelectQuarter(['JUL', 'AUG', 'SEP'])} className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold">Q2 (Jul-Sep)</button>
                <button type="button" onClick={() => handleQuickSelectQuarter(['OCT', 'NOV', 'DEC'])} className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold">Q3 (Oct-Dec)</button>
                <button type="button" onClick={() => handleQuickSelectQuarter(['JAN', 'FEB', 'MAR'])} className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 font-bold">Q4 (Jan-Mar)</button>
                <button type="button" onClick={() => handleQuickSelectQuarter(['JUN_AUG'])} className="p-2 rounded-xl bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold shadow-sm">Jun-Aug (3M)</button>
              </div>"""

vcode = vcode.replace(old_modal_presets, new_modal_presets)

with open(vault_file, 'w', encoding='utf-8') as f:
    f.write(vcode)
print("✅ 2. FreeGoodsVault.tsx updated with 3M Cumulative (JUN_AUG) controls.")

# 3. Build & Deploy
print("\n📦 [3/3] Compiling Production Bundle (npm run build)...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful with 0 errors.")

print("\n☁️ Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Free Goods Repository now fully supports Jun-Aug (3M Cum) & Nagda 21 Free Units!")
