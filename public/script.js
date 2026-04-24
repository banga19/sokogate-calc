document.addEventListener('DOMContentLoaded', function() {
  const materialTypeSelect = document.getElementById('materialType');
  const thicknessGroup = document.getElementById('thicknessGroup');
  const form = document.getElementById('calcForm');
  const submitBtn = document.querySelector('.btn');
  const originalBtnText = submitBtn.textContent;

  // Toggle thickness field based on material selection
  materialTypeSelect.addEventListener('change', function() {
    const selectedValue = this.value;
    
    if (selectedValue === 'concrete') {
      thicknessGroup.style.display = 'block';
      thicknessGroup.style.animation = 'slideDown 0.3s ease-out';
    } else {
      thicknessGroup.style.display = 'none';
    }
  });

  // Form submission with loading state
  form.addEventListener('submit', function(e) {
    const area = document.getElementById('area').value;
    const materialType = materialTypeSelect.value;

    if (!area || area <= 0) {
      e.preventDefault();
      showError('Please enter a valid area');
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

  // Render results with animation if data exists
  if (typeof resultData === 'object' && resultData !== null) {
    setTimeout(() => renderResults(resultData), 100);
  }

  // Helper: Show inline error message
  function showError(message) {
    // Remove existing error
    const existingError = document.querySelector('.form-error');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      color: #ef4444;
      padding: 12px;
      margin-bottom: 20px;
      background: #fef2f2;
      border-radius: 8px;
      font-size: 14px;
      text-align: center;
      border: 1px solid #fecaca;
      animation: shake 0.4s ease-in-out;
    `;

    form.insertBefore(errorDiv, form.firstChild);

    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
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
      max-height: 100px;
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
  .result-item:nth-child(2) { animation-delay: 0.2s; }
  .result-item:nth-child(3) { animation-delay: 0.3s; }
  .result-item:nth-child(4) { animation-delay: 0.4s; }
  .result-item:nth-child(5) { animation-delay: 0.5s; }

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
`;
document.head.appendChild(styleSheet);
