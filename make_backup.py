import os
import zipfile

output_filename = '/workspaces/Dios/dios_project_backup.zip'
exclude_dirs = {'node_modules', '.git', 'dist', '.wrangler', '__pycache__', '.pytest_cache'}
exclude_exts = {'.log', '.zip'}

print("==========================================================================")
print("📦 CREATING PROJECT BACKUP ZIP (Excluding node_modules & git)...")
print("==========================================================================")

file_count = 0
with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('/workspaces/Dios'):
        # Skip heavy unnecessary directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            if any(file.endswith(ext) for ext in exclude_exts):
                continue
            if file == 'dios_project_backup.zip':
                continue
            
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, '/workspaces/Dios')
            zipf.write(full_path, rel_path)
            file_count += 1
            print(f"   + Added: {rel_path}")

print("==========================================================================")
print(f"🎉 BACKEND BACKUP CREATED SUCCESSFULLY!")
print(f"📁 File Location: {output_filename}")
print(f"📊 Total Files Packed: {file_count}")
print("==========================================================================")
