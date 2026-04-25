# Fix localhost:3000 Issue - TODO

## Steps
- [x] Install dependencies (`npm install`)
- [x] Add root route `/` to `app.js`
- [x] Test the server (`npm start`)
- [x] Verify calculator loads at `http://localhost:3000/`
- [x] Test form submission and 3D visualization

---

# cPanel Deployment - TODO

## Preparation
- [x] Create `DEPLOYMENT.md` guide
- [x] Create `.htaccess` for URL routing
- [x] Update `package.json` with cPanel metadata
- [x] Create `deploy-prep.sh` packaging script

## cPanel Server Steps
- [ ] Upload files to cPanel (exclude `node_modules/`, `.git/`)
- [ ] Run `npm install` on server
- [ ] Create Node.js app in cPanel (Setup Node.js App)
- [ ] Configure application root and startup file
- [ ] Restart app from cPanel interface
- [ ] Test live URL: `https://yourdomain.com/sokogate-calc`
- [ ] Verify health check endpoint works
- [ ] Test all calculator functions
- [ ] Verify 3D visualization loads
