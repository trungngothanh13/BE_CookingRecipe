// server.js
const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create temp directory for file uploads if it doesn't exist
if (!fs.existsSync('temp')) {
  fs.mkdirSync('temp');
}

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Recipe API',
      version: '1.0.0',
      description: 'A recipe management API',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://recipe-api-cmz3.onrender.com'  // Production URL
          : `http://localhost:${PORT}`,              // Development URL
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(cors({
  origin: '*',  // Allow all origins (for testing only!)
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Image upload limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend static assets in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.resolve(__dirname, '../FE_CookingRecipe/dist');
  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
  }
}

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint (put this BEFORE importing routes to test basic server)
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Import and use routes
try {
  // Authentication routes
  const authRoutes = require('./src/routes/auth');
  app.use('/api/auth', authRoutes.router);
  console.log('Auth routes configured successfully');

  // Recipe routes
  const recipeRoutes = require('./src/routes/recipes');
  app.use('/api/recipes', recipeRoutes);
  console.log('Recipe routes configured successfully');

  // Image routes
  const imageRoutes = require('./src/routes/images');
  app.use('/api/images', imageRoutes);
  console.log('Image routes configured successfully');

  // Order routes
  const orderRoutes = require('./src/routes/orders');
  app.use('/api/orders', orderRoutes);
  console.log('Order routes configured successfully');

} catch (error) {
  console.error('Error importing routes:', error);
}

// Global error handler (filesize limit, invalid file type, etc.)
app.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB.'
    });
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed.'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// SPA fallback: send index.html for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.resolve(__dirname, '../FE_CookingRecipe/dist');
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const indexHtmlPath = path.join(clientBuildPath, 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      return res.sendFile(indexHtmlPath);
    }
    next();
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});