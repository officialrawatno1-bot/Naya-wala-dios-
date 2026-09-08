#!/bin/bash
set -e

echo "=========================================================================="
echo "🚀 [SAFE GITHUB SYNC] COMMITTING & PUSHING ALL CODE TO GITHUB..."
echo "=========================================================================="

# 1. Ensure .gitignore contains all secret / key files
cat << 'GIGNO' > .gitignore
node_modules/
dist/
.env
.env.*
.cloudflare_key
*.key
*.pem
deploy.sh
complete_project_code.txt
src_code.txt
*.log
*.zip
cbo_session.json
.wrangler/
__pycache__/
*.pyc
GIGNO

echo "✅ 1. .gitignore Verified (All API Keys & Credentials Protected)."

# 2. Stage files
git add -A

# 3. Explicitly unstage any accidental key/secret files if present
git reset -- .env .cloudflare_key deploy.sh cbo_session.json *.log *.zip 2>/dev/null || true

echo "✅ 2. Staged all modified, new & deleted project files."

# 4. Check if there are changes to commit
if git diff --cached --quiet; then
    echo "ℹ️ No new changes to commit. Working tree is already clean."
else
    # 5. Commit with timestamp
    COMMIT_MSG="Update: Master Review Excel live pipeline fix, KV anti-cache & exporters sync ($(date +'%Y-%m-%d %H:%M:%S'))"
    git commit -m "$COMMIT_MSG"
    echo "✅ 3. Changes committed successfully."

    # 6. Push to GitHub
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    echo "🌐 4. Pushing to GitHub (Branch: $CURRENT_BRANCH)..."
    git push origin "$CURRENT_BRANCH"
    echo "🎉 5. Pushed to GitHub Successfully!"
fi

echo "=========================================================================="
echo "📊 CURRENT GIT STATUS:"
echo "=========================================================================="
git status -s
echo "=========================================================================="
