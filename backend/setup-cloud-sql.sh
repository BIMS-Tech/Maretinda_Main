#!/bin/bash

# ========================================
# Google Cloud SQL Setup Script
# ========================================
# This script helps you set up Google Cloud SQL for your Medusa backend
# 
# Usage: ./setup-cloud-sql.sh
# ========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }

# Header
echo ""
echo "=========================================="
echo "  Google Cloud SQL Setup for Maretinda"
echo "=========================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed"
    print_info "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

print_success "gcloud CLI found"

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    print_warning "Not authenticated with gcloud"
    print_info "Running: gcloud auth login"
    gcloud auth login
fi

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$CURRENT_PROJECT" ]; then
    print_warning "No project is set"
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID
    gcloud config set project "$PROJECT_ID"
else
    print_info "Current project: $CURRENT_PROJECT"
    read -p "Use this project? (y/n): " USE_CURRENT
    if [[ $USE_CURRENT != "y" ]]; then
        read -p "Enter your Google Cloud Project ID: " PROJECT_ID
        gcloud config set project "$PROJECT_ID"
    else
        PROJECT_ID=$CURRENT_PROJECT
    fi
fi

# Configuration
print_info "Configuring Cloud SQL instance..."
echo ""

# Instance name
read -p "Instance name [maretinda-db]: " INSTANCE_NAME
INSTANCE_NAME=${INSTANCE_NAME:-maretinda-db}

# Region
print_info "Common regions:"
echo "  - asia-southeast1 (Singapore)"
echo "  - asia-southeast2 (Jakarta)"
echo "  - us-central1 (Iowa)"
echo "  - europe-west1 (Belgium)"
read -p "Region [asia-southeast1]: " REGION
REGION=${REGION:-asia-southeast1}

# Database name
read -p "Database name [medusa]: " DB_NAME
DB_NAME=${DB_NAME:-medusa}

# Database user
read -p "Database username [medusa_user]: " DB_USER
DB_USER=${DB_USER:-medusa_user}

# Database password
read -sp "Database password: " DB_PASSWORD
echo ""
if [ -z "$DB_PASSWORD" ]; then
    print_error "Password cannot be empty"
    exit 1
fi

# Root password
read -sp "Root (postgres) password: " ROOT_PASSWORD
echo ""
if [ -z "$ROOT_PASSWORD" ]; then
    print_error "Root password cannot be empty"
    exit 1
fi

# Tier
print_info "Common tiers:"
echo "  - db-f1-micro (Shared, 0.6GB RAM) - Good for development"
echo "  - db-g1-small (Shared, 1.7GB RAM) - Good for small production"
echo "  - db-custom-2-8192 (Dedicated, 2 vCPU, 8GB RAM) - Good for production"
read -p "Tier [db-f1-micro]: " TIER
TIER=${TIER:-db-f1-micro}

echo ""
print_info "Summary:"
echo "  Project ID:     $PROJECT_ID"
echo "  Instance Name:  $INSTANCE_NAME"
echo "  Region:         $REGION"
echo "  Database:       $DB_NAME"
echo "  User:           $DB_USER"
echo "  Tier:           $TIER"
echo ""

read -p "Proceed with creation? (y/n): " PROCEED
if [[ $PROCEED != "y" ]]; then
    print_warning "Aborted"
    exit 0
fi

# Check if instance already exists
print_info "Checking if instance exists..."
if gcloud sql instances describe "$INSTANCE_NAME" &> /dev/null; then
    print_warning "Instance $INSTANCE_NAME already exists"
    read -p "Use existing instance? (y/n): " USE_EXISTING
    if [[ $USE_EXISTING != "y" ]]; then
        print_warning "Aborted"
        exit 0
    fi
    INSTANCE_EXISTS=true
else
    INSTANCE_EXISTS=false
fi

# Create instance if it doesn't exist
if [ "$INSTANCE_EXISTS" = false ]; then
    print_info "Creating Cloud SQL instance... (this may take 5-10 minutes)"
    gcloud sql instances create "$INSTANCE_NAME" \
        --database-version=POSTGRES_15 \
        --tier="$TIER" \
        --region="$REGION" \
        --root-password="$ROOT_PASSWORD" \
        --storage-type=SSD \
        --storage-size=10GB \
        --storage-auto-increase \
        --backup-start-time=03:00 \
        --retained-backups-count=7 \
        --enable-bin-log

    print_success "Instance created successfully"
else
    print_success "Using existing instance"
fi

# Create database
print_info "Creating database $DB_NAME..."
if gcloud sql databases create "$DB_NAME" --instance="$INSTANCE_NAME" 2>/dev/null; then
    print_success "Database created"
else
    print_warning "Database already exists or error occurred"
fi

