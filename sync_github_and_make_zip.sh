#!/bin/bash
set -e

echo "=========================================================================="
echo "🛡️ 1. SECURING KEYS & PUSHING ENTIRE PROJECT TO GITHUB..."
echo "=========================================================================="

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

# A. Ensure .gitignore excludes all secrets & keys
cat << 'GIGNO' > .gitignore
node_modules/
dist/
.env
.env.*
.cloudflare_key
*.key
*.pem
deploy.sh
deploy_and_run_august.sh
run_all_fixed.sh
cbo_session.json
cbo_device.json
complete_project_code.txt
src_code.txt
*.log
*.zip
.wrangler/
__pycache__/
*.pyc
GIGNO

echo "✅ .gitignore updated to protect all credentials and global keys."

# B. Stage all modified and new project files
git add -A

# C. Explicitly unstage any sensitive files
git reset -- deploy_and_run_august.sh run_all_fixed.sh .env .cloudflare_key deploy.sh cbo_session.json cbo_device.json *.log *.zip 2>/dev/null || true

# D. Commit & Push
if git diff --cached --quiet; then
    echo "ℹ️ Git working tree is already clean / up to date."
else
    TIMESTAMP=$(date +'%Y-%m-%d %H:%M:%S')
    git commit -m "feat: Full Expense module with Freeze Pane, Smart Other Exp, Doctor Search & A4 PDF ($TIMESTAMP)"
    echo "🌐 Pushing to GitHub (Branch: $CURRENT_BRANCH)..."
    git push origin "$CURRENT_BRANCH"
    echo "🎉 Successfully pushed all project updates to GitHub!"
fi

echo ""
echo "=========================================================================="
echo "📦 2. CREATING COMPLETE PROJECT BACKUP ZIP..."
echo "=========================================================================="

python3 - << 'PYEOF'
import os, zipfile, time

current_dir = os.getcwd()
zip_filename = os.path.join(current_dir, "dios_project_backup.zip")

# Remove previous zip if present to build fresh
if os.path.exists(zip_filename):
    os.remove(zip_filename)

exclude_dirs = {"node_modules", ".git", "dist", ".wrangler", "__pycache__", ".pytest_cache"}
exclude_exts = {".zip", ".log"}

file_count = 0
start_time = time.time()

with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(current_dir):
        # Exclude heavy folders
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
print(f"🎉 PROJECT ZIP READY in {elapsed:.1f}s!")
print(f"📁 Zip File Name : {zip_filename}")
print(f"📊 Total Files   : {file_count} files packed")
print(f"💾 File Size     : {file_size_mb:.2f} MB")
print("=" * 75)
PYEOF

echo ""
echo "=========================================================================="
echo "🎉 ALL TASKS COMPLETED SUCCESSFULLY!"
echo "=========================================================================="
echo "1. GitHub: Poora project (16 Sheets, Aggregator, Expense Module) updated."
echo "2. ZIP   : 'dios_project_backup.zip' taiyar hai."
echo "   📱 iPad me download karne ke liye: Left Explorer me file par hold karein"
echo "      aur 'Download...' select karein!"
echo "=========================================================================="
