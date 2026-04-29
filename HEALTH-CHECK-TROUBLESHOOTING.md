# Post-Installation Availability Check Failure: Troubleshooting Guide

**Symptom:** 
- Module installation completes successfully
- Web application appears responsive in browser
- Health/Availability check fails
- HTTP response header discrepancy: `Content-Type` changed from `text/html` to `text/html; charset=utf-8`
- Return code reported as **"None"** by monitoring tool

**Date:** 2026-04-28  
**Application:** Sokogate Calculator  
**Target:** https://ultimotradingltd.co.ke/Calculate

---

## 🔍 Problem Analysis

### The "None" Return Code

**What "None" means:**
The monitoring tool is not receiving a valid HTTP status code. This indicates:
- ❌ Connection refused/timeout (server not responding)
- ❌ HTTP parsing error (malformed response)
- ❌ Wrong URL path (404 page, not JSON health endpoint)
- ❌ Response body not parsed correctly by monitor
- ❌ Network/firewall blocking the health check IP

**The `charset=utf-8` change is NOT the problem.**
- `text/html` → `text/html; charset=utf-8` is an **improvement** (explicit encoding)
- Modern browsers and monitors handle this fine
- Express automatically adds `charset=utf-8` for JSON and HTML responses
- This is a **symptom, not the cause**

### Actual Root Causes (Likely)

| # | Symptom | Most Likely Cause |
|---|---------|-------------------|
| 1 | "None" return code | Health check hitting wrong URL (e.g., `/health` instead of `/Calculate/health`) |
| 2 | "None" return code | BASE_PATH mismatch between cPanel config and environment |
| 3 | App works in browser, monitor fails | Monitor IP blocked by rate limiting or firewall |
| 4 | `text/html` response instead of JSON | Health endpoint returning 404 HTML page (wrong path) |
| 5 | Connection timeout | App not actually running; Passenger process crashed |

---

## 📋 Step-by-Step Diagnosis

### Step 1: Verify Application Is Actually Running

**In cPanel:**
1. Go to **Setup Node.js App**
2. Find your app → Status should show **"Running"** (green dot)
3. Note the **Process ID** shown

**Or via SSH:**
```bash
# Check running Node.js processes
ps aux | grep "node app.js"

# Expected output:
# ultimotr  12345  0.5  2.1  500000  85000 ?  S  20:30   0:05 node /home/ultimotr/public_html/repositories/sokogate-calc-deploy/app.js
```

If no process found → app crashed or not started.

**Check Passenger status:**
```bash
passenger-status
# Should list your app under "Applications"
```

### Step 2: Test Health Endpoint from Server (SSH)

```bash
# Navigate to app directory
cd /home/ultimotr/public_html/repositories/sokogate-calc-deploy

# Test with curl (from server itself)
curl -v http://localhost:3000/Calculate/health

# Expected output:
# > GET /Calculate/health HTTP/1.1
# < HTTP/1.1 200 OK
# < Content-Type: application/json; charset=utf-8
# < ...
# {"status":"ok","basePath":"/Calculate","env":"production","timestamp":"..."}
```

**What to look for:**
- HTTP status code (should be 200)
- `Content-Type` (should be `application/json`)
- Response body (should be valid JSON)

**If you get 404 or connection refused:**
- App not running on port 3000
- BASE_PATH is wrong
- Health route not mounted correctly

### Step 3: Test Health Endpoint from External (Like Monitor Does)

```bash
# From your local machine (NOT SSH into server)
curl -I https://ultimotradingltd.co.ke/Calculate/health

# Expected:
# HTTP/2 200
# content-type: application/json; charset=utf-8
# ...

curl -s https://ultimotradingltd.co.ke/Calculate/health | json_pp
# Should pretty-print JSON
```

**Common findings:**
- `HTTP/1.1 404 Not Found` → Wrong URL path
- `HTTP/1.1 502 Bad Gateway` → Passenger/Apache misconfiguration
- `curl: (7) Failed to connect` → Port blocked, app not running
- `HTTP/1.1 429 Too Many Requests` → Rate limited (monitor IP blocked)
- `{"error":"Route not found"}` → App responding but wrong route

