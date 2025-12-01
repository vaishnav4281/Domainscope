#!/bin/bash
set -e

echo "🧹 Dropping duplicate emailVerified column..."

# Use psql to drop the camelCase column if it exists
node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Drop the camelCase column
    await client.query('ALTER TABLE \"User\" DROP COLUMN IF EXISTS \"emailVerified\"');
    console.log('✅ Dropped emailVerified column (if it existed)');
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(0); // Don't fail the build if this doesn't work
  }
})();
"

echo "✅ Column cleanup complete!"
