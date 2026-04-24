document.addEventListener('DOMContentLoaded', function() {
  const materialTypeSelect = document.getElementById('materialType');
  const thicknessGroup = document.getElementById('thicknessGroup');
  const form = document.getElementById('calcForm');
  const areaInput = document.getElementById('area');
  
  if (materialTypeSelect && form) {
    materialTypeSelect.addEventListener('change', function() {
      const selectedValue = this.value;
      
      if (selectedValue === 'concrete') {
        thicknessGroup.style.display = 'block';
      } else {
        thicknessGroup.style.display = 'none';
      }

      // Update 3D preview when material type changes
      update3DPreview();
    });

    // Update preview when area changes
    if (areaInput) {
      areaInput.addEventListener('input', update3DPreview);
    }

    // Update preview when thickness changes
    const thicknessInput = document.getElementById('thickness');
    if (thicknessInput) {
      thicknessInput.addEventListener('input', update3DPreview);
    }
    
    form.addEventListener('submit', function(e) {
      const area = document.getElementById('area').value;
      const materialType = materialTypeSelect.value;
      
      if (!area || area <= 0) {
        e.preventDefault();
        alert('Please enter a valid area');
        return;
      }
      
      if (!materialType) {
        e.preventDefault();
        alert('Please select a material type');
        return;
      }
    });
  }

  // Initialize 3D scene after DOM is ready
  init3DScene();

  if (typeof resultData === 'object' && resultData !== null) {
    setTimeout(() => renderResults(resultData), 100);
  } else {
    // Show empty preview on initial load
    setTimeout(() => {
      clearMaterials();
    }, 100);
  }
});

function update3DPreview() {
  const area = parseFloat(document.getElementById('area')?.value) || 0;
  const materialType = document.getElementById('materialType')?.value || '';
  const thickness = parseFloat(document.getElementById('thickness')?.value) || 4;

  if (!materialType || area <= 0) {
    clearMaterials();
    return;
  }

  // Calculate preview values
  let previewResult = {};
  const areaNum = area;

  if (materialType === 'cement') {
    previewResult.cement = (areaNum * 0.4).toFixed(2) + ' bags';
    previewResult.sand = (areaNum * 0.5).toFixed(2) + ' cubic ft';
  } else if (materialType === 'bricks') {
    previewResult.bricks = (areaNum * 500).toFixed(0) + ' bricks';
  } else if (materialType === 'concrete') {
    previewResult.concrete = (areaNum * 0.125 * thickness / 12).toFixed(2) + ' cubic ft';
    previewResult.cement = Math.ceil(areaNum * 0.15).toFixed(0) + ' bags';
    previewResult.sand = (areaNum * 0.25).toFixed(2) + ' cubic ft';
    previewResult.aggregate = (areaNum * 0.25).toFixed(2) + ' cubic ft';
  } else if (materialType === 'painting') {
    previewResult.paint = (areaNum * 0.015).toFixed(2) + ' liters';
  }

  renderResults(previewResult);
}

let scene, camera, renderer;
const materialMeshes = [];
let containerInitialized = false;

function init3DScene() {
  const container = document.getElementById('3d-container');
  if (!container) return;

  // If container is hidden, wait for it to become visible
  if (container.offsetParent === null) {
    const observer = new MutationObserver(() => {
      if (container.offsetParent !== null) {
        observer.disconnect();
        start3DScene();
      }
    });
    observer.observe(container, { attributes: true, attributeFilter: ['style'] });
    return;
  }

  start3DScene();
}

function start3DScene() {
  if (containerInitialized) return;
  containerInitialized = true;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f4f8);

  const container = document.getElementById('3d-container');
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
  camera.position.set(8, 6, 8);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
  scene.add(gridHelper);

  setupOrbitControls();
  animate();
}

