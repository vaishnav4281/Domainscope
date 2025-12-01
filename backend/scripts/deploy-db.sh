#!/bin/bash
set -e

echo "🔧 Running database deployment script..."

# Apply database migrations
echo "📦 Pushing schema to database..."
npx prisma db push --accept-data-loss --skip-generate

# Generate Prisma Client
echo "🔨 Generating Prisma Client..."
npx prisma generate

echo "✅ Database deployment complete!"
