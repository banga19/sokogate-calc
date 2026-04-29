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
   BASE_PATH=/repositories/sokogate-calc3/sokogate-calc-deploy
   CORS_ORIGIN=https://ultimotradingltd.co.ke
   ```
   Do not set `PORT=3000` manually unless cPanel specifically assigns that port. If cPanel exposes a Port/Application Port field, use a free assigned port and keep the app restarted from the Node.js App panel.

4. Click "Create", then "Run NPM Install", then "Restart"

5. Verify:
   - https://ultimotradingltd.co.ke/repositories/sokogate-calc3/sokogate-calc-deploy
   - https://ultimotradingltd.co.ke/repositories/sokogate-calc3/sokogate-calc-deploy/health

See COMPLETE-DEPLOYMENT-GUIDE.md for full instructions.
