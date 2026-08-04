#!/bin/bash

# ==============================================================================
# Fundación "Rompiendo Paradigmas" CRM - PostgreSQL Database Provisioning
# ==============================================================================

set -e

DB_NAME=${DB_NAME:-"fundacion_crm"}
DB_USER=${DB_USER:-"fundacion_user"}
DB_PASS=${DB_PASS:-"secure_password_rompiendo_2026"}

echo "=========================================================="
echo " Provisioning Production PostgreSQL Database: $DB_NAME"
echo "=========================================================="

sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database $DB_NAME already exists."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';" 2>/dev/null || echo "User $DB_USER already exists."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

echo "Database $DB_NAME and user $DB_USER configured successfully!"
