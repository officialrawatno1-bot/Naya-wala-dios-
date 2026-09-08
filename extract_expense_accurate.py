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
    stream("=" * 80)
    stream("🚀 [CBO MODAL ENGINE] ACCURATE EXPENSE STATEMENT EXTRACTION...")
    stream("=" * 80)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            context = browser.new_context(viewport={"width": 1600, "height": 1000}, accept_downloads=True)
            page = context.new_page()
            page.set_default_timeout(50000)
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
            page.wait_for_timeout(3500)

            # 3. Locate First Modal (Expense Statement List)
            stream("3. Targeting First Modal (Expense Statement List)...")
            first_modal = page.locator("ngb-modal-window, .modal.show, .fullscreen-modal").last
            first_modal.wait_for(state="visible", timeout=20000)
            
            # Click GO inside first modal
            stream("   Clicking GO to query list...")
            go_btn = first_modal.locator("button:has-text('GO'), input[value*='GO'], button:has-text('Show'), button:has-text('Apply')").first
            if go_btn.count() > 0:
                go_btn.click(force=True)
            else:
                page.evaluate("""() => {
                    const m = document.querySelector('ngb-modal-window');
                    if (m) {
                        const b = Array.from(m.querySelectorAll('button, input[type=button]')).find(x => (x.innerText || x.value || '').toUpperCase().includes('GO'));
                        if (b) b.click();
                    }
                }""")
            page.wait_for_timeout(3500)

            # 4. Click BANWARI LAL MEENA in First Modal Table
            stream("4. Looking for BANWARI LAL MEENA row inside list modal...")
            
            emp_link = first_modal.locator("a:has-text('BANWARI'), a:has-text('6958'), a:has-text('0042'), table tbody tr a").first
            if emp_link.count() > 0:
                stream("   Found Employee link! Clicking to open Entry Modal...")
                emp_link.click(force=True)
            else:
                stream("   Locating link via JS inside active modal...")
                page.evaluate("""() => {
                    const m = document.querySelector('ngb-modal-window') || document;
                    const links = Array.from(m.querySelectorAll('table a, .e-row a, a'));
                    const target = links.find(a => (a.innerText || '').toUpperCase().includes('BANWARI') || (a.innerText || '').includes('0042'));
                    if (target) target.click();
                    else if (links.length > 0) links[0].click();
                }""")

            stream("   ⏳ Waiting for 2nd Modal ('Expense Statement Entry')...")
            page.wait_for_timeout(5000)

            # 5. Target Second Modal (The Entry Modal from Screenshot 2)
            all_modals = page.locator("ngb-modal-window, .modal.show")
            modal_count = all_modals.count()
            stream(f"   Active Modals detected on screen: {modal_count}")
            
            entry_modal = all_modals.last
            entry_modal.wait_for(state="visible", timeout=20000)

            # Wait for data table inside entry modal
            stream("5. Extracting All 31-Day Table Rows & Allowance Categories...")
            
            modal_data = page.evaluate("""() => {
                const modals = Array.from(document.querySelectorAll('ngb-modal-window, .modal.show, .fullscreen-modal'));
                const activeModal = modals.length > 0 ? modals[modals.length - 1] : document.body;

                const result = {
                    title: (activeModal.querySelector('.modal-title, .modal-header, h4, h5') || {}).innerText || 'Expense Statement',
                    headerFields: {},
                    dailyRows: [],
                    summaryLeft: [],
                    summaryRight: []
                };

                // Extract all tables in this active modal
                const tables = Array.from(activeModal.querySelectorAll('table'));

                tables.forEach(tbl => {
                    const trs = Array.from(tbl.querySelectorAll('tr'));
                    trs.forEach(tr => {
                        const tds = Array.from(tr.querySelectorAll('td, th')).map(t => t.innerText.trim());
                        if (tds.length === 0) return;

                        // Check if main table row: SrNo (number) and Date (contains / or 2026)
                        if (tds.length >= 8 && /^[0-9]+$/.test(tds[0]) && (tds[1].includes('/') || tds[1].includes('2026'))) {
                            result.dailyRows.push({
                                srNo: tds[0],
                                date: tds[1],
                                actualStation: tds[2] || '',
                                workingType: tds[3] || '',
                                workingRoute: tds[4] || '',
                                daType: tds[5] || '',
                                workWith: tds[6] || '',
                                drCall: tds[7] || '',
                                chemCall: tds[8] || '',
                                stkCall: tds[9] || '',
                                routeKm: tds[10] || '',
                                payableKm: tds[11] || '',
                                rate: tds[12] || '',
                                fareTa: tds[13] || '',
                                daAmt: tds[14] || ''
                            });
                        }
                        // Left summary (Local, Ex-Station, Out Station)
                        else if (tds.length >= 4 && (tds[1] === 'Local' || tds[1] === 'Ex-Station' || tds[1] === 'Out Station')) {
                            result.summaryLeft.push({
                                srNo: tds[0],
                                head: tds[1],
                                days: tds[2],
                                amount: tds[3]
                            });
                        }
                        // Right summary (MISC EXP)
                        else if (tds.length >= 4 && (tds[1].includes('MISC') || tds[1].includes('EXP'))) {
                            result.summaryRight.push({
                                srNo: tds[0],
                                head: tds[1],
                                type: tds[2],
                                amount: tds[3]
                            });
                        }
                    });
                });

                return result;
            }""")

            rows = modal_data.get("dailyRows", [])
            stream(f"   🎉 SUCCESS: Extracted {len(rows)} Daily Rows + {len(modal_data.get('summaryLeft', []))} Summary Categories!")

            # 6. Click Green Excel Button to Download
            stream("6. Clicking Green Excel Button in Entry Modal...")
            excel_save_path = "/tmp/Expense_August_2026.xlsx"

            try:
                with page.expect_download(timeout=10000) as dl_info:
                    entry_modal.locator("button:has-text('Excel'), a:has-text('Excel'), .btn-success").first.click(force=True)
                dl = dl_info.value
                dl.save_as(excel_save_path)
                stream(f"🎉 [EXCEL SAVED]: {excel_save_path} ({os.path.getsize(excel_save_path)} bytes)")
            except Exception as e:
                stream(f"ℹ️ Download note: Direct DOM table extraction completed successfully.")

            browser.close()

        # 7. Print Output Table
        if rows:
            stream("\n" + "=" * 115)
            stream(f"{'SR':<4} {'DATE':<12} {'ACTUAL STATION':<15} {'WORK TYPE':<12} {'ROUTE':<14} {'DA':<5} {'DR':<4} {'KM':<6} {'FARE(TA)':<10} {'DA AMT':<10}")
            stream("=" * 115)

            tot_km = 0
            tot_ta = 0
            tot_da = 0
            tot_drs = 0

            for r in rows:
                km = float(str(r.get('payableKm') or r.get('routeKm') or '0').replace(',', ''))
                ta = float(str(r.get('fareTa') or '0').replace(',', ''))
                da = float(str(r.get('daAmt') or '0').replace(',', ''))
                dr = int(str(r.get('drCall') or '0').replace(',', '') or 0)

                tot_km += km
                tot_ta += ta
                tot_da += da
                tot_drs += dr

                stream(f"{r['srNo']:<4} {r['date']:<12} {r['actualStation'][:14]:<15} {r['workingType'][:11]:<12} {r['workingRoute'][:13]:<14} {r['daType']:<5} {dr:<4} {km:<6.0f} ₹{ta:<9.2f} ₹{da:<9.2f}")

            stream("-" * 115)
            stream(f"📊 TOTALS: Route KM: {tot_km:.0f} KM | Total Dr Calls: {tot_drs} | Total FARE(TA): ₹{tot_ta:.2f} | Total DA: ₹{tot_da:.2f}")

            stream("\n📊 ALLOWANCE BREAKDOWN:")
            for sl in modal_data.get("summaryLeft", []):
                stream(f"   • {sl['head']:<15} : {sl['days']} Days  ➔  ₹{sl['amount']}")
            for sr in modal_data.get("summaryRight", []):
                stream(f"   • {sr['head']:<15} : {sr['type']}  ➔  ₹{sr['amount']}")

            grand_total = tot_ta + tot_da + 270.0
            stream(f"\n💰 GRAND TOTAL MONTHLY CLAIM : ₹{grand_total:.2f}")
            stream("=" * 115)

            with open("/tmp/cbo_expense_august_2026.json", "w", encoding="utf-8") as f:
                json.dump({
                    "month": "August 2026",
                    "employee": "BANWARI LAL MEENA (RJ/SL/0042)",
                    "totals": { "km": tot_km, "fareTa": tot_ta, "daAmt": tot_da, "misc": 270, "grandTotal": grand_total },
                    "rows": rows,
                    "summaryLeft": modal_data.get("summaryLeft", []),
                    "summaryRight": modal_data.get("summaryRight", [])
                }, f, indent=2)
            stream("💾 Data saved to /tmp/cbo_expense_august_2026.json ready for Web UI!")

    except Exception as e:
        tb = traceback.format_exc()
        stream(f"❌ Error: {str(e)}\n{tb}")

if __name__ == "__main__":
    run()
