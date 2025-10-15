#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('🔧 Setting up local JSON database...');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Created data directory');
}

// Initialize JSON database
const dbPath = path.join(dataDir, 'fmea-data.json');
if (fs.existsSync(dbPath)) {
  console.log('📊 Database already exists at:', dbPath);
} else {
  const initialData = {
    users: [],
    sessions: [],
    projects: [],
    assets: [],
    failureModes: [],
    causes: [],
    effects: [],
    controls: [],
    actions: []
  };
  fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
  console.log('📊 Created JSON database at:', dbPath);
}

// Create default admin user
try {
  const bcrypt = require('bcryptjs');
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  const existingAdmin = data.users.find(user => user.email === 'admin@fmea.local');
  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync('admin123', 12);
    data.users.push({
      id: 'admin-' + Date.now(),
      email: 'admin@fmea.local',
      name: 'Admin User',
      password_hash: passwordHash,
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    console.log('👤 Created default admin user');
  } else {
    console.log('👤 Default admin user already exists');
  }
} catch (error) {
  console.log('⚠️ Could not create default user (will be created on first run)');
}

console.log('✅ Database setup complete!');
console.log('');
console.log('Next steps:');
console.log('1. Copy .env.local.example to .env.local');
console.log('2. Add your Anthropic API key to .env.local');
console.log('3. Run: npm run dev');
console.log('4. Visit: http://localhost:3030');
console.log('');
console.log('Default login credentials:');
console.log('Email: admin@fmea.local');
console.log('Password: admin123');