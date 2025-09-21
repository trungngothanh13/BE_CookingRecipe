// Updated src/routes/recipes.js with database integration

const express = require('express');
const router = express.Router();

// Test database connection first
let pool;
try {
  pool = require('../config/database');
  console.log('Database module loaded successfully');
} catch (error) {
  console.error('Failed to load database module:', error.message);
}

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Recipe routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Database connection test route
router.get('/test/db-connection', async (req, res) => {
  if (!pool) {
    return res.status(500).json({
      success: false,
      message: 'Database pool not initialized',
      error: 'Database module failed to load'
    });
  }

  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    
    console.log('Database query successful');
    res.json({
      success: true,
      message: 'Database connection successful!',
      data: {
        current_time: result.rows[0].current_time,
        database_version: result.rows[0].db_version.split(' ')[0] // Just show PostgreSQL version
      }
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      details: {
        code: error.code,
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'recipe_management',
        port: process.env.DB_PORT || 5432
      }
    });
  }
});

// Your original mock data routes (keep these working)
const mockRecipes = [
  {
    id: 1,
    title: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta dish',
    ingredients: ['pasta', 'eggs', 'bacon', 'cheese'],
    instructions: 'Cook pasta, mix with eggs and bacon...',
    cookingTime: 20,
    rating: 4.5
  },
  {
    id: 2,
    title: 'Chicken Curry',
    description: 'Spicy and flavorful curry',
    ingredients: ['chicken', 'curry powder', 'coconut milk', 'onions'],
    instructions: 'Cook chicken, add spices...',
    cookingTime: 45,
    rating: 4.2
  }
];

// Mock data routes (keep these for now)
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: mockRecipes,
    count: mockRecipes.length,
    message: 'Using mock data - ready to switch to database'
  });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const recipe = mockRecipes.find(r => r.id === id);
  
  if (!recipe) {
    return res.status(404).json({
      success: false,
      message: 'Recipe not found'
    });
  }
  
  res.json({
    success: true,
    data: recipe,
    message: 'Using mock data - ready to switch to database'
  });
});

module.exports = router;