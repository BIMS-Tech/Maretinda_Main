#!/bin/bash

# ========================================
# Cloud Run Command Runner
# ========================================
# Run commands (migrations, seeds, scripts) on Cloud Run
# 
# Usage: ./run-cloud-command.sh <command> [args]
# Examples:
#   ./run-cloud-command.sh seed
#   ./run-cloud-command.sh db:migrate
#   ./run-cloud-command.sh db:setup
#   ./run-cloud-command.sh cleanup
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
    echo "Usage: $0 <npm-script> [additional-args]"
    echo ""
    echo "Examples:"
    echo "  $0 seed"
    echo "  $0 db:migrate"
    echo "  $0 db:setup"
    echo "  $0 cleanup"
    echo "  $0 backup:all"
    echo "  $0 storage:stats"
    exit 1
fi

# Configuration (update these for your project)
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-your-project-id}"
REGION="${REGION:-us-central1}"
IMAGE="gcr.io/${PROJECT_ID}/maretinda-backend"
JOB_PREFIX="maretinda-cmd"

# Command to run
SCRIPT_NAME=$1
shift
ADDITIONAL_ARGS="$*"

print_info "Cloud Run Command Runner"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed"
    exit 1
fi

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$CURRENT_PROJECT" ]; then
    print_error "No Google Cloud project is set"
    print_info "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

PROJECT_ID=$CURRENT_PROJECT

# Update image path
IMAGE="gcr.io/${PROJECT_ID}/maretinda-backend"

print_info "Project: $PROJECT_ID"
print_info "Region: $REGION"
print_info "Command: npm run $SCRIPT_NAME $ADDITIONAL_ARGS"
echo ""

# Generate job name
TIMESTAMP=$(date +%s)
SAFE_SCRIPT_NAME=$(echo "$SCRIPT_NAME" | tr ':_' '-')
JOB_NAME="${JOB_PREFIX}-${SAFE_SCRIPT_NAME}-${TIMESTAMP}"

print_info "Creating Cloud Run Job: $JOB_NAME"

# Build command args
ARGS="run,$SCRIPT_NAME"
if [ -n "$ADDITIONAL_ARGS" ]; then
    # Replace spaces with commas for gcloud args
    ARGS="${ARGS},${ADDITIONAL_ARGS// /,}"
fi

# Confirm execution
print_warning "This will execute commands on your production environment!"
read -p "Continue? (y/n): " CONFIRM
if [[ $CONFIRM != "y" ]]; then
    print_info "Aborted"
    exit 0
fi

# Create and execute job
print_info "Creating job..."

gcloud run jobs create "$JOB_NAME" \
  --image="$IMAGE" \
  --command="npm" \
  --args="$ARGS" \
  --region="$REGION" \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest \
  --set-env-vars="NODE_ENV=production,DB_HOST=/cloudsql/maretinda-test:us-central1:maretinda-db-test-2" \
  --set-cloudsql-instances=maretinda-test:us-central1:maretinda-db-test-2 \
  --max-retries=0 \
  --task-timeout=10m \
  --execute-now \
  --wait

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    print_success "Job completed successfully"
else
    print_error "Job failed with exit code $EXIT_CODE"
fi

# Fetch and display logs
echo ""
print_info "Fetching logs..."
echo ""

gcloud logging read \
  "resource.type=cloud_run_job AND resource.labels.job_name=$JOB_NAME" \
  --limit=200 \
  --format="table(timestamp,severity,textPayload)" \
  --project="$PROJECT_ID"

# Ask to delete job
echo ""
read -p "Delete the job? (y/n): " DELETE_JOB

if [ "$DELETE_JOB" = "y" ]; then
    print_info "Deleting job..."
    gcloud run jobs delete "$JOB_NAME" --region="$REGION" --quiet
    print_success "Job deleted"
else
    print_info "Job kept: $JOB_NAME"
    print_info "Delete later with: gcloud run jobs delete $JOB_NAME --region=$REGION"
fi

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    print_success "Command execution completed"
else
    print_error "Command execution failed"
fi

exit $EXIT_CODE

