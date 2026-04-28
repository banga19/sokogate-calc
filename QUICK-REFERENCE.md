# Sokogate Calculator - Quick Reference

## 🚀 One-Line Deployment (cPanel)

```bash
# 1. Generate package
./deploy-cpanel.sh

# 2. Upload sokogate-calc-cpanel.zip to cPanel → File Manager
#    Extract to: /home/ultimotr/public_html/repositories/sokogate-calc-deploy/

# 3. In cPanel → Setup Node.js App:
#    - Root: /home/ultimotr/public_html/repositories/sokogate-calc-deploy
#    - Startup: app.js
#    - URL: https://ultimotradingltd.co.ke/Calculate
#    - Env: NODE_ENV=production, PORT=3000, BASE_PATH=/Calculate, CORS_ORIGIN=https://ultimotradingltd.co.ke

# 4. Click "Run NPM Install" → "Restart"
```

## 🐳 Docker Commands

```bash
# Build
docker build --target runtime -t sokogate-calculator:1.0.0 .

# Test locally
docker run -p 3000:3000 -e BASE_PATH=/Calculate sokogate-calculator:1.0.0

# Push to registry
docker tag sokogate-calculator:1.0.0 yourname/sokogate-calc:1.0.0
docker push yourname/sokogate-calc:1.0.0

# Automated (with creds)
DOCKER_USERNAME=xxx DOCKER_PASSWORD=xxx ./deploy.sh 1.0.0
```

## 📋 Checklist

### Pre-Deploy
- [ ] `npm ci` - install dependencies
- [ ] `npm test` - health check passes
- [ ] All 9 material types tested
- [ ] SSL certificate active

### Deploy (cPanel)
- [ ] Upload ZIP to `/public_html/repositories/`
- [ ] Extract to `sokogate-calc-deploy/`
- [ ] Create Node.js app with correct settings
- [ ] Set 4 required environment variables
- [ ] Run `npm install` in cPanel
- [ ] Restart application

### Post-Deploy
- [ ] https://ultimotradingltd.co.ke/Calculate → loads
- [ ] https://ultimotradingltd.co.ke/Calculate/health → JSON OK
- [ ] Calculate cement, bricks, concrete → results display
- [ ] Mobile responsive check
- [ ] No console errors

## 🔧 Common Commands

```bash
# Local dev
BASE_PATH=/Calculate PORT=3000 node app.js

# View logs (cPanel)
tail -f /home/ultimotr/logs/passenger.log

# Restart cPanel app
# → cPanel UI → Setup Node.js App → Restart

# Check container health (Docker)
docker ps --filter "name=sokogate"
docker logs sokogate-calculator

# Fix permissions
chmod 755 /home/ultimotr/public_html/repositories/sokogate-calc-deploy
chmod 644 /home/ultimotr/public_html/repositories/sokogate-calc-deploy/*.js
```

## ⚙️ Environment Variables

**Required:**
```
NODE_ENV=production
PORT=3000
BASE_PATH=/Calculate
CORS_ORIGIN=https://ultimotradingltd.co.ke
```

**Optional:**
```
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🆘 Troubleshooting

| Issue | Fix |
|-------|-----|
| App not starting | Check cPanel Node.js logs; verify app.js exists |
| 404 on /Calculate | Ensure BASE_PATH matches Application URL |
| CSS/JS 404 | Verify public/ folder uploaded; check express.static path |
| Port in use | Restart via cPanel UI |
| npm install fails | Use SSH: `npm ci --only=production --legacy-peer-deps` |
| Template error | Ensure views/index.ejs uploaded |

## 📦 Files Overview

```
sokogate-calc/
├── app.js                    ← Main server (Express)
├── package.json              ← Dependencies
├── views/index.ejs           ← Calculator UI template
├── public/                   ← Static assets (CSS, JS, images)
├── Dockerfile                ← Production container
├── docker-compose.yml        ← Local orchestration
├── healthcheck.js            ← Health endpoint tester
├── deploy.sh                 ← Docker build & push
├── deploy-cpanel.sh          ← Create deployment ZIP
└── sokogate-calc-cpanel.zip  ← Ready-to-upload package
```

## 📞 Quick Links

- Full Guide: `COMPLETE-DEPLOYMENT-GUIDE.md`
- Resolution Report: `RESOLUTION-REPORT.md`
- cPanel Docs: https://docs.cpanel.net/cpanel/software/install-nodejs-application/
- Live Site: https://ultimotradingltd.co.ke/Calculate

---

**Version:** 1.0.0  
**Last Updated:** 2026-04-28  
**Status:** ✅ Production Ready
