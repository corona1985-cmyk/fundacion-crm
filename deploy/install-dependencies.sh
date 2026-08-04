#!/bin/bash

# ==============================================================================
# Fundación "Rompiendo Paradigmas" CRM - Production Dependencies Installer
# Target OS: Ubuntu 22.04 LTS
# ==============================================================================

set -e

echo "=========================================================="
echo " Starting System & Dependencies Installation"
echo "=========================================================="

# 1. Update system packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential unzip software-properties-common ufw

# 2. Configure Firewall (UFW)
echo "Configuring firewall (SSH, HTTP, HTTPS)..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 3. Install Node.js 20 LTS
echo "Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Install PostgreSQL 15
echo "Installing PostgreSQL 15..."
sudo apt install -y postgresql postgresql-contrib

# 5. Install Redis 7
echo "Installing Redis 7..."
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 6. Install Nginx 1.24+ & Certbot
echo "Installing Nginx & Let's Encrypt Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 7. Install PM2 globally
echo "Installing PM2 process manager globally..."
sudo npm install -g pm2
sudo pm2 startup systemd -u $USER --hp /home/$USER

echo "=========================================================="
echo " Dependencies Installed Successfully!"
echo " Node version: $(node -v)"
echo " NPM version: $(npm -v)"
echo " PostgreSQL version: $(psql --version)"
echo " Redis version: $(redis-cli --version)"
echo " Nginx version: $(nginx -v 2>&1)"
echo "=========================================================="
