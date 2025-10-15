# NextMint FMEA App Deployment Guide

Complete deployment guide for ngmapp.codesett.com on VPS 159.198.66.158

## 📋 Prerequisites
- VPS Server: 159.198.66.158 (root access)
- Domain: ngmapp.codesett.com (pointed to server IP)
- Anthropic API Key configured in .env.local

## 🚀 Step 1: Server Setup

SSH into your VPS and run the server setup:

```bash
# SSH into server
ssh root@159.198.66.158

# Download and run server setup script
curl -o server-setup.sh https://raw.githubusercontent.com/your-repo/server-setup.sh
chmod +x server-setup.sh
./server-setup.sh
```

Or manually copy the `server-setup.sh` file to your server and run:
```bash
chmod +x server-setup.sh
./server-setup.sh
```

**Important:** After running server-setup.sh, follow the PM2 startup command output to enable PM2 auto-start.

## 🔒 Step 2: SSL Certificate Setup

Still on the server, run the SSL setup:

```bash
# Copy ssl-setup.sh to server and run
chmod +x ssl-setup.sh
./ssl-setup.sh
```

This will:
- Install Let's Encrypt Certbot
- Generate SSL certificate for ngmapp.codesett.com
- Set up automatic certificate renewal

## 📤 Step 3: Deploy Application

From your local machine (in the project directory):

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The deployment script will:
1. Upload all project files to `/home/peerisfh/nextgenmaintapp`
2. Install dependencies with pnpm
3. Build the production bundle
4. Configure Nginx with your domain
5. Start the app with PM2

## 🔍 Step 4: Verify Deployment

### Check Application Status
```bash
ssh root@159.198.66.158 'pm2 status'
ssh root@159.198.66.158 'pm2 logs nextmint-fmea'
```

### Test Website
- HTTP: http://ngmapp.codesett.com (should redirect to HTTPS)
- HTTPS: https://ngmapp.codesett.com (should load your app)

### Test SSL Certificate
```bash
curl -I https://ngmapp.codesett.com
```

## 📊 Monitoring & Maintenance

### PM2 Commands (run on server)
```bash
pm2 status                    # Check app status
pm2 logs nextmint-fmea       # View logs
pm2 restart nextmint-fmea    # Restart app
pm2 stop nextmint-fmea       # Stop app
pm2 monit                    # Real-time monitoring
```

### Nginx Commands
```bash
systemctl status nginx       # Check Nginx status
nginx -t                     # Test configuration
systemctl reload nginx      # Reload configuration
systemctl restart nginx     # Restart Nginx
```

### SSL Certificate Management
```bash
certbot certificates         # View certificates
certbot renew               # Manual renewal
```

## 🔄 Redeployment

To update your application:
1. Make changes to your local code
2. Run `./deploy.sh` again

The script will:
- Upload only changed files
- Rebuild the application
- Restart PM2 automatically

## 🗂️ File Structure on Server

```
/home/peerisfh/nextgenmaintapp/
├── app/                     # Next.js app directory
├── components/              # React components
├── lib/                     # Utilities and libraries
├── .env.local              # Environment variables
├── package.json            # Dependencies
├── ecosystem.config.js     # PM2 configuration
└── logs/                   # Application logs
    ├── err.log
    ├── out.log
    └── combined.log
```

## 🛠️ Troubleshooting

### App Won't Start
```bash
# Check PM2 logs
ssh root@159.198.66.158 'pm2 logs nextmint-fmea'

# Check if port 3030 is available
ssh root@159.198.66.158 'netstat -tlnp | grep :3030'
```

### SSL Issues
```bash
# Check certificate status
ssh root@159.198.66.158 'certbot certificates'

# Test certificate renewal
ssh root@159.198.66.158 'certbot renew --dry-run'
```

### Nginx Configuration Issues
```bash
# Test configuration
ssh root@159.198.66.158 'nginx -t'

# Check error logs
ssh root@159.198.66.158 'tail -f /var/log/nginx/error.log'
```

## 📞 Support

If you encounter issues:
1. Check the logs: `pm2 logs nextmint-fmea`
2. Verify all services are running: `systemctl status nginx`
3. Test the API endpoint: `curl https://ngmapp.codesett.com/api/ai/status`

Your NextMint FMEA app should now be live at https://ngmapp.codesett.com! 🎉