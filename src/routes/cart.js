const express = require('express');
const router = express.Router();
const cartService = require('../services/cartService');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const courseId = req.body.courseId ?? req.body.recipeId;

    if (courseId === undefined || courseId === null || Number.isNaN(parseInt(courseId, 10))) {
      return res.status(400).json({
        success: false,
        message: 'Valid course ID is required'
      });
    }

    const parsedId = parseInt(courseId, 10);
    const result = await cartService.addCourseToCart(userId, parsedId);

    if (!result.success) {
      if (result.alreadyInCart) {
        return res.status(200).json({
          success: false,
          alreadyInCart: true,
          message: 'Course is already in your cart',
          data: { cart: result.cart ?? [] }
        });
      }
      const status =
        typeof result.message === 'string' && result.message.includes('Already purchased')
          ? 409
          : 400;

      return res.status(status).json({
        success: false,
        message: result.message || 'Could not add to cart'
      });
    }

    res.status(201).json({
      success: true,
      message: result.message || 'Course added to cart successfully',
      data: {
        cart: result.cart
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add course to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await cartService.getCartCourses(userId);

    if (!cart.success) {
      throw new Error(cart.message || 'Cart load failed');
    }

    const items = cart.courses ?? [];

    res.json({
      success: true,
      data: {
        items,
        total: cart.totalPrice,
        totalPrice: cart.totalPrice,
        itemCount: items.length
      }
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

router.delete('/:courseId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const courseId = parseInt(req.params.courseId, 10);

    if (Number.isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      });
    }

    const result = await cartService.removeCourseFromCart(userId, courseId, null);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Could not remove from cart'
      });
    }

    res.json({
      success: true,
      message: result.message || 'Course removed from cart successfully',
      data: result
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove course from cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
