const express = require('express');
const fs = require('fs');
const setupMiddleware = require('./middleware');
const swaggerSpec = require('./swagger');
const swaggerUi = require('swagger-ui-express');
const mainRouter = require('../route');
const errorHandler = require('../middlewares/errorHandler');

/**
 * Create and configure Express application
 * @returns {Express} Configured Express app
 */
function createApp() {
  const app = express();

  // Create temp directory for file uploads if it doesn't exist
  if (!fs.existsSync('temp')) {
    fs.mkdirSync('temp');
  }

  // Setup middleware (CORS, body parsers, etc.)
  setupMiddleware(app);

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      message: 'Server is running!',
      timestamp: new Date().toISOString()
    });
  });

  // API routes
  try {
    app.use('/api', mainRouter);
    console.log('Routes configured successfully');
  } catch (error) {
    console.error('Error importing routes:', error);
  }

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

module.exports = createApp;

