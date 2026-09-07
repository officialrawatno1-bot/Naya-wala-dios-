import os, sys, time, json, calendar, traceback
from playwright.sync_api import sync_playwright
from primary_excel_generator import save_primary_cache, get_primary_cache

CBO_USER = os.getenv("CBO_USER", "6958BANWARI")
CBO_PASS = os.getenv("CBO_PASS", "6958")
LOGIN_URL = "https://dios.myreporting.net/erp/login"
STREAM_FILE = "/tmp/terminal_stream.log"

def log_stream(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line)
    try:
        with open(STREAM_FILE, "a") as f:
            f.write(line + "\n")
    except Exception:
        pass

def fetch_primary_via_playwright(from_month="Aug-2026", to_month="Aug-2026", fy_year="2026-2027"):
    parts = from_month.split('-')
    m_code = parts[0].upper()[:3]
    month_map = {
        "JAN":"01", "FEB":"02", "MAR":"03", "APR":"04", "MAY":"05", "JUN":"06",
        "JUL":"07", "AUG":"08", "SEP":"09", "OCT":"10", "NOV":"11", "DEC":"12"
    }
    m_num = month_map.get(m_code, "08")
    year = parts[1] if len(parts) > 1 else "2026"
    date_val = f"{m_num}/01/{year}"

    # Check fast cache first
    cached = get_primary_cache(from_month)
    if cached and len(cached) > 0:
        log_stream(f"⚡ [FAST CACHE HIT] Serving {len(cached)} CBO Primary Items for {from_month} in 0.1s!")
        return {
            "success": True,
            "from_month": from_month,
            "to_month": to_month,
            "count": len(cached),
            "total_qty": sum(i["qty"] for i in cached),
            "total_value": sum(i["value"] for i in cached),
            "items": cached
        }

    log_stream("=" * 65)
    log_stream(f"🚀 [LIVE CBO ENGINE] Extracting Real Primary Data for {from_month}...")
    log_stream("=" * 65)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()
            page.set_default_timeout(35000)

            # 1. Login
            log_stream(f"1. Authenticating as {CBO_USER}...")
            page.goto(LOGIN_URL, timeout=50000, wait_until="domcontentloaded")
            page.fill("input[type='text']:visible", CBO_USER)
            page.fill("input[type='password']:visible", CBO_PASS)
            page.locator("button:visible:has-text('Login'), input[type='submit']:visible, .btn-success:visible").first.click()
            page.wait_for_selector("#ej2-menu_1", timeout=35000)
            log_stream("   ✅ Login Successful.")

            # 2. Open Monthly Sales Summary
            log_stream("2. Opening Reports -> Sales & Targets -> Monthly Sales Summary!...")
            page.locator("a:has-text('Reports'), span:has-text('Reports')").first.click()
            page.wait_for_timeout(500)
            page.locator("a:has-text('Sales & Targets'), span:has-text('Sales & Targets')").first.click()
            page.wait_for_timeout(500)
            page.locator("a:has-text('Monthly Sales Summary'), span:has-text('Monthly Sales Summary')").first.click()
            page.wait_for_timeout(3000)

            # 3. Find Report Frame
            report_frame = None
            for curr_page in context.pages:
                for f in curr_page.frames:
                    if "PerformanceReview" in f.url or "Monthly" in f.url:
                        report_frame = f
                        break
                if report_frame:
                    break

            target_frame = report_frame or page.frames[-1]

            # 4. Instant Live Query from Frame WebMethod
            log_stream(f"3. Querying CBO Database ({date_val})...")
            raw_data = target_frame.evaluate('''(dates) => {
                return new Promise(resolve => {
                    fetch('/RPT/PerformanceReview.aspx/GETDATAGRID', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
                        body: JSON.stringify({
                            'LOGIN_PA_ID': '6958', 'GROUPON': 'P', 'WISE': 'P',
                            'FMONTH': dates.date_val, 'TMONTH': dates.date_val, 'COLUMN': 'PRI_QTY,PRI_VAL',
                            'DATEYN': '0', 'GROUPFILTER': '0', 'WISEFILTER': '0', 'TARGET_ID': '0',
                            'LRTYPE': 'V', 'SPL_ID': '0', 'STATE_ID': '0', 'HQ_ID': '0', 'ITEM_ID': '0',
                            'ITEMG_ID': '0', 'ITEM_HR': '0', 'GROUP_COULUMN': 'ITEM_NAME', 'STK_ID': '0',
                            'ITEM_STATUS': '1', 'QTRWISE_TOTALYN': '0', 'HORIZONTALYN': '0', 'BILLYN': '0',
                            'ITEM_HR_ZERO': '0', 'STK_STATUS_P': '0', 'STK_STATUS_S': '0', 'SALE_SHARE': 'H',
                            'iLYSALE_ON_CYTEAM': '1', 'sADD_COL': '', 'iPRI_PERIOD': '0', 'iROUDATA': '0',
                            'iOUTST_PERIOD': '0', 'ITEMG_ID_2': '0', 'ITEMG_ID_3': '0', 'iOUTST_BALANCE': '0',
                            'COMPANY_ID': '0', 'CRM_HQ_GROUP_ID': '0', 'ITEMG_ID_4': '0', 'PARTY_GROUP': '0'
                        })
                    }).then(r => r.json()).then(d => resolve(d)).catch(e => resolve({ error: e.toString() }));
                });
            }''', {'date_val': date_val, 'mCode': m_code})

            browser.close()

            items = []
            if raw_data.get("d"):
                t_obj = json.loads(raw_data["d"])
                for row in t_obj.get("Table", []):
                    p_name = row.get("ITEM_NAME") or row.get("Product") or row.get("ITEM_DESC")
                    qty = row.get(f"Primary_Qty_{m_code}") or row.get("Primary_Qty") or row.get("PRI_QTY") or 0
                    val = row.get(f"Primary_Value_{m_code}") or row.get("Primary_Value") or row.get("PRI_VAL") or 0
                    
                    if p_name and str(p_name).strip() != "UDAIPUR":
                        try:
                            q_num = float(qty)
                            v_num = float(val) if val else 0.0
                            if q_num != 0 or v_num != 0:
                                items.append({
                                    "name": str(p_name).strip(),
                                    "qty": q_num,
                                    "value": v_num
                                })
                        except (ValueError, TypeError):
                            pass

            total_qty = sum(it["qty"] for it in items)
            total_val = sum(it["value"] for it in items)

            if items:
                save_primary_cache(items, from_month)

            log_stream(f"\n🎉 [CBO DATA LOADED] Extracted {len(items)} Items! (Total Qty: {total_qty})")
            return {
                "success": True,
                "from_month": from_month,
                "to_month": to_month,
                "count": len(items),
                "total_qty": total_qty,
                "total_value": total_val,
                "items": items
            }

    except Exception as e:
        log_stream(f"❌ Error: {str(e)}")
        return {"success": False, "error": str(e), "items": []}
