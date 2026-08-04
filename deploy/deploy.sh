#!/bin/bash

# ==============================================================================
# Fundación "Rompiendo Paradigmas" CRM - Main Zero-Downtime Deployment Script
# ==============================================================================

set -e

APP_DIR=${APP_DIR:-"/var/www/crm-becas"}
WEB_ROOT=${WEB_ROOT:-"/var/www/fundacion-crm"}

echo "=========================================================="
echo " Deploying CRM Fundación Rompiendo Paradigmas..."
echo " Time: $(date)"
echo "=========================================================="

cd $APP_DIR

# 1. Pull latest code from git main branch
echo "Pulling latest code from main branch..."
git fetch origin main
git reset --hard origin/main

# 2. Backend Build & Migration
echo "Installing backend dependencies..."
cd $APP_DIR/backend
npm ci --production=false

echo "Executing Database Migrations..."
npm run db:migrate

# 3. Frontend Build & Distribution Update
echo "Installing frontend dependencies & building SPA bundle..."
cd $APP_DIR/frontend
npm ci
npm run build

echo "Deploying frontend SPA build to Nginx root ($WEB_ROOT)..."
sudo cp -r dist/* $WEB_ROOT/
sudo chown -R www-data:www-data $WEB_ROOT

# 4. PM2 Zero-Downtime Process Reload
echo "Reloading PM2 application ecosystem..."
cd $APP_DIR/backend
pm2 startOrReload ecosystem.config.js --env production
pm2 save

echo "=========================================================="
echo " Deployment Completed Successfully!"
echo " PM2 Status:"
pm2 status
echo "=========================================================="
