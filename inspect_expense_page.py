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
    stream("=" * 85)
    stream("🔍 [EXPENSE SCREEN DEEP INSPECTOR] ANALYZING MONTH SELECTORS & CONTROLS...")
    stream("=" * 85)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        context = browser.new_context(viewport={"width": 1600, "height": 1000})
        page = context.new_page()
        page.set_default_timeout(45000)

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
        page.wait_for_timeout(4000)

        stream(f"   Current URL: {page.url}")
        stream(f"   Total Frames: {len(page.frames)}")

        # 3. Dump All Controls on Screen (Selects, Inputs, Buttons)
        dom_dump = page.evaluate("""() => {
            const res = {
                selects: [],
                inputs: [],
                buttons: [],
                ej2Instances: [],
                pageText: document.body.innerText.substring(0, 500).replace(/\\n/g, ' | ')
            };

            // 1. All Selects & Options
            document.querySelectorAll('select').forEach((s, idx) => {
                const options = Array.from(s.options).map(o => ({ text: o.text.trim(), val: o.value }));
                res.selects.push({
                    idx, id: s.id, name: s.name, className: s.className,
                    selected: s.value, optionsCount: options.length,
                    sampleOptions: options.slice(0, 15)
                });
            });

            // 2. All Inputs
            document.querySelectorAll('input').forEach((i, idx) => {
                if (i.type !== 'hidden') {
                    res.inputs.push({
                        idx, id: i.id, name: i.name, type: i.type,
                        value: i.value, placeholder: i.placeholder,
                        className: i.className
                    });
                }
            });

            // 3. All Buttons
            document.querySelectorAll('button, input[type=button], .e-btn').forEach((b, idx) => {
                const txt = (b.innerText || b.value || b.title || '').trim();
                if (txt) {
                    res.buttons.push({ idx, text: txt, id: b.id, className: b.className });
                }
            });

            // 4. Syncfusion EJ2 Controls
            document.querySelectorAll('*').forEach(el => {
                if (el.ej2_instances && el.ej2_instances.length > 0) {
                    el.ej2_instances.forEach(inst => {
                        res.ej2Instances.push({
                            mod: inst.getModuleName ? inst.getModuleName() : 'unknown',
                            id: el.id,
                            val: String(inst.value || '')
                        });
                    });
                }
            });

            return res;
        }""")

        stream("\n📊 1. DROPDOWNS (<select>) ON SCREEN:")
        for s in dom_dump.get("selects", []):
            stream(f"   • Dropdown [{s['idx']}] ID: '{s['id']}', Name: '{s['name']}' (Selected: '{s['selected']}')")
            for opt in s.get("sampleOptions", []):
                stream(f"        👉 Option: '{opt['text']}' (val: '{opt['val']}')")

        stream("\n📊 2. INPUTS ON SCREEN:")
        for inp in dom_dump.get("inputs", []):
            stream(f"   • Input [{inp['idx']}] ID: '{inp['id']}', Name: '{inp['name']}', Value: '{inp['value']}', Class: '{inp['className'][:30]}'")

        stream("\n📊 3. SYNCFUSION CONTROLS:")
        for ej in dom_dump.get("ej2Instances", []):
            stream(f"   • Module: '{ej['mod']}', ID: '{ej['id']}', Value: '{ej['val']}'")

        stream("\n📊 4. BUTTONS ON SCREEN:")
        for b in dom_dump.get("buttons", []):
            stream(f"   • Button: '{b['text']}' (Class: '{b['className'][:30]}')")

        browser.close()
        stream("\n🎉 INSPECTION FINISHED! Check Port 9000 to see controls.")

if __name__ == "__main__":
    run()
