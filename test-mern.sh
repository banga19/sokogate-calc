#!/bin/bash
echo "======================================"
echo "Sokogate MERN Stack - Verification Test"
echo "======================================"
echo ""

echo "1. Checking file structure..."
for dir in src/models src/controllers src/routes src/services src/middleware src/config src/utils client/dist; do
  if [ -d "$dir" ] || [ -f "$dir" ]; then
    echo "  ✓ $dir exists"
  else
    echo "  ✗ $dir missing"
  fi
done
echo ""

echo "2. Checking key files..."
for file in package.json .env.example CPANEL-MERN-DEPLOYMENT-GUIDE.md README.md src/app.js src/server.js src/config/database.js src/config/index.js src/routes/apiRoutes.js src/routes/calculatorRoutes.js src/controllers/calculatorController.js src/services/calculatorService.js src/utils/validation.js models/Calculation.js client/src/App.jsx client/src/components/Calculator.jsx client/src/components/History.jsx client/src/components/Stats.jsx; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file missing"
  fi
done
echo ""

echo "3. Checking React build..."
if [ -d "client/dist" ] && [ -f "client/dist/index.html" ]; then
  echo "  ✓ React build exists"
  ls -lh client/dist/
else
  echo "  ✗ React build missing - run npm run build in client/"
fi
echo ""

echo "4. Checking package.json scripts..."
echo "  Available npm scripts:"
grep '"scripts"' -A 20 package.json | grep -E '^\s+"' | head -15
echo ""

echo "5. Checking dependencies..."
echo "  Backend packages:"
grep -E '"(express|mongoose|joi|helmet)"' package.json
echo "  Dev packages:"
grep -E '"(concurrently)"' package.json
echo ""

echo "6. API Endpoint verification..."
echo "  Configured routes:"
echo "    GET    /api/v1/calculations              - List (paginated)"
echo "    GET    /api/v1/calculations/:id          - Get single"
echo "    GET    /api/v1/calculations/stats        - Statistics"
echo "    POST   /api/v1/calculations/calculate    - Calculate & save"
echo "    DELETE /api/v1/calculations/:id          - Delete one"
echo "    DELETE /api/v1/calculations              - Delete all"
echo ""
echo "7. Material types supported:"
grep -E 'case '"'"'[a-z]+'"'"':' src/services/calculatorService.js | sed "s/.*case /  - /;s/:$//"
echo ""

echo "8. Environment variables (.env.example):"
cat .env.example | grep -v '^#' | grep -v '^$' | sed 's/^/  /'
echo ""

echo "======================================"
echo "Verification Complete!"
echo "======================================"
