#!/bin/bash

# SSL Certificate Setup with Let's Encrypt
# Run this on the VPS server after server-setup.sh

DOMAIN="ngmapp.codesett.com"

echo "🔒 Setting up SSL certificate for $DOMAIN..."

# Install Certbot
echo "📦 Installing Certbot..."
apt install -y snapd
snap install core; snap refresh core
snap install --classic certbot

# Create symlink for certbot command
ln -sf /snap/bin/certbot /usr/bin/certbot

# Stop nginx temporarily for certificate generation
echo "⏸️  Stopping Nginx temporarily..."
systemctl stop nginx

# Generate SSL certificate
echo "🔐 Generating SSL certificate..."
certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@codesett.com

# Start nginx again
echo "🚀 Starting Nginx..."
systemctl start nginx

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    systemctl reload nginx
else
    echo "❌ Nginx configuration error - please check manually"
    exit 1
fi

# Set up automatic certificate renewal
echo "🔄 Setting up automatic certificate renewal..."
certbot renew --dry-run

# Create renewal cron job
echo "📅 Creating cron job for certificate renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Show certificate information
echo "📜 Certificate information:"
certbot certificates

echo "✅ SSL setup complete!"
echo "🔐 Your site should now be available at: https://$DOMAIN"
echo "🔄 Certificates will auto-renew every 60 days"

# Test SSL certificate
echo "🧪 Testing SSL certificate..."
curl -I https://$DOMAIN