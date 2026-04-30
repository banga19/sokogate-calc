# Sokogate Construction Calculator - MERN Stack

A full-stack construction materials calculator built with **MongoDB, Express, React, and Node.js**, optimized for cPanel deployment.

## Features

### 🎯 Core Functionality
- **9 Material Types**: Cement, bricks, concrete, paint, tiles, steel, blocks, gravel, roofing
- **Real-time Calculations**: Instant material estimates based on area and specifications
- **Room Dimension Auto-calculation**: Enter width × length to auto-calculate area
- **Calculation History**: All calculations saved to MongoDB database
- **Statistics Dashboard**: View usage analytics and trends

### 🔧 Technical Features
- **RESTful API**: Full CRUD operations for programmatic access
- **MongoDB Integration**: Persistent storage with Mongoose ODM
- **React Frontend**: Modern SPA with React Router
- **EJS Legacy Views**: Server-side rendering for non-JS users
- **Input Validation**: Joi schemas on backend
- **Security**: Helmet, rate limiting, CORS
- **Responsive Design**: Works on mobile, tablet, and desktop

## Tech Stack

### Backend
- **Node.js** 18+
- **Express.js** 4.x
- **MongoDB** + **Mongoose** (optional but recommended)
- **Joi** validation
- **Winston** logging
- **Helmet** + **express-rate-limit**

### Frontend
- **React** 18
- **React Router** 6
- **Vite** build tool
- **Tailwind CSS**
- Custom CSS matching original design

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB (local or Atlas)

### Installation

```bash
# Clone or navigate to project
cd sokogate-calc

# Install all dependencies (backend + frontend)
npm run setup

# Build React app
npm run build
```

### Development

```bash
# Run backend (port 3000)
npm run dev

# Run frontend (port 5173)
cd client && npm start

# Run both concurrently
npm run dev:concurrently
```

### Production

```bash
# Build and start
npm run build:server
```

## Usage

### Web Interface
Visit `http://localhost:3000/sokogate-calc/sokogate-calc-deploy`

1. Enter area in square feet (or use room dimensions)
2. Select material type
3. Adjust thickness/tile size if needed
4. Click "Calculate Materials"
5. View results with detailed breakdown

### API Usage

Base URL: `/sokogate-calc/sokogate-calc-deploy/api/v1`

#### Calculate Materials
```bash
curl -X POST http://localhost:3000/sokogate-calc/sokogate-calc-deploy/api/v1/calculations/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "area": 500,
    "materialType": "concrete",
    "thickness": 4
  }'
```

#### Get History
```bash
curl http://localhost:3000/sokogate-calc/sokogate-calc-deploy/api/v1/calculations?page=1&limit=10
```

#### Get Statistics
```bash
curl http://localhost:3000/sokogate-calc/sokogate-calc-deploy/api/v1/calculations/stats
```

## cPanel Deployment

See [CPANEL-MERN-DEPLOYMENT-GUIDE.md](CPANEL-MERN-DEPLOYMENT-GUIDE.md) for detailed instructions.

### Quick Deploy

1. Upload files to `~/sokogate-calc/`
2. Create Node.js app in cPanel (port 3000, app.js)
3. Set environment variables in `.env`
4. Run npm install via cPanel
5. Start application

## File Structure

```
sokogate-calc/
├── src/
│   ├── app.js              # Express app (class-based)
│   ├── server.js           # Server entry
│   ├── config/
│   │   ├── index.js        # App config
│   │   └── database.js     # MongoDB connection
│   ├── controllers/
│   │   └── calculatorController.js
│   ├── routes/
│   │   ├── calculatorRoutes.js  # Web (EJS)
│   │   └── apiRoutes.js         # REST API
│   ├── services/
│   │   └── calculatorService.js # Business logic
│   ├── middleware/
│   ├── utils/
│   └── views/              # EJS templates
├── models/
│   └── Calculation.js      # Mongoose schema
├── client/                 # React app
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   └── components/
│   ├── index.html
│   └── vite.config.js
├── public/                 # Static assets
├── .env.example
└── package.json
```

## API Endpoints

### Web Routes (EJS)
- `GET /` - Calculator page
- `GET /calculate` - Calculator page
- `POST /calculate` - Calculate (web)
- `GET /health` - Health check

### API Routes (REST)
- `GET /api/v1/calculations` - List (paginated)
- `GET /api/v1/calculations/:id` - Get one
- `GET /api/v1/calculations/stats` - Statistics
- `POST /api/v1/calculations/calculate` - Calculate & save
- `DELETE /api/v1/calculations/:id` - Delete one
- `DELETE /api/v1/calculations` - Delete all

## Configuration

Edit `.env` or set environment variables:

```env
NODE_ENV=development
PORT=3000
BASE_PATH=/sokogate-calc/sokogate-calc-deploy
MONGODB_URI=mongodb://localhost:27017/sokogate_calc
CORS_ORIGIN=https://yourdomain.com
```

## Material Calculations

### Cement & Sand Plastering
- Cement: 0.4 bags per sq ft
- Sand: 0.5 cubic ft per sq ft

### Bricks
- Bricks: 6.25 per sq ft
- Cement: 0.02 bags per sq ft
- Sand: 0.15 cubic ft per sq ft

### Concrete Slab
- Volume: area × thickness (in feet)
- Cement: 6 bags per cubic ft
- Sand: 0.5 cubic ft per cubic ft
- Aggregate: 1 cubic ft per cubic ft

### Painting
- Paint: 0.015 liters per sq ft (2 coats)
- Primer: 0.01 liters per sq ft

### Tiles
- Tiles needed: area ÷ tile area × 1.1 (wastage)
- Adhesive: 0.02 liters per tile
- Grout: 0.1 kg per tile

### Steel Reinforcement
- Steel: 0.5 × (thickness/4) kg per sq ft
- Wire mesh: 1.2 sq ft per sq ft

### Concrete Blocks
- Blocks: area ÷ 0.89 × 1.05
- Cement: 0.015 bags per block
- Sand: 0.07 cubic ft per block

### Gravel
- Volume: area × thickness (in feet)
- Geotextile: 1 sq ft per sq ft

### Roofing
- Sheets: area ÷ 30 × 1.1
- Screws: 8 per sheet
- Flashing: area ÷ 50

## Scripts

```json
{
  "start": "node src/server.js",
  "dev": "NODE_ENV=development node src/server.js",
  "build": "cd client && npm run build",
  "build:server": "npm run build && NODE_ENV=production node src/server.js",
  "client": "cd client && npm start",
  "client:install": "cd client && npm install",
  "dev:concurrently": "concurrently \"npm run dev\" \"npm run client\"",
  "setup": "npm install && npm run client:install",
  "setup:full": "npm run setup && npm run build"
}
```

## Database Schema

### Calculation
- area (Number, required)
- materialType (String, enum)
- thickness (Number, default: 4)
- tileSize (Number, default: 12)
- roomWidth, roomHeight, roomLength (Number)
- result (Object)
- calculatedAt (Date)
- sessionId, userAgent, ipAddress (String)

## Security

- Rate limiting: 100 requests per 15 minutes per IP
- CORS restricted to configured origins
- Helmet security headers
- Input validation (Joi)
- No sensitive data in error messages (production)
- MongoDB injection protection (Mongoose)

## Performance

- Connection pooling (max 10)
- Static file caching
- Minified production build
- Lazy loading where applicable

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT

## Support

For issues or questions, please check:
- [Deployment Guide](CPANEL-MERN-DEPLOYMENT-GUIDE.md)
- [Health Check Troubleshooting](HEALTH-CHECK-TROUBLESHOOTING.md)
