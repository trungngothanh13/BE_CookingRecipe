const express = require('express');
const cors = require('cors');

/**
 * Configure and return Express middleware
 * @param {Express} app - Express application instance
 */
function setupMiddleware(app) {
  // CORS configuration
  // Allow specific origins - cannot use '*' with credentials: true
  const allowedOrigins = [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // Alternative local dev
    'https://fe-cooking-recipe.vercel.app', // Production frontend on Vercel
    process.env.FRONTEND_URL // Allow custom frontend URL from env
  ].filter(Boolean); // Remove undefined values

  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else if (process.env.NODE_ENV !== 'production') {
        // In development, allow all origins for easier testing
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  }));

  // Body parser middleware
  app.use(express.json({ limit: '10mb' })); // Image upload limit
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
}

module.exports = setupMiddleware;

