# Environment Configuration

Copy this content to create your `.env` file in the backend directory.

```bash
# Quick setup
cd backend
nano .env
# Or
code .env
```

## Complete .env Template

```env
# =================================================================
# GOOGLE CLOUD SQL DATABASE CONFIGURATION
# =================================================================

# Option 1: Direct connection (with authorized network)
# DATABASE_URL=postgresql://medusa_user:YOUR_PASSWORD@CLOUD_SQL_IP:5432/medusa

# Option 2: Cloud SQL Proxy (recommended for local development)
# DATABASE_URL=postgresql://medusa_user:YOUR_PASSWORD@127.0.0.1:5432/medusa

# Option 3: Unix Socket (for Cloud Run / App Engine)
# DATABASE_URL=postgresql://medusa_user:YOUR_PASSWORD@/medusa?host=/cloudsql/PROJECT:REGION:INSTANCE

# Current configuration (update with your values)
DATABASE_URL=postgresql://postgres:password@localhost:5432/medusa


# =================================================================
# CORS CONFIGURATION
# =================================================================

# Storefront URLs (B2C Marketplace)
STORE_CORS=http://localhost:3000,http://localhost:8000,https://yourdomain.com

# Admin Panel URLs
ADMIN_CORS=http://localhost:3001,http://localhost:7001,https://admin.yourdomain.com

# Vendor Panel URLs
VENDOR_CORS=http://localhost:3002,http://localhost:5173,https://vendor.yourdomain.com

# Auth CORS (combine all)
AUTH_CORS=http://localhost:3000,http://localhost:3001,http://localhost:3002


# =================================================================
# SECURITY SECRETS
# =================================================================

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=supersecret

# Cookie Secret (generate with: openssl rand -base64 32)
COOKIE_SECRET=supersecret


# =================================================================
# ALGOLIA SEARCH CONFIGURATION
# =================================================================

ALGOLIA_APP_ID=your_algolia_app_id
ALGOLIA_API_KEY=your_algolia_api_key


# =================================================================
# EMAIL SERVICE (RESEND)
# =================================================================

RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com


# =================================================================
# GIYAPAY PAYMENT CONFIGURATION
# =================================================================
# Note: GiyaPay config is stored in database via admin panel
# These are fallback/default values

GIYAPAY_MERCHANT_ID=your_merchant_id
GIYAPAY_MERCHANT_SECRET=your_merchant_secret
GIYAPAY_SANDBOX_MODE=true


# =================================================================
# GOOGLE CLOUD STORAGE CONFIGURATION
# =================================================================

# Path to service account key (relative to backend folder)
GOOGLE_APPLICATION_CREDENTIALS=./config/gcs-key.json

# GCS Bucket name for file uploads
GCS_BUCKET_NAME=your-bucket-name


# =================================================================
# SERVER CONFIGURATION
# =================================================================

# Node environment
NODE_ENV=development

# Server port
PORT=9000

# Backend URL (for callbacks and webhooks)
BACKEND_URL=http://localhost:9000


# =================================================================
# MEDUSA ADMIN
# =================================================================

# Admin panel configuration (auto-generated, usually no need to change)
MEDUSA_ADMIN_ONBOARDING_TYPE=default
MEDUSA_ADMIN_ONBOARDING_NEXTJS_DIRECTORY=


# =================================================================
# OPTIONAL: REDIS (for production caching)
# =================================================================

# Uncomment if using Redis for caching instead of in-memory
# REDIS_URL=redis://localhost:6379


# =================================================================
# OPTIONAL: EVENT BUS (for production)
# =================================================================

# Uncomment if using Redis for event bus instead of local
# EVENT_BUS_REDIS_URL=redis://localhost:6379


# =================================================================
# DEVELOPMENT/DEBUG
# =================================================================

# Log level (error, warn, info, debug)
LOG_LEVEL=info

# Enable SQL query logging (true/false)
# LOG_SQL=true
```

## Step-by-Step Setup

### 1. Create Cloud SQL Instance

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Create instance
gcloud sql instances create maretinda-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-southeast1 \
  --root-password=YOUR_STRONG_PASSWORD

# Create database
gcloud sql databases create medusa --instance=maretinda-db

# Create user
gcloud sql users create medusa_user \
  --instance=maretinda-db \
  --password=YOUR_APP_PASSWORD
```

### 2. Connect Using Cloud SQL Proxy

```bash
# Download proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.2/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy

# Get connection name
gcloud sql instances describe maretinda-db --format="value(connectionName)"
# Example output: your-project:asia-southeast1:maretinda-db

# Start proxy
./cloud-sql-proxy your-project:asia-southeast1:maretinda-db &
```

### 3. Update .env File

```bash
cd backend

# Create .env from template
cat > .env << 'EOF'
DATABASE_URL=postgresql://medusa_user:YOUR_APP_PASSWORD@127.0.0.1:5432/medusa
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:3001
VENDOR_CORS=http://localhost:5173
AUTH_CORS=http://localhost:3000,http://localhost:3001,http://localhost:5173
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
NODE_ENV=development
PORT=9000
EOF
```

### 4. Initialize Database

```bash
# Install dependencies
npm install

# Run migrations and setup
npm run db:setup

# Start server
npm run dev
```

## Quick Commands Reference

```bash
# Connect to database
gcloud sql connect maretinda-db --user=medusa_user --database=medusa

# View instance details
gcloud sql instances describe maretinda-db

# Create backup
gcloud sql backups create --instance=maretinda-db

# List backups
gcloud sql backups list --instance=maretinda-db
```

## Troubleshooting

### Connection Refused

Make sure Cloud SQL Proxy is running:
```bash
ps aux | grep cloud-sql-proxy
# If not running, start it:
./cloud-sql-proxy your-project:asia-southeast1:maretinda-db &
```

### Authentication Failed

Verify credentials:
```bash
gcloud sql users list --instance=maretinda-db
```

### Database Not Found

Create the database:
```bash
gcloud sql databases create medusa --instance=maretinda-db
```

## Production Environment

For production deployment, use Unix socket connection:

```env
DATABASE_URL=postgresql://medusa_user:PASSWORD@/medusa?host=/cloudsql/your-project:asia-southeast1:maretinda-db
```

And configure your Cloud Run/App Engine to connect to Cloud SQL:

```yaml
# cloud-run.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: maretinda-backend
  annotations:
    run.googleapis.com/cloudsql-instances: your-project:asia-southeast1:maretinda-db
```

