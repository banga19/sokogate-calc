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
1. Upload `sokogate-calc-cpanel.zip` to `public_html/Calculate/`
2. Extract and run `npm ci`
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

## 🆘 Support

For issues with the calculator functionality, check the health endpoint and logs. For deployment issues, refer to the WordPress integration guide.