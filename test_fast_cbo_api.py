import os, sys, time, json, requests
from playwright.sync_api import sync_playwright

CBO_USER = os.getenv("CBO_USER", "6958BANWARI")
CBO_PASS = os.getenv("CBO_PASS", "6958")
LOGIN_URL = "https://dios.myreporting.net/erp/login"
LOG_FILE = "/tmp/terminal_stream.log"

def stream(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
            f.flush()
    except: pass

def run():
    stream("=" * 95)
    stream("⚡ [FAST CBO ACCELERATOR] BYPASSING EXTERNAL SCRIPTS & EXTRACTING TOKEN...")
    stream("=" * 95)

    captured_data = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        context = browser.new_context(viewport={"width": 1600, "height": 1000})
        
        # 🚀 BLOCK HANGING THIRD-PARTY SCRIPTS (Razorpay, Google Fonts)
        context.route("**/*razorpay*", lambda r: r.abort())
        context.route("**/*fonts.googleapis.com*", lambda r: r.abort())
        context.route("**/*apis.google.com*", lambda r: r.abort())

        page = context.new_page()
        page.set_default_timeout(35000)
        page.on("dialog", lambda d: d.accept())

        # Intercept Token and Outgoing API Payloads
        def on_req(req):
            if "/api/common/apirequest" in req.url:
                try:
                    raw = req.post_data
                    if raw:
                        parsed = json.loads(raw)
                        p_code = parsed.get("PageCode") or parsed.get("pageCode") or "Common"
                        headers = req.headers
                        captured_data["last_auth"] = headers.get("authorization")
                        if "Expense" in p_code:
                            stream(f"🌐 [INTERCEPTED EXPENSE API] PageCode: '{p_code}'")
                            stream(f"   Payload: {json.dumps(parsed, indent=2)[:350]}")
                            captured_data[p_code] = parsed
                except: pass

        def on_res(res):
            if "/api/token" in res.url:
                try:
                    tok_json = res.json()
                    captured_data["access_token"] = tok_json.get("access_token")
                    stream("🔑 [CAPTURED CBO ACCESS TOKEN] Successfully grabbed Bearer Token!")
                except: pass

            if "/api/common/apirequest" in res.url:
                try:
                    txt = res.text()
                    if txt and ("Expense" in txt or "BANWARI" in txt):
                        parsed = json.loads(txt)
                        tables = parsed.get("Tables") or {}
                        if tables:
                            stream(f"📥 [RESPONSE TABLES]: {list(tables.keys())}")
                            for k, rows in tables.items():
                                stream(f"     • Table '{k}': {len(rows)} rows!")
                        if "Expense_Entry" in txt:
                            captured_data["entry_response"] = parsed
                except: pass

        page.on("request", on_req)
        page.on("response", on_res)

        # 1. Fast Instant Login
        stream(f"1. Fast Login as {CBO_USER}...")
        page.goto(LOGIN_URL, timeout=30000, wait_until="commit")
        page.wait_for_selector("input[type='text']:visible", timeout=15000)
        page.fill("input[type='text']:visible", CBO_USER)
        page.fill("input[type='password']:visible", CBO_PASS)
        page.locator("button:visible:has-text('Login'), input[type='submit']:visible, .btn-success:visible").first.click()

        # Session terminate handler
        page.wait_for_timeout(2000)
        page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button, input[type=button], a'));
            const ok = btns.find(b => {
                const t = (b.innerText || b.value || '').trim().toUpperCase();
                return t === 'YES' || t === 'OK' || t.includes('CONTINUE') || t.includes('TERMINATE');
            });
            if (ok) ok.click();
        }""")

        page.wait_for_selector("#ej2-menu_1, a:has-text('SFA'), span:has-text('SFA')", timeout=35000)
        stream("   ✅ Login 100% Successful in 5s!")

        # 2. Extract Token from LocalStorage
        token_info = page.evaluate("""() => {
            return {
                localToken: localStorage.getItem('access_token') || localStorage.getItem('token') || '',
                sessionToken: sessionStorage.getItem('access_token') || sessionStorage.getItem('token') || '',
                keys: Object.keys(localStorage)
            };
        }""")
        stream(f"   LocalStorage Keys: {token_info.get('keys')[:6]}")

        # 3. SFA -> Expense Statement
        stream("\n2. Opening SFA -> Expense Statement...")
        page.locator("a:has-text('SFA'), span:has-text('SFA')").first.click()
        page.wait_for_timeout(600)
        page.locator("a:has-text('Expense Statement'), span:has-text('Expense Statement')").first.click()
        page.wait_for_timeout(3500)

        # 4. Click GO [F4]
        stream("3. Clicking 'GO [F4]'...")
        page.locator("button:has-text('GO'), .btn-primary:has-text('GO')").last.click(force=True)
        page.wait_for_timeout(3500)

        # 5. Click BANWARI LAL MEENA
        stream("4. Clicking 'BANWARI LAL MEENA'...")
        page.locator("tr:has-text('BANWARI') a, .e-row:has-text('BANWARI') a").first.click(force=True)
        page.wait_for_timeout(5000)

        browser.close()

    stream("\n" + "=" * 95)
    stream("📊 [SNIFFER RESULTS] CAPTURED EXPENSE API DETAILS:")
    stream("=" * 95)
    stream(f"Bearer Token Captured: {'YES' if captured_data.get('access_token') or captured_data.get('last_auth') else 'NO'}")
    
    for k in ['Expense_Main', 'Expense_Entry']:
        if k in captured_data:
            stream(f"\n🎯 '{k}' Payload Structure:")
            stream(json.dumps(captured_data[k], indent=2))

    with open("/tmp/cbo_api_debug.json", "w", encoding="utf-8") as f:
        json.dump(captured_data, f, indent=2, default=str)
    stream("\n💾 Saved /tmp/cbo_api_debug.json")
    stream("🎉 FAST SCAN COMPLETE! Check Port 9000.")

if __name__ == "__main__":
    run()
