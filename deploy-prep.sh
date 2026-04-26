#!/bin/bash
# Sokogate-Calc cPanel Deployment Preparation Script
# This script creates a clean ZIP file ready for cPanel upload

echo "🚀 Sokogate-Calc cPanel Deployment Preparation"
echo "================================================"

# Create deployment directory
DEPLOY_DIR="sokogate-calc-deploy"
ZIP_NAME="sokogate-calc-cpanel.zip"

# Clean up any previous deployment
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

# Copy required files
echo "📋 Copying deployment files..."
cp app.js "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"
cp .npmrc "$DEPLOY_DIR/"
cp .htaccess "$DEPLOY_DIR/"
cp DEPLOYMENT.md "$DEPLOY_DIR/"
cp sokogate-calculator-wordpress-plugin.php "$DEPLOY_DIR/"
cp WORDPRESS-INTEGRATION-GUIDE.md "$DEPLOY_DIR/"

# Copy directories
cp -r views "$DEPLOY_DIR/"
cp -r public "$DEPLOY_DIR/"

# Create the ZIP file (flat structure for direct cPanel extraction)
echo "📦 Creating ZIP archive: $ZIP_NAME"
cd "$DEPLOY_DIR" && zip -r "../$ZIP_NAME" . -x "*.DS_Store" -x "*.git*" && cd ..

# Show summary
echo ""
echo "✅ Deployment package created successfully!"
echo ""
echo "📊 Package Contents:"
echo "-------------------"
ls -la "$DEPLOY_DIR/"
echo ""
echo "📦 ZIP File: $ZIP_NAME"
echo ""
echo "📤 Next Steps:"
echo "1. Upload $ZIP_NAME to your cPanel File Manager"
echo "2. Extract to your desired directory (e.g., /Calculate/)"
echo "3. Follow DEPLOYMENT.md instructions"
echo ""
echo "🌐 Upload these files to cPanel and run: npm install"
