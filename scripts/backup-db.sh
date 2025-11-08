#!/bin/bash

# Script to backup the database
# Usage: npm run db:backup

set -e

PRISMA_DIR="prisma"
SOURCE_DB="$PRISMA_DIR/dev.db"
COPY_DB="$PRISMA_DIR/dev copy.db"

# Check if source database exists
if [ ! -f "$SOURCE_DB" ]; then
  echo "❌ Error: Source database '$SOURCE_DB' not found"
  exit 1
fi

# Create timestamped backup
BACKUP_DB="$PRISMA_DIR/dev.db.backup.$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating timestamped backup: $BACKUP_DB"
cp "$SOURCE_DB" "$BACKUP_DB"

# Create/replace dev copy.db
echo "📋 Creating/updating: $COPY_DB"
cp "$SOURCE_DB" "$COPY_DB"

echo "✅ Database backup complete!"
echo "   - Timestamped backup: $BACKUP_DB"
echo "   - Copy updated: $COPY_DB"
