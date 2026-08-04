#!/bin/bash

# ==============================================================================
# Fundación "Rompiendo Paradigmas" CRM - Media Assets & Document Backup
# ==============================================================================

set -e

SOURCE_DIR=${SOURCE_DIR:-"/var/www/crm-backend/uploads"}
BACKUP_DIR=${BACKUP_DIR:-"/var/backups/crm-uploads"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/uploads_backup_${TIMESTAMP}.tar.gz"

mkdir -p $BACKUP_DIR

if [ -d "$SOURCE_DIR" ]; then
    echo "Archiving document uploads directory: $SOURCE_DIR..."
    tar -czf $FILENAME -C $SOURCE_DIR .
    echo "Uploads backup created: $FILENAME"
    echo "Size: $(du -sh $FILENAME | cut -f1)"

    # Clean backups older than 30 days
    find $BACKUP_DIR -type f -name "uploads_backup_*.tar.gz" -mtime +30 -exec rm -f {} \;
else
    echo "Upload directory $SOURCE_DIR does not exist. Skipping."
fi
