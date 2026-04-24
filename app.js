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
  const { area, materialType, thickness } = req.body;
  let result = {};
  const areaNum = parseFloat(area);

  if (isNaN(areaNum) || areaNum <= 0) {
    result = { error: 'Please enter a valid area' };
    return res.render('index', { result });
  }

  const thicknessNum = parseFloat(thickness) || 0;

  if (materialType === 'cement') {
    const cementPerSqFt = 0.4;
    const sandPerSqFt = 0.5;
    result.cement = (areaNum * cementPerSqFt).toFixed(2) + ' bags';
    result.sand = (areaNum * sandPerSqFt).toFixed(2) + ' cubic ft';
  } else if (materialType === 'bricks') {
    const bricksPerSqFt = 500;
    result.bricks = (areaNum * bricksPerSqFt).toFixed(0) + ' bricks';
  } else if (materialType === 'concrete') {
    const concretePerSqFt = 0.125;
    result.concrete = (areaNum * concretePerSqFt * (thicknessNum || 4) / 12).toFixed(2) + ' cubic ft';
    result.cement = Math.ceil(areaNum * 0.15).toFixed(0) + ' bags';
    result.sand = (areaNum * 0.25).toFixed(2) + ' cubic ft';
    result.aggregate = (areaNum * 0.25).toFixed(2) + ' cubic ft';
  } else if (materialType === 'painting') {
    const paintPerSqFt = 0.015;
    result.paint = (areaNum * paintPerSqFt).toFixed(2) + ' liters';
  } else {
    result = { error: 'Invalid material type' };
  }

  res.render('index', { result });
});

app.listen(port, () => {
  console.log(`Sokogate Calculator running on port ${port}`);
});