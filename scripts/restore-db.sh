#!/bin/bash

# Script to restore database from a backup
# Usage: bash scripts/restore-db.sh [backup-file]
# Example: bash scripts/restore-db.sh prisma/dev.db.backup.20251108_151403

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DB_FILE="prisma/dev.db"

# Function to print colored messages
print_error() {
    echo -e "${RED}Error: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if backup file is provided
if [ -z "$1" ]; then
    print_error "No backup file specified!"
    echo ""
    echo "Usage: bash scripts/restore-db.sh [backup-file]"
    echo ""
    echo "Available backups:"
    ls -lh prisma/dev.db.backup.* 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file '$BACKUP_FILE' not found!"
    echo ""
    echo "Available backups:"
    ls -lh prisma/dev.db.backup.* 2>/dev/null || echo "  No backups found"
    exit 1
fi

# Confirm restoration
print_info "This will restore the database from: $BACKUP_FILE"
print_info "Current database will be backed up first."
echo ""
read -p "Do you want to continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Restoration cancelled."
    exit 0
fi

# Create a backup of the current database before restoring
if [ -f "$DB_FILE" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    CURRENT_BACKUP="${DB_FILE}.backup.${TIMESTAMP}"
    print_info "Backing up current database to: $CURRENT_BACKUP"
    cp "$DB_FILE" "$CURRENT_BACKUP"
    print_success "Current database backed up"
fi

# Restore the database
print_info "Restoring database from: $BACKUP_FILE"
cp "$BACKUP_FILE" "$DB_FILE"
print_success "Database restored successfully!"

# Show database info
print_info "Database info:"
sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table';" | while read table; do
    count=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM $table;")
    echo "  - $table: $count rows"
done

echo ""
print_success "Restoration complete!"
print_info "You may need to restart your development server (npm run dev)"
