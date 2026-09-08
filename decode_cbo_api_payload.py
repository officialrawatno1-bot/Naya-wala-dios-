import os, sys, time, json
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
    stream("🔬 [API DECODER] DECODING /api/common/apirequest PAYLOADS & 358KB DATA...")
    stream("=" * 95)

    captured_calls = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        context = browser.new_context(viewport={"width": 1600, "height": 1000})
        page = context.new_page()
        page.set_default_timeout(50000)

        def handle_route(route, request):
            url = request.url
            if "/api/common/apirequest" in url:
                req_body = request.post_data or ""
                headers = request.headers
                
                # Fetch response
                response = route.fetch()
                res_text = response.text()
                
                try:
                    req_json = json.loads(req_body)
                except:
                    req_json = req_body

                try:
                    res_json = json.loads(res_text)
                except:
                    res_json = {}

                captured_calls.append({
                    "url": url,
                    "auth": headers.get("authorization", "")[:40] + "...",
                    "request": req_json,
                    "response_keys": list(res_json.keys()) if isinstance(res_json, dict) else [],
                    "response": res_json
                })
                route.fulfill(response=response)
            else:
                route.continue_()

        page.route("**/api/common/apirequest", handle_route)

        # 1. Login
        stream(f"1. Login as {CBO_USER}...")
        page.goto(LOGIN_URL, timeout=60000, wait_until="domcontentloaded")
        page.wait_for_timeout(1000)
        page.fill("input[type='text']:visible", CBO_USER)
        page.fill("input[type='password']:visible", CBO_PASS)
        page.locator("button:visible:has-text('Login'), input[type='submit']:visible, .btn-success:visible").first.click()
        page.wait_for_selector("#ej2-menu_1, a:has-text('SFA'), span:has-text('SFA')", timeout=45000)
        stream("   ✅ Login Successful.")

        # 2. SFA -> Expense Statement
        stream("2. Opening SFA -> Expense Statement...")
        page.locator("a:has-text('SFA'), span:has-text('SFA')").first.click()
        page.wait_for_timeout(700)
        page.locator("a:has-text('Expense Statement'), span:has-text('Expense Statement')").first.click()
        page.wait_for_timeout(3500)

        # 3. Click GO [F4]
        stream("3. Clicking 'GO [F4]' button...")
        go_btn = page.locator("button:has-text('GO'), .btn-primary:has-text('GO')").last
        go_btn.click(force=True)
        page.wait_for_timeout(3500)

        # 4. Click BANWARI LAL MEENA
        stream("4. Clicking 'BANWARI LAL MEENA' row link...")
        emp_link = page.locator("tr:has-text('BANWARI') a, .e-row:has-text('BANWARI') a, a:has-text('BANWARI')").first
        if emp_link.count() > 0:
            emp_link.click(force=True)
        page.wait_for_timeout(6000)

        browser.close()

    stream(f"\n🎉 Intercepted {len(captured_calls)} calls to /api/common/apirequest!\n")

    for idx, call in enumerate(captured_calls, start=1):
        req_p = call['request']
        p_code = req_p.get("PageCode") if isinstance(req_p, dict) else ""
        stream(f"[{idx:02d}] 📌 PageCode: '{p_code}' | URL: {call['url']}")
        stream(f"     Request Payload: {json.dumps(req_p, indent=2)[:400]}")
        stream(f"     Response Top Keys: {call['response_keys']}")

        res = call['response']
        if isinstance(res, dict):
            # Check for Tables
            tables = res.get("Tables") or {}
            if tables:
                stream(f"     🔥 Tables in Response: {list(tables.keys())}")
                for tbl_name, tbl_rows in tables.items():
                    if isinstance(tbl_rows, list) and len(tbl_rows) > 0:
                        stream(f"        👉 Table '{tbl_name}': {len(tbl_rows)} rows! Sample Row 1: {tbl_rows[0]}")

            # Check if this is Expense_Entry
            if p_code == "Expense_Entry" or "Expense_Entry" in str(req_p):
                stream(f"\n🎯 [FOUND EXPENSE_ENTRY CALL!]:")
                with open("/tmp/expense_entry_full_response.json", "w", encoding="utf-8") as f:
                    json.dump(res, f, indent=2)
                stream("💾 Saved full JSON to /tmp/expense_entry_full_response.json")

    stream("\n" + "=" * 95)
    stream("🎉 API DECODING FINISHED! Check Port 9000 to see exact payload & tables.")
    stream("=" * 95)

if __name__ == "__main__":
    run()
