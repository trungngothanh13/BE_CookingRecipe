const express = require('express');
const cors = require('cors');

/**
 * Configure and return Express middleware
 * @param {Express} app - Express application instance
 */
function setupMiddleware(app) {
  // CORS configuration
  app.use(cors({
    origin: '*',  // Allow all origins (for testing only!)
    credentials: true
  }));

  // Body parser middleware
  app.use(express.json({ limit: '10mb' })); // Image upload limit
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
}

module.exports = setupMiddleware;

