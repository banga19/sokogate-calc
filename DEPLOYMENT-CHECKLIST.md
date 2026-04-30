# MERN Stack Deployment Checklist

## ✅ Pre-Deployment

### Backend
- [x] MongoDB connection utility (`src/config/database.js`)
- [x] Mongoose model (`models/Calculation.js`)
- [x] API routes (`src/routes/apiRoutes.js`)
- [x] Updated app.js for MongoDB + API
- [x] Config updated with MongoDB settings
- [x] Controller updated with database persistence

### Frontend
- [x] React app created (`client/`)
- [x] Calculator component
- [x] History component
- [x] Stats component
- [x] App router configured
- [x] Styles matching original design
- [x] Production build (`client/dist/`)

### Configuration
- [x] `.env.example` created
- [x] Environment variables documented
- [x] cPanel deployment guide
- [x] API documentation

## 🚀 Deployment Steps

### 1. Local Setup
```bash
npm run setup:full
```

### 2. Testing
```bash
npm run dev
# Visit http://localhost:3000/sokogate-calc/sokogate-calc-deploy
```

### 3. Build
```bash
npm run build
# Verify client/dist/ exists
```

### 4. cPanel Upload
- Upload all files to `~/sokogate-calc/`
- Create Node.js app (port 3000)
- Set application root: `sokogate-calc`
- Startup file: `app.js`

### 5. Configure
- Create `.env` file
- Set MONGODB_URI (if using MongoDB)
- Set BASE_PATH
- Configure CORS_ORIGIN

### 6. Install Dependencies
- Click "Run NPM Install" in cPanel
- Or run via SSH: `npm install --production`

### 7. Start Application
- Click "Start" in cPanel
- Or run: `npm start`

## 📋 Verification

### Health Check
```
GET /sokogate-calc/sokogate-calc-deploy/health
```

### Calculator Page
```
GET /sokogate-calc/sokogate-calc-deploy/
```

### API Test
```
POST /sokogate-calc/sokogate-calc-deploy/api/v1/calculations/calculate
{
  "area": 500,
  "materialType": "concrete",
  "thickness": 4
}
```

### History
```
GET /sokogate-calc/sokogate-calc-deploy/api/v1/calculations?page=1&limit=10
```

## 🔧 Troubleshooting

### MongoDB Connection Failed
- Check MONGODB_URI in .env
- Verify MongoDB is running
- App continues without database (graceful degradation)

### React Build Not Loading
- Verify `client/dist/` exists
- Check file permissions
- Ensure production flag is set

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
```

### API Returns 404
- Verify BASE_PATH in .env
- Check route prefix `/api/v1`
- Review server logs

## 📁 File Structure

```
sokogate-calc/
├── src/                    # Backend
│   ├── config/            # Configuration
│   ├── controllers/       # Request handlers
│   ├── routes/            # Routes
│   ├── services/          # Business logic
│   ├── middleware/        # Middleware
│   ├── utils/             # Utilities
│   └── views/             # EJS templates
├── models/                # Mongoose schemas
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   └── App.jsx        # Main app
│   └── dist/              # Production build
├── public/                # Static assets
└── .env.example           # Env template
```

## 🎯 Features

- ✅ 9 Material Types
- ✅ MongoDB Persistence
- ✅ REST API
- ✅ React SPA
- ✅ Auto Dimensions
- ✅ History Tracking
- ✅ Statistics
- ✅ Rate Limiting
- ✅ Security Headers
- ✅ cPanel Ready

## 📚 Documentation

- [README.md](README.md) - Main documentation
- [CPANEL-MERN-DEPLOYMENT-GUIDE.md](CPANEL-MERN-DEPLOYMENT-GUIDE.md) - Deployment guide
- [MERN-COMPLETE.md](MERN-COMPLETE.md) - Complete conversion guide

## 🔄 Backward Compatibility

- EJS views still functional
- Same calculation logic
- API alongside web interface
- Optional database
- Graceful degradation

---

**Status**: ✅ Ready for Deployment
**Version**: 2.0.0
**Last Updated**: 2026-04-30
