const logger = require('../utils/logger');

class CalculatorService {
  calculateMaterials(data) {
    const { area, materialType, thickness = 4, tileSize = 12, roomWidth = 0, roomHeight = 0, roomLength = 0 } = data;

    logger.info('Calculating materials', { area, materialType, thickness, tileSize });

    const result = {
      materialType: this.getMaterialTypeName(materialType),
      roomWidth,
      roomHeight,
      roomLength
    };

    try {
      switch (materialType) {
        case 'cement':
          result.cement = `${(area * 0.4).toFixed(2)} bags (50kg)`;
          result.sand = `${(area * 0.5).toFixed(2)} cubic ft`;
          break;

        case 'bricks':
          result.bricks = `${(area * 6.25).toFixed(0)} bricks`;
          result.cement = `${Math.ceil(area * 0.02)} bags`;
          result.sand = `${(area * 0.15).toFixed(2)} cubic ft`;
          break;

        case 'concrete':
          const thicknessInFeet = thickness / 12;
          const concreteVolume = area * thicknessInFeet;
          result.concrete = `${concreteVolume.toFixed(2)} cubic ft (${(concreteVolume * 0.037).toFixed(2)} m³)`;
          result.cement = `${Math.ceil(concreteVolume * 6)} bags (50kg)`;
          result.sand = `${(concreteVolume * 0.5).toFixed(2)} cubic ft`;
          result.aggregate = `${(concreteVolume * 1).toFixed(2)} cubic ft`;
          break;

        case 'painting':
          result.paint = `${(area * 0.015).toFixed(2)} liters (2 coats)`;
          result.primer = `${(area * 0.01).toFixed(2)} liters`;
          break;

        case 'tiles':
          const tileSizeInSqFt = (tileSize * tileSize) / 144;
          const tilesNeeded = Math.ceil(area / tileSizeInSqFt * 1.1);
          const tileArea = (tilesNeeded * tileSize * tileSize) / 144;
          result.tiles = `${tilesNeeded.toFixed(0)} tiles (${tileSize}")`;
          result.tileArea = `${tileArea.toFixed(2)} sq ft (with wastage)`;
          result.adhesive = `${(tilesNeeded * 0.02).toFixed(2)} liters`;
          result.grout = `${(tilesNeeded * 0.1).toFixed(2)} kg`;
          break;

        case 'steel':
          const steelKgPerSqFt = 0.5 * (thickness / 4);
          result.steel = `${(area * steelKgPerSqFt).toFixed(2)} kg`;
          result.wireMesh = `${(area * 1.2).toFixed(2)} sq ft`;
          break;

        case 'blocks':
          const blockArea = 0.89;
          const blocksNeeded = Math.ceil(area / blockArea * 1.05);
          result.blocks = `${blocksNeeded.toFixed(0)} concrete blocks (8x8x16")`;
          result.cement = `${Math.ceil(blocksNeeded * 0.015)} bags`;
          result.sand = `${(blocksNeeded * 0.07).toFixed(2)} cubic ft`;
          break;

        case 'gravel':
          const gravelThicknessFt = thickness / 12;
          const gravelVolume = area * gravelThicknessFt;
          result.gravel = `${gravelVolume.toFixed(2)} cubic ft (${(gravelVolume * 0.037).toFixed(2)} m³)`;
          result.geotextile = `${Math.ceil(area)} sq ft`;
          break;

        case 'roofing':
          const sheetsNeeded = Math.ceil(area / 30 * 1.1);
          result.roofingSheets = `${sheetsNeeded.toFixed(0)} metal sheets`;
          result.screws = `${(sheetsNeeded * 8).toFixed(0)} roofing screws`;
          result.flashing = `${Math.ceil(area / 50).toFixed(0)} linear ft`;
          break;

        default:
          throw new Error('Invalid material type selected');
      }

      logger.info('Calculation completed successfully', { materialType, resultKeys: Object.keys(result) });
      return result;

    } catch (error) {
      logger.error('Calculation error', { error: error.message, data });
      throw new Error('An error occurred during calculation');
    }
  }

  getMaterialTypeName(type) {
    const names = {
      cement: 'Cement & Sand (Plastering)',
      bricks: 'Bricks (9x4.5 inch)',
      concrete: 'Concrete Slab (1:2:4 Mix)',
      painting: 'Paint (Interior)',
      tiles: 'Floor/Wall Tiles',
      steel: 'Reinforcement Steel',
      blocks: 'Concrete Blocks',
      gravel: 'Crushed Stone/Gravel',
      roofing: 'Metal Roofing'
    };
    return names[type] || type;
  }
}

module.exports = CalculatorService;