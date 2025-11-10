const express = require('express');
const router = express.Router();
const recipeService = require('../services/recipeService');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');

// Swagger documentation: see src/docs/recipes.js and src/docs/schemas.js


router.get('/', async (req, res) => {
  try {
    const {
      search,
      difficulty,
      cookingTime,
      sortBy = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    const result = await recipeService.getRecipesOverview({
      search,
      difficulty,
      cookingTime,
      sortBy,
      myRecipes: false,
      userId: null,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get recipes overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});


router.get('/my-recipes', authenticateToken, async (req, res) => {
  try {
    const {
      search,
      difficulty,
      cookingTime,
      sortBy = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    const result = await recipeService.getRecipesOverview({
      search,
      difficulty,
      cookingTime,
      sortBy,
      myRecipes: true,
      userId: req.user.userId,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get my recipes error:', error);
    
    if (error.message === 'Authentication required to filter your purchased recipes') {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch your recipes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});




router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID'
      });
    }

    const recipe = await recipeService.getRecipeDetail(recipeId, userId, userRole);

    res.json({
      success: true,
      data: recipe
    });

  } catch (error) {
    console.error('Get recipe detail error:', error);
    
    if (error.message === 'Recipe not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipe details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});


router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    const recipeData = req.body;

    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID'
      });
    }

    const recipe = await recipeService.updateRecipe(recipeId, recipeData);

    res.json({
      success: true,
      message: 'Recipe updated successfully',
      data: recipe
    });

  } catch (error) {
    console.error('Update recipe error:', error);
    
    if (error.message === 'Recipe not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    // Handle validation errors
    if (error.message.includes('required') || 
        error.message.includes('must be') || 
        error.message.includes('at least') ||
        error.message.includes('Difficulty must be')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update recipe',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});


router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.userId;
    const recipeData = req.body;

    const recipe = await recipeService.createRecipe(userId, recipeData);

    res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      data: recipe
    });

  } catch (error) {
    console.error('Create recipe error:', error);
    
    // Handle validation errors
    if (error.message.includes('required') || 
        error.message.includes('must be') || 
        error.message.includes('at least') ||
        error.message.includes('Difficulty must be')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create recipe',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});


router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);

    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID'
      });
    }

    const result = await recipeService.deleteRecipe(recipeId);

    res.json({
      success: true,
      message: `Recipe "${result.title}" deleted successfully`
    });

  } catch (error) {
    console.error('Delete recipe error:', error);
    
    if (error.message === 'Recipe not found') {
      return res.status(404).json({
      success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete recipe',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
