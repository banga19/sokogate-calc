const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./src/config/database');
const config = require('./src/config');
const calculatorRoutes = require('./src/routes/calculatorRoutes');
const apiRoutes = require('./src/routes/apiRoutes');
const { requestLogger, securityHeaders, createRateLimiter, errorHandler, notFoundHandler } = require('./src/middleware');
const logger = require('./src/utils/logger');

const app = express();

// Database connection (optional)
if (process.env.MONGODB_URI || config.mongodb?.uri) {
  connectDB().catch(err => logger.warn('MongoDB connection failed', { error: err.message }));
}

// Middlewares
app.use(securityHeaders);
app.use(createRateLimiter());
app.use(cors({ origin: config.app.corsOrigin, credentials: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(config.app.basePath, express.static(path.join(__dirname, 'public')));
app.use(requestLogger);

// API Routes
app.use(config.app.basePath + '/api/v1', apiRoutes);

// Web Routes
app.use(config.app.basePath, calculatorRoutes);

// Production: Serve React app
if (process.env.NODE_ENV === 'production') {
  const reactDistPath = path.join(__dirname, 'client', 'dist');
  app.use(config.app.basePath, express.static(reactDistPath));
  app.use(config.app.basePath, (req, res) => {
    res.sendFile(path.join(reactDistPath, 'index.html'));
  });
}

// Root redirect
app.get('/', (req, res) => res.redirect(config.app.basePath));

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Sokogate Calculator running on port ${PORT} | BASE_PATH=${config.app.basePath} | DB=${process.env.MONGODB_URI || config.mongodb?.uri ? 'MongoDB' : 'Disabled'}`);
  });
}

module.exports = app;
