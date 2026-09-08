import os, sys, time, json, traceback
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
    stream("🕵️‍♂️ [CBO API SNIFFER] CAPTURING EXACT REQUESTS & RESPONSES...")
    stream("=" * 95)

    captured_calls = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            context = browser.new_context(viewport={"width": 1600, "height": 1000})
            page = context.new_page()
            page.set_default_timeout(50000)
            page.on("dialog", lambda d: d.accept())

            # Intercept API calls
            def on_req(req):
                if "/api/common/apirequest" in req.url:
                    try:
                        raw = req.post_data or ""
                        parsed = json.loads(raw) if raw.startswith("{") else raw
                        p_code = parsed.get("PageCode") or parsed.get("pageCode") or "Unknown"
                        stream(f"\n🌐 [API CALL] PageCode: '{p_code}'")
                        stream(f"   Payload: {json.dumps(parsed)[:250]}")
                        captured_calls.append({"req": parsed, "url": req.url})
                    except Exception as e:
                        stream(f"   Raw Payload: {req.post_data[:150]}")

            def on_res(res):
                if "/api/common/apirequest" in res.url:
                    try:
                        raw = res.text()
                        if raw and raw.startswith("{"):
                            data = json.loads(raw)
                            tables = data.get("Tables") or {}
                            if tables:
                                stream(f"📥 [RESPONSE TABLES]: {list(tables.keys())}")
                                for k, rows in tables.items():
                                    if isinstance(rows, list) and len(rows) > 0:
                                        stream(f"     • '{k}' ({len(rows)} rows) -> First Row: {json.dumps(rows[0])[:180]}")
                    except: pass

            page.on("request", on_req)
            page.on("response", on_res)

            # 1. Correct Angular ERP Login URL
            stream(f"1. Navigating to {LOGIN_URL} as {CBO_USER}...")
            page.goto(LOGIN_URL, timeout=60000, wait_until="domcontentloaded")
            page.wait_for_timeout(1500)
            page.fill("input[type='text']:visible", CBO_USER)
            page.fill("input[type='password']:visible", CBO_PASS)
            page.wait_for_timeout(500)
            page.locator("button:visible:has-text('Login'), input[type='submit']:visible, .btn-success:visible").first.click()

            # Session terminate popup handler
            page.wait_for_timeout(2000)
            page.evaluate("""() => {
                const btns = Array.from(document.querySelectorAll('button, input[type=button], a'));
                const ok = btns.find(b => {
                    const t = (b.innerText || b.value || '').trim().toUpperCase();
                    return t === 'YES' || t === 'OK' || t.includes('CONTINUE') || t.includes('TERMINATE');
                });
                if (ok) ok.click();
            }""")

            page.wait_for_selector("#ej2-menu_1, a:has-text('SFA'), span:has-text('SFA')", timeout=45000)
            stream("   ✅ Login Successful.")

            # 2. SFA -> Expense Statement
            stream("\n2. Navigating: SFA -> Expense Statement...")
            page.locator("a:has-text('SFA'), span:has-text('SFA')").first.click()
            page.wait_for_timeout(700)
            page.locator("a:has-text('Expense Statement'), span:has-text('Expense Statement')").first.click()
            page.wait_for_timeout(4000)

            # 3. Click GO [F4]
            stream("\n3. Clicking 'GO [F4]' button...")
            go_btn = page.locator("button:has-text('GO'), .btn-primary:has-text('GO')").last
            go_btn.click(force=True)
            page.wait_for_timeout(4000)

            # 4. Click BANWARI LAL MEENA
            stream("\n4. Clicking 'BANWARI LAL MEENA' row link...")
            emp_link = page.locator("tr:has-text('BANWARI') a, .e-row:has-text('BANWARI') a").first
            if emp_link.count() > 0:
                emp_link.click(force=True)
            page.wait_for_timeout(6000)

            browser.close()

            # Save full log to JSON
            with open("/tmp/cbo_captured_api_calls.json", "w", encoding="utf-8") as f:
                json.dump(captured_calls, f, indent=2)
            stream(f"\n💾 Saved {len(captured_calls)} API Calls to /tmp/cbo_captured_api_calls.json")
            stream("🎉 API SNIFFING COMPLETED! Check Port 9000 to see the output.")

    except Exception as e:
        tb = traceback.format_exc()
        stream(f"❌ Error: {str(e)}\n{tb}")

if __name__ == "__main__":
    run()
