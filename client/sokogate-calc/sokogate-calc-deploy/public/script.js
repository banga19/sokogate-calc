document.addEventListener('DOMContentLoaded', function() {
  const materialTypeSelect = document.getElementById('materialType');
  const thicknessGroup = document.getElementById('thicknessGroup');
  const tileSizeGroup = document.getElementById('tileSizeGroup');
  const form = document.getElementById('calcForm');
  const submitBtn = document.getElementById('calcSubmitBtn');

  // Room dimension inputs (main calculator)
  const roomWidthInput = document.getElementById('roomWidth');
  const roomLengthInput = document.getElementById('roomLength');
  const roomHeightInput = document.getElementById('roomHeight');
  const areaInput = document.getElementById('area');

  // Toggle conditional fields based on material selection
  materialTypeSelect.addEventListener('change', function() {
    const selectedValue = this.value;

    // Hide all conditional groups first
    thicknessGroup.style.display = 'none';
    tileSizeGroup.style.display = 'none';

    // Show relevant field
    if (selectedValue === 'concrete' || selectedValue === 'steel') {
      thicknessGroup.style.display = 'block';
      thicknessGroup.style.animation = 'slideDown 0.3s ease-out';
    } else if (selectedValue === 'tiles') {
      tileSizeGroup.style.display = 'block';
      tileSizeGroup.style.animation = 'slideDown 0.3s ease-out';
    }
  });

  // Auto-calculate area from room dimensions
  function updateAreaFromDimensions() {
    const width = parseFloat(roomWidthInput?.value) || 0;
    const length = parseFloat(roomLengthInput?.value) || 0;
    if (width > 0 && length > 0) {
      areaInput.value = (width * length).toFixed(2);
    }
    if (typeof update3DPreview === 'function') {
      update3DPreview();
    }
  }

  if (roomWidthInput) {
    roomWidthInput.addEventListener('input', updateAreaFromDimensions);
  }
  if (roomLengthInput) {
    roomLengthInput.addEventListener('input', updateAreaFromDimensions);
  }
  if (roomHeightInput) {
    roomHeightInput.addEventListener('input', function() {
      if (typeof update3DPreview === 'function') {
        update3DPreview();
      }
    });
  }

  // Form submission with validation and loading state
  form.addEventListener('submit', function(e) {
    const area = document.getElementById('area').value;
    const materialType = materialTypeSelect.value;

    if (!area || area <= 0) {
      e.preventDefault();
      showError('Please enter a valid area (greater than 0)');
      return;
    }

    if (!materialType) {
      e.preventDefault();
      showError('Please select a material type');
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span> Calculating...';
    submitBtn.style.opacity = '0.7';
  });

  // Initialize 3D preview scene
  if (typeof init3DScene === 'function') {
    init3DScene();
  }

  // Render results with staggered animation
  if (typeof resultData === 'object' && resultData !== null && !resultData.error) {
    setTimeout(() => {
      if (typeof renderResults === 'function') {
        renderResults(resultData);
      }
    }, 100);
  }

  // ============================
  // 3D ROOM VISUALIZER FORM
  // ============================
  const roomForm = document.getElementById('roomForm');
  const roomResults = document.getElementById('room-results');
  const roomBtn = roomForm ? roomForm.querySelector('.btn') : null;

  if (roomForm) {
    roomForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const formData = new FormData(roomForm);
      const data = {
        height: formData.get('height'),
        width: formData.get('width'),
        length: formData.get('length'),
        unit: formData.get('unit')
      };

      if (roomBtn) {
        roomBtn.disabled = true;
        roomBtn.textContent = 'Calculating...';
      }

      try {
        const response = await fetch(window.APP_BASE_PATH + '/api/calculate-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
          displayRoomResults(result);
          if (typeof updateRoom3D === 'function') {
            updateRoom3D(result.dimensions, result.unit);
          }
        } else {
          showRoomError(result.error || 'Invalid input. Please check your dimensions.');
        }
      } catch (error) {
        console.error('Room calculation error:', error);
        showRoomError('Failed to calculate. Please try again.');
      } finally {
        roomBtn.disabled = false;
        roomBtn.textContent = 'Visualize Room';
      }
    });
  }

function displayRoomResults(result) {
    roomResults.innerHTML = `
      <section class="results">
        <h3>Room Materials</h3>
        <div class="result-item">
          <span class="label">Floor Area</span>
          <span class="value">${result.materials.floorArea}</span>
        </div>
        <div class="result-item">
          <span class="label">Total Wall Area</span>
          <span class="value">${result.materials.totalWallArea}</span>
        </div>
        <div class="result-item">
          <span class="label">Ceiling Area</span>
          <span class="value">${result.materials.ceilingArea}</span>
        </div>
        <div class="result-item">
          <span class="label">Paint Needed</span>
          <span class="value">${result.materials.paintNeeded}</span>
        </div>
        <div class="result-item">
          <span class="label">Tile Area</span>
          <span class="value">${result.materials.tileArea}</span>
        </div>
      </section>
    `;
    document.getElementById('3d-room-container').style.display = 'block';
  }

function showRoomError(message) {
    roomResults.innerHTML = `
      <div class="error">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="10" cy="10" r="8"/>
          <line x1="10" y1="6" x2="10" y2="14"/>
          <line x1="10" y1="14" x2="14" y2="10"/>
        </svg>
        <span>${message}</span>
      </div>
    `;
    document.getElementById('3d-room-container').style.display = 'none';
  }

  // Initialize room 3D scene
  if (typeof initRoom3D === 'function') {
    initRoom3D('3d-room-container');
  }

  // Helper: Show inline error message
  function showError(message) {
    // Remove existing error
    const existingError = document.querySelector('.form-error');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle; margin-right: 8px;">
        <circle cx="10" cy="10" r="8"/>
        <line x1="10" y1="6" x2="10" y2="14"/>
        <line x1="10" y1="14" x2="14" y2="10"/>
      </svg>
      <span>${message}</span>
    `;
    errorDiv.style.cssText = `
      color: #ef4444;
      padding: 14px;
      margin-bottom: 20px;
      background: #fef2f2;
      border-radius: 8px;
      font-size: 14px;
      display: flex;
      align-items: center;
      border: 1px solid #fecaca;
      animation: shake 0.4s ease-in-out;
    `;

    form.insertBefore(errorDiv, form.firstChild);

    setTimeout(() => {
      errorDiv.remove();
    }, 4000);
  }
});