function setupOrbitControls() {
  const container = document.getElementById('3d-container');
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let spherical = { radius: 12, theta: Math.PI / 4, phi: Math.PI / 3 };

  function updateCamera() {
    camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    camera.position.y = spherical.radius * Math.cos(spherical.phi);
    camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    camera.lookAt(0, 0, 0);
  }
  updateCamera();

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaMove = {
      x: e.clientX - previousMousePosition.x,
      y: e.clientY - previousMousePosition.y
    };
    spherical.theta -= deltaMove.x * 0.01;
    spherical.phi = Math.max(0.2, Math.min(Math.PI - 0.2, spherical.phi + deltaMove.y * 0.01));
    updateCamera();
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  container.addEventListener('mouseup', () => { isDragging = false; });
  container.addEventListener('mouseleave', () => { isDragging = false; });

  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    spherical.radius = Math.max(5, Math.min(30, spherical.radius + e.deltaY * 0.01));
    updateCamera();
  });

  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  });

  container.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaMove = {
      x: e.touches[0].clientX - previousMousePosition.x,
      y: e.touches[0].clientY - previousMousePosition.y
    };
    spherical.theta -= deltaMove.x * 0.01;
    spherical.phi = Math.max(0.2, Math.min(Math.PI - 0.2, spherical.phi + deltaMove.y * 0.01));
    updateCamera();
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  });

  container.addEventListener('touchend', () => { isDragging = false; });
}

function clearMaterials() {
  materialMeshes.forEach(mesh => scene && scene.remove(mesh));
  materialMeshes.length = 0;
}

function addBricks(count) {
  const brickGeometry = new THREE.BoxGeometry(0.9, 0.4, 0.4);
  const brickMaterial = new THREE.MeshLambertMaterial({ color: 0xb35a3a });
  const bricksPerRow = Math.ceil(Math.sqrt(count));
  const rowLength = 4;
  let countPlaced = 0;

  for (let row = 0; row < Math.ceil(count / bricksPerRow); row++) {
    const bricksInThisRow = Math.min(bricksPerRow, count - countPlaced);
    const offset = row % 2 === 0 ? 0 : 0.45;
    
    for (let col = 0; col < bricksInThisRow && countPlaced < count; col++) {
      const brick = new THREE.Mesh(brickGeometry, brickMaterial);
      brick.position.set(col * 1 - (bricksInThisRow * 0.5) + offset + 0.5, 0.2 + row * 0.4, 0);
      brick.castShadow = true;
      brick.receiveShadow = true;
      scene.add(brick);
      materialMeshes.push(brick);
      countPlaced++;
      if (countPlaced >= count) break;
    }
  }
}

function addCementBags(count) {
  const bagGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.3);
  const bagMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
  const perRow = Math.ceil(Math.sqrt(count));
  let countPlaced = 0;

  for (let row = 0; row < Math.ceil(count / perRow); row++) {
    const inThisRow = Math.min(perRow, count - countPlaced);
    for (let col = 0; col < inThisRow && countPlaced < count; col++) {
      const bag = new THREE.Mesh(bagGeometry, bagMaterial);
      bag.position.set(col * 0.7 - (inThisRow * 0.35), 0.2 + row * 0.45, 0);
      bag.castShadow = true;
      scene.add(bag);
      materialMeshes.push(bag);
      countPlaced++;
    }
  }
}

function addSandPile(volume) {
  const pileGeometry = new THREE.ConeGeometry(Math.sqrt(volume) * 0.8, Math.sqrt(volume) * 0.5, 8);
  const sandMaterial = new THREE.MeshLambertMaterial({ color: 0xe6d5a8 });
  const pile = new THREE.Mesh(pileGeometry, sandMaterial);
  pile.position.set(0, Math.sqrt(volume) * 0.25, 2);
  pile.castShadow = true;
  scene.add(pile);
  materialMeshes.push(pile);
}

function addConcreteBlock(volume) {
  const blockGeometry = new THREE.BoxGeometry(Math.cbrt(volume) * 1.5, Math.cbrt(volume), Math.cbrt(volume) * 1.5);
  const concreteMaterial = new THREE.MeshLambertMaterial({ color: 0x707070 });
  const block = new THREE.Mesh(blockGeometry, concreteMaterial);
  block.position.set(0, Math.cbrt(volume) * 0.5, 2);
  block.castShadow = true;
  block.receiveShadow = true;
  scene.add(block);
  materialMeshes.push(block);
}

function addPaintCans(count) {
  const canGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.35, 16);
  const canMaterial = new THREE.MeshLambertMaterial({ color: 0x3a86ff });
  const perRow = Math.ceil(Math.sqrt(count));
  let countPlaced = 0;

  for (let row = 0; row < Math.ceil(count / perRow); row++) {
    const inThisRow = Math.min(perRow, count - countPlaced);
    for (let col = 0; col < inThisRow && countPlaced < count; col++) {
      const can = new THREE.Mesh(canGeometry, canMaterial);
      can.position.set(col * 0.5 - (inThisRow * 0.25), 0.175 + row * 0.4, 2);
      can.castShadow = true;
      scene.add(can);
      materialMeshes.push(can);
      countPlaced++;
    }
  }
}

