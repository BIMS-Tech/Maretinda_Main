# ⚡ Running Commands on Cloud Run - Quick Reference

Quick guide to run commands (migrations, seeds, scripts) on your Cloud Run service.

## 🎯 TL;DR - Three Ways to Run Commands

### 1️⃣ Using Helper Script (Easiest)

```bash
# Run on Cloud Run
npm run cloud:run seed
npm run cloud:run db:migrate
npm run cloud:run cleanup

# Run locally against production DB
npm run prod:run seed
npm run prod:run db:migrate
```

### 2️⃣ Direct gcloud Commands

```bash
# Create and execute Cloud Run Job
gcloud run jobs create my-job \
  --image=gcr.io/YOUR_PROJECT/maretinda-backend \
  --command=npm --args=run,seed \
  --region=asia-southeast1 \
  --execute-now
```

### 3️⃣ Local with Cloud SQL Proxy

```bash
# Start proxy
./cloud-sql-proxy PROJECT:REGION:INSTANCE &

# Run commands locally
npm run db:migrate
npm run seed
```

---

## 📋 Common Commands

### Database Operations

```bash
# Run migrations
npm run cloud:run db:migrate

# Setup database (migrate + init)
npm run cloud:run db:setup

# Initialize custom tables
npm run cloud:run db:init
```

### Data Management

```bash
# Seed database
npm run cloud:run seed

# Cleanup old files
npm run cloud:run cleanup

# Backup all files
npm run cloud:run backup:all
```

### Monitoring

```bash
# Storage statistics
npm run cloud:run storage:stats
```

---

## 🔧 Setup (First Time Only)

### Prerequisites

