#!/bin/bash
# ==============================================================================
# Sokogate Calculator — Full cPanel Deployment Script
# ==============================================================================
# Usage: bash deploy-cpanel.sh [--skip-npm] [--skip-restart]
#
# This script performs a complete deployment on cPanel:
#   1. Cleans the Git repository (fixes "Directory not empty" errors)
#   2. Pulls latest code from GitHub
#   3. Installs npm dependencies
#   4. Restarts the Node.js app via Passenger
#   5. Verifies the deployment with health checks
#
# Intended to be run via SSH on the cPanel server:
#   ssh ultimotr@ultimotradingltd.co.ke
#   cd repositories/sokogate-calc
#   bash deploy-cpanel.sh
# ==============================================================================

set -euo pipefail

# Configuration
REPO_PATH="/home2/ultimotr/repositories/sokogate-calc"
DEPLOY_PATH="/home2/ultimotr/public_html/repositories/sokogate-calc"
REMOTE="origin"
BRANCH="master"
BASE_URL="https://ultimotradingltd.co.ke/repositories/sokogate-calc"
APP_ROOT="/home/ultimotr/public_html/repositories/sokogate-calc"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SKIP_NPM=false
SKIP_RESTART=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --skip-npm)     SKIP_NPM=true;     echo -e "${YELLOW}⏭️  Skipping npm install${NC}" ;;
    --skip-restart) SKIP_RESTART=true; echo -e "${YELLOW}⏭️  Skipping app restart${NC}" ;;
  esac
done

# Helper functions
function info()  { echo -e "${BLUE}ℹ️  $1${NC}"; }
function ok()    { echo -e "${GREEN}✅ $1${NC}"; }
function warn()  { echo -e "${YELLOW}⚠️  $1${NC}"; }
function error() { echo -e "${RED}❌ $1${NC}"; }

function section() {
  echo ""
  echo "============================================================"
  echo "  $1"
  echo "============================================================"
}

PASS=0
FAIL=0

# ==============================================================================
# 1. PRE-FLIGHT CHECKS
# ==============================================================================
section "1. Pre-Flight Checks"

if [ ! -d "$REPO_PATH/.git" ]; then
  error "Git repository not found at $REPO_PATH"
  error "Please ensure you are running this on the cPanel server."
  exit 1
fi
ok "Git repository found"

cd "$REPO_PATH"

# Check remote connectivity
info "Checking GitHub connectivity..."
if ! git ls-remote "$REMOTE" "$BRANCH" > /dev/null 2>&1; then
  warn "Cannot reach GitHub remote. Check SSH keys or network."
  warn "If using HTTPS, ensure credentials are configured."
else
  ok "GitHub remote is reachable"
fi

# ==============================================================================
# 2. CLEAN REPOSITORY (Fix "Directory not empty")
# ==============================================================================
section "2. Clean Repository"

info "Current git status:"
git status --short
echo ""

# Show untracked files that will be removed
UNTRACKED=$(git ls-files --others --exclude-standard)
if [ -n "$UNTRACKED" ]; then
  warn "Untracked files detected (these will be deleted):"
  echo "$UNTRACKED" | head -20
  echo ""
  
  info "Removing untracked files..."
  git clean -fd
  ok "Untracked files removed"
else
  ok "No untracked files found"
fi

# Check for local changes
if ! git diff --quiet HEAD; then
  warn "Local modifications detected. Stashing..."
  git stash push -m "deploy-cpanel auto-stash $(date +%Y%m%d-%H%M%S)"
  ok "Local changes stashed"
else
  ok "No local modifications"
fi

# Reset to remote state
info "Resetting to $REMOTE/$BRANCH..."
git fetch "$REMOTE"
git reset --hard "$REMOTE/$BRANCH"
ok "Repository reset to $REMOTE/$BRANCH"

# ==============================================================================
# 3. PULL LATEST CODE
# ==============================================================================
section "3. Pull Latest Code"

info "Pulling from $REMOTE/$BRANCH..."
git pull "$REMOTE" "$BRANCH"
ok "Git pull complete"
echo ""

info "Latest commit:"
git log -1 --oneline
ok "Now at: $(git rev-parse --short HEAD)"

# ==============================================================================
# 4. INSTALL DEPENDENCIES
# ==============================================================================
if [ "$SKIP_NPM" = false ]; then
  section "4. Install Dependencies"

  if [ ! -f "package.json" ]; then
    warn "package.json not found in repo root. Skipping npm install."
    warn "If this is a subfolder deployment, install dependencies in the deploy target."
  else
    info "Installing npm dependencies (production)..."
    
    # Use npm ci if package-lock.json exists (cleaner, faster)
    if [ -f "package-lock.json" ]; then
      npm ci --production --silent
    else
      npm install --production --silent
    fi
    
    ok "npm install complete"
    
    # Verify node_modules exists and has content
    if [ -d "node_modules" ] && [ "$(ls -A node_modules)" ]; then
      ok "node_modules verified ($(ls node_modules | wc -l) packages)"
    else
      error "node_modules is missing or empty!"
      ((FAIL++))
    fi
  fi