function renderResults(result) {
  clearMaterials();
  
  if (!result || result.error) return;

  if (result.bricks) {
    const brickCount = parseInt(result.bricks);
    addBricks(Math.min(brickCount, 200));
  }
  
  if (result.cement) {
    const bagCount = parseInt(result.cement);
    addCementBags(Math.min(bagCount, 50));
  }
  
  if (result.sand) {
    const sandVolume = parseFloat(result.sand);
    if (sandVolume > 0) addSandPile(Math.min(sandVolume, 20));
  }
  
  if (result.concrete) {
    const concreteVolume = parseFloat(result.concrete);
    if (concreteVolume > 0) addConcreteBlock(Math.min(concreteVolume, 10));
  }
  
  if (result.paint) {
    const paintLiters = parseFloat(result.paint);
    const canCount = Math.ceil(paintLiters / 5);
    addPaintCans(Math.min(canCount, 30));
  }

  // Trigger resize after rendering
  if (renderer && camera) {
    const container = document.getElementById('3d-container');
    if (container) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (renderer && scene && camera) renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  const container = document.getElementById('3d-container');
  if (container && renderer && container.offsetParent !== null) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
});
    
    form.addEventListener('submit', function(e) {
      const area = document.getElementById('area').value;
      const materialType = materialTypeSelect.value;
      
      if (!area || area <= 0) {
        e.preventDefault();
        alert('Please enter a valid area');
        return;
      }
      
      if (!materialType) {
        e.preventDefault();
        alert('Please select a material type');
        return;
      }
    });
  }

  // Initialize 3D scene after DOM is ready
  init3DScene();

  if (typeof resultData === 'object' && resultData !== null) {
    setTimeout(() => renderResults(resultData), 100);
  }
});

let scene, camera, renderer;
const materialMeshes = [];
let containerInitialized = false;

function init3DScene() {
  const container = document.getElementById('3d-container');
  if (!container) return;

  // If container is hidden, wait for it to become visible
  if (container.offsetParent === null) {
    const observer = new MutationObserver(() => {
      if (container.offsetParent !== null) {
        observer.disconnect();
        start3DScene();
      }
    });
    observer.observe(container, { attributes: true, attributeFilter: ['style'] });
    return;
  }

  start3DScene();
}

function start3DScene() {
  if (containerInitialized) return;
  containerInitialized = true;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f4f8);

  const container = document.getElementById('3d-container');
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
  camera.position.set(8, 6, 8);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
  scene.add(gridHelper);

  setupOrbitControls();
  animate();
}

function setupOrbitControls() {
  const container = document.getElementById('3d-container');
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let spherical = { radius: 12, theta: Math.PI / 4, phi: Math.PI / 3 };

  function updateCamera() {
    camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    camera.position.y = spherical.radius * Math.cos(spherical.phi);
    camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    camera.lookAt(0, 0, 0);
  }
  updateCamera();

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaMove = {
      x: e.clientX - previousMousePosition.x,
      y: e.clientY - previousMousePosition.y
    };
    spherical.theta -= deltaMove.x * 0.01;
    spherical.phi = Math.max(0.2, Math.min(Math.PI - 0.2, spherical.phi + deltaMove.y * 0.01));
    updateCamera();
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  container.addEventListener('mouseup', () => { isDragging = false; });
  container.addEventListener('mouseleave', () => { isDragging = false; });

  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    spherical.radius = Math.max(5, Math.min(30, spherical.radius + e.deltaY * 0.01));
    updateCamera();
  });

  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  });

  container.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaMove = {
      x: e.touches[0].clientX - previousMousePosition.x,
      y: e.touches[0].clientY - previousMousePosition.y
    };
    spherical.theta -= deltaMove.x * 0.01;
    spherical.phi = Math.max(0.2, Math.min(Math.PI - 0.2, spherical.phi + deltaMove.y * 0.01));
    updateCamera();
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  });

  container.addEventListener('touchend', () => { isDragging = false; });
}

function clearMaterials() {
  materialMeshes.forEach(mesh => scene && scene.remove(mesh));
  materialMeshes.length = 0;
}

