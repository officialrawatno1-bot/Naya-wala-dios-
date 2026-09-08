#!/bin/bash
set -e

echo "=========================================================================="
echo "🛡️ [SAFE PUSH] KEEPING LOCAL SCRIPTS INTACT & PUSHING REST TO GITHUB..."
echo "=========================================================================="

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

# 1. Soft Reset back to GitHub's last known state (Files are NOT deleted, they stay 100% on disk)
git reset --soft origin/"$CURRENT_BRANCH" 2>/dev/null || git reset --soft HEAD~1

# 2. Update .gitignore so git ignores the files with keys
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

echo "✅ 1. Files kept safe on disk & added to ignore list."

# 3. Stage all other project files
git add -A

# 4. Explicitly ensure secret files are not in the git stage
git reset -- deploy_and_run_august.sh run_all_fixed.sh .env .cloudflare_key deploy.sh cbo_session.json cbo_device.json *.log *.zip 2>/dev/null || true

# 5. Commit all updated project files
TIMESTAMP=$(date +'%Y-%m-%d %H:%M:%S')
git commit -m "feat: Updated project files, components and review sheets ($TIMESTAMP)"

# 6. Push to GitHub
echo "🌐 2. Pushing to GitHub ($CURRENT_BRANCH)..."
git push origin "$CURRENT_BRANCH"

echo ""
echo "=========================================================================="
echo "🎉 SUCCESS: GITHUB IS FULLY UPDATED! (No local files were deleted)"
echo "=========================================================================="
git status -s
