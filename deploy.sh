#!/bin/bash
set -e

echo "🚀 1. Building Vite project..."
npm run build

echo "☁️ 2. Deploying to Cloudflare Pages Production..."
npx wrangler pages deploy dist --project-name=dios-hub --branch=main --commit-dirty=true

echo ""
echo "========================================================"
echo "✅ DEPLOYMENT FINISHED SUCCESSFULLY!"
echo "🌐 LIVE URL: https://dios-hub.pages.dev"
echo "========================================================"
