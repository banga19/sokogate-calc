# ✅ Sokogate Calculator — Live Deployment Ready

## Summary

Both local and production versions are now **fully synced and working**.

### Local Development (sokogate-calc/)
**Status:** ✅ WORKING — All endpoints tested
```
PORT=3000 BASE_PATH=/Calculate
✓ GET  /Calculate/health           → JSON status
✓ GET  /Calculate/                 → Calculator page
✓ GET  /Calculate/calculate        → Calculator page
✓ POST /Calculate/calculate        → Material results (8 types)
✓ GET  /Calculate/style.css        → CSS (200)
✓ GET  /Calculate/script.js        → JS (200)
```

### Production (sokogate-calc-deploy/)
**Status:** 📁 READY — All files synced, awaiting cPanel upload
- Full `app.js` with BASE_PATH routing ✅
- Correct `package.json` (start: `node app.js`) ✅
- All views, public assets, config files ✅
- ZIP package: `sokogate-calc-cpanel.zip` (36KB) ✅

---

## What Was Fixed

### Issue 1: POST /Calculate/calculate returned 404
**Root cause:** Routes were defined as `/calculate` without `BASE_PATH` prefix.
**Fix:** Used `express.Router()` mounted at `BASE_PATH` → all routes accessible at `/Calculate/*`

### Issue 2: Static files (CSS/JS) not loading
**Root cause:** `express.static()` not mounted under `BASE_PATH`.
**Fix:** `app.use(BASE_PATH, express.static(path.join(__dirname, 'public')))`

### Issue 3: package.json pointed to wrong file
**Root cause:** `"start": "node src/server.js"` but no `src/` in deploy.
**Fix:** Changed to `"start": "node app.js"`, removed unused deps.

### Issue 4: Deploy ZIP had stale files
**Root cause:** Old ZIP included `src/` and `.env`.
**Fix:** `deploy-prep.sh` now excludes `src/`, `.env`, `node_modules/` and validates contents.

---

## File Sync Status

All files in `sokogate-calc-deploy/` match the working local version:

| File | Version | Notes |
|------|---------|-------|
| `app.js` | 204 lines | BASE_PATH routing via router |
| `package.json` | 1.0.0 | 4 dependencies: express, body-parser, cors, ejs |
| `views/index.ejs` | 440 lines | Uses `<%= basePath %>` for all paths |
| `public/style.css` | v1.0.2 | 1116 lines, dark mode, responsive |
| `public/script.js` | 207 lines | Form handling, animations |
| `.htaccess` | 52 lines | Proxy rules commented (safe for Passenger) |
| `DEPLOYMENT.md` | Full guide | cPanel step-by-step |
| `sokogate-calculator-wordpress-plugin.php` | WP integration | For WordPress iframe embedding |

---

## Next Steps: Deploy to cPanel

### Quick Deploy (3 minutes)

1. **Download ZIP** from:
   ```
   /home/apop/sokogate-calc/sokogate-calc-cpanel.zip
   ```

2. **cPanel File Manager:**
   - Upload ZIP to `public_html/Calculate/`
   - Extract in-place

3. **cPanel → Setup Node.js App:**
   ```
   Node.js version:  18.x or 20.x
   Application root: /home/username/public_html/Calculate
   Startup file:     app.js
   Env variables:
     NODE_ENV=production
     PORT=3000
     BASE_PATH=/Calculate
     CORS_ORIGIN=https://ultimotradingltd.co.ke
   ```

4. **Install deps:**
   - Click "Run NPM Install" or `npm install --production` via SSH

5. **Restart app**

6. **Verify:**
   ```bash
   curl https://ultimotradingltd.co.ke/Calculate/health
   # {"status":"ok",...}
   ```

---

## Live Site Currently Shows "Nexus360" — Here's Why

The folder `public_html/Calculate/` contains old static files from a previous deployment:
- `index.html` (React app entry)
- `assets/` folder (React build artifacts)

**Apache serves these files directly** before Node.js can handle the request.

**Fix:** Delete these files AFTER extracting the new ZIP but BEFORE starting the Node.js app.

Order matters:
1. Extract ZIP (overwrites some files)
2. Delete `index.html` and `assets/` (if they still exist)
3. Run `npm install`
4. Restart Node.js app

---

## Verification Checklist

After deployment, run these checks:

- [ ] `GET https://ultimotradingltd.co.ke/Calculate/health` → 200 + JSON
- [ ] `GET https://ultimotradingltd.co.ke/Calculate/` → 200 + Sokogate HTML (no React)
- [ ] `POST https://ultimotradingltd.co.ke/Calculate/calculate` with form data → results page
- [ ] `GET https://ultimotradingltd.co.ke/Calculate/style.css` → 200 + CSS content
- [ ] `GET https://ultimotradingltd.co.ke/Calculate/script.js` → 200 + JS content
- [ ] Browser console: 0 errors
- [ ] No `index.html` or `assets/` in `/Calculate` folder on server
- [ ] Node.js app status: "Running" in cPanel

---

## Quick Test Script (after deployment)

```bash
#!/bin/bash
# Test live deployment
echo "Testing https://ultimotradingltd.co.ke/Calculate/"

echo -e "\n1. Health:"
curl -s https://ultimotradingltd.co.ke/Calculate/health | grep -o '"status":"ok"'

echo -e "\n\n2. Page title:"
curl -s https://ultimotradingltd.co.ke/Calculate/ | grep -o '<title>[^<]*</title>'

echo -e "\n\n3. CSS status:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://ultimotradingltd.co.ke/Calculate/style.css

echo -e "\n4. Calculation (cement):"
curl -s -X POST https://ultimotradingltd.co.ke/Calculate/calculate \
     -d "area=100&materialType=cement" | \
     grep -o '<div class="material-type-badge">[^<]*</div>'

echo -e "\n\n✅ All critical checks completed"
```

---

## Support Documents

- `DEPLOYMENT.md` — Full cPanel guide
- `LIVE-DEPLOYMENT-FIX.md` — This document (specific fixes for live site)
- `TODO_PLAN.md` — Project roadmap and completion status
- `TEST-MATRIX.md` — Comprehensive test results

---

**Status:** Ready for production deployment  
**Updated:** 2026-04-27 22:55 (EAT)  
**Local working:** ✅ Yes  
**Deploy package:** ✅ Latest ZIP regenerated with all fixes
