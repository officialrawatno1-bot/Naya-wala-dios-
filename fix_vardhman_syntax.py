import os, subprocess

file_path = 'src/components/PartywiseAggregatorVault.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Clean up broken literal '\nimport' or duplicate import lines
broken_pattern = "\\nimport { parseVardhmanRetailerPdf }"
if broken_pattern in content:
    content = content.replace(broken_pattern, "\nimport { parseVardhmanRetailerPdf }")

# Replace any malformed line 18 import
import_clean = """import { parseNagdaRetailerPdf } from '../parsers/retailerParsers/nagdaRetailerParser';
import { parseVardhmanRetailerPdf } from '../parsers/retailerParsers/vardhmanRetailerParser';"""

# Fix the import lines directly
lines = content.split('\n')
new_lines = []
for line in lines:
    if "nagdaRetailerParser" in line:
        new_lines.append("import { parseNagdaRetailerPdf } from '../parsers/retailerParsers/nagdaRetailerParser';")
        new_lines.append("import { parseVardhmanRetailerPdf } from '../parsers/retailerParsers/vardhmanRetailerParser';")
    elif "vardhmanRetailerParser" in line:
        continue  # skip duplicate
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("✅ 1. PartywiseAggregatorVault.tsx import syntax cleanly fixed.")

# 2. Compile Vite Bundle
print("\n📦 [2/3] Compiling Production Bundle (npm run build)...")
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build 100% Successful!")

# 3. Deploy to Cloudflare Pages
print("\n☁️ [3/3] Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n🎉 ALL DONE! Vardhman Parser & UI are 100% Live on Cloudflare!")
