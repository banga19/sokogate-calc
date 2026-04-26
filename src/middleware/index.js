const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const config = require('../config');

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });

  next();
};

// Security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Rate limiting
const createRateLimiter = () => {
  return rateLimit({
    windowMs: config.security.rateLimit.windowMs,
    max: config.security.rateLimit.max,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(config.security.rateLimit.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent')
      });
      res.status(429).json({
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.security.rateLimit.windowMs / 1000)
      });
    }
  });
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  // Don't leak error details in production
  const isDevelopment = config.app.env === 'development';
  const errorResponse = {
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  };

  res.status(err.status || 500).json(errorResponse);
};

// 404 handler
const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  res.status(404).json({
    error: 'Route not found',
    path: req.url,
    method: req.method
  });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  requestLogger,
  securityHeaders,
  createRateLimiter,
  errorHandler,
  notFoundHandler,
  asyncHandler
};