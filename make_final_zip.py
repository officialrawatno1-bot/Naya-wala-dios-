import os, zipfile, time

current_dir = os.getcwd()
zip_filename = os.path.join(current_dir, "dios_project_backup.zip")

# Remove previous zip if present to create a fresh one
if os.path.exists(zip_filename):
    try:
        os.remove(zip_filename)
    except Exception:
        pass

exclude_dirs = {
    "node_modules", ".git", "dist", ".wrangler", 
    "__pycache__", ".pytest_cache", ".devcontainer"
}
exclude_exts = {".zip", ".log", ".pyc"}

print("=" * 75)
print("📦 [DIOS PROJECT ZIP ENGINE] PACKING COMPLETE CODEBASE...")
print("=" * 75)

file_count = 0
start_time = time.time()

with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(current_dir):
        # Filter out heavy directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        for file in files:
            if any(file.endswith(ext) for ext in exclude_exts):
                continue
            if file == "dios_project_backup.zip":
                continue

            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, current_dir)

            try:
                zipf.write(full_path, rel_path)
                file_count += 1
            except Exception:
                pass

elapsed = time.time() - start_time
file_size_mb = os.path.getsize(zip_filename) / (1024 * 1024)

print("-" * 75)
print(f"🎉 ZIP CREATED SUCCESSFULLY in {elapsed:.2f}s!")
print(f"📁 Zip File Name : dios_project_backup.zip")
print(f"📊 Total Files   : {file_count} clean source files packed")
print(f"💾 File Size     : {file_size_mb:.2f} MB")
print("=" * 75)
print("📱 iPad par download karne ke liye:")
print("   Left side Explorer me 'dios_project_backup.zip' par tap/hold karein")
print("   aur 'Download...' par click karein!")
print("=" * 75)
