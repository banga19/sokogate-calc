const mongoose = require('mongoose');

const calculationResultSchema = new mongoose.Schema({
  // Input Data
  area: {
    type: Number,
    required: true,
    min: [0.01, 'Area must be greater than 0']
  },
  materialType: {
    type: String,
    required: true,
    enum: ['cement', 'bricks', 'concrete', 'painting', 'tiles', 'steel', 'blocks', 'gravel', 'roofing']
  },
  thickness: {
    type: Number,
    default: 4,
    min: [0, 'Thickness cannot be negative']
  },
  tileSize: {
    type: Number,
    default: 12,
    min: [1, 'Tile size must be at least 1 inch']
  },
  roomWidth: {
    type: Number,
    default: 0,
    min: [0, 'Room width cannot be negative']
  },
  roomHeight: {
    type: Number,
    default: 0,
    min: [0, 'Room height cannot be negative']
  },
  roomLength: {
    type: Number,
    default: 0,
    min: [0, 'Room length cannot be negative']
  },

  // Calculated Results
  result: {
    materialType: String,
    cement: String,
    sand: String,
    aggregate: String,
    bricks: String,
    concrete: String,
    paint: String,
    primer: String,
    tiles: String,
    tileArea: String,
    adhesive: String,
    grout: String,
    steel: String,
    wireMesh: String,
    blocks: String,
    gravel: String,
    geotextile: String,
    roofingSheets: String,
    screws: String,
    flashing: String
  },

  // Metadata
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  sessionId: String,
  userAgent: String,
  ipAddress: String
}, {
  timestamps: true
});

// Indexes for common queries
calculationResultSchema.index({ calculatedAt: -1 });
calculationResultSchema.index({ materialType: 1 });

// Virtual for formatted date
calculationResultSchema.virtual('formattedDate').get(function() {
  return this.calculatedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Method to get summary stats
calculationResultSchema.statics.getSummaryStats = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$materialType',
        count: { $sum: 1 },
        avgArea: { $avg: '$area' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

const Calculation = mongoose.model('Calculation', calculationResultSchema);

module.exports = Calculation;
