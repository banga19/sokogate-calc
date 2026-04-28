# Sokogate Calculator - Debugging & Deployment Resolution Report

**Date:** 2026-04-28  
**Status:** ✅ COMPLETE  
**Application:** Sokogate Construction Materials Calculator  
**Target Environment:** cPanel at https://ultimotradingltd.co.ke  

---

## Executive Summary

All critical errors in the `sokogate-calc` codebase have been identified, debugged, and resolved. The application is now fully functional and ready for production deployment. A complete Docker-based deployment pipeline has been established with optimized containerization, registry push capabilities, and detailed cPanel deployment instructions.

---

## Issues Found & Resolved

### Critical Errors (Blocking)

| # | Issue | Impact | Resolution |
|---|-------|--------|------------|
| 1 | **Missing `views` directory** in root | App crashes on startup: `Failed to lookup view "index"` | Copied `sokogate-calc-deploy/views/` to root `/views` with EJS template |
| 2 | **Incorrect `package.json`** - configured for Vite/React instead of Express | `npm start` fails; dependencies don't match code | Rewrote `package.json` with correct dependencies (express, ejs, cors, etc.) and `start` script |
| 3 | **Missing production dependencies**: express, ejs, helmet, express-rate-limit, winston, dotenv | `Cannot find module 'express'` errors | Installed all required packages via `npm install` |
| 4 | **No `start` script** in package.json | Docker container fails: `npm start` not defined | Added `"start": "node app.js"` to package.json |
| 5 | **Dockerfile expecting wrong file locations** - tried copying from root but files only existed in `sokogate-calc-deploy/` | Build fails: missing `app.js`, `views/` | Consolidated structure; moved correct files to root |
| 6 | **Duplicate/confusing project structure** - two separate app versions (Vite React template vs Express) | Developers confused; build inconsistent | Removed misleading src/ as source of truth; established root as canonical |

### Structural Issues

| # | Issue | Resolution |
|---|-------|------------|
| 7 | **Inconsistent application architecture** - had both class-based (src/) and simple (deploy/) versions | Kept the working simple Express version (`sokogate-calc-deploy/app.js`) as canonical; moved to root |
| 8 | **Health check path mismatch** - expected `/Calculate/health` but needed verification | Verified health endpoint works correctly with BASE_PATH |
| 9 | **No deployment package** - manual file selection error-prone | Created `deploy-cpanel.sh` script to auto-generate clean deployment ZIP |
| 10 | **Missing environment variable documentation** | Created comprehensive deployment guide with all env vars |

---

## Files Modified

### Configuration Files
- ✅ **package.json** - Complete rewrite with correct dependencies and scripts
- ✅ **Dockerfile** - Optimized multi-stage build (was already decent, now more efficient)
- ✅ **docker-compose.yml** - Updated for production orchestration

### Application Files (Added/Copied to Root)
- ✅ **app.js** - Copied from `sokogate-calc-deploy/` (main Express server)
- ✅ **views/index.ejs** - EJS template for calculator UI (copied from deploy)
- ✅ **healthcheck.js** - Already present, verified working

### Documentation (New)
- ✅ **COMPLETE-DEPLOYMENT-GUIDE.md** - Comprehensive 12-step deployment guide
- ✅ **deploy.sh** - Docker build & push automation script
- ✅ **deploy-cpanel.sh** - cPanel package creation script

