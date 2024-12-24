#!/bin/bash

set -e

# Variables
DOMAIN="fundy.pauservices.top"
EMAIL="paumat17@gmail.com"
APP_DIR="/home/ubuntu/nginx_frontend"

IMAGE_NAME="nginx-webserver"
CONTAINER_NAME="fundy_frontend_v1"
NETWORK_NAME="my_network"
NGINX_CONF_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
NGINX_CONF="$NGINX_CONF_DIR/fundy_frontend"

# Ensure directories
sudo mkdir -p $NGINX_CONF_DIR $NGINX_ENABLED_DIR

# Stop and remove existing container if any
docker container stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker container rm "$CONTAINER_NAME" >/dev/null 2>&1 || true

# Update packages and install Nginx, Certbot if not installed
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx

sudo ufw allow 'Nginx Full' || true

# Build and run the Docker container with corrected port mapping
cd "$APP_DIR"
docker build --no-cache -t "$IMAGE_NAME" .
docker run -d \
    --name "$CONTAINER_NAME" \
    --network "$NETWORK_NAME" \
    --env-file "/home/ubuntu/nginx_frontend/.env/test.env" \
    -p 127.0.0.1:8080:80 \
    "$IMAGE_NAME"


# Create a temporary HTTP server block to allow Certbot HTTP challenge
sudo bash -c "cat > $NGINX_CONF" <<EOL
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL

sudo ln -sf "$NGINX_CONF" "$NGINX_ENABLED_DIR/fundy_frontend"
sudo rm -f /etc/nginx/sites-enabled/default || true

# Test Nginx configuration and restart
sudo nginx -t
sudo systemctl restart nginx

# Obtain SSL certificate using HTTP-01 challenge
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL
fi

# Now that we have the certificate, reconfigure Nginx to serve over HTTPS only
sudo bash -c "cat > $NGINX_CONF" <<EOL
server {
    listen 443 ssl;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$host\$request_uri;
}
EOL

# Test Nginx configuration and reload
sudo nginx -t
sudo systemctl reload nginx

echo "Setup complete. Your application should now be accessible via https://$DOMAIN/"
