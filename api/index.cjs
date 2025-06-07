// Brain/api/index.js
// This file will act as the entry point for all backend API routes on Vercel.

// Adjust the path to correctly point to your Express app's main file
// The '../' goes up from 'api' to 'Brain', then into 'kana-backend'
const app = require('../kana-backend/index.cjs');

// Export the app for Vercel to use
module.exports = app
