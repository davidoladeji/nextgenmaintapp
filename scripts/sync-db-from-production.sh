#!/bin/bash

# Database Sync Script - Production to Local
# This script backs up the local database and then syncs the production database to local

set -e  # Exit on any error

SERVER_IP="159.198.66.158"
SERVER_USER="root"
SERVER_PATH="/home/peerisfh/nextgenmaintapp/data"
LOCAL_PATH="./data"
BACKUP_DIR="./data/backups"
SSH_KEY="$HOME/.ssh/github_actions_nextmint"

echo "🔄 Database Sync: Production → Local"
echo "====================================="

# Check if production database exists
echo "🔍 Checking production database..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" \
    "test -f $SERVER_PATH/fmea-data.json || exit 1" || {
    echo "❌ Error: Production database not found"
    exit 1
}

# Create local backup directory
echo "📁 Creating local backup directory..."
mkdir -p "$BACKUP_DIR"

# Backup local database if it exists
if [ -f "$LOCAL_PATH/fmea-data.json" ]; then
    echo "💾 Backing up local database..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    cp "$LOCAL_PATH/fmea-data.json" "$BACKUP_DIR/fmea-data_$TIMESTAMP.json"
    echo "✅ Backup created: $BACKUP_DIR/fmea-data_$TIMESTAMP.json"
fi

# Download production database to local
echo "⬇️  Downloading production database..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    "$SERVER_USER@$SERVER_IP:$SERVER_PATH/fmea-data.json" \
    "$LOCAL_PATH/fmea-data.json"

echo "✅ Database downloaded successfully"

# Download platform settings if it exists
echo "⬇️  Downloading platform settings..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    "$SERVER_USER@$SERVER_IP:$SERVER_PATH/platform-settings.json" \
    "$LOCAL_PATH/platform-settings.json" 2>/dev/null || echo "⚠️  Platform settings not found (skipping)"

echo ""
echo "✅ Database sync completed successfully!"
if [ -f "$BACKUP_DIR/fmea-data_$TIMESTAMP.json" ]; then
    echo "📊 Local backup: $BACKUP_DIR/fmea-data_$TIMESTAMP.json"
fi
echo "💻 Local database updated"
