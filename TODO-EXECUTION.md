

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
