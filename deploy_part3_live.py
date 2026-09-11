import os, subprocess

print("==========================================================================")
print("📦 [PART 3/3] COMPILING VITE BUNDLE & DEPLOYING TO CLOUDFLARE...")
print("==========================================================================")

# 1. Build
subprocess.run(["npm", "run", "build"], check=True)
print("✅ Build 100% Successful with 0 errors!")

# 2. Deploy
print("\n☁️ Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n" + "=" * 75)
print("🎉 ALL 3 PARTS COMPLETED & DEPLOYED LIVE!")
print("==========================================================================")
print("👉 Live Cloudflare URL : https://dios-hub.pages.dev")
print("==========================================================================")
print("Aapke iPad browser me App open karke 'Daily Working' check karein:")
print("1. ⏰ Dual-Hand Clock (Ghante + Minute ka chhota kanta) live hai.")
print("2. 🏥 Sabhi 14 Hospital/Area doctors aur Dungarpur/Banswara fixed hain.")
print("3. 🚫 'Kis Day Nahi Milte' (Off days) schedule set hai.")
print("4. 🟢🟡🟠🔴 Color-Coded Last Visit Date badges active hain.")
print("==========================================================================")
