#!/bin/bash

# ==============================================================================
# Fundación "Rompiendo Paradigmas" CRM - Automated PostgreSQL Backup Script
# Retention Policy: 30 days
# ==============================================================================

set -e

BACKUP_DIR=${BACKUP_DIR:-"/var/backups/crm-database"}
DB_NAME=${DB_NAME:-"fundacion_crm"}
DB_USER=${DB_USER:-"fundacion_user"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p $BACKUP_DIR

echo "Starting PostgreSQL backup for database: $DB_NAME..."
PGPASSWORD="${DB_PASSWORD:-secure_password_rompiendo_2026}" pg_dump -h localhost -U $DB_USER -d $DB_NAME | gzip > $FILENAME

echo "Backup generated successfully: $FILENAME"
echo "Backup size: $(du -sh $FILENAME | cut -f1)"

# Remove backups older than 30 days
echo "Cleaning up backups older than 30 days..."
find $BACKUP_DIR -type f -name "backup_${DB_NAME}_*.sql.gz" -mtime +30 -exec rm -f {} \;

echo "Backup process finished."
