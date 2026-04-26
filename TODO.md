# Sokogate Production UI Fix — Implementation Tracker

## Root Causes Identified
1. `views/index.ejs` is severely malformed (missing tags, mixed old/new structure, missing DOM elements)
2. `sokogate-calc-deploy/public/style.css` contains old CSS, not the modern design system
3. `sokogate-calc-deploy/views/index.ejs` is MISSING entirely
4. `script.js` references non-existent DOM elements due to broken EJS

## Implementation Steps
- [ ] Step 1: Rewrite `views/index.ejs` with complete modern HTML matching CSS design system
- [ ] Step 2: Update `public/script.js` — fix selectors, remove legacy injected styles
- [ ] Step 3: Add cache-busting and production cache-control headers in `app.js`
- [ ] Step 4: Sync all modern assets to `sokogate-calc-deploy/`
- [ ] Step 5: Update `deploy-prep.sh` with validation checks
- [ ] Step 6: Verify build package integrity

