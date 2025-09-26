const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('./auth'); // Import authentication middleware

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
 *     NewRecipe:
 *       type: object
 *       required:
 *         - title
 *         - ingredients
 *         - instructions
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           description: Recipe title
 *         description:
 *           type: string
 *           description: Recipe description
 *         origin:
 *           type: string
 *           maxLength: 100
 *           description: Cuisine origin (e.g., Italian, Mexican)
 *         cookingTime:
 *           type: integer
 *           minimum: 1
 *           description: Cooking time in minutes
 *         ingredients:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - label
 *             properties:
 *               label:
 *                 type: string
 *                 maxLength: 100
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *               measurement:
 *                 type: string
 *                 maxLength: 20
 *         instructions:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - step
 *               - content
 *             properties:
 *               step:
 *                 type: integer
 *                 minimum: 1
 *               content:
 *                 type: string
 *                 minLength: 10
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
 * /api/recipes:
 *   post:
 *     summary: Create a new recipe
 *     description: Add a new recipe with ingredients and instructions (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewRecipe'
 *           example:
 *             title: "Classic Margherita Pizza"
 *             description: "Traditional Italian pizza with tomato, mozzarella, and fresh basil"
 *             origin: "Italian"
 *             cookingTime: 25
 *             ingredients:
 *               - label: "Pizza dough"
 *                 quantity: 1
 *                 measurement: "ball"
 *               - label: "Tomato sauce"
 *                 quantity: 0.5
 *                 measurement: "cup"
 *               - label: "Mozzarella cheese"
 *                 quantity: 200
 *                 measurement: "grams"
 *               - label: "Fresh basil"
 *                 quantity: 10
 *                 measurement: "leaves"
 *             instructions:
 *               - step: 1
 *                 content: "Preheat oven to 475°F (245°C)"
 *               - step: 2
 *                 content: "Roll out pizza dough on a floured surface"
 *               - step: 3
 *                 content: "Spread tomato sauce evenly over the dough"
 *               - step: 4
 *                 content: "Add mozzarella cheese on top"
 *               - step: 5
 *                 content: "Bake for 12-15 minutes until crust is golden"
 *               - step: 6
 *                 content: "Add fresh basil leaves and serve hot"
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { title, description, origin, cookingTime, ingredients, instructions } = req.body;
    const userId = req.user.userId; // From JWT token

    // Validation
    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Recipe title must be at least 3 characters long'
      });
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one ingredient is required'
      });
    }

    if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one instruction is required'
      });
    }

    // Validate ingredients
    for (let i = 0; i < ingredients.length; i++) {
      const ingredient = ingredients[i];
      if (!ingredient.label || ingredient.label.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: `Ingredient ${i + 1} must have a label`
        });
      }
      if (ingredient.quantity !== undefined && (isNaN(ingredient.quantity) || ingredient.quantity < 0)) {
        return res.status(400).json({
          success: false,
          message: `Ingredient ${i + 1} quantity must be a positive number`
        });
      }
    }

    // Validate instructions
    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];
      if (!instruction.content || instruction.content.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: `Instruction ${i + 1} must be at least 10 characters long`
        });
      }
      if (!instruction.step || isNaN(instruction.step) || instruction.step < 1) {
        return res.status(400).json({
          success: false,
          message: `Instruction ${i + 1} must have a valid step number`
        });
      }
    }

    // Validate cooking time if provided
    if (cookingTime !== undefined && (isNaN(cookingTime) || cookingTime < 1)) {
      return res.status(400).json({
        success: false,
        message: 'Cooking time must be a positive number'
      });
    }

    // Start transaction
    await client.query('BEGIN');

    // Insert recipe
    const recipeResult = await client.query(
      `INSERT INTO Recipe (recipetitle, description, origin, duration, userid) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING recipeid, recipetitle, description, origin, duration, createdat`,
      [title.trim(), description?.trim() || null, origin?.trim() || null, cookingTime || null, userId]
    );

    const newRecipe = recipeResult.rows[0];
    const recipeId = newRecipe.recipeid;

    // Insert ingredients
    const ingredientIds = [];
    for (const ingredient of ingredients) {
      const ingredientResult = await client.query(
        `INSERT INTO Ingredient (label, quantity, measurement) 
         VALUES ($1, $2, $3) 
         RETURNING ingredientid`,
        [
          ingredient.label.trim(),
          ingredient.quantity || null,
          ingredient.measurement?.trim() || null
        ]
      );
      
      const ingredientId = ingredientResult.rows[0].ingredientid;
      ingredientIds.push(ingredientId);

      // Link recipe to ingredient
      await client.query(
        `INSERT INTO Recipe_Ingredient (recipeid, ingredientid) VALUES ($1, $2)`,
        [recipeId, ingredientId]
      );
    }

    // Insert instructions
    const instructionIds = [];
    for (const instruction of instructions) {
      const instructionResult = await client.query(
        `INSERT INTO Instruction (step, content) 
         VALUES ($1, $2) 
         RETURNING instructionid`,
        [instruction.step, instruction.content.trim()]
      );
      
      const instructionId = instructionResult.rows[0].instructionid;
      instructionIds.push(instructionId);

      // Link recipe to instruction
      await client.query(
        `INSERT INTO Recipe_Instruction (recipeid, instructionid) VALUES ($1, $2)`,
        [recipeId, instructionId]
      );
    }

    // Commit transaction
    await client.query('COMMIT');

    // Get the complete recipe data to return
    const completeRecipe = await pool.query(`
      SELECT 
        r.recipeid as id,
        r.recipetitle as title,
        r.origin,
        r.duration as cookingTime,
        r.description,
        r.createdat,
        u.username as createdBy
      FROM Recipe r
      LEFT JOIN "User" u ON r.userid = u.userid
      WHERE r.recipeid = $1
    `, [recipeId]);

    // Get ingredients
    const ingredientsResult = await pool.query(`
      SELECT 
        i.label,
        i.quantity,
        i.measurement
      FROM Recipe_Ingredient ri
      JOIN Ingredient i ON ri.ingredientid = i.ingredientid
      WHERE ri.recipeid = $1
      ORDER BY i.label
    `, [recipeId]);

    // Get instructions
    const instructionsResult = await pool.query(`
      SELECT 
        inst.step,
        inst.content
      FROM Recipe_Instruction rin
      JOIN Instruction inst ON rin.instructionid = inst.instructionid
      WHERE rin.recipeid = $1
      ORDER BY inst.step ASC
    `, [recipeId]);

    const responseData = {
      ...completeRecipe.rows[0],
      ingredients: ingredientsResult.rows,
      instructions: instructionsResult.rows,
      rating: 0,
      totalRatings: 0
    };

    res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      data: responseData
    });

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Create recipe error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create recipe',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    client.release();
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

