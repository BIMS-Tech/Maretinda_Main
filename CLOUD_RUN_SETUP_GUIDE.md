# Cloud Run Setup Guide for Maretinda Backend

This guide explains how to run seed scripts and create admin users for your Maretinda backend deployed on Google Cloud Run.

## Overview

Your backend is deployed on Cloud Run and connected to Cloud SQL. To run one-time scripts like seeding the database or creating admin users, we use Cloud Run Jobs that execute against the same database.

## Prerequisites

1. **Google Cloud CLI installed and authenticated**
   ```bash
   gcloud auth login
   ```

2. **Required Environment Variables**
   ```bash
   export PROJECT_ID="your-project-id"
   export CLOUDSQL_INSTANCE="your-project:region:instance-name"
   export REGION="europe-west1"  # or your preferred region
   ```

## Quick Start

### 1. Make the script executable
```bash
chmod +x ./cloud-run-scripts.sh
```

### 2. Run database migrations (if needed)
```bash
PROJECT_ID=your-project CLOUDSQL_INSTANCE=your-project:region:instance ./cloud-run-scripts.sh migrate
```

### 3. Seed the database
```bash
PROJECT_ID=your-project CLOUDSQL_INSTANCE=your-project:region:instance ./cloud-run-scripts.sh seed
```

### 4. Create an admin user
```bash
PROJECT_ID=your-project CLOUDSQL_INSTANCE=your-project:region:instance ./cloud-run-scripts.sh admin
```

### 5. Check service status
```bash
PROJECT_ID=your-project ./cloud-run-scripts.sh status
```

## Available Commands

| Command | Description |
|---------|-------------|
| `migrate` | Run database migrations |
| `seed` | Seed database with initial data (categories, sample seller, products) |
| `admin` | Create an admin user for the admin panel |
| `status` | Show service status and URLs |
| `logs` | Show recent service logs |
| `help` | Show help message |

## What the Seed Script Creates

The seed script will create:

- ✅ **Default sales channel and regions**
- ✅ **Product categories** (Electronics, Fashion, Home & Garden, etc.)
- ✅ **Product collections** (New Arrivals, Best Sellers, etc.)
- ✅ **Sample seller account**
  - Email: `seller@mercurjs.com`
  - Password: `secret`
- ✅ **Sample products with inventory**
- ✅ **Configuration rules and commission settings**
- ✅ **Publishable API key for storefront**

## Admin User Creation

The admin script creates a user that can access the admin panel at `https://your-service-url/app`.

Default credentials (you can customize):
- Email: `admin@maretinda.com`
- Password: `admin123`

## Service URLs

After deployment, your services are available at:

- **Main API**: `https://your-service-url`
- **Admin Panel**: `https://your-service-url/app`
- **Vendor Panel**: `https://your-service-url/vendor`
- **API Documentation**: `https://your-service-url/docs`

## Troubleshooting

### 1. Authentication Issues
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. Cloud SQL Connection Issues
Make sure your Cloud SQL instance is running and the connection string is correct:
```bash
gcloud sql instances list
```

### 3. Check Service Logs
```bash
./cloud-run-scripts.sh logs
```

### 4. Verify Environment Variables
```bash
echo $PROJECT_ID
echo $CLOUDSQL_INSTANCE
```

### 5. Manual Job Execution
If the script fails, you can manually create and run a job:

```bash
# Create a job for seeding
gcloud run jobs create maretinda-backend-seed \
    --image=gcr.io/$PROJECT_ID/maretinda-backend:latest \
    --region=$REGION \
    --set-cloudsql-instances=$CLOUDSQL_INSTANCE \
    --set-secrets=DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,COOKIE_SECRET=COOKIE_SECRET:latest \
    --set-env-vars=NODE_ENV=production \
    --memory=2Gi \
    --cpu=2 \
    --command="node" \
    --args="/workspace/mercur/node_modules/@medusajs/cli/cli.js,exec,./src/scripts/seed.ts"

# Execute the job
gcloud run jobs execute maretinda-backend-seed --region=$REGION --wait
```

## Security Notes

1. **Admin Credentials**: Change default admin credentials after first login
2. **Environment Variables**: Keep sensitive environment variables in Google Secret Manager
3. **Database Access**: Ensure Cloud SQL is properly secured with authorized networks
4. **API Keys**: Rotate API keys regularly

## Example Usage

Based on your `cloudbuild.yaml`, here are the exact commands for your setup:

```bash
# Set your environment variables
export PROJECT_ID="your-actual-project-id"
export CLOUDSQL_INSTANCE="maretinda-test:europe-west1:maretinda-test"
export REGION="europe-west1"

# Run migrations first (if needed)
./cloud-run-scripts.sh migrate

# Seed the database
./cloud-run-scripts.sh seed

# Create admin user
./cloud-run-scripts.sh admin

# Check status
./cloud-run-scripts.sh status
```

## Next Steps

After running the seed script:

1. **Access Admin Panel**: Go to `https://your-service-url/app` and login with admin credentials
2. **Access Vendor Panel**: Go to `https://your-service-url/vendor` and login with seller credentials
3. **Configure Storefront**: Use the publishable API key (shown in seed output) in your storefront
4. **Set up Payment Providers**: Configure Stripe Connect and GiyaPay in the admin panel
5. **Configure Email**: Set up Resend for email notifications

## Support

If you encounter issues:

1. Check the logs: `./cloud-run-scripts.sh logs`
2. Verify your environment variables
3. Ensure Cloud SQL instance is running
4. Check Cloud Run service status: `./cloud-run-scripts.sh status`

---

**Important**: Always backup your database before running seed scripts in production!
