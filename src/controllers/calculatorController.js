const CalculatorService = require('../services/calculatorService');
const { calculationSchema, healthCheckSchema } = require('../utils/validation');
const { asyncHandler } = require('../middleware');
const logger = require('../utils/logger');
const config = require('../config');

class CalculatorController {
  constructor() {
    this.calculatorService = new CalculatorService();
  }

  // GET / - Serve calculator page
  getIndex = asyncHandler(async (req, res) => {
    logger.debug('Serving calculator index page');
    res.render('index', {
      result: null,
      query: req.query,
      basePath: config.app.basePath
    });
  });

  // GET /calculate - Redirect or serve page
  getCalculatePage = asyncHandler(async (req, res) => {
    logger.debug('Serving calculate page');
    res.render('index', {
      result: null,
      query: req.query,
      basePath: config.app.basePath
    });
  });

  // POST /calculate - Process calculation
  calculateMaterials = asyncHandler(async (req, res) => {
    // Validate input
    const { error, value } = calculationSchema.validate(req.body, { abortEarly: false });

    if (error) {
      logger.warn('Validation failed', { errors: error.details.map(d => d.message) });
      return res.render('index', {
        result: { error: error.details.map(d => d.message).join(', ') },
        query: req.query,
        basePath: config.app.basePath
      });
    }

    // Perform calculation
    const result = await this.calculatorService.calculateMaterials(value);

    logger.info('Calculation completed', { materialType: value.materialType });

    res.render('index', {
      result,
      query: req.query,
      basePath: config.app.basePath
    });
  });

  // GET /health - Health check endpoint
  healthCheck = asyncHandler(async (req, res) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: config.app.name,
      version: config.app.version,
      environment: config.app.env,
      uptime: process.uptime()
    };

    logger.debug('Health check requested', health);
    res.json(health);
  });

  // GET /calculate (old redirect) - Redirect to base path
  redirectCalculate = asyncHandler(async (req, res) => {
    logger.debug('Redirecting /calculate to base path');
    res.redirect(config.app.basePath);
  });
}

module.exports = CalculatorController;