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
    stream("🕵️‍♂️ [CBO REVERSE ENGINEERING SNIFFER] LIVE NETWORK & PAYLOAD INTERCEPTOR...")
    stream("=" * 95)

    captured_apis = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        context = browser.new_context(viewport={"width": 1600, "height": 1000}, accept_downloads=True)
        page = context.new_page()
        page.set_default_timeout(50000)
        page.on("dialog", lambda d: d.accept())

        # 1. NETWORK REQUEST & RESPONSE INTERCEPTOR
        def on_request(req):
            url_l = req.url.lower()
            if any(k in url_l for k in ['expense', 'sfa', 'rpt', 'api', 'statement', 'grid', 'get', 'filter']):
                if not any(ext in url_l for ext in ['.js', '.css', '.png', '.jpg', '.woff', '.svg']):
                    post_data = req.post_data or ""
                    stream(f"\n🌐 [REQ] {req.method} {req.url}")
                    if post_data:
                        stream(f"   Payload: {post_data[:300]}")
                    captured_apis.append({"type": "REQUEST", "method": req.method, "url": req.url, "payload": post_data})

        def on_response(res):
            url_l = res.url.lower()
            if any(k in url_l for k in ['expense', 'sfa', 'rpt', 'api', 'statement', 'grid', 'get', 'filter']):
                if not any(ext in url_l for ext in ['.js', '.css', '.png', '.jpg', '.woff', '.svg']):
                    try:
                        body_txt = res.text()
                        stream(f"📥 [RES {res.status}] {res.url}")
                        if body_txt and len(body_txt) > 0:
                            clean_body = body_txt.strip()
                            stream(f"   Response Preview ({len(clean_body)} chars): {clean_body[:300]}")
                            # If contains JSON with months or dates, log it!
                            if 'AUG' in clean_body.upper() or '08' in clean_body or 'MONTH' in clean_body.upper():
                                stream(f"   🔥 [FOUND MONTH KEYWORDS IN RESPONSE]: {clean_body[:400]}")
                    except Exception:
                        pass

        page.on("request", on_request)
        page.on("response", on_response)

        # 2. Login
        stream(f"1. Login as {CBO_USER}...")
        page.goto(LOGIN_URL, timeout=60000, wait_until="domcontentloaded")
        page.wait_for_timeout(1000)
        page.fill("input[type='text']:visible", CBO_USER)
        page.fill("input[type='password']:visible", CBO_PASS)
        page.locator("button:visible:has-text('Login'), input[type='submit']:visible, .btn-success:visible").first.click()
        page.wait_for_selector("#ej2-menu_1, a:has-text('SFA'), span:has-text('SFA')", timeout=45000)
        stream("   ✅ Login Successful.")

        # 3. SFA -> Expense Statement
        stream("\n2. Clicking Menu: SFA -> Expense Statement (Sniffing initialization APIs)...")
        page.locator("a:has-text('SFA'), span:has-text('SFA')").first.click()
        page.wait_for_timeout(600)
        page.locator("a:has-text('Expense Statement'), span:has-text('Expense Statement')").first.click()
        page.wait_for_timeout(4000)

        # 4. Physical Real Mouse Click on Month Input Group
        stream("\n3. Locating Physical Coordinates of Month Selector on Screen...")
        month_box_info = page.evaluate("""() => {
            // Find input with Sep-2026
            const inps = Array.from(document.querySelectorAll('input'));
            const mInp = inps.find(i => (i.value || '').includes('Sep-2026') || (i.value || '').includes('2026/09'));
            if (mInp) {
                const rect = mInp.getBoundingClientRect();
                return {
                    found: true,
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    value: mInp.value,
                    html: mInp.outerHTML
                };
            }
            return { found: false };
        }""")

        if month_box_info.get("found"):
            mx = month_box_info['x'] + month_box_info['width'] - 15  # Click near the right dropdown arrow
            my = month_box_info['y'] + month_box_info['height'] / 2
            stream(f"   Targeting Coordinates: X={mx:.1f}, Y={my:.1f} (Element: {month_box_info['value']})")
            
            # Real physical mouse move and click!
            stream("   Simulating Real Hardware Mouse Click on Dropdown Arrow...")
            page.mouse.move(mx, my)
            page.wait_for_timeout(300)
            page.mouse.click(mx, my)
            page.wait_for_timeout(2000)

            # Check if popup rendered on screen
            popup_status = page.evaluate("""() => {
                const popups = Array.from(document.querySelectorAll('.e-popup, .e-dropdownbase, ul[role=listbox]'));
                const visible = popups.filter(p => p.offsetHeight > 0 && p.offsetWidth > 0);
                const items = [];
                visible.forEach(v => {
                    Array.from(v.querySelectorAll('li, div')).forEach(li => {
                        const t = li.innerText.trim();
                        if (t && t.length < 30) items.push(t);
                    });
                });
                return {
                    visibleCount: visible.length,
                    items: items
                };
            }""")
            stream(f"   Visible Dropdown Popups: {popup_status.get('visibleCount')}")
            stream(f"   Popup Items Captured: {popup_status.get('items', [])}")

        # 5. Sniffing GO [F4] Click Action
        stream("\n4. Clicking 'GO [F4]' to Sniff Statement Query API & Parameters...")
        go_btn = page.locator("button:has-text('GO'), .btn-primary:has-text('GO')").last
        go_btn.click(force=True)
        page.wait_for_timeout(4000)

        # 6. Sniffing Employee Click Action
        stream("\n5. Clicking 'BANWARI LAL MEENA' row link to Sniff Entry Modal API...")
        emp_link = page.locator("tr:has-text('BANWARI') a, .e-row:has-text('BANWARI') a, a:has-text('BANWARI')").first
        if emp_link.count() > 0:
            emp_link.click(force=True)
        page.wait_for_timeout(5000)

        # 7. Sniffing Excel Button Action
        stream("\n6. Clicking 'Excel' button in Entry screen to Sniff Excel Generator API...")
        excel_btn = page.locator("button:has-text('Excel'), a:has-text('Excel'), .btn-success:has-text('Excel')").last
        if excel_btn.count() > 0:
            excel_btn.click(force=True)
        page.wait_for_timeout(4000)

        browser.close()

        stream("\n" + "=" * 95)
        stream("📊 [SNIFFER SUMMARY] TOTAL NETWORK CALLS LOGGED:")
        stream("=" * 95)
        for idx, api in enumerate(captured_apis, start=1):
            stream(f"[{idx:02d}] {api['method']} -> {api['url']}")
            if api['payload']:
                stream(f"     Payload: {api['payload']}")
        stream("=" * 95)
        stream("🎉 NETWORK SNIFFING COMPLETED! Check Port 9000.")

if __name__ == "__main__":
    run()
