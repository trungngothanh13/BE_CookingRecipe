
// server.js - Fixed version
const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Recipe API',
      version: '1.0.0',
      description: 'A simple recipe management API for testing Swagger',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors({
  origin: [] // Fill in allowed origins
}));
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint (put this BEFORE importing routes to test basic server)
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Test if basic server works first
console.log('Setting up routes...');

// Import and use routes
try {
  const recipeRoutes = require('./src/routes/recipes');
  console.log('Recipe routes imported successfully');
  
  // Check if recipeRoutes is actually a router
  if (typeof recipeRoutes === 'function') {
    app.use('/api/recipes', recipeRoutes);
    console.log('Recipe routes configured successfully');
  } else {
    console.error('Recipe routes is not a function:', typeof recipeRoutes);
  }
} catch (error) {
  console.error('Error importing recipe routes:', error);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});