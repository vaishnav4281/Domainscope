#!/bin/bash

# Exit on error
set -e

echo "🚀 Deploying DomainScope..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install Dependencies & Build
echo "📦 Installing dependencies and building..."
npm ci
cd backend
npm ci
npm run build
npx prisma migrate deploy
cd ..
npm run build

# Restart PM2
echo "🔄 Restarting Application..."
pm2 reload ecosystem.config.cjs --env production

echo "✅ Deployment Complete!"
