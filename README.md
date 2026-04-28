# Sokogate Construction Calculator

A production-grade Node.js/Express application for calculating construction materials, built with modern architectural patterns and security best practices.

## 🚀 Features

- **Modular Architecture**: Clean separation of concerns with dependency injection
- **Security Hardened**: Helmet, rate limiting, input validation, and secure headers
- **Structured Logging**: JSON logging with Winston for observability
- **Error Resilience**: Comprehensive error handling without information leakage
- **Container Ready**: Docker and docker-compose support for cloud deployment
- **High Performance**: Optimized middleware ordering and async patterns

## 📁 Project Structure

```
src/
├── config/          # Configuration management
├── controllers/     # Route handlers with business logic
├── middleware/      # Express middleware (security, logging, etc.)
├── routes/          # Route definitions
├── services/        # Business logic services
├── utils/           # Utilities (validation, logging)
├── app.js           # Application setup
└── server.js        # Server startup and graceful shutdown
```

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration
```

## ⚙️ Configuration

Create a `.env` file with the following variables:

```env
NODE_ENV=development
PORT=3000
BASE_PATH=/Calculate
CORS_ORIGIN=https://ultimotradingltd.co.ke
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t sokogate-calculator .
docker run -p 3000:3000 sokogate-calculator
```

## 📡 API Endpoints

- `GET /Calculate` - Calculator interface
- `POST /Calculate/calculate` - Material calculations
- `GET /Calculate/health` - Health check

## 🔒 Security Features

- **Helmet**: Security headers (CSP, HSTS, etc.)
- **Rate Limiting**: Prevents DoS attacks
- **Input Validation**: Joi schemas for all inputs
- **Error Sanitization**: No stack traces in production
- **CORS**: Configured for specific origins

## 📊 Logging

Structured JSON logging with configurable levels:
- `error`: Application errors
- `warn`: Warnings and deprecations
- `info`: General information
- `debug`: Detailed debugging (development only)

## 🧪 Health Checks

The application includes health check endpoints and Docker health checks for monitoring.

## 🚀 Deployment

### cPanel Deployment
 1. Upload `sokogate-calc-cpanel.zip` to `public_html/repositories/`
 2. Extract to `public_html/repositories/sokogate-calc-deploy/` and run `npm ci`
3. Configure Node.js app in cPanel with environment variables

### Cloud Deployment
Use the provided `Dockerfile` and `docker-compose.yml` for containerized deployment on any cloud platform.

## 🏗️ Architecture Principles

### Separation of Concerns
- **Routes**: Handle HTTP requests/responses
- **Controllers**: Process requests and coordinate services
- **Services**: Contain business logic
- **Utils**: Provide shared functionality

### Dependency Injection
Services are instantiated in controllers, making them easily testable and mockable.

### Error Handling
- Centralized error middleware
- Async error boundaries
- Production-safe error responses

## 📈 Performance Optimizations

- Middleware ordering for early exits
- Efficient static file serving
- Connection pooling ready
- Memory-conscious error handling

## 🤝 Contributing

1. Follow the established project structure
2. Add tests for new features
3. Update documentation
4. Ensure security best practices

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Git Pull Error: "Directory not empty"

If you see this error in **cPanel → Git Version Control**:
```
FileOp Failure on: /home2/ultimotr/repositories/sokogate-calc: Directory not empty
```

This happens when untracked files (like `node_modules/`, `logs/`, or `.env`) exist in the Git repository folder on the server, blocking the pull operation.

**Quick Fix:**
1. See **[CPANEL-GIT-FIX.md](CPANEL-GIT-FIX.md)** for detailed step-by-step instructions
2. Or use **cPanel → File Manager** to delete untracked files from `repositories/sokogate-calc/`
3. Then retry **"Update from Remote"** in Git Version Control

**Prevention:**
- The `.gitignore` file now includes cPanel-specific exclusions (`tmp/`, `*.pid`, `passenger_wsgi.py`)
- Never run `npm install` inside the Git repo folder on cPanel — use the deployment target folder instead

### Common Deployment Issues

| Issue | Solution |
|-------|----------|
| 404 errors | Check `BASE_PATH` environment variable matches your URL path |
| CSS/JS not loading | Verify `public/` folder was uploaded and static files are served |
| App won't start | Check cPanel Node.js logs and ensure `npm install` ran successfully |
| Old React app showing | Delete `index.html` and `assets/` from deployment folder |

## 🆘 Support

For issues with the calculator functionality, check the health endpoint and logs. For deployment issues, refer to the **[CPANEL-GIT-FIX.md](CPANEL-GIT-FIX.md)** guide or the WordPress integration guide.
