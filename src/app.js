const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const config = require('./config');
const calculatorRoutes = require('./routes/calculatorRoutes');
const {
  requestLogger,
  securityHeaders,
  createRateLimiter,
  errorHandler,
  notFoundHandler
} = require('./middleware');
const logger = require('./utils/logger');

class App {
  constructor() {
    this.app = express();
    this.config = config;

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddlewares() {
    // Security headers
    this.app.use(securityHeaders);

    // Rate limiting
    this.app.use(createRateLimiter());

    // CORS
    this.app.use(cors({
      origin: this.config.app.corsOrigin,
      credentials: true
    }));

    // Body parsing
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());

    // View engine
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, '..', 'views'));

    // Static files
    this.app.use(this.config.app.basePath, express.static(path.join(__dirname, '..', 'public')));

    // Request logging
    this.app.use(requestLogger);

    logger.info('Application middlewares initialized', {
      env: this.config.app.env,
      port: this.config.app.port,
      basePath: this.config.app.basePath
    });
  }

  initializeRoutes() {
    // Mount routes with base path
    this.app.use(this.config.app.basePath, calculatorRoutes);

    // Root redirect for convenience
    this.app.get('/', (req, res) => {
      res.redirect(this.config.app.basePath);
    });
  }

  initializeErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  getApp() {
    return this.app;
  }

  async start() {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.config.app.port, () => {
        logger.info(`${this.config.app.name} v${this.config.app.version} running`, {
          port: this.config.app.port,
          env: this.config.app.env,
          basePath: this.config.app.basePath
        });
        resolve(server);
      });

      server.on('error', (err) => {
        logger.error('Server startup error', { error: err.message });
        reject(err);
      });
    });
  }
}

module.exports = App;