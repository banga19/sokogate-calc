#!/bin/bash
# cPanel Git "Directory Not Empty" Fix Script
# Usage: bash cpanel-git-fix.sh
# Run this on your cPanel server via SSH/Terminal

set -euo pipefail

REPO_PATH="/home2/ultimotr/repositories/sokogate-calc"
DEPLOY_PATH="/home2/ultimotr/public_html/repositories/sokogate-calc"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Sokogate-Calc Git Fix Script${NC}"
echo "======================================"
echo "Repo:    $REPO_PATH"
echo "Deploy:  $DEPLOY_PATH"
echo

# Check if we're in the repo directory
if [ ! -d "$REPO_PATH/.git" ]; then
  echo -e "${RED}Error: Not a Git repository at $REPO_PATH${NC}"
  echo "Please run from the cPanel server."
  exit 1
fi

cd "$REPO_PATH"

echo -e "${YELLOW}1. Checking Git Status...${NC}"
echo "----------------------------------------"
git status
echo
git fetch origin
echo "----------------------------------------"
echo

# Show untracked files
echo -e "${YELLOW}2. Untracked Files that will be deleted:${NC}"
git clean -fdn
echo

# Clean untracked files
read -p "Delete untracked files? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${GREEN}Cleaning untracked files...${NC}"
  git clean -fd
  echo -e "${GREEN}Untracked files cleaned${NC}"
else
  echo "Skipping cleanup."
fi

# Stash any local changes
echo -e "${YELLOW}3. Checking for local changes...${NC}"
if ! git diff --quiet; then
  read -p "Stash local changes? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git stash push -m "cpanel-git-fix auto-stash"
    echo -e "${GREEN}Local changes stashed${NC}"
  fi
fi

# Force reset to origin/master
echo -e "${YELLOW}4. Force reset to origin/master...${NC}"
git reset --hard origin/master
echo -e "${GREEN}Reset to origin/master${NC}"
echo

# Pull latest
echo -e "${YELLOW}5. Pulling latest changes...${NC}"
git pull origin master
echo -e "${GREEN}Git pull complete${NC}"
echo

echo -e "${GREEN}Git repository is now clean and up-to-date!${NC}"
echo
echo "Next steps:"
echo "1. Go to cPanel -> Git Version Control -> Deploy HEAD Commit"
echo "2. Or run: bash deploy-cpanel.sh (if available)"
echo "3. Verify: curl -I https://ultimotradingltd.co.ke/repositories/sokogate-calc/health"
