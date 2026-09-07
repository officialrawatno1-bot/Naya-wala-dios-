import os, re, json, requests

CBO_USER = "6958BANWARI"
CBO_PASS = "6958"
FROM_MONTH = "Aug-2026"
FY_YEAR = "2026-2027"

def run_test():
    print(f"[*] Connecting to CBO ERP for {FROM_MONTH}...")
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })

    # 1. Login Page
    print("[1] Opening Login.aspx...")
    r1 = session.get("https://dios.myreporting.net/Login.aspx", timeout=25)
    
    vs = re.search(r'name="__VIEWSTATE"[^>]*value="([^"]*)"', r1.text, re.I)
    vsg = re.search(r'name="__VIEWSTATEGENERATOR"[^>]*value="([^"]*)"', r1.text, re.I)
    ev = re.search(r'name="__EVENTVALIDATION"[^>]*value="([^"]*)"', r1.text, re.I)

    if not vs:
        print("[-] Error: Viewstate not found!")
        return

    print("[2] Authenticating (6958BANWARI)...")
    payload = {
        "__VIEWSTATE": vs.group(1),
        "__VIEWSTATEGENERATOR": vsg.group(1) if vsg else "",
        "__EVENTVALIDATION": ev.group(1) if ev else "",
        "txtUserName": CBO_USER,
        "txtPassword": CBO_PASS,
        "btnLogin": "Login"
    }
    r2 = session.post("https://dios.myreporting.net/Login.aspx", data=payload, timeout=25, allow_redirects=True)
    print(f"    Login HTTP Status: {r2.status_code}")

    # 2. Report Grid
    print("[3] Querying Primary Sales Grid for August 2026...")
    report_url = f"https://dios.myreporting.net/RPT/PerformanceReview.aspx?format=Primary%20Sales&wise=P&DOC_TYPE=SS&RPT_HEADER=Monthly%20Sales-Summary&CBOYN=Y&FY_YEAR={FY_YEAR}&COMPANY_CODE=DIOS&PA_ID=6958&DESIG_ID=1&DESIG=BE&PA_NAME=BANWARI%20LAL%20MEENA&HEAD_QTR=UDAIPUR&DIVISION_NAME=DIOS%20GROUP&FMCGYN=N&MENU_STYLE=NONE&ACTION_FROM=ANDROID&LOGIN_PA_ID=6958&LOGIN_COMPANY_ID=1"
    session.get(report_url, timeout=25)

    grid_payload = {
        'LOGIN_PA_ID': '6958', 'GROUPON': 'null', 'WISE': 'null',
        'FMONTH': '08/01/2026', 'TMONTH': '08/01/2026', 'COLUMN': 'PRI_QTY,PRI_VAL',
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
        "Content-Type": "application/json; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": report_url
    }
    session.post("https://dios.myreporting.net/RPT/PerformanceReview.aspx/GETDATAGRID", json=grid_payload, headers=ajax_headers, timeout=25)

    # 3. Items Extraction
    r5 = session.post("https://dios.myreporting.net/RPT/PerformanceReview.aspx/GETGROUPEDBYDATAGRID_1", json={'GROUPCOLUMN': 'ITEM_NAME'}, headers=ajax_headers, timeout=25)
    raw_d = r5.json().get('d', '')
    
    if not raw_d:
        print("[-] CBO returned empty data table!")
        return

    table_obj = json.loads(raw_d)
    rows = table_obj.get('Table', [])

    items = []
    for row in rows:
        p_name = row.get('ITEM_NAME') or row.get('Product') or row.get('ITEM_DESC') or ''
        qty = row.get('Primary_Qty_AUG') or row.get('Primary_Qty') or row.get('PRI_QTY') or 0
        val = row.get('Primary_Value_AUG') or row.get('Primary_Value') or row.get('PRI_VAL') or 0
        if p_name and float(qty) > 0:
            items.append({"name": p_name, "qty": float(qty), "value": float(val)})

    print(f"\n🎉 TEST RESULT: SUCCESS!")
    print(f"📦 Total Products Found: {len(items)}")
    print(f"📊 Total Quantity: {sum(it['qty'] for it in items)} Units\n")
    print("[+] First 5 Extracted Products:")
    for it in items[:5]:
        print(f"    👉 {it['name']}: {it['qty']} Units (₹{it['value']})")

if __name__ == '__main__':
    run_test()
