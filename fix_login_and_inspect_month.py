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
    stream("=" * 90)
    stream("🚀 [STABLE LOGIN & MONTH INSPECTOR] LOGGING IN NORMALLY...")
    stream("=" * 90)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            context = browser.new_context(viewport={"width": 1600, "height": 1000})
            page = context.new_page()
            page.set_default_timeout(45000)
            page.on("dialog", lambda d: d.accept())

            # 1. Normal, reliable login (NO route blocking)
            stream(f"1. Navigating to login page ({LOGIN_URL})...")
            page.goto(LOGIN_URL, timeout=60000, wait_until="domcontentloaded")
            page.wait_for_timeout(1500)
            page.fill("input[type='text']:visible", CBO_USER)
            page.fill("input[type='password']:visible", CBO_PASS)
            page.wait_for_timeout(500)
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

            page.wait_for_selector("#ej2-menu_1, a:has-text('SFA'), span:has-text('SFA')", timeout=45000)
            stream("   ✅ Login Successful!")

            # 2. SFA -> Expense Statement
            stream("2. Opening: SFA -> Expense Statement...")
            page.locator("a:has-text('SFA'), span:has-text('SFA')").first.click()
            page.wait_for_timeout(700)
            page.locator("a:has-text('Expense Statement'), span:has-text('Expense Statement')").first.click()
            page.wait_for_timeout(4000)

            # 3. Inspect ComboBox Data safely
            stream("3. Inspecting MONTH_FILTER ComboBox options...")
            cb_data = page.evaluate("""() => {
                const cb = document.querySelector('#MONTH_FILTER')?.ej2_instances?.[0];
                if (!cb) return { found: false };

                let rawItems = [];
                if (Array.isArray(cb.listData)) {
                    rawItems = cb.listData;
                } else if (cb.dataSource && Array.isArray(cb.dataSource.json)) {
                    rawItems = cb.dataSource.json;
                } else if (cb.dataSource && Array.isArray(cb.dataSource)) {
                    rawItems = cb.dataSource;
                }

                return {
                    found: true,
                    value: cb.value,
                    text: cb.text,
                    fields: cb.fields,
                    itemCount: rawItems.length,
                    items: rawItems.slice(0, 15)
                };
            }""")

            stream(f"   ComboBox Found: {cb_data.get('found')}")
            stream(f"   Current Value : {cb_data.get('value')}")
            stream(f"   Current Text  : {cb_data.get('text')}")
            stream(f"   Fields Config : {cb_data.get('fields')}")
            stream(f"   Items in List : {cb_data.get('itemCount')}")

            for it in cb_data.get('items', []):
                stream(f"     👉 Option: {it}")

            browser.close()
            stream("\n🎉 Login & Inspection Successful! Check Port 9000.")

    except Exception as e:
        tb = traceback.format_exc()
        stream(f"❌ Error: {str(e)}\n{tb}")

if __name__ == "__main__":
    run()
