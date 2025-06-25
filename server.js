const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'orc-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Data storage files
const USERS_FILE = './data/users.json';
const REGISTRY_FILE = './data/registry.json';

// Ensure data directory exists
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}

// Initialize data files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(REGISTRY_FILE)) {
  // Initialize with Freecords entry
  const initialRegistry = [{
    code: "FRC",
    name: "Freecords B.V.",
    website: "www.freecords.com",
    contact: "info@freecords.com",
    address: "Herengracht 420, 1017 BZ Amsterdam Netherlands",
    status: "active",
    created: new Date().toISOString()
  }];
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(initialRegistry, null, 2));
}

// Helper functions
function loadUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function loadRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
}

function saveRegistry(registry) {
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2));
}

// Smart ORC code generation
function generateORCCode(companyName) {
  // Remove common business suffixes and clean the name
  const cleanName = companyName
    .replace(/\b(B\.V\.|BV|LLC|Inc\.?|Corp\.?|Ltd\.?|Limited|Company|Co\.?)\b/gi, '')
    .replace(/[^a-zA-Z\s]/g, '')
    .trim();

  // Split into words and get meaningful parts
  const words = cleanName.split(/\s+/).filter(word => word.length > 0);
  
  let code = '';
  
  if (words.length === 1) {
    // Single word: take first 3 consonants/letters
    const word = words[0].toUpperCase();
    const consonants = word.replace(/[AEIOU]/g, '');
    if (consonants.length >= 3) {
      code = consonants.substring(0, 3);
    } else {
      code = word.substring(0, 3);
    }
  } else {
    // Multiple words: take first letter of each word, then fill
    for (let word of words) {
      if (code.length < 3) {
        code += word[0].toUpperCase();
      }
    }
    
    // If still less than 3, add more letters from first word
    if (code.length < 3) {
      const firstWord = words[0].toUpperCase();
      for (let i = 1; i < firstWord.length && code.length < 3; i++) {
        if (!code.includes(firstWord[i])) {
          code += firstWord[i];
        }
      }
    }
  }
  
  // Ensure exactly 3 characters
  code = code.substring(0, 3).padEnd(3, 'X');
  
  return code;
}

function findAvailableCode(baseCode) {
  const registry = loadRegistry();
  const existingCodes = registry.map(entry => entry.code);
  
  if (!existingCodes.includes(baseCode)) {
    return baseCode;
  }
  
  // Try with numbers
  for (let i = 1; i <= 999; i++) {
    const codeWithNumber = baseCode.substring(0, 2) + i;
    if (!existingCodes.includes(codeWithNumber)) {
      return codeWithNumber;
    }
  }
  
  // Fallback to completely random
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  do {
    let randomCode = '';
    for (let i = 0; i < 3; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!existingCodes.includes(randomCode)) {
      return randomCode;
    }
  } while (true);
}

// ORC validation
function validateORC(orc) {
  const regex = /^[A-Z0-9]{3,4}-\d{4}-\d{6}-[A-Z0-9]{3}$/;
  if (!regex.test(orc)) {
    return { valid: false, error: 'Invalid ORC format' };
  }
  
  const parts = orc.split('-');
  const year = parseInt(parts[1]);
  const currentYear = new Date().getFullYear();
  
  if (year < 1970 || year > 2099) {
    return { valid: false, error: 'Invalid year' };
  }
  
  const registry = loadRegistry();
  const issuerExists = registry.some(entry => entry.code === parts[0]);
  
  if (!issuerExists) {
    return { valid: false, error: 'Unknown issuer code' };
  }
  
  return { valid: true };
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// API Routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, companyName, website, address } = req.body;
    
    if (!email || !password || !companyName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const users = loadUsers();
    
    // Check if user already exists
    if (users.find(user => user.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Generate ORC code
    const baseCode = generateORCCode(companyName);
    const orcCode = findAvailableCode(baseCode);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      companyName,
      website: website || '',
      address: address || '',
      orcCode,
      created: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // Add to registry
    const registry = loadRegistry();
    registry.push({
      code: orcCode,
      name: companyName,
      website: website || '',
      contact: email,
      address: address || '',
      status: 'active',
      created: new Date().toISOString()
    });
    saveRegistry(registry);
    
    // Log user in
    req.session.userId = newUser.id;
    
    res.json({ success: true, orcCode });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    req.session.userId = user.id;
    res.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/user', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const users = loadUsers();
  const user = users.find(u => u.id === req.session.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Return user data without password
  const { password, ...userData } = user;
  res.json(userData);
});

// Public API endpoints
app.get('/api/lookup/:orc', (req, res) => {
  const orc = req.params.orc.toUpperCase();
  const validation = validateORC(orc);
  
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  
  const parts = orc.split('-');
  const issuerCode = parts[0];
  
  const registry = loadRegistry();
  const issuer = registry.find(entry => entry.code === issuerCode);
  
  if (!issuer) {
    return res.status(404).json({ error: 'Issuer not found' });
  }
  
  res.json({
    orc,
    issuer: {
      code: issuer.code,
      name: issuer.name,
      website: issuer.website,
      status: issuer.status
    },
    valid: true
  });
});

app.get('/api/validate/:orc', (req, res) => {
  const orc = req.params.orc.toUpperCase();
  const validation = validateORC(orc);
  res.json(validation);
});

app.get('/api/registry', (req, res) => {
  const registry = loadRegistry();
  res.json(registry);
});

// Start server
app.listen(PORT, () => {
  console.log(`ORC System running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});

module.exports = app;
