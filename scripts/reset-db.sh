#!/bin/bash

# Script to reset the database by copying dev copy.db to dev.db
# Usage: npm run db:reset

set -e

PRISMA_DIR="prisma"
SOURCE_DB="$PRISMA_DIR/dev copy.db"
TARGET_DB="$PRISMA_DIR/dev.db"

# Check if source database exists
if [ ! -f "$SOURCE_DB" ]; then
  echo "❌ Error: Source database '$SOURCE_DB' not found"
  exit 1
fi

# Backup current database if it exists
if [ -f "$TARGET_DB" ]; then
  BACKUP_DB="$PRISMA_DIR/dev.db.backup.$(date +%Y%m%d_%H%M%S)"
  echo "📦 Backing up current database to: $BACKUP_DB"
  cp "$TARGET_DB" "$BACKUP_DB"
fi

# Copy the source database to target
echo "🔄 Resetting database: copying '$SOURCE_DB' to '$TARGET_DB'"
cp "$SOURCE_DB" "$TARGET_DB"

echo "✅ Database reset complete!"
echo "📊 You can now run 'npm run dev' to use the reset database"
