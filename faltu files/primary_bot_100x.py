import os, sys, time, json, re, requests
from bs4 import BeautifulSoup

CBO_USER = os.getenv("CBO_USER", "6958BANWARI")
CBO_PASS = os.getenv("CBO_PASS", "6958")
BASE_URL = "https://dios.myreporting.net"
STREAM_FILE = "/tmp/terminal_stream.log"

def log_stream(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line)
    try:
        with open(STREAM_FILE, "a") as f:
            f.write(line + "\n")
    except Exception:
        pass

# 🌟 EXACT REPLICA OF Code.gs updateCookies() FUNCTION
def update_cookies(resp_headers, existing_cookie_str):
    jar = {}
    if existing_cookie_str:
        for c in existing_cookie_str.split(';'):
            p = c.strip().split('=', 1)
            if p[0]:
                jar[p[0].strip()] = p[1].strip() if len(p) > 1 else ""

    # Check raw Set-Cookie headers
    raw_cookies = resp_headers.get('set-cookie', '')
    if raw_cookies:
        for cookie_str in raw_cookies.split(','):
            first = cookie_str.split(';')[0].strip()
            if '=' in first:
                parts = first.split('=', 1)
                jar[parts[0].strip()] = parts[1].strip()

    return "; ".join([f"{k}={v}" for k, v in jar.items()])

