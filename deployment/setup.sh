#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting DomainScope Setup for KSDC..."

# Check Node.js version
NODE_VERSION=$(node -v)
echo "📦 Node.js Version: $NODE_VERSION"

# Install Global Dependencies
echo "🛠️ Installing global dependencies (PM2)..."
npm install -g pm2

# Install Root Dependencies
echo "📦 Installing root dependencies..."
npm ci

# Backend Setup
echo "🔧 Setting up Backend..."
cd backend
npm ci
echo "🏗️ Building Backend..."
npm run build
npx prisma generate
cd ..

# Frontend Setup
echo "🎨 Setting up Frontend..."
# Assuming frontend is in the root or a 'frontend' dir. Based on file list, it seems root has vite config.
# But wait, the root package.json has "dev": "vite", so root IS frontend?
# Let's check if there is a separate frontend dir. The file list showed 'vite.config.ts' in root.
# So root is frontend.
echo "🏗️ Building Frontend..."
npm run build
echo "✅ Frontend Build Complete. Dist folder is ready."

# Create Logs Directory
mkdir -p logs

echo "✅ Setup Complete! Run './deployment/deploy.sh' to start the application."
