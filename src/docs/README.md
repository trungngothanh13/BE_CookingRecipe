# API Documentation Structure

All Swagger/OpenAPI documentation is organized in this `docs` folder for better code organization and readability.
- `schemas.js` - Shared data schemas (User, Recipe, Rating, etc.)
- `auth.js` - Authentication endpoints documentation
- `recipes.js` - Recipe endpoints documentation  
- `images.js` - Image upload endpoints documentation
- `ratings.js` - Rating endpoints documentation

The `swagger-jsdoc` library reads JSDoc comments from both:
- `./src/docs/*.js` - Documentation files
- `./src/routes/*.js` - Route files (for any remaining inline docs)

This separation keeps route files clean and focused on business logic, while documentation is centralized and easy to maintain.

