// Authentication JavaScript for login and register pages

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});

async function handleLogin(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = document.getElementById('submitBtn');
  const result = document.getElementById('result');
  
  const formData = {
    email: form.email.value,
    password: form.password.value
  };
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showAuthResult(result, 'Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } else {
      showAuthResult(result, data.error, 'error');
    }
  } catch (error) {
    showAuthResult(result, 'Network error. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = document.getElementById('submitBtn');
  const result = document.getElementById('result');
  
  const formData = {
    email: form.email.value,
    password: form.password.value,
    companyName: form.companyName.value,
    website: form.website.value,
    address: form.address.value
  };
  
  // Basic validation
  if (formData.password.length < 6) {
    showAuthResult(result, 'Password must be at least 6 characters long.', 'error');
    return;
  }
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating Account...';
  
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      const successHTML = `
        <h4>🎉 Account Created Successfully!</h4>
        <p>Your ORC Issuer Code: <strong>${data.orcCode}</strong></p>
        <p>Redirecting to your dashboard...</p>
      `;
      showAuthResult(result, successHTML, 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } else {
      showAuthResult(result, data.error, 'error');
    }
  } catch (error) {
    showAuthResult(result, 'Network error. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account & Get ORC Code';
  }
}

function showAuthResult(element, message, type) {
  element.innerHTML = message;
  element.className = `result-display ${type}`;
  element.style.display = 'block';
}
