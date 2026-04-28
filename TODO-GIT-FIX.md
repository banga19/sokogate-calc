# Git Pull "Directory Not Empty" Fix — Task Tracker

## Objective
Resolve `FileOp Failure on: /home2/ultimotr/repositories/sokogate-calc: Directory not empty` when pulling from GitHub via cPanel → Git Version Control.

## Constraints
- Only cPanel web interface (no SSH)
- Deployment target: `public_html/repositories/sokogate-calc`
- GitHub repo: `git@github.com:banga19/sokogate-calc.git`

## Steps

- [x] 1. Create `CPANEL-GIT-FIX.md` — Step-by-step cPanel UI fix guide
- [x] 2. Create `cpanel-git-fix.sh` — SSH fix script (for future/hosting provider use)
- [x] 3. Create `deploy-cpanel.sh` — Full deployment automation script
- [x] 4. Update `.gitignore` — Add cPanel/Passenger-specific exclusions
- [x] 5. Update `README.md` — Add Git troubleshooting section
- [x] 6. Local dry-run test of scripts
