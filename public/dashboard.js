// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
  loadUserData();
});

async function loadUserData() {
  const userInfo = document.getElementById('userInfo');
  const orcCode = document.getElementById('orcCode');
  const userOrcFormat = document.getElementById('userOrcFormat');
  
  try {
    const response = await fetch('/api/user');
    
    if (!response.ok) {
      // Not authenticated, redirect to login
      window.location.href = '/login';
      return;
    }
    
    const user = await response.json();
    
    // Update user info
    userInfo.innerHTML = `
      <h3>Welcome, ${user.companyName}!</h3>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Website:</strong> ${user.website || 'Not provided'}</p>
      <p><strong>Address:</strong> ${user.address || 'Not provided'}</p>
      <p><strong>Account Created:</strong> ${new Date(user.created).toLocaleDateString()}</p>
    `;
    
    // Update ORC code display
    orcCode.textContent = user.orcCode;
    
    // Update format display
    const currentYear = new Date().getFullYear();
    userOrcFormat.innerHTML = `<code>${user.orcCode}-${currentYear}-NNNNNN-XXX</code>`;
    
  } catch (error) {
    userInfo.innerHTML = '<p>Error loading user data. Please try refreshing the page.</p>';
  }
}

async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
    // Force redirect anyway
    window.location.href = '/';
  }
}

function generateSampleORC() {
  const sampleOrcDiv = document.getElementById('sampleORC');
  const orcCodeElement = document.getElementById('orcCode');
  
  if (!orcCodeElement.textContent || orcCodeElement.textContent === 'Loading...') {
    sampleOrcDiv.innerHTML = '<p style="color: var(--error-color);">Please wait for your ORC code to load.</p>';
    return;
  }
  
  const issuerCode = orcCodeElement.textContent;
  const year = new Date().getFullYear();
  const trackNumber = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  const suffix = generateRandomSuffix();
  
  const sampleORC = `${issuerCode}-${year}-${trackNumber}-${suffix}`;
  
  sampleOrcDiv.innerHTML = `
    <p><strong>Sample ORC:</strong></p>
    <div style="font-family: 'Courier New', monospace; font-weight: 600; font-size: 1.1rem; color: var(--primary-color); margin: 0.5rem 0;">
      ${sampleORC}
    </div>
    <p style="font-size: 0.9rem; color: var(--text-light);">
      This is how your ORC codes will look. Use this format when generating codes for your recordings.
    </p>
  `;
}

function generateRandomSuffix() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return suffix;
}