1. **Install gcloud CLI**: [Download](https://cloud.google.com/sdk/docs/install)
2. **Authenticate**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. **Deploy your backend to Cloud Run** (must be done first)

### Store Database URL in Secret Manager

```bash
# Create secret
echo -n "postgresql://user:pass@host/db" | \
  gcloud secrets create database-url --data-file=-

# Grant access to Cloud Run
gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 📖 Detailed Usage

### Method 1: Helper Scripts (Recommended)

#### Run on Cloud Run

```bash
# General format
npm run cloud:run <command>

# Examples
npm run cloud:run seed
npm run cloud:run db:migrate
npm run cloud:run cleanup
npm run cloud:run backup:all
```

**What it does:**
- Creates a Cloud Run Job with your backend image
- Executes the command in production environment
- Shows logs in real-time
- Cleans up the job after completion

#### Run Locally Against Production

```bash
# First, create .env.production with production credentials
cat > .env.production << EOF
DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/medusa
NODE_ENV=production
JWT_SECRET=your-secret
COOKIE_SECRET=your-secret
EOF

# Run commands
npm run prod:run db:migrate
npm run prod:run seed
```

**What it does:**
- Checks if Cloud SQL Proxy is running (starts it if needed)
- Loads production environment variables
- Runs command locally but against production DB
- Safer than direct Cloud Run for testing

### Method 2: Direct gcloud Commands

#### One-Time Job

```bash
gcloud run jobs create maretinda-seed \
  --image=gcr.io/YOUR_PROJECT/maretinda-backend \
  --command=npm \
  --args=run,seed \
  --region=asia-southeast1 \
  --set-secrets=DATABASE_URL=database-url:latest \
  --execute-now \
  --wait
```

#### View Logs

```bash
# List job executions
gcloud run jobs executions list --job=maretinda-seed

# View logs
gcloud logging read "resource.type=cloud_run_job" --limit=50
```

#### Delete Job

```bash
gcloud run jobs delete maretinda-seed --region=asia-southeast1
```

### Method 3: Cloud Build

Create `cloudbuild-migrate.yaml`:

```yaml
steps:
  - name: 'gcr.io/$PROJECT_ID/maretinda-backend'
    entrypoint: 'npm'
    args: ['run', 'db:migrate']
    secretEnv: ['DATABASE_URL']

availableSecrets:
  secretManager:
  - versionName: projects/$PROJECT_ID/secrets/database-url/versions/latest
    env: 'DATABASE_URL'
```

Run:

```bash
gcloud builds submit --config=cloudbuild-migrate.yaml --no-source
```

---

## 🚀 Deployment Workflow

### Option A: Migrate Before Deploy

```yaml
# cloudbuild.yaml
steps:
  # Build image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/maretinda-backend', '.']

  # Push image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/maretinda-backend']

  # Run migrations
  - name: 'gcr.io/$PROJECT_ID/maretinda-backend'
    entrypoint: 'npm'
    args: ['run', 'db:migrate']
    secretEnv: ['DATABASE_URL']

  # Deploy
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args: ['run', 'deploy', 'maretinda-backend', ...]

availableSecrets:
  secretManager:
  - versionName: projects/$PROJECT_ID/secrets/database-url/versions/latest
    env: 'DATABASE_URL'
```

### Option B: Migrate After Deploy

```bash
# 1. Deploy new version
gcloud run deploy maretinda-backend --image=...

# 2. Run migrations
npm run cloud:run db:migrate
```

---

## 📅 Scheduled Tasks

Run commands periodically using Cloud Scheduler:

```bash
# Daily cleanup at 3 AM
gcloud scheduler jobs create http daily-cleanup \
  --location=asia-southeast1 \
  --schedule="0 3 * * *" \
  --uri="https://asia-southeast1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/YOUR_PROJECT/jobs/maretinda-cleanup:run" \
  --http-method=POST \
  --oauth-service-account-email=YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com

# Weekly backup every Sunday at 2 AM
gcloud scheduler jobs create http weekly-backup \
  --location=asia-southeast1 \
  --schedule="0 2 * * 0" \
  --uri="https://asia-southeast1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/YOUR_PROJECT/jobs/maretinda-backup:run" \
  --http-method=POST \
  --oauth-service-account-email=YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com
```

---

## 🐛 Troubleshooting

### Command Failed

```bash
# View job logs
gcloud logging read "resource.type=cloud_run_job" \
  --limit=100 \
  --format="table(timestamp,severity,textPayload)"

# Check specific job
gcloud run jobs executions list --job=JOB_NAME
```

### Permission Denied

```bash
# Grant Cloud SQL access
gcloud projects add-iam-policy-binding YOUR_PROJECT \
  --member="serviceAccount:YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Grant Secret Manager access
gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Timeout

```bash
# Increase timeout when creating job
gcloud run jobs create JOB_NAME \
  --task-timeout=30m \
  ...
```

### Cloud SQL Proxy Not Running

```bash
# Check status
ps aux | grep cloud-sql-proxy

# Start manually
./cloud-sql-proxy YOUR_PROJECT:REGION:INSTANCE &

# Or let the script start it
npm run prod:run db:migrate
```

---

## 🔐 Security Best Practices

1. **Use Secret Manager** for sensitive data
2. **Use Service Accounts** with minimal permissions
3. **Enable audit logging** for command executions
4. **Test locally first** with `npm run prod:run`
5. **Backup before** running destructive commands

---

## 📚 Available Commands

All npm scripts from `package.json`:

| Command | Description |
|---------|-------------|
| `seed` | Seed sample data |
| `db:migrate` | Run database migrations |
| `db:setup` | Full database setup (migrate + init) |
| `db:init` | Initialize custom tables/fields |
| `cleanup` | Clean up old files |
| `backup:tama` | Backup TAMA files |
| `backup:dft` | Backup DFT files |
| `backup:all` | Backup all files |
| `storage:stats` | Show storage statistics |

---

## 🎓 Examples

### First Deployment

```bash
# 1. Deploy backend
gcloud run deploy maretinda-backend --image=...

# 2. Setup database
npm run cloud:run db:setup

# 3. Seed initial data (staging only!)
npm run cloud:run seed
```

### Update Migrations

```bash
# 1. Deploy new version
gcloud run deploy maretinda-backend --image=...

# 2. Run new migrations
npm run cloud:run db:migrate
```

### Emergency Cleanup

```bash
# Run locally first to test
npm run prod:run cleanup

# If successful, run on production
npm run cloud:run cleanup
```

### Check Storage Usage

```bash
npm run cloud:run storage:stats
```

---

## 📞 Need Help?

- **Full Documentation**: [CLOUD_RUN_COMMANDS.md](./CLOUD_RUN_COMMANDS.md)
- **Cloud SQL Setup**: [GOOGLE_CLOUD_SQL_SETUP.md](./GOOGLE_CLOUD_SQL_SETUP.md)
- **Database Guide**: [DATABASE_SETUP_GUIDE.md](./DATABASE_SETUP_GUIDE.md)

---

## ✅ Quick Checklist

Before running production commands:

- [ ] Backend is deployed to Cloud Run
- [ ] Database URL is in Secret Manager
- [ ] Service account has correct permissions
- [ ] Cloud SQL Proxy is installed (for local)
- [ ] `.env.production` created (for local)
- [ ] Tested command locally first
- [ ] Database backup exists (for destructive ops)

