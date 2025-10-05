#!/bin/bash

# Cloud Run Scripts for Maretinda Backend
# This script helps you run seed scripts and create admin users on your Cloud Run deployment

set -e

# Configuration
PROJECT_ID=${PROJECT_ID:-"your-project-id"}
REGION=${REGION:-"europe-west1"}
SERVICE_NAME="maretinda-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if gcloud is authenticated
check_auth() {
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "You are not authenticated with gcloud. Please run 'gcloud auth login' first."
        exit 1
    fi
}

# Function to get the Cloud Run service URL
get_service_url() {
    gcloud run services describe $SERVICE_NAME \
        --region=$REGION \
        --format="value(status.url)" 2>/dev/null || echo ""
}

# Function to run a script on Cloud Run
run_cloud_run_script() {
    local script_name=$1
    local description=$2
    
    print_info "Running $description on Cloud Run..."
    
    # Execute the script using Cloud Run Jobs (one-time execution)
    gcloud run jobs create ${SERVICE_NAME}-${script_name} \
        --image=gcr.io/$PROJECT_ID/maretinda-backend:latest \
        --region=$REGION \
        --set-cloudsql-instances=$CLOUDSQL_INSTANCE \
        --set-secrets=DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,COOKIE_SECRET=COOKIE_SECRET:latest,STRIPE_SECRET_API_KEY=STRIPE_SECRET_API_KEY:latest,STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET=STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET:latest,ALGOLIA_API_KEY=ALGOLIA_API_KEY:latest,ALGOLIA_APP_ID=ALGOLIA_APP_ID:latest,RESEND_API_KEY=RESEND_API_KEY:latest,RESEND_FROM_EMAIL=RESEND_FROM_EMAIL:latest \
        --set-env-vars=NODE_ENV=production \
        --memory=2Gi \
        --cpu=2 \
        --max-retries=1 \
        --parallelism=1 \
        --task-count=1 \
        --command="node" \
        --args="/workspace/mercur/node_modules/@medusajs/cli/cli.js,exec,./src/scripts/${script_name}.ts" \
        --replace 2>/dev/null || true
    
    # Execute the job
    print_info "Executing the job..."
    gcloud run jobs execute ${SERVICE_NAME}-${script_name} \
        --region=$REGION \
        --wait
    
    if [ $? -eq 0 ]; then
        print_success "$description completed successfully!"
    else
        print_error "$description failed!"
        return 1
    fi
}

# Function to run database migrations
run_migrations() {
    print_info "Running database migrations on Cloud Run..."
    
    gcloud run jobs create ${SERVICE_NAME}-migrate \
        --image=gcr.io/$PROJECT_ID/maretinda-backend:latest \
        --region=$REGION \
        --set-cloudsql-instances=$CLOUDSQL_INSTANCE \
        --set-secrets=DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,COOKIE_SECRET=COOKIE_SECRET:latest \
        --set-env-vars=NODE_ENV=production \
        --memory=2Gi \
        --cpu=2 \
        --max-retries=1 \
        --parallelism=1 \
        --task-count=1 \
        --command="node" \
        --args="/workspace/mercur/node_modules/@medusajs/cli/cli.js,db:migrate" \
        --replace 2>/dev/null || true
    
    gcloud run jobs execute ${SERVICE_NAME}-migrate \
        --region=$REGION \
        --wait
    
    if [ $? -eq 0 ]; then
        print_success "Database migrations completed successfully!"
    else
        print_error "Database migrations failed!"
        return 1
    fi
}

# Function to seed the database
seed_database() {
    print_info "This will seed your database with initial data including:"
    print_info "- Default sales channel and regions"
    print_info "- Product categories and collections"
    print_info "- Sample seller account (seller@mercurjs.com / secret)"
    print_info "- Sample products and inventory"
    print_info "- Configuration rules"
    
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Seeding cancelled."
        return 0
    fi
    
    run_cloud_run_script "seed" "Database seeding"
}

# Function to create admin user
create_admin() {
    print_info "Creating admin user..."
    
    # Prompt for admin credentials
    read -p "Enter admin email (default: admin@maretinda.com): " admin_email
    admin_email=${admin_email:-admin@maretinda.com}
    
    read -s -p "Enter admin password (default: admin123): " admin_password
    echo
    admin_password=${admin_password:-admin123}
    
    # Create a temporary job with admin credentials
    gcloud run jobs create ${SERVICE_NAME}-create-admin \
        --image=gcr.io/$PROJECT_ID/maretinda-backend:latest \
        --region=$REGION \
        --set-cloudsql-instances=$CLOUDSQL_INSTANCE \
        --set-secrets=DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,COOKIE_SECRET=COOKIE_SECRET:latest \
        --set-env-vars=NODE_ENV=production,ADMIN_EMAIL=$admin_email,ADMIN_PASSWORD=$admin_password \
        --memory=2Gi \
        --cpu=2 \
        --max-retries=1 \
        --parallelism=1 \
        --task-count=1 \
        --command="node" \
        --args="/workspace/mercur/node_modules/@medusajs/cli/cli.js,exec,./src/scripts/create-admin.ts" \
        --replace 2>/dev/null || true
    
    gcloud run jobs execute ${SERVICE_NAME}-create-admin \
        --region=$REGION \
        --wait
    
    if [ $? -eq 0 ]; then
        print_success "Admin user created successfully!"
        print_info "Admin credentials:"
        print_info "Email: $admin_email"
        print_info "Password: $admin_password"
    else
        print_error "Failed to create admin user!"
        return 1
    fi
}

# Function to show service status
show_status() {
    local service_url=$(get_service_url)
    
    if [ -n "$service_url" ]; then
        print_success "Service is running at: $service_url"
        print_info "Admin panel: $service_url/app"
        print_info "Vendor panel: $service_url/vendor"
        print_info "API docs: $service_url/docs"
    else
        print_error "Service not found or not running"
    fi
}

# Function to show logs
show_logs() {
    print_info "Fetching recent logs..."
    gcloud run services logs read $SERVICE_NAME \
        --region=$REGION \
        --limit=50
}

# Function to show help
show_help() {
    echo "Cloud Run Scripts for Maretinda Backend"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  migrate     Run database migrations"
    echo "  seed        Seed the database with initial data"
    echo "  admin       Create an admin user"
    echo "  status      Show service status and URLs"
    echo "  logs        Show recent service logs"
    echo "  help        Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  PROJECT_ID           Google Cloud Project ID"
    echo "  REGION              Cloud Run region (default: europe-west1)"
    echo "  CLOUDSQL_INSTANCE   Cloud SQL instance connection name"
    echo ""
    echo "Examples:"
    echo "  PROJECT_ID=my-project CLOUDSQL_INSTANCE=my-project:region:instance $0 seed"
    echo "  $0 admin"
    echo "  $0 status"
}

# Main script logic
main() {
    # Check if required environment variables are set
    if [ -z "$PROJECT_ID" ]; then
        print_error "PROJECT_ID environment variable is required"
        echo "Example: PROJECT_ID=my-project $0 seed"
        exit 1
    fi
    
    if [ -z "$CLOUDSQL_INSTANCE" ] && [ "$1" != "status" ] && [ "$1" != "logs" ] && [ "$1" != "help" ]; then
        print_error "CLOUDSQL_INSTANCE environment variable is required"
        echo "Example: CLOUDSQL_INSTANCE=my-project:region:instance $0 seed"
        exit 1
    fi
    
    check_auth
    
    case "${1:-help}" in
        migrate)
            run_migrations
            ;;
        seed)
            seed_database
            ;;
        admin)
            create_admin
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
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

# Run main function with all arguments
main "$@"
