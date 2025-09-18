const express = require('express');
const router = express.Router();

// Mock data for testing (replace with database later)
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

/**
 * @swagger
 * components:
 *   schemas:
 *     Recipe:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - ingredients
 *         - instructions
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated ID
 *         title:
 *           type: string
 *           description: Recipe title
 *         description:
 *           type: string
 *           description: Short description of the recipe
 *         ingredients:
 *           type: array
 *           items:
 *             type: string
 *           description: List of ingredients
 *         instructions:
 *           type: string
 *           description: Cooking instructions
 *         cookingTime:
 *           type: integer
 *           description: Cooking time in minutes
 *         rating:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 5
 *           description: Average rating
 */

/**
 * @swagger
 * /api/recipes:
 *   get:
 *     summary: Get all recipes
 *     description: Retrieve a list of all recipes with basic information
 *     responses:
 *       200:
 *         description: List of recipes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recipe'
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: mockRecipes,
    count: mockRecipes.length
  });
});

/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     summary: Get recipe by ID
 *     description: Retrieve a specific recipe by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Recipe ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recipe found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       404:
 *         description: Recipe not found
 */
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
    data: recipe
  });
});

/**
 * @swagger
 * /api/recipes:
 *   post:
 *     summary: Create a new recipe
 *     description: Add a new recipe to the collection
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - ingredients
 *               - instructions
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *               instructions:
 *                 type: string
 *               cookingTime:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Invalid input
 */
router.post('/', (req, res) => {
  const { title, description, ingredients, instructions, cookingTime } = req.body;
  
  if (!title || !description || !ingredients || !instructions) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: title, description, ingredients, instructions'
    });
  }
  
  const newRecipe = {
    id: mockRecipes.length + 1,
    title,
    description,
    ingredients,
    instructions,
    cookingTime: cookingTime || 0,
    rating: 0
  };
  
  mockRecipes.push(newRecipe);
  
  res.status(201).json({
    success: true,
    data: newRecipe,
    message: 'Recipe created successfully'
  });
});

module.exports = router;