const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const cartRoutes = require('./routes/cart');
const transactionRoutes = require('./routes/transactions');

// Mount routes
router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/cart', cartRoutes);
router.use('/transactions', transactionRoutes);

// Export the main router
module.exports = router;

