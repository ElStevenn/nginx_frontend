#!/bin/bash

set -e

# Variables
DOMAIN="fundy.pauservices.top"
APP_DIR="/home/ubuntu/nginx_frontend"
CONFIG="/home/ubuntu/scripts/config.json"

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

# Modify config if needed (optional)
if [ -f "$CONFIG" ]; then
    jq '.api = false' "$CONFIG" > temp.json && mv temp.json "$CONFIG"
fi

# Update packages and install Nginx if not installed
sudo apt-get update -y
sudo apt-get install -y nginx

# Allow Nginx through firewall if using UFW
sudo ufw allow 'Nginx Full' || true

# Build Docker image
cd "$APP_DIR" || exit 1
docker build --no-cache -t "$IMAGE_NAME" .
docker run -d \
    --name "$CONTAINER_NAME" \
    --network "$NETWORK_NAME" \
    --env-file "/home/ubuntu/nginx_frontend/.env/test.env" \
    -p 127.0.0.1:8080:80 \
    "$IMAGE_NAME"
    
# Configure Nginx to serve the application over HTTP
sudo bash -c "cat > $NGINX_CONF" <<EOL
server {
    listen 80;
    server_name $DOMAIN;

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

# Update the API flag in config (optional)
if [ -f "$CONFIG" ]; then
    if [[ -s "$CONFIG" ]]; then
        API=$(jq -r '.api' "$CONFIG")
        if [[ "$API" == "false" ]]; then
            jq '.api = true' "$CONFIG" > temp.json && mv temp.json "$CONFIG"
        fi
    fi
fi

echo "Setup complete. Your application should now be accessible via http://$DOMAIN/"
