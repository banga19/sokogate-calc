

## Steps
- [x] 1. Fix malformed HTML in `views/index.ejs` (merge correct structure from deploy + dynamic basePath from source)
- [x] 2. Sync corrected source files → `sokogate-calc-deploy/`
- [x] 3. Regenerate `sokogate-calc-cpanel.zip` via `deploy-prep.sh`
- [x] 4. Update `TODO_PLAN.md` — mark Phase 4 deployment-prep complete
- [x] 5. Final verification (file parity check)
  - `app.js` — OK
  - `public/script.js` — OK
  - `views/index.ejs` — OK
  - `.htaccess` — OK

- [x] 6. Fix `deploy-prep.sh` — ensure WordPress integration files are included
  - Added `cp sokogate-calculator-wordpress-plugin.php` to deploy script
  - Added `cp WORDPRESS-INTEGRATION-GUIDE.md` to deploy script
  - Improved ZIP structure: flat files for direct cPanel extraction

- [x] 7. Regenerate deployment package with fixes
  - ZIP now contains 13 files (flat structure, no nested subfolder)
  - Includes `sokogate-calculator-wordpress-plugin.php`
  - Includes `WORDPRESS-INTEGRATION-GUIDE.md`
  - Verified: `unzip -l` confirms correct structure

## Deployment Fixes (2026-04-27)
- [x] 8. Fix `package.json` — corrected start script and dependencies
  - Changed `"start": "node src/server.js"` → `"start": "node app.js"`
  - Removed unused dependencies: `dotenv`, `express-rate-limit`, `helmet`, `joi`, `winston`
  - Kept required dependencies: `express`, `body-parser`, `cors`, `ejs`
  - Result: Clean 4-dependency package, app starts correctly

- [x] 9. Fix `app.js` — removed BASE_PATH prefix from Express routes
  - Problem: Routes used `/Calculate` prefix but `.htaccess` proxy strips prefix
  - Solution: Routes now at `/`, `/calculate`, `/health` (no prefix)
  - Kept `res.locals.basePath` for template asset URLs
  - Result: All endpoints match correctly when proxied

- [x] 10. Fix `deploy-prep.sh` — robust ZIP creation with validation
  - Problem: ZIP contained root files + subdirectory + sensitive `.env`
  - Solution: Script now excludes `src/`, `.env`, `node_modules/`, logs, backups
  - Added critical file verification (app.js, package.json, views/, public/)
  - Result: Clean flat 13-file ZIP, 36KB

- [x] 11. Fix `.htaccess` — safe default for cPanel Passenger
  - Problem: Proxy rule active by default, conflicting with Passenger
  - Solution: Proxy rule commented out; clear instructions for iframe use
  - Result: Safe for standard cPanel Node.js app deployment

- [x] 12. Local deployment simulation — full end-to-end test
  - Extracted ZIP → `npm install` → `node app.js` → `curl` tests
  - Results:
    - `GET /health` → `{"status":"ok","timestamp":"..."}` ✅
    - `GET /` → HTTP 200 (calculator page) ✅
    - `GET /calculate` → HTTP 200 (calculator page) ✅
    - `GET /style.css` → HTTP 200 (static asset) ✅
  - All tests passed successfully

- [x] 8. Fix `package.json` — corrected start script and dependencies
  - Changed `"start": "node src/server.js"` → `"start": "node app.js"`
  - Removed unused dependencies: `dotenv`, `express-rate-limit`, `helmet`, `joi`, `winston`
  - Kept required dependencies: `express`, `body-parser`, `cors`, `ejs`
  - Verified: `npm install` succeeds, app starts correctly

- [x] 9. Fix `app.js` routing — removed `BASE_PATH` prefix from Express routes
  - Problem: Routes used `/Calculate` prefix but `.htaccess` proxy strips prefix
  - Changed: `app.get(BASE_PATH, ...)` → `app.get('/', ...)`
  - Changed: `app.get(\`${BASE_PATH}/health\`, ...)` → `app.get('/health', ...)`
  - Kept: `res.locals.basePath = BASE_PATH` for template asset URLs
  - Verified: All endpoints return correct responses

- [x] 10. Fix `.htaccess` — commented out proxy rules by default
  - Problem: Active proxy rule conflicted with cPanel Phusion Passenger routing
  - Fix: Commented out `RewriteRule` proxy line; added clear instructions
  - Safe for standard cPanel Node.js app deployment
  - WordPress iframe users can uncomment the rule as needed

- [x] 11. Fix `deploy-prep.sh` — robust ZIP creation with validation
  - Problem: Script had syntax error (duplicate `else`) and could create broken ZIPs
  - Fix: Fixed syntax error, added verification checks for critical files
  - Excludes: `src/`, `.env`, `node_modules/`, logs, backups
  - Verified: Creates clean 13-file flat ZIP every time

- [x] 12. Local deployment simulation — full end-to-end test
  - Extracted ZIP to `/tmp/deploy-test`
  - Ran `npm install` — 79 packages installed, 0 vulnerabilities
  - Started app with `node app.js`
  - Tested endpoints:
    - `GET /health` → `{"status":"ok","timestamp":"..."}` ✅
    - `GET /` → HTTP 200 ✅
    - `GET /calculate` → HTTP 200 ✅
    - `GET /style.css` → HTTP 200 ✅
  - All tests passed successfully
