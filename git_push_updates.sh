#!/bin/bash
set -e

echo "=========================================================================="
echo "🛡️ [SAFE GITHUB PUSH] COMMITTING & PUSHING PARTYWISE UPDATES TO GITHUB..."
echo "=========================================================================="

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

# 1. Update .gitignore to protect all sensitive keys & temp files
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

echo "✅ 1. .gitignore verified (All credentials protected)."

# 2. Stage all updated codebase files
git add -A

# 3. Explicitly unstage any accidental key/secret files
git reset -- deploy_and_run_august.sh run_all_fixed.sh .env .cloudflare_key deploy.sh cbo_session.json cbo_device.json *.log *.zip 2>/dev/null || true

# 4. Commit changes
if git diff --cached --quiet; then
    echo "ℹ️ No new changes to commit. Working tree is already clean."
else
    TIMESTAMP=$(date +'%Y-%m-%d %H:%M:%S')
    git commit -m "feat: Universal Dual-Invariant Dwarika PDF Parser & Direct CSV Exporter ($TIMESTAMP)"
    echo "✅ 2. Changes committed successfully."

    # 5. Push to GitHub
    echo "🌐 3. Pushing to GitHub (Branch: $CURRENT_BRANCH)..."
    git push origin "$CURRENT_BRANCH"
    echo "🎉 4. Successfully pushed all updates to GitHub!"
fi

echo ""
echo "=========================================================================="
echo "📊 CURRENT GIT REPO STATUS:"
echo "=========================================================================="
git status -s
echo "=========================================================================="
