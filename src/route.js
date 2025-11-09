const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./routes/auth');
const imageRoutes = require('./routes/images');
const recipeRoutes = require('./routes/recipes');
const ratingRoutes = require('./routes/ratings');
const cartRoutes = require('./routes/cart');
const transactionRoutes = require('./routes/transactions');

// Mount routes
router.use('/auth', authRoutes);
router.use('/images', imageRoutes);
router.use('/recipes', recipeRoutes);
router.use('/ratings', ratingRoutes);
router.use('/cart', cartRoutes);
router.use('/transactions', transactionRoutes);

// Export the main router
module.exports = router;

