const App = require('./app');
const logger = require('./utils/logger');
const config = require('./config');

async function startServer() {
  try {
    const app = new App();
    await app.start();

    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception', { error: err.message, stack: err.stack });
      process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', { reason });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = startServer;
