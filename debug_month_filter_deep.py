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
    stream("🔬 [DEEP RESOLVER] EXTRACTING COMBOBOX FIELDS & REAL AUGUST DATA...")
    stream("=" * 95)

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
            stream("2. Opening: SFA -> Expense Statement...")
            page.locator("a:has-text('SFA'), span:has-text('SFA')").first.click()
            page.wait_for_timeout(700)
            page.locator("a:has-text('Expense Statement'), span:has-text('Expense Statement')").first.click()
            page.wait_for_timeout(3500)

            # 3. Read Syncfusion ComboBox Fields & ListData
            stream("3. Reading ComboBox 'fields' and 'listData' for #MONTH_FILTER...")
            combo_meta = page.evaluate("""() => {
                const cb = document.querySelector('#MONTH_FILTER')?.ej2_instances?.[0];
                if (!cb) return { found: false };
                
                const list = cb.listData || (cb.dataSource && cb.dataSource.dataSource ? cb.dataSource.dataSource.json : []) || [];
                return {
                    found: true,
                    fields: cb.fields,
                    currentValue: cb.value,
                    currentText: cb.text,
                    totalItems: list.length,
                    items: list.map((item, i) => ({
                        idx: i,
                        obj: item
                    }))
                };
            }""")

            stream(f"   ComboBox Found: {combo_meta.get('found')}, Fields: {combo_meta.get('fields')}")
            stream(f"   Current Selection: Value='{combo_meta.get('currentValue')}', Text='{combo_meta.get('currentText')}'")
            stream(f"   Total Month Options in ListData: {combo_meta.get('totalItems')}")

            aug_target_val = None
            aug_target_text = None
            aug_idx = None

            for it in combo_meta.get('items', []):
                s = json.dumps(it.get('obj', ''))
                stream(f"     • [{it['idx']}] {s}")
                if 'AUG' in s.upper() or '2026/08' in s or '08/2026' in s:
                    obj = it.get('obj', {})
                    aug_idx = it['idx']
                    # Extract value based on fields
                    f_val = (combo_meta.get('fields') or {}).get('value', 'value')
                    f_txt = (combo_meta.get('fields') or {}).get('text', 'text')
                    aug_target_val = obj.get(f_val) if isinstance(obj, dict) else str(obj)
                    aug_target_text = obj.get(f_txt) if isinstance(obj, dict) else str(obj)

            # 4. Bind August using the Exact Matched Item
            stream(f"\n4. Binding August (Index: {aug_idx}, Val: '{aug_target_val}', Text: '{aug_target_text}')...")
            
            set_res = page.evaluate('''(data) => {
                const cb = document.querySelector('#MONTH_FILTER')?.ej2_instances?.[0];
                if (cb) {
                    if (data.idx !== null && cb.listData && cb.listData[data.idx]) {
                        cb.index = data.idx;
                        cb.value = data.val;
                        cb.text = data.text;
                    } else {
                        cb.value = data.val || '2026/08/01';
                        cb.text = data.text || 'Aug-2026';
                    }
                    if (cb.dataBind) cb.dataBind();
                    if (cb.change) cb.change({ value: cb.value, itemData: cb.listData ? cb.listData[data.idx] : null });
                    return { success: true, newVal: cb.value, newText: cb.text };
                }
                return { success: false };
            }''', {'idx': aug_idx, 'val': aug_target_val, 'text': aug_target_text})

            stream(f"   ComboBox Rebound Result: {set_res}")
            page.wait_for_timeout(1000)

            # 5. Click GO [F4] Button
            stream("5. Clicking 'GO [F4]' Button...")
            page.locator("button:has-text('GO'), .btn-primary:has-text('GO')").first.click(force=True)
            page.wait_for_timeout(4000)

            # 6. Read Grid Table Rows
            stream("6. Reading Rows returned in Grid Table...")
            grid_info = page.evaluate("""() => {
                const rows = Array.from(document.querySelectorAll('tbody tr, .e-row')).filter(r => r.innerText.includes('BANWARI'));
                return rows.map(r => ({
                    text: r.innerText.trim().replace(/\\n/g, ' | '),
                    html: r.innerHTML.substring(0, 150)
                }));
            }""")

            stream(f"   Matching Rows found in grid: {len(grid_info)}")
            for r in grid_info:
                stream(f"     👉 {r['text']}")

            # 7. Click Banwari Lal Meena Link in Grid
            stream("7. Clicking Banwari Lal Meena in Grid...")
            emp_link = page.locator("tr:has-text('BANWARI LAL MEENA') a, .e-row:has-text('BANWARI') a").first
            if emp_link.count() > 0:
                emp_link.click(force=True)
            else:
                page.evaluate("""() => {
                    const row = Array.from(document.querySelectorAll('tr, .e-row')).find(r => r.innerText.includes('BANWARI'));
                    if (row) {
                        const a = row.querySelector('a');
                        if (a) a.click();
                        else row.click();
                    }
                }""")

            stream("   ⏳ Waiting 6s for August Entry Modal to open...")
            page.wait_for_timeout(6000)

            # 8. Extract Entry Data
            stream("8. Extracting Modal Data...")
            modal_dump = page.evaluate("""() => {
                const modals = Array.from(document.querySelectorAll('ngb-modal-window.show, .modal.show, .fullscreen-modal, ngb-modal-window'));
                const m = modals.length > 0 ? modals[modals.length - 1] : document.body;

                const txt = m.innerText;
                const mMatch = txt.match(/Month[:\\s]+([^\\n\\r]+)/i);

                const rows = [];
                const allTrs = Array.from(m.querySelectorAll('tr, .e-row'));
                allTrs.forEach(tr => {
                    const cells = Array.from(tr.querySelectorAll('td, th')).map(c => c.innerText.trim());
                    if (cells.length >= 8 && /^[0-9]+$/.test(cells[0])) {
                        rows.push({
                            sr: cells[0], date: cells[1], station: cells[2],
                            type: cells[3], route: cells[4], da: cells[5],
                            workWith: cells[6], dr: cells[7], km: cells[11] || cells[10] || '0',
                            ta: cells[13] || '0', daAmt: cells[14] || '0'
                        });
                    }
                });

                const left = [];
                const leftTables = Array.from(m.querySelectorAll('table')).filter(t => t.innerText.includes('Local') || t.innerText.includes('Ex-Station'));
                if (leftTables.length > 0) {
                    Array.from(leftTables[0].querySelectorAll('tr')).forEach(tr => {
                        const tds = Array.from(tr.querySelectorAll('td')).map(c => c.innerText.trim());
                        if (tds.length >= 4 && /^[0-9]+$/.test(tds[0])) left.push(tds);
                    });
                }

                return {
                    month: mMatch ? mMatch[1].trim() : 'UNKNOWN',
                    totalRows: rows.length,
                    rows: rows,
                    leftSummary: left
                };
            }""")

            stream(f"   📌 Header Month Detected: '{modal_dump.get('month')}'")
            stream(f"   Total Daily Rows Extracted: {modal_dump.get('totalRows')}")

            rows = modal_dump.get("rows", [])
            if rows:
                stream("\n" + "=" * 115)
                stream(f"{'SR':<4} {'DATE':<12} {'STATION':<15} {'WORK TYPE':<12} {'ROUTE':<14} {'DA':<5} {'DR':<4} {'KM':<6} {'FARE(TA)':<10} {'DA AMT':<10}")
                stream("=" * 115)
                
                tot_km, tot_ta, tot_da, tot_drs = 0, 0, 0, 0
                for r in rows:
                    km_n = float(str(r.get('km') or '0').replace(',', ''))
                    ta_n = float(str(r.get('ta') or '0').replace(',', ''))
                    da_n = float(str(r.get('daAmt') or '0').replace(',', ''))
                    dr_n = int(float(str(r.get('dr') or '0').replace(',', '')))
                    
                    tot_km += km_n
                    tot_ta += ta_n
                    tot_da += da_n
                    tot_drs += dr_n

                    stream(f"{r['sr']:<4} {r['date']:<12} {r['station'][:14]:<15} {r['type'][:11]:<12} {r['route'][:13]:<14} {r['da']:<5} {dr_n:<4} {km_n:<6.0f} ₹{ta_n:<9.2f} ₹{da_n:<9.2f}")

                stream("-" * 115)
                stream(f"TOTALS: Route KM = {tot_km:.0f} KM | Dr Calls = {tot_drs} | Total TA = ₹{tot_ta:.2f} | Total DA = ₹{tot_da:.2f}")
                for sl in modal_dump.get("leftSummary", []):
                    stream(f"   • {sl[1]}: {sl[2]} Days ➔ ₹{sl[3]}")
                stream(f"💰 GRAND TOTAL CLAIM = ₹{(tot_ta + tot_da + 270):.2f}")
                stream("=" * 115)

            browser.close()
            stream("🎉 SCRIPT FINISHED! Check Port 9000.")

    except Exception as e:
        tb = traceback.format_exc()
        stream(f"❌ Error: {str(e)}\n{tb}")

if __name__ == "__main__":
    run()
