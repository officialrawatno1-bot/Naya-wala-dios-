import requests
import json
import time

KV_NAMESPACE_ID = "287bbf337a0746758bd49885a96e79bc"
BASE_URL = "https://dios-hub.pages.dev/api/cloud-storage"
TOTAL_QUOTA_MB = 1024.0  # Cloudflare KV standard quota (1 GB = 1024 MB)

print("=" * 70)
print("☁️ [CLOUDFLARE KV STORAGE INSPECTOR] CHECKING DIOS_STORAGE...")
print("=" * 70)
print(f"📌 KV Namespace ID : {KV_NAMESPACE_ID}")
print(f"🌐 Cloudflare URL   : {BASE_URL}\n")

try:
    # 1. Fetch all keys in KV
    res = requests.get(f"{BASE_URL}?action=list&t={int(time.time()*1000)}", timeout=15)
    if res.status_code != 200:
        print(f"❌ Error fetching KV list: HTTP {res.status_code}")
        print(res.text)
        exit(1)

    data = res.json()
    keys_list = data.get("keys", [])

    print(f"📦 Total Stored Keys Found: {len(keys_list)}\n")
    print("-" * 70)
    print(f"{'S.N.':<5} {'KEY NAME':<45} {'SIZE':<12}")
    print("-" * 70)

    total_bytes = 0
    categories = {}

    for idx, k in enumerate(keys_list, start=1):
        k_name = k.get("name") if isinstance(k, dict) else str(k)
        
        # Fetch each key size
        val_res = requests.get(f"{BASE_URL}?key={k_name}&t={int(time.time()*1000)}", timeout=10)
        size_bytes = len(val_res.content)
        total_bytes += size_bytes

        # Group by category (review, campaigns, statements, backups, etc.)
        cat = k_name.split('/')[0] if '/' in k_name else 'other'
        categories[cat] = categories.get(cat, 0) + size_bytes

        size_kb = size_bytes / 1024.0
        size_str = f"{size_kb:.2f} KB" if size_kb >= 1 else f"{size_bytes} B"
        print(f"{idx:<5} {k_name:<45} {size_str:<12}")

    total_kb = total_bytes / 1024.0
    total_mb = total_kb / 1024.0
    remaining_mb = TOTAL_QUOTA_MB - total_mb
    used_pct = (total_mb / TOTAL_QUOTA_MB) * 100.0
    free_pct = 100.0 - used_pct

    print("-" * 70)
    print("\n📊 CATEGORY-WISE BREAKDOWN:")
    for cat, b_size in categories.items():
        print(f"   • {cat.upper():<15} : {b_size/1024.0:8.2f} KB")

    print("\n" + "=" * 70)
    print("📈 FINAL STORAGE SUMMARY:")
    print("=" * 70)
    print(f"🔹 Total Allowed Quota    : {TOTAL_QUOTA_MB:.2f} MB (1.00 GB)")
    print(f"🔸 Total Space Used       : {total_mb:.4f} MB ({total_kb:.2f} KB) [{used_pct:.3f}%]")
    print(f"✅ Total Free Space Left  : {remaining_mb:.2f} MB ({free_pct:.2f}% FREE)")
    print("=" * 70)
    
    if remaining_mb > 900:
        print("🎉 STORAGE STATUS: EXCELLENT! 99%+ Space Khali Hai, Lakhon Sheets ka Data Save ho sakta hai.")
    print("=" * 70)

except Exception as e:
    print(f"❌ Inspection Error: {str(e)}")
