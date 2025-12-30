# Google Cloud SQL Setup Guide

This guide will help you set up and connect your Medusa backend to Google Cloud SQL (PostgreSQL).

## Step 1: Create a Cloud SQL Instance

### 1.1 Using Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **SQL** in the left menu
3. Click **CREATE INSTANCE**
4. Select **PostgreSQL**
5. Choose your instance ID (e.g., `maretinda-db`)
6. Set a strong password for the `postgres` user
7. Choose your region (e.g., `asia-southeast1` for Singapore)
8. Configure instance settings:
   - **Machine type**: Shared core (for dev) or Dedicated (for production)
   - **Storage**: Start with 10GB SSD (auto-increase enabled)
   - **Availability**: Single zone (dev) or High availability (production)
9. Click **CREATE INSTANCE**

### 1.2 Using gcloud CLI (Alternative)

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Create Cloud SQL instance
gcloud sql instances create maretinda-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-southeast1 \
  --root-password=YOUR_STRONG_PASSWORD \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase
```

## Step 2: Create a Database

Once your instance is created:

```bash
# Create the database
gcloud sql databases create medusa --instance=maretinda-db

# Or using psql
gcloud sql connect maretinda-db --user=postgres
# Then in psql:
CREATE DATABASE medusa;
```

## Step 3: Create a Database User (Optional but Recommended)

```bash
# Create a dedicated user for your app
gcloud sql users create medusa_user \
  --instance=maretinda-db \
  --password=YOUR_APP_PASSWORD

# Grant privileges
gcloud sql connect maretinda-db --user=postgres
# In psql:
GRANT ALL PRIVILEGES ON DATABASE medusa TO medusa_user;
```

## Step 4: Configure Connection

### Option A: Public IP Connection (Simplest)

#### 4.1 Add your IP to authorized networks

```bash
# Get your current IP
curl ifconfig.me

# Add it to Cloud SQL
gcloud sql instances patch maretinda-db \
  --authorized-networks=YOUR_IP_ADDRESS
```

#### 4.2 Get Connection String

```bash
# Get your Cloud SQL instance IP
gcloud sql instances describe maretinda-db --format="value(ipAddresses.ipAddress)"
```

Your connection string will be:
```
postgresql://medusa_user:YOUR_APP_PASSWORD@INSTANCE_IP:5432/medusa
```

### Option B: Cloud SQL Proxy (More Secure - Recommended)

#### 4.1 Download Cloud SQL Proxy

```bash
# macOS (Intel)
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.2/cloud-sql-proxy.darwin.amd64

# macOS (Apple Silicon)
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.2/cloud-sql-proxy.darwin.arm64

# Linux
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.2/cloud-sql-proxy.linux.amd64

# Make it executable
chmod +x cloud-sql-proxy
```

#### 4.2 Get Instance Connection Name

```bash
gcloud sql instances describe maretinda-db --format="value(connectionName)"
# Output format: PROJECT_ID:REGION:INSTANCE_NAME
# Example: maretinda-prod:asia-southeast1:maretinda-db
```

#### 4.3 Start the Proxy

```bash
# Start proxy in background
./cloud-sql-proxy YOUR_CONNECTION_NAME &

# Or with a custom port
./cloud-sql-proxy YOUR_CONNECTION_NAME --port 5432
```

Your connection string will be:
```
postgresql://medusa_user:YOUR_APP_PASSWORD@127.0.0.1:5432/medusa
```

### Option C: Unix Socket (For App Engine / Cloud Run)

When deploying to App Engine or Cloud Run, use Unix socket:

```
postgresql://medusa_user:YOUR_APP_PASSWORD@/medusa?host=/cloudsql/YOUR_CONNECTION_NAME
```

## Step 5: Update Your Environment Variables

Create or update your `.env` file in the backend directory:

```bash
# Database Configuration
DATABASE_URL=postgresql://medusa_user:YOUR_APP_PASSWORD@INSTANCE_IP:5432/medusa

# Or if using Cloud SQL Proxy:
DATABASE_URL=postgresql://medusa_user:YOUR_APP_PASSWORD@127.0.0.1:5432/medusa

# CORS Settings
STORE_CORS=http://localhost:3000,https://yourdomain.com
ADMIN_CORS=http://localhost:3001,https://admin.yourdomain.com
VENDOR_CORS=http://localhost:3002,https://vendor.yourdomain.com
AUTH_CORS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Secrets
JWT_SECRET=your-random-jwt-secret-here
COOKIE_SECRET=your-random-cookie-secret-here

# Other services (if applicable)
ALGOLIA_API_KEY=your-algolia-key
ALGOLIA_APP_ID=your-algolia-app-id
RESEND_API_KEY=your-resend-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## Step 6: Initialize the Database

```bash
# Install dependencies (if not done)
npm install

# Run database migrations and setup
npm run db:setup

# This will:
# 1. Run Medusa core migrations
# 2. Create custom tables (TAMA, DFT, GiyaPay)
# 3. Add bank/settlement fields
# 4. Create indexes
```

