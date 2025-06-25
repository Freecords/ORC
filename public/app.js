// Main application JavaScript for homepage

// Validate ORC function
async function validateORC() {
  const input = document.getElementById('orcInput');
  const result = document.getElementById('validationResult');
  const orc = input.value.trim().toUpperCase();
  
  if (!orc) {
    showResult(result, 'Please enter an ORC code', 'error');
    return;
  }
  
  try {
    // First validate format
    const validateResponse = await fetch(`/api/validate/${orc}`);
    const validateData = await validateResponse.json();
    
    if (!validateData.valid) {
      showResult(result, `Invalid ORC: ${validateData.error}`, 'error');
      return;
    }
    
    // Then lookup details
    const lookupResponse = await fetch(`/api/lookup/${orc}`);
    
    if (lookupResponse.ok) {
      const lookupData = await lookupResponse.json();
      const resultHTML = `
        <h4>✅ Valid ORC Code</h4>
        <p><strong>Code:</strong> ${lookupData.orc}</p>
        <p><strong>Issuer:</strong> ${lookupData.issuer.name} (${lookupData.issuer.code})</p>
        <p><strong>Website:</strong> ${lookupData.issuer.website || 'Not provided'}</p>
        <p><strong>Status:</strong> ${lookupData.issuer.status}</p>
      `;
      showResult(result, resultHTML, 'success');
    } else {
      const errorData = await lookupResponse.json();
      showResult(result, `Lookup failed: ${errorData.error}`, 'error');
    }
  } catch (error) {
    showResult(result, 'Network error. Please try again.', 'error');
  }
}

// Show result function
function showResult(element, message, type) {
  element.innerHTML = message;
  element.className = `result-display ${type}`;
  element.style.display = 'block';
}

// Load registry function
async function loadRegistry() {
  const registryList = document.getElementById('registryList');
  
  try {
    const response = await fetch('/api/registry');
    const registry = await response.json();
    
    if (registry.length === 0) {
      registryList.innerHTML = '<p>No issuers registered yet.</p>';
      return;
    }
    
    const registryHTML = registry.map(issuer => `
      <div class="registry-item">
        <h4>${issuer.code} - ${issuer.name}</h4>
        <p><strong>Website:</strong> ${issuer.website || 'Not provided'}</p>
        <p><strong>Contact:</strong> ${issuer.contact}</p>
        <p><strong>Status:</strong> ${issuer.status}</p>
        <p><strong>Registered:</strong> ${new Date(issuer.created).toLocaleDateString()}</p>
      </div>
    `).join('');
    
    registryList.innerHTML = registryHTML;
  } catch (error) {
    registryList.innerHTML = '<p>Error loading registry. Please try again later.</p>';
  }
}

// Allow Enter key to submit validation
document.addEventListener('DOMContentLoaded', function() {
  const orcInput = document.getElementById('orcInput');
  if (orcInput) {
    orcInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        validateORC();
      }
    });
  }
  
  // Load registry on page load
  loadRegistry();
});
