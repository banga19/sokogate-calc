# Sokogate Calculator - cPanel Deployment

## Quick Setup

1. Upload all files in this directory to:
   `/home/ultimotr/public_html/repositories/sokogate-calc-deploy/`

2. In cPanel → Setup Node.js App:
   - Application root: `/home/ultimotr/public_html/repositories/sokogate-calc-deploy`
   - Startup file: `app.js`
   - Application URL: `https://ultimotradingltd.co.ke/Calculate`

3. Set environment variables:
   ```
   NODE_ENV=production
   PORT=3000
   BASE_PATH=/Calculate
   CORS_ORIGIN=https://ultimotradingltd.co.ke
   ```

4. Click "Create", then "Run NPM Install", then "Restart"

5. Verify:
   - https://ultimotradingltd.co.ke/Calculate
   - https://ultimotradingltd.co.ke/Calculate/health

See COMPLETE-DEPLOYMENT-GUIDE.md for full instructions.
