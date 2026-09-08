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
    stream("🔬 [DEEP MONTH_FILTER RESOLVER] INSPECTING COMBOBOX DATA SOURCE...")
    stream("=" * 90)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            context = browser.new_context(viewport={"width": 1600, "height": 1000}, accept_downloads=True)
            page = context.new_page()
            page.set_default_timeout(45000)
            page.on("dialog", lambda d: d.accept())

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
            stream("2. Navigating: SFA -> Expense Statement...")
            page.locator("a:has-text('SFA'), span:has-text('SFA')").first.click()
            page.wait_for_timeout(700)
            page.locator("a:has-text('Expense Statement'), span:has-text('Expense Statement')").first.click()
            page.wait_for_timeout(3500)

            # 3. 🔍 INSPECT EXACT MONTH_FILTER DATA SOURCE ITEMS
            stream("3. Reading all items in #MONTH_FILTER.dataSource...")
            combo_items = page.evaluate("""() => {
                const combo = document.querySelector('#MONTH_FILTER');
                if (combo && combo.ej2_instances && combo.ej2_instances.length > 0) {
                    const inst = combo.ej2_instances[0];
                    const ds = inst.dataSource || [];
                    return {
                        currentValue: inst.value,
                        currentText: inst.text,
                        fields: inst.fields,
                        items: ds.map((item, idx) => ({
                            index: idx,
                            raw: item
                        }))
                    };
                }
                return { items: [] };
            }""")

            stream(f"   Current Selection: Value='{combo_items.get('currentValue')}', Text='{combo_items.get('currentText')}'")
            stream(f"   Total Month Items in ComboBox: {len(combo_items.get('items', []))}")
            
            aug_item = None
            for it in combo_items.get('items', []):
                item_str = json.dumps(it.get('raw', ''))
                stream(f"     • Month Option [{it['index']}]: {item_str}")
                if 'AUG' in item_str.upper() or '08' in item_str:
                    aug_item = it

            # 4. SELECT AUGUST IN COMBOBOX
            if aug_item:
                stream(f"\n🎯 Found August in ComboBox at Index {aug_item['index']}! Selecting it...")
                page.evaluate('''(idx) => {
                    const combo = document.querySelector('#MONTH_FILTER');
                    if (combo && combo.ej2_instances && combo.ej2_instances.length > 0) {
                        const inst = combo.ej2_instances[0];
                        inst.index = idx;
                        if (inst.dataBind) inst.dataBind();
                        if (inst.change) inst.change({ itemData: inst.dataSource[idx], value: inst.value });
                    }
                }''', aug_item['index'])
            else:
                stream("   ⚠️ August not in list, setting value manually...")
                page.evaluate("""() => {
                    const combo = document.querySelector('#MONTH_FILTER');
                    if (combo && combo.ej2_instances && combo.ej2_instances.length > 0) {
                        const inst = combo.ej2_instances[0];
                        inst.value = '2026/08/01';
                        inst.text = 'Aug-2026';
                        if (inst.dataBind) inst.dataBind();
                    }
                }""")

            page.wait_for_timeout(1500)

            # 5. CLICK GO [F4]
            stream("5. Clicking 'GO [F4]'...")
            page.locator("button:has-text('GO'), .btn-primary:has-text('GO')").first.click(force=True)
            page.wait_for_timeout(4000)

            # 6. DUMP ROWS RETURNED IN GRID
            stream("6. Reading Rows in Grid Table after Query...")
            grid_rows = page.evaluate("""() => {
                const trs = Array.from(document.querySelectorAll('#_gridcontrol .e-gridcontent tr, .e-gridcontent tr'));
                return trs.map(tr => tr.innerText.trim().replace(/\\n/g, ' | '));
            }""")

            stream(f"   Grid Table returned {len(grid_rows)} rows:")
            for r in grid_rows[:5]:
                stream(f"     👉 {r}")

            # 7. CLICK BANWARI LAL MEENA
            stream("7. Clicking Banwari Lal Meena inside the grid...")
            emp_link = page.locator("#_gridcontrol .e-gridcontent tr a.blue, .e-gridcontent a.blue, .e-row a").first
            if emp_link.count() > 0:
                emp_link.click(force=True)
            else:
                page.evaluate("""() => {
                    const a = document.querySelector('.e-gridcontent a.blue, .e-row a');
                    if (a) a.click();
                }""")

            stream("   ⏳ Waiting 6s for Entry Window to open...")
            page.wait_for_timeout(6000)

            # 8. INSPECT ACTIVE MODAL DOM
            stream("8. Inspecting Modal Window Header & Table...")
            modal_info = page.evaluate("""() => {
                const modals = Array.from(document.querySelectorAll('ngb-modal-window.show, .modal.show, .fullscreen-modal, ngb-modal-window, .modal'));
                const m = modals.length > 0 ? modals[modals.length - 1] : document.body;
                
                // Header details
                const fullText = m.innerText;
                const mMatch = fullText.match(/Month[:\\s]+([^\\n\\r]+)/i);

                // Table rows
                const allTrs = Array.from(m.querySelectorAll('tr, .e-row'));
                const rows = [];
                allTrs.forEach(tr => {
                    const cells = Array.from(tr.querySelectorAll('td, th')).map(c => c.innerText.trim());
                    if (cells.length >= 8 && /^[0-9]+$/.test(cells[0])) {
                        rows.push(cells);
                    }
                });

                return {
                    detectedMonth: mMatch ? mMatch[1].trim() : 'NOT_FOUND',
                    totalRows: rows.length,
                    first3Rows: rows.slice(0, 3),
                    sampleText: fullText.substring(0, 300).replace(/\\n/g, ' ')
                };
            }""")

            stream(f"   📌 Verified Header Month: '{modal_info.get('detectedMonth')}'")
            stream(f"   Daily Table Rows Found: {modal_info.get('totalRows')}")
            for r in modal_info.get('first3Rows', []):
                stream(f"     👉 {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | DA: {r[5]} | DR: {r[7]}")

            browser.close()
            stream("\n🎉 INSPECTION & TEST FINISHED! Check Port 9000.")

    except Exception as e:
        tb = traceback.format_exc()
        stream(f"❌ Error: {str(e)}\n{tb}")

if __name__ == "__main__":
    run()
