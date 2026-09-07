import os, sys, time
from playwright.sync_api import sync_playwright

CBO_USER = "6958BANWARI"
CBO_PASS = "6958"
LOGIN_URL = "https://dios.myreporting.net/erp/login"

def test_cbo():
    print("[*] Launching Playwright Chromium Browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        page.set_default_timeout(45000)

        print("[1] Opening CBO ERP (Angular Portal)...")
        page.goto(LOGIN_URL, timeout=60000, wait_until="domcontentloaded")
        time.sleep(1)

        print(f"[2] Logging in as {CBO_USER}...")
        page.fill("input[type='text']:visible", CBO_USER)
        page.fill("input[type='password']:visible", CBO_PASS)
        page.locator("button:visible:has-text('Login'), button:has-text('Sign In'), input[type='submit']:visible, .btn-success:visible").first.click()

        page.wait_for_selector("#ej2-menu_1, a:has-text('Reports'), span:has-text('Reports')", timeout=35000)
        print("✅ [SUCCESS] CBO Authentication 100% Successful!")

        print("[3] Inspecting Reports -> Sales & Targets...")
        page.locator("a:has-text('Reports'), span:has-text('Reports')").first.click()
        time.sleep(1)
        page.locator("a:has-text('Sales & Targets'), span:has-text('Sales & Targets')").first.click()
        time.sleep(1)

        menu_items = page.evaluate("""() => {
            const links = Array.from(document.querySelectorAll('a, span, li'));
            return links.map(l => (l.innerText || '').trim()).filter(t => t.length > 2 && t.length < 35);
        }""")

        reports = [m for m in set(menu_items) if any(k in m.lower() for k in ['primary', 'spo', 'target', 'performance'])]
        print(f"📊 Available Sales Reports in CBO: {reports}")

        browser.close()
        print("\n🎉 CBO Playwright Engine is Ready & Working!")

if __name__ == '__main__':
    test_cbo()
