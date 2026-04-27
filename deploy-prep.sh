#!/bin/bash
# Sokogate-Calc cPanel Deployment Preparation Script
# Creates a clean ZIP file ready for cPanel upload

set -euo pipefail

echo "🚀 Sokogate-Calc cPanel Deployment Preparation"
echo "================================================"

# Configuration
DEPLOY_DIR="sokogate-calc-deploy"
ZIP_NAME="sokogate-calc-cpanel.zip"

# Clean up any previous deployment artifacts
if [ -d "$DEPLOY_DIR" ]; then
    echo "🧹 Cleaning up previous deployment directory..."
    rm -rf "$DEPLOY_DIR"
fi

if [ -f "$ZIP_NAME" ]; then
    echo "🧹 Removing old ZIP file..."
    rm -f "$ZIP_NAME"
fi

# Create deployment directory
mkdir -p "$DEPLOY_DIR"
echo "📁 Created deployment directory: $DEPLOY_DIR"

# Copy required files (core application)
echo "📋 Copying core application files..."
cp app.js "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"
cp .npmrc "$DEPLOY_DIR/"

# Copy configuration
echo "📋 Copying configuration files..."
cp .htaccess "$DEPLOY_DIR/"

# Copy template and static assets
echo "📋 Copying views and public assets..."
cp -r views "$DEPLOY_DIR/"
cp -r public "$DEPLOY_DIR/"

# Copy documentation (optional but helpful)
echo "📋 Copying documentation..."
cp DEPLOYMENT.md "$DEPLOY_DIR/" 2>/dev/null || true
cp sokogate-calculator-wordpress-plugin.php "$DEPLOY_DIR/" 2>/dev/null || true
cp WORDPRESS-INTEGRATION-GUIDE.md "$DEPLOY_DIR/" 2>/dev/null || true

# Create the ZIP file (flat structure for direct cPanel extraction)
echo "📦 Creating ZIP archive: $ZIP_NAME"
cd "$DEPLOY_DIR"
zip -r "../$ZIP_NAME" . \
    -x "*.DS_Store" \
    -x "*.git*" \
    -x "*.log" \
    -x "node_modules/*" \
    -x "logs/*"
cd ..

# Verify ZIP contents
echo ""
echo "🔍 Verifying ZIP structure..."
FILE_COUNT=$(unzip -l "$ZIP_NAME" | tail -1 | awk '{print $2}')
echo "   Files in ZIP: $FILE_COUNT"

# Check for critical files
echo "   Checking critical files..."
if unzip -l "$ZIP_NAME" | grep -q "app.js"; then
    echo "   ✅ app.js"
else
    echo "   ❌ app.js MISSING"
    exit 1
fi

if unzip -l "$ZIP_NAME" | grep -q "package.json"; then
    echo "   ✅ package.json"
else
    echo "   ❌ package.json MISSING"
    exit 1
fi

if unzip -l "$ZIP_NAME" | grep -q "views/"; then
    echo "   ✅ views/"
else
    echo "   ❌ views/ MISSING"
    exit 1
fi

if unzip -l "$ZIP_NAME" | grep -q "public/"; then
    echo "   ✅ public/"
else
    echo "   ❌ public/ MISSING"
    exit 1
fi

# Check for files that should NOT be in ZIP
echo "   Checking for excluded files..."
if unzip -l "$ZIP_NAME" | grep -q "src/"; then
    echo "   ⚠️  WARNING: src/ found in ZIP (should be excluded)"
fi
if unzip -l "$ZIP_NAME" | grep -q ".env"; then
    echo "   ⚠️  WARNING: .env found in ZIP (should be excluded)"
fi
if unzip -l "$ZIP_NAME" | grep -q "node_modules/"; then
    echo "   ⚠️  WARNING: node_modules/ found in ZIP (should be excluded)"
fi

# Show summary
echo ""
echo "✅ Deployment package created successfully!"
echo ""
echo "📊 Package Contents:"
echo "-------------------"
unzip -l "$ZIP_NAME" | tail -n +4 | head -n -2
echo ""
echo "📦 ZIP File: $ZIP_NAME ($(du -h "$ZIP_NAME" | cut -f1))"
echo ""
echo "📤 Next Steps:"
echo "1. Upload $ZIP_NAME to your cPanel File Manager"
echo "2. Extract to /home/ultimotr/public_html/repositories/sokogate-calc-deploy/"
echo "3. Run: npm install"
echo "4. Start the application via cPanel Node.js interface"
echo ""
echo "🌐 cPanel Configuration:"
echo "   - Application root: /home/ultimotr/public_html/repositories/sokogate-calc-deploy"
echo "   - Application URL: https://ultimotradingltd.co.ke/Calculate"
echo "   - Startup file: app.js"
echo "   - Node.js version: 18.x or 20.x"
