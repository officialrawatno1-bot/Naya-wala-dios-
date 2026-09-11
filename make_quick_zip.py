import os, zipfile, time

current_dir = os.getcwd()
zip_filename = os.path.join(current_dir, "dios_complete_project.zip")

# Pehle se koi purani zip ho to use hata dein
if os.path.exists(zip_filename):
    os.remove(zip_filename)

# In heavy folders/files ko zip me nahi daalna hai
exclude_dirs = {"node_modules", ".git", "dist", ".wrangler", "__pycache__", ".pytest_cache"}
exclude_exts = {".zip", ".log"}

print("==========================================================================")
print("📦 PACKING COMPLETE DIOS PROJECT (Clean Backup)...")
print("==========================================================================")

file_count = 0
start_time = time.time()

with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(current_dir):
        # Exclude heavy folders
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        for file in files:
            # Skip logs aur existing zips
            if any(file.endswith(ext) for ext in exclude_exts):
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
print(f"📁 Zip File Name : dios_complete_project.zip")
print(f"📊 Total Files   : {file_count} files packed")
print(f"💾 File Size     : {file_size_mb:.2f} MB")
print("=" * 75)
print("📱 iPad par download karne ke liye:")
print("   Left side ke Explorer (Files list) mein 'dios_complete_project.zip' par")
print("   tap & hold karein aur 'Download' par click karein!")
print("==========================================================================")
