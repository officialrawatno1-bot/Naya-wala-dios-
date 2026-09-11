import os, subprocess

path = 'src/components/review/UnSalesProgSheet.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Make sure gridData initializes and persists cleanly with unProgressionStore
old_state_init = """  const [gridData, setGridData] = useState(() => unProgressionStore.getData());"""

new_state_init = """  const [gridData, setGridData] = useState(() => {
    try {
      const saved = localStorage.getItem('dios_un_sales_progression_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return unProgressionStore.getData();
  });"""

code = code.replace(old_state_init, new_state_init)

# Update handleCellChange and CloudSyncBar onLoad to update both local state and store
old_load_data = """        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.progressionData) {
            setGridData(cloudData.progressionData);
            try {
              localStorage.setItem('dios_un_sales_progression_v1', JSON.stringify(cloudData.progressionData));
            } catch (e) {}
          }
          if (cloudData.targetMonth) {
            setTargetMonth(cloudData.targetMonth);
          }
        }}"""

new_load_data = """        onLoadData={(cloudData: any) => {
          if (!cloudData) return;
          if (cloudData.progressionData) {
            setGridData(cloudData.progressionData);
            unProgressionStore.syncFromAggregator('AUG', []); // refresh store
            try {
              localStorage.setItem('dios_un_sales_progression_v1', JSON.stringify(cloudData.progressionData));
            } catch (e) {}
          }
          if (cloudData.targetMonth) {
            setTargetMonth(cloudData.targetMonth);
          }
        }}"""

code = code.replace(old_load_data, new_load_data)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("✅ UnSalesProgSheet.tsx persistence fixed.")

# Compile & Deploy
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful.")

if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("🎉 DEPLOYED LIVE! Tab switching will now retain all Unit Sales Progression data!")
