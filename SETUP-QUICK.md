# Quick Setup Guide - Sokogate MERN Calculator

## ⚡ 30-Second Setup

```bash
cd sokogate-calc
npm run setup:full
npm start
```

Then visit: http://localhost:3000/sokogate-calc/sokogate-calc-deploy

---

## 📋 Detailed Steps

### Step 1: Verify Node.js
```bash
node --version  # Should be >= 18.0.0
```

### Step 2: Install Everything
```bash
cd sokogate-calc
npm run setup:full
```
This installs backend & frontend dependencies and builds React app.

### Step 3: Start the App
```bash
npm start
```

Server starts on http://localhost:3000

### Step 4: Open in Browser
Visit: http://localhost:3000/sokogate-calc/sokogate-calc-deploy

---

## 🔧 Development Mode (With Live Reload)

For active development:

```bash
# Terminal 1: Backend
cd sokogate-calc
npm run dev

# Terminal 2: Frontend
cd sokogate-calc/client
npm start
```

Or use concurrent mode:
```bash
cd sokogate-calc
npm run dev:concurrently
```

Backend: http://localhost:3000  
Frontend: http://localhost:5173

---

## 🗄️ MongoDB (Optional)

The app works without MongoDB.

### With MongoDB:

1. Install MongoDB
2. Create `.env`:
```bash
cp .env.example .env
# Edit MONGODB_URI
```
3. Restart app

### Without MongoDB:
Just run normally - history won't persist.

---

## ✅ Verify It's Working

### Health Check
```bash
curl http://localhost:3000/sokogate-calc/sokogate-calc-deploy/health
```

### Test API
```bash
curl -X POST http://localhost:3000/sokogate-calc/sokogate-calc-deploy/api/v1/calculations/calculate \
  -H "Content-Type: application/json" \
  -d '{"area":500,"materialType":"concrete","thickness":4}'
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `lsof -ti:3000 \| xargs kill -9` |
| MongoDB not running | Start MongoDB or remove MONGODB_URI from .env |
| Build fails | `rm -rf client/dist && npm run build` |
| Dependencies fail | `rm -rf node_modules && npm install` |

---

## 🎯 What You Get

- ✅ Calculator with 9 material types
- ✅ Room dimension auto-calculation
- ✅ Save calculation history
- ✅ View statistics
- ✅ REST API
- ✅ Modern React interface

---

## 🚀 Next Steps

1. Try calculating materials
2. Test different materials
3. View calculation history
4. Check statistics dashboard
5. Explore API endpoints

---

**Need help?** See [RUN-LOCAL.md](RUN-LOCAL.md) for detailed instructions.
