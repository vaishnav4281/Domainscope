#!/bin/bash

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"
RETENTION_DAYS=30

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Load env vars from backend/.env if present
if [ -f ./backend/.env ]; then
    export $(cat ./backend/.env | grep -v '#' | awk '/=/ {print $1}')
fi

echo "📦 Starting Database Backup..."
echo "Target: $BACKUP_FILE"

# Perform Backup
# Note: Requires pg_dump to be installed on the system
if PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -F c -b -v -f "$BACKUP_FILE"; then
    echo "✅ Backup Successful!"
else
    echo "❌ Backup Failed!"
    exit 1
fi

# Cleanup old backups
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -type f -name "*.sql" -mtime +$RETENTION_DAYS -delete

echo "✨ Backup Process Completed."