def fetch_primary_100x(from_month="Aug-2026", fy_year="2026-2027"):
    log_stream("=" * 65)
    log_stream(f"🤖 [100x DEEP BOT] FETCHING CBO PRIMARY FOR {from_month}")
    log_stream("=" * 65)

    month_map = {
        "JAN":"01", "FEB":"02", "MAR":"03", "APR":"04", "MAY":"05", "JUN":"06",
        "JUL":"07", "AUG":"08", "SEP":"09", "OCT":"10", "NOV":"11", "DEC":"12"
    }
    m_code = from_month.split('-')[0].upper()[:3]
    m_num = month_map.get(m_code, "08")
    year = from_month.split('-')[1] if '-' in from_month else "2026"
    date_val = f"{m_num}/01/{year}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "*/*"
    }

    try:
        # Step 1: GET Login.aspx
        log_stream(f"1. GET {BASE_URL}/Login.aspx...")
        r1 = requests.get(f"{BASE_URL}/Login.aspx", headers=headers, timeout=30)
        cookie_str = update_cookies(r1.headers, "")
        
        soup = BeautifulSoup(r1.text, "html.parser")
        vs = soup.find("input", {"id": "__VIEWSTATE"})
        vsg = soup.find("input", {"id": "__VIEWSTATEGENERATOR"})
        ev = soup.find("input", {"id": "__EVENTVALIDATION"})

        # Step 2: POST Login.aspx
        login_params = {
            "__VIEWSTATE": vs["value"] if vs else "",
            "__VIEWSTATEGENERATOR": vsg["value"] if vsg else "",
            "__EVENTVALIDATION": ev["value"] if ev else "",
            "txtUserName": CBO_USER,
            "txtPassword": CBO_PASS,
            "btnLogin": "Login"
        }
        log_stream(f"2. POST Login as {CBO_USER}...")
        headers["Cookie"] = cookie_str
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        
        r2 = requests.post(f"{BASE_URL}/Login.aspx", data=login_params, headers=headers, timeout=30, allow_redirects=False)
        cookie_str = update_cookies(r2.headers, cookie_str)
        log_stream(f"   Auth Status: {r2.status_code}")

        # Step 3: GET PerformanceReview.aspx
        report_url = (
            f"{BASE_URL}/RPT/PerformanceReview.aspx?format=Primary%20Sales&wise=P&DOC_TYPE=SS"
            f"&RPT_HEADER=Monthly%20Sales-Summary&CBOYN=Y&FY_YEAR={fy_year}&COMPANY_CODE=DIOS"
            f"&PA_ID=6958&DESIG_ID=1&DESIG=BE&PA_NAME=BANWARI%20LAL%20MEENA&HEAD_QTR=UDAIPUR"
            f"&DIVISION_NAME=DIOS%20GROUP&FMCGYN=N&MENU_STYLE=NONE&ACTION_FROM=ANDROID&LOGIN_PA_ID=6958&LOGIN_COMPANY_ID=1"
        )
        log_stream("3. Initializing PerformanceReview.aspx Session...")
        headers["Cookie"] = cookie_str
        headers["Referer"] = report_url
        
        r3 = requests.get(report_url, headers=headers, timeout=30)
        cookie_str = update_cookies(r3.headers, cookie_str)

        # Step 4: POST GETDATAGRID
        log_stream(f"4. Calling GETDATAGRID ({date_val})...")
        grid_payload = {
            'LOGIN_PA_ID': '6958', 'GROUPON': 'null', 'WISE': 'null',
            'FMONTH': date_val, 'TMONTH': date_val, 'COLUMN': 'PRI_QTY,PRI_VAL',
            'DATEYN': '0', 'GROUPFILTER': '0', 'WISEFILTER': '0', 'TARGET_ID': '0',
            'LRTYPE': 'V', 'SPL_ID': '0', 'STATE_ID': '0', 'HQ_ID': '0', 'ITEM_ID': '0',
            'ITEMG_ID': '0', 'ITEM_HR': '0', 'GROUP_COULUMN': '', 'STK_ID': '0',
            'ITEM_STATUS': '1', 'QTRWISE_TOTALYN': '0', 'HORIZONTALYN': '0', 'BILLYN': '0',
            'ITEM_HR_ZERO': '0', 'STK_STATUS_P': '0', 'STK_STATUS_S': '0', 'SALE_SHARE': 'H',
            'iLYSALE_ON_CYTEAM': '1', 'sADD_COL': '', 'iPRI_PERIOD': '0', 'iROUDATA': '0',
            'iOUTST_PERIOD': '0', 'ITEMG_ID_2': '0', 'ITEMG_ID_3': '0', 'iOUTST_BALANCE': '0',
            'COMPANY_ID': '0', 'CRM_HQ_GROUP_ID': '0', 'ITEMG_ID_4': '0', 'PARTY_GROUP': '0'
        }

        ajax_headers = {
            "Cookie": cookie_str,
            "Content-Type": "application/json; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": report_url
        }

        r4 = requests.post(f"{BASE_URL}/RPT/PerformanceReview.aspx/GETDATAGRID", json=grid_payload, headers=ajax_headers, timeout=30)
        # 🌟 EXACT Code.gs LINE 194 FIX: Update cookie string after Step 4!
        cookie_str = update_cookies(r4.headers, cookie_str)
        ajax_headers["Cookie"] = cookie_str
        log_stream(f"   GETDATAGRID Status: {r4.status_code}")

        # Step 5: POST GETGROUPEDBYDATAGRID_1
        log_stream("5. Calling GETGROUPEDBYDATAGRID_1...")
        r5 = requests.post(f"{BASE_URL}/RPT/PerformanceReview.aspx/GETGROUPEDBYDATAGRID_1", json={'GROUPCOLUMN': 'ITEM_NAME'}, headers=ajax_headers, timeout=30)
        log_stream(f"   GETGROUPEDBYDATAGRID_1 Status: {r5.status_code}")

        items = []
        raw_res = r5.json()
        raw_d = raw_res.get("d") or ""

        # Fallback: check r4 if r5 is string
        if not raw_d and r4.status_code == 200:
            raw_d = r4.json().get("d") or ""

        if raw_d:
            table_obj = json.loads(raw_d)
            rows = table_obj.get("Table", [])
            for row in rows:
                p_name = row.get("ITEM_NAME") or row.get("Product") or row.get("ITEM_DESC") or ""
                qty_key = f"Primary_Qty_{m_code}"
                val_key = f"Primary_Value_{m_code}"
                qty = row.get(qty_key) or row.get("Primary_Qty") or row.get("PRI_QTY") or 0
                val = row.get(val_key) or row.get("Primary_Value") or row.get("PRI_VAL") or 0
                if p_name and str(p_name).strip() != "UDAIPUR":
                    items.append({"name": str(p_name).strip(), "qty": float(qty), "value": float(val)})

        total_qty = sum(it["qty"] for it in items)
        total_val = sum(it["value"] for it in items)

        log_stream(f"\n🎉 [SUCCESS] Extracted {len(items)} Products! (Total Primary Qty: {total_qty})")

        if items:
            log_stream("\n📦 LIVE EXTRACTED PRODUCTS FOR AUGUST 2026:")
            for it in items[:15]:
                log_stream(f"   • {it['name']}: {it['qty']} Qty (₹{it['value']})")

        return {
            "success": True,
            "count": len(items),
            "total_qty": total_qty,
            "total_value": total_val,
            "items": items
        }

    except Exception as e:
        log_stream(f"❌ Error: {str(e)}")
        return {"success": False, "error": str(e), "items": []}

if __name__ == "__main__":
    fetch_primary_100x("Aug-2026")
