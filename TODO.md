# Sokogate Calculator — Emergency Repair TODO

## Root Cause
The "mod" commits (mod2 through mod6) corrupted `views/index.ejs` and `public/script.js` while attempting to modernize the UI to match production. Commit `2a4090e` was the last working state.

## Repair Steps

- [x] **Step 1**: Reconstruct `views/index.ejs`
  - Preserve modern HTML structure (header, hero, cards, responsive grid)
  - Fix all unclosed HTML tags
  - Restore correct EJS conditional logic for results rendering
  - Keep production asset paths (`/sokogate-calc/...`)
  - Ensure all DOM elements expected by `script.js` exist

- [x] **Step 2**: Fix `public/script.js`
  - Fix broken `try/catch/finally` brace alignment in room visualizer fetch handler
  - Keep `displayRoomResults` and `showRoomError` inside `DOMContentLoaded`
  - Preserve modern additions (room visualizer CSS, 3D container show/hide)
  - Ensure `roomBtn` null checks exist

- [x] **Step 3**: Test locally
  - Start server on port 3000
  - Verify `GET /sokogate-calc/` renders without 500
  - Test all 8 material calculations
  - Test room visualizer API endpoint

- [x] **Step 4**: Sync to deploy directory
  - Copy fixed files to `sokogate-calc-deploy/`
  - Run `deploy-prep.sh` if available
