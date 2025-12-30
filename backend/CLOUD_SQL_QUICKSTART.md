# 🚀 Google Cloud SQL Quick Start

Get your Medusa backend connected to Google Cloud SQL in minutes!

## 📋 Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed ([Download](https://cloud.google.com/sdk/docs/install))
3. **Node.js** 20+ and npm installed

## ⚡ Quick Setup (Automated)

The easiest way to set up Cloud SQL:

```bash
cd backend
./setup-cloud-sql.sh
```

This script will:
- ✅ Create a Cloud SQL PostgreSQL instance
- ✅ Create database and user
- ✅ Download and start Cloud SQL Proxy
- ✅ Generate `.env` file with connection details
- ✅ Test the connection

After the script completes:

```bash
# Initialize database
npm run db:setup

# Start development server
npm run dev
```

🎉 **Done!** Your backend is now connected to Google Cloud SQL.

## 📝 Manual Setup

If you prefer manual setup, see [GOOGLE_CLOUD_SQL_SETUP.md](./GOOGLE_CLOUD_SQL_SETUP.md) for detailed instructions.

## 🔧 Configuration Files

After setup, you'll have:

- **`.env`** - Environment variables with database connection
- **`.cloud-sql-info`** - Connection details for reference
- **`.cloud-sql-proxy.pid`** - Proxy process ID (for stopping)
- **`cloud-sql-proxy`** - The proxy binary (gitignored)

## 🎯 Common Tasks

### Start Cloud SQL Proxy

```bash
# If proxy is not running
./cloud-sql-proxy YOUR_PROJECT:REGION:INSTANCE_NAME &

# Or read from saved info
CONNECTION_NAME=$(grep CONNECTION_NAME .cloud-sql-info | cut -d= -f2)
./cloud-sql-proxy $CONNECTION_NAME &
```

### Stop Cloud SQL Proxy

```bash
# Using saved PID
kill $(cat .cloud-sql-proxy.pid)

# Or find and kill manually
pkill -f cloud-sql-proxy
```

### Connect with psql

```bash
# Read connection details from .env
psql postgresql://medusa_user:PASSWORD@127.0.0.1:5432/medusa
```

### View Database Tables

```bash
# Connect and list tables
psql postgresql://medusa_user:PASSWORD@127.0.0.1:5432/medusa -c "\dt"

# Check seller table structure
psql postgresql://medusa_user:PASSWORD@127.0.0.1:5432/medusa -c "\d seller"
```

### Create Backup

```bash
# Get instance name from .cloud-sql-info
INSTANCE_NAME=$(grep INSTANCE_NAME .cloud-sql-info | cut -d= -f2)

# Create backup
gcloud sql backups create --instance=$INSTANCE_NAME

# List backups
gcloud sql backups list --instance=$INSTANCE_NAME
```

### Check Instance Status

```bash
# Get instance details
gcloud sql instances describe $(grep INSTANCE_NAME .cloud-sql-info | cut -d= -f2)

# View logs
gcloud sql operations list --instance=$(grep INSTANCE_NAME .cloud-sql-info | cut -d= -f2)
```

## 🔐 Security Best Practices

### 1. Secure Your Passwords

Generate strong passwords:

```bash
# Generate random password
openssl rand -base64 32
```

### 2. Use Secret Manager (Production)

```bash
# Store database password in Secret Manager
echo -n "YOUR_PASSWORD" | gcloud secrets create db-password --data-file=-

# Retrieve password
gcloud secrets versions access latest --secret=db-password
```

### 3. Enable SSL (Production)

```bash
# Require SSL connections
gcloud sql instances patch YOUR_INSTANCE --require-ssl

# Update connection string in .env
DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/db?sslmode=require
```

## 🌐 Production Deployment

### Option 1: Cloud Run

```yaml
# cloud-run.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: maretinda-backend
  annotations:
    run.googleapis.com/cloudsql-instances: YOUR_PROJECT:REGION:INSTANCE
spec:
  template:
    spec:
      containers:
      - image: gcr.io/YOUR_PROJECT/maretinda-backend
        env:
        - name: DATABASE_URL
          value: postgresql://user:pass@/medusa?host=/cloudsql/YOUR_PROJECT:REGION:INSTANCE
```

Deploy:

```bash
gcloud run deploy maretinda-backend \
  --image gcr.io/YOUR_PROJECT/maretinda-backend \
  --add-cloudsql-instances YOUR_PROJECT:REGION:INSTANCE \
  --set-env-vars DATABASE_URL="postgresql://user:pass@/medusa?host=/cloudsql/YOUR_PROJECT:REGION:INSTANCE"
```

