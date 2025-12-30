# Running Commands on Cloud Run Services

This guide explains how to run one-off commands (migrations, seeds, scripts) on Cloud Run services.

## 📋 Table of Contents

1. [Cloud Run Jobs (Recommended)](#method-1-cloud-run-jobs-recommended)
2. [Cloud Build](#method-2-cloud-build)
3. [Admin API Endpoints](#method-3-admin-api-endpoints)
4. [Local Execution with Cloud SQL Proxy](#method-4-local-execution-with-cloud-sql-proxy)
5. [SSH into Cloud Shell](#method-5-cloud-shell)

---

## Method 1: Cloud Run Jobs (Recommended)

Cloud Run Jobs are purpose-built for running one-off tasks and scripts.

### Setup Cloud Run Job

Create a job configuration file:

```yaml
# job-config.yaml
apiVersion: run.googleapis.com/v1
kind: Job
metadata:
  name: maretinda-backend-job
spec:
  template:
    spec:
      template:
        spec:
          containers:
          - image: gcr.io/YOUR_PROJECT/maretinda-backend
            command: ["npm", "run", "seed"]
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: database-url
                  key: latest
            - name: NODE_ENV
              value: production
      serviceAccountName: YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com
```

### Create and Run Jobs

```bash
# 1. Create a job from your existing service image
gcloud run jobs create maretinda-seed \
  --image=gcr.io/YOUR_PROJECT/maretinda-backend \
  --command="npm" \
  --args="run,seed" \
  --region=asia-southeast1 \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets=DATABASE_URL=database-url:latest

# 2. Execute the job
gcloud run jobs execute maretinda-seed --region=asia-southeast1

# 3. View job logs
gcloud logging read "resource.type=cloud_run_job" --limit=50 --format=json
```

### Common Job Commands

```bash
# Run database migrations
gcloud run jobs create maretinda-migrate \
  --image=gcr.io/YOUR_PROJECT/maretinda-backend \
  --command="npm" \
  --args="run,db:migrate" \
  --region=asia-southeast1 \
  --set-secrets=DATABASE_URL=database-url:latest

# Run database setup
gcloud run jobs create maretinda-db-setup \
  --image=gcr.io/YOUR_PROJECT/maretinda-backend \
  --command="npm" \
  --args="run,db:setup" \
  --region=asia-southeast1 \
  --set-secrets=DATABASE_URL=database-url:latest

# Run custom script
gcloud run jobs create maretinda-cleanup \
  --image=gcr.io/YOUR_PROJECT/maretinda-backend \
  --command="npm" \
  --args="run,cleanup" \
  --region=asia-southeast1 \
  --set-secrets=DATABASE_URL=database-url:latest

# Execute any job
gcloud run jobs execute JOB_NAME --region=asia-southeast1
```

### Create a Helper Script

Create `scripts/run-job.sh`:

```bash
#!/bin/bash
# Helper script to run commands on Cloud Run

set -e

PROJECT_ID="your-project-id"
REGION="asia-southeast1"
IMAGE="gcr.io/${PROJECT_ID}/maretinda-backend"
JOB_NAME_PREFIX="maretinda-job"

# Check arguments
if [ $# -eq 0 ]; then
    echo "Usage: ./run-job.sh <npm-script-name> [additional-args...]"
    echo "Examples:"
    echo "  ./run-job.sh seed"
    echo "  ./run-job.sh db:migrate"
    echo "  ./run-job.sh db:setup"
    echo "  ./run-job.sh cleanup"
    exit 1
fi

SCRIPT_NAME=$1
shift
ADDITIONAL_ARGS="$@"

# Generate unique job name
TIMESTAMP=$(date +%s)
JOB_NAME="${JOB_NAME_PREFIX}-${SCRIPT_NAME//[:_]/-}-${TIMESTAMP}"

echo "Creating Cloud Run Job: $JOB_NAME"
echo "Command: npm run $SCRIPT_NAME $ADDITIONAL_ARGS"

# Build args array
ARGS="run,$SCRIPT_NAME"
if [ -n "$ADDITIONAL_ARGS" ]; then
    ARGS="$ARGS,$ADDITIONAL_ARGS"
fi

# Create and execute job
gcloud run jobs create "$JOB_NAME" \
  --image="$IMAGE" \
  --command="npm" \
  --args="$ARGS" \
  --region="$REGION" \
  --set-secrets=DATABASE_URL=database-url:latest \
  --set-env-vars="NODE_ENV=production" \
  --max-retries=0 \
  --task-timeout=10m \
  --execute-now \
  --wait

# Get logs
echo ""
echo "Job completed. Fetching logs..."
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=$JOB_NAME" \
  --limit=100 \
  --format="table(timestamp,textPayload)"

# Cleanup - delete the job after execution
echo ""
read -p "Delete job? (y/n): " DELETE_JOB
if [ "$DELETE_JOB" = "y" ]; then
    gcloud run jobs delete "$JOB_NAME" --region="$REGION" --quiet
    echo "Job deleted"
fi
```

Make it executable:

```bash
chmod +x scripts/run-job.sh
```

Usage:

```bash
# Run seed
./scripts/run-job.sh seed

# Run migrations
./scripts/run-job.sh db:migrate

# Run database setup
./scripts/run-job.sh db:setup

# Run cleanup
./scripts/run-job.sh cleanup
```

---

## Method 2: Cloud Build

Use Cloud Build to run commands as part of your CI/CD pipeline.

### Create a Cloud Build Configuration

Create `cloudbuild-commands.yaml`:

```yaml
steps:
  # Step 1: Run database migrations
  - name: 'gcr.io/$PROJECT_ID/maretinda-backend'
    entrypoint: 'npm'
    args: ['run', 'db:migrate']
    env:
    - 'NODE_ENV=production'
    secretEnv: ['DATABASE_URL']

  # Step 2: Run seed (optional, for staging)
  - name: 'gcr.io/$PROJECT_ID/maretinda-backend'
    entrypoint: 'npm'
    args: ['run', 'seed']
    env:
    - 'NODE_ENV=production'
    secretEnv: ['DATABASE_URL']

availableSecrets:
  secretManager:
  - versionName: projects/$PROJECT_ID/secrets/database-url/versions/latest
    env: 'DATABASE_URL'

timeout: 1200s
```

### Run Cloud Build

```bash
# Run migrations
gcloud builds submit --config=cloudbuild-commands.yaml --no-source

# Or create specific build configs
gcloud builds submit --config=cloudbuild-migrate.yaml --no-source
gcloud builds submit --config=cloudbuild-seed.yaml --no-source
```

### Automated Deployment with Commands

Create `cloudbuild.yaml` for full deployment:

```yaml
steps:
  # Build the image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/maretinda-backend', '.']

  # Push the image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/maretinda-backend']

  # Run migrations BEFORE deploying
  - name: 'gcr.io/$PROJECT_ID/maretinda-backend'
    entrypoint: 'npm'
    args: ['run', 'db:migrate']
    secretEnv: ['DATABASE_URL']
    env:
    - 'NODE_ENV=production'

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
    - 'run'
    - 'deploy'
    - 'maretinda-backend'
    - '--image=gcr.io/$PROJECT_ID/maretinda-backend'
    - '--region=asia-southeast1'
    - '--platform=managed'
    - '--set-secrets=DATABASE_URL=database-url:latest'

availableSecrets:
  secretManager:
  - versionName: projects/$PROJECT_ID/secrets/database-url/versions/latest
    env: 'DATABASE_URL'

images:
- 'gcr.io/$PROJECT_ID/maretinda-backend'

timeout: 1800s
```

---

## Method 3: Admin API Endpoints

Create secure admin endpoints to run commands via HTTP requests.

### Create Admin Endpoints

Add to `src/api/admin/commands/route.ts`:

```typescript
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// Secure this endpoint with admin authentication!
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { command, args } = req.body;

  // Validate admin access
  if (!req.auth?.actor_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Security: Only allow specific commands
  const allowedCommands = [
    "db:migrate",
    "seed",
    "cleanup",
    "backup:all",
    "storage:stats"
  ];

  if (!allowedCommands.includes(command)) {
    res.status(400).json({ error: "Command not allowed" });
    return;
  }

  try {
    const { exec } = require("child_process");
    const util = require("util");
    const execPromise = util.promisify(exec);

    // Execute command
    const { stdout, stderr } = await execPromise(`npm run ${command} ${args || ""}`);

    res.json({
      success: true,
      command,
      output: stdout,
      error: stderr || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      command,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

### Use the Admin Endpoint

```bash
# Get admin token first
ADMIN_TOKEN="your-admin-jwt-token"

# Run migration
curl -X POST https://your-backend.run.app/admin/commands \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command": "db:migrate"}'

# Run seed
curl -X POST https://your-backend.run.app/admin/commands \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command": "seed"}'
```

**⚠️ Security Warning:** This method exposes command execution via HTTP. Use with caution and strong authentication!

---

## Method 4: Local Execution with Cloud SQL Proxy

Run commands locally while connected to production database.

### Setup

```bash
# 1. Start Cloud SQL Proxy to production
./cloud-sql-proxy YOUR_PROJECT:REGION:INSTANCE &

# 2. Create production .env
cat > .env.production << EOF
DATABASE_URL=postgresql://user:password@127.0.0.1:5432/medusa
NODE_ENV=production
# ... other production vars
EOF

# 3. Run commands locally
NODE_ENV=production npm run db:migrate
NODE_ENV=production npm run seed

# Or load production env
export $(cat .env.production | xargs)
npm run db:migrate
npm run seed
```

### Create Helper Script

Create `scripts/run-production-command.sh`:

```bash
#!/bin/bash
# Run commands against production database

set -e

echo "⚠️  WARNING: Running command against PRODUCTION database"
read -p "Are you sure? (type 'yes' to continue): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted"
    exit 1
fi

# Check if proxy is running
if ! pgrep -f "cloud-sql-proxy" > /dev/null; then
    echo "Starting Cloud SQL Proxy..."
    ./cloud-sql-proxy YOUR_PROJECT:REGION:INSTANCE &
    sleep 3
fi

# Load production environment
export $(cat .env.production | xargs)

# Run command
echo "Running: npm run $@"
npm run "$@"

echo "✓ Command completed"
```

Usage:

```bash
chmod +x scripts/run-production-command.sh
./scripts/run-production-command.sh db:migrate
./scripts/run-production-command.sh seed
```

---

## Method 5: Cloud Shell

Use Google Cloud Shell to run commands interactively.

### Steps

1. Open [Google Cloud Shell](https://shell.cloud.google.com)

2. Clone your repository:
```bash
git clone YOUR_REPO_URL
cd maretinda2/backend
```

3. Install dependencies:
```bash
npm install
```

4. Set up environment:
```bash
# Get database URL from Secret Manager
DATABASE_URL=$(gcloud secrets versions access latest --secret=database-url)
export DATABASE_URL

# Set other variables
export NODE_ENV=production
export JWT_SECRET=$(gcloud secrets versions access latest --secret=jwt-secret)
# ... etc
```

5. Run commands:
```bash
npm run db:migrate
npm run seed
npm run cleanup
```

---

## Best Practices

### 1. Use Secrets for Database URL

```bash
# Store database URL in Secret Manager
echo -n "postgresql://user:pass@host/db" | gcloud secrets create database-url --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 2. Idempotent Scripts

Ensure your scripts can be run multiple times safely:

```typescript
// Example: Idempotent seed script
export async function seed() {
  // Check if data exists
  const existingData = await db.query("SELECT COUNT(*) FROM products");
  
  if (existingData.rows[0].count > 0) {
    console.log("Data already seeded. Skipping...");
    return;
  }
  
  // Seed data
  // ...
}
```

### 3. Logging

Always log command execution:

```typescript
console.log(`[${new Date().toISOString()}] Starting migration...`);
// ... run migration
console.log(`[${new Date().toISOString()}] Migration completed`);
```

### 4. Timeouts

Set appropriate timeouts for long-running jobs:

```bash
gcloud run jobs create JOB_NAME \
  --task-timeout=30m \  # 30 minutes max
  --max-retries=1
```

### 5. Environment-Specific Commands

```typescript
// package.json
{
  "scripts": {
    "db:migrate": "medusa db:migrate",
    "db:migrate:production": "NODE_ENV=production medusa db:migrate",
    "seed": "medusa exec ./src/scripts/seed.ts",
    "seed:production": "NODE_ENV=production medusa exec ./src/scripts/seed.ts"
  }
}
```

---

## Quick Reference

```bash
# Cloud Run Jobs (Recommended)
gcloud run jobs execute JOB_NAME --region=REGION

# Cloud Build
gcloud builds submit --config=cloudbuild-commands.yaml

# Local with Cloud SQL Proxy
./cloud-sql-proxy PROJECT:REGION:INSTANCE &
npm run COMMAND

# Cloud Shell
# Open shell.cloud.google.com and run commands directly
```

---

## Scheduled Tasks

For recurring tasks, use Cloud Scheduler with Cloud Run Jobs:

```bash
# Create a scheduled job (e.g., daily cleanup)
gcloud scheduler jobs create http cleanup-job \
  --location=asia-southeast1 \
  --schedule="0 3 * * *" \
  --uri="https://asia-southeast1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/YOUR_PROJECT/jobs/maretinda-cleanup:run" \
  --http-method=POST \
  --oauth-service-account-email=YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com
```

---

## Troubleshooting

### Job Failed

```bash
# View job execution history
gcloud run jobs executions list --job=JOB_NAME --region=REGION

# View specific execution logs
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=JOB_NAME" --limit=100
```

### Permission Denied

```bash
# Grant service account permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT \
  --member="serviceAccount:YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

### Timeout

Increase job timeout:

```bash
gcloud run jobs update JOB_NAME \
  --task-timeout=30m \
  --region=REGION
```

---

## Summary

**For one-off commands:** Use Cloud Run Jobs (Method 1)
**For CI/CD integration:** Use Cloud Build (Method 2)  
**For emergency access:** Use Cloud Shell (Method 5)
**For development:** Use Local with Proxy (Method 4)

**Avoid:** Method 3 (Admin endpoints) unless absolutely necessary and properly secured.

