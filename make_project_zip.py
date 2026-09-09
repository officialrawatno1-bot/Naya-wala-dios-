import os, zipfile, time

current_dir = os.getcwd()
zip_filename = os.path.join(current_dir, "dios_project_backup.zip")

# Remove previous zip if present to create a fresh one
if os.path.exists(zip_filename):
    os.remove(zip_filename)

# 🛑 Heavy / Useless folders and extensions to exclude
exclude_dirs = {"node_modules", ".git", "dist", ".wrangler", "__pycache__", ".pytest_cache"}
exclude_exts = {".zip", ".log"}

print("==========================================================================")
print("📦 [PROJECT ZIP GENERATOR] PACKING COMPLETE DIOS PROJECT...")
print("==========================================================================")

file_count = 0
start_time = time.time()

with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(current_dir):
        # Modify dirs in-place to skip excluded directories
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
            except Exception as e:
                pass

elapsed = time.time() - start_time
file_size_mb = os.path.getsize(zip_filename) / (1024 * 1024)

print("-" * 75)
print(f"🎉 ZIP CREATED SUCCESSFULLY in {elapsed:.1f}s!")
print(f"📁 Zip File Name : {zip_filename}")
print(f"📊 Total Files   : {file_count} files packed")
print(f"💾 File Size     : {file_size_mb:.2f} MB")
print("=" * 75)
print("📱 iPad par download karne ke liye:")
print("   Left side ke File Explorer mein 'dios_project_backup.zip' par tap/hold karein")
print("   aur 'Download...' par click karein!")
print("==========================================================================")
