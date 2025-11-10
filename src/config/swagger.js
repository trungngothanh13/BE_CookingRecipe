const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 5000;

// Get the server URL dynamically
const getServerUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // Use RENDER_EXTERNAL_URL if available (set by Render), otherwise use environment variable
    // If neither is set, it will use relative URLs which work with the current host
    return process.env.RENDER_EXTERNAL_URL || process.env.API_URL || '';
  }
  return `http://localhost:${PORT}`;
};

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
        url: getServerUrl(),
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and profile management'
      },
      {
        name: 'Recipes',
        description: 'Recipe management (admin only for create/update/delete)'
      },
      {
        name: 'Images',
        description: 'Image uploads (profile pictures and recipe thumbnails)'
      },
      {
        name: 'Ratings',
        description: 'Recipe ratings and reviews (purchasers only)'
      },
      {
        name: 'Cart',
        description: 'Shopping cart management'
      },
      {
        name: 'Transactions',
        description: 'Transaction and payment management'
      }
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
  apis: ['./src/docs/*.js', './src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;

