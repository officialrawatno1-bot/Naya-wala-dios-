import os, sys, time, json
import openpyxl
from playwright.sync_api import sync_playwright

CBO_USER = os.getenv("CBO_USER", "6958BANWARI")
CBO_PASS = os.getenv("CBO_PASS", "6958")
LOGIN_URL = "https://dios.myreporting.net/erp/login"

def extract_expense_statement(target_month="Aug-2026"):
    print("=" * 75)
    print(f"🚀 [CBO EXPENSE EXTRACTOR] DOWNLOADING EXPENSE STATEMENT FOR {target_month}...")
    print("=" * 75)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        context = browser.new_context(viewport={"width": 1600, "height": 1000}, accept_downloads=True)
        page = context.new_page()
        page.set_default_timeout(45000)
        page.on("dialog", lambda d: d.accept())

        # 1. Login
        print(f"1. Authenticating as {CBO_USER}...")
        page.goto(LOGIN_URL, timeout=60000, wait_until="domcontentloaded")
        page.wait_for_timeout(1500)
        page.fill("input[type='text']:visible", CBO_USER)
        page.fill("input[type='password']:visible", CBO_PASS)
        page.locator("button:visible:has-text('Login'), input[type='submit']:visible, .btn-success:visible").first.click()
        page.wait_for_selector("#ej2-menu_1, a:has-text('SFA'), span:has-text('SFA')", timeout=35000)
        print("   ✅ Login Successful.")

        # 2. Navigate: SFA -> Expense Statement
        print("2. Navigating: SFA -> Expense Statement...")
        page.locator("a:has-text('SFA'), span:has-text('SFA')").first.click()
        page.wait_for_timeout(800)
        page.locator("a:has-text('Expense Statement'), span:has-text('Expense Statement')").first.click()
        page.wait_for_timeout(3500)

        # 3. Check for Month filter and query
        print("3. Querying Expense List for August 2026...")
        page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button, input[type=button], a'));
            const go = btns.find(b => (b.innerText || b.value || '').trim().toUpperCase().includes('GO') || (b.innerText || '').includes('Show'));
            if (go) go.click();
        }""")
        page.wait_for_timeout(2500)

        # 4. Click Employee Name link (BANWARI LAL MEENA)
        print("4. Clicking Employee Link (BANWARI LAL MEENA)...")
        clicked_emp = page.evaluate("""() => {
            const links = Array.from(document.querySelectorAll('table a, a'));
            const empLink = links.find(a => {
                const t = (a.innerText || '').trim().toUpperCase();
                return t.includes('BANWARI') || t.includes('6958') || t.includes('MEENA') || t.includes('RJ/SL/0042');
            });
            if (empLink) {
                empLink.click();
                return true;
            }
            // If table row has first link
            const firstRowLink = document.querySelector('tbody tr a, .e-row a');
            if (firstRowLink) {
                firstRowLink.click();
                return true;
            }
            return false;
        }""")

        if not clicked_emp:
            emp_btn = page.locator("a:has-text('BANWARI'), a:has-text('RJ/SL/0042'), table tr a").first
            if emp_btn.count() > 0:
                emp_btn.click(force=True)

        print("   ⏳ Waiting for 'Expense Statement (Entry)' Modal window...")
        page.wait_for_timeout(4000)

        # 5. Extract Live Modal Data from DOM
        modal_info = page.evaluate("""() => {
            const modal = document.querySelector('ngb-modal-window, .modal.show, .fullscreen-modal') || document.body;
            
            // Extract Header fields
            const headerText = modal.innerText;
            
            // Extract Table Rows
            const rows = [];
            const trs = Array.from(modal.querySelectorAll('table tbody tr, table tr'));
            trs.forEach(tr => {
                const tds = Array.from(tr.querySelectorAll('td, th')).map(td => td.innerText.trim());
                if (tds.length >= 8 && /^[0-9]+$/.test(tds[0])) {
                    rows.push({
                        srNo: tds[0],
                        date: tds[1],
                        actualStation: tds[2],
                        workingType: tds[3],
                        workingRoute: tds[4],
                        daType: tds[5],
                        workWith: tds[6],
                        drCall: tds[7],
                        chemCall: tds[8] || '',
                        stkCall: tds[9] || '',
                        routeKm: tds[10] || '',
                        payableKm: tds[11] || '',
                        rate: tds[12] || '',
                        fareTa: tds[13] || '',
                        daAmt: tds[14] || ''
                    });
                }
            });

            return {
                rows: rows,
                totalRows: rows.length
            };
        }""")

        print(f"   ✅ Modal Detected! Extracted {modal_info['totalRows']} Daily Expense Rows from screen.")

        # 6. Click Green Excel Button to Download
        print("5. Clicking Green Excel Button to Download Original CBO File...")
        excel_save_path = "/tmp/Expense_August_2026.xlsx"
        
        try:
            with page.expect_download(timeout=15000) as dl_info:
                page.evaluate("""() => {
                    const btns = Array.from(document.querySelectorAll('button, a, input[type=button]'));
                    const excelBtn = btns.find(b => {
                        const t = (b.innerText || b.value || '').trim().toUpperCase();
                        return t.includes('EXCEL') || b.className.includes('btn-success');
                    });
                    if (excelBtn) excelBtn.click();
                }""")
            
            download = dl_info.value
            download.save_as(excel_save_path)
            print(f"🎉 [SUCCESS] Original CBO Expense Excel Downloaded: {excel_save_path} ({os.path.getsize(excel_save_path)} bytes)")
        except Exception as dl_err:
            print(f"⚠️ Excel direct download hook timed out, but DOM extraction succeeded: {dl_err}")

        browser.close()

    # 7. Print Extracted Table
    rows = modal_info.get("rows", [])
    if rows:
        print("\n" + "=" * 95)
        print(f"{'SR':<4} {'DATE':<12} {'STATION':<14} {'WORK TYPE':<12} {'DA TYPE':<8} {'KM':<6} {'FARE (TA)':<10} {'DA AMT':<10} {'DR CALL':<8}")
        print("=" * 95)
        
        tot_km = 0
        tot_ta = 0
        tot_da = 0
        tot_drs = 0
        
        for r in rows:
            km_val = float(r['payableKm'] or r['routeKm'] or 0)
            ta_val = float(r['fareTa'] or 0)
            da_val = float(r['daAmt'] or 0)
            dr_val = int(r['drCall'] or 0)
            
            tot_km += km_val
            tot_ta += ta_val
            tot_da += da_val
            tot_drs += dr_val

            print(f"{r['srNo']:<4} {r['date']:<12} {r['actualStation'][:13]:<14} {r['workingType'][:11]:<12} {r['daType']:<8} {km_val:<6.0f} ₹{ta_val:<9.2f} ₹{da_val:<9.2f} {dr_val:<8}")

        print("-" * 95)
        print(f"TOTAL: Route KM = {tot_km:.0f} km | Total TA (Fare) = ₹{tot_ta:.2f} | Total DA = ₹{tot_da:.2f} | Total Calls = {tot_drs}")
        print(f"💰 GRAND TOTAL EXPENSE CLAIM = ₹{(tot_ta + tot_da):.2f}")
        print("=" * 95)

if __name__ == "__main__":
    extract_expense_statement("Aug-2026")
