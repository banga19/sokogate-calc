# How to Run the MERN Stack App Locally

## Prerequisites

- Node.js 18.0 or higher
- npm (comes with Node.js)
- MongoDB (optional - app runs without it)

---

## Method 1: Quick Start (Recommended)

This installs everything and builds in one command:

```bash
# Navigate to project directory
cd sokogate-calc

# Install all dependencies and build
npm run setup:full

# Start the app
npm start
```

Visit: http://localhost:3000/sokogate-calc/sokogate-calc-deploy

---

## Method 2: Development Mode (With Live Reload)

Run backend and frontend separately with hot reload:

```bash
# Terminal 1: Start backend
cd sokogate-calc
npm run dev
# Backend runs on http://localhost:3000

# Terminal 2: Start frontend
cd sokogate-calc/client
npm start
# Frontend runs on http://localhost:5173
```

Or use the concurrent command:

```bash
cd sokogate-calc
npm run dev:concurrently
```

This runs both backend and frontend together with live reload.

---

## Method 3: Step by Step

### Step 1: Install Backend Dependencies
```bash
cd sokogate-calc
npm install
```

### Step 2: Install Frontend Dependencies
```bash
cd client
npm install
cd ..
```

### Step 3: Build React App
```bash
npm run build
```

### Step 4: Start Server
```bash
npm start
```

---

## Verify Installation

### Check Health Endpoint
```bash
curl http://localhost:3000/sokogate-calc/sokogate-calc-deploy/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-30T11:56:15.000Z",
  "service": "Sokogate Construction Calculator",
  "version": "2.0.0",
  "environment": "development",
  "uptime": 123.456
}
```

### Test Calculator API
```bash
curl -X POST http://localhost:3000/sokogate-calc/sokogate-calc-deploy/api/v1/calculations/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "area": 500,
    "materialType": "concrete",
    "thickness": 4
  }'
```

### View Web Interface
Open browser: http://localhost:3000/sokogate-calc/sokogate-calc-deploy

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start backend in dev mode |
| `npm run build` | Build React frontend |
| `npm run build:server` | Build & start production server |
| `npm run client` | Start frontend dev server |
| `npm run dev:concurrently` | Run backend + frontend together |
| `npm run setup` | Install all dependencies |
| `npm run setup:full` | Install & build everything |

---

## MongoDB Configuration (Optional)

The app runs without MongoDB, but you can enable it:

1. Install MongoDB locally or use MongoDB Atlas

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Edit `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/sokogate_calc
```

4. Start MongoDB:
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
```

5. Restart the app

---

## Troubleshooting

### Port 3000 Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Start MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS

# Or run without MongoDB (app will still work)
MONGODB_URI=none npm start
```

### React Build Fails
```bash
# Delete and rebuild
rm -rf client/dist
cd client
npm run build
cd ..
```

### Dependencies Installation Fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules client/node_modules
npm install
cd client && npm install && cd ..
```

### Permission Errors
```bash
# Don't use sudo, fix permissions instead
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /path/to/project
```

---

## Project Structure

```
sokogate-calc/
├── src/                    # Backend source
│   ├── app.js              # Express app
│   ├── server.js           # Server entry
│   ├── config/             # Configuration
│   ├── controllers/        # Request handlers
│   ├── routes/             # Routes
│   ├── services/           # Business logic
│   ├── middleware/         # Middleware
│   └── utils/              # Utilities
├── models/                 # Mongoose models
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   └── App.jsx         # Main app
│   └── dist/               # Production build
└── public/                 # Static assets
```

---

## Environment Variables

Create `.env` file (optional):

```env
NODE_ENV=development
PORT=3000
BASE_PATH=/sokogate-calc/sokogate-calc-deploy
MONGODB_URI=mongodb://localhost:27017/sokogate_calc
CORS_ORIGIN=http://localhost:3000
```

---

## Next Steps

After running locally:

1. **Test the calculator** - Try different materials
2. **Check history** - View saved calculations
3. **View statistics** - See usage analytics
4. **Test API** - Use Postman or curl
5. **Deploy** - Follow cPanel guide

---

## Documentation

- [README.md](README.md) - Full documentation
- [CPANEL-MERN-DEPLOYMENT-GUIDE.md](CPANEL-MERN-DEPLOYMENT-GUIDE.md) - Deployment guide
- [MERN-COMPLETE.md](MERN-COMPLETE.md) - Conversion details

---

## Support

For issues:
1. Check the troubleshooting section above
2. Review error messages in terminal
3. Check server logs
4. Verify Node.js version (>= 18.0)
5. Ensure all dependencies are installed

**Happy calculating!** 🚀
