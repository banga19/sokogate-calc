// Initialize conditionally - check if elements exist before attaching
document.addEventListener('DOMContentLoaded', function() {
  const materialTypeSelect = document.getElementById('materialType');
  
  if (!materialTypeSelect) return;

  const thicknessGroup = document.getElementById('thicknessGroup');
  const tileSizeGroup = document.getElementById('tileSizeGroup');
  const form = document.getElementById('calcForm');
  const submitBtn = document.querySelector('.btn');
  const originalBtnText = submitBtn ? submitBtn.textContent : 'Calculate Materials';

  // Room dimension inputs (main calculator)
  const roomWidthInput = document.getElementById('roomWidth');
  const roomLengthInput = document.getElementById('roomLength');
  const roomHeightInput = document.getElementById('roomHeight');
  const areaInput = document.getElementById('area');

  // Toggle conditional fields based on material selection
  materialTypeSelect.addEventListener('change', function() {
    const selectedValue = this.value;

    // Hide all conditional groups first
    if (thicknessGroup) thicknessGroup.style.display = 'none';
    if (tileSizeGroup) tileSizeGroup.style.display = 'none';
    const roomDimensions = document.getElementById('roomDimensions');
    if (roomDimensions) roomDimensions.style.display = 'none';

    // Show relevant field
    if (selectedValue === 'concrete' || selectedValue === 'steel') {
      if (thicknessGroup) {
        thicknessGroup.style.display = 'block';
        thicknessGroup.style.animation = 'slideDown 0.3s ease-out';
      }
    } else if (selectedValue === 'tiles') {
      if (tileSizeGroup) {
        tileSizeGroup.style.display = 'block';
        tileSizeGroup.style.animation = 'slideDown 0.3s ease-out';
      }
    } else if (selectedValue === 'painting') {
      if (roomDimensions) {
        roomDimensions.style.display = 'block';
      }
    }
  });

  // Auto-calculate area from room dimensions
  function updateAreaFromDimensions() {
    const width = parseFloat(roomWidthInput?.value) || 0;
    const length = parseFloat(roomLengthInput?.value) || 0;
    if (width > 0 && length > 0 && areaInput) {
      areaInput.value = (width * length).toFixed(2);
    }
  }

  if (roomWidthInput) {
    roomWidthInput.addEventListener('input', updateAreaFromDimensions);
  }
  if (roomLengthInput) {
    roomLengthInput.addEventListener('input', updateAreaFromDimensions);
  }

  // Form submission with validation and loading state
  if (form) {
    form.addEventListener('submit', function(e) {
      const area = document.getElementById('area')?.value;
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
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Calculating...';
        submitBtn.style.opacity = '0.7';
      }
    });
  }

  // Helper: Show inline error message
  function showError(message) {
    // Remove existing error
    const existingError = document.querySelector('.form-error');
    if (existingError) existingError.remove();

    if (!form) return;

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

// Add CSS animations dynamically
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      max-height: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      max-height: 150px;
      transform: translateY(0);
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  .result-item {
    animation: fadeInRow 0.3s ease-out forwards;
    opacity: 0;
  }

  .result-item:nth-child(1) { animation-delay: 0.1s; }
  .result-item:nth-child(2) { animation-delay: 0.15s; }
  .result-item:nth-child(3) { animation-delay: 0.2s; }
  .result-item:nth-child(4) { animation-delay: 0.25s; }
  .result-item:nth-child(5) { animation-delay: 0.3s; }
  .result-item:nth-child(6) { animation-delay: 0.35s; }

  @keyframes fadeInRow {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .result-summary {
    text-align: center;
    margin-bottom: 20px;
  }

  .material-type-badge {
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .field-hint {
    display: block;
    margin-top: 6px;
    color: #64748b;
    font-size: 12px;
    font-style: italic;
  }

  optgroup {
    font-weight: 600;
    color: #374151;
    background: #f3f4f6;
  }

  optgroup option {
    font-weight: 400;
    color: #1f2937;
    padding-left: 12px;
  }


`;
document.head.appendChild(styleSheet);

// Robust message event handling to prevent spam
(function() {
  if (typeof window === 'undefined') return;
  
  const messageHandler = function(event) {
    try {
      // Only process relevant messages
      if (!event.data || typeof event.data !== 'object') return;
      
      // Debounce: prevent duplicate rapid messages
      if (messageHandler.lastEvent && 
          messageHandler.lastEvent.data === event.data &&
          Date.now() - messageHandler.lastTime < 100) {
        return;
      }
      messageHandler.lastEvent = event;
      messageHandler.lastTime = Date.now();
      
      // Handle expected message types only
      if (event.data.type === 'CALCULATION_RESULT' || event.data.type === 'FORM_UPDATE') {
        // Process specific message types
        console.debug('Handled message:', event.data.type);
      }
    } catch (err) {
      // Silently ignore message handler errors
    }
  };
  
  // Add listener with proper error handling
  window.addEventListener('message', messageHandler);
})();