function addBricks(count) {
  const brickGeometry = new THREE.BoxGeometry(0.9, 0.4, 0.4);
  const brickMaterial = new THREE.MeshLambertMaterial({ color: 0xb35a3a });
  const bricksPerRow = Math.ceil(Math.sqrt(count));
  const rowLength = 4;
  let countPlaced = 0;

  for (let row = 0; row < Math.ceil(count / bricksPerRow); row++) {
    const bricksInThisRow = Math.min(bricksPerRow, count - countPlaced);
    const offset = row % 2 === 0 ? 0 : 0.45;
    
    for (let col = 0; col < bricksInThisRow && countPlaced < count; col++) {
      const brick = new THREE.Mesh(brickGeometry, brickMaterial);
      brick.position.set(col * 1 - (bricksInThisRow * 0.5) + offset + 0.5, 0.2 + row * 0.4, 0);
      brick.castShadow = true;
      brick.receiveShadow = true;
      scene.add(brick);
      materialMeshes.push(brick);
      countPlaced++;
      if (countPlaced >= count) break;
    }
  }
}

function addCementBags(count) {
  const bagGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.3);
  const bagMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
  const perRow = Math.ceil(Math.sqrt(count));
  let countPlaced = 0;

  for (let row = 0; row < Math.ceil(count / perRow); row++) {
    const inThisRow = Math.min(perRow, count - countPlaced);
    for (let col = 0; col < inThisRow && countPlaced < count; col++) {
      const bag = new THREE.Mesh(bagGeometry, bagMaterial);
      bag.position.set(col * 0.7 - (inThisRow * 0.35), 0.2 + row * 0.45, 0);
      bag.castShadow = true;
      scene.add(bag);
      materialMeshes.push(bag);
      countPlaced++;
    }
  }
}

function addSandPile(volume) {
  const pileGeometry = new THREE.ConeGeometry(Math.sqrt(volume) * 0.8, Math.sqrt(volume) * 0.5, 8);
  const sandMaterial = new THREE.MeshLambertMaterial({ color: 0xe6d5a8 });
  const pile = new THREE.Mesh(pileGeometry, sandMaterial);
  pile.position.set(0, Math.sqrt(volume) * 0.25, 2);
  pile.castShadow = true;
  scene.add(pile);
  materialMeshes.push(pile);
}

function addConcreteBlock(volume) {
  const blockGeometry = new THREE.BoxGeometry(Math.cbrt(volume) * 1.5, Math.cbrt(volume), Math.cbrt(volume) * 1.5);
  const concreteMaterial = new THREE.MeshLambertMaterial({ color: 0x707070 });
  const block = new THREE.Mesh(blockGeometry, concreteMaterial);
  block.position.set(0, Math.cbrt(volume) * 0.5, 2);
  block.castShadow = true;
  block.receiveShadow = true;
  scene.add(block);
  materialMeshes.push(block);
}

function addPaintCans(count) {
  const canGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.35, 16);
  const canMaterial = new THREE.MeshLambertMaterial({ color: 0x3a86ff });
  const perRow = Math.ceil(Math.sqrt(count));
  let countPlaced = 0;

  for (let row = 0; row < Math.ceil(count / perRow); row++) {
    const inThisRow = Math.min(perRow, count - countPlaced);
    for (let col = 0; col < inThisRow && countPlaced < count; col++) {
      const can = new THREE.Mesh(canGeometry, canMaterial);
      can.position.set(col * 0.5 - (inThisRow * 0.25), 0.175 + row * 0.4, 2);
      can.castShadow = true;
      scene.add(can);
      materialMeshes.push(can);
      countPlaced++;
    }
  }
}

function renderResults(result) {
  clearMaterials();
  
  if (!result || result.error) return;

  if (result.bricks) {
    const brickCount = parseInt(result.bricks);
    addBricks(Math.min(brickCount, 200));
  }
  
  if (result.cement) {
    const bagCount = parseInt(result.cement);
    addCementBags(Math.min(bagCount, 50));
  }
  
  if (result.sand) {
    const sandVolume = parseFloat(result.sand);
    if (sandVolume > 0) addSandPile(Math.min(sandVolume, 20));
  }
  
  if (result.concrete) {
    const concreteVolume = parseFloat(result.concrete);
    if (concreteVolume > 0) addConcreteBlock(Math.min(concreteVolume, 10));
  }
  
  if (result.paint) {
    const paintLiters = parseFloat(result.paint);
    const canCount = Math.ceil(paintLiters / 5);
    addPaintCans(Math.min(canCount, 30));
  }

  // Trigger resize after rendering
  if (renderer && camera) {
    const container = document.getElementById('3d-container');
    if (container) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (renderer && scene && camera) renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  const container = document.getElementById('3d-container');
  if (container && renderer && container.offsetParent !== null) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
});