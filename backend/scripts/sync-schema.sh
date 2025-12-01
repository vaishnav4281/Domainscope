#!/bin/bash
set -e

echo "🧹 Cleaning up duplicate columns in database..."

# Run cleanup SQL if file exists
if [ -f "prisma/migrations/cleanup_duplicate_columns.sql" ]; then
    echo "Executing cleanup query..."
    PGPASSWORD="${DATABASE_URL##*:}" psql "${DATABASE_URL}" -f prisma/migrations/cleanup_duplicate_columns.sql || echo "Cleanup SQL may have failed, continuing..."
fi

echo "🔧 Running prisma db push..."
npx prisma db push --accept-data-loss --skip-generate

echo "✅ Database schema synchronized!"
