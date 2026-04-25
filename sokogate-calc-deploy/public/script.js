document.addEventListener('DOMContentLoaded', function() {
  const materialTypeSelect = document.getElementById('materialType');
  const thicknessGroup = document.getElementById('thicknessGroup');
  const tileSizeGroup = document.getElementById('tileSizeGroup');
  const form = document.getElementById('calcForm');
  const submitBtn = document.querySelector('.btn');
  const originalBtnText = submitBtn.textContent;

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
    submitBtn.textContent = 'Calculating...';
    submitBtn.style.opacity = '0.7';
  });

  // Initialize 3D scene
  init3DScene();

  // Render results with staggered animation
  if (typeof resultData === 'object' && resultData !== null && !resultData.error) {
    setTimeout(() => renderResults(resultData), 100);
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
