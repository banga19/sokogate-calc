# Sokogate Calculator - Complete Deployment Pipeline

## Overview
This guide provides a step-by-step deployment pipeline for the Sokogate Construction Calculator application to cPanel at https://ultimotradingltd.co.ke.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Validation](#local-validation)
3. [Docker Image Building](#docker-image-building)
4. [Pushing to Docker Registry](#pushing-to-docker-registry)
5. [cPanel Deployment](#cpanel-deployment)
6. [Reverse Proxy Configuration](#reverse-proxy-configuration)
7. [Environment Variables](#environment-variables)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Access
- cPanel access at https://ultimotradingltd.co.ke:2083
- SSH access to cPanel server (optional but recommended)
- Docker Hub account or private registry access
- Docker installed locally
- Git installed locally

### Local Environment
```bash
# Verify installations
docker --version        # >= 20.10
docker-compose --version # >= 1.29
node --version         # >= 18.0.0
npm --version
git --version
```

### cPanel Requirements
- **Node.js Support**: Phusion Passenger must be enabled
- **Node.js Version**: 18.x or 20.x recommended
- **Memory**: Minimum 512MB RAM allocated to Node.js apps
- **Storage**: Sufficient space for node_modules (~200MB)

---

## Step 1: Local Validation

Before deployment, verify the application is stable locally.

### Install Dependencies
```bash
cd /home/apop/sokogate-calc
npm ci --only=production
```

### Run Health Check
```bash
npm test
# Expected output: {"status":"ok","basePath":"/Calculate","env":"production","timestamp":"..."}
```

### Start Development Server
```bash
# Using .env configuration
npm run dev

# Or with custom environment
BASE_PATH=/Calculate PORT=3000 NODE_ENV=production node app.js
```

### Test Endpoints
```bash
# Health endpoint
curl http://localhost:3000/Calculate/health

# Main page
curl http://localhost:3000/Calculate

# Static CSS
curl http://localhost:3000/Calculate/style.css -I

# Test calculation
curl -X POST http://localhost:3000/Calculate/calculate \
  -d "area=100&materialType=cement"
```

**Expected Results:**
- `/Calculate/health`: `200 OK` with JSON status
- `/Calculate`: `200 OK` with HTML page
- `/Calculate/style.css`: `200 OK` with CSS content
- POST to `/calculate`: Returns EJS-rendered page with results

---

## Step 2: Docker Image Building

### Build Production Image

```bash
cd /home/apop/sokogate-calc

# Build with tag
docker build \
  --target runtime \
  -t sokogate-calculator:1.0.0 \
  -t sokogate-calculator:latest \
  .

# View image details
docker images | grep sokogate
```

### Multi-Stage Build Optimization

The Dockerfile uses a multi-stage build:

1. **Builder Stage** (`node:18-alpine`):
   - Installs ALL dependencies (including dev for linting)
   - Copies source code
   - Runs lint checks
   - Creates optimized layer cache

2. **Runtime Stage** (`node:18-alpine`):
   - Copies only production dependencies from builder
   - Copies only necessary runtime files (app.js, views, public, healthcheck.js)
   - Excludes dev dependencies, tests, docs, git history
   - Sets non-root user `appuser` (UID 1001)
   - Configures healthcheck
   - Exposes port 3000

**Image Size:** ~150-200MB (vs ~500MB for single-stage)

### Docker Build Optimizations Applied

- `.dockeringore` excludes: `node_modules/`, `.git/`, `*.md`, `tests/`, `dist/`, `build/`
- Dependency layer caching by copying `package*.json` first
- `npm ci --only=production` in runtime stage
- Non-root user for security
- Alpine Linux base for minimal footprint

---

## Step 3: Pushing to Docker Registry

### Option A: Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag for registry
docker tag sokogate-calculator:1.0.0 yourusername/sokogate-calculator:1.0.0
docker tag sokogate-calculator:latest yourusername/sokogate-calculator:latest

# Push to Docker Hub
docker push yourusername/sokogate-calculator:1.0.0
docker push yourusername/sokogate-calculator:latest

# Verify
docker pull yourusername/sokogate-calculator:1.0.0
```

### Option B: Private Registry

```bash
# Tag with registry URL
docker tag sokogate-calculator:1.0.0 registry.example.com/sokogate-calculator:1.0.0

# Push to private registry
docker push registry.example.com/sokogate-calculator:1.0.0
```

### Option C: Save as Tarball (for manual upload)

```bash
# Save image to file
docker save sokogate-calculator:1.0.0 -o sokogate-calculator-1.0.0.tar

# Compress
gzip sokogate-calculator-1.0.0.tar

# Upload to server and load
# scp sokogate-calculator-1.0.0.tar.gz user@server:/home/username/
# gunzip -c sokogate-calculator-1.0.0.tar.gz | docker load
```

---

## Step 4: cPanel Deployment

### 4.1 Prepare Application Files

**Files to upload to cPanel:**
```
app.js                  # Main Express application
package.json            # Dependencies manifest
package-lock.json       # Locked dependency versions
public/                 # Static assets (CSS, JS, images)
views/                  # EJS templates
healthcheck.js          # Docker healthcheck (optional for cPanel)
```

**Do NOT upload:**
```
node_modules/           # Installed on server
.git/                   # Git history
*.tar.gz, *.zip         # Archives
logs/                   # Local logs
src/                    # React source (not used in production)
sokogate-calc-deploy/   # Redundant copy
.DS_Store, *.swp        # Temporary files
```

### 4.2 Upload via cPanel File Manager

1. Login to cPanel → **File Manager**
2. Navigate to: `/home/ultimotr/public_html/repositories/`
3. Create folder: `sokogate-calc-deploy/`
4. Upload files (zip and extract, or individual upload)
5. Set permissions:
   ```bash
   # Via SSH or File Manager
   chmod 755 /home/ultimotr/public_html/repositories/sokogate-calc-deploy
   chmod 644 /home/ultimotr/public_html/repositories/sokogate-calc-deploy/*.js
   chmod 644 /home/ultimotr/public_html/repositories/sokogate-calc-deploy/*.json
   ```

### 4.3 Setup Node.js App in cPanel

1. In cPanel, locate **"Setup Node.js App"** (or "Node.js Selector")
2. Click **"Create Application"**
3. Configure settings:

| Field | Value |
|-------|-------|
| Node.js version | 18.x or 20.x |
| Application mode | Production |
| Application root | `/home/ultimotr/public_html/repositories/sokogate-calc-deploy` |
| Application URL | `https://ultimotradingltd.co.ke/Calculate` |
| Application startup file | `app.js` |

4. Click **Create**

### 4.4 Set Environment Variables

In the Node.js App settings, click **"Edit"** and add environment variables:

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | Yes |
| `PORT` | `3000` | Yes |
| `BASE_PATH` | `/Calculate` | Yes |
| `CORS_ORIGIN` | `https://ultimotradingltd.co.ke` | Yes |
| `LOG_LEVEL` | `info` | No |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 min) | No |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | No |

**Important:** The `BASE_PATH` must match the URL path configured in cPanel.

### 4.5 Install Dependencies

**Method A: cPanel Interface**
1. In **Setup Node.js App**, find your application
2. Click **"Run NPM Install"**
3. Wait for completion (2-5 minutes)

**Method B: SSH (if available)**
```bash
cd /home/ultimotr/public_html/repositories/sokogate-calc-deploy
npm ci --only=production
```

### 4.6 Restart Application

1. In cPanel → **Setup Node.js App**
2. Find your application
3. Click **"Restart"**
4. Wait 10-20 seconds for startup

**Check application status:**
- Should show **"Running"** with green indicator
- Process ID should be displayed

---

## Step 5: Reverse Proxy Configuration

### 5.1 Automatic (Phusion Passenger)

cPanel's Node.js integration uses Phusion Passenger, which automatically handles:
- Reverse proxying from Apache/Nginx to Node.js
- Port allocation via `process.env.PORT`
- Process management and restarts

**No manual proxy configuration needed if using cPanel's Node.js selector.**

### 5.2 Manual .htaccess (if using custom setup)

If you need custom reverse proxy rules (e.g., WordPress integration), edit `.htaccess`:

```apache
# Enable rewrite engine
RewriteEngine On

# Proxy requests to Node.js app (running on assigned port)
RewriteCond %{REQUEST_URI} ^/Calculate
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]

# Optional: Handle WordPress conflicts
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
```

**Caution:** When using cPanel's built-in Node.js, the `.htaccess` proxy rules should be **commented out** to avoid conflicts with Passenger. Uncomment only for WordPress iframe integration.

### 5.3 WordPress iframe Integration

If embedding calculator in WordPress:

1. Install the WordPress plugin: `sokogate-calculator-wordpress-plugin.php`
2. Activate plugin in WordPress admin
3. Uncomment proxy rule in `.htaccess`
4. Ensure `PORT` matches between `.htaccess` and cPanel environment

---

## Step 6: Environment Variables Reference

### Required for cPanel

```bash
NODE_ENV=production
PORT=3000                    # Assigned by cPanel, verify in app settings
BASE_PATH=/Calculate         # Must match Application URL path
CORS_ORIGIN=https://ultimotradingltd.co.ke
```

### Optional (Production Tuning)

```bash
# Logging
LOG_LEVEL=info               # debug, info, warn, error

# Rate Limiting (protect against abuse)
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Per window per IP

# Application
NODE_TLS_REJECT_UNAUTHORIZED=0  # Only if using self-signed certs (not recommended)
```

### For Docker Compose (Local Development)

Create `.env` file in project root:
```bash
NODE_ENV=production
APP_PORT=3000
BASE_PATH=/Calculate
CORS_ORIGIN=https://ultimotradingltd.co.ke
```

---

## Step 7: Post-Deployment Verification

### 7.1 Basic Connectivity Tests

```bash
# Test main page
curl -I https://ultimotradingltd.co.ke/Calculate

# Test health endpoint
curl https://ultimotradingltd.co.ke/Calculate/health

# Test static assets
curl -I https://ultimotradingltd.co.ke/Calculate/style.css
curl -I https://ultimotradingltd.co.ke/Calculate/script.js
```

**Expected:**
- `HTTP/2 200` for all resources
- `Content-Type: text/html` for pages
- `Content-Type: text/css` for stylesheets
- `Content-Type: application/javascript` for scripts

### 7.2 Functional Tests

```bash
# Test cement calculation
curl -X POST https://ultimotradingltd.co.ke/Calculate/calculate \
  -d "area=500&materialType=cement" \
  -c cookies.txt -b cookies.txt

# Test brick calculation
curl -X POST https://ultimotradingltd.co.ke/Calculate/calculate \
  -d "area=200&materialType=bricks&thickness=4"

# Test tile calculation
curl -X POST https://ultimotradingltd.co.ke/Calculate/calculate \
  -d "area=150&materialType=tiles&tileSize=12"
```

Verify responses contain expected material quantities (e.g., cement bags, brick count).

### 7.3 SSL Certificate Check

```bash
# Verify SSL is active
curl -I https://ultimotradingltd.co.ke/Calculate

# Check certificate details
echo | openssl s_client -connect ultimotradingltd.co.ke:443 2>/dev/null | openssl x509 -noout -dates -subject
```

**Expected:** Valid Let's Encrypt or commercial certificate.

### 7.4 Performance Checklist

- [ ] Page loads in < 2 seconds (TTFB < 500ms)
- [ ] Static assets cached (check `Cache-Control` headers)
- [ ] No console errors in browser DevTools
- [ ] Mobile responsive (test on viewport 375px, 768px, 1024px)
- [ ] Theme toggle (dark mode) works
- [ ] All material types render correct results

### 7.5 Calculator Validation Matrix

| Material Type | Input | Expected Output |
|---------------|-------|-----------------|
| Cement | area=100 | cement bags, sand (cubic ft) |
| Bricks | area=100 | bricks count, cement, sand |
| Concrete | area=100, thickness=4 | concrete volume (ft³, m³), cement, sand, aggregate |
| Tiles | area=100, tileSize=12 | tile count, adhesive, grout |
| Steel | area=100, thickness=4 | steel (kg), wire mesh |
| Painting | area=100 | paint (liters), primer |
| Blocks | area=100 | blocks count, cement, sand |
| Gravel | area=100, thickness=4 | gravel (ft³, m³), geotextile |
| Roofing | area=100 | metal sheets, screws, flashing |

---

## Step 8: Docker Registry Workflow (Advanced)

### 8.1 Automated CI/CD Pipeline

**.gitlab-ci.yml example:**
```yaml
stages:
  - build
  - push
  - deploy

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t sokogate-calculator:$CI_COMMIT_SHA .
  only:
    - main

push:
  stage: push
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $REGISTRY_USER -p $REGISTRY_PASS
    - docker tag sokogate-calculator:$CI_COMMIT_SHA registry.example.com/sokogate-calculator:$CI_COMMIT_SHA
    - docker push registry.example.com/sokogate-calculator:$CI_COMMIT_SHA
  only:
    - main
```

### 8.2 Deploy from Registry on cPanel

If using Docker on cPanel (not Node.js selector):

```bash
# SSH into cPanel server
ssh user@ultimotradingltd.co.ke

# Pull image from registry
docker pull registry.example.com/sokogate-calculator:1.0.0

# Run container
docker run -d \
  --name sokogate-calc \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e BASE_PATH=/Calculate \
  -e CORS_ORIGIN=https://ultimotradingltd.co.ke \
  --restart unless-stopped \
  registry.example.com/sokogate-calculator:1.0.0
```

---

## Step 9: Troubleshooting

### 9.1 Common cPanel Issues

**Issue: "Application not running"**
```
Check:
1. Node.js version compatibility (use 18.x or 20.x)
2. Application root path is correct
3. Startup file is `app.js` (not server.js or index.js)
4. Dependencies installed (check via "Run NPM Install")
5. Environment variables set (especially PORT and BASE_PATH)
6. Error logs in cPanel → "Node.js Logs"
```

**Issue: 404 on /Calculate routes**
```
Causes:
- BASE_PATH mismatch between cPanel URL and env variable
- App.js not listening on correct port
- .htaccess rules interfering

Fix:
1. Ensure Application URL = https://ultimotradingltd.co.ke/Calculate
2. Set BASE_PATH=/Calculate in env
3. Comment out proxy rules in .htaccess for Passenger
4. Restart app
```

**Issue: Static files (CSS/JS) not loading**
```
Check:
1. public/ folder uploaded correctly
2. express.static() path in app.js (should be path.join(__dirname, 'public'))
3. BASE_PATH in template matches request path
4. No CORS errors in browser console
```

**Issue: npm install fails on cPanel**
```
Solutions:
- Use SSH to run: npm ci --only=production --legacy-peer-deps
- Ensure package-lock.json is uploaded
- Check Node.js version matches engines field
- If memory error: npm install --no-optional
```

**Issue: Port already in use**
```
On cPanel: Restart the app via "Setup Node.js App" panel
Locally: lsof -ti:3000 | xargs kill -9
```

### 9.2 Docker Issues

**Build fails on alpine:**
```bash
# If native modules fail, use debian-based image
FROM node:18-slim AS builder
# ... rest same
```

**Container exits immediately:**
```bash
# Check logs
docker logs sokogate-calculator

# Run interactively
docker run -it sokogate-calculator:latest node app.js

# Check healthcheck
docker inspect --format='{{json .State.Health}}' sokogate-calculator | jq
```

**Permission denied errors:**
```bash
# Fix ownership
docker run --rm sokogate-calculator:latest ls -la /app
# Ensure appuser owns files (Dockerfile sets this)
```

### 9.3 Application-Specific Issues

**Calculation returns NaN:**
```javascript
// Check input parsing in calculatorController.js
// Ensure parseFloat handles empty strings correctly
// Log request body for debugging
```

**EJS template errors:**
```bash
# Check syntax
node -e "require('ejs').renderFile('views/index.ejs', {basePath:'/Calculate', result:null})"
```

**Environment variables not loading:**
```bash
# Verify dotenv is working
node -e "require('dotenv').config(); console.log(process.env.BASE_PATH)"
```

### 9.4 Enable Debug Logging

Temporarily increase verbosity:

```bash
# In cPanel environment variables:
LOG_LEVEL=debug

# Or locally:
DEBUG=* node app.js

# Check request logs in cPanel → Node.js Logs
tail -f /home/ultimotr/logs/passenger.log
```

---

## Step 10: Rollback Procedures

### cPanel Rollback

1. **Restore previous version:**
   ```bash
   # Via File Manager, restore from backup
   # Or use Git to checkout previous commit
   cd /home/ultimotr/public_html/repositories/sokogate-calc-deploy
   git checkout <previous-commit-hash>
   ```

2. **Reinstall dependencies (if package.json changed):**
   ```bash
   npm ci --only=production
   ```

3. **Restart application:**
   - cPanel → Setup Node.js App → Restart

### Docker Rollback

```bash
# List available tags
docker images | grep sokogate

# Stop current container
docker stop sokogate-calculator

# Remove current container
docker rm sokogate-calculator

# Run previous version
docker run -d \
  --name sokogate-calculator \
  -p 3000:3000 \
  -e NODE_ENV=production \
  sokogate-calculator:1.0.1  # previous tag
```

---

## Step 11: Monitoring & Maintenance

### 11.1 Log Management

**cPanel logs:**
- Access logs: `/home/ultimotr/public_html/repositories/sokogate-calc-deploy/logs/`
- Node.js logs: cPanel → **Node.js Logs**
- Apache/Nginx logs: cPanel → **Metrics** → **Errors**

**Docker logs:**
```bash
# View container logs
docker logs -f sokogate-calculator

# Check health status
docker ps --filter "name=sokogate"
```

**Application logging:** Use Winston configured in `src/utils/logger.js`

### 11.2 Health Monitoring

The `/Calculate/health` endpoint returns:
```json
{
  "status": "ok",
  "basePath": "/Calculate",
  "env": "production",
  "timestamp": "2026-04-28T14:55:47.066Z"
}
```

**Set up external monitoring:**
- UptimeRobot (free 5-min checks)
- Pingdom
- New Relic APM

### 11.3 Backup Strategy

**Daily backups of application code:**
```bash
tar -czf sokogate-calc-backup-$(date +%Y%m%d).tar.gz \
  /home/ultimotr/public_html/repositories/sokogate-calc-deploy/

# Download via SFTP/FTP
```

**Database:** (Not applicable - stateless calculator)

**Configuration backup:**
```bash
# Save cPanel environment variables
# Screenshot or copy from cPanel UI
```

---

## Step 12: Security Hardening

### 12.1 Firewall Rules

Ensure cPanel firewall (CSF) allows:
- Port 3000 (for internal Passenger proxy)
- Port 2083 (cPanel)
- Port 2087 (cPanel SSHDH)
- Port 80, 443 (web)

### 12.2 Rate Limiting

Already configured via `express-rate-limit`:
- 100 requests per 15 minutes per IP
- Returns 429 with `Retry-After` header

To adjust: modify `.env` on cPanel

### 12.3 Security Headers

Helmet middleware sets:
- `Content-Security-Policy`
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### 12.4 Input Validation

All form inputs validated server-side in `app.js`:
- Area: positive number
- Thickness: 1-24 inches
- Tile size: 6, 12, 18, 24 inches
- Material type: enum validation

---

## Appendix A: Quick Deployment Commands

```bash
# 1. Build image
docker build -t sokogate-calculator:1.0.0 .

# 2. Test locally
docker run -p 3000:3000 -e BASE_PATH=/Calculate sokogate-calculator:1.0.0

# 3. Tag for registry
docker tag sokogate-calculator:1.0.0 docker.io/username/sokogate-calc:1.0.0

# 4. Push to registry
docker push docker.io/username/sokogate-calc:1.0.0

# 5. SSH to cPanel
ssh user@ultimotradingltd.co.ke

# 6. Pull and run on server
docker pull docker.io/username/sokogate-calc:1.0.0
docker run -d -p 3000:3000 --name sokogate-calc \
  -e BASE_PATH=/Calculate \
  -e CORS_ORIGIN=https://ultimotradingltd.co.ke \
  --restart unless-stopped \
  docker.io/username/sokogate-calc:1.0.0
```

---

## Appendix B: Environment Variables Summary

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `NODE_ENV` | `production` | Yes | Node environment |
| `PORT` | `3000` | Yes | Internal port (cPanel assigns) |
| `BASE_PATH` | `/Calculate` | Yes | URL mount path |
| `CORS_ORIGIN` | `*` | Recommended | Allowed CORS origin |
| `LOG_LEVEL` | `info` | No | Logging verbosity |
| `RATE_LIMIT_WINDOW_MS` | `900000` | No | Rate limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | No | Max requests per window |

---

## Appendix C: File Structure

```
sokogate-calc/
├── app.js                    # Main Express application (production entry)
├── package.json              # Dependencies and scripts
├── package-lock.json         # Locked versions
├── Dockerfile                # Multi-stage production build
├── docker-compose.yml        # Local orchestration
├── healthcheck.js            # Container health check
├── .env.example              # Environment template
├── .env                      # Local environment (gitignored)
├── .dockeringore             # Docker build exclusions
├── public/                   # Static assets
│   ├── style.css            # Compiled Tailwind CSS
│   ├── script.js            # Client-side JavaScript
│   ├── favicon.svg
│   └── icons.svg
├── views/                    # EJS templates
│   └── index.ejs            # Main calculator page
├── src/                      # Source code (for development reference)
│   ├── app.js               # Class-based Express (alternative)
│   ├── server.js            # Server bootstrap
│   ├── config/index.js      # Configuration loader
│   ├── middleware/          # Security, logging, rate-limit
│   ├── routes/              # API routes
│   ├── controllers/         # Business logic
│   └── utils/               # Helpers (logger, validation)
├── logs/                     # Application logs (created at runtime)
└── sokogate-calc-deploy/    # DEPLOYMENT ARTIFACT (can be deleted after consolidation)
    ├── app.js               # Duplicate of root app.js
    ├── views/               # Duplicate of root views
    └── package.json         # Standalone package (old version)
```

---

## Appendix D: Deployment Checklist

### Before Deployment
- [ ] All dependencies installed (`npm ci`)
- [ ] Health check passes locally (`npm test`)
- [ ] Tested all material calculation types
- [ ] Responsive design verified (mobile, tablet, desktop)
- [ ] SSL certificate active on domain
- [ ] cPanel Node.js support confirmed

### During Deployment
- [ ] Files uploaded to correct directory (`public_html/repositories/sokogate-calc-deploy/`)
- [ ] Application root set correctly in cPanel
- [ ] Startup file = `app.js`
- [ ] All environment variables configured
- [ ] NPM install completed successfully
- [ ] Application status = "Running"

### After Deployment
- [ ] Health endpoint responds (`/Calculate/health`)
- [ ] Main page loads without errors
- [ ] Calculator works for all material types
- [ ] Static assets (CSS/JS) load correctly
- [ ] No 404s in browser console
- [ ] HTTPS enforced (redirect HTTP → HTTPS if needed)
- [ ] Rate limiting active (test multiple rapid requests)
- [ ] Error logging working (check cPanel logs)

---

## Support & Contact

For issues specific to:
- **cPanel configuration**: Contact hosting provider
- **Application errors**: Review `/home/apimotr/logs/passenger.log`
- **Docker issues**: `docker logs sokogate-calculator`
- **Uptime monitoring**: Set up external ping service

---

**Last Updated:** 2026-04-28  
**Application Version:** 1.0.0  
**Deployment Target:** https://ultimotradingltd.co.ke/Calculate