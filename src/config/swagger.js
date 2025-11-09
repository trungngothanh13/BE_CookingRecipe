const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 5000;

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
          ? 'https://recipe-api-cmz3.onrender.com'
          : `http://localhost:${PORT}`,
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

