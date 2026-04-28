# cPanel Git Pull Fix — "Directory Not Empty" Error

**Error:** `FileOp Failure on: /home2/ultimotr/repositories/sokogate-calc: Directory not empty`

**Applies to:** cPanel → Git Version Control → "Update from Remote" (Pull)

**Your Setup:**
- GitHub Repo: `git@github.com:banga19/sokogate-calc.git`
- cPanel Repo Storage: `repositories/sokogate-calc`
- Deployment Target: `public_html/repositories/sokogate-calc`

---

## Why This Happens

cPanel stores your Git repository in `~/repositories/sokogate-calc`. When you click **"Update from Remote"**, cPanel runs `git pull`. This fails with "Directory not empty" when:

1. **Untracked files exist** in the repo folder (e.g., `node_modules/`, `logs/`, `.env` created by running the app)
2. **Local changes** were made directly on the server via File Manager
3. **Old deployment artifacts** remain from a previous upload or failed deployment
4. The repo folder was manually created or populated before Git Version Control was set up

> **Important:** This error refers to the **Git repo folder** (`repositories/sokogate-calc`), not the deployment target (`public_html/repositories/sokogate-calc`).

---

## Solution A: Quick Fix — Delete Untracked Files (Recommended First)

This preserves your Git history and settings. Best if the repo was working before.

### Step 1: Open File Manager
1. Log in to **cPanel**
2. Click **File Manager**
3. Navigate to: `repositories/sokogate-calc/`

### Step 2: Identify Untracked Files
Look for folders/files that are **NOT** in your GitHub repo. Common culprits:

| File/Folder | Why It's There | Safe to Delete? |
|-------------|----------------|-----------------|
| `node_modules/` | Created by `npm install` | ✅ Yes — will be recreated |
| `logs/` | Created by running app | ✅ Yes |
| `.env` | Environment variables | ✅ Yes — set these in cPanel Node.js App instead |
| `tmp/` | Temporary files | ✅ Yes |
| `passenger_wsgi.py` | cPanel Passenger file | ✅ Yes — cPanel recreates it |
| `*.pid` | Process ID files | ✅ Yes |
| `index.html` | Old React app artifact | ✅ Yes |
| `assets/` | Old React app folder | ✅ Yes |
| `.npmrc` | May conflict with cPanel | ✅ Yes |

### Step 3: Delete the Untracked Files
1. **Select** the untracked folders/files (Ctrl+Click or Cmd+Click)
2. Click **Delete** (top toolbar)
3. Confirm deletion
4. **Empty Trash** (bottom of File Manager — critical!)

### Step 4: Retry Git Pull
1. Go back to **cPanel → Git Version Control**
2. Find your `sokogate-calc` repository
3. Click **"Update from Remote"** (or **"Pull"**)
4. The pull should now succeed ✅

### Step 5: Redeploy
1. In Git Version Control, click **"Deploy"** (or **"Deploy HEAD Commit"**)
2. Verify files appear in `public_html/repositories/sokogate-calc/`

---

## Solution B: Nuclear Option — Delete & Recreate Everything (Guaranteed Clean)

Use this if Solution A fails or you want a completely fresh start.

### Step 1: Delete the Git Repo in cPanel
1. **cPanel → Git Version Control**
2. Find `sokogate-calc`
3. Click the **trash icon** or **Remove** to delete the repository configuration
4. This removes the cPanel Git link but may leave the folder

### Step 2: Delete Repo Folder via File Manager
1. **cPanel → File Manager**
2. Navigate to `repositories/`
3. **Delete** the `sokogate-calc/` folder entirely
4. **Empty Trash**

### Step 3: Delete Deployment Target (Optional but Recommended)
1. In File Manager, navigate to `public_html/repositories/`
2. **Delete** the `sokogate-calc/` folder
3. **Empty Trash**

### Step 4: Recreate Git Repo
1. **cPanel → Git Version Control**
2. Click **Create**
3. Fill in:
   - **Clone URL:** `git@github.com:banga19/sokogate-calc.git`
   - **Repository Path:** `repositories/sokogate-calc`
   - **Repository Name:** `sokogate-calc`
4. Click **Create**

> **Note:** If using SSH key authentication, ensure cPanel's Deploy Key is added to your GitHub repo (Settings → Deploy Keys).

### Step 5: Configure Deployment
1. In Git Version Control, find your new repo
2. Click **"Manage"**
3. Set **Deploy to:** `public_html/repositories/sokogate-calc`
4. Save

### Step 6: Pull & Deploy
1. Click **"Update from Remote"** (Pull)
2. Click **"Deploy HEAD Commit"**
3. Verify files appear in `public_html/repositories/sokogate-calc/`

---

## Solution C: Using cPanel Terminal (If Available)

Some cPanel hosts provide a **Terminal** icon. If you see it:

1. **cPanel → Terminal**
2. Run these commands one by one:

```bash
cd /home2/ultimotr/repositories/sokogate-calc
git status
git clean -fd
git reset --hard origin/master
git pull origin master
```

3. Then deploy via Git Version Control UI

---

## Post-Fix: Set Up Node.js App

After the Git pull succeeds and files are deployed:

1. **cPanel → Setup Node.js App**
2. Create or edit your application:
   - **Application root:** `/home/ultimotr/public_html/repositories/sokogate-calc`
   - **Application URL:** `https://ultimotradingltd.co.ke/repositories/sokogate-calc` (or your desired path)
   - **Application startup file:** `app.js`
3. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   BASE_PATH=/repositories/sokogate-calc
   CORS_ORIGIN=https://ultimotradingltd.co.ke
   ```
4. Click **Run NPM Install**
5. Click **Restart**

---

## Prevention: Stop This From Happening Again

### 1. Update `.gitignore` on GitHub
Ensure your repo's `.gitignore` includes:

```
node_modules/
.env
.env.local
logs/
*.log
npm-debug.log*
tmp/
*.pid
passenger_wsgi.py
.DS_Store
```

This prevents generated files from being tracked and causing conflicts.

### 2. Never Run `npm install` in the Repo Folder
If you need to install dependencies, do it in the **deployment target** (`public_html/repositories/sokogate-calc`) or let cPanel's Node.js App handle it. Running `npm install` inside `repositories/sokogate-calc` creates `node_modules/` that blocks Git pulls.

### 3. Use cPanel's Node.js App for Environment Variables
Instead of creating `.env` files manually, set variables in:
**cPanel → Setup Node.js App → Environment Variables**

### 4. Enable Force Deploy (If Available)
Some cPanel versions have a "Force Deploy" or "Overwrite" option in Git Version Control settings. Enable this if available.

---

## Verification Checklist

After fixing, confirm everything works:

- [ ] Git pull succeeds without errors
- [ ] Files appear in `public_html/repositories/sokogate-calc/`
- [ ] `app.js` exists in the deployment folder
- [ ] `package.json` exists in the deployment folder
- [ ] cPanel Node.js App shows "Running"
- [ ] Website loads at your URL

**Test command (if you have Terminal access):**
```bash
curl -I https://ultimotradingltd.co.ke/repositories/sokogate-calc/health
# Expected: HTTP/1.1 200 OK
```

---

## Need More Help?

If none of these solutions work:

1. **Contact your hosting provider** and reference this error: `FileOp Failure on: /home2/ultimotr/repositories/sokogate-calc: Directory not empty`
2. Ask them to run `cpanel-git-fix.sh` (provided in this repo) via SSH
3. Or ask them to delete and recreate the Git repo for you

---

**Last Updated:** 2026-04-28  
**Applies to:** cPanel Git Version Control + Node.js App deployment
