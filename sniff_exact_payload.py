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
    stream("🕵️‍♂️ [PASSIVE SNIFFER] CAPTURING EXACT CBO REQUEST PAYLOADS (NO BLOCKING)...")
    stream("=" * 95)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        context = browser.new_context(viewport={"width": 1600, "height": 1000})
        page = context.new_page()
        page.set_default_timeout(45000)
        page.on("dialog", lambda d: d.accept())

        # Passive non-blocking network listeners
        def on_req(req):
            url = req.url
            if "/api/common/apirequest" in url:
                try:
                    data = req.post_data
                    if data:
                        parsed = json.loads(data)
                        page_code = parsed.get("PageCode") or parsed.get("pageCode") or "Common"
                        stream(f"\n🚀 [OUTGOING API CALL] PageCode: '{page_code}'")
                        stream(f"   URL: {url}")
                        stream(f"   FULL JSON PAYLOAD:\n{json.dumps(parsed, indent=2)}")
                except Exception as e:
                    stream(f"   Raw Payload: {req.post_data[:300]}")

        def on_res(res):
            url = res.url
            if "/api/common/apirequest" in url:
                try:
                    txt = res.text()
                    if txt:
                        parsed = json.loads(txt)
                        # Check for Tables
                        tables = parsed.get("Tables") or {}
                        if tables:
                            stream(f"📥 [INCOMING RESPONSE TABLES]: {list(tables.keys())}")
                            for tname, trows in tables.items():
                                if isinstance(trows, list) and len(trows) > 0:
                                    stream(f"     • Table '{tname}' ({len(trows)} rows). First Row:")
                                    stream(f"       {json.dumps(trows[0], indent=2)}")
                except: pass

        page.on("request", on_req)
        page.on("response", on_res)

        # 1. Login with Session-Termination Auto-Handler
        stream(f"1. Authenticating as {CBO_USER}...")
        page.goto("https://dios.myreporting.net/", timeout=60000, wait_until="domcontentloaded")
        page.wait_for_timeout(1500)
        page.fill("input[type='text']:visible", CBO_USER)
        page.fill("input[type='password']:visible", CBO_PASS)
        page.wait_for_timeout(500)

        sign_btn = page.locator("button:has-text('Sign In'), button:has-text('Login'), input[type='submit']:visible, .btn-success:visible").first
        if sign_btn.count() > 0:
            sign_btn.click()
        else:
            page.keyboard.press("Enter")

        page.wait_for_timeout(2000)

        # Click YES/OK on session termination popup if appears
        page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button, input[type=button], a'));
            const ok = btns.find(b => {
                const t = (b.innerText || b.value || '').trim().toUpperCase();
                return t === 'YES' || t === 'OK' || t.includes('CONTINUE') || t.includes('TERMINATE');
            });
            if (ok) ok.click();
        }""")

        page.wait_for_selector("#ej2-menu_1, a:has-text('SFA'), span:has-text('SFA')", timeout=35000)
        stream("   ✅ Login Successful.")

        # 2. SFA -> Expense Statement
        stream("\n2. Navigating: SFA -> Expense Statement...")
        page.locator("a:has-text('SFA'), span:has-text('SFA')").first.click()
        page.wait_for_timeout(700)
        page.locator("a:has-text('Expense Statement'), span:has-text('Expense Statement')").first.click()
        page.wait_for_timeout(4000)

        # 3. Click GO [F4] to capture List Query Payload
        stream("\n3. Clicking 'GO [F4]' button to capture List Query Payload...")
        go_btn = page.locator("button:has-text('GO'), .btn-primary:has-text('GO')").last
        go_btn.click(force=True)
        page.wait_for_timeout(4000)

        # 4. Click BANWARI LAL MEENA to capture Entry Query Payload
        stream("\n4. Clicking 'BANWARI LAL MEENA' to capture Entry Screen Payload...")
        emp_link = page.locator("tr:has-text('BANWARI') a, .e-row:has-text('BANWARI') a, a:has-text('BANWARI')").first
        if emp_link.count() > 0:
            emp_link.click(force=True)
        page.wait_for_timeout(6000)

        browser.close()
        stream("\n" + "=" * 95)
        stream("🎉 PASSIVE SNIFFING COMPLETED! Check Port 9000 to see the exact payloads.")
        stream("=" * 95)

if __name__ == "__main__":
    run()
