import os, io, json, openpyxl

CACHE_DIR = "/tmp"

def get_primary_cache(month="Aug-2026"):
    m_code = month.split('-')[0].upper()[:3]
    cache_file = f"{CACHE_DIR}/cbo_primary_cache_{m_code}.json"
    if os.path.exists(cache_file):
        try:
            with open(cache_file, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return None

def save_primary_cache(items, month="Aug-2026"):
    m_code = month.split('-')[0].upper()[:3]
    cache_file = f"{CACHE_DIR}/cbo_primary_cache_{m_code}.json"
    try:
        with open(cache_file, "w") as f:
            json.dump(items, f)
    except Exception:
        pass

def build_cbo_primary_excel_blob(items, from_month="Aug-2026"):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Monthly Sales Summary"

    # Exact CBO Primary Headers that src/parsers/primaryParser.ts reads
    ws.append(["SRNO", "PRODUCT DESCRIPTION", "PRIMARY QTY", "PRIMARY VALUE", "HEAD QTR"])

    for idx, item in enumerate(items, start=1):
        ws.append([
            idx,
            item.get("name", ""),
            float(item.get("qty", 0)),
            float(item.get("value", 0)),
            "UDAIPUR"
        ])

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return stream.getvalue()
