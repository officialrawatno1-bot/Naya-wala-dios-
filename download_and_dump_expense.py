import os, sys, time, json, traceback
import openpyxl
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
    stream("🚀 [FRAME 1 TARGETED ENGINE] DOWNLOADING AUGUST 2026 EXPENSE EXCEL...")
    stream("=" * 85)

    excel_save_path = "/tmp/CBO_Expense_August_2026.xlsx"

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            context = browser.new_context(viewport={"width": 1600, "height": 1000}, accept_downloads=True)
            page = context.new_page()
            page.set_default_timeout(55000)
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

            # 3. Query List
            stream("3. Querying August 2026 Statement List...")
            page.evaluate("""() => {
                const btns = Array.from(document.querySelectorAll('button, input[type=button], a'));
                const go = btns.find(b => (b.innerText || b.value || '').trim().toUpperCase().includes('GO'));
                if (go) go.click();
            }""")
            page.wait_for_timeout(3500)

            # 4. Click BANWARI LAL MEENA
            stream("4. Clicking BANWARI LAL MEENA Link...")
            clicked = page.evaluate("""() => {
                const allA = Array.from(document.querySelectorAll('table a, .e-row a, a'));
                const target = allA.find(a => (a.innerText || '').toUpperCase().includes('BANWARI') || (a.innerText || '').includes('0042'));
                if (target) { target.click(); return true; }
                const firstA = document.querySelector('tbody tr a, .e-row a');
                if (firstA) { firstA.click(); return true; }
                return false;
            }""")

            if not clicked:
                page.locator("a:has-text('BANWARI'), a:has-text('0042'), .e-row a").first.click(force=True)

            stream("   ⏳ Waiting 6s for Child Iframes & Grids to fully render...")
            page.wait_for_timeout(6000)

            # 5. Target Child Iframes & Trigger Excel Download
            stream(f"5. Scanning {len(page.frames)} Frames for Green Excel Button & Tables...")
            
            download_triggered = False

            for f_idx, frame in enumerate(page.frames):
                f_name = frame.name or 'main'
                f_url = frame.url or ''
                
                # Check for Excel button in this frame
                has_excel = frame.evaluate("""() => {
                    const btns = Array.from(document.querySelectorAll('button, a, input[type=button]'));
                    const excelBtn = btns.find(b => {
                        const t = (b.innerText || b.value || b.title || '').trim().toUpperCase();
                        return t.includes('EXCEL') || (b.className || '').includes('btn-success');
                    });
                    return !!excelBtn;
                }""")

                stream(f"   • Frame [{f_idx}] ({f_name}): Has Excel Button? -> {has_excel} (URL: {f_url[:45]}...)")

                if has_excel and not download_triggered:
                    stream(f"   🎯 Found Green Excel Button in Frame [{f_idx}]! Clicking to capture download...")
                    try:
                        with page.expect_download(timeout=15000) as dl_info:
                            frame.evaluate("""() => {
                                const btns = Array.from(document.querySelectorAll('button, a, input[type=button]'));
                                const excelBtn = btns.find(b => {
                                    const t = (b.innerText || b.value || b.title || '').trim().toUpperCase();
                                    return t.includes('EXCEL') || (b.className || '').includes('btn-success');
                                });
                                if (excelBtn) excelBtn.click();
                            }""")
                        
                        dl = dl_info.value
                        dl.save_as(excel_save_path)
                        stream(f"🎉 [EXCEL DOWNLOADED]: {excel_save_path} ({os.path.getsize(excel_save_path)} bytes)!")
                        download_triggered = True
                    except Exception as e:
                        stream(f"   ⚠️ Frame [{f_idx}] download wait notice: {e}")

                # Extract Table Rows from this frame
                frame_data = frame.evaluate("""() => {
                    const tables = Array.from(document.querySelectorAll('table'));
                    const res = [];
                    tables.forEach(t => {
                        const trs = Array.from(t.querySelectorAll('tr'));
                        trs.forEach(tr => {
                            const cells = Array.from(tr.querySelectorAll('td, th')).map(c => c.innerText.trim());
                            if (cells.length >= 6) res.push(cells);
                        });
                    });
                    return res;
                }""")

                if len(frame_data) > 5:
                    stream(f"   ✅ Frame [{f_idx}] has {len(frame_data)} table rows!")
                    # Dump first 3 rows for inspection
                    for r in frame_data[:3]:
                        stream(f"      Row: {' | '.join(r[:7])}")

            browser.close()

    except Exception as e:
        tb = traceback.format_exc()
        stream(f"❌ Playwright Error: {str(e)}\n{tb}")

    # 6. Parse and Read the Downloaded Excel File
    if os.path.exists(excel_save_path):
        stream("\n" + "=" * 105)
        stream(f"📊 [PARSING ORIGINAL CBO EXPENSE EXCEL] -> {excel_save_path}")
        stream("=" * 105)
        
        try:
            wb = openpyxl.load_workbook(excel_save_path, data_only=True)
            ws = wb.active
            stream(f"Active Sheet Name: '{ws.title}', Max Rows: {ws.max_row}, Max Cols: {ws.max_column}\n")

            for r in range(1, min(ws.max_row + 1, 45)):
                row_vals = [str(ws.cell(r, c).value or '').strip() for c in range(1, ws.max_column + 1)]
                if any(row_vals):
                    # Filter empty trailing cells
                    while row_vals and not row_vals[-1]:
                        row_vals.pop()
                    stream(f"Row {r:02d}: " + " | ".join(row_vals[:12]))
            
            stream("=" * 105)
            stream("🎉 CBO EXPENSE EXCEL DUMP COMPLETED!")
        except Exception as p_err:
            stream(f"❌ Excel Parse Error: {p_err}")

if __name__ == "__main__":
    run()