### Step 4: Check the Actual URL Path

**Critical question:** What URL is the monitoring tool checking?

The health endpoint in `app.js` is mounted at:
```javascript
router.get('/health', ...)  // This becomes: BASE_PATH + '/health'
```

**So actual URL depends on BASE_PATH:**

| BASE_PATH (env) | Health Check URL |
|-----------------|------------------|
| `/Calculate` | `https://ultimotradingltd.co.ke/Calculate/health` |
| `/` | `https://ultimotradingltd.co.ke/health` |
| `/repositories/sokogate-calc-deploy` | `https://ultimotradingltd.co.ke/repositories/sokogate-calc-deploy/health` |

**Verify BASE_PATH on server:**
```bash
# Check environment in cPanel
cat ~/.cpanel/nodes/sokogate-calc/environment
# Should contain: BASE_PATH=/Calculate

# Or create a debug endpoint temporarily:
# Add to app.js before routes:
app.get('/debug-env', (req, res) => {
  res.json({
    BASE_PATH: process.env.BASE_PATH,
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV
  });
});
# Then: curl https://.../Calculate/debug-env
```

### Step 5: Examine the Monitoring Tool's Configuration

**What URL is it checking?**
- UptimeRobot: Check "Web Site" → "URL (required)" field
- Pingdom: Check "HTTP Check" → "URL"
- New Relic: Check "Settings" → "Health check URL"
- Custom script: Check the curl/wget command

**Common mistake:**
```
Monitor URL: https://ultimotradingltd.co.ke/health
Actual URL:  https://ultimotradingltd.co.ke/Calculate/health
               ^^^^^^^^^^^^^^^^^^^^^^^^ missing /Calculate
```

**Fix:** Set monitor URL to `https://ultimotradingltd.co.ke/Calculate/health`

---

## ✅ Solution Steps

### Solution 1: Ensure Correct BASE_PATH in cPanel

**In cPanel → Setup Node.js App → Edit:**

Environment Variables must include:
```
NODE_ENV=production
PORT=3000
BASE_PATH=/Calculate                    ← CRITICAL
CORS_ORIGIN=https://ultimotradingltd.co.ke
```

**After changing, RESTART the app:**
- Click "Restart" button
- Wait 10 seconds

**Verify:**
```bash
curl -s https://ultimotradingltd.co.ke/Calculate/health
# Should return {"status":"ok",...}
```

### Solution 2: Update Health Check URL in Monitoring Tool

**Configure monitor to hit the FULL path:**

If using **UptimeRobot:**
1. Edit the monitor
2. URL: `https://ultimotradingltd.co.ke/Calculate/health`
3. Type: HTTP(s)
4. Expected keywords: `"ok"` (or leave blank for status code 200)
5. Save

If using **Pingdom:**
1. Settings → HTTP Check
2. URL: `https://ultimotradingltd.co.ke/Calculate/health`
3. Expected response: `200`
4. Save

If using **custom script:**
```bash
#!/bin/bash
# Update this line:
URL="https://ultimotradingltd.co.ke/Calculate/health"  # ← Add /Calculate

response=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
if [ "$response" = "200" ]; then
  echo "OK"
  exit 0
else
  echo "FAIL: HTTP $response"
  exit 1
fi
```

### Solution 3: Fix healthcheck.js for Docker (Optional)

If using Docker healthcheck, update `healthcheck.js` to respect BASE_PATH:

```javascript
// Current (hardcoded):
const BASE_PATH = '/Calculate';  // or read from env
const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/Calculate/health',  // ← Hardcoded
  method: 'GET'
};

// Fixed (dynamic):
const BASE_PATH = process.env.BASE_PATH || '/Calculate';
const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: `${BASE_PATH}/health`,  // ← Uses BASE_PATH
  method: 'GET'
};
```

But note: `healthcheck.js` is only used by Docker, not by cPanel's availability check. cPanel uses its own internal health monitoring.

### Solution 4: Create a Simpler Health Endpoint at Root (Optional)

If your monitoring tool cannot be configured with a subpath, add a root-level health check:

