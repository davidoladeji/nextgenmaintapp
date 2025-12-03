#!/bin/bash

# NextMint FMEA App Deployment Script
# Server: 159.198.66.158
# Domain: ngmapp.codesett.com

SERVER_IP="159.198.66.158"
SERVER_USER="root"
SERVER_PASSWORD="j71L9hgpNgQ0zS1P9G"
APP_DIR="/home/peerisfh/nextgenmaintapp"
LOCAL_DIR="/Users/macbook/Development/nextmint-app"

echo "🚀 Starting deployment to ngmapp.codesett.com..."

# Create necessary directories on server
echo "📁 Creating directories on server..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "mkdir -p $APP_DIR/logs"

# Upload project files (exclude node_modules, .git, logs)
echo "📤 Uploading project files..."
sshpass -p "$SERVER_PASSWORD" rsync -avz --delete \
  -e "ssh -o StrictHostKeyChecking=no" \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  --exclude 'logs/' \
  --exclude '.next/' \
  --exclude 'tsconfig.tsbuildinfo' \
  --exclude 'deploy.sh' \
  "$LOCAL_DIR/" "$SERVER_USER@$SERVER_IP:$APP_DIR/"

# Upload PM2 configuration
echo "📋 Uploading PM2 configuration..."
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no "$LOCAL_DIR/ecosystem.config.js" "$SERVER_USER@$SERVER_IP:$APP_DIR/"

# Upload Nginx configuration
echo "🌐 Uploading Nginx configuration..."
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no "$LOCAL_DIR/nginx.conf" "$SERVER_USER@$SERVER_IP:/etc/nginx/sites-available/ngmapp.codesett.com"

# Install dependencies and build
echo "📦 Installing dependencies and building..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "cd $APP_DIR && pnpm install"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "cd $APP_DIR && pnpm run build"

# Enable Nginx site
echo "🔗 Enabling Nginx site..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "ln -sf /etc/nginx/sites-available/ngmapp.codesett.com /etc/nginx/sites-enabled/"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "nginx -t && systemctl reload nginx"

# Start/restart PM2 application
echo "🔄 Starting PM2 application..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "cd $APP_DIR && pm2 startOrRestart ecosystem.config.js"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "pm2 save"

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://ngmapp.codesett.com"
echo "📊 Check PM2 status: ssh $SERVER_USER@$SERVER_IP 'pm2 status'"
echo "📝 View logs: ssh $SERVER_USER@$SERVER_IP 'pm2 logs nextmint-fmea'"