# Create user
print_info "Creating user $DB_USER..."
if gcloud sql users create "$DB_USER" \
    --instance="$INSTANCE_NAME" \
    --password="$DB_PASSWORD" 2>/dev/null; then
    print_success "User created"
else
    print_warning "User already exists or error occurred"
fi

# Get connection details
CONNECTION_NAME=$(gcloud sql instances describe "$INSTANCE_NAME" --format="value(connectionName)")
print_success "Connection name: $CONNECTION_NAME"

# Check if Cloud SQL Proxy exists
print_info "Checking for Cloud SQL Proxy..."
if [ -f "./cloud-sql-proxy" ]; then
    print_success "Cloud SQL Proxy found"
else
    print_info "Downloading Cloud SQL Proxy..."
    
    # Detect OS and architecture
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    if [ "$ARCH" = "arm64" ]; then
        ARCH="arm64"
    elif [ "$ARCH" = "x86_64" ]; then
        ARCH="amd64"
    fi
    
    if [ "$OS" = "darwin" ]; then
        OS="darwin"
    elif [ "$OS" = "linux" ]; then
        OS="linux"
    fi
    
    PROXY_URL="https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.2/cloud-sql-proxy.${OS}.${ARCH}"
    
    curl -o cloud-sql-proxy "$PROXY_URL"
    chmod +x cloud-sql-proxy
    print_success "Cloud SQL Proxy downloaded"
fi

# Start proxy
print_info "Starting Cloud SQL Proxy..."
if pgrep -f "cloud-sql-proxy.*$INSTANCE_NAME" > /dev/null; then
    print_warning "Cloud SQL Proxy is already running"
else
    ./cloud-sql-proxy "$CONNECTION_NAME" &
    PROXY_PID=$!
    sleep 2
    
    if ps -p $PROXY_PID > /dev/null; then
        print_success "Cloud SQL Proxy started (PID: $PROXY_PID)"
        echo "$PROXY_PID" > .cloud-sql-proxy.pid
    else
        print_error "Failed to start Cloud SQL Proxy"
        exit 1
    fi
fi

# Create .env file
print_info "Creating .env file..."

cat > .env << EOF
# =================================================================
# DATABASE CONFIGURATION (Google Cloud SQL)
# =================================================================
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}

# =================================================================
# CORS CONFIGURATION
# =================================================================
STORE_CORS=http://localhost:3000,http://localhost:8000
ADMIN_CORS=http://localhost:3001,http://localhost:7001
VENDOR_CORS=http://localhost:3002,http://localhost:5173
AUTH_CORS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:5173

# =================================================================
# SECURITY SECRETS
# =================================================================
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret

# =================================================================
# SERVER CONFIGURATION
# =================================================================
NODE_ENV=development
PORT=9000
BACKEND_URL=http://localhost:9000

# =================================================================
# Add your other environment variables below
# =================================================================
# ALGOLIA_APP_ID=
# ALGOLIA_API_KEY=
# RESEND_API_KEY=
# RESEND_FROM_EMAIL=
EOF

print_success ".env file created"

# Test connection
print_info "Testing database connection..."
if command -v psql &> /dev/null; then
    if PGPASSWORD="$DB_PASSWORD" psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" &> /dev/null; then
        print_success "Connection successful!"
    else
        print_warning "Connection test failed, but this might be temporary"
    fi
else
    print_warning "psql not found, skipping connection test"
fi

# Summary
echo ""
print_success "Setup complete!"
echo ""
echo "=========================================="
echo "  Next Steps"
echo "=========================================="
echo ""
echo "1. Initialize the database:"
echo "   ${BLUE}npm run db:setup${NC}"
echo ""
echo "2. Start the development server:"
echo "   ${BLUE}npm run dev${NC}"
echo ""
echo "3. Your connection details:"
echo "   Instance:    $INSTANCE_NAME"
echo "   Connection:  $CONNECTION_NAME"
echo "   Database:    $DB_NAME"
echo "   User:        $DB_USER"
echo ""
echo "4. Cloud SQL Proxy is running. To stop it:"
echo "   ${BLUE}kill \$(cat .cloud-sql-proxy.pid)${NC}"
echo ""
echo "5. To connect directly with psql:"
echo "   ${BLUE}psql postgresql://$DB_USER:****@127.0.0.1:5432/$DB_NAME${NC}"
echo ""
echo "=========================================="
echo ""

# Save connection info
cat > .cloud-sql-info << EOF
# Cloud SQL Connection Information
PROJECT_ID=$PROJECT_ID
INSTANCE_NAME=$INSTANCE_NAME
CONNECTION_NAME=$CONNECTION_NAME
REGION=$REGION
DATABASE=$DB_NAME
USER=$DB_USER
EOF

print_success "Connection info saved to .cloud-sql-info"
print_info "Keep this information for future reference"

echo ""

