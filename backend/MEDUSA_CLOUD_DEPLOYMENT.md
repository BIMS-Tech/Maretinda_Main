# 🚀 Medusa Cloud Deployment Guide

Complete guide for deploying your Maretinda backend to Medusa Cloud via GitHub.

## 🔧 Issue Fixed

The error you encountered:
```
Cannot find module './src/modules/payment-giyapay'
```

**Solution**: Updated `package.json` build script to build the nested `payment-giyapay` module before building the main app.

```json
"scripts": {
  "build": "npm run build:giyapay && medusa build",
  "build:giyapay": "cd src/modules/payment-giyapay && npm install && npm run build"
}
```

## 📋 Prerequisites

1. **Medusa Cloud Account**: [Sign up](https://medusajs.com/pricing/)
2. **GitHub Repository**: Your code pushed to GitHub
3. **PostgreSQL Database**: Provided by Medusa Cloud or external (Google Cloud SQL)

## 🎯 Deployment Steps

### Step 1: Connect GitHub Repository

1. Log in to [Medusa Cloud Console](https://app.medusajs.com/)
2. Click **"New Project"**
3. Select **"Connect GitHub Repository"**
4. Authorize Medusa Cloud to access your repository
5. Select your repository: `BIMS-Tech/Maretinda_Main`
6. Select branch: `main`

### Step 2: Configure Environment Variables

In Medusa Cloud Console, add these environment variables:

#### Required Variables

```bash
# Database (if using external Cloud SQL)
DATABASE_URL=postgresql://user:password@host:5432/medusa

# Or use Medusa Cloud's provided database
# DATABASE_URL will be auto-configured

# CORS Configuration
STORE_CORS=https://yourdomain.com,https://www.yourdomain.com
ADMIN_CORS=https://admin.yourdomain.com
VENDOR_CORS=https://vendor.yourdomain.com
AUTH_CORS=https://yourdomain.com,https://admin.yourdomain.com,https://vendor.yourdomain.com

# Security Secrets (generate strong values)
JWT_SECRET=your-random-jwt-secret-min-32-chars
COOKIE_SECRET=your-random-cookie-secret-min-32-chars

# Node Environment
NODE_ENV=production

# Algolia Search (if using)
ALGOLIA_APP_ID=your_algolia_app_id
ALGOLIA_API_KEY=your_algolia_api_key

# Resend Email (if using)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Google Cloud Storage (if using)
GOOGLE_APPLICATION_CREDENTIALS=/app/config/gcs-key.json
GCS_BUCKET_NAME=your-bucket-name
```

#### Generate Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate COOKIE_SECRET
openssl rand -base64 32
```

### Step 3: Configure Build Settings

Medusa Cloud uses your `package.json` scripts. No additional configuration needed.

**Build Command**: Automatically uses `npm run build`
**Start Command**: Automatically uses `npm start`

### Step 4: Deploy

1. Click **"Deploy"** in Medusa Cloud Console
2. Wait for the build to complete (5-10 minutes)
3. Medusa Cloud will:
   - Install dependencies
   - Build payment-giyapay module
   - Build main application
   - Run database migrations (if configured)
   - Start the server

### Step 5: Run Database Setup

After first deployment, run migrations:

#### Option A: Using Medusa Cloud CLI

```bash
# Install Medusa Cloud CLI
npm install -g @medusajs/medusa-cli

# Login
medusa login

# Run migrations
medusa exec --project=your-project-id npm run db:setup
```

#### Option B: Using Local Connection

```bash
# Connect to Medusa Cloud database locally
# Get DATABASE_URL from Medusa Cloud Console

# Create .env.production
cat > .env.production << EOF
DATABASE_URL=your-medusa-cloud-database-url
NODE_ENV=production
EOF

# Run migrations locally
npm run prod:run db:setup
```

#### Option C: Via Admin Panel API

Create an admin API endpoint to run migrations (see below).

## 🔄 Automatic Deployments

### Enable Auto-Deploy from GitHub

1. In Medusa Cloud Console, go to **Settings → Deployments**
2. Enable **"Auto-deploy from GitHub"**
3. Select branch: `main`

Now every push to `main` will trigger a deployment.

### Deployment Workflow

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# Medusa Cloud automatically:
# 1. Detects the push
# 2. Builds the application
# 3. Runs tests (if configured)
# 4. Deploys to production
```

## 🗄️ Database Management

### Using External Database (Google Cloud SQL)

If you want to use Google Cloud SQL instead of Medusa Cloud's database:

1. **Create Cloud SQL instance** (see `GOOGLE_CLOUD_SQL_SETUP.md`)

2. **Get connection details**:
   ```bash
   # For Medusa Cloud, use public IP connection
   gcloud sql instances describe maretinda-db --format="value(ipAddresses.ipAddress)"
   ```

3. **Add to Medusa Cloud environment variables**:
   ```bash
   DATABASE_URL=postgresql://user:password@CLOUD_SQL_IP:5432/medusa?sslmode=require
   ```

4. **Whitelist Medusa Cloud IPs**:
   - Contact Medusa support for their egress IPs
   - Or use Cloud SQL Proxy (see below)

### Running Migrations

#### During Deployment

Add to your `package.json`:

```json
{
  "scripts": {
    "build": "npm run build:giyapay && medusa build",
    "start": "npm run db:migrate && medusa start"
  }
}
```

**⚠️ Warning**: This runs migrations on every startup. Better for staging, not production.

#### Manual Migrations

Use one of the methods in Step 5 above.

## 🔐 Managing Secrets

### Google Cloud Storage Key

If using GCS for file uploads:

1. **Create service account** in Google Cloud Console
2. **Download JSON key**
3. **Encode as base64**:
   ```bash
   base64 -i config/gcs-key.json
   ```
4. **Add to Medusa Cloud** as `GCS_KEY_BASE64`
5. **Decode in startup script**:
   ```json
   {
     "scripts": {
       "prestart": "echo $GCS_KEY_BASE64 | base64 -d > /app/config/gcs-key.json"
     }
   }
   ```

### Better Approach: Use Environment Variables

Update your GCS configuration to use environment variables instead of key file:

```typescript
// medusa-config.ts
{
  resolve: '@google-cloud/storage',
  options: {
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
      client_email: process.env.GCP_CLIENT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }
  }
}
```

Then add to Medusa Cloud:
```bash
GCP_PROJECT_ID=your-project-id
GCP_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GCP_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\n-----END PRIVATE KEY-----
```

## 🏗️ Custom Build Process

If you need a custom build process, create `.medusa-cloud.json`:

```json
{
  "build": {
    "command": "npm run build:giyapay && npm run build",
    "env": {
      "NODE_ENV": "production"
    }
  },
  "start": {
    "command": "npm start",
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

## 📊 Monitoring

### View Logs

```bash
# Install Medusa CLI
npm install -g @medusajs/medusa-cli

# Login
medusa login

# View logs
medusa logs --project=your-project-id --tail
```

### Health Checks

Medusa Cloud automatically monitors your application health at `/health`.

### Metrics

Available in Medusa Cloud Console:
- Request count
- Response time
- Error rate
- Database connections

## 🐛 Troubleshooting

### Build Fails: "Cannot find module"

**Issue**: Custom modules not built before main build

**Solution**: Update `package.json`:
```json
{
  "scripts": {
    "build": "npm run build:giyapay && medusa build",
    "build:giyapay": "cd src/modules/payment-giyapay && npm install && npm run build"
  }
}
```

### Database Connection Failed

**Issue**: DATABASE_URL incorrect or database not accessible

**Solutions**:
1. Check DATABASE_URL in environment variables
2. Verify database is running
3. Check firewall rules (if using external DB)
4. Ensure SSL is configured if required

### Migration Errors

**Issue**: Migrations fail or table already exists

**Solutions**:
1. Check migration files in `src/migrations/`
2. Run migrations manually:
   ```bash
   npm run prod:run db:migrate
   ```
3. Reset migrations (⚠️ destructive):
   ```bash
   # Drop all tables and re-run migrations
   npm run prod:run db:reset
   ```

### Memory Issues

**Issue**: Application crashes with "Out of memory"

**Solutions**:
1. Upgrade Medusa Cloud plan
2. Optimize queries and imports
3. Check for memory leaks

### Environment Variables Not Loading

**Issue**: Config values are undefined

**Solutions**:
1. Verify variables are set in Medusa Cloud Console
2. Check for typos in variable names
3. Restart the application
4. Use `console.log` to debug (remove in production!)

## 🚀 Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Strong JWT_SECRET and COOKIE_SECRET set
- [ ] DATABASE_URL pointing to production database
- [ ] CORS configured for production domains
- [ ] Database migrations completed
- [ ] Initial data seeded (if needed)
- [ ] File storage configured (GCS or S3)
- [ ] Email service configured (Resend)
- [ ] Payment gateway configured (GiyaPay)
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Health checks passing
- [ ] Monitoring enabled
- [ ] Backup strategy in place

## 📚 Additional Resources

- [Medusa Cloud Documentation](https://docs.medusajs.com/deployment/medusa-cloud)
- [Environment Variables Guide](./ENV_CONFIGURATION.md)
- [Database Setup Guide](./DATABASE_SETUP_GUIDE.md)
- [Google Cloud SQL Setup](./GOOGLE_CLOUD_SQL_SETUP.md)
- [Running Commands](./COMMANDS_QUICKSTART.md)

## 🆘 Getting Help

- **Medusa Cloud Support**: support@medusajs.com
- **Discord Community**: [Join Discord](https://discord.gg/medusajs)
- **Documentation**: [docs.medusajs.com](https://docs.medusajs.com)

## 🎓 Next Steps

After successful deployment:

1. ✅ Configure custom domain
2. ✅ Set up monitoring and alerts
3. ✅ Configure automated backups
4. ✅ Test all functionality in production
5. ✅ Set up staging environment
6. ✅ Document deployment process for team

