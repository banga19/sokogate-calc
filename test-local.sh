#!/bin/bash
# Sokogate Calculator — Local Deployment Test Script
# Tests all endpoints after starting the server

set -e

echo "🧪 Sokogate Calculator — Local Test Suite"
echo "=========================================="

# Ensure we're in the right directory
cd /home/apop/sokogate-calc

# Stop any existing server
pkill -f "node app.js" 2>/dev/null || true
sleep 1

# Clean npm cache? (optional)
echo "📦 Installing dependencies..."
npm install --silent

# Start server
echo "🚀 Starting server on port 3000..."
PORT=3000 BASE_PATH=/Calculate node app.js &
SERVER_PID=$!
sleep 3

# Test function
test_endpoint() {
  local method=$1
  local url=$2
  local expected=$3
  local description=$4
  
  echo -n "Testing: $description... "
  local response
  response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" 2>/dev/null)
  
  if [ "$response" == "$expected" ]; then
    echo "✅ PASS ($response)"
    return 0
  else
    echo "❌ FAIL (got $response, expected $expected)"
    echo "   URL: $url"
    return 1
  fi
}

# Test function that checks content
test_content() {
  local method=$1
  local url=$2
  local pattern=$3
  local description=$4
  
  echo -n "Testing: $description... "
  local response
  response=$(curl -s -X "$method" "$url" 2>/dev/null)
  
  if echo "$response" | grep -qE "$pattern"; then
    echo "✅ PASS"
    return 0
  else
    echo "❌ FAIL (pattern not found: $pattern)"
    echo "   Response: $(echo "$response" | head -c 200)"
    return 1
  fi
}

echo ""
echo "📋 Running tests..."
echo ""

# Static assets
test_endpoint "GET" "http://localhost:3000/Calculate/style.css" "200" "CSS static file"
test_endpoint "GET" "http://localhost:3000/Calculate/script.js" "200" "JS static file"

# Page loads
test_endpoint "GET" "http://localhost:3000/Calculate/" "200" "Calculator page (/)"
test_endpoint "GET" "http://localhost:3000/Calculate/calculate" "200" "Calculator page (/calculate)"

# Health check
test_content "GET" "http://localhost:3000/Calculate/health" '"status":"ok"' "Health endpoint"

# Form submission
test_content "POST" "http://localhost:3000/Calculate/calculate" "Cement.*Sand" "Cement calculation"
test_content "POST" "http://localhost:3000/Calculate/calculate -d 'area=500&materialType=bricks'" "bricks" "Bricks calculation"

echo ""
echo "=========================================="
echo "✅ All tests completed!"
echo ""
echo "To stop server: kill $SERVER_PID"
echo ""

# Keep server running for manual testing? (optional)
# wait $SERVER_PID
