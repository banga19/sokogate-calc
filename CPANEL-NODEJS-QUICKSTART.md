# cPanel Node.js Deployment: Quick-Start Visual Guide

## Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────┐
│  Client Browser                                             │
│  GET https://ultimotradingltd.co.ke/Calculate              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS (443)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Apache Web Server                                          │
│  • SSL Termination (Let's Encrypt)                         │
│  • Serves static files (if any)                            │
│  • VirtualHost for ultimotradingltd.co.ke                  │
└────────────────────────┬────────────────────────────────────┘
                         │ mod_proxy (reverse proxy)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Phusion Passenger (mod_passenger)                          │
│  • Detects Node.js app configuration                       │
│  • Spawns Node.js process on demand                        │
│  • Assigns dynamic port (e.g., 34567)                      │
│  • Injects: process.env.PORT=34567                         │
└────────────────────────┬────────────────────────────────────┘
                         │ TCP localhost:34567
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Node.js (Express)                                          │
│  app.listen(process.env.PORT)                              │
│  → listens on 34567                                         │
│  • Routes: app.use('/Calculate', router)                   │
│  • Renders EJS: views/index.ejs                            │
│  • Serves static: express.static('public')                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Flowchart

```
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 1: LOCAL PREPARATION                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1. Verify package.json has "start": "node app.js"      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 2. Ensure app.js uses: const PORT = process.env.PORT    │    │
│  │    || 3000;                                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 3. Set BASE_PATH in app.js or via env:                 │    │
│  │    BASE_PATH=/Calculate                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 4. Test locally:                                        │    │
│  │    BASE_PATH=/Calculate node app.js                     │    │
│  │    curl http://localhost:3000/Calculate/health          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            ↓                                       │
│                  ✅ Local verification passed                      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 2: UPLOAD TO cPanel                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Option A: File Manager (Web)                            │    │
│  │  1. cPanel → File Manager                               │    │
│  │  2. Navigate to /public_html/repositories/              │    │
│  │  3. Upload sokogate-calc-cpanel.zip                     │    │
│  │  4. Extract to sokogate-calc-deploy/                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Option B: FTP/SFTP                                       │    │
│  │  1. Connect with FileZilla/WinSCP                       │    │
│  │  2. Upload to /public_html/repositories/sokogate-calc-  │    │
│  │     deploy/                                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            ↓                                       │
│                  ✅ Files at: /home/ultimotr/public_html/...     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 3: CREATE NODE.JS APPLICATION                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  cPanel → Setup Node.js App → Create Application                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Field                  │ Value                           │    │
│  ├────────────────────────┼─────────────────────────────────┤    │
│  │ Node.js version        │ 18.x LTS (or 20.x)             │    │
│  │ Application mode       │ Production                     │    │
│  │ Application root       │ /home/ultimotr/.../sokogate-  │    │
│  │                        │ calc-deploy                     │    │
│  │ Application URL        │ https://ultimotradingltd.co.ke/│    │
│  │                        │ Calculate                       │    │
│  │ Startup file           │ app.js                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            ↓                                       │
│                  Click "Create" → App created (status: Stopped)   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 4: CONFIGURE ENVIRONMENT VARIABLES                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Click "Edit" → Add Environment Variables                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ NODE_ENV=production                                      │    │
│  │ PORT=3000                                                │    │
│  │ BASE_PATH=/Calculate                                      │    │
│  │ CORS_ORIGIN=https://ultimotradingltd.co.ke               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            ↓                                       │
│                  Click "Save" → cPanel writes ~/.cpanel/...      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 5: INSTALL DEPENDENCIES                                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Click "Run NPM Install" button                           │    │
│  │                                                           │    │
│  │ cPanel executes:                                         │    │
│  │   cd /home/ultimotr/.../sokogate-calc-deploy            │    │
│  │   npm ci --only=production                               │    │
│  │                                                           │    │
│  │ Output: "added 107 packages, removed 8 packages"         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            ↓                                       │
│                  ✅ node_modules/ created on server               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 6: START APPLICATION                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Click "Restart" button                                   │    │
│  │                                                           │    │
│  │ Passenger actions:                                       │    │
│  │  1. Sends SIGTERM to existing process (if any)          │    │
│  │  2. Waits for graceful shutdown (10s timeout)           │    │
│  │  3. Spawns new Node.js process                          │    │
│  │     - Injects environment variables                     │    │
│  │     - Assigns port (e.g., 34567)                        │    │
│  │     - Executes: node app.js                              │    │
│  │  4. Waits for app to call app.listen(PORT)              │    │
│  │  5. Proxies first request through Passenger             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            ↓                                       │
│                  Status: "Running" (green indicator)              │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 7: VERIFICATION                                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Test these URLs in browser:                                      │
│                                                                   │
│  1. https://ultimotradingltd.co.ke/Calculate                     │
│     → Calculator page loads (HTTP 200)                            │
│                                                                   │
│  2. https://ultimotradingltd.co.ke/Calculate/health              │
│     → {"status":"ok","basePath":"/Calculate",...}                │
│                                                                   │
│  3. https://ultimotradingltd.co.ke/Calculate/style.css           │
│     → CSS file served (HTTP 200, Content-Type: text/css)         │
│                                                                   │
│  4. Test calculation:                                             │
│     POST area=100&materialType=cement                            │
│     → Shows results: 40 bags cement, 50 cu ft sand              │
│                                                                   │
│                  ✅ All checks passed → LIVE                     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Common Commands Summary

### cPanel Interface
```
Setup Node.js App → Create → Configure → Save → Run NPM Install → Restart
```

### SSH Commands (if available)
```bash
cd /home/ultimotr/public_html/repositories/sokogate-calc-deploy
npm ci --only=production
passenger-config restart-app ~/.cpanel/nodes/sokogate-calc
tail -f ~/logs/passenger.log
ps aux | grep "node app.js"
```

### Environment Variables (must set in cPanel UI)
```
NODE_ENV=production
PORT=3000                    # Optional; Passenger assigns dynamically
BASE_PATH=/Calculate         # MUST match Application URL path
CORS_ORIGIN=https://ultimotradingltd.co.ke
```

---

## Key Differences: Traditional vs Node.js Hosting

| Feature | PHP Hosting | Node.js on cPanel |
|---------|-------------|-------------------|
| **File to edit** | `index.php` in `public_html/` | `app.js` anywhere (outside public_html OK) |
| **Request handling** | Apache spawns php-fpm per request | Node.js persistent process handles all requests |
| **`.htaccess`** | URL rewriting, security headers | Usually disabled for Node.js routes |
| **Process** | Short-lived per request | Long-running until restart/crash |
| **Restart needed** | Only after code change | After code change OR env var change |
| **Port** | N/A (Apache speaks HTTP) | Dynamic port assigned by Passenger |
| **File structure** | `public_html/` is document root | App root separate; URL path mapped independently |
| **Dependencies** | Composer (`vendor/`) | npm (`node_modules/`) |
| **State** | Stateless | Can hold in-memory cache (Redis alternative) |

**Example: Same URL, different structure**

```
Traditional PHP:
  /public_html/calculate.php  →  https://site.com/calculate.php

Node.js:
  /home/user/apps/calc/app.js  →  https://site.com/Calculate
  (Note: different filesystem path AND URL path)
```

---

## Troubleshooting at a Glance

```
Problem: 404 on /Calculate
├─ Check: Application URL in cPanel = https://.../Calculate
├─ Check: BASE_PATH env = /Calculate
├─ Check: app.js mounted routes: app.use(BASE_PATH, router)
└─ Check: .htaccess proxy rules commented out (if using Passenger)

Problem: CSS/JS 404
├─ Check: public/ folder uploaded
├─ Check: express.static(BASE_PATH, ...) in app.js
└─ Check: EJS uses <basePath>/style.css (not /style.css)

Problem: App shows "Stopped" in cPanel
├─ Check: Node.js Logs (cPanel UI) for error
├─ Check: npm install completed?
├─ Check: package.json syntax valid (JSON)
└─ Check: app.js syntax (node -c app.js)

Problem: npm install hangs/fails
├─ Use SSH if available: npm ci --only=production --no-optional
├─ Increase memory limit in cPanel PHP settings
└─ Try again during off-peak hours (server load)

Problem: Port 3000 already in use
├─ cPanel assigns its own port; PORT env is just hint
├─ Don't hard-code port in app.js
└─ Restart app via cPanel UI
```

---

## Deployment Checklist (Copy-Paste)

```
[ ] Prepare app locally
    [ ] package.json has "start": "node app.js"
    [ ] app.js uses process.env.PORT
    [ ] BASE_PATH configured
    [ ] Tested: BASE_PATH=/Calculate node app.js
    [ ] Health check works: curl localhost:3000/Calculate/health

[ ] Upload to cPanel
    [ ] Files uploaded to /public_html/repositories/sokogate-calc-deploy/
    [ ] app.js present in root of that folder
    [ ] package.json present
    [ ] public/ folder uploaded (contains style.css, script.js)
    [ ] views/ folder uploaded (contains index.ejs)
    [ ] Permissions: files 644, dirs 755

[ ] cPanel configuration
    [ ] Setup Node.js App → Create
    [ ] Node.js version: 18.x or 20.x
    [ ] Application mode: Production
    [ ] Application root: /home/ultimotr/.../sokogate-calc-deploy
    [ ] Application URL: https://ultimotradingltd.co.ke/Calculate
    [ ] Startup file: app.js
    [ ] Click "Create"

[ ] Environment variables
    [ ] NODE_ENV=production
    [ ] PORT=3000
    [ ] BASE_PATH=/Calculate
    [ ] CORS_ORIGIN=https://ultimotradingltd.co.ke
    [ ] Click "Save"

[ ] Install & start
    [ ] Click "Run NPM Install" → wait for completion
    [ ] Click "Restart" → status turns green "Running"

[ ] Post-deploy verification
    [ ] https://ultimotradingltd.co.ke/Calculate → loads calculator
    [ ] /Calculate/health → returns JSON {"status":"ok"}
    [ ] /Calculate/style.css → returns CSS
    [ ] POST to /calculate with test data → shows results
    [ ] Console (F12) no errors
    [ ] Mobile view works
    [ ] SSL active (padlock icon)
```

---

## Phusion Passenger Internals (Advanced)

When cPanel creates a Node.js app, it generates:

```
~/.cpanel/nodes/<app-name>/
├── app.js                    # Symlink or copy of your startup file
├── environment               # KEY=VALUE lines for env vars
├── nodejs.conf               # Passenger config
└── passenger_emit_error_on_proxy_defer  # Flag file

Example nodejs.conf:
  PassengerEnabled on
  PassengerAppRoot /home/ultimotr/public_html/repositories/sokogate-calc-deploy
  PassengerAppScriptName app.js
  PassengerAppEnv production
  PassengerSpawnMethod smart
  PassengerMinInstances 1
  PassengerMaxInstances 3
```

Passenger reads this config, spawns Node.js with:

```bash
cd /home/ultimotr/public_html/repositories/sokogate-calc-deploy
PORT=34567 NODE_ENV=production BASE_PATH=/Calculate \
  node app.js
```

The `PORT` is dynamically chosen from available ports (not 80/443; those are Apache).

---

## Comparison: Docker vs cPanel Node.js Selector

| Aspect | Docker (Manual) | cPanel Node.js Selector |
|--------|-----------------|--------------------------|
| **Installation** | `docker run` command | cPanel UI clicks |
| **Port mapping** | `-p 3000:3000` explicit | Automatic via Passenger |
| **Environment** | `-e KEY=VAL` or `--env-file` | cPanel UI form |
| **Dependencies** | `RUN npm ci` in Dockerfile | "Run NPM Install" button |
| **Restart** | `docker restart <container>` | "Restart" button |
| **Logs** | `docker logs <container>` | cPanel → Application Logs |
| **Scaling** | `docker-compose scale` | Passenger auto-scales instances |
| **Updates** | Rebuild & redeploy image | Upload new files, restart |
| **SSL** | Configure in container or reverse proxy | Handled by Apache on host |
| **Resource limits** | `--memory`, `--cpus` flags | cPanel account limits |
| **Isolation** | Full container isolation | Shared OS (less isolation) |

**Choose Docker if:** You need full control, custom OS packages, or multi-container setup.

**Choose cPanel Node.js:** Simpler, integrated with hosting control panel, no root/SSH required.

---

## Quick Reference Card

**cPanel Node.js Apps live at:**
```
Filesystem:  /home/<user>/public_html/repositories/<app>/
URL:         https://<domain>/<path>  (configurable)
Process:     Managed by Phusion Passenger
Port:        Dynamic (injected as process.env.PORT)
```

**Essential files:**
- `app.js` - Entry point (must export Express app or call listen())
- `package.json` - Must have `"start": "node app.js"`
- `public/` - Static files
- `views/` - EJS/Pug templates (if server-rendering)

**cPanel UI button sequence:**
```
1. Setup Node.js App → Create
2. Set: root, URL, startup file, Node version
3. Edit → Add env vars (NODE_ENV, BASE_PATH, etc.)
4. Save
5. Run NPM Install
6. Restart
```

**SSH equivalent:**
```bash
cd /home/ultimotr/.../app
npm ci --only=production
passenger-config restart-app ~/.cpanel/nodes/<app-name>
```

---

**See also:**
- `COMPLETE-DEPLOYMENT-GUIDE.md` - Full end-to-end deployment with sokogate-calc example
- `DEPLOYMENT.md` - Original deployment notes
- `CPANEL-GIT-FIX.md` - Git-based deployment strategy
