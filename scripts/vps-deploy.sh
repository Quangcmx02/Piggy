#!/usr/bin/env bash
# vps-deploy.sh — Deploy script cho VPS
set -euo pipefail

echo "🚀 Deploying Piggy to VPS..."
cd "$(dirname "$0")/.."

# Dùng .env.vps nếu tồn tại
if [ -f ".env.vps" ]; then
    cp .env.vps .env
    echo "✅ Using VPS environment config"
fi

# Pull latest code
git pull origin main

# Build và restart full stack
docker-compose -f infrastructure/docker/docker-compose.yml pull
docker-compose -f infrastructure/docker/docker-compose.yml up -d --remove-orphans

# Cleanup old images
docker image prune -f

echo "✅ Deployment complete! App running on port 80"