**In `app.js`, before other routes:**
```javascript
// Simple health at /health (no BASE_PATH prefix)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Use /Calculate/health for full status'
  });
});

// Keep the BASE_PATH-mounted health as well
router.get('/health', ...);
```

**Then point monitor to:** `https://ultimotradingltd.co.ke/health`

**Caution:** This creates two health endpoints. Ensure both work or restrict to one.

### Solution 5: Check Rate Limiting Interference

If the monitoring tool's IP is rate-limited, it might get 429 or connection refused after a few checks.

**Check rate limiter config in `app.js`:**
```javascript
const createRateLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,                  // Max requests per window
    // ...
  });
};
```

**Solution:** Whitelist monitoring IPs:
```javascript
app.use(createRateLimiter({
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/Calculate/health'
}));

// Or whitelist specific IPs
const whitelist = ['123.45.67.89']; // Monitor IP
app.use(createRateLimiter({
  skip: (req) => whitelist.includes(req.ip)
}));
```

---

## 🔧 Application Status Diagnosis

### Check Current Environment on cPanel

**Via SSH:**
```bash
# View environment variables for the app
cat ~/.cpanel/nodes/sokogate-calc/environment

# Look for:
# BASE_PATH=/Calculate
# If it's /repositories/sokogate-calc-deploy → WRONG
```

**Via cPanel UI:**
1. Setup Node.js App → Find app → **Edit**
2. Scroll to **Environment Variables**
3. Verify `BASE_PATH=/Calculate`

### Check Current Application Logs

**In cPanel:**
1. Setup Node.js App → Click your app name
2. **Application Logs** tab
3. Look for errors on startup

**Or SSH:**
```bash
tail -50 ~/logs/passenger.log
# Or:
tail -50 /home/ultimotr/logs/passenger.log
```

**Look for:**
- `Error: Cannot find module` → dependencies missing
- `Port 3000 already in use` → conflict
- `EADDRNOTAVAIL` → bind error
- `EACCES` → permission denied

### Check If Routes Are Mounted Correctly

**Add temporary debug route:**
```javascript
// In app.js, before app.use(BASE_PATH, router);
app.get('/debug-routes', (req, res) => {
  res.json({
    BASE_PATH: BASE_PATH,
    method: req.method,
    url: req.url,
    baseUrl: req.baseUrl,
    path: req.path,
    originalUrl: req.originalUrl
  });
});
```

Then test:
```bash
curl https://ultimotradingltd.co.ke/debug-routes
# Should show BASE_PATH in response
```

---

## 📊 Understanding the `charset=utf-8` Change

**Why it changed:**
- Older Express versions (or certain configurations) return `text/html` without charset
- Newer Express (4.18+) automatically adds `charset=utf-8` to `Content-Type`
- This is **correct and expected behavior**

**Impact on monitoring:**
- Most HTTP clients handle both `text/html` and `text/html; charset=utf-8` identically
- If your monitor is failing due to charset, it's **buggy** and should be configured to ignore headers or accept charset
- **Workaround:** Explicitly set header without charset (NOT recommended):
  ```javascript
  res.set('Content-Type', 'application/json');  // No charset
  res.json({status: 'ok'});
  ```
  But Express will still add charset. To remove:
  ```javascript
  res.type('application/json').send(JSON.stringify({status: 'ok'}));
  ```

**Real issue is NOT charset.** Focus on HTTP status code and response body.

---

## 🎯 Quick Diagnostic Script

Run this from your local machine to test everything:

