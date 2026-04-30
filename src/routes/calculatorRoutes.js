const express = require('express');
const CalculatorController = require('../controllers/calculatorController');
const config = require('../config');

const router = express.Router();
const calculatorController = new CalculatorController();

// Inject basePath for templates
router.use((req, res, next) => {
  res.locals.basePath = config.app.basePath;
  next();
});

// Routes - Web Interface (EJS)
router.get('/', calculatorController.getIndex);
router.get('/calculate', calculatorController.getCalculatePage);
router.post('/calculate', calculatorController.calculateMaterials);
router.get('/health', calculatorController.healthCheck);

module.exports = router;
