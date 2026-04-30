# Sokogate MERN Stack - cPanel Deployment Guide

## Overview
This is a full MERN stack application (MongoDB, Express, React, Node.js) for construction materials calculation, optimized for cPanel deployment.

## Architecture

### Backend (Node.js + Express + MongoDB)
- **Express.js** server with RESTful API
- **MongoDB + Mongoose** for calculation history storage
- **Joi** for input validation
- **Winston** for logging
- **Helmet** + **Rate Limiting** for security

### Frontend (React + Vite)
- **React 18** with functional components
- **React Router** for SPA navigation
- **Tailwind CSS** for styling (reuses original design tokens)
- **Vite** for fast builds

### File Structure
```
sokogate-calc/
├── src/
│   ├── app.js              # Main Express app (class-based)
│   ├── server.js           # Server entry point
│   ├── config/
│   │   ├── index.js        # App configuration
│   │   └── database.js     # MongoDB connection
│   ├── controllers/
│   │   └── calculatorController.js  # Request handlers
│   ├── routes/
│   │   ├── calculatorRoutes.js     # Web routes (EJS)
│   │   └── apiRoutes.js            # API routes (REST)
│   ├── services/
│   │   └── calculatorService.js    # Business logic
│   ├── middleware/
│   │   ├── index.js        # Middleware exports
│   │   └── ...
│   ├── utils/
│   │   ├── validation.js   # Joi schemas
│   │   └── logger.js       # Winston logger
│   └── views/              # EJS templates (legacy)
├── models/
│   └── Calculation.js      # Mongoose schema
├── client/                 # React frontend
│   ├── src/
│   │   ├── main.jsx        # React entry
│   │   ├── App.jsx         # Main component with routes
│   │   ├── components/
│   │   │   ├── Calculator.jsx
│   │   │   ├── History.jsx
│   │   │   └── Stats.jsx
│   │   └── App.css
│   ├── index.html
│   └── vite.config.js
├── public/                 # Static assets
├── .env.example            # Environment template
└── package.json            # Dependencies & scripts
```

## Installation

### Quick Setup (Automated)
```bash
npm run setup:full
```

This runs:
1. `npm install` - Install backend dependencies
2. `npm run client:install` - Install frontend dependencies
3. `npm run build` - Build React app

### Manual Setup

1. **Install backend dependencies:**
```bash
npm install
```

2. **Install frontend dependencies:**
```bash
cd client && npm install && cd ..
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Build React app:**
```bash
npm run build
```

## cPanel Deployment

### Prerequisites
- cPanel with Node.js support (v18+)
- MongoDB access (local or remote like MongoDB Atlas)

### Step-by-Step

1. **Upload files to cPanel:**
   - Use File Manager or FTP
   - Upload to `~/sokogate-calc/` (or subdirectory)

2. **Create MongoDB database:**
   ```bash
   # Option A: Local MongoDB (if available)
   # MongoDB should already be running
   
   # Option B: MongoDB Atlas (recommended for cPanel)
   # Get connection string from Atlas dashboard
   ```

3. **Configure environment:**
   - In cPanel File Manager, create `.env` in `sokogate-calc/`
   - Or use cPanel "Environment Variables" in Node.js app
   ```
   NODE_ENV=production
   PORT=3000
   BASE_PATH=/sokogate-calc/sokogate-calc-deploy
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sokogate_calc
   CORS_ORIGIN=https://yourdomain.com
   ```

4. **Setup Node.js app in cPanel:**
   - Open "Setup Node.js App" in cPanel
   - Create new application:
     - Node.js version: 18+
     - Application mode: Production
     - Application root: `/home/username/sokogate-calc`
     - Application URL: `https://yourdomain.com/sokogate-calc/sokogate-calc-deploy`
     - Application startup file: `app.js`
   - Click "Create"

5. **Install dependencies:**
   - In cPanel Node.js app, click "Run NPM Install"
   - Or run manually via SSH:
     ```bash
     cd ~/sokogate-calc
     npm install --production
     cd client && npm install --production && npm run build
     ```

