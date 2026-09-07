#!/bin/bash
set -e

# Unset token to prevent OAuth/Token conflicts
unset CLOUDFLARE_API_TOKEN 2>/dev/null || true

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "🚀 1. Building Vite project..."
npm run build

echo "☁️ 2. Deploying to Cloudflare Production..."
npx wrangler pages deploy dist --project-name=dios-hub --branch=main --commit-dirty=true

echo ""
echo "========================================================"
echo "✅ DEPLOYMENT FINISHED SUCCESSFULLY!"
echo "🌐 LIVE URL: https://dios-hub.pages.dev"
echo "========================================================"
