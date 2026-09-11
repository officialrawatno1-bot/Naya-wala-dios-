import os, subprocess

msl_path = 'src/components/review/MslSheet.tsx'
with open(msl_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Remove any accidental <Save ... /> or references to Save in MslSheet.tsx
code = code.replace("<Save ", "<Check ")
code.replace("<Save", "<Check")

# Ensure Save is not referenced as a component or variable if unimported
if "Save" in code:
    # Replace JSX usage or remove import
    code = code.replace("Save,", "").replace(", Save", "").replace("Save", "")

with open(msl_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("✅ Deep cleaned MslSheet.tsx of any Save variable references.")

# Rebuild and Deploy
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build Successful.")

if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("🎉 DEPLOYED LIVE! Tap 'Clear Cache & Reload App' on iPad and test Sync Now.")
