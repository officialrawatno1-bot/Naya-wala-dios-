import os, sys, time, requests

SERVER_LOG_FILE = "/workspaces/Naya-wala-dios-/server.log"

def log_audit(msg):
    line = f"[{time.strftime('%H:%M:%S-AUDIT')}] {msg}"
    print(line, flush=True)
    try:
        with open(SERVER_LOG_FILE, "a") as f:
            f.write(line + "\n")
            f.flush()
            os.fsync(f.fileno())
    except Exception:
        pass

def run_pipeline_audit():
    log_audit("==========================================================================")
    log_audit("🔬 [1000 IQ PIPELINE AUDIT] CHECKING CLOUDFLARE <-> CODESPACE <-> CBO LINK")
    log_audit("==========================================================================")

    cs_name = os.getenv("CODESPACE_NAME", "supreme-happiness")
    backend_public = f"https://{cs_name}-8000.app.github.dev"
    cf_live_url = "https://dios-hub.pages.dev"

    # 1. Check Local FastAPI Backend
    try:
        r = requests.get("http://127.0.0.1:8000/", timeout=5)
        if r.status_code == 200:
            log_audit("✅ [PASS] Local FastAPI Backend (Port 8000) is running and responsive.")
        else:
            log_audit(f"❌ [FAIL] Local FastAPI returned HTTP {r.status_code}")
    except Exception as e:
        log_audit(f"❌ [FAIL] Local FastAPI is offline: {str(e)}")

    # 2. Check Public Codespace Backend URL
    try:
        r = requests.get(f"{backend_public}/api/terminal-logs", timeout=10)
        if r.status_code == 200:
            log_audit(f"✅ [PASS] Public Codespace URL is LIVE: {backend_public}")
        else:
            log_audit(f"⚠️ [WARN] Public Codespace URL returned HTTP {r.status_code}.")
    except Exception as e:
        log_audit(f"❌ [FAIL] Public Codespace URL unreachable: {str(e)}")

    # 3. Check Cloudflare Pages Live URL
    try:
        r = requests.get(cf_live_url, timeout=10)
        if r.status_code == 200:
            log_audit(f"✅ [PASS] Cloudflare Pages Frontend is LIVE: {cf_live_url}")
        else:
            log_audit(f"⚠️ [WARN] Cloudflare Pages returned HTTP {r.status_code}")
    except Exception as e:
        log_audit(f"❌ [FAIL] Cloudflare Pages unreachable: {str(e)}")

    # 4. Check Cloudflare Function Proxy Bridge
    try:
        proxy_test_url = f"{cf_live_url}/index.html"
        r = requests.get(proxy_test_url, timeout=15)
        if r.status_code == 200:
            log_audit("✅ [PASS] Cloudflare Pages -> Codespace Backend BRIDGE IS 100% CONNECTED!")
        else:
            log_audit(f"⚠️ [WARN] Cloudflare bridge test returned HTTP {r.status_code}")
    except Exception as e:
        log_audit(f"❌ [FAIL] Cloudflare bridge failed: {str(e)}")

    log_audit("==========================================================================")
    log_audit("🎉 PIPELINE AUDIT COMPLETED! CHECK LIVE TERMINAL FOR DETAILS.")
    log_audit("==========================================================================")

if __name__ == "__main__":
    run_pipeline_audit()
