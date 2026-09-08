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
    stream("🎯 [ACCURATE MONTH SELECTOR] TARGETING AUGUST 2026 EXPENSE POPUP...")
    stream("=" * 95)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            context = browser.new_context(viewport={"width": 1600, "height": 1000})
            page = context.new_page()
            page.set_default_timeout(45000)
            page.on("dialog", lambda d: d.accept())

            # 1. Login
            stream(f"1. Authenticating as {CBO_USER}...")
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
            page.wait_for_timeout(4000)

            # 3. 🎯 TARGET THE EXACT 'Sep-2026' INPUT & CLICK ITS DROPDOWN ARROW
            stream("3. Locating Month Input (Currently 'Sep-2026') & Clicking its Dropdown Arrow...")
            
            # Click the dropdown icon specifically inside the Month input group
            arrow_clicked = page.evaluate("""() => {
                const inps = Array.from(document.querySelectorAll('input'));
                const monthInp = inps.find(i => (i.value || '').includes('Sep-2026') || (i.value || '').includes('2026/09'));
                if (monthInp) {
                    const group = monthInp.closest('.e-input-group, .e-input-wrapper, span, div');
                    const icon = group ? group.querySelector('.e-ddl-icon, .e-input-group-icon, span.e-icons') : null;
                    if (icon) {
                        icon.click();
                        return { clicked: true, method: 'icon' };
                    } else {
                        monthInp.click();
                        return { clicked: true, method: 'input' };
                    }
                }
                return { clicked: false };
            }""")
            
            stream(f"   Month Dropdown Clicked: {arrow_clicked}")
            page.wait_for_timeout(1500)

            # 4. DUMP ALL REAL MONTH OPTIONS FROM THE POPUP
            stream("4. Reading Months available in CBO Dropdown Popup...")
            months_list = page.evaluate("""() => {
                const popups = Array.from(document.querySelectorAll('.e-popup.e-popup-open, .e-dropdownbase, .e-list-parent'));
                const items = [];
                popups.forEach(p => {
                    Array.from(p.querySelectorAll('li')).forEach(li => {
                        const txt = li.innerText.trim();
                        if (txt && !txt.includes('Chart')) items.push(txt);
                    });
                });
                return items;
            }""")

            stream(f"   Available Month Options: {months_list}")

            # 5. CLICK AUGUST IN POPUP
            stream("5. Clicking 'Aug-2026' in the Month Popup...")
            aug_selected = page.evaluate("""() => {
                const popups = Array.from(document.querySelectorAll('.e-popup.e-popup-open, .e-dropdownbase, .e-list-parent'));
                for (const p of popups) {
                    const li = Array.from(p.querySelectorAll('li')).find(l => (l.innerText || '').toUpperCase().includes('AUG'));
                    if (li) {
                        li.click();
                        return { success: true, text: li.innerText.trim() };
                    }
                }
                return { success: false };
            }""")

            stream(f"   August Selection Result: {aug_selected}")
            page.wait_for_timeout(1500)

            # 6. CLICK GO [F4] BUTTON
            stream("6. Clicking 'GO [F4]' to load August Statement List...")
            page.locator("button:has-text('GO'), .btn-primary:has-text('GO')").first.click(force=True)
            page.wait_for_timeout(4500)

            # 7. READ ROWS IN GRID TO VERIFY AUGUST
            stream("7. Reading Employee List Grid...")
            grid_info = page.evaluate("""() => {
                const rows = Array.from(document.querySelectorAll('tbody tr, .e-row')).filter(r => r.innerText.includes('BANWARI'));
                return rows.map(r => r.innerText.trim().replace(/\\n/g, ' | '));
            }""")
            for r in grid_info:
                stream(f"   👉 {r}")

            # 8. CLICK BANWARI LAL MEENA ROW LINK
            stream("8. Opening Banwari Lal Meena Statement Entry...")
            row_link = page.locator("tr:has-text('BANWARI LAL MEENA') a.blue, tr:has-text('BANWARI LAL MEENA') a, .e-row a").first
            row_link.click(force=True)

            stream("   ⏳ Waiting 6s for August Entry Screen & 31-Day Table to render...")
            page.wait_for_timeout(6000)

            # 9. EXTRACT ALL 31-DAY ROWS & ALLOWANCE BOXES
            stream("9. Extracting Full August 2026 Data from Entry Screen...")
            
            aug_result = page.evaluate("""() => {
                const modals = Array.from(document.querySelectorAll('ngb-modal-window.show, .modal.show, .fullscreen-modal, ngb-modal-window'));
                const m = modals.length > 0 ? modals[modals.length - 1] : document.body;

                const txt = m.innerText;
                const mMatch = txt.match(/Month[:\\s]+([^\\n\\r]+)/i);

                // Main 31-day table
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

                // Left summary (Local, Ex-Station)
                const left = [];
                const leftTables = Array.from(m.querySelectorAll('table')).filter(t => t.innerText.includes('Local') || t.innerText.includes('Ex-Station'));
                if (leftTables.length > 0) {
                    Array.from(leftTables[0].querySelectorAll('tr')).forEach(tr => {
                        const tds = Array.from(tr.querySelectorAll('td')).map(c => c.innerText.trim());
                        if (tds.length >= 4 && /^[0-9]+$/.test(tds[0])) left.push(tds);
                    });
                }

                // Right summary (MISC EXP)
                const right = [];
                const rightTables = Array.from(m.querySelectorAll('table')).filter(t => t.innerText.includes('MISC EXP'));
                if (rightTables.length > 0) {
                    Array.from(rightTables[0].querySelectorAll('tr')).forEach(tr => {
                        const tds = Array.from(tr.querySelectorAll('td')).map(c => c.innerText.trim());
                        if (tds.length >= 4 && /^[0-9]+$/.test(tds[0])) right.push(tds);
                    });
                }

                return {
                    month: mMatch ? mMatch[1].trim() : 'UNKNOWN',
                    rows: rows,
                    leftSummary: left,
                    rightSummary: right
                };
            }""")

            stream(f"   📌 Verified Header Month: '{aug_result.get('month')}'")
            stream(f"   Daily Table Rows Found: {len(aug_result.get('rows', []))}")

            # 10. PRINT CLEAN TABLE
            rows = aug_result.get("rows", [])
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
                stream(f"📊 SUMMARY TOTALS:")
                stream(f"   • Total Route KM    : {tot_km:.0f} KM")
                stream(f"   • Total Dr Calls    : {tot_drs} Calls")
                stream(f"   • Total Fare (TA)   : ₹{tot_ta:.2f}")
                stream(f"   • Total Daily Allow : ₹{tot_da:.2f}")

                for sl in aug_result.get("leftSummary", []):
                    stream(f"   • {sl[1]}: {sl[2]} Days ➔ ₹{sl[3]}")
                for sr in aug_result.get("rightSummary", []):
                    stream(f"   • {sr[1]} ({sr[2]}): ➔ ₹{sr[3]}")

                grand = tot_ta + tot_da + 270.0
                stream(f"\n💰 GRAND TOTAL EXPENSE CLAIM : ₹{grand:.2f}")
                stream("=" * 115)

                with open("/tmp/cbo_expense_august_2026.json", "w", encoding="utf-8") as f:
                    json.dump(aug_result, f, indent=2)

            browser.close()
            stream("🎉 EXTRACTION COMPLETED! Check Port 9000.")

    except Exception as e:
        tb = traceback.format_exc()
        stream(f"❌ Error: {str(e)}\n{tb}")

if __name__ == "__main__":
    run()
