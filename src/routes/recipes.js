const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Recipe:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Recipe ID
 *         title:
 *           type: string
 *           description: Recipe title
 *         description:
 *           type: string
 *           description: Recipe description
 *         origin:
 *           type: string
 *           description: Cuisine origin
 *         cookingTime:
 *           type: integer
 *           description: Cooking time in minutes
 *         rating:
 *           type: number
 *           format: float
 *           description: Average rating
 *         createdBy:
 *           type: string
 *           description: Username of recipe creator
 *         ingredients:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *               quantity:
 *                 type: number
 *               measurement:
 *                 type: string
 *         instructions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               step:
 *                 type: integer
 *               content:
 *                 type: string
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recipe'
 *                 count:
 *                   type: integer
 */
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.recipeid as id,
        r.recipetitle as title,
        r.origin,
        r.duration as cookingTime,
        r.description,
        r.createdat,
        u.username as createdBy,
        COALESCE(ROUND(AVG(rt.ratingscore)::numeric, 2), 0) as rating,
        COUNT(rt.ratingid) as totalRatings
      FROM Recipe r
      LEFT JOIN "User" u ON r.userid = u.userid
      LEFT JOIN Rating rt ON r.recipeid = rt.recipeid
      GROUP BY r.recipeid, r.recipetitle, r.origin, r.duration, r.description, r.createdat, u.username
      ORDER BY r.createdat DESC
    `;

    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/recipes/search:
 *   get:
 *     summary: Search recipes
 *     description: Search recipes by title, origin, or description
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         description: Search query
 *         schema:
 *           type: string
 *           example: "curry"
 *       - in: query
 *         name: origin
 *         required: false
 *         description: Filter by cuisine origin
 *         schema:
 *           type: string
 *           example: "Italian"
 *       - in: query
 *         name: maxTime
 *         required: false
 *         description: Maximum cooking time in minutes
 *         schema:
 *           type: integer
 *           example: 30
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recipe'
 *                 count:
 *                   type: integer
 *                 searchQuery:
 *                   type: string
 */
router.get('/search', async (req, res) => {
  try {
    const { q, origin, maxTime } = req.query;
    
    if (!q && !origin && !maxTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one search parameter: q, origin, or maxTime'
      });
    }

    let query = `
      SELECT 
        r.recipeid as id,
        r.recipetitle as title,
        r.origin,
        r.duration as cookingTime,
        r.description,
        r.createdat,
        u.username as createdBy,
        COALESCE(ROUND(AVG(rt.ratingscore)::numeric, 2), 0) as rating,
        COUNT(rt.ratingid) as totalRatings
      FROM Recipe r
      LEFT JOIN "User" u ON r.userid = u.userid
      LEFT JOIN Rating rt ON r.recipeid = rt.recipeid
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Search by title, description, or origin
    if (q) {
      query += ` AND (
        LOWER(r.recipetitle) LIKE LOWER($${paramIndex}) 
        OR LOWER(r.description) LIKE LOWER($${paramIndex})
        OR LOWER(r.origin) LIKE LOWER($${paramIndex})
      )`;
      queryParams.push(`%${q}%`);
      paramIndex++;
    }

    // Filter by specific origin
    if (origin) {
      query += ` AND LOWER(r.origin) = LOWER($${paramIndex})`;
      queryParams.push(origin);
      paramIndex++;
    }

    // Filter by cooking time
    if (maxTime) {
      const time = parseInt(maxTime);
      if (!isNaN(time)) {
        query += ` AND r.duration <= $${paramIndex}`;
        queryParams.push(time);
        paramIndex++;
      }
    }

    query += `
      GROUP BY r.recipeid, r.recipetitle, r.origin, r.duration, r.description, r.createdat, u.username
      ORDER BY rating DESC, r.createdat DESC
    `;

    const result = await pool.query(query, queryParams);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      searchQuery: q,
      filters: { origin, maxTime }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     summary: Get recipe by ID
 *     description: Retrieve a specific recipe with full details including ingredients and instructions
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Recipe'
 *       404:
 *         description: Recipe not found
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID'
      });
    }

    // Get basic recipe info
    const recipeQuery = `
      SELECT 
        r.recipeid as id,
        r.recipetitle as title,
        r.origin,
        r.duration as cookingTime,
        r.description,
        r.createdat,
        r.updatedat,
        u.username as createdBy,
        COALESCE(ROUND(AVG(rt.ratingscore)::numeric, 2), 0) as rating,
        COUNT(rt.ratingid) as totalRatings
      FROM Recipe r
      LEFT JOIN "User" u ON r.userid = u.userid
      LEFT JOIN Rating rt ON r.recipeid = rt.recipeid
      WHERE r.recipeid = $1
      GROUP BY r.recipeid, r.recipetitle, r.origin, r.duration, r.description, r.createdat, r.updatedat, u.username
    `;

    // Get ingredients for this recipe
    const ingredientsQuery = `
      SELECT 
        i.label,
        i.quantity,
        i.measurement
      FROM Recipe_Ingredient ri
      JOIN Ingredient i ON ri.ingredientid = i.ingredientid
      WHERE ri.recipeid = $1
      ORDER BY i.label
    `;

    // Get instructions for this recipe
    const instructionsQuery = `
      SELECT 
        inst.step,
        inst.content
      FROM Recipe_Instruction rin
      JOIN Instruction inst ON rin.instructionid = inst.instructionid
      WHERE rin.recipeid = $1
      ORDER BY inst.step ASC
    `;

    const [recipeResult, ingredientsResult, instructionsResult] = await Promise.all([
      pool.query(recipeQuery, [id]),
      pool.query(ingredientsQuery, [id]),
      pool.query(instructionsQuery, [id])
    ]);

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    const recipe = {
      ...recipeResult.rows[0],
      ingredients: ingredientsResult.rows,
      instructions: instructionsResult.rows
    };

    res.json({
      success: true,
      data: recipe
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipe',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;