/**
 * @swagger
 * /api/recipes/{id}:
 *   put:
 *     summary: Update a recipe
 *     description: Update an existing recipe (only the recipe owner can update)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Recipe ID to update
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewRecipe'
 *           example:
 *             title: "Updated Margherita Pizza"
 *             description: "Even better traditional Italian pizza"
 *             origin: "Italian"
 *             cookingTime: 30
 *             ingredients:
 *               - label: "Pizza dough"
 *                 quantity: 1
 *                 measurement: "ball"
 *               - label: "San Marzano tomatoes"
 *                 quantity: 400
 *                 measurement: "grams"
 *             instructions:
 *               - step: 1
 *                 content: "Preheat oven to 500°F (260°C)"
 *               - step: 2
 *                 content: "Prepare the dough and let it rest"
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to update this recipe
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const recipeId = parseInt(req.params.id);
    const { title, description, origin, cookingTime, ingredients, instructions } = req.body;
    const userId = req.user.userId;

    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID'
      });
    }

    // Check if recipe exists and belongs to the user
    const recipeCheck = await client.query(
      'SELECT userid FROM Recipe WHERE recipeid = $1',
      [recipeId]
    );

    if (recipeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    if (recipeCheck.rows[0].userid !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own recipes'
      });
    }

    // Same validation as create recipe
    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Recipe title must be at least 3 characters long'
      });
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one ingredient is required'
      });
    }

    if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one instruction is required'
      });
    }

    // Validate ingredients
    for (let i = 0; i < ingredients.length; i++) {
      const ingredient = ingredients[i];
      if (!ingredient.label || ingredient.label.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: `Ingredient ${i + 1} must have a label`
        });
      }
      if (ingredient.quantity !== undefined && (isNaN(ingredient.quantity) || ingredient.quantity < 0)) {
        return res.status(400).json({
          success: false,
          message: `Ingredient ${i + 1} quantity must be a positive number`
        });
      }
    }

    // Validate instructions
    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];
      if (!instruction.content || instruction.content.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: `Instruction ${i + 1} must be at least 10 characters long`
        });
      }
      if (!instruction.step || isNaN(instruction.step) || instruction.step < 1) {
        return res.status(400).json({
          success: false,
          message: `Instruction ${i + 1} must have a valid step number`
        });
      }
    }

    if (cookingTime !== undefined && (isNaN(cookingTime) || cookingTime < 1)) {
      return res.status(400).json({
        success: false,
        message: 'Cooking time must be a positive number'
      });
    }

    // Start transaction
    await client.query('BEGIN');

    // Update recipe
    await client.query(
      `UPDATE Recipe 
       SET recipetitle = $1, description = $2, origin = $3, duration = $4, updatedat = CURRENT_TIMESTAMP
       WHERE recipeid = $5`,
      [title.trim(), description?.trim() || null, origin?.trim() || null, cookingTime || null, recipeId]
    );

    // Delete existing ingredient and instruction relationships
    await client.query('DELETE FROM Recipe_Ingredient WHERE recipeid = $1', [recipeId]);
    await client.query('DELETE FROM Recipe_Instruction WHERE recipeid = $1', [recipeId]);
    
    // Delete orphaned ingredients and instructions
    await client.query(`
      DELETE FROM Ingredient 
      WHERE ingredientid NOT IN (SELECT DISTINCT ingredientid FROM Recipe_Ingredient)
    `);
    await client.query(`
      DELETE FROM Instruction 
      WHERE instructionid NOT IN (SELECT DISTINCT instructionid FROM Recipe_Instruction)
    `);

    // Insert new ingredients
    for (const ingredient of ingredients) {
      const ingredientResult = await client.query(
        `INSERT INTO Ingredient (label, quantity, measurement) 
         VALUES ($1, $2, $3) 
         RETURNING ingredientid`,
        [
          ingredient.label.trim(),
          ingredient.quantity || null,
          ingredient.measurement?.trim() || null
        ]
      );
      
      const ingredientId = ingredientResult.rows[0].ingredientid;

      // Link recipe to ingredient
      await client.query(
        `INSERT INTO Recipe_Ingredient (recipeid, ingredientid) VALUES ($1, $2)`,
        [recipeId, ingredientId]
      );
    }

    // Insert new instructions
    for (const instruction of instructions) {
      const instructionResult = await client.query(
        `INSERT INTO Instruction (step, content) 
         VALUES ($1, $2) 
         RETURNING instructionid`,
        [instruction.step, instruction.content.trim()]
      );
      
      const instructionId = instructionResult.rows[0].instructionid;

      // Link recipe to instruction
      await client.query(
        `INSERT INTO Recipe_Instruction (recipeid, instructionid) VALUES ($1, $2)`,
        [recipeId, instructionId]
      );
    }

    // Commit transaction
    await client.query('COMMIT');

    // Get the updated recipe data
    const updatedRecipe = await pool.query(`
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
    `, [recipeId]);

    // Get ingredients
    const ingredientsResult = await pool.query(`
      SELECT 
        i.label,
        i.quantity,
        i.measurement
      FROM Recipe_Ingredient ri
      JOIN Ingredient i ON ri.ingredientid = i.ingredientid
      WHERE ri.recipeid = $1
      ORDER BY i.label
    `, [recipeId]);

    // Get instructions
    const instructionsResult = await pool.query(`
      SELECT 
        inst.step,
        inst.content
      FROM Recipe_Instruction rin
      JOIN Instruction inst ON rin.instructionid = inst.instructionid
      WHERE rin.recipeid = $1
      ORDER BY inst.step ASC
    `, [recipeId]);

    const responseData = {
      ...updatedRecipe.rows[0],
      ingredients: ingredientsResult.rows,
      instructions: instructionsResult.rows
    };

    res.json({
      success: true,
      message: 'Recipe updated successfully',
      data: responseData
    });

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Update recipe error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update recipe',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/recipes/{id}:
 *   delete:
 *     summary: Delete a recipe
 *     description: Delete an existing recipe (only the recipe owner can delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Recipe ID to delete
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recipe deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to delete this recipe
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const recipeId = parseInt(req.params.id);
    const userId = req.user.userId;

    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID'
      });
    }

    // Check if recipe exists and belongs to the user
    const recipeCheck = await client.query(
      'SELECT userid, recipetitle FROM Recipe WHERE recipeid = $1',
      [recipeId]
    );

    if (recipeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    if (recipeCheck.rows[0].userid !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own recipes'
      });
    }

    const recipeTitle = recipeCheck.rows[0].recipetitle;

    // Start transaction
    await client.query('BEGIN');

    // Delete recipe (CASCADE will handle related records)
    await client.query('DELETE FROM Recipe WHERE recipeid = $1', [recipeId]);

    // Clean up orphaned ingredients and instructions
    await client.query(`
      DELETE FROM Ingredient 
      WHERE ingredientid NOT IN (SELECT DISTINCT ingredientid FROM Recipe_Ingredient WHERE ingredientid IS NOT NULL)
    `);
    await client.query(`
      DELETE FROM Instruction 
      WHERE instructionid NOT IN (SELECT DISTINCT instructionid FROM Recipe_Instruction WHERE instructionid IS NOT NULL)
    `);

    // Commit transaction
    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Recipe "${recipeTitle}" deleted successfully`
    });

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Delete recipe error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete recipe',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/recipes/user/my-recipes:
 *   get:
 *     summary: Get current user's recipes
 *     description: Retrieve all recipes created by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's recipes retrieved successfully
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
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.get('/user/my-recipes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = `
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
      WHERE r.userid = $1
      GROUP BY r.recipeid, r.recipetitle, r.origin, r.duration, r.description, r.createdat, r.updatedat, u.username
      ORDER BY r.createdat DESC
    `;

    const result = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Get user recipes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your recipes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;