#!/bin/bash
#
# Sokogate Calculator - cPanel Deployment Script
# Prepares the application for cPanel deployment and creates a deployment package.
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="${SCRIPT_DIR}/sokogate-calc-deploy"
PACKAGE_NAME="sokogate-calc-cpanel.zip"

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  cPanel Deployment Preparation${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

# Step 1: Verify structure
echo -e "${YELLOW}[1/5] Verifying application structure...${NC}"

REQUIRED_FILES=("app.js" "package.json" "public" "views")
for item in "${REQUIRED_FILES[@]}"; do
    if [ ! -e "${SCRIPT_DIR}/${item}" ]; then
        echo -e "${RED}❌ Missing required: ${item}${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All required files present${NC}"
echo ""

# Step 2: Clean and prepare deploy directory
echo -e "${YELLOW}[2/5] Preparing deployment directory...${NC}"

# Clean old deploy directory
if [ -d "$DEPLOY_DIR" ]; then
    echo "Cleaning old deployment directory..."
    rm -rf "$DEPLOY_DIR"
fi

# Create fresh deploy directory
mkdir -p "$DEPLOY_DIR"

# Copy required files
echo "Copying application files..."
cp "${SCRIPT_DIR}/app.js" "${DEPLOY_DIR}/"
cp "${SCRIPT_DIR}/package.json" "${DEPLOY_DIR}/"
cp "${SCRIPT_DIR}/package-lock.json" "${DEPLOY_DIR}/" 2>/dev/null || true
cp "${SCRIPT_DIR}/healthcheck.js" "${DEPLOY_DIR}/" 2>/dev/null || true
cp "${SCRIPT_DIR}/.npmrc" "${DEPLOY_DIR}/" 2>/dev/null || true

# Copy directories
cp -r "${SCRIPT_DIR}/public" "${DEPLOY_DIR}/"
cp -r "${SCRIPT_DIR}/views" "${DEPLOY_DIR}/"

# Create .env.example for reference
cat > "${DEPLOY_DIR}/.env.example" << EOF
NODE_ENV=production
PORT=3000
BASE_PATH=/Calculate
CORS_ORIGIN=https://ultimotradingltd.co.ke
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Copy deployment guide
cp "${SCRIPT_DIR}/COMPLETE-DEPLOYMENT-GUIDE.md" "${DEPLOY_DIR}/" 2>/dev/null || true

# Create README for deployment
cat > "${DEPLOY_DIR}/README.md" << 'EOF'
# Sokogate Calculator - cPanel Deployment

## Quick Setup

1. Upload all files in this directory to:
   `/home/ultimotr/public_html/repositories/sokogate-calc-deploy/`

2. In cPanel → Setup Node.js App:
   - Application root: `/home/ultimotr/public_html/repositories/sokogate-calc-deploy`
   - Startup file: `app.js`
   - Application URL: `https://ultimotradingltd.co.ke/Calculate`

3. Set environment variables:
   ```
   NODE_ENV=production
   PORT=3000
   BASE_PATH=/Calculate
   CORS_ORIGIN=https://ultimotradingltd.co.ke
   ```

4. Click "Create", then "Run NPM Install", then "Restart"

5. Verify:
   - https://ultimotradingltd.co.ke/Calculate
   - https://ultimotradingltd.co.ke/Calculate/health

See COMPLETE-DEPLOYMENT-GUIDE.md for full instructions.
EOF

echo -e "${GREEN}✅ Deployment directory prepared${NC}"
echo ""

# Step 3: Create ZIP package
echo -e "${YELLOW}[3/5] Creating deployment package...${NC}"

cd "$SCRIPT_DIR"
ZIP_PATH="${SCRIPT_DIR}/${PACKAGE_NAME}"

# Remove old zip
rm -f "$ZIP_PATH"

# Create a temporary file list
TEMP_FILELIST=$(mktemp)

# Files to include
cat > "$TEMP_FILELIST" << 'EOF'
app.js
package.json
package-lock.json
healthcheck.js
.npmrc
public/
views/
.env.example
README.md
COMPLETE-DEPLOYMENT-GUIDE.md
EOF

# Create zip from list
cd "$DEPLOY_DIR"
zip -r "${SCRIPT_DIR}/${PACKAGE_NAME}" . 2>/dev/null || {
    echo -e "${RED}❌ Failed to create zip${NC}"
    exit 1
}
cd "$SCRIPT_DIR"

echo ""

# Step 4: Summary
echo -e "${YELLOW}[4/5] Deployment package summary${NC}"
echo ""
echo -e "${BLUE}Contents:${NC}"
unzip -l "$ZIP_PATH" 2>/dev/null | grep -E "app\.js|package\.json|public/|views/|\.env" | awk '{printf "  %-40s %8s\n", $4, $3}'
echo ""

# Step 5: Instructions
echo -e "${YELLOW}[5/5] Deployment Instructions${NC}"
echo ""
echo -e "${GREEN}Upload to cPanel:${NC}"
echo "1. Login to cPanel File Manager"
echo "2. Navigate to: /home/ultimotr/public_html/repositories/"
echo "3. Upload ${PACKAGE_NAME} and extract to: sokogate-calc-deploy/"
echo ""
echo -e "${GREEN}Or via FTP/SFTP:${NC}"
echo "   Upload extracted files to /public_html/repositories/sokogate-calc-deploy/"
echo ""
echo -e "${GREEN}Then in cPanel:${NC}"
echo "1. Go to 'Setup Node.js App'"
echo "2. Create Application:"
echo "   - Node version: 18.x or 20.x"
echo "   - Application root: /home/ultimotr/public_html/repositories/sokogate-calc-deploy"
echo "   - Startup file: app.js"
echo "   - URL: https://ultimotradingltd.co.ke/Calculate"
echo ""
echo "3. Set environment variables:"
echo "   NODE_ENV=production"
echo "   PORT=3000"
echo "   BASE_PATH=/Calculate"
echo "   CORS_ORIGIN=https://ultimotradingltd.co.ke"
echo ""
echo "4. Run 'npm install' via cPanel interface"
echo "5. Restart application"
echo ""
echo -e "${GREEN}Verification URLs:${NC}"
echo "  https://ultimotradingltd.co.ke/Calculate"
echo "  https://ultimotradingltd.co.ke/Calculate/health"
echo ""

# File sizes
echo -e "${YELLOW}Package size:${NC}"
du -h "$ZIP_PATH" | cut -f1

echo ""
echo -e "${GREEN}✅ cPanel deployment preparation complete!${NC}"
echo ""
