# cPanel Node.js Integration: Technical Architecture & Deployment Guide

**Version:** 1.0.0  
**Last Updated:** 2026-04-28  
**Target:** cPanel with Phusion Passenger / Node.js Selector

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Phusion Passenger Deep Dive](#2-phusion-passenger-deep-dive)
3. [Node.js Selector vs Traditional Hosting](#3-nodejs-selector-vs-traditional-hosting)
4. [Pre-Production Application Preparation](#4-pre-production-application-preparation)
5. [Deployment Workflow Step-by-Step](#5-deployment-workflow-step-by-step)
6. [Environment Configuration](#6-environment-configuration)
7. [Process Management & Lifecycle](#7-process-management--lifecycle)
8. [Reverse Proxy & URL Routing](#8-reverse-proxy--url-routing)
9. [Common Pitfalls & Solutions](#9-common-pitfalls--solutions)
10. [Monitoring & Logging](#10-monitoring--logging)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Internet / DNS                         │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS/HTTP (port 80/443)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Apache / Nginx (Web Server)                │
│  • Serves static files (.html, .css, .js, images)          │
│  • Handles SSL/TLS termination                             │
│  • Manages virtual hosts                                   │
└───────────────────────────┬─────────────────────────────────┘
                            │ Reverse Proxy (mod_proxy / ProxyPass)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            Phusion Passenger (App Server)                   │
│  • Spawns & manages Node.js processes                      │
│  • Load balancing (multiple instances)                     │
│  • Process supervision (restart on crash)                  │
│  • Port allocation (dynamic port assignment)               │
│  • Environment variable injection                          │
└───────────────────────────┬─────────────────────────────────┘
                            │ Unix socket / TCP
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Node.js Application (Your App)                 │
│  • Express / Koa / Fastify server                          │
│  • Listens on process.env.PORT                             │
│  • Handles routes, business logic                          │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Key Components

| Component | Role | Technology |
|-----------|------|------------|
| **Web Server** | Entry point, SSL, static files | Apache 2.4+ or Nginx |
| **Application Server** | Process manager, spawner | Phusion Passenger (mod_passenger) |
| **Runtime** | JavaScript execution | Node.js (18.x, 20.x) |
| **App Framework** | HTTP handling | Express (in this project) |

### 1.3 Data Flow

```
Request Flow:
Client → DNS → Apache:443 → Passenger → Node.js:3000 → Response

1. Client requests: https://ultimotradingltd.co.ke/Calculate
2. Apache receives on port 443 (HTTPS)
3. mod_proxy forwards to Passenger on internal socket
4. Passenger spawns Node.js process (if not running)
5. Passenger assigns available port (e.g., 3000, 3001)
6. Passenger sets environment variable: PORT=<assigned_port>
7. Node.js app listens on process.env.PORT
8. Request routed through middleware → Express → EJS render
9. Response flows back: Node.js → Passenger → Apache → Client
```

---

## 2. Phusion Passenger Deep Dive

### 2.1 What is Phusion Passenger?

Phusion Passenger (aka mod_passenger or `Rails Apache2 Module`) is an **application server** that integrates with Apache/Nginx to host Ruby, Python, and Node.js applications. For Node.js, it:

- **Spawns** Node.js processes on-demand
- **Monitors** health and restarts crashed processes
- **Balances** load across multiple Node.js instances
- **Manages** environment variables and working directory
- **Provides** automatic process scaling (min/max instances)

### 2.2 Passenger Integration Methods

#### Method A: cPanel's "Setup Node.js App" (UI)

cPanel provides a GUI wrapper around Passenger's CLI tools:

**Under the hood:**
```bash
# cPanel creates these files when you use "Setup Node.js App":

~/.cpanel/nodes/                           # Node.js configuration storage
~/.cpanel/nodes/<app-name>/                # Per-app config
  ├── app.js                               # Startup file
  ├── environment                          # Environment variables
  ├── nodejs.conf                          # Passenger config snippet
  └── passenger_emit_error_on_proxy_defer   # Error handling flags

# cPanel runs these commands:
passenger-config restart-app ~/.cpanel/nodes/<app-name>
passenger-status                           # Show running apps
passenger-memory-stats                     # Memory usage
```

**Passenger config snippet** (auto-generated):
```apache
# In ~/.cpanel/nodes/<app-name>/nodejs.conf
PassengerEnabled on
PassengerAppRoot /home/username/path/to/app
PassengerAppScriptName app.js  # or server.js, index.js
PassengerAppEnv production
PassengerSpawnMethod smart
PassengerMinInstances 1
PassengerMaxInstances 3
```

#### Method B: Manual `.htaccess` Configuration

If cPanel's Node.js selector isn't available, you can configure manually:

```apache
# .htaccess in public_html/
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api|^/Calculate
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]

# Or using mod_proxy directly
ProxyPass /Calculate http://127.0.0.1:3000/Calculate
ProxyPassReverse /Calculate http://127.0.0.1:3000/Calculate
```

**Limitation:** You must manually start the Node.js process (e.g., via `screen`, `tmux`, `pm2`, or systemd).

### 2.3 Passenger Process Spawning

**Smart Spawning** (default):
```bash
# 1st request → Passenger spawns Node.js process
# Process listens on random available port (e.g., 34567)
# Passenger records port in internal registry

# Subsequent requests → Passenger proxies to existing process
# If process dies → Passenger respawns automatically
```

**Pre-spawning** (optional):
```bash
# Configure in cPanel or passenger.conf:
PassengerMinInstances 2   # Start 2 instances immediately
PassengerMaxInstances 5   # Allow up to 5 instances under load
```

### 2.4 Port Assignment

**Critical:** YOUR APPLICATION MUST NOT HARD-CODE A PORT.

```javascript
// ✅ CORRECT - Uses Passenger-assigned port
const PORT = process.env.PORT || 3000;  // Fallback for local dev
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// ❌ WRONG - Hard-coded port
app.listen(3000);  // Will conflict with Passenger's assigned port
```

**Why?** Passenger assigns a random high port (30000-65535) to avoid conflicts. The port is injected as `process.env.PORT` when spawning your app.

---

## 3. Node.js Selector vs Traditional Hosting

### 3.1 Traditional Shared Hosting (PHP/CGI)

| Aspect | Traditional (PHP) | Node.js on cPanel |
|--------|-------------------|-------------------|
| **Request Model** | Per-request process spawn | Persistent long-running process |
| **Execution** | Interpreter loads per request | Process stays alive between requests |
| **State** | Stateless | Can maintain in-memory state |
| **Concurrency** | Multi-process (Apache prefork) | Single-threaded event loop (Node) |
| **File Structure** | `/public_html/` directly served | `/home/user/` app root, URL mount point separate |
| **`.htaccess`** | Rewrite rules for routing | Often disabled/commented for Passenger |
| **Process Management** | Handled by Apache MPM | Handled by Passenger |
| **Restart Mechanism** | Apache reload | Passenger restart or app crash recovery |

### 3.2 Implications for Node.js on cPanel

#### Persistent Process
Your Node.js app runs continuously:
- **Memory usage:** Constant (not per-request)
- **CPU usage:** Idle until request arrives
- **Statefulness:** Can cache data in memory (be careful with scaling)
- **File watching:** Not needed for production (restart to apply code changes)

#### No `.htaccess` for Node.js Routes
**Traditional approach (PHP):**
```apache
# .htaccess in WordPress/CMS
RewriteRule ^article/([^/]+)/?$ article.php?id=$1 [L]
```

**Node.js approach:**
```javascript
// Routes handled by Express, NOT .htaccess
app.get('/article/:id', (req, res) => {
  const id = req.params.id;
  // ... render article
});
```

**`.htaccess` only needed for:**
- Proxy setup (if NOT using Passenger)
- HTTPS redirects
- Static file caching headers
- Security headers (though Helmet.js is preferred)

#### Application Root vs URL Path

**Traditional hosting:**
```
File: /public_html/calculate.html
URL:  https://example.com/calculate.html
```

**Node.js with subdirectory URL:**
```
App Root: /home/username/apps/calculator/
URL:      https://example.com/Calculate
  └─ File: /home/username/apps/calculator/app.js
  └─ Route: GET /  → served at /Calculate
```

**Key point:** The filesystem path and URL path are **independent** in cPanel Node.js:

| Setting | Value | Purpose |
|---------|-------|---------|
| **Application Root** | `/home/ultimotr/public_html/repositories/sokogate-calc-deploy` | Where files live on disk |
| **Application URL** | `https://ultimotradingltd.co.ke/Calculate` | Where it's accessible |
| **Startup File** | `app.js` | Entry point (relative to root) |
| **BASE_PATH (env)** | `/Calculate` | App must know its URL prefix |

---

## 4. Pre-Production Application Preparation

### 4.1 Entry Point Configuration

**Requirement:** Your `package.json` MUST specify a `main` or `start` script.

```json
{
  "name": "sokogate-calculator",
  "version": "1.0.0",
  "main": "app.js",              // Optional but good practice
  "scripts": {
    "start": "node app.js",      // ← CRITICAL for cPanel
    "dev": "nodemon app.js"
  },
  "engines": {
    "node": ">=18.0.0"           // Specify minimum Node version
  }
}
```

**Why `main` field matters:**
- cPanel's Node.js selector reads `package.json`
- If `start` script absent → falls back to `node .` (looks for `index.js`)
- Explicit `start` removes ambiguity

### 4.2 Port Binding

**Must use `process.env.PORT`:**

```javascript
// Correct pattern - used in sokogate-calc/app.js
const PORT = process.env.PORT || 3000;  // 3000 fallback for local dev

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Important notes:**
- Bind to `0.0.0.0` (all interfaces), NOT `127.0.0.1` (localhost only)
- Do NOT specify a fixed port in production code
- Passenger injects `PORT` automatically; no need to set in cPanel's env unless you want a specific port (rare)

### 4.3 Environment Variable Handling

**Use `dotenv` for local development:**

```javascript
// config/index.js in sokogate-calc/src/
require('dotenv').config();  // Loads .env into process.env

const config = {
  app: {
    port: parseInt(process.env.PORT, 10) || 3000,
    basePath: process.env.BASE_PATH || '/Calculate',
    corsOrigin: process.env.CORS_ORIGIN || 'https://ultimotradingltd.co.ke'
  }
};
```

**Production (cPanel):**
- Set variables in cPanel UI → "Environment Variables" section
- Passenger injects them into Node.js process
- `.env` file is IGNORED in production (not uploaded or used)

**cPanel variables you'll set:**

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `NODE_ENV` | `production` | Enables production mode (disables dev-only features) |
| `PORT` | `3000` | Usually assigned by Passenger; set only if custom |
| `BASE_PATH` | `/Calculate` | URL path where app is mounted |
| `CORS_ORIGIN` | `https://ultimotradingltd.co.ke` | Allowed cross-origin requests |

### 4.4 Dependency Management

**Separate dev vs prod dependencies:**

```json
{
  "dependencies": {
    "express": "^4.18.2",          // Always needed
    "ejs": "^3.1.9",               // Templating
    "helmet": "^7.1.0",            // Security
    "winston": "^3.11.0",          // Logging
    "cors": "^2.8.5",              // CORS headers
    "body-parser": "^1.20.2",      // Request parsing
    "express-rate-limit": "^7.1.5" // Rate limiting
  },
  "devDependencies": {
    "eslint": "^8.0.0",            // Linting (dev only)
    "nodemon": "^3.0.0"            // Auto-reload (dev only)
  }
}
```

**On cPanel:**
```bash
# Only production deps installed (devDependencies excluded)
npm ci --only=production

# cPanel's "Run NPM Install" automatically uses --production flag
# if NODE_ENV=production is set.
```

### 4.5 Static Assets & Build Step

**For compiled frontends (React/Vue):** You need a build step.

```json
{
  "scripts": {
    "build": "vite build",          // Compiles React → static files
    "start": "node app.js",         // Serves compiled files
    "dev": "vite"                   // Dev server with HMR
  }
}
```

**Deployment sequence:**
1. Upload source code
2. Run `npm install` (installs dependencies)
3. Run `npm run build` (generates `dist/` folder)
4. Restart app

**sokogate-calc approach:** Uses server-side EJS (no build step for templates). Static assets (`public/style.css`) are pre-built and committed.

### 4.6 File Structure for cPanel

```
/home/ultimotr/public_html/repositories/sokogate-calc-deploy/
├── app.js                    ← Entry point (startup file)
├── package.json              ← Dependencies & scripts
├── package-lock.json         ← Locked versions
├── .npmrc                    ← (optional) npm config
├── .env.example              ← Template (not used in prod)
├── public/                   ← Static files served as-is
│   ├── style.css
│   ├── script.js
│   ├── favicon.svg
│   └── icons.svg
├── views/                    ← EJS templates (server-side rendered)
│   └── index.ejs
└── logs/                     ← Created at runtime (optional)
```

**Important:**
- `node_modules/` is NOT uploaded (created by `npm install` on server)
- `src/` directory is NOT needed in production if compiled/built
- `.git/` should not be uploaded (use Git deployment feature instead)

---

## 5. Deployment Workflow Step-by-Step

### Step 1: Prepare Application Locally

#### 5.1.1 Install Dependencies
```bash
cd /home/apop/sokogate-calc
npm ci --only=production
```

**Why `npm ci` vs `npm install`?**
- `npm ci` uses `package-lock.json` for deterministic installs
- Faster, cleaner, ensures no drift between dev and prod
- Required for CI/CD pipelines

#### 5.1.2 Verify Production Build
```bash
# Test locally with production config
NODE_ENV=production BASE_PATH=/Calculate PORT=3000 node app.js

# In another terminal:
curl http://localhost:3000/Calculate/health
# Expected: {"status":"ok",...}

curl http://localhost:3000/Calculate | head -20
# Expected: HTML with <title>Sokogate — Construction Materials Calculator</title>
```

#### 5.1.3 Clean Repository
```bash
# Remove dev-only files
rm -rf node_modules/   # Will be installed on server
rm -rf src/           # Not needed in production
rm -rf *.md           # Optional: keep README.md if helpful
rm -rf . Dockeringore .gitlab-ci.yml  # CI/CD files (optional)

# Keep these:
# ✅ app.js, package.json, package-lock.json
# ✅ public/, views/, healthcheck.js
```

### Step 2: Upload to cPanel

#### Option A: File Manager (Web UI)

1. Login to cPanel: `https://ultimotradingltd.co.ke:2083`
2. Navigate to **File Manager** → `public_html/repositories/`
3. Click **Upload** → Select `sokogate-calc-cpanel.zip`
4. After upload, right-click → **Extract**
5. Verify extraction created `sokogate-calc-deploy/` folder
6. **Set permissions** (if needed):
   ```bash
   # In File Manager → select all files → Change Permissions
   chmod 755 /home/ultimotr/public_html/repositories/sokogate-calc-deploy
   chmod 644 /home/ultimotr/public_html/repositories/sokogate-calc-deploy/*.js
   chmod 644 /home/ultimotr/public_html/repositories/sokogate-calc-deploy/*.json
   ```

#### Option B: FTP/SFTP

```bash
# Using command-line SFTP
sftp user@ultimotradingltd.co.ke
sftp> cd /public_html/repositories/
sftp> mkdir sokogate-calc-deploy
sftp> put -r /local/path/app.js sokogate-calc-deploy/
sftp> put -r /local/path/package.json sokogate-calc-deploy/
sftp> put -r /local/path/public sokogate-calc-deploy/
sftp> put -r /local/path/views sokogate-calc-deploy/
sftp> exit
```

**Or with FileZilla:**
- Host: `ultimotradingltd.co.ke`
- Protocol: SFTP
- Port: 22
- Upload: drag-drop from local to remote `/public_html/repositories/sokogate-calc-deploy/`

#### Option C: Git Version Control (if cPanel has Git™ Version Control feature)

1. cPanel → **Git™ Version Control** → **Create Repository**
2. Repository URL: `https://github.com/yourname/sokogate-calc.git`
3. Repository Path: `/home/ultimotr/public_html/repositories/sokogate-calc-deploy`
4. Check **"Deploy HEAD commit after cloning"**
5. Click **Create**

**Auto-deploy on push:**
- cPanel pulls from Git automatically (or you can set webhook)
- Then run `npm install` via SSH or cron job

### Step 3: Configure Node.js Application in cPanel

**Navigation:** cPanel Home → **Software** → **Setup Node.js App** (or "Node.js Selector")

#### 3.1 Create Application Form

| Field | Value for sokogate-calc | Explanation |
|-------|------------------------|-------------|
| **Node.js version** | `18.x` or `20.x` (LTS) | Must be ≥18 for ES6 modules & modern packages |
| **Application mode** | `Production` | Enables production optimizations |
| **Application root** | `/home/ultimotr/public_html/repositories/sokogate-calc-deploy` | Filesystem path to your app |
| **Application URL** | `https://ultimotradingltd.co.ke/Calculate` | Public URL |
| **Application startup file** | `app.js` | Entry point (relative to Application root) |

#### 3.2 Understanding Each Setting

**Node.js Version:**
- cPanel may offer: 16.x, 18.x, 20.x
- Choose **18.x LTS** or **20.x LTS** (long-term support)
- Check compatibility: `engines` field in `package.json`
- If mismatch → npm install may fail

**Application Mode:**
- **Development:** Sets `NODE_ENV=development`, installs devDependencies
- **Production:** Sets `NODE_ENV=production`, skips devDependencies
- **Always use Production** for live deployment

**Application Root:**
- Must be **absolute path** (starts with `/home/...`)
- Must contain `package.json` and startup file
- Common pattern: `/home/username/public_html/repositories/app-name`
- Can be OUTSIDE `public_html` (more secure), but URL must still point to correct location

**Application URL:**
- Determines URL path where app is accessible
- Options:
  - Subdomain: `https://calc.ultimotradingltd.co.ke` (domain root)
  - Subdirectory: `https://ultimotradingltd.co.ke/Calculate` (shared domain)
  - Port: `https://ultimotradingltd.co.ke:3000` (rare, needs Apache config)

**Startup File:**
- File that calls `app.listen()` or exports Express app
- Common names: `app.js`, `server.js`, `index.js`
- Must be in Application Root
- **For sokogate-calc:** `app.js`

#### 3.3 Click "Create"

cPanel now:

1. Creates config files in `~/.cpanel/nodes/<app-name>/`
2. Adds Passenger directives to Apache config
3. Restarts Apache (brief downtime ~1s)
4. Shows app in "Setup Node.js App" list with status **"Stopped"**

### Step 4: Set Environment Variables

Click **"Edit"** next to your newly created app.

#### 4.1 Environment Variables Interface

```
Environment Variables (one per line):
KEY=VALUE
```

**Add these lines:**

```
NODE_ENV=production
PORT=3000
BASE_PATH=/Calculate
CORS_ORIGIN=https://ultimotradingltd.co.ke
```

#### 4.2 Variable Deep Dive

**`NODE_ENV=production`**
- Disables verbose logging in many libraries
- Enables caching & optimizations in Express
- Sets `process.env.NODE_ENV` to `"production"`
- Your code can check: `if (process.env.NODE_ENV === 'production') { ... }`

**`PORT=3000`**
- Port your Node.js app listens on
- **Important:** cPanel's Passenger will assign a port (e.g., 34567) and inject it as `process.env.PORT`.
- You can specify `PORT=3000` here, but Passenger may override.
- **Best practice:** Use `process.env.PORT || 3000` in code. Do NOT hard-code.
- For debugging, setting explicit PORT helps; Passenger respects it if available.

**`BASE_PATH=/Calculate`**
- URL prefix where app is mounted
- App uses this to route correctly:
  ```javascript
  app.use(BASE_PATH, router);
  // GET /health becomes GET /Calculate/health
  ```
- **Must match** Application URL path in cPanel
- If URL is `https://example.com/api`, then `BASE_PATH=/api`

**`CORS_ORIGIN=https://ultimotradingltd.co.ke`**
- Controls Cross-Origin Resource Sharing
- Allows AJAX requests from your frontend domain
- Set to `*` for any origin (less secure)
- For same-origin: set to your domain

**Optional variables:**
```
LOG_LEVEL=info                # debug/info/warn/error
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100   # Per IP
```

#### 4.3 Save Environment

Click **"Save"** → cPanel updates `~/.cpanel/nodes/<app-name>/environment`

---

## 6. Dependencies Installation

### Method 1: cPanel Interface (Recommended)

1. In **Setup Node.js App**, find your app
2. Click **"Run NPM Install"** button
3. Wait (2-5 minutes depending on dependencies)

**What happens:**
```bash
cd /home/ultimotr/public_html/repositories/sokogate-calc-deploy
npm ci --only=production
```

**Output displayed in cPanel:**
```
npm WARN config production Use `--omit=dev` instead.
added 107 packages, removed 8 packages, and audited 108 packages
```

**Success indicators:**
- Green checkmark appears
- Status changes to **"Running"** (or you need to restart)
- Files appear in `node_modules/` directory

**Common issues & fixes:**

| Issue | Cause | Solution |
|-------|-------|----------|
| `npm ERR! code ENOTFOUND` | DNS/network issue | Try again later; contact host |
| `npm ERR! code EACCESS` | Permission issue | cPanel auto-fixes; re-click "Run NPM Install" |
| `npm WARN deprecated` | Old packages (non-critical) | Usually OK; check for breaking changes |
| npm hangs | Large dependencies, low memory | Increase PHP memory limit in cPanel or use SSH |

### Method 2: cPanel Terminal (SSH)

If you have SSH access:

```bash
# Navigate to app directory
cd /home/ultimotr/public_html/repositories/sokogate-calc-deploy

# Check Node.js version
node --version  # Should be v18.x or v20.x

# Install dependencies
npm ci --only=production

# Verify installation
npm ls --depth=0

# Check for missing deps
node -e "require('express'); console.log('OK')"
```

**If `npm ci` fails:**
```bash
# Clear npm cache
npm cache clean --force

# Install without optional deps
npm ci --only=production --no-optional

# Legacy peer deps (if peer dependency conflicts)
npm ci --only=production --legacy-peer-deps
```

### Method 3: cPanel's "Package.json Editor"

Some cPanel versions have a UI editor:

1. cPanel → **File Manager** → Open `package.json`
2. Click **"Edit"** → There may be an **"NPM Install"** button
3. Click it → Runs `npm install`

**Limitation:** Might not show real-time output.

### Method 4: Cron Job (fallback)

If NPM install button hangs:

```bash
# SSH to server
crontab -e

# Add: (runs once in 2 minutes)
*/2 * * * * cd /home/ultimotr/public_html/repositories/sokogate-calc-deploy && npm ci --only=production > /tmp/npm-install.log 2>&1
```

Then wait 2 minutes and check `/tmp/npm-install.log`.

---

## 7. Process Management & Lifecycle

### 7.1 How Passenger Manages Your App

**On first request:**
```
1. Apache receives request for /Calculate
2. mod_proxy forwards to Passenger
3. Passenger checks if app instance exists
4. No instance → spawn new Node.js process:
   - Sets CWD to Application Root
   - Injects environment variables
   - Assigns available TCP port (e.g., 34567)
   - Executes: node app.js
5. Waits for app to call app.listen(PORT)
6. Proxies request to Node.js
```

**On subsequent requests:**
```
1. Apache → Passenger (same as above)
2. Passenger finds existing process (listening on port 34567)
3. Proxies request immediately (no spawn delay)
```

**On app crash:**
```
1. Node.js process exits (uncaught exception, OOM, etc.)
2. Passenger detects process death
3. Passenger logs error to cPanel error log
4. Passenger respawns new process automatically
5. Next request triggers fresh spawn
```

### 7.2 Application Lifecycle Hooks

**`app.js` should handle:**

```javascript
const app = express();
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received → graceful shutdown');
  server.close(() => {
    console.log('Connections closed, exiting');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => process.exit(1), 10000);
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught:', err);
  process.exit(1);  // Let Passenger restart
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
```

**Why these matter:**
- `SIGTERM` → Passenger sends this when restarting app
- `uncaughtException` → Prevents zombie processes
- `unhandledRejection` → Same for async errors

**sokogate-calc/server.js** already implements these.

### 7.3 Starting & Restarting

**Via cPanel UI:**
1. Setup Node.js App → Find app
2. Click **"Restart"** button
3. Status changes: **Running** → **Restarting** → **Running**

**What "Restart" does:**
```bash
# Passenger sends SIGTERM to process
kill -TERM <pid>

# Waits up to 60 seconds for graceful exit
# Then force-kills if still running

# Spawns new process on next request
```

**When to restart:**
- After code changes (unless using nodemon in dev)
- After changing environment variables
- After `npm install` updates dependencies
- When debugging persistent issues

**Via SSH (alternative):**
```bash
# Find app's node process
ps aux | grep "node app.js"

# Get config path
cat ~/.cpanel/nodes/<app-name>/nodejs.conf

# Restart via passenger-config
passenger-config restart-app ~/.cpanel/nodes/<app-name>

# Or kill manually (Passenger will respawn)
pkill -f "node /home/.../app.js"
```

### 7.4 Multiple Instances

Passenger can spawn multiple Node.js processes for concurrency:

```apache
# In passenger.conf or cPanel's internal config:
PassengerMinInstances 1      # Always keep 1 alive (avoid cold start)
PassengerMaxInstances 3      # Allow 3 under load
PassengerMaxPoolSize 6       # Total across all apps
```

**Benefit:** Multi-core utilization (Node.js is single-threaded; multiple processes use multiple CPU cores).

**Load balancing:** Passenger round-robins requests across instances via Unix socket.

### 7.5 Auto-Scaling

**Smart spawning:** Passenger starts with 1 instance; spawns more when request queue builds.

**Manual control:**
```javascript
// No code changes needed; Passenger handles
// But you can hint:
PassengerMaxInstances 5
```

---

## 8. Reverse Proxy & URL Routing

### 8.1 Apache → Passenger → Node.js

**Apache config** (managed by cPanel, you don't edit directly):
```apache
<IfModule mod_passenger.c>
  PassengerEnabled on
  PassengerAppRoot /home/ultimotr/public_html/repositories/sokogate-calc-deploy
  PassengerAppScriptName app.js
  PassengerAppEnv production
</IfModule>

# Proxy rule (auto-generated by cPanel)
RewriteRule ^(.*)$ http://127.0.0.1:34567/$1 [P,L]
```

**Internal port:** Passenger assigns random port (not 80/443). The port is NOT accessible from outside Apache.

### 8.2 URL Path Configuration

**Scenario 1: Subdomain**
```
cPanel Setting:
  Application URL: https://calc.ultimotradingltd.co.ke
  (no trailing slash)
  BASE_PATH=/              ← root of subdomain

App code:
  app.get('/', ...)           ← serves at https://calc.ultimotradingltd.co.ke/
  app.get('/health', ...)     ← serves at https://calc.ultimotradingltd.co.ke/health
```

**Scenario 2: Subdirectory (sokogate-calc)**
```
cPanel Setting:
  Application URL: https://ultimotradingltd.co.ke/Calculate
  BASE_PATH=/Calculate

App code:
  app.get('/', ...)           ← serves at /Calculate/
  app.use(BASE_PATH, router)  ← All routes prefixed
  app.get('/health', ...)     ← accessible at /Calculate/health

Apache receives: GET /Calculate/health
Passenger proxies to: Node.js on internal port (with path preserved)
Node.js sees: req.url = '/Calculate/health' (if mounted at BASE_PATH)
```

### 8.3 BASE_PATH Implementation

**In sokogate-calc/app.js:**

```javascript
const BASE_PATH = process.env.BASE_PATH || '/Calculate';

// Static files served under BASE_PATH
app.use(BASE_PATH, express.static(path.join(__dirname, 'public')));

// All routes mounted at BASE_PATH
app.use(BASE_PATH, router);

// Root redirect
app.get('/', (req, res) => {
  res.redirect(BASE_PATH);  // / → /Calculate
});

// 404 catch-all checks for BASE_PATH prefix
app.use('*', (req, res) => {
  const reqPath = req.originalUrl;

  // If request lacks BASE_PATH, redirect or 404
  if (!reqPath.startsWith(BASE_PATH)) {
    return res.status(404).send(`App is at ${BASE_PATH}`);
  }

  // Otherwise render calculator (even if route unknown under BASE_PATH)
  res.status(404).render('index', { basePath: BASE_PATH, ... });
});
```

**In EJS template (views/index.ejs):**
```html
<!-- All asset URLs must include BASE_PATH -->
<link rel="stylesheet" href="<%= basePath %>/style.css">
<script src="<%= basePath %>/script.js"></script>
<a href="<%= basePath %>/">Home</a>

<form action="<%= basePath %>/calculate" method="POST">
```

### 8.4 `.htaccess` Considerations

**When using Passenger via cPanel Node.js Selector:**
- `.htaccess` proxy rules are **automatically managed by cPanel**
- **Do NOT** add manual `RewriteRule` or `ProxyPass` directives
- They can conflict with Passenger's config

**When NOT using cPanel's Node.js selector** (custom setup):
```apache
# .htaccess in public_html/
RewriteEngine On

# Proxy all /Calculate requests to Node.js on port 3000
RewriteCond %{REQUEST_URI} ^/Calculate
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

**But:** You must then start Node.js manually:
```bash
node /home/ultimotr/apps/sokogate-calc/app.js > /dev/null 2>&1 &
```

---

## 9. Common Pitfalls & Solutions

### 9.1 "Application not running" in cPanel

**Symptoms:**
- cPanel shows status: **"Stopped"** or **"Error"**
- URL returns 502 Bad Gateway or 404

**Diagnosis:**

1. **Check Node.js logs in cPanel:**
   - cPanel Home → **Metrics** → **Errors**
   - Or: cPanel Home → **Node.js** → **Application Logs**
   - Or SSH: `cat ~/logs/passenger.log`

2. **Common error messages:**

| Error Message | Cause | Fix |
|---------------|-------|-----|
| `Cannot find module 'express'` | Dependencies not installed | Click "Run NPM Install" |
| `Error: Cannot find module '/home/.../app.js'` | Wrong startup file | Set "Application startup file" to `app.js` |
| `Port 3000 already in use` | Port conflict with another app | Change PORT env or stop other Node.js app |
| `EADDRINSAttributeError: 'express' module has no attribute 'session'| Mixed up require statements | Check `const express = require('express');` |
| `SyntaxError: Unexpected token` | Using ES6+ features without transpilation | Use Node.js 18+ or transpile with Babel |

3. **Verify file structure:**
   ```bash
   # SSH in
   cd /home/ultimotr/public_html/repositories/sokogate-calc-deploy
   ls -la
   # Should show: app.js, package.json, public/, views/
   ```

### 9.2 404 on `/Calculate`

**Cause 1: BASE_PATH mismatch**

```bash
# Check cPanel Application URL:
#   = https://ultimotradingltd.co.ke/Calculate
#   → BASE_PATH must be /Calculate

# Check in app.js:
const BASE_PATH = process.env.BASE_PATH || '/Calculate';

# If env not set, defaults to /Calculate ✓
# But if env set wrong (e.g., /repositories/sokogate-calc-deploy), breaks.
```

**Fix:** Ensure cPanel environment has `BASE_PATH=/Calculate`.

**Cause 2: App not restarted after code change**

```bash
# In cPanel → Setup Node.js App → Restart
```

**Cause 3: `.htaccess` proxy interfering**

```bash
# If using cPanel Node.js Selector, .htaccess should NOT have:
# RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
# Comment it out:
# RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

### 9.3 Static Files (CSS/JS) Return 404

**Checklist:**

1. **`public/` folder exists and has files:**
   ```bash
   ls /home/ultimotr/.../sokogate-calc-deploy/public/
   # Should show: style.css, script.js, favicon.svg, icons.svg
   ```

2. **`app.js` serves static correctly:**
   ```javascript
   app.use(BASE_PATH, express.static(path.join(__dirname, 'public')));
   // If BASE_PATH=/Calculate:
   // /Calculate/style.css → /public/style.css ✓
   ```

3. **File permissions:**
   ```bash
   # Should be readable by web server user (usually 'nobody' or 'apache')
   chmod 644 public/style.css
   chmod 755 public/  # directory executable bit
   ```

4. **EJS template uses correct path:**
   ```html
   <!-- views/index.ejs -->
   <link rel="stylesheet" href="<%= basePath %>/style.css">
   <!-- Renders: /Calculate/style.css ✓ -->
   ```

**Debug:**
```bash
# Direct curl test
curl -I https://ultimotradingltd.co.ke/Calculate/style.css
# Should return: HTTP/2 200, Content-Type: text/css
```

### 9.4 npm Install Fails on cPanel

**Memory limits:** cPanel shared hosting may limit memory to 512MB.

```bash
# Solution 1: Use SSH with swap (if available)
npm ci --only=production --no-optional

# Solution 2: Exclude heavy optional packages
# Some packages (like sharp, canvas) have native binaries
# If not needed, skip with:
npm ci --only=production --omit=optional

# Solution 3: Increase memory limit
# In cPanel: Select PHP → Options → memory_limit = 512M or higher
# Then retry npm install
```

**Network timeouts:**
```bash
# Set longer timeout
npm set timeout 60000  # 60 seconds
```

**Permission errors** (EACCESS):
- cPanel's file manager may create files owned by wrong user
- Solution: Use SSH to fix ownership
  ```bash
  chown -R ultimotr:ultimotr /home/ultimotr/public_html/repositories/sokogate-calc-deploy
  ```

### 9.5 Port Already in Use

**If another Node.js app running:**

```bash
# Find process using port 3000
lsof -i :3000
# or
netstat -tulpn | grep :3000

# Kill it
kill -9 <PID>

# OR change PORT env in cPanel to unused value (e.g., 3001)
# But: Passenger assigns its own port; PORT env is just hint
```

**Best:** Let cPanel assign automatically. Remove `PORT` from env (or keep at 3000 for local dev only). Passenger will inject correct port.

### 9.6 Environment Variables Not Loading

**Symptom:** `process.env.BASE_PATH` is `undefined`

**Causes & Fixes:**

1. **Not set in cPanel UI:**
   - Go to Setup Node.js App → Edit → Environment Variables
   - Add: `BASE_PATH=/Calculate`

2. **cPanel Node.js selector bug:**
   - Some versions require `NODE_ENV=production` BEFORE other vars
   - Set `NODE_ENV=production` first line

3. **`.env` file uploaded:**
   - Remove `.env` from server (security risk)
   - cPanel doesn't use `.env`; uses its own env injection

4. **App started before env set:**
   - After setting env, **restart** app (not just stop/start, but restart via UI)

**Verify env is loaded:**
```bash
# Create test route (temporary)
app.get('/env-debug', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    BASE_PATH: process.env.BASE_PATH,
    CORS_ORIGIN: process.env.CORS_ORIGIN
  });
});

# After redeploy, test:
curl https://ultimotradingltd.co.ke/Calculate/env-debug
```

### 9.7 SSL/HTTPS Issues

**Node.js app sees HTTP behind HTTPS proxy:**

```javascript
// If behind Apache SSL termination:
// Request from client: HTTPS → Apache (decrypts) → HTTP to Passenger → Node.js sees HTTP

// To get original protocol:
app.set('trust proxy', 1);  // Trust first proxy (Apache)
console.log(req.protocol);  // Now correctly 'https' if original was HTTPS
```

**Or inspect headers:**
```javascript
const isSecure = req.headers['x-forwarded-proto'] === 'https';
```

**Forcing HTTPS redirect in Express:**
```javascript
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});
```

**But better:** Let Apache handle HTTPS redirect (in cPanel → "Redirects" or .htaccess).

---

## 10. Monitoring & Logging

### 10.1 Viewing Logs in cPanel

**Application logs (Passenger):**
```
cPanel Home → Node.js → Application Logs
Displays: stdout, stderr from your Node.js app
```

**Apache error logs (for proxy errors):**
```
cPanel Home → Metrics → Errors
Shows: 502 Bad Gateway, 504 Gateway Timeout, etc.
```

** passenger.log (SSH):**
```bash
tail -f /home/ultimotr/logs/passenger.log
# Shows: App spawn, shutdown, crashes
```

**Individual Node.js app logs:** If configured in `logger.js` (Winston):
```javascript
// In src/utils/logger.js configure file transports:
new winston.transports.File({ filename: 'logs/error.log', level: 'error' });
new winston.transports.File({ filename: 'logs/combined.log' });

// But: Need write permissions to /home/.../logs/
// Create logs/ directory and chmod 755
```

### 10.2 Health Check Endpoint

**sokogate-calc includes:** `/Calculate/health`

```javascript
// healthcheck.js (for Docker)
// OR inline in app.js:
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    basePath: BASE_PATH,
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

**Monitoring:** Set up UptimeRobot, StatusCake, or custom script:

```bash
#!/bin/bash
# crontab: check every 5 minutes
*/5 * * * * curl -sf https://ultimotradingltd.co.ke/Calculate/health > /dev/null || echo "ALERT: App down" | mail admin@example.com
```

### 10.3 Performance Monitoring

**Check memory usage:**
```bash
# SSH
passenger-memory-stats
# Shows memory per app, per process

# Or via cPanel → Node.js → Memory Usage chart
```

**Check active processes:**
```bash
passenger-status
# Output:
# Version : 6.0.14
# Date    : 2026-04-28 19:00:00 +0300
# Instance: https://ultimotradingltd.co.ke/Calculate
#   * PID: 12345 (app.js)
#     Sessions: 0
#     Processed: 1524
```

### 10.4 Log Rotation

**cPanel automatically rotates logs** in:
- `/home/ultimotr/logs/` - Apache logs (compressed daily)
- Passenger logs also rotated

**Application logs (if using Winston File transport):**
Configure logrotate manually (if SSH access):

```bash
# /etc/logrotate.d/sokogate-calc
/home/ultimotr/public_html/repositories/sokogate-calc-deploy/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ultimotr ultimotr
}
```

---

## Appendix A: Full cPanel UI Walkthrough

**Screenshots described (since we can't show images):**

1. **Login:** `https://ultimotradingltd.co.ke:2083` → Username/Password
2. **Find Node.js:** Home → Software section → "Setup Node.js App" icon
3. **Create App:**
   - Button: "Create Application"
   - Form appears:
     ```
     Node.js version: [18.x ▼]
     Application mode: [Production ▼]
     Application root: [text input]
     Application URL:  [text input]
     Application startup file: [app.js]
     ```
4. **After Create:**
   - Table shows app with status "Stopped"
   - Buttons: "Run NPM Install" | "Restart" | "Edit" | "Delete"
5. **Edit Environment:**
   - Click "Edit" → Textarea for KEY=VALUE pairs
   - Add 4 lines (NODE_ENV, PORT, BASE_PATH, CORS_ORIGIN)
   - Save
6. **Install Dependencies:**
   - Click "Run NPM Install"
   - Progress bar → Checkmark → "Completed"
7. **Start App:**
   - Click "Restart"
   - Status changes to **"Running"** (green dot)
8. **View Logs:**
   - Click app name → "Application Logs" tab
   - Shows live output

---

## Appendix B: SSH Commands Reference

```bash
# Navigate to app
cd /home/ultimotr/public_html/repositories/sokogate-calc-deploy

# View cPanel's Node.js config
cat ~/.cpanel/nodes/sokogate-calc/nodejs.conf

# View environment variables set for app
cat ~/.cpanel/nodes/sokogate-calc/environment

# Manually restart via Passenger
passenger-config restart-app ~/.cpanel/nodes/sokogate-calc

# Check running Node.js processes
ps aux | grep "node.*app.js"

# View live logs
tail -f ~/logs/passenger.log

# Install dependencies manually
npm ci --only=production

# Check Node version
node --version

# Test locally (bypassing Passenger)
PORT=3000 BASE_PATH=/Calculate node app.js

# Test with curl
curl -I http://localhost:3000/Calculate/health
```

---

## Appendix C: Troubleshooting Decision Tree

```
App not loading?
├─→ Check cPanel Node.js Logs (UI)
│   ├─ Error: "Cannot find module 'express'"
│   │   └─→ Solution: Run "Run NPM Install" in cPanel
│   ├─ Error: "Cannot find module '/home/.../app.js'"
│   │   └─→ Solution: Verify startup file = app.js in cPanel settings
│   ├─ Error: "Port already in use"
│   │   └─→ Solution: Change PORT env or restart other Node.js apps
│   └─ Other error → Google error message + "cPanel Node.js"
│
├─→ Check Apache Error Log (cPanel → Metrics → Errors)
│   ├─ 502 Bad Gateway
│   │   ├─ App crashed? → Check Node.js logs
│   │   └─ Port mismatch? → Verify process.env.PORT usage
│   └─ 404 Not Found
│       ├─ Wrong URL path? → Check Application URL in cPanel
│       └─ BASE_PATH mismatch? → Ensure BASE_PATH=/URL/path
│
└─→ Check file permissions
    ├─ Directories: 755
    ├─ Files: 644
    └─ node_modules: 755 (after npm install)

Static files 404?
├─→ public/ folder uploaded?
├─→ express.static path correct in app.js?
├─→ basePath used in EJS template?
└─→ File permissions 644?

App crashes after deploy?
├─→ npm install completed successfully?
├─→ package-lock.json uploaded? (ensures dependency versions)
├─→ Node.js version compatible? (check engines field)
└─→ Run locally with same env vars → reproduce error
```

---

## Appendix D: Environment Variables Reference Card

**Minimal required:**
```
NODE_ENV=production
PORT=3000
BASE_PATH=/Calculate
CORS_ORIGIN=https://ultimotradingltd.co.ke
```

**Production-optimized:**
```
NODE_ENV=production
PORT=3000
BASE_PATH=/Calculate
CORS_ORIGIN=https://ultimotradingltd.co.ke
LOG_LEVEL=warn
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50   # Tighter for production
```

**Development (local):**
```
NODE_ENV=development
PORT=3000
BASE_PATH=/Calculate
CORS_ORIGIN=*
LOG_LEVEL=debug
```

---

## Key Takeaways

1. **cPanel Node.js uses Phusion Passenger** as application server
2. **Never hard-code ports** - use `process.env.PORT`
3. **Application root ≠ public path** - they're independent
4. **BASE_PATH must match** App URL path in cPanel
5. **Startup file** must be correct (`app.js` for this app)
6. **Run NPM Install** after creating app (or dependencies missing)
7. **Restart** after code changes or env var updates
8. **View logs** in cPanel → Node.js → Application Logs
9. **Static files** served via `express.static()` NOT Apache directly (unless configured)
10. **Multiple instances** possible (Passenger auto-scales)

---

**Next:** See `COMPLETE-DEPLOYMENT-GUIDE.md` for end-to-end walkthrough with sokogate-calc specific settings.
