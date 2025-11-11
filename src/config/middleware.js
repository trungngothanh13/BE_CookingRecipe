const express = require('express');
const cors = require('cors');

/**
 * Configure and return Express middleware
 * @param {Express} app - Express application instance
 */
function setupMiddleware(app) {
  // CORS configuration - Allow all origins for now
  app.use(cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Body parser middleware
  app.use(express.json({ limit: '10mb' })); // Image upload limit
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
}

module.exports = setupMiddleware;

