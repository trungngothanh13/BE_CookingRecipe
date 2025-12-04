const express = require('express');
const router = express.Router();
const ratingService = require('../services/ratingService');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Swagger documentation: see src/docs/ratings.js and src/docs/schemas.js




router.post('/recipe/:recipeId', authenticateToken, async (req, res) => {
  try {
    const recipeId = parseInt(req.params.recipeId);
    const userId = req.user.userId;
    const { ratingScore, comment } = req.body;

    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID'
      });
    }

    const rating = await ratingService.createOrUpdateRating(userId, recipeId, ratingScore, comment);

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: rating
    });

  } catch (error) {
    console.error('Create/update rating error:', error);
    
    if (error.message === 'Recipe not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('must purchase') || error.message.includes('purchase')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Rating score must be')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit rating',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});


router.get('/recipe/:recipeId', async (req, res) => {
  try {
    const recipeId = parseInt(req.params.recipeId);

    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID'
      });
    }

    const result = await ratingService.getRecipeRatings(recipeId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get ratings error:', error);
    
    if (error.message === 'Recipe not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.delete('/:ratingId', authenticateToken, async (req, res) => {
  try {
    const ratingId = parseInt(req.params.ratingId);
    const userId = req.user.userId;

    if (isNaN(ratingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rating ID'
      });
    }

    const result = await ratingService.deleteRating(ratingId, userId);

    res.json({
      success: true,
      message: 'Rating deleted successfully',
      data: result
    });

  } catch (error) {
    console.error('Delete rating error:', error);
    
    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete rating',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

