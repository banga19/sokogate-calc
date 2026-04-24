const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/sokogate-calc', (req, res) => {
  res.render('index', { result: null });
});

app.get('/sokogate-calc/calculate', (req, res) => {
  res.render('index', { result: null });
});

app.post('/sokogate-calc/calculate', (req, res) => {
  const { area, materialType, thickness, tileSize, jointType } = req.body;
  let result = {};
  const areaNum = parseFloat(area);

  if (isNaN(areaNum) || areaNum <= 0) {
    result = { error: 'Please enter a valid area (greater than 0)' };
    return res.render('index', { result });
  }

  const thicknessNum = parseFloat(thickness) || 4;
  const tileSizeNum = parseFloat(tileSize) || 12;

  switch (materialType) {
    case 'cement':
      const cementPerSqFt = 0.4;
      const sandPerSqFt = 0.5;
      result.cement = (areaNum * cementPerSqFt).toFixed(2) + ' bags (50kg)';
      result.sand = (areaNum * sandPerSqFt).toFixed(2) + ' cubic ft';
      result.materialType = 'Cement & Sand (Plastering)';
      break;

    case 'bricks':
      const bricksPerSqFt = 6.25; // 9"x4.5" brick with mortar
      const cementForBricks = Math.ceil(areaNum * 0.02);
      const sandForBricks = (areaNum * 0.15).toFixed(2);
      result.bricks = (areaNum * bricksPerSqFt).toFixed(0) + ' bricks';
      result.cement = cementForBricks + ' bags';
      result.sand = sandForBricks + ' cubic ft';
      result.materialType = 'Bricks (9x4.5 inch)';
      break;

    case 'concrete':
      const thicknessInFeet = thicknessNum / 12;
      const concreteVolume = areaNum * thicknessInFeet;
      const cementQty = Math.ceil(concreteVolume * 6); // 1:2:4 mix, ~6 bags per cubic ft
      const sandQty = (concreteVolume * 0.5).toFixed(2);
      const aggregateQty = (concreteVolume * 1).toFixed(2);
      result.concrete = concreteVolume.toFixed(2) + ' cubic ft (' + (concreteVolume * 0.037).toFixed(2) + ' m³)';
      result.cement = cementQty + ' bags (50kg)';
      result.sand = sandQty + ' cubic ft';
      result.aggregate = aggregateQty + ' cubic ft';
      result.materialType = 'Concrete Slab (1:2:4 Mix)';
      break;

    case 'painting':
      const paintLiters = areaNum * 0.015;
      const primerLiters = areaNum * 0.01;
      result.paint = paintLiters.toFixed(2) + ' liters (2 coats)';
      result.primer = primerLiters.toFixed(2) + ' liters';
      result.materialType = 'Paint (Interior)';
      break;

    case 'tiles':
      if (!tileSizeNum || tileSizeNum <= 0) {
        result = { error: 'Please select a tile size' };
        return res.render('index', { result });
      }
      const tileSizeInSqFt = (tileSizeNum * tileSizeNum) / 144;
      const tilesNeeded = Math.ceil(areaNum / tileSizeInSqFt * 1.1); // +10% wastage
      const tileArea = (tilesNeeded * tileSizeNum * tileSizeNum) / 144;
      const adhesiveLiters = tilesNeeded * 0.02;
      const groutKg = tilesNeeded * 0.1;
      result.tiles = tilesNeeded.toFixed(0) + ' tiles (' + tileSizeNum + '")';
      result.tileArea = tileArea.toFixed(2) + ' sq ft (with wastage)';
      result.adhesive = adhesiveLiters.toFixed(2) + ' liters';
      result.grout = groutKg.toFixed(2) + ' kg';
      result.materialType = 'Floor/Wall Tiles';
      break;

    case 'steel':
      if (thicknessNum <= 0) {
        result = { error: 'Thickness is required for steel calculation' };
        return res.render('index', { result });
      }
      const steelKgPerSqFt = 0.5 * (thicknessNum / 4);
      result.steel = (areaNum * steelKgPerSqFt).toFixed(2) + ' kg';
      result.wireMesh = (areaNum * 1.2).toFixed(2) + ' sq ft';
      result.materialType = 'Reinforcement Steel';
      break;

    case 'blocks':
      const blockArea = 0.89; // 8"x8"x16" block covers ~0.89 sq ft
      const blocksNeeded = Math.ceil(areaNum / blockArea * 1.05);
      const blockCement = Math.ceil(blocksNeeded * 0.015);
      const blockSand = (blocksNeeded * 0.07).toFixed(2);
      result.blocks = blocksNeeded.toFixed(0) + ' concrete blocks (8x8x16")';
      result.cement = blockCement + ' bags';
      result.sand = blockSand + ' cubic ft';
      result.materialType = 'Concrete Blocks';
      break;

    case 'gravel':
      const gravelThicknessFt = thicknessNum / 12;
      const gravelVolume = areaNum * gravelThicknessFt;
      result.gravel = gravelVolume.toFixed(2) + ' cubic ft (' + (gravelVolume * 0.037).toFixed(2) + ' m³)';
      result.geotextile = areaNum.toFixed(0) + ' sq ft';
      result.materialType = 'Crushed Stone/Gravel';
      break;

    case 'roofing':
      const sheetsNeeded = Math.ceil(areaNum / 30 * 1.1); // 30 sq ft per sheet, +10% overlap
      const screwsNeeded = sheetsNeeded * 8;
      result.roofingSheets = sheetsNeeded.toFixed(0) + ' metal sheets';
      result.screws = screwsNeeded.toFixed(0) + ' roofing screws';
      result.flashing = Math.ceil(areaNum / 50).toFixed(0) + ' linear ft';
      result.materialType = 'Metal Roofing';
      break;

    default:
      result = { error: 'Invalid material type selected' };
  }

  res.render('index', { result });
});

app.listen(port, () => {
  console.log(`Sokogate Calculator running on port ${port}`);
});
