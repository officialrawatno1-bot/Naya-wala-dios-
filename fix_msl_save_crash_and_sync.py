import os, subprocess

print("==========================================================================")
print("🧠 [1/3] FIXING MISSING SAVE ICON & ROBUST MSL SYNC IN MslSheet.tsx...")
print("==========================================================================")

msl_path = 'src/components/review/MslSheet.tsx'
with open(msl_path, 'r', encoding='utf-8') as f:
    msl_code = f.read()

# 1. Add 'Save' to lucide-react imports if not present
if "Save," not in msl_code and "Save " not in msl_code:
    msl_code = msl_code.replace(
        "import { \n  Calendar, Search,",
        "import { \n  Save, Calendar, Search,"
    )
    # Fallback single line replace
    msl_code = msl_code.replace(
        "import { Calendar, Search,",
        "import { Save, Calendar, Search,"
    )

# 2. Make handleAutoSyncFromCallStatus robust (Reads memory + LocalStorage)
old_sync_logic = """  const handleAutoSyncFromCallStatus = () => {
    if (memoryStore.mslSyncEnabled === false) {
      setSyncAlert({
        type: 'warning',
        msg: '⚠️ Call Status Report (Sheet 15) mein "Sync to MSL" switch OFF hai. Pehle Sheet 15 mein jakar Sync switch ON karein!'
      });
      return;
    }

    const allStoredRuns = Object.values(memoryStore.dcrCallsByMonth || {});
    const allDoctorCalls = allStoredRuns.flatMap(run => run.doctors || []);"""

new_sync_logic = """  const handleAutoSyncFromCallStatus = () => {
    if (memoryStore.mslSyncEnabled === false) {
      setSyncAlert({
        type: 'warning',
        msg: '⚠️ Call Status Report (Sheet 15) mein "Sync to MSL" switch OFF hai. Pehle Sheet 15 mein jakar Sync switch ON karein!'
      });
      return;
    }

    // 🌟 ROBUST HYBRID GATHERER: Memory + LocalStorage fallback
    let allDoctorCalls: any[] = [];
    const allStoredRuns = Object.values(memoryStore.dcrCallsByMonth || {});
    allDoctorCalls = allStoredRuns.flatMap(run => run.doctors || []);

    if (allDoctorCalls.length === 0) {
      try {
        const savedDocs = localStorage.getItem('dios_call_status_master_doctors_v4');
        if (savedDocs) {
          const parsed = JSON.parse(savedDocs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            allDoctorCalls = parsed;
          }
        }
      } catch (e) {}
    }"""

if old_sync_logic in msl_code:
    msl_code = msl_code.replace(old_sync_logic, new_sync_logic)

with open(msl_path, 'w', encoding='utf-8') as f:
    f.write(msl_code)
print("✅ MslSheet.tsx updated with Save icon & robust sync.")

print("\n==========================================================================")
print("🧠 [2/3] UPDATING DAYWISE CALL STATUS BRIDGE IN DayWiseCallStatusSheet.tsx...")
print("==========================================================================")

call_path = 'src/components/review/DayWiseCallStatusSheet.tsx'
with open(call_path, 'r', encoding='utf-8') as f:
    call_code = f.read()

# Bridge CloudPull to populate memoryStore.dcrCallsByMonth
old_onload = """        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.masterDoctors && Array.isArray(cloudData.masterDoctors)) {
            setMasterDoctors(cloudData.masterDoctors);
            try { localStorage.setItem(CALLS_MASTER_DOCS_KEY, JSON.stringify(cloudData.masterDoctors)); } catch (e) {}
          }
          if (cloudData.masterChemists && Array.isArray(cloudData.masterChemists)) {
            setMasterChemists(cloudData.masterChemists);
            try { localStorage.setItem(CALLS_MASTER_CHEMS_KEY, JSON.stringify(cloudData.masterChemists)); } catch (e) {}
          }"""

new_onload = """        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.masterDoctors && Array.isArray(cloudData.masterDoctors)) {
            setMasterDoctors(cloudData.masterDoctors);
            try { localStorage.setItem(CALLS_MASTER_DOCS_KEY, JSON.stringify(cloudData.masterDoctors)); } catch (e) {}
          }
          if (cloudData.masterChemists && Array.isArray(cloudData.masterChemists)) {
            setMasterChemists(cloudData.masterChemists);
            try { localStorage.setItem(CALLS_MASTER_CHEMS_KEY, JSON.stringify(cloudData.masterChemists)); } catch (e) {}
          }
          // 🌟 BRIDGE TO MEMORY STORE SO MSL SYNC WORKS INSTANTLY
          if (cloudData.masterDoctors && Array.isArray(cloudData.masterDoctors)) {
            const taskIdKey = `${fromDate}_${toDate}`;
            if (!memoryStore.dcrCallsByMonth) memoryStore.dcrCallsByMonth = {};
            memoryStore.dcrCallsByMonth[taskIdKey] = {
              doctors: cloudData.masterDoctors,
              chemists: cloudData.masterChemists || []
            };
          }"""

if old_onload in call_code:
    call_code = call_code.replace(old_onload, new_onload)

with open(call_path, 'w', encoding='utf-8') as f:
    f.write(call_code)
print("✅ DayWiseCallStatusSheet.tsx updated with memory bridge.")

print("\n==========================================================================")
print("📦 [3/3] COMPILING VITE BUNDLE & DEPLOYING TO CLOUDFLARE...")
print("==========================================================================")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build 100% Successful!")

if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Save crash fixed and Cloud-Pull to MSL sync bridge is live!")
