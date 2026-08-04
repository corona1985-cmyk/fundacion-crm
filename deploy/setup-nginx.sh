#!/bin/bash

# ==============================================================================
# Fundación "Rompiendo Paradigmas" CRM - Nginx Reverse Proxy & SSL Setup
# ==============================================================================

set -e

DOMAIN=${DOMAIN:-"app.fundacionrompiendoparadigmas.org"}
WEB_ROOT=${WEB_ROOT:-"/var/www/fundacion-crm"}

echo "=========================================================="
echo " Configuring Nginx for Domain: $DOMAIN"
echo "=========================================================="

sudo mkdir -p $WEB_ROOT
sudo chown -R www-data:www-data $WEB_ROOT

CAT_NGINX_CONF="/etc/nginx/sites-available/fundacion-crm"

sudo bash -c "cat > $CAT_NGINX_CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Frontend Static SPA
    root $WEB_ROOT;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Uploads Static Mirror
    location /uploads/ {
        alias /var/www/crm-backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/fundacion-crm /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "Nginx site configured successfully!"
echo "To issue SSL certificate run: sudo certbot --nginx -d $DOMAIN"
