#!/bin/bash

# Fix Cloud Run Deployment Issues
# This script will help resolve the current deployment problems

set -e

# Configuration
PROJECT_ID="maretinda-test"  # From your gcloud auth
REGION="europe-west1"
SERVICE_NAME="medusa-backend"  # Actual service name from logs
CLOUDSQL_INSTANCE="maretinda-test:europe-west1:maretinda-test"
DATABASE_URL="postgres://maretinda-db-test-user-1:Maretinda169831%23@35.187.58.154:5432/maretindadb"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Function to fix environment variables
fix_environment_variables() {
    print_info "Setting up environment variables for Cloud Run service..."
    
    print_warning "You need to set these environment variables in Google Cloud Console:"
    print_info "Go to: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/variables"
    
    echo ""
    echo "Required Environment Variables:"
    echo "================================"
    echo "NODE_ENV=production"
    echo "ADMIN_CORS=*"
    echo "STORE_CORS=*"
    echo "VENDOR_CORS=*"
    echo "AUTH_CORS=*"
    echo ""
    echo "Required Secrets (from Secret Manager):"
    echo "======================================"
    echo "DATABASE_URL"
    echo "JWT_SECRET"
    echo "COOKIE_SECRET"
    echo "STRIPE_SECRET_API_KEY"
    echo "STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET"
    echo "ALGOLIA_API_KEY"
    echo "ALGOLIA_APP_ID"
    echo "RESEND_API_KEY"
    echo "RESEND_FROM_EMAIL"
    echo "GIYAPAY_MERCHANT_ID (optional)"
    echo "GIYAPAY_MERCHANT_SECRET (optional)"
    echo "GIYAPAY_SANDBOX_MODE (optional)"
    echo ""
    
    read -p "Have you set all environment variables in Cloud Console? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Please set the environment variables first, then run this script again."
        return 1
    fi
}

# Function to check service status
check_service_status() {
    print_info "Checking service status..."
    
    local service_url=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)" 2>/dev/null)
    
    if [ -n "$service_url" ]; then
        print_info "Service URL: $service_url"
        
        # Test if service is responding
        if curl -s --max-time 10 "$service_url/health" > /dev/null 2>&1; then
            print_success "Service is healthy and responding!"
        else
            print_warning "Service exists but may not be responding to health checks"
        fi
    else
        print_error "Service not found"
        return 1
    fi
}

# Function to check logs
check_logs() {
    print_info "Recent service logs:"
    echo "===================="
    gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=10
}

# Function to redeploy with fixes
redeploy_service() {
    print_info "Redeploying service with proper configuration..."
    
    # Trigger a new deployment
    gcloud run deploy $SERVICE_NAME \
        --image=gcr.io/$PROJECT_ID/maretinda-backend:latest \
        --region=$REGION \
        --platform=managed \
        --allow-unauthenticated \
        --memory=2Gi \
        --cpu=2 \
        --max-instances=10 \
        --min-instances=0 \
        --port=9000 \
        --timeout=900 \
        --set-cloudsql-instances=$CLOUDSQL_INSTANCE \
        --set-env-vars=NODE_ENV=production,ADMIN_CORS=*,STORE_CORS=*,VENDOR_CORS=*,AUTH_CORS=* \
        --set-secrets=DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,COOKIE_SECRET=COOKIE_SECRET:latest,STRIPE_SECRET_API_KEY=STRIPE_SECRET_API_KEY:latest,STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET=STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET:latest,ALGOLIA_API_KEY=ALGOLIA_API_KEY:latest,ALGOLIA_APP_ID=ALGOLIA_APP_ID:latest,RESEND_API_KEY=RESEND_API_KEY:latest,RESEND_FROM_EMAIL=RESEND_FROM_EMAIL:latest
    
    if [ $? -eq 0 ]; then
        print_success "Service redeployed successfully!"
    else
        print_error "Deployment failed!"
        return 1
    fi
}

# Function to run seed script (updated for correct service name)
run_seed_script() {
    print_info "Running seed script on Cloud Run..."
    
    # Create and run seed job
    gcloud run jobs create ${SERVICE_NAME}-seed \
        --image=europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/maretinda_main/medusa-backend:latest \
        --region=$REGION \
        --set-env-vars=NODE_ENV=production,DATABASE_URL="$DATABASE_URL",JWT_SECRET=supersecret,COOKIE_SECRET=supersecret \
        --memory=2Gi \
        --cpu=2 \
        --max-retries=1 \
        --parallelism=1 \
        --task-count=1 \
        --command="yarn" \
        --args="exec,./src/scripts/seed.ts" \
        --replace 2>/dev/null || true
    
    gcloud run jobs execute ${SERVICE_NAME}-seed --region=$REGION --wait
    
    if [ $? -eq 0 ]; then
        print_success "Seed script completed successfully!"
    else
        print_error "Seed script failed!"
        return 1
    fi
}

# Function to create admin user (updated for correct service name)
create_admin_user() {
    print_info "Creating admin user..."
    
    read -p "Enter admin email (default: admin@maretinda.com): " admin_email
    admin_email=${admin_email:-admin@maretinda.com}
    
    read -s -p "Enter admin password (default: admin123): " admin_password
    echo
    admin_password=${admin_password:-admin123}
    
    gcloud run jobs create ${SERVICE_NAME}-create-admin \
        --image=europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/maretinda_main/medusa-backend:latest \
        --region=$REGION \
        --set-env-vars=NODE_ENV=production,DATABASE_URL="$DATABASE_URL",JWT_SECRET=supersecret,COOKIE_SECRET=supersecret,ADMIN_EMAIL=$admin_email,ADMIN_PASSWORD=$admin_password \
        --memory=2Gi \
        --cpu=2 \
        --max-retries=1 \
        --parallelism=1 \
        --task-count=1 \
        --command="yarn" \
        --args="exec,./src/scripts/create-admin.ts" \
        --replace 2>/dev/null || true
    
    gcloud run jobs execute ${SERVICE_NAME}-create-admin --region=$REGION --wait
    
    if [ $? -eq 0 ]; then
        print_success "Admin user created successfully!"
        print_info "Credentials: $admin_email / $admin_password"
    else
        print_error "Failed to create admin user!"
        return 1
    fi
}

# Function to show help
show_help() {
    echo "Cloud Run Fix Script for Maretinda Backend"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  check       Check current service status and logs"
    echo "  fix-env     Guide to fix environment variables"
    echo "  redeploy    Redeploy service with correct configuration"
    echo "  seed        Run database seed script"
    echo "  admin       Create admin user"
    echo "  help        Show this help message"
    echo ""
    echo "Service Details:"
    echo "  Project: $PROJECT_ID"
    echo "  Region: $REGION"
    echo "  Service: $SERVICE_NAME"
    echo "  URL: https://$SERVICE_NAME-908343727691.europe-west1.run.app"
}

# Main function
main() {
    case "${1:-help}" in
        check)
            check_service_status
            echo ""
            check_logs
            ;;
        fix-env)
            fix_environment_variables
            ;;
        redeploy)
            redeploy_service
            ;;
        seed)
            run_seed_script
            ;;
        admin)
            create_admin_user
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
