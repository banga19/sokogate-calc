document.addEventListener('DOMContentLoaded', function() {
  const materialTypeSelect = document.getElementById('materialType');
  const thicknessGroup = document.getElementById('thicknessGroup');
  const form = document.getElementById('calcForm');
  
  materialTypeSelect.addEventListener('change', function() {
    const selectedValue = this.value;
    
    if (selectedValue === 'concrete') {
      thicknessGroup.style.display = 'block';
    } else {
      thicknessGroup.style.display = 'none';
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

  init3DScene();

  if (typeof resultData === 'object' && resultData !== null) {
    setTimeout(() => renderResults(resultData), 100);
  }
});