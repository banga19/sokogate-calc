#!/bin/bash
# Sokogate Calculator — Post-Deployment Verification Script
# Run this after cPanel deployment to confirm everything is live & stable.
# Usage: bash verify-deployment.sh [BASE_URL]
#   Example: bash verify-deployment.sh https://ultimotradingltd.co.ke/repositories/sokogate-calc-deploy

set -euo pipefail

BASE_URL="${1:-https://ultimotradingltd.co.ke/repositories/sokogate-calc-deploy}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

function ok()   { echo -e "  ${GREEN}✅${NC} $1"; ((PASS++)); }
function err()  { echo -e "  ${RED}❌${NC} $1"; ((FAIL++)); }
function info() { echo -e "  ${YELLOW}ℹ️${NC}  $1"; }

echo "=========================================="
echo "  Sokogate Deployment Verification"
echo "  Target: $BASE_URL"
echo "=========================================="
echo

# ── 1. HEALTH CHECK ───────────────────────────────────────────
echo "1. Health Endpoint"
RESPONSE=$(curl -s -o /tmp/health.json -w "%{http_code}" "$BASE_URL/health" || true)
if [ "$RESPONSE" = "200" ]; then
  if grep -q '"status":"ok"' /tmp/health.json; then
    ok "GET /health → 200 + status:ok"
  else
    err "GET /health → 200 but missing status:ok"
  fi
else
  err "GET /health → HTTP $RESPONSE"
fi

# ── 2. HTML PAGE LOAD ─────────────────────────────────────────
echo
echo "2. Main Calculator Page"
RESPONSE=$(curl -s -o /tmp/page.html -w "%{http_code}" "$BASE_URL/" || true)
if [ "$RESPONSE" = "200" ]; then
  if grep -q 'Sokogate' /tmp/page.html; then
    ok "GET / → 200 + contains 'Sokogate'"
  else
    err "GET / → 200 but title missing (old React app?)"
  fi
else
  err "GET / → HTTP $RESPONSE"
fi

# ── 3. CALCULATE PAGE ─────────────────────────────────────────
echo
echo "3. Calculate Endpoint (GET)"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/calculate" || true)
if [ "$RESPONSE" = "200" ]; then
  ok "GET /calculate → 200"
else
  err "GET /calculate → HTTP $RESPONSE"
fi

# ── 4. POST CALCULATION ───────────────────────────────────────
echo
echo "4. Calculation (POST /calculate)"
RESPONSE=$(curl -s -o /tmp/calc.html -w "%{http_code}" \
  -X POST "$BASE_URL/calculate" \
  -d "area=100&materialType=cement&roomWidth=10&roomLength=10&roomHeight=8" || true)

if [ "$RESPONSE" = "200" ]; then
  if grep -q 'Cement & Sand' /tmp/calc.html; then
    ok "POST /calculate → 200 + results rendered"
  else
    err "POST /calculate → 200 but results not found"
  fi
else
  err "POST /calculate → HTTP $RESPONSE"
fi

# ── 5. STATIC ASSETS ──────────────────────────────────────────
echo
echo "5. Static Assets"
for asset in style.css script.js; do
  RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/$asset" || true)
  if [ "$RESP" = "200" ]; then
    ok "GET /$asset → 200"
  else
    err "GET /$asset → HTTP $RESP"
  fi
done

# ── 6. OLD REACT PATHS GONE ───────────────────────────────────
echo
echo "6. Stale React Paths (should return 410 or 404)"
STALE_RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/index.html" || true)
if [ "$STALE_RESP" = "410" ] || [ "$STALE_RESP" = "404" ] || [ "$STALE_RESP" = "302" ]; then
  ok "Old index.html → HTTP $STALE_RESP (correctly blocked)"
else
  info "Old index.html → HTTP $STALE_RESP (investigate if 200)"
fi

# ── 7. ROOT REDIRECT ──────────────────────────────────────────
echo
echo "7. Root Redirect"
ROOT_RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/.." || true)
# Try the parent path to see if root redirect works
ROOT_TARGET=$(echo "$BASE_URL" | sed 's|/[^/]*$||')
if [ -n "$ROOT_TARGET" ]; then
  REDIRECT_RESP=$(curl -s -o /dev/null -w "%{http_code}" "$ROOT_TARGET" || true)
  if [ "$REDIRECT_RESP" = "302" ] || [ "$REDIRECT_RESP" = "301" ] || [ "$REDIRECT_RESP" = "200" ]; then
    ok "Root path handling → HTTP $REDIRECT_RESP"
  else
    info "Root path handling → HTTP $REDIRECT_RESP"
  fi
else
  info "Cannot test root redirect (no parent path)"
fi

# ── SUMMARY ───────────────────────────────────────────────────
echo
echo "=========================================="
echo "  Results: $PASS passed, $FAIL failed"
echo "=========================================="

if [ $FAIL -eq 0 ]; then
  echo -e "  ${GREEN}🚀 Deployment is LIVE and STABLE${NC}"
  exit 0
else
  echo -e "  ${RED}⚠️  $FAIL check(s) failed — review above${NC}"
  exit 1
fi