6. **Start the application:**
   - Click "Start" in cPanel Node.js panel
   - Or restart if already started

7. **Verify deployment:**
   - Visit `https://yourdomain.com/sokogate-calc/sokogate-calc-deploy`
   - Check health: `.../health`
   - Test API: `.../api/v1/calculations/stats`

### Alternative: Using Phusion Passenger

If cPanel has Passenger support:

1. Create `passenger.json`:
```json
{
  "app_type": "node",
  "startup_file": "app.js"
}
```

2. Set environment in `.htaccess`:
```
PassengerAppType node
PassengerStartupFile app.js
PassengerNodeEnv production
```

## Development

### Run backend only:
```bash
npm run dev
```

### Run frontend only:
```bash
cd client && npm start
```

### Run both (concurrently):
```bash
npm run dev:concurrently
```
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

### Build for production:
```bash
npm run build
```
Output: `client/dist/`

## API Documentation

### Base URL
`/sokogate-calc/sokogate-calc-deploy/api/v1`

### Endpoints

#### GET /calculations
Get all calculations (paginated)
- Query params: `page`, `limit`, `materialType`
- Response: `{ success, data, pagination }`

#### GET /calculations/:id
Get single calculation
- Response: `{ success, data }`

#### GET /calculations/stats
Get summary statistics
- Response: `{ success, data: { totalCalculations, byMaterialType, recentCalculations } }`

#### POST /calculations/calculate
Calculate materials and save to database
- Body: `{ area, materialType, thickness?, tileSize?, roomWidth?, roomHeight?, roomLength? }`
- Response: `{ success, data: { calculation, result } }`

#### DELETE /calculations/:id
Delete a calculation
- Response: `{ success, message }`

#### DELETE /calculations
Delete all calculations
- Response: `{ success, message }`

#### GET /health
Health check
- Response: `{ status, timestamp, service, version, environment, uptime }`

## Features

### 1. Calculation Engine (Service Layer)
- 9 material types: cement, bricks, concrete, painting, tiles, steel, blocks, gravel, roofing
- Validated inputs with Joi schemas
- Business logic separated from routes

### 2. Database Layer
- Mongoose models with validation
- Automatic calculation history
- Pagination support
- Statistics aggregation

### 3. REST API
- Full CRUD operations
- Filter and pagination
- JSON responses

### 4. Web Interface (React)
- Real-time calculator
- Calculation history viewer
- Statistics dashboard
- Auto-calculating room dimensions
- Responsive design

### 5. Legacy Support
- EJS views still work for non-JS users
- Progressive enhancement

## Security

- Helmet for HTTP headers
- Rate limiting (100 req/15min per IP)
- CORS restricted to configured origins
- Input validation with Joi
- No SQL injection (MongoDB with Mongoose)
- Error messages don't leak stack traces in production

## Performance

- MongoDB connection pooling (max 10)
- Static file serving optimized
- React production build minified
- Server-side rendering for legacy views
- Client-side routing for React app

## Troubleshooting

### Port already in use
```bash
lsof -ti:3000 | xargs kill -9
```

### MongoDB connection fails
- Check `MONGODB_URI` in .env
- Whitelist IP in MongoDB Atlas if using cloud
- Verify MongoDB is running locally

### React app not loading in production
- Run `npm run build` in client/
- Verify `client/dist/` exists
- Check cPanel static file permissions

### API routes return 404
- Verify BASE_PATH in .env
- Check route prefix: `/api/v1`
- Look at server logs

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `BASE_PATH` | URL path prefix | `/sokogate-calc/sokogate-calc-deploy` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/sokogate_calc` |
| `CORS_ORIGIN` | Allowed CORS origin | `https://ultimotradingltd.co.ke` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `LOG_LEVEL` | Winston log level | info |

## Migration from Legacy

The old EJS-based app is still supported:
- Routes under `/sokogate-calc/sokogate-calc-deploy/` still render EJS
- New React app available at same URL
- API at `/api/v1/` for programmatic access
- Database shared between both interfaces

## License

MIT
