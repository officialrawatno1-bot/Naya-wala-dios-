import os, re, glob

print("=" * 80)
print("🔍 [DIOS CODEBASE FORENSIC INSPECTOR] DETECTING ATTACHED BACKEND ENGINES...")
print("=" * 80)

# 1. Inspect all fetch endpoints in Frontend (src/)
print("\n📌 1. FRONTEND API CALLS (src/):")
frontend_endpoints = set()
for root, dirs, files in os.walk("src"):
    for file in files:
        if file.endswith((".ts", ".tsx", ".js")):
            p = os.path.join(root, file)
            with open(p, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                matches = re.findall(r"fetch\(['\"](/api/[a-zA-Z0-9_\-]+)", content)
                for m in matches:
                    frontend_endpoints.add((m, file))

for ep, f in sorted(frontend_endpoints):
    print(f"   • {ep:<30} (called from: {f})")

# 2. Inspect Cloudflare Functions Proxies (functions/api/)
print("\n📌 2. CLOUDFLARE PROXY FUNCTIONS (functions/api/):")
for p in glob.glob("functions/api/*.ts"):
    fn_name = os.path.basename(p)
    with open(p, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        target = re.search(r"fetch\(['\"](https?://[^/'\"]+|/api/[^'\"]+)", content)
        target_url = target.group(1) if target else "Local / Relative"
        print(f"   • {fn_name:<30} ➔ Proxies to: {target_url}")

# 3. Inspect Python Backend Servers & Endpoints
print("\n📌 3. PYTHON BACKEND ENGINES & THEIR ATTACHED APIS:")
py_servers = []
for p in glob.glob("*.py") + glob.glob("faltu files/*.py"):
    with open(p, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        if "@app." in content or "FastAPI(" in content or "uvicorn.run" in content:
            routes = re.findall(r"@app\.(get|post|put|delete)\(['\"]([^'\"]+)", content)
            py_servers.append((p, routes))

for s_path, routes in py_servers:
    print(f"\n   📁 SERVER SCRIPT: {s_path}")
    if routes:
        for m, r in routes:
            print(f"      [{m.upper():<4}] {r}")
    else:
        print("      (No direct @app routes, might be engine runner)")

print("\n" + "=" * 80)
print("🎯 [FINAL RESULT] KAUNSA SERVER CHALANA HAI AUR KAISE:")
print("=" * 80)

print("""
👉 1. MAIN CODESPACE SERVER (Handles ALL Primary, DCR Excel, Calls & Expense):
   Command: python3 server.py
   Target Port: 8000
   APIs:
     - POST /api/fetch-primary          (CBO Primary Qty/Val)
     - POST /api/fetch-cbo-excel        (CBO Primary Excel Download)
     - POST /api/fetch-dcr-excel        (Sheet 2 Month FW Progress)
     - POST /api/fetch-sales-performance(Sheet 3 Sales Performance / SPO)
     - POST /api/start-dcr-extraction   (Sheet 15 Day-Wise Calls Scraper)
     - POST /api/retry-missed-dates     (Sheet 15 Recovery)
     - POST /api/fetch-expense          (CBO Expense Statement)

👉 2. FAST STANDALONE RUNNER (Direct WebMethod without Playwright):
   Command: python3 "faltu files/universal_server.py"
   Target Port: 8000

👉 3. LIVE TERMINAL WEB STREAMER (Real-time logs monitoring):
   Command: python3 live_terminal_server.py
   Target Port: 9000
""")
print("=" * 80)