else
  section "4. Install Dependencies (Skipped)"
fi

# ==============================================================================
# 5. DEPLOY TO TARGET
# ==============================================================================
section "5. Deploy to Target Directory"

if [ "$REPO_PATH" != "$DEPLOY_PATH" ]; then
  info "Deploying from repo to $DEPLOY_PATH..."
  
  # Create deploy directory if it doesn't exist
  mkdir -p "$DEPLOY_PATH"
  
  # Use rsync if available, otherwise cp
  if command -v rsync &> /dev/null; then
    rsync -av --delete \
      --exclude='.git' \
      --exclude='node_modules' \
      --exclude='logs' \
      --exclude='*.log' \
      --exclude='.env' \
      "$REPO_PATH/" "$DEPLOY_PATH/"
  else
    # Fallback: remove old files and copy new ones
    rm -rf "$DEPLOY_PATH"/*
    cp -r "$REPO_PATH"/* "$DEPLOY_PATH/" 2>/dev/null || true
    # Remove .git from deploy target if copied
    rm -rf "$DEPLOY_PATH/.git"
  fi
  
  ok "Files deployed to $DEPLOY_PATH"
else
  ok "Repo path is deploy path — no copy needed"
fi

# ==============================================================================
# 6. RESTART NODE.JS APP
# ==============================================================================
if [ "$SKIP_RESTART" = false ]; then
  section "6. Restart Node.js App"

  # Method 1: Passenger restart via touch
  if [ -d "$DEPLOY_PATH/tmp" ]; then
    touch "$DEPLOY_PATH/tmp/restart.txt"
    ok "Passenger restart triggered (touch tmp/restart.txt)"
  elif [ -d "$APP_ROOT/tmp" ]; then
    touch "$APP_ROOT/tmp/restart.txt"
    ok "Passenger restart triggered at app root"
  else
    # Method 2: Create tmp directory and touch
    mkdir -p "$DEPLOY_PATH/tmp"
    touch "$DEPLOY_PATH/tmp/restart.txt"
    ok "Created tmp/restart.txt for Passenger"
  fi

  # Method 3: Kill Node process (if Passenger doesn't pick it up)
  info "Waiting for Passenger to restart..."
  sleep 3
  
  # Check if app is running on expected port
  if command -v curl &> /dev/null; then
    info "Checking app health..."
    sleep 2
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" || echo "000")
    
    if [ "$HEALTH_STATUS" = "200" ]; then
      ok "App is responding (HTTP 200 on /health)"
    else
      warn "App health check returned HTTP $HEALTH_STATUS"
      warn "If the app doesn't start, go to cPanel → Setup Node.js App → Restart"
    fi
  else
    warn "curl not available — skipping health check"
  fi
else
  section "6. Restart Node.js App (Skipped)"
fi

# ==============================================================================
# 7. POST-DEPLOYMENT VERIFICATION
# ==============================================================================
section "7. Deployment Verification"

if command -v curl &> /dev/null; then
  # Test health endpoint
  info "Testing: $BASE_URL/health"
  HEALTH=$(curl -s "$BASE_URL/health" || echo '{"status":"error"}')
  if echo "$HEALTH" | grep -q '"status":"ok"'; then
    ok "Health check passed"
    ((PASS++))
  else
    error "Health check failed"
    ((FAIL++))
  fi

  # Test main page
  info "Testing: $BASE_URL/"
  PAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/" || echo "000")
  if [ "$PAGE_STATUS" = "200" ]; then
    ok "Main page loads (HTTP 200)"
    ((PASS++))
  else
    error "Main page returned HTTP $PAGE_STATUS"
    ((FAIL++))
  fi

  # Test CSS
  info "Testing: $BASE_URL/style.css"
  CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/style.css" || echo "000")
  if [ "$CSS_STATUS" = "200" ]; then
    ok "CSS loads (HTTP 200)"
    ((PASS++))
  else
    error "CSS returned HTTP $CSS_STATUS"
    ((FAIL++))
  fi
else
  warn "curl not available — skipping verification"
  warn "Manually test: $BASE_URL/health"
fi

# ==============================================================================
# SUMMARY
# ==============================================================================
section "Deployment Summary"

echo "Repository:     $REPO_PATH"
echo "Deploy Target:  $DEPLOY_PATH"
echo "Base URL:       $BASE_URL"
echo "Git Commit:     $(git rev-parse --short HEAD)"
echo ""

if [ $FAIL -eq 0 ]; then
  ok "🚀 Deployment completed successfully!"
  ok "All checks passed: $PASS"
  echo ""
  echo "Your app should be live at:"
  echo "  $BASE_URL/"
else
  error "⚠️  Deployment completed with $FAIL issue(s)"
  error "Passed: $PASS | Failed: $FAIL"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check cPanel → Setup Node.js App → Logs"
  echo "  2. Verify environment variables are set"
  echo "  3. Run: bash verify-deployment.sh $BASE_URL"
fi

exit $FAIL
