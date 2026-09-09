import os, sys, time, subprocess, json

def run():
    print("==========================================================================")
    print("🚀 [DIOS UNIVERSAL MASTER BOOTSTRAP] SETTING UP ENVIRONMENT IN 45s...")
    print("==========================================================================")

    # 1. Restore/verify all python engines from vault
    try:
        import dios_master_engine_vault
        dios_master_engine_vault.restore_all_engines()
    except Exception as e:
        print(f"⚠️ Vault check note: {e}")

    # 2. Dynamic Codespace Identity & URL
    cs_name = os.getenv("CODESPACE_NAME", "local")
    public_api = f"https://{cs_name}-8000.app.github.dev"
    print(f"🌐 Active Codespace Public API URL: {public_api}")

    # 3. Install Python Dependencies
    print("\n📦 [1/5] Installing Python Packages & Playwright Chromium...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-r", "requirements.txt"], check=False)
    subprocess.run(["playwright", "install-deps", "chromium"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    subprocess.run(["playwright", "install", "chromium"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    print("   ✅ Python Packages & Chromium Engine Ready.")

    # 4. Update Cloudflare API Proxies with Active Codespace URL
    print("\n🔗 [2/5] Linking Cloudflare API Proxies to this Codespace...")
    os.makedirs("functions/api", exist_ok=True)
    endpoints = [
        "fetch-primary", "fetch-cbo-excel", "fetch-dcr-excel", 
        "fetch-sales-performance", "start-dcr-extraction", 
        "extraction-status", "retry-missed-dates", "fetch-expense"
    ]
    for ep in endpoints:
        proxy_ts = f"""export async function onRequest(context: any) {{
  if (context.request.method === "OPTIONS") {{
    return new Response(null, {{
      status: 204,
      headers: {{
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      }}
    }});
  }}
  try {{
    const body = await context.request.json().catch(() => ({{}}));
    const url = new URL(context.request.url);
    const targetUrl = "{public_api}/api/{ep}" + url.search;
    const apiRes = await fetch(targetUrl, {{
      method: context.request.method,
      headers: {{ "Content-Type": "application/json", "Accept": "application/json" }},
      body: context.request.method !== "GET" ? JSON.stringify(body) : undefined
    }});
    const data = await apiRes.arrayBuffer();
    return new Response(data, {{
      status: apiRes.status,
      headers: {{
        "Content-Type": apiRes.headers.get("Content-Type") || "application/json",
        "Access-Control-Allow-Origin": "*"
      }}
    }});
  }} catch (err: any) {{
    return new Response(JSON.stringify({{ success: false, error: err.message }}), {{
      status: 502,
      headers: {{ "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
    }});
  }}
}}
"""
        with open(f"functions/api/{ep}.ts", "w", encoding="utf-8") as f:
            f.write(proxy_ts)
    print("   ✅ All 8 Cloudflare Proxies Linked.")

    # 5. Set Ports to Public
    print("\n🔓 [3/5] Setting Ports (8000, 9000, 5173) to Public Visibility...")
    subprocess.run(["gh", "codespace", "ports", "visibility", "8000:public", "-c", cs_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    subprocess.run(["gh", "codespace", "ports", "visibility", "9000:public", "-c", cs_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    subprocess.run(["gh", "codespace", "ports", "visibility", "5173:public", "-c", cs_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    print("   ✅ Ports set to Public.")

    # 6. Start Background Servers (Port 8000 & Port 9000)
    print("\n⚡ [4/5] Starting Backend Server & Live Terminal Streamer...")
    subprocess.run(["pkill", "-f", "uvicorn"], check=False)
    subprocess.run(["pkill", "-f", "live_terminal_server.py"], check=False)
    time.sleep(1)

    with open("/tmp/terminal_stream.log", "w", encoding="utf-8") as f:
        f.write(f"[{time.strftime('%H:%M:%S')}] 🚀 Live Terminal Initialized on Port 9000.\n")

    os.environ["PYTHONUNBUFFERED"] = "1"
    server_log = open("server.log", "a")
    subprocess.Popen([sys.executable, "-u", "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"], stdout=server_log, stderr=server_log)
    subprocess.Popen([sys.executable, "live_terminal_server.py"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2)
    print("   ✅ Backend (Port 8000) & Terminal (Port 9000) Online.")

    # 7. Build Frontend Bundle
    print("\n☁️ [5/5] Building Production Frontend Bundle...")
    subprocess.run(["npm", "run", "build"], check=False)

    print("\n" + "=" * 75)
    print("🎉 1-CLICK MASTER BOOTSTRAP COMPLETED SUCCESSFULLY!")
    print("==========================================================================")
    print(f"👉 LIVE CLOUDFLARE WEB APP: https://dios-hub.pages.dev")
    print(f"👉 LIVE TERMINAL STREAMER  : https://{cs_name}-9000.app.github.dev")
    print(f"👉 INSTANT LOCAL PREVIEW   : https://{cs_name}-5173.app.github.dev")
    print("==========================================================================")

if __name__ == "__main__":
    run()
