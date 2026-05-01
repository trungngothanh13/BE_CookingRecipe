const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');

// Mount routes
router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);

// Export the main router
module.exports = router;

