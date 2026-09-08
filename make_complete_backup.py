import os
import zipfile

current_dir = os.getcwd()
output_filename = os.path.join(current_dir, 'dios_complete_project_backup.zip')
exclude_dirs = {'node_modules'}
exclude_exts = {'.zip'}

print("==========================================================================")
print("📦 PACKING 100% OF PROJECT FILES (INCLUDING .env & KEYS)...")
print("==========================================================================")

file_count = 0
with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(current_dir):
        # Exclude node_modules to keep size clean, keep everything else (.env, .cloudflare_key, git, etc.)
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            full_path = os.path.join(root, file)
            if os.path.abspath(full_path) == os.path.abspath(output_filename):
                continue
            
            rel_path = os.path.relpath(full_path, current_dir)
            try:
                zipf.write(full_path, rel_path)
                file_count += 1
                print(f"   + Packed: {rel_path}")
            except Exception as e:
                print(f"   - Skipped {rel_path}: {e}")

print("==========================================================================")
print(f"🎉 100% COMPLETE BACKUP CREATED SUCCESSFULLY!")
print(f"📁 File Location: {output_filename}")
print(f"📊 Total Files Packed: {file_count}")
print("==========================================================================")
