const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/database');

const config = require('./config');
const calculatorRoutes = require('./routes/calculatorRoutes');
const apiRoutes = require('./routes/apiRoutes');
const { requestLogger, securityHeaders, createRateLimiter, errorHandler, notFoundHandler } = require('./middleware');
const logger = require('./utils/logger');

class App {
  constructor() {
    this.app = express();
    this.config = config;

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  async initializeDatabase() {
    // Only connect to MongoDB if MONGODB_URI is set (optional for cPanel)
    if (process.env.MONGODB_URI || config.mongodb?.uri) {
      try {
        await connectDB();
      } catch (err) {
        logger.warn('MongoDB connection failed, continuing without database', { error: err.message });
      }
    } else {
      logger.info('MongoDB URI not configured, running without database');
    }
  }

  initializeMiddlewares() {
    this.app.use(securityHeaders);
    this.app.use(createRateLimiter());
    this.app.use(cors({ origin: this.config.app.corsOrigin, credentials: true }));
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());

    // View engine
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, '..', 'views'));

    // Static files
    this.app.use(this.config.app.basePath, express.static(path.join(__dirname, '..', 'public')));

    // Request logging
    this.app.use(requestLogger);
  }

  initializeRoutes() {
    // API Routes
    this.app.use(this.config.app.basePath + '/api/v1', apiRoutes);

    // Web Routes
    this.app.use(this.config.app.basePath, calculatorRoutes);

    // In production, serve React app for any unmatched routes under basePath
    if (process.env.NODE_ENV === 'production') {
      const reactDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
      this.app.use(this.config.app.basePath, express.static(reactDistPath));
      this.app.use(this.config.app.basePath, (req, res) => {
        res.sendFile(path.join(reactDistPath, 'index.html'));
      });
    }

    // Root redirect
    this.app.get('/', (req, res) => res.redirect(this.config.app.basePath));
  }

  initializeErrorHandling() {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  async start() {
    await this.initializeDatabase();
    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.config.app.port, () => {
        logger.info(`${this.config.app.name} v${this.config.app.version} running`, {
          port: this.config.app.port,
          env: this.config.app.env,
          basePath: this.config.app.basePath,
          database: process.env.MONGODB_URI ? 'MongoDB' : 'Disabled'
        });
        resolve(server);
      });
      server.on('error', reject);
    });
  }

  getApp() { return this.app; }
}

module.exports = App;
