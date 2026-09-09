import os, sys, subprocess

print("==========================================================================")
print("🔍 [DEEP AUDIT] FIXING STOCKIST BUTTON LABELS, AUTO-GUARD & STORE SYNC...")
print("==========================================================================")

# 1. Update src/components/PartywiseAggregatorVault.tsx
vault_path = 'src/components/PartywiseAggregatorVault.tsx'
with open(vault_path, 'r', encoding='utf-8') as f:
    vcode = f.read()

# Fix 1: Type union for selectedStockist
vcode = vcode.replace(
    "const [selectedStockist, setSelectedStockist] = useState<'all' | 'dwarika' | 'modi'>('dwarika');",
    "const [selectedStockist, setSelectedStockist] = useState<'all' | 'dwarika' | 'modi' | 'nagda'>('dwarika');"
)

# Fix 2: Dynamic Upload Button Text
old_btn_span = "<span>{isParsing ? 'Processing...' : `Upload ${selectedStockist === 'modi' ? 'Modi' : 'Dwarika'} PDF`}</span>"
new_btn_span = """<span>
              {isParsing 
                ? 'Processing...' 
                : `Upload ${
                    selectedStockist === 'nagda' 
                      ? 'Nagda' 
                      : selectedStockist === 'modi' 
                      ? 'Modi' 
                      : selectedStockist === 'dwarika' 
                      ? 'Dwarika' 
                      : 'Statement'
                  } PDF`}
            </span>"""

if old_btn_span in vcode:
    vcode = vcode.replace(old_btn_span, new_btn_span)
else:
    # Universal replace for button label
    import re
    vcode = re.sub(
        r"<span>\{isParsing\s*\?\s*'Processing\.\.\.'\s*:\s*`Upload[^`]*PDF`\}<\/span>",
        new_btn_span,
        vcode
    )

# Fix 3: Intelligent Auto-Stockist Detection in handleFileUpload
old_upload_handler_start = """  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    const targetStockistName = selectedStockist === 'nagda' ? 'Nagda Distributors' : selectedStockist === 'modi' ? 'Modi Distributors' : 'Dwarika Medicals';
    setStatusMsg(`Parsing ${targetStockistName} PDF '${file.name}'...`);"""

new_upload_handler_start = """  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    
    // Auto-detect stockist from file name or active tab
    const fUpper = file.name.toUpperCase();
    let effectiveStockist: 'dwarika' | 'modi' | 'nagda' = 
      selectedStockist === 'all' ? 'dwarika' : selectedStockist;

    if (fUpper.includes('NAGDA')) effectiveStockist = 'nagda';
    else if (fUpper.includes('MODI')) effectiveStockist = 'modi';
    else if (fUpper.includes('DWARIKA')) effectiveStockist = 'dwarika';

    if (effectiveStockist !== selectedStockist && selectedStockist !== 'all') {
      setSelectedStockist(effectiveStockist);
    }

    const targetStockistName = 
      effectiveStockist === 'nagda' ? 'Nagda Distributors' : 
      effectiveStockist === 'modi' ? 'Modi Distributors' : 
      'Dwarika Medicals';

    setStatusMsg(`Parsing ${targetStockistName} PDF '${file.name}'...`);"""

vcode = vcode.replace(old_upload_handler_start, new_upload_handler_start)

# Ensure the parser call uses effectiveStockist
vcode = vcode.replace(
    "if (selectedStockist === 'nagda') {",
    "if (effectiveStockist === 'nagda') {"
)
vcode = vcode.replace(
    "} else if (selectedStockist === 'modi') {",
    "} else if (effectiveStockist === 'modi') {"
)
vcode = vcode.replace(
    "const stId = selectedStockist === 'all' ? 'dwarika' : selectedStockist;",
    "const stId = effectiveStockist;"
)

with open(vault_path, 'w', encoding='utf-8') as f:
    f.write(vcode)
print("✅ 1. PartywiseAggregatorVault.tsx button labels & auto-guard fixed.")

# 2. Update src/data/freeGoodsStore.ts to ensure Nagda/Modi data is read from multi-stockist store
store_path = 'src/data/freeGoodsStore.ts'
with open(store_path, 'r', encoding='utf-8') as f:
    scode = f.read()

# Fix multi-month sync to read from stockist map
old_sync_logic = """    monthCodes.forEach(mCode => {
      if (!this.data[mCode]) this.data[mCode] = {};
      if (!this.data[mCode][partyId]) this.data[mCode][partyId] = {};

      const partyRecords = partywiseAggregatorStore.data[mCode] || [];"""

new_sync_logic = """    monthCodes.forEach(mCode => {
      if (!this.data[mCode]) this.data[mCode] = {};
      if (!this.data[mCode][partyId]) this.data[mCode][partyId] = {};

      const mStoreData: any = partywiseAggregatorStore.data[mCode] || {};
      const partyRecords = Array.isArray(mStoreData) 
        ? mStoreData 
        : (mStoreData[partyId] || mStoreData[partyId.toLowerCase()] || []);"""

scode = scode.replace(old_sync_logic, new_sync_logic)

old_dist_logic = """    monthCodes.forEach(mCode => {
      const partyRecords = partywiseAggregatorStore.data[mCode] || [];"""

new_dist_logic = """    monthCodes.forEach(mCode => {
      const mStoreData: any = partywiseAggregatorStore.data[mCode] || {};
      const partyRecords = Array.isArray(mStoreData) 
        ? mStoreData 
        : (mStoreData[partyId] || mStoreData[partyId.toLowerCase()] || []);"""

scode = scode.replace(old_dist_logic, new_dist_logic)

old_summary_count = """      monthCodes.forEach(mCode => {
        const records = partywiseAggregatorStore.data[mCode] || [];"""

new_summary_count = """      monthCodes.forEach(mCode => {
        const mStoreData: any = partywiseAggregatorStore.data[mCode] || {};
        const records = Array.isArray(mStoreData) 
          ? mStoreData 
          : (mStoreData[partyId] || mStoreData[partyId.toLowerCase()] || []);"""

scode = scode.replace(old_summary_count, new_summary_count)

with open(store_path, 'w', encoding='utf-8') as f:
    f.write(scode)
print("✅ 2. freeGoodsStore.ts updated for stockist-specific data fetching.")

# 3. Build Vite Production Bundle
print("\n📦 [2/3] Compiling Production Bundle (npm run build)...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful.")

# 4. Direct Cloudflare Pages Deploy
print("\n☁️ [3/3] Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Button label fixed & deep audit complete!")
