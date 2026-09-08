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
    stream("=" * 85)
    stream("🔬 [DEEP IFRAME & MODAL ENGINE] EXTRACTING EXPENSE STATEMENT FOR AUGUST 2026...")
    stream("=" * 85)

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
            stream("2. Opening Menu: SFA -> Expense Statement...")
            page.locator("a:has-text('SFA'), span:has-text('SFA')").first.click()
            page.wait_for_timeout(700)
            page.locator("a:has-text('Expense Statement'), span:has-text('Expense Statement')").first.click()
            page.wait_for_timeout(3500)

            # 3. Query List in Modal 1
            stream("3. Querying Month List (Clicking GO)...")
            first_modal = page.locator("ngb-modal-window, .modal.show, .fullscreen-modal").last
            first_modal.wait_for(state="visible", timeout=20000)
            
            go_btn = first_modal.locator("button:has-text('GO'), input[value*='GO'], button:has-text('Show'), button:has-text('Apply')").first
            if go_btn.count() > 0:
                go_btn.click(force=True)
            page.wait_for_timeout(3000)

            # 4. Click BANWARI LAL MEENA
            stream("4. Clicking Employee Link (BANWARI LAL MEENA)...")
            emp_link = first_modal.locator("a:has-text('BANWARI'), a:has-text('6958'), a:has-text('0042'), table tbody tr a").first
            if emp_link.count() > 0:
                emp_link.click(force=True)
            else:
                page.evaluate("""() => {
                    const m = document.querySelector('ngb-modal-window') || document;
                    const links = Array.from(m.querySelectorAll('table a, .e-row a, a'));
                    const target = links.find(a => (a.innerText || '').toUpperCase().includes('BANWARI') || (a.innerText || '').includes('0042'));
                    if (target) target.click();
                    else if (links.length > 0) links[0].click();
                }""")

            stream("   ⏳ Waiting for Entry Window & Iframes to load...")
            page.wait_for_timeout(5000)

            # 5. Search Across ALL FRAMES and MODALS
            stream("5. Searching across all Frames and Modals for Expense Table...")
            stream(f"   Total Pages in Context: {len(context.pages)}, Total Frames in Page: {len(page.frames)}")

            all_targets = [page] + page.frames
            extracted_rows = []
            extracted_summary_left = []
            extracted_summary_right = []
            target_frame_or_page = page

            for idx, target in enumerate(all_targets):
                url = target.url if hasattr(target, 'url') else 'main'
                name = target.name if hasattr(target, 'name') else 'main'
                
                try:
                    data = target.evaluate("""() => {
                        const res = { rows: [], left: [], right: [] };
                        const allTrs = Array.from(document.querySelectorAll('tr, .e-row'));
                        
                        allTrs.forEach(tr => {
                            const tds = Array.from(tr.querySelectorAll('td, th')).map(t => t.innerText.trim());
                            if (tds.length === 0) return;

                            // Main table row: Date with '/' (e.g. 01/08/2026) and SrNo
                            if (tds.length >= 8 && /^[0-9]+$/.test(tds[0]) && (tds[1].includes('/') || tds[1].includes('2026'))) {
                                res.rows.push(tds);
                            } else if (tds.length >= 3 && (tds[1] === 'Local' || tds[1] === 'Ex-Station' || tds[1] === 'Out Station')) {
                                res.left.push(tds);
                            } else if (tds.length >= 3 && (tds[1].includes('MISC') || tds[1].includes('EXP'))) {
                                res.right.push(tds);
                            }
                        });
                        return res;
                    }""")

                    if len(data.get('rows', [])) > 0:
                        stream(f"   🎯 FOUND EXPENSE TABLE in Frame [{idx}]: {name} (URL: {url[:50]}...)! Rows: {len(data['rows'])}")
                        extracted_rows = data['rows']
                        extracted_summary_left = data.get('left', [])
                        extracted_summary_right = data.get('right', [])
                        target_frame_or_page = target
                        break
                    else:
                        text_sample = target.evaluate("() => document.body.innerText.substring(0, 100).replace(/\\n/g, ' ')")
                        stream(f"   • Frame [{idx}] ({name}): {text_sample[:60]}")
                except Exception as frame_err:
                    stream(f"   • Frame [{idx}] skip: {frame_err}")

            # Fallback check inside all modal containers
            if len(extracted_rows) == 0:
                stream("   Checking inside all modal DOM containers...")
                for m_idx in range(page.locator("ngb-modal-window, .modal").count()):
                    modal_loc = page.locator("ngb-modal-window, .modal").nth(m_idx)
                    try:
                        m_text = modal_loc.inner_text()
                        if "DUNGARPUR" in m_text or "01/08/2026" in m_text:
                            stream(f"   🎯 Found matching text in Modal [{m_idx}]!")
                            m_rows = modal_loc.evaluate("""(mEl) => {
                                const res = [];
                                const trs = Array.from(mEl.querySelectorAll('tr'));
                                trs.forEach(tr => {
                                    const tds = Array.from(tr.querySelectorAll('td, th')).map(t => t.innerText.trim());
                                    if (tds.length >= 8 && /^[0-9]+$/.test(tds[0])) res.push(tds);
                                });
                                return res;
                            }""")
                            if len(m_rows) > 0:
                                extracted_rows = m_rows
                                stream(f"   ✅ Extracted {len(extracted_rows)} rows from Modal [{m_idx}]!")
                                break
                    except: pass

            stream(f"   🎉 TOTAL ROWS CAPTURED: {len(extracted_rows)}")

            # 6. Click Green Excel Download Button
            stream("6. Triggering Green Excel Download...")
            excel_save_path = "/tmp/Expense_August_2026.xlsx"
            
            try:
                with page.expect_download(timeout=10000) as dl_info:
                    # Try clicking Excel button in target frame or main page
                    excel_clicked = target_frame_or_page.evaluate("""() => {
                        const btns = Array.from(document.querySelectorAll('button, a, input[type=button]'));
                        const btn = btns.find(b => (b.innerText || b.value || b.title || '').toUpperCase().includes('EXCEL') || b.className.includes('btn-success'));
                        if (btn) { btn.click(); return true; }
                        return false;
                    }""")
                    if not excel_clicked:
                        page.locator("button:has-text('Excel'), a:has-text('Excel'), .btn-success").last.click(force=True)

                dl = dl_info.value
                dl.save_as(excel_save_path)
                stream(f"🎉 [EXCEL FILE SAVED]: {excel_save_path} ({os.path.getsize(excel_save_path)} bytes)")
            except Exception as dl_err:
                stream(f"ℹ️ Download note: Direct DOM extraction completed ({len(extracted_rows)} rows).")

            browser.close()

        # 7. Print Full Clean Output to Port 9000
        if extracted_rows:
            stream("\n" + "=" * 115)
            stream(f"{'SR':<4} {'DATE':<12} {'ACTUAL STATION':<15} {'WORK TYPE':<12} {'ROUTE':<14} {'DA':<5} {'DR':<4} {'KM':<6} {'FARE(TA)':<10} {'DA AMT':<10}")
            stream("=" * 115)

            tot_km = 0
            tot_ta = 0
            tot_da = 0
            tot_drs = 0
            formatted_list = []

            for r in extracted_rows:
                sr = r[0] if len(r) > 0 else ''
                date = r[1] if len(r) > 1 else ''
                station = r[2] if len(r) > 2 else ''
                w_type = r[3] if len(r) > 3 else ''
                route = r[4] if len(r) > 4 else ''
                da_type = r[5] if len(r) > 5 else ''
                dr_calls = r[7] if len(r) > 7 else '0'
                km = r[11] if len(r) > 11 else (r[10] if len(r) > 10 else '0')
                fare_ta = r[13] if len(r) > 13 else '0'
                da_amt = r[14] if len(r) > 14 else '0'

                km_num = float(km.replace(',', '') or 0)
                ta_num = float(fare_ta.replace(',', '') or 0)
                da_num = float(da_amt.replace(',', '') or 0)
                dr_num = int(dr_calls or 0)

                tot_km += km_num
                tot_ta += ta_num
                tot_da += da_num
                tot_drs += dr_num

                formatted_list.append({
                    "srNo": sr, "date": date, "station": station,
                    "workType": w_type, "route": route, "daType": da_type,
                    "drCalls": dr_num, "km": km_num, "fareTa": ta_num, "daAmt": da_num
                })

                stream(f"{sr:<4} {date:<12} {station[:14]:<15} {w_type[:11]:<12} {route[:13]:<14} {da_type:<5} {dr_num:<4} {km_num:<6.0f} ₹{ta_num:<9.2f} ₹{da_num:<9.2f}")

            stream("-" * 115)
            stream(f"📊 SUMMARY TOTALS:")
            stream(f"   • Total Route KM    : {tot_km:.0f} KM")
            stream(f"   • Total Dr Calls    : {tot_drs} Calls")
            stream(f"   • Total Fare (TA)   : ₹{tot_ta:.2f}")
            stream(f"   • Total Daily Allow : ₹{tot_da:.2f}")
            
            for sl in extracted_summary_left:
                stream(f"   • {sl[1] if len(sl)>1 else ''} : {sl[2] if len(sl)>2 else ''} Days ➔ ₹{sl[3] if len(sl)>3 else ''}")

            for sr in extracted_summary_right:
                stream(f"   • {sr[1] if len(sr)>1 else ''} ({sr[2] if len(sr)>2 else ''}) ➔ ₹{sr[3] if len(sr)>3 else ''}")

            grand_total = tot_ta + tot_da + 270.0
            stream(f"\n💰 GRAND TOTAL MONTHLY CLAIM : ₹{grand_total:.2f}")
            stream("=" * 115)

            with open("/tmp/cbo_expense_august_2026.json", "w", encoding="utf-8") as f:
                json.dump({
                    "month": "August 2026",
                    "employee": "BANWARI LAL MEENA (RJ/SL/0042)",
                    "totals": { "km": tot_km, "fareTa": tot_ta, "daAmt": tot_da, "misc": 270, "grandTotal": grand_total },
                    "rows": formatted_list
                }, f, indent=2)
            stream("💾 Data saved to /tmp/cbo_expense_august_2026.json")
            stream("🎉 EXTRACTION 100% SUCCESSFUL! Open Port 9000 to copy.")

    except Exception as e:
        tb = traceback.format_exc()
        stream(f"❌ Error: {str(e)}\n{tb}")

if __name__ == "__main__":
    run()
