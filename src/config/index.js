require('dotenv').config();

const config = {
  app: {
    name: 'Sokogate Construction Calculator',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    basePath: process.env.BASE_PATH || '/sokogate-calc/sokogate-calc-deploy',
    corsOrigin: process.env.CORS_ORIGIN || 'https://ultimotradingltd.co.ke'
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sokogate_calc',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },
  security: {
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
    }
  }
};

module.exports = config;
