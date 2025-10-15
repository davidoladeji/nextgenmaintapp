#!/bin/bash

# NextMint FMEA App Deployment Script
# Server: 159.198.66.158
# Domain: ngmapp.codesett.com

SERVER_IP="159.198.66.158"
SERVER_USER="root"
APP_DIR="/home/peerisfh/nextgenmaintapp"
LOCAL_DIR="/Users/macbook/Development/nextmint-app"

echo "🚀 Starting deployment to ngmapp.codesett.com..."

# Create necessary directories on server
echo "📁 Creating directories on server..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $APP_DIR/logs"

# Upload project files (exclude node_modules, .git, logs)
echo "📤 Uploading project files..."
rsync -avz --delete \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  --exclude 'logs/' \
  --exclude '.next/' \
  --exclude 'tsconfig.tsbuildinfo' \
  --exclude 'deploy.sh' \
  "$LOCAL_DIR/" "$SERVER_USER@$SERVER_IP:$APP_DIR/"

# Upload PM2 configuration
echo "📋 Uploading PM2 configuration..."
scp "$LOCAL_DIR/ecosystem.config.js" "$SERVER_USER@$SERVER_IP:$APP_DIR/"

# Upload Nginx configuration
echo "🌐 Uploading Nginx configuration..."
scp "$LOCAL_DIR/nginx.conf" "$SERVER_USER@$SERVER_IP:/etc/nginx/sites-available/ngmapp.codesett.com"

# Install dependencies and build
echo "📦 Installing dependencies and building..."
ssh $SERVER_USER@$SERVER_IP "cd $APP_DIR && pnpm install"
ssh $SERVER_USER@$SERVER_IP "cd $APP_DIR && pnpm run build"

# Enable Nginx site
echo "🔗 Enabling Nginx site..."
ssh $SERVER_USER@$SERVER_IP "ln -sf /etc/nginx/sites-available/ngmapp.codesett.com /etc/nginx/sites-enabled/"
ssh $SERVER_USER@$SERVER_IP "nginx -t && systemctl reload nginx"

# Start/restart PM2 application
echo "🔄 Starting PM2 application..."
ssh $SERVER_USER@$SERVER_IP "cd $APP_DIR && pm2 startOrRestart ecosystem.config.js"
ssh $SERVER_USER@$SERVER_IP "pm2 save"

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://ngmapp.codesett.com"
echo "📊 Check PM2 status: ssh $SERVER_USER@$SERVER_IP 'pm2 status'"
echo "📝 View logs: ssh $SERVER_USER@$SERVER_IP 'pm2 logs nextmint-fmea'"