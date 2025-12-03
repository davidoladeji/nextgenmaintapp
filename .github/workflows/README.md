# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the Next.js FMEA Builder application.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)
**Triggers:** Push to `main` or `develop`, Pull Requests

**Jobs:**
- **Lint and Type Check**: Runs ESLint and TypeScript type checking
- **Build**: Builds the Next.js application
- **Test**: Runs the test suite
- **Deploy Preview**: Comments on PRs with deployment status

### 2. Production Deployment (`deploy.yml`)
**Triggers:** Push to `main` branch (excluding markdown files)

**Jobs:**
- **Deploy**: Builds and deploys the application to production
- Includes commented examples for Vercel, Railway, and VPS deployment

**Environment:** production

### 3. Security & Dependency Check (`security.yml`)
**Triggers:**
- Schedule: Every Monday at 9 AM UTC
- Manual trigger via workflow_dispatch

**Jobs:**
- **Security Audit**: Runs pnpm audit and checks for outdated dependencies
- **CodeQL Analysis**: Automated security vulnerability scanning

### 4. Pull Request Checks (`pr-checks.yml`)
**Triggers:** Pull request events (opened, synchronized, reopened)

**Jobs:**
- **PR Validation**:
  - Checks for merge conflicts
  - Validates commit messages
  - Detects large files
  - Ensures build succeeds
  - Comments on PR with status

## Setup Instructions

### Required Repository Secrets

For deployment workflows, configure these secrets in GitHub:
- Settings → Secrets and variables → Actions → New repository secret

#### For Vercel Deployment:
- `VERCEL_TOKEN`: Your Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

#### For Railway Deployment:
- `RAILWAY_TOKEN`: Your Railway authentication token
- `RAILWAY_SERVICE`: Your Railway service name

#### For VPS/SSH Deployment (Currently Configured):
- `SSH_HOST`: Your server hostname or IP (e.g., 159.198.66.158)
- `SSH_USERNAME`: SSH username (e.g., root)
- `SSH_PRIVATE_KEY`: SSH private key content (the entire private key file)
- `SSH_PORT`: SSH port (usually 22)

**Setup Instructions for VPS Deployment:**

1. **Generate SSH Key Pair** (if not already done):
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/github_actions_deploy -N "" -C "github-actions-deploy"
   ```

2. **Add Public Key to Server**:
   ```bash
   # Copy your public key
   cat ~/.ssh/github_actions_deploy.pub

   # SSH into your server and add the public key
   ssh root@your-server-ip
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   echo "your-public-key-content" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **Add Private Key to GitHub Secrets**:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `SSH_PRIVATE_KEY`
   - Value: Paste the entire content of your private key file (including BEGIN and END lines)
   ```bash
   cat ~/.ssh/github_actions_deploy
   ```

4. **Configure Other Secrets**:
   - `SSH_HOST`: Your server IP address
   - `SSH_USERNAME`: Your SSH username (usually 'root')
   - `SSH_PORT`: SSH port (22)

### Enabling CodeQL

CodeQL is enabled by default in the security workflow. It scans for:
- SQL injection vulnerabilities
- XSS vulnerabilities
- Path traversal issues
- Code quality issues

### Manual Workflow Triggers

You can manually trigger workflows from:
- GitHub repository → Actions tab → Select workflow → Run workflow

## Workflow Badges

Add these badges to your README.md:

\`\`\`markdown
![CI/CD Pipeline](https://github.com/davidoladeji/nextgenmaintapp/workflows/CI%2FCD%20Pipeline/badge.svg)
![Security Check](https://github.com/davidoladeji/nextgenmaintapp/workflows/Security%20%26%20Dependency%20Check/badge.svg)
\`\`\`

## Customization

### Adjusting Node.js Version
Update the `node-version` in each workflow:
\`\`\`yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change this
\`\`\`

### Adjusting pnpm Version
Update the pnpm version:
\`\`\`yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 10  # Change this
\`\`\`

### Adding Environment Variables
Add environment variables to build steps:
\`\`\`yaml
- name: Build application
  run: pnpm run build
  env:
    NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
\`\`\`

## Troubleshooting

### Build Failures
- Check Node.js and pnpm versions match your local environment
- Ensure all required environment variables are set
- Review build logs in the Actions tab

### Deployment Issues
- Verify all secrets are correctly configured
- Check deployment service status
- Review deployment logs

### Cache Issues
If builds are using stale dependencies:
1. Go to Actions tab
2. Click "Caches" in the sidebar
3. Delete old caches

## Best Practices

1. **Keep workflows fast**: Use caching and parallel jobs
2. **Fail fast**: Use `continue-on-error: false` for critical checks
3. **Secure secrets**: Never commit secrets to the repository
4. **Monitor workflows**: Set up notifications for failed workflows
5. **Regular updates**: Keep workflow actions up to date

## Support

For issues with workflows:
1. Check the Actions tab for detailed logs
2. Review workflow syntax
3. Consult GitHub Actions documentation
4. Contact the development team
