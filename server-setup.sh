#!/bin/bash

# Server Setup Script for NextMint FMEA App
# Run this on the VPS server: 159.198.66.158

echo "🛠️  Setting up server environment..."

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "🔧 Installing essential packages..."
apt install -y curl wget git build-essential software-properties-common

# Install Node.js 18.x
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version:"
node --version
npm --version

# Install pnpm globally
echo "📦 Installing pnpm..."
npm install -g pnpm
echo "✅ pnpm version:"
pnpm --version

# Install PM2 globally
echo "📦 Installing PM2..."
npm install -g pm2
echo "✅ PM2 version:"
pm2 --version

# Install and configure Nginx
echo "🌐 Installing Nginx..."
apt install -y nginx

# Start and enable services
echo "🚀 Starting services..."
systemctl start nginx
systemctl enable nginx
systemctl status nginx --no-pager -l

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Create application directories
echo "📁 Creating application directories..."
mkdir -p /home/peerisfh/nextgenmaintapp/logs
chown -R root:root /home/peerisfh/nextgenmaintapp

# Configure PM2 startup
echo "🔄 Configuring PM2 startup..."
pm2 startup
# Note: Follow the instructions from the pm2 startup command output

# Show status
echo "✅ Server setup complete!"
echo "📊 System info:"
echo "Node.js: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "PM2: $(pm2 --version)"
echo "Nginx: $(nginx -v 2>&1)"

echo ""
echo "🔥 Firewall status:"
ufw status

echo ""
echo "📝 Next steps:"
echo "1. Run the SSL setup script: ./ssl-setup.sh"
echo "2. Run the deployment script from your local machine: ./deploy.sh"