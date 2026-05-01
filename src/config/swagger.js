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
      title: 'Cooking Course API',
      version: '1.0.0',
      description: 'Course catalog, cart, order, and access management API',
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
        name: 'Courses',
        description: 'Public course catalog'
      },
      {
        name: 'Cart',
        description: 'Course cart operations'
      },
      {
        name: 'Orders',
        description: 'Checkout, payment proof, and verification flow'
      },
      {
        name: 'Images',
        description: 'Profile and course image uploads'
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
  apis: [
    './src/docs/auth.js',
    './src/docs/courses.js',
    './src/docs/cart.js',
    './src/docs/transactions.js',
    './src/docs/images.js',
    './src/docs/schemas.js',
    './src/routes/auth.js',
    './src/routes/courses.js',
    './src/routes/cart.js',
    './src/routes/transactions.js',
    './src/routes/images.js'
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;

