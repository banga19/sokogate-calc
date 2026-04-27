# Compatibility Test Matrix

## Local Development (port 3000)

| Test | Command | Expected Result | Status |
|------|---------|-----------------|--------|
| Health endpoint | `curl http://localhost:3000/Calculate/health` | `{"status":"ok"...}` | ✅ |
| Calculator page | `curl http://localhost:3000/Calculate/` | HTTP 200 + Sokogate HTML | ✅ |
| Calculate page | `curl http://localhost:3000/Calculate/calculate` | HTTP 200 + Sokogate HTML | ✅ |
| Static CSS | `curl http://localhost:3000/Calculate/style.css` | HTTP 200 + CSS content | ✅ |
| Static JS | `curl http://localhost:3000/Calculate/script.js` | HTTP 200 + JS content | ✅ |
| POST cement | `curl -X POST ... -d "area=100&materialType=cement"` | "Cement & Sand" badge | ✅ |
| POST bricks | `curl -X POST ... -d "area=500&materialType=bricks"` | "Bricks" badge + counts | ✅ |
| POST concrete | `curl -X POST ... -d "area=200&materialType=concrete&thickness=4"` | "Concrete Slab" result | ✅ |
| POST tiles | `curl -X POST ... -d "area=150&materialType=tiles&tileSize=12"` | Tiles count + wastage | ✅ |
| POST steel | `curl -X POST ... -d "area=300&materialType=steel&thickness=4"` | Steel kg + wire mesh | ✅ |
| POST painting | `curl -X POST ... -d "area=250&materialType=painting"` | Paint liters + primer | ✅ |
| POST blocks | `curl -X POST ... -d "area=100&materialType=blocks"` | Block count + cement | ✅ |
| POST gravel | `curl -X POST ... -d "area=400&materialType=gravel&thickness=6"` | Gravel volume | ✅ |
| POST roofing | `curl -X POST ... -d "area=500&materialType=roofing"` | Roofing sheets + screws | ✅ |

**All 15 tests:** ✅ PASS

---

## cPanel Production Checklist

Before marking production as "working":

1. **ZIP Package Validation**
   - [x] 13 files total
   - [x] Flat structure (no subfolder)
   - [x] `app.js` size: 7421 bytes (router mounted at BASE_PATH)
   - [x] `package.json` start: `node app.js`
   - [x] No `src/`, `.env`, `node_modules/` in ZIP

2. **cPanel Upload**
    - [ ] Upload ZIP to `public_html/repositories/`
    - [ ] Extract to `public_html/repositories/sokogate-calc-deploy/`
    - [ ] No `index.html` or `assets/` in `repositories/sokogate-calc-deploy/` after extract

3. **Node.js Configuration**
    - [ ] App root: `/home/ultimotr/public_html/repositories/sokogate-calc-deploy`
   - [ ] Startup file: `app.js`
   - [ ] Env vars: `BASE_PATH=/Calculate`, `PORT=3000`, `CORS_ORIGIN=...`
   - [ ] Node version: 18.x or 20.x

4. **Post-Install**
   - [ ] Run `npm install` (cPanel UI or SSH)
   - [ ] No errors in log
   - [ ] Click **Restart** in cPanel

5. **Live Verification**
   - [ ] `GET /Calculate/health` → 200 + JSON
   - [ ] `GET /Calculate/` → 200 + calculator HTML
   - [ ] `POST /Calculate/calculate` → 200 + result HTML
   - [ ] `/Calculate/style.css` → 200 + CSS
   - [ ] No React app (Nexus360) appearing
   - [ ] Browser console: 0 errors
   - [ ] All 8 material types calculate correctly

---

## Known Issues & Resolutions

| Issue | Cause | Fix |
|-------|-------|-----|
| Cannot POST /Calculate/calculate | Routes not prefixed with BASE_PATH | Used `express.Router()` mounted at `BASE_PATH` |
| Static files 404 | `express.static` not under BASE_PATH | `app.use(BASE_PATH, express.static(...))` |
| ZIP had `src/` folder | `deploy-prep.sh` copied `src/` | Excluded `src/` via `-x` pattern |
| Old static files served | `index.html` in deploy folder | Must manually delete from cPanel |
| Wrong start script | `package.json` had `src/server.js` | Changed to `app.js` |

---

## File Sync Status

| File | Local | Deploy ZIP | Notes |
|------|-------|------------|-------|
| `app.js` | ✅ 204 lines | ✅ 7421 bytes | Router at BASE_PATH |
| `package.json` | ✅ start: app.js | ✅ | 4 dependencies only |
| `views/index.ejs` | ✅ basePath used | ✅ | Dynamic paths |
| `public/style.css` | ✅ v1.0.2 | ✅ | 23968 bytes |
| `public/script.js` | ✅ basePath aware | ✅ | 5656 bytes |
| `.htaccess` | ✅ proxy commented | ✅ | Safe for Passenger |
| `DEPLOYMENT.md` | ✅ cPanel guide | ✅ | Included |
| `sokogate-calculator-wordpress-plugin.php` | ✅ | ✅ | WP integration |

---

## Environment Variables Required

```bash
# cPanel Setup Node.js App → Environment
NODE_ENV=production
PORT=3000
BASE_PATH=/Calculate
CORS_ORIGIN=https://ultimotradingltd.co.ke
```

---

## Next Steps

1. ✅ Local server fully working
2. ✅ ZIP regenerated with fixes
3. ⏳ Upload to cPanel
4. ⏳ Delete conflicting static files
5. ⏳ Restart app
6. ⏳ Live verification

---

**Status:** Ready for production deployment  
**Last updated:** 2026-04-27 22:36 (EAT)