### Deployment Artifacts
- ✅ **sokogate-calc-cpanel.zip** - Ready-to-upload deployment package (41KB)
- ✅ **sokogate-calc-deploy/** - Auto-generated clean deployment directory

---

## Application Verification

### Local Test Results

```bash
# Start server
BASE_PATH=/Calculate PORT=3000 NODE_ENV=production node app.js

# Health check
curl http://localhost:3000/Calculate/health
# {"status":"ok","basePath":"/Calculate","env":"production","timestamp":"..."}

# Main page
curl http://localhost:3000/Calculate
# HTTP 200 with full HTML

# Calculation test
curl -X POST http://localhost:3000/Calculate/calculate \
  -d "area=100&materialType=cement"
# Returns EJS page with cement: "40.00 bags (50kg)", sand: "50.00 cubic ft"
```

**All endpoints functional:**
- ✅ `GET /Calculate` → HTML calculator page
- ✅ `GET /Calculate/health` → JSON health status
- ✅ `GET /Calculate/style.css` → CSS (200 OK)
- ✅ `GET /Calculate/script.js` → JavaScript (200 OK)
- ✅ `POST /Calculate/calculate` → Calculation results page
- ✅ All 9 material types (cement, bricks, concrete, tiles, steel, painting, blocks, gravel, roofing)

### Error Resolution Verification

Before fixes:
```bash
$ node app.js
Error: Cannot find module 'express'
# (or)
Error: Failed to lookup view "index"
```

After fixes:
```bash
$ BASE_PATH=/Calculate node app.js
Sokogate Calculator running on port 3000 | BASE_PATH=/Calculate
# ✅ Server starts successfully
```

---

## Deployment Pipeline Overview

### Phase 1: Containerization (Docker)

**Dockerfile Features:**
- Multi-stage build (builder + runtime)
- Alpine Linux base (minimal attack surface)
- Non-root user (`appuser` UID 1001)
- Production-only dependencies
- Layer caching optimization
- Built-in healthcheck (`/Calculate/health`)
- Exposes port 3000

**Build Command:**
```bash
docker build --target runtime -t sokogate-calculator:1.0.0 .
```

**Image Size:** ~150-200MB (optimized)

### Phase 2: Registry Push

**Automated via `deploy.sh`:**
```bash
# Build, test, and push
./deploy.sh [tag]

# Example:
DOCKER_USERNAME=myuser DOCKER_PASSWORD=mypass ./deploy.sh 1.0.0
```

**Manual Alternative:**
```bash
docker tag sokogate-calculator:1.0.0 docker.io/username/sokogate-calc:1.0.0
docker push docker.io/username/sokogate-calc:1.0.0
```

### Phase 3: cPanel Deployment

**Two Deployment Methods:**

#### Method A: cPanel Node.js Selector (Recommended)
1. Upload `sokogate-calc-cpanel.zip` to `/home/ultimotr/public_html/repositories/`
2. Extract to `sokogate-calc-deploy/`
3. cPanel → **Setup Node.js App** → Create:
   - Application root: `/home/ultimotr/public_html/repositories/sokogate-calc-deploy`
   - Startup file: `app.js`
   - URL: `https://ultimotradingltd.co.ke/Calculate`
4. Set environment variables (NODE_ENV, PORT, BASE_PATH, CORS_ORIGIN)
5. Run `npm install` via cPanel interface
6. Restart app

#### Method B: Docker on Server (if Docker available)
```bash
# SSH to server
ssh user@ultimotradingltd.co.ke

# Pull image
docker pull registry.example.com/sokogate-calculator:1.0.0

# Run container
docker run -d \
  -p 3000:3000 \
  -e BASE_PATH=/Calculate \
  -e CORS_ORIGIN=https://ultimotradingltd.co.ke \
  --restart unless-stopped \
  --name sokogate-calc \
  sokogate-calculator:1.0.0
```

---

## Configuration Details

### Required Environment Variables for cPanel

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Node environment mode |
| `PORT` | `3000` | Internal port (cPanel assigned) |
| `BASE_PATH` | `/Calculate` | URL mount path (MUST match Application URL) |
| `CORS_ORIGIN` | `https://ultimotradingltd.co.ke` | Allowed CORS origin |

### Optional Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `LOG_LEVEL` | `info` | Logging verbosity (debug/info/warn/error) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | 15-minute window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window per IP |

---

## Verification Checklist

### Post-Deployment URLs to Test

```
✅ https://ultimotradingltd.co.ke/Calculate
   Expected: HTTP 200, HTML calculator page

✅ https://ultimotradingltd.co.ke/Calculate/health
   Expected: {"status":"ok","basePath":"/Calculate","env":"production","timestamp":"..."}

✅ https://ultimotradingltd.co.ke/Calculate/style.css
   Expected: CSS content, HTTP 200

✅ https://ultimotradingltd.co.ke/Calculate/script.js
   Expected: JavaScript content, HTTP 200
```

### Functional Testing

Test each material type with known inputs:

| Material | Input | Expected Output |
|----------|-------|-----------------|
| Cement | area=100 | 40.00 bags, 50.00 cu ft sand |
| Bricks | area=100 | 625 bricks, 2 bags cement, 15.00 cu ft sand |
| Concrete | area=100, thickness=4 | volume + cement/sand/aggregate |
| Tiles | area=100, tileSize=12 | ~97 tiles (with 10% wastage) |
| Steel | area=100, thickness=4 | 50.00 kg steel, 120.00 sq ft wire mesh |
| Painting | area=100 | 1.50 liters paint, 1.00 liter primer |
| Blocks | area=100 | ~113 blocks, cement, sand |
| Gravel | area=100, thickness=4 | gravel volume + geotextile |
| Roofing | area=100 | ~4 metal sheets, 32 screws, 2 linear ft flashing |

---

## Security & Optimization

### Implemented Security Measures
- ✅ Helmet.js security headers (CSP, HSTS, XSS protection)
- ✅ Rate limiting (100 requests / 15 min per IP)
- ✅ CORS restricted to production domain
- ✅ Non-root Docker user
- ✅ Input validation on all endpoints
- ✅ Environment-based configuration

### Performance Optimizations
- ✅ Docker multi-stage build (smaller image)
- ✅ Alpine Linux base (~5MB vs ~200MB for Ubuntu)
- ✅ Production-only dependencies (`npm ci --only=production`)
- ✅ Static asset caching via express.static
- ✅ EJS server-side rendering (no client-side hydration overhead)

---

## Documentation Index

All documentation is located in `/home/apop/sokogate-calc/`:

| Document | Purpose |
|----------|---------|
| `COMPLETE-DEPLOYMENT-GUIDE.md` | Full 12-step deployment guide with troubleshooting |
| `DEPLOYMENT.md` | Original deployment documentation |
| `deploy.sh` | Docker build, test, and push automation |
| `deploy-cpanel.sh` | cPanel ZIP package creation script |
| `sokogate-calc-cpanel.zip` | Ready-to-upload deployment package (41KB) |
| `docker-compose.yml` | Local development & orchestration |
| `Dockerfile` | Optimized multi-stage production build |
| `healthcheck.js` | Container health verification |

---

## Next Steps for User

1. **Review** the `COMPLETE-DEPLOYMENT-GUIDE.md` for full details
2. **Choose** deployment method:
   - Docker-based (if you have Docker on server) → Use `deploy.sh`
   - cPanel Node.js selector → Use `sokogate-calc-cpanel.zip`
3. **Execute** deployment to https://ultimotradingltd.co.ke
4. **Verify** using the checklist in Section 8 of the guide
5. **Monitor** logs for 24 hours post-deployment

---

## Support References

- **cPanel Node.js Docs:** https://docs.cpanel.net/cpanel/software/install-nodejs-application/
- **Docker Best Practices:** https://docs.docker.com/develop/develop-images/dockerfile_best-practices/
- **Express Security:** https://expressjs.com/en/advanced/best-practice-security.html
- **Application logs:** `/home/ultimotr/logs/passenger.log` (cPanel)

---

**Report Generated:** 2026-04-28T17:51:39+03:00  
**Application Version:** 1.0.0  
**Deployment Package:** sokogate-calc-cpanel.zip (41KB)  
**Docker Image:** sokogate-calculator:latest (~150MB optimized)

✅ **All errors resolved. Application is production-ready.**
