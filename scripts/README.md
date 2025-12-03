# Database Sync Scripts

This directory contains utility scripts for managing database synchronization between local and production environments.

## Available Scripts

### 1. Sync Local → Production

**Script:** `./scripts/sync-db-to-production.sh`

Uploads your local database to production.

**Usage:**
```bash
./scripts/sync-db-to-production.sh
```

**What it does:**
- ✅ Creates a timestamped backup of the production database
- ✅ Uploads local `fmea-data.json` to production
- ✅ Uploads local `platform-settings.json` to production
- ✅ Restarts the PM2 application to pick up changes
- ✅ Provides backup location for rollback if needed

**When to use:**
- After making schema changes locally
- When you have updated test data locally
- When you need to sync configuration changes

**Safety:**
- Always backs up production data before syncing
- Backups stored in `/home/peerisfh/nextgenmaintapp/data/backups/`

---

### 2. Sync Production → Local

**Script:** `./scripts/sync-db-from-production.sh`

Downloads the production database to your local environment.

**Usage:**
```bash
./scripts/sync-db-from-production.sh
```

**What it does:**
- ✅ Creates a timestamped backup of your local database
- ✅ Downloads production `fmea-data.json` to local
- ✅ Downloads production `platform-settings.json` to local
- ✅ Provides backup location for rollback if needed

**When to use:**
- When you need real production data for local development
- For debugging production-specific issues
- When testing with live data scenarios

**Safety:**
- Always backs up local data before syncing
- Backups stored in `./data/backups/`

---

## Prerequisites

Both scripts require:
- SSH access to production server (159.198.66.158)
- SSH key at `~/.ssh/github_actions_nextmint`
- Public key added to server's authorized_keys

## Database Structure

The application uses a JSON-based database with the following main collections:

- `users` - User accounts
- `sessions` - Active user sessions
- `projects` - FMEA projects
- `assets` - Equipment/assets being analyzed
- `failureModes` - Failure modes identified
- `causes` - Root causes of failure modes
- `effects` - Effects/consequences of failures
- `controls` - Control measures
- `actions` - Corrective actions
- `components` - System components
- `organizations` - Organization/tenant data
- `organization_members` - Organization membership
- `organization_invitations` - Pending invitations
- `project_members` - Project access control
- `project_guest_links` - Shared project links
- `tools` - Available tools in the platform

## Backup Management

### Listing Backups

**Production backups:**
```bash
ssh -i ~/.ssh/github_actions_nextmint root@159.198.66.158 \
  "ls -lh /home/peerisfh/nextgenmaintapp/data/backups/"
```

**Local backups:**
```bash
ls -lh ./data/backups/
```

### Restoring from Backup

**Restore production from backup:**
```bash
# List available backups
ssh -i ~/.ssh/github_actions_nextmint root@159.198.66.158 \
  "ls /home/peerisfh/nextgenmaintapp/data/backups/"

# Restore specific backup
ssh -i ~/.ssh/github_actions_nextmint root@159.198.66.158 \
  "cp /home/peerisfh/nextgenmaintapp/data/backups/fmea-data_TIMESTAMP.json \
   /home/peerisfh/nextgenmaintapp/data/fmea-data.json && \
   pm2 restart nextmint-fmea"
```

**Restore local from backup:**
```bash
# List available backups
ls ./data/backups/

# Restore specific backup
cp ./data/backups/fmea-data_TIMESTAMP.json ./data/fmea-data.json
```

## Troubleshooting

### Permission Denied
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### SSH Connection Failed
```bash
# Test SSH connection
ssh -i ~/.ssh/github_actions_nextmint root@159.198.66.158 "echo 'Connected!'"

# If fails, check if public key is on server
cat ~/.ssh/github_actions_nextmint.pub
```

### Database Validation Failed
```bash
# Validate JSON syntax locally
node -e "require('./data/fmea-data.json')" && echo "✅ Valid JSON"

# Validate JSON syntax on production
ssh -i ~/.ssh/github_actions_nextmint root@159.198.66.158 \
  "cd /home/peerisfh/nextgenmaintapp && node -e \"require('./data/fmea-data.json')\" && echo '✅ Valid JSON'"
```

## Best Practices

1. **Always test locally first**: Make schema changes locally and test before syncing to production
2. **Verify backups**: Check that backups were created successfully before proceeding
3. **Off-peak hours**: Run production syncs during low-traffic periods
4. **Monitor after sync**: Watch application logs after syncing to production
5. **Keep backups**: Retain important backups for disaster recovery

## Emergency Rollback

If a sync causes issues in production:

1. **Stop accepting new data:**
   ```bash
   ssh -i ~/.ssh/github_actions_nextmint root@159.198.66.158 "pm2 stop nextmint-fmea"
   ```

2. **Restore from latest backup:**
   ```bash
   ssh -i ~/.ssh/github_actions_nextmint root@159.198.66.158 \
     "cd /home/peerisfh/nextgenmaintapp/data && \
      cp backups/\$(ls -t backups/ | head -1) fmea-data.json"
   ```

3. **Restart application:**
   ```bash
   ssh -i ~/.ssh/github_actions_nextmint root@159.198.66.158 "pm2 restart nextmint-fmea"
   ```

## Additional Resources

- [GitHub Actions Deployment Docs](.github/workflows/README.md)
- [Production Server]: https://ngmapp.codesett.com
- [Application Structure](../README.md)