```bash
#!/bin/bash
# health-check-debug.sh

URL="https://ultimotradingltd.co.ke/Calculate/health"
EXPECTED_STATUS=200
EXPECTED_BODY='"status":"ok"'

echo "=== Sokogate Calculator Health Check Debug ==="
echo "URL: $URL"
echo ""

echo "1. Testing HTTP status and headers:"
curl -s -o /dev/null -w "Status: %{http_code}\nContent-Type: %{content_type}\nTotal time: %{time_total}s\n" "$URL"
echo ""

echo "2. Full response:"
curl -s "$URL" | python3 -m json.tool 2>/dev/null || curl -s "$URL"
echo ""

echo "3. Testing without following redirects:"
curl -s -L -I "$URL" 2>&1 | head -20
echo ""

echo "4. Testing from different user-agent (monitor simulation):"
curl -s -A "UptimeRobot/1.0" -o /dev/null -w "Status: %{http_code}\n" "$URL"
echo ""

echo "5. Checking if /health exists without /Calculate prefix:"
curl -s -o /dev/null -w "Status: %{http_code}\n" "https://ultimotradingltd.co.ke/health"
echo ""

echo "6. Testing main app page:"
curl -s -o /dev/null -w "Status: %{http_code}\n" "https://ultimotradingltd.co.ke/Calculate"
echo ""

echo "=== Debug Complete ==="
```

**Interpretation:**
- If `/Calculate/health` returns 200 but `/health` returns 404 → monitor URL is wrong
- If both return 200 → monitor config is OK, issue elsewhere
- If `Content-Type` is `text/html` → hitting wrong endpoint (404 page is HTML)
- If `time_total` > 10s → timeout, app slow or blocked

---

## 📈 Monitoring Tool Configuration Examples

### UptimeRobot

**Settings:**
- Monitor Type: **HTTP(s)**
- Friendly Name: `Sokogate Calculator Health`
- URL (required): `https://ultimotradingltd.co.ke/Calculate/health`
- Monitor Interval: **5 minutes**
- Timeout: **30 seconds**
- Expected Keyword(s): `"ok"` (optional)
- Alert Contacts: your email/SMS

**Common pitfalls:**
- ❌ Using `https://ultimotradingltd.co.ke/health` (missing `/Calculate`)
- ❌ HTTP instead of HTTPS
- ❌ Timeout too short (15s) for cold start

### Pingdom

**Settings:**
- Check type: **HTTP**
- URL: `https://ultimotradingltd.co.ke/Calculate/health`
- Expected response: **200**
- Follow redirects: **No**
- Verify SSL: **Yes**
- IP-based: **Auto**

### New Relic Synthetics

**Scripted Monitor:**
```javascript
{
  "url": "https://ultimotradingltd.co.ke/Calculate/health",
  "expectedResponseCode": 200,
  "expectedContent": "ok"
}
```

### Custom Bash Script (cron)

```bash
#!/bin/bash
URL="https://ultimotradingltd.co.ke/Calculate/health"
LOG="/home/ultimotr/logs/health-check.log"

status=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
if [ "$status" = "200" ]; then
  echo "$(date): OK (HTTP $status)" >> "$LOG"
  exit 0
else
  echo "$(date): FAILED (HTTP $status)" >> "$LOG"
  # Send alert
  mail -s "Sokogate Calculator Down" admin@ultimotradingltd.co.ke <<< "Health check failed: HTTP $status"
  exit 1
fi
```

Add to crontab:
```
*/5 * * * * /home/ultimotr/scripts/health-check.sh
```

---

## 🛠️ Fixes to Apply

### Immediate Fix (Most Likely)

**Update monitoring tool URL to include `/Calculate`:**
```
Before: https://ultimotradingltd.co.ke/health
After:  https://ultimotradingltd.co.ke/Calculate/health
```

**Why this fixes:**
- App is mounted at `/Calculate` (BASE_PATH)
- Health route is at `BASE_PATH + /health`
- Monitor was hitting root-level `/health` → 404 → "None" status

### Verify Fix

```bash
# Should return 200 with JSON
curl -I https://ultimotradingltd.co.ke/Calculate/health

# Should NOT return 200 (unless you added root-level /health)
curl -I https://ultimotradingltd.co.ke/health
```

Set monitor to the first URL.

---

## 📋 Post-Fix Verification Checklist

After applying fixes, verify:

- [ ] `curl -I https://ultimotradingltd.co.ke/Calculate/health` returns `HTTP/2 200`
- [ ] Response `Content-Type` is `application/json; charset=utf-8` (OK) or `application/json`
- [ ] Response body contains `"status":"ok"`
- [ ] Monitor shows **"UP"** or **"OK"** within 5 minutes
- [ ] No 404s in monitor logs
- [ ] Monitor receives valid HTTP status code (not "None")

