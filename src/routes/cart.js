const express = require('express');
const router = express.Router();
const cartService = require('../services/cartService');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Swagger documentation: see src/docs/cart.js

router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { recipeId } = req.body;

    if (!recipeId || isNaN(parseInt(recipeId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid recipe ID is required'
      });
    }

    const cartItem = await cartService.addToCart(userId, parseInt(recipeId));

    res.status(201).json({
      success: true,
      message: 'Recipe added to cart successfully',
      data: cartItem
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    
    if (error.message === 'Recipe not found' || 
        error.message === 'Recipe is not available for purchase' ||
        error.message === 'Recipe is already in your cart' ||
        error.message === 'You already own this recipe') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add recipe to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await cartService.getCart(userId);

    res.json({
      success: true,
      data: cart
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.delete('/:recipeId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const recipeId = parseInt(req.params.recipeId);

    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID'
      });
    }

    const result = await cartService.removeFromCart(userId, recipeId);

    res.json({
      success: true,
      message: 'Recipe removed from cart successfully',
      data: result
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    
    if (error.message === 'Item not found in cart') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to remove recipe from cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
