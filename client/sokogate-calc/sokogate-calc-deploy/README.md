# Sokogate Calculator - cPanel Deployment

## Quick Setup

1. Upload all files in this directory to:
   `/home/ultimotr/public_html/repositories/sokogate-calc3/sokogate-calc-deploy/`

2. In cPanel → Setup Node.js App:
   - Application root: `/home/ultimotr/public_html/repositories/sokogate-calc3/sokogate-calc-deploy`
   - Startup file: `app.js`
   - Application URL: `https://ultimotradingltd.co.ke/repositories/sokogate-calc3/sokogate-calc-deploy`

3. Set environment variables:
   ```
   NODE_ENV=production
   APP_PORT=3001
   BASE_PATH=/repositories/sokogate-calc3/sokogate-calc-deploy
   CORS_ORIGIN=https://ultimotradingltd.co.ke
   ```
   If `PORT=3000` already exists in cPanel and gives "already in use", delete that variable or leave it alone and set `APP_PORT=3001`. The app gives `APP_PORT` priority over `PORT`.

4. Click "Create", then "Run NPM Install", then "Restart"

5. Verify:
   - https://ultimotradingltd.co.ke/repositories/sokogate-calc3/sokogate-calc-deploy
   - https://ultimotradingltd.co.ke/repositories/sokogate-calc3/sokogate-calc-deploy/health

See COMPLETE-DEPLOYMENT-GUIDE.md for full instructions.
