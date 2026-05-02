// Enhanced mobile-friendly form interactions
document.addEventListener('DOMContentLoaded', function() {
  const materialTypeSelect = document.getElementById('materialType');
  
  if (!materialTypeSelect) return;

  const thicknessGroup = document.getElementById('thicknessGroup');
  const tileSizeGroup = document.getElementById('tileSizeGroup');
  const roomDimensions = document.getElementById('roomDimensions');
  const form = document.getElementById('calcForm');
  const submitBtn = document.getElementById('submitBtn');
  const originalBtnText = submitBtn ? submitBtn.textContent.trim() : 'Calculate Materials';

  // Room dimension inputs (main calculator)
  const roomWidthInput = document.getElementById('roomWidth');
  const roomLengthInput = document.getElementById('roomLength');
  const roomHeightInput = document.getElementById('roomHeight');
  const areaInput = document.getElementById('area');

  // Toggle conditional fields based on material selection
  function toggleConditionalFields(selectedValue) {
    // Hide all conditional groups first with smooth animation
    if (thicknessGroup) {
      thicknessGroup.style.display = 'none';
      thicknessGroup.setAttribute('aria-hidden', 'true');
    }
    if (tileSizeGroup) {
      tileSizeGroup.style.display = 'none';
      tileSizeGroup.setAttribute('aria-hidden', 'true');
    }
    if (roomDimensions) {
      roomDimensions.style.display = 'none';
      roomDimensions.setAttribute('aria-hidden', 'true');
    }

    // Show relevant field with animation
    let visibleField = null;
    if (selectedValue === 'concrete' || selectedValue === 'steel') {
      visibleField = thicknessGroup;
    } else if (selectedValue === 'tiles') {
      visibleField = tileSizeGroup;
    } else if (selectedValue === 'painting') {
      visibleField = roomDimensions;
    }

    if (visibleField) {
      visibleField.style.display = 'block';
      visibleField.setAttribute('aria-hidden', 'false');
      // Focus on first input in visible field for better keyboard navigation
      setTimeout(() => {
        const firstInput = visibleField.querySelector('input, select');
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }

  // Hook up material type change listener
  materialTypeSelect.addEventListener('change', function() {
    toggleConditionalFields(this.value);
    
    // Log analytics placeholder
    // console.log('Material type selected:', this.value);
  });

  // Auto-calculate area from room dimensions
  function updateAreaFromDimensions() {
    const width = parseFloat(roomWidthInput?.value) || 0;
    const length = parseFloat(roomLengthInput?.value) || 0;
    if (width > 0 && length > 0 && areaInput) {
      areaInput.value = (width * length).toFixed(2);
      // Update aria-live for screen readers
      announceToScreenReader(`Area calculated: ${(width * length).toFixed(2)} square feet`);
    }
  }

  if (roomWidthInput) {
    roomWidthInput.addEventListener('input', updateAreaFromDimensions);
    roomWidthInput.addEventListener('change', updateAreaFromDimensions);
  }
  if (roomLengthInput) {
    roomLengthInput.addEventListener('input', updateAreaFromDimensions);
    roomLengthInput.addEventListener('change', updateAreaFromDimensions);
  }

  // Form submission with validation and loading state
  if (form) {
    form.addEventListener('submit', function(e) {
      const area = document.getElementById('area')?.value;
      const materialType = materialTypeSelect.value;

      // Clear any existing errors
      const existingError = document.querySelector('.form-error');
      if (existingError) existingError.remove();

      let errors = [];

      if (!area || parseFloat(area) <= 0) {
        errors.push('Please enter a valid area (greater than 0)');
      }

      if (!materialType) {
        errors.push('Please select a material type');
      }

      // Material-specific validation
      if (materialType === 'concrete' || materialType === 'steel') {
        const thickness = parseFloat(document.getElementById('thickness')?.value);
        if (!thickness || thickness <= 0) {
          errors.push('Please enter a valid thickness');
        }
      }

      if (materialType === 'tiles') {
        const tileSize = parseFloat(document.getElementById('tileSize')?.value);
        if (!tileSize || tileSize <= 0) {
          errors.push('Please select a tile size');
        }
      }

      if (errors.length > 0) {
        e.preventDefault();
        showError(errors.join('. '));
        // Focus on first invalid field for accessibility
        const firstErrorField = document.querySelector('.form-input:not([aria-invalid="false"])');
        if (firstErrorField) firstErrorField.focus();
        return false;
      }

      // Show loading state
      if (submitBtn) {
        submitBtn.classList.add('loading');
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.disabled = true;
      }
    });
  }

  // Helper: Show inline error message with improved accessibility
  function showError(message) {
    // Remove existing error
    const existingError = document.querySelector('.form-error[role="alert"]');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    errorDiv.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
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
      font-weight: 500;
      display: flex;
      align-items: center;
      border: 1px solid #fecaca;
      animation: shake 0.4s ease-in-out;
    `;

    form.insertBefore(errorDiv, form.firstChild);
    announceToScreenReader(message);

    // Auto-dismiss after 8 seconds on desktop, longer on mobile for usability
    const autoDismissMs = window.innerWidth < 768 ? 10000 : 8000;
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, autoDismissMs);
  }

  // Announce messages to screen readers
  function announceToScreenReader(message) {
    const announcer = document.getElementById('sr-announcer');
    if (announcer) {
      announcer.textContent = message;
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }

  // Create hidden screen reader announcer if not exists
  if (!document.getElementById('sr-announcer')) {
    const announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = 'position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;';
    document.body.appendChild(announcer);
  }

  // Keyboard shortcuts for power users
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      form?.requestSubmit();
    }
    
    // Escape to clear form
    if (e.key === 'Escape' && document.activeElement === form) {
      e.preventDefault();
      const confirmClear = window.confirm('Clear all form fields?');
      if (confirmClear) {
        form.reset();
        // Hide conditional fields
        if (thicknessGroup) thicknessGroup.style.display = 'none';
        if (tileSizeGroup) tileSizeGroup.style.display = 'none';
        if (roomDimensions) roomDimensions.style.display = 'none';
        announceToScreenReader('Form cleared');
      }
    }
  });

  // Mobile touch feedback - add tactile visual response
  if ('ontouchstart' in window) {
    document.querySelectorAll('.btn, .form-input, .form-select, .result-card').forEach(el => {
      el.addEventListener('touchstart', function() {
        this.style.opacity = '0.8';
      });
      el.addEventListener('touchend', function() {
        setTimeout(() => {
          this.style.opacity = '1';
        }, 100);
      });
    });
  }

  // Smooth scroll to results when submitted (for single page feel)
  const originalAction = form.action;
  form.addEventListener('submit', function(e) {
    // Already handled above for validation, just add smooth scroll
    setTimeout(() => {
      const resultsSection = document.querySelector('[role="region"][aria-label="Calculation Results"]');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        resultsSection.setAttribute('tabindex', '-1');
        resultsSection.focus({ preventScroll: true });
      }
    }, 300);
  });

  // Enhanced result card keyboard navigation
  document.querySelectorAll('.result-card[tabindex="0"]').forEach(card => {
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });
});
