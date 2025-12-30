#!/bin/bash

# ========================================
# Production Command Runner (Local)
# ========================================
# Run commands locally against production database via Cloud SQL Proxy
# 
# Usage: ./run-production-command.sh <command>
# Examples:
#   ./run-production-command.sh db:migrate
#   ./run-production-command.sh seed
#   ./run-production-command.sh cleanup
# ========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }

# Check if command is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <npm-script>"
    echo ""
    echo "Examples:"
    echo "  $0 db:migrate"
    echo "  $0 seed"
    echo "  $0 db:setup"
    echo "  $0 cleanup"
    exit 1
fi

COMMAND=$1
shift
ARGS="$*"

echo ""
print_warning "=========================================="
print_warning "  PRODUCTION ENVIRONMENT"
print_warning "=========================================="
print_warning "This will run commands against your PRODUCTION database!"
echo ""
print_info "Command: npm run $COMMAND $ARGS"
echo ""
read -p "Are you absolutely sure? (type 'yes' to continue): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_info "Aborted"
    exit 0
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found"
    print_info "Create it with your production environment variables"
    echo ""
    echo "Example:"
    echo "  DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/medusa"
    echo "  NODE_ENV=production"
    echo "  JWT_SECRET=your-secret"
    echo "  COOKIE_SECRET=your-secret"
    exit 1
fi

# Check if Cloud SQL Proxy is running
print_info "Checking Cloud SQL Proxy..."
if ! pgrep -f "cloud-sql-proxy" > /dev/null; then
    print_warning "Cloud SQL Proxy is not running"
    
    # Check if proxy binary exists
    if [ -f "./cloud-sql-proxy" ]; then
        # Try to get connection name from .cloud-sql-info
        if [ -f ".cloud-sql-info" ]; then
            CONNECTION_NAME=$(grep CONNECTION_NAME .cloud-sql-info | cut -d= -f2)
            if [ -n "$CONNECTION_NAME" ]; then
                print_info "Starting Cloud SQL Proxy..."
                ./cloud-sql-proxy "$CONNECTION_NAME" &
                PROXY_PID=$!
                sleep 3
                
                if ps -p $PROXY_PID > /dev/null; then
                    print_success "Cloud SQL Proxy started (PID: $PROXY_PID)"
                else
                    print_error "Failed to start Cloud SQL Proxy"
                    exit 1
                fi
            else
                print_error "CONNECTION_NAME not found in .cloud-sql-info"
                exit 1
            fi
        else
            print_error ".cloud-sql-info file not found"
            print_info "Start Cloud SQL Proxy manually:"
            echo "  ./cloud-sql-proxy YOUR_PROJECT:REGION:INSTANCE &"
            exit 1
        fi
    else
        print_error "cloud-sql-proxy binary not found"
        print_info "Download it with: ./setup-cloud-sql.sh"
        exit 1
    fi
else
    print_success "Cloud SQL Proxy is running"
fi

# Load production environment variables
print_info "Loading production environment..."
export $(cat .env.production | grep -v '^#' | xargs)
export NODE_ENV=production

print_success "Environment loaded"

# Check database connection
print_info "Testing database connection..."
if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
        print_success "Database connection successful"
    else
        print_error "Database connection failed"
        print_info "Check your DATABASE_URL in .env.production"
        exit 1
    fi
else
    print_warning "psql not found, skipping connection test"
fi

# Run the command
echo ""
print_info "=========================================="
print_info "Executing: npm run $COMMAND $ARGS"
print_info "=========================================="
echo ""

npm run "$COMMAND" $ARGS

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    print_success "Command completed successfully"
else
    print_error "Command failed with exit code $EXIT_CODE"
fi

exit $EXIT_CODE