---

## 🐛 Bug Scenarios & Resolutions

### Scenario A: Monitor Reports "None" but Browser Works

**Cause:** Monitor checking wrong URL (e.g., `/health` instead of `/Calculate/health`)

**Fix:** Update monitor URL to include base path.

### Scenario B: Both Browser and Monitor Fail

**Cause:** App not running or crashed

**Fix:**
1. cPanel → Setup Node.js App → Restart
2. Check logs for startup errors
3. Ensure dependencies installed (`npm install`)
4. Verify `app.js` syntax

### Scenario C: Browser Works, Monitor Gets 403/429

**Cause:** Rate limiting blocks monitor IP after repeated checks

**Fix:** Whitelist monitor IP or health check path in rate limiter.

### Scenario D: Monitor Gets HTML Instead of JSON

**Cause:** Hitting `/Calculate` (returns HTML page) instead of `/Calculate/health` (returns JSON)

**Fix:** Use correct health endpoint URL.

### Scenario E: Charset Actually Causing Parse Error (Rare)

Some poorly written monitors try to parse `Content-Type` header and fail on `; charset=utf-8`.

**Fix in app.js:**
```javascript
router.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');  // Set without charset
  res.send(JSON.stringify({
    status: 'ok',
    basePath: BASE_PATH,
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }));
});
```

But this is a monitor bug; better to fix monitor configuration.

---

## 📊 Character Set Analysis

| Content-Type | Valid? | Should work? | Notes |
|--------------|--------|--------------|-------|
| `text/html` | ✅ Yes | ✅ Yes | Basic, no charset specified (defaults to ISO-8859-1 in HTTP/1.1) |
| `text/html; charset=utf-8` | ✅ Yes | ✅ Yes | **Explicit UTF-8** - better |
| `application/json` | ✅ Yes | ✅ Yes | JSON without explicit charset (defaults to UTF-8 per RFC 8259) |
| `application/json; charset=utf-8` | ✅ Yes | ✅ Yes | Explicit - best practice |

**Conclusion:** Charset change is **normal** and **not the cause** of monitor failure.

---

## 🔍 Root Cause Summary

Based on the symptoms:
1. **"None" return code** → Monitor didn't receive valid HTTP response
2. **App works in browser** → App is running, just wrong path for monitor
3. **Content-Type changed** → Red herring; Express adds charset automatically

**Most probable cause:**
> **Monitoring tool is checking `https://ultimotradingltd.co.ke/health` instead of `https://ultimotradingltd.co.ke/Calculate/health`**

Because:
- App is mounted at `/Calculate` (BASE_PATH)
- Health route is at `/Calculate/health`
- Without `/Calculate`, request hits 404 or root redirect → HTML response or 302 → monitor can't parse → "None"

---

## ✅ Final Resolution Steps

1. **Confirm BASE_PATH:**
   ```bash
   curl -s https://ultimotradingltd.co.ke/Calculate/health
   # Must return JSON with "status":"ok"
   ```

2. **Update monitoring tool:**
   - URL: `https://ultimotradingltd.co.ke/Calculate/health`
   - Expected HTTP code: `200`
   - Expected string (optional): `"ok"`

3. **Test from monitor's location:**
   Some monitors run from specific regions. Test from external:
   ```bash
   curl -I https://ultimotradingltd.co.ke/Calculate/health
   # Should be publicly accessible
   ```

4. **Wait for monitor refresh** (5-30 minutes depending on interval)

5. **Verify monitor status changes to "UP"**

---

## 📚 Additional Resources

- **cPanel logs:** `/home/ultimotr/logs/passenger.log`
- **App logs:** cPanel → Setup Node.js App → Application Logs
- **Route listing (debug):** Add `app._router.stack` dump to app.js temporarily
- **Express docs:** https://expressjs.com/en/4x/api.html#app.use

---

**TL;DR:** The `charset=utf-8` is harmless. The "None" return code means your monitor is hitting the wrong URL. Set it to `https://ultimotradingltd.co.ke/Calculate/health` (include `/Calculate`). Restart monitor. Done.