## Step 7: Verify Connection

```bash
# Test the connection
npm run dev

# You should see:
# ✔ Database connection established
# ✔ Migrations completed
# ✔ Server started on port 9000
```

## Step 8: Seed Sample Data (Optional)

```bash
npm run seed
```

## Production Deployment

### For Cloud Run / App Engine

1. **Update app.yaml or cloudbuild.yaml** with environment variables
2. **Use Cloud SQL connection name** (Unix socket)
3. **Add Cloud SQL connection** in deployment configuration

Example for Cloud Run:

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: maretinda-backend
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cloudsql-instances: YOUR_CONNECTION_NAME
    spec:
      containers:
      - image: gcr.io/YOUR_PROJECT/maretinda-backend
        env:
        - name: DATABASE_URL
          value: postgresql://medusa_user:PASSWORD@/medusa?host=/cloudsql/YOUR_CONNECTION_NAME
```

### For GKE (Kubernetes)

Use the Cloud SQL Proxy sidecar pattern:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: maretinda-backend
spec:
  template:
    spec:
      containers:
      - name: app
        image: gcr.io/YOUR_PROJECT/maretinda-backend
        env:
        - name: DATABASE_URL
          value: postgresql://medusa_user:PASSWORD@127.0.0.1:5432/medusa
      - name: cloud-sql-proxy
        image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.8.2
        args:
        - "--structured-logs"
        - "YOUR_CONNECTION_NAME"
```

## Security Best Practices

### 1. Use Secret Manager for Sensitive Data

```bash
# Store database password
echo -n "YOUR_PASSWORD" | gcloud secrets create db-password --data-file=-

# Grant access to your service account
gcloud secrets add-iam-policy-binding db-password \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

### 2. Enable SSL/TLS

```bash
# Require SSL connections
gcloud sql instances patch maretinda-db --require-ssl

# Download server certificate
gcloud sql ssl-certs create client-cert cert.pem --instance=maretinda-db
gcloud sql ssl-certs describe client-cert --instance=maretinda-db --format="value(cert)" > server-ca.pem

# Update connection string
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require&sslrootcert=server-ca.pem
```

### 3. Use Private IP (Production)

For production, use VPC peering with Private IP:

```bash
gcloud sql instances patch maretinda-db \
  --network=projects/YOUR_PROJECT/global/networks/default \
  --no-assign-ip
```

## Backup Configuration

Cloud SQL automatically backs up your database. Configure backup settings:

```bash
# Enable automated backups
gcloud sql instances patch maretinda-db \
  --backup-start-time=03:00 \
  --retained-backups-count=7

# Create manual backup
gcloud sql backups create --instance=maretinda-db
```

## Monitoring

### Enable Cloud SQL Insights

```bash
gcloud sql instances patch maretinda-db \
  --insights-config-query-insights-enabled \
  --insights-config-query-string-length=1024
```

### View Metrics

- Go to Cloud Console → SQL → Your Instance → Monitoring
- Monitor: CPU, Memory, Connections, Storage

## Troubleshooting

### Connection Timeout

```bash
# Check if instance is running
gcloud sql instances describe maretinda-db --format="value(state)"

# Check authorized networks
gcloud sql instances describe maretinda-db --format="value(settings.ipConfiguration.authorizedNetworks)"
```

### Permission Denied

```bash
# Verify user permissions
gcloud sql connect maretinda-db --user=postgres
# In psql:
\du
\l
```

### SSL Certificate Error

```bash
# Download fresh certificates
gcloud sql ssl-certs create new-cert new-cert.pem --instance=maretinda-db
```

## Cost Optimization

1. **Development**: Use `db-f1-micro` or `db-g1-small` shared-core instances
2. **Production**: Start with `db-custom-2-8192` (2 vCPU, 8GB RAM)
3. **Enable auto-scaling**: Storage will grow automatically
4. **Use scheduled scaling**: Scale down during off-hours
5. **Monitor costs**: Set up billing alerts

## Quick Reference Commands

```bash
# Connect to database
gcloud sql connect maretinda-db --user=medusa_user --database=medusa

# View connection details
gcloud sql instances describe maretinda-db

# List backups
gcloud sql backups list --instance=maretinda-db

# Restore from backup
gcloud sql backups restore BACKUP_ID --backup-instance=maretinda-db --backup-instance=maretinda-db

# View logs
gcloud sql operations list --instance=maretinda-db
gcloud logging read "resource.type=cloudsql_database AND resource.labels.database_id=YOUR_PROJECT:maretinda-db"
```

## Next Steps

After setting up Cloud SQL:

1. ✅ Run database migrations: `npm run db:setup`
2. ✅ Test local connection with Cloud SQL Proxy
3. ✅ Configure production deployment with Unix socket
4. ✅ Set up automated backups
5. ✅ Configure monitoring and alerts
6. ✅ Test application thoroughly

## Support

- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Cloud SQL Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Connection Options](https://cloud.google.com/sql/docs/postgres/connect-overview)

