// set-env.js
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local from project root
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
  console.log('✅ Loaded environment variables from .env.local');
} else {
  console.warn('⚠️ .env.local not found, no environment variables loaded');
}
