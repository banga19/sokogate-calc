# Deployment Fix TODO

- [x] 1. Update `app.js` — make `BASE_PATH` dynamic via env var, refactor routes & static serving, inject `res.locals.basePath`.
- [x] 2. Update `views/index.ejs` — replace all hardcoded `/sokogate-calc` paths with `<%= basePath %>`, inject `window.APP_BASE_PATH`.
- [x] 3. Update `public/script.js` — fix `fetch('/api/calculate-room')` to use `window.APP_BASE_PATH`.
- [x] 4. Update `.htaccess` — replace broken absolute rewrite with subfolder-safe `RewriteBase` + fallback rules.
- [x] 5. Final review and update deployment notes.
