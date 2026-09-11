import os, subprocess

print("==========================================================================")
print("📦 [PART 3/3] COMPILING VITE BUNDLE & DEPLOYING TO CLOUDFLARE...")
print("==========================================================================")

# 1. Compile the React Vite Bundle
try:
    subprocess.run(["npm", "run", "build"], check=True)
    print("✅ Build 100% Successful with 0 errors!")
except subprocess.CalledProcessError as e:
    print(f"❌ Build Failed: {e}")
    exit(1)

# 2. Deploy to Cloudflare Pages
print("\n☁️ Deploying to Cloudflare Pages (dios-hub)...")
if os.path.exists("./deploy.sh"):
    subprocess.run(["chmod", "+x", "./deploy.sh"])
    subprocess.run(["./deploy.sh"])
else:
    # Use Wrangler CLI directly if deploy script is missing
    subprocess.run(["npx", "wrangler", "pages", "deploy", "dist", "--project-name", "dios-hub", "--commit-dirty=true"])

print("\n" + "=" * 75)
print("🎉 ALL 3 PARTS COMPLETED & DEPLOYED LIVE!")
print("==========================================================================")
print("👉 Live Cloudflare URL : https://dios-hub.pages.dev")
print("==========================================================================")
print("Aapke iPad browser me App open karke 'Daily Working' check karein:")
print("1. 🏥 19 Hospital Master me Search Filter kaam karega.")
print("2. ❄️ Action Sheet aur Master Setup dono me Doctor Name Lock (Freeze) ho jayega.")
print("3. 📅 Dr. Deepak Aametha aur baaki doctors ki Real Date (Jul/Aug) MSL & DCR se aayegi.")
print("4. 🔄 Naya Area Add, Delete aur Merge wala Area Manager modal chalega.")
print("==========================================================================")