### Option 2: GKE (Kubernetes)

```yaml
# deployment.yaml
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
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: database-url
      - name: cloud-sql-proxy
        image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.8.2
        args:
        - "YOUR_PROJECT:REGION:INSTANCE"
```

### Option 3: App Engine

```yaml
# app.yaml
runtime: nodejs20
env: standard

env_variables:
  DATABASE_URL: postgresql://user:pass@/medusa?host=/cloudsql/YOUR_PROJECT:REGION:INSTANCE

beta_settings:
  cloud_sql_instances: YOUR_PROJECT:REGION:INSTANCE
```

## 📊 Monitoring and Alerts

### Set up monitoring

```bash
# Enable Query Insights
gcloud sql instances patch YOUR_INSTANCE \
  --insights-config-query-insights-enabled \
  --insights-config-query-string-length=1024

# View metrics in Cloud Console
# Navigate to: SQL > Your Instance > Monitoring
```

### Create alerts

```bash
# Alert on high CPU usage
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Cloud SQL High CPU" \
  --condition-display-name="CPU > 80%" \
  --condition-threshold-value=0.8 \
  --condition-threshold-duration=300s
```

## 💰 Cost Optimization

### Development Environment

```bash
# Use smallest tier for development
--tier=db-f1-micro

# Estimated cost: ~$7-10/month
```

### Production Environment

```bash
# Start with moderate resources
--tier=db-custom-2-8192  # 2 vCPU, 8GB RAM

# Enable auto-scaling for storage only
--storage-auto-increase

# Estimated cost: ~$100-150/month
```

### Cost-Saving Tips

1. **Stop instances during off-hours** (development)
2. **Use committed use discounts** (production)
3. **Enable storage auto-increase** (prevent over-provisioning)
4. **Monitor and optimize queries** (reduce CPU usage)
5. **Set up cost alerts** (avoid surprises)

## 🐛 Troubleshooting

### Connection Refused

```bash
# Check if proxy is running
ps aux | grep cloud-sql-proxy

# Restart proxy
pkill -f cloud-sql-proxy
./cloud-sql-proxy YOUR_PROJECT:REGION:INSTANCE &
```

### Authentication Failed

```bash
# Verify user exists
gcloud sql users list --instance=YOUR_INSTANCE

# Reset password
gcloud sql users set-password USERNAME \
  --instance=YOUR_INSTANCE \
  --password=NEW_PASSWORD
```

### Migration Errors

```bash
# Check database connection
npm run dev

# If connection works, try resetting migrations
rm -rf .medusa/migrations
medusa db:migrate
```

### Slow Queries

```bash
# Enable query logging
gcloud sql instances patch YOUR_INSTANCE \
  --database-flags=log_statement=all

# View logs
gcloud logging read "resource.type=cloudsql_database" --limit 50
```

## 📚 Resources

- [Google Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Cloud SQL Proxy Guide](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Medusa Documentation](https://docs.medusajs.com/)
- [Database Setup Guide](./DATABASE_SETUP_GUIDE.md)
- [Full Configuration Guide](./GOOGLE_CLOUD_SQL_SETUP.md)

## 🆘 Getting Help

### Check logs

```bash
# Backend logs
npm run dev

# Cloud SQL logs
gcloud logging read "resource.type=cloudsql_database" --limit 20

# Proxy logs
# Check terminal where proxy is running
```

### Test connection

```bash
# Test with psql
psql $DATABASE_URL -c "SELECT version();"

# Test with Node.js
node -e "const { Client } = require('pg'); const client = new Client({connectionString: process.env.DATABASE_URL}); client.connect().then(() => console.log('Connected!')).catch(console.error);"
```

## ✅ Checklist

After setup, verify:

- [ ] Cloud SQL instance is running
- [ ] Database and user are created
- [ ] Cloud SQL Proxy is running locally
- [ ] `.env` file has correct DATABASE_URL
- [ ] `npm run db:setup` completed successfully
- [ ] `npm run dev` starts without errors
- [ ] Can connect with psql
- [ ] Backups are configured

## 🎓 Next Steps

1. ✅ Set up environment variables for other services (Algolia, Resend, etc.)
2. ✅ Configure GiyaPay payment gateway
3. ✅ Test vendor bank information submission
4. ✅ Set up automated backups
5. ✅ Configure monitoring and alerts
6. ✅ Deploy to production environment

---

**Need more detailed instructions?** See [GOOGLE_CLOUD_SQL_SETUP.md](./GOOGLE_CLOUD_SQL_SETUP.md)

**Need environment variables help?** See [ENV_CONFIGURATION.md](./ENV_CONFIGURATION.md)

