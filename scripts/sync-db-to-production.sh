#!/bin/bash

# Database Sync Script - Local to Production
# This script backs up the production database and then syncs the local database to production

set -e  # Exit on any error

SERVER_IP="159.198.66.158"
SERVER_USER="root"
SERVER_PATH="/home/peerisfh/nextgenmaintapp/data"
LOCAL_PATH="./data"
BACKUP_DIR="/home/peerisfh/nextgenmaintapp/data/backups"
SSH_KEY="$HOME/.ssh/github_actions_nextmint"

echo "🔄 Database Sync: Local → Production"
echo "====================================="

# Check if local database exists
if [ ! -f "$LOCAL_PATH/fmea-data.json" ]; then
    echo "❌ Error: Local database not found at $LOCAL_PATH/fmea-data.json"
    exit 1
fi

# Create backup directory on server
echo "📁 Creating backup directory on server..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "mkdir -p $BACKUP_DIR"

# Create backup of production database
echo "💾 Backing up production database..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" \
    "cp $SERVER_PATH/fmea-data.json $BACKUP_DIR/fmea-data_$TIMESTAMP.json"

echo "✅ Backup created: fmea-data_$TIMESTAMP.json"

# Upload local database to production
echo "⬆️  Uploading local database to production..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    "$LOCAL_PATH/fmea-data.json" \
    "$SERVER_USER@$SERVER_IP:$SERVER_PATH/fmea-data.json"

echo "✅ Database uploaded successfully"

# Upload platform settings if it exists
if [ -f "$LOCAL_PATH/platform-settings.json" ]; then
    echo "⬆️  Uploading platform settings..."
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
        "$LOCAL_PATH/platform-settings.json" \
        "$SERVER_USER@$SERVER_IP:$SERVER_PATH/platform-settings.json"
    echo "✅ Platform settings uploaded"
fi

# Restart PM2 to pick up changes
echo "🔄 Restarting PM2 application..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" \
    "cd /home/peerisfh/nextgenmaintapp && pm2 restart nextmint-fmea"

echo ""
echo "✅ Database sync completed successfully!"
echo "📊 Backup location: $BACKUP_DIR/fmea-data_$TIMESTAMP.json"
echo "🌐 Application: https://ngmapp.codesett.com"
