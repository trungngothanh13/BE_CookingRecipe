# API Documentation Structure

All Swagger/OpenAPI documentation is organized in this `docs` folder for better code organization and readability.
- `schemas.js` - Shared data schemas (User, etc.)
- `auth.js` - Authentication endpoints documentation
- `courses.js` - Course catalog endpoints documentation

The `swagger-jsdoc` library currently reads JSDoc comments from:
- `./src/docs/auth.js`
- `./src/docs/courses.js`
- `./src/docs/schemas.js`
- `./src/routes/auth.js`
- `./src/routes/courses.js`

This separation keeps route files clean and focused on business logic, while documentation is centralized and easy to maintain.

