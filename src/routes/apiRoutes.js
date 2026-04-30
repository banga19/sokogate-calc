const express = require('express');
const Calculation = require('../../models/Calculation');
const { calculateMaterials } = require('../services/calculatorService');
const { asyncHandler } = require('../middleware');

const router = express.Router();

// GET /api/v1/calculations - Get all calculations (with pagination)
router.get('/calculations', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const materialType = req.query.materialType;

  const query = materialType ? { materialType } : {};

  const [calculations, total] = await Promise.all([
    Calculation.find(query).sort({ calculatedAt: -1 }).skip(skip).limit(limit),
    Calculation.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: calculations,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  });
}));

// GET /api/v1/calculations/:id - Get single calculation
router.get('/calculations/:id', asyncHandler(async (req, res) => {
  const calculation = await Calculation.findById(req.params.id);
  
  if (!calculation) {
    return res.status(404).json({ success: false, error: 'Calculation not found' });
  }
  
  res.json({ success: true, data: calculation });
}));

// GET /api/v1/calculations/stats - Get summary statistics
router.get('/calculations/stats', asyncHandler(async (req, res) => {
  const stats = await Calculation.getSummaryStats();
  const total = await Calculation.countDocuments();
  const recent = await Calculation.find().sort({ calculatedAt: -1 }).limit(5);

  res.json({
    success: true,
    data: {
      totalCalculations: total,
      byMaterialType: stats,
      recentCalculations: recent
    }
  });
}));

// POST /api/v1/calculations/calculate - Calculate materials and save
router.post('/calculations/calculate', asyncHandler(async (req, res) => {
  const calculationData = {
    area: req.body.area,
    materialType: req.body.materialType,
    thickness: req.body.thickness,
    tileSize: req.body.tileSize,
    roomWidth: req.body.roomWidth || 0,
    roomHeight: req.body.roomHeight || 0,
    roomLength: req.body.roomLength || 0,
    sessionId: req.body.sessionId,
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip
  };

  // Calculate materials using service
  const result = await calculateMaterials(calculationData);
  calculationData.result = result;

  // Save to database
  const calculation = new Calculation(calculationData);
  await calculation.save();

  res.json({
    success: true,
    data: {
      calculation,
      result
    }
  });
}));

// DELETE /api/v1/calculations/:id - Delete a calculation
router.delete('/calculations/:id', asyncHandler(async (req, res) => {
  const calculation = await Calculation.findByIdAndDelete(req.params.id);
  
  if (!calculation) {
    return res.status(404).json({ success: false, error: 'Calculation not found' });
  }
  
  res.json({ success: true, message: 'Calculation deleted' });
}));

// DELETE /api/v1/calculations - Delete all calculations
router.delete('/calculations', asyncHandler(async (req, res) => {
  await Calculation.deleteMany({});
  res.json({ success: true, message: 'All calculations deleted' });
}));

module.exports = router;
