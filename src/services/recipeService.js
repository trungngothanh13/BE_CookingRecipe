const pool = require('../config/database');

/**
 * Create a new recipe with ingredients, instructions, and optional nutrition
 * @param {number} userId - User ID creating the recipe
 * @param {Object} recipeData - Recipe data
 * @param {string} recipeData.title - Recipe title
 * @param {string} recipeData.description - Recipe description
 * @param {string} recipeData.videoUrl - Video URL (optional)
 * @param {number} recipeData.price - Recipe price
 * @param {string} recipeData.difficulty - Difficulty level (easy, medium, hard)
 * @param {number} recipeData.cookingTime - Cooking time in minutes
 * @param {number} recipeData.servings - Number of servings
 * @param {string} recipeData.category - Recipe category
 * @param {Array} recipeData.ingredients - Array of ingredients {label, quantity, measurement}
 * @param {Array} recipeData.instructions - Array of instructions {step, content}
 * @param {Array} recipeData.nutrition - Optional array of nutrition {type, quantity, measurement}
 * @returns {Promise<Object>} Created recipe data
 * @throws {Error} If validation fails
 */
async function createRecipe(userId, recipeData) {
  const client = await pool.connect();
  
  try {
    const {
      title,
      description,
      videoUrl,
      price,
      difficulty,
      cookingTime,
      servings,
      category,
      ingredients,
      instructions,
      nutrition = []
    } = recipeData;

    // Validation
    if (!title || title.trim().length < 3) {
      throw new Error('Recipe title must be at least 3 characters long');
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      throw new Error('At least one ingredient is required');
    }

    if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
      throw new Error('At least one instruction is required');
    }

    // Validate required overview fields
    if (price === undefined || price === null || price < 0) {
      throw new Error('Price is required and must be 0 or greater');
    }

    if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
      throw new Error('Difficulty must be one of: easy, medium, hard');
    }

    if (!cookingTime || cookingTime < 1) {
      throw new Error('Cooking time is required and must be at least 1 minute');
    }

    if (!servings || servings < 1) {
      throw new Error('Servings is required and must be at least 1');
    }

    if (!category || category.trim().length === 0) {
      throw new Error('Category is required');
    }

    // Validate ingredients
    for (let i = 0; i < ingredients.length; i++) {
      const ingredient = ingredients[i];
      if (!ingredient.label || ingredient.label.trim().length === 0) {
        throw new Error(`Ingredient ${i + 1} must have a label`);
      }
      if (ingredient.quantity !== undefined && (isNaN(ingredient.quantity) || ingredient.quantity < 0)) {
        throw new Error(`Ingredient ${i + 1} quantity must be a positive number`);
      }
    }

    // Validate instructions
    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];
      if (!instruction.content || instruction.content.trim().length < 10) {
        throw new Error(`Instruction ${i + 1} must be at least 10 characters long`);
      }
      if (!instruction.step || isNaN(instruction.step) || instruction.step < 1) {
        throw new Error(`Instruction ${i + 1} must have a valid step number`);
      }
    }

    // Validate nutrition if provided
    if (nutrition && nutrition.length > 0) {
      for (let i = 0; i < nutrition.length; i++) {
        const nut = nutrition[i];
        if (!nut.type || nut.type.trim().length === 0) {
          throw new Error(`Nutrition ${i + 1} must have a type`);
        }
        if (nut.quantity !== undefined && (isNaN(nut.quantity) || nut.quantity < 0)) {
          throw new Error(`Nutrition ${i + 1} quantity must be a positive number`);
        }
      }
    }

    // Start transaction
    await client.query('BEGIN');

    // Insert recipe
    const recipeResult = await client.query(
      `INSERT INTO Recipe (recipetitle, description, videourl, price, difficulty, cookingtime, servings, category, userid) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING recipeid, recipetitle, description, videourl, price, difficulty, cookingtime, servings, category, createdat`,
      [
        title.trim(),
        description?.trim() || null,
        videoUrl?.trim() || null,
        price,
        difficulty.toLowerCase(),
        cookingTime,
        servings,
        category.trim(),
        userId
      ]
    );

    const newRecipe = recipeResult.rows[0];
    const recipeId = newRecipe.recipeid;

    // Insert ingredients
    const insertedIngredients = [];
    for (const ingredient of ingredients) {
      const ingredientResult = await client.query(
        `INSERT INTO Recipe_Ingredient (recipeid, label, quantity, measurement) 
         VALUES ($1, $2, $3, $4) 
         RETURNING recipeingredientid, label, quantity, measurement`,
        [
          recipeId,
          ingredient.label.trim(),
          ingredient.quantity || null,
          ingredient.measurement?.trim() || null
        ]
      );
      insertedIngredients.push(ingredientResult.rows[0]);
    }

    // Insert instructions
    const insertedInstructions = [];
    for (const instruction of instructions) {
      const instructionResult = await client.query(
        `INSERT INTO Recipe_Instruction (recipeid, step, content) 
         VALUES ($1, $2, $3) 
         RETURNING recipeinstructionid, step, content`,
        [recipeId, instruction.step, instruction.content.trim()]
      );
      insertedInstructions.push(instructionResult.rows[0]);
    }

    // Insert nutrition if provided
    const insertedNutrition = [];
    if (nutrition && nutrition.length > 0) {
      for (const nut of nutrition) {
        const nutritionResult = await client.query(
          `INSERT INTO Nutrition (recipeid, type, quantity, measurement) 
           VALUES ($1, $2, $3, $4) 
           RETURNING nutritionid, type, quantity, measurement`,
          [
            recipeId,
            nut.type.trim(),
            nut.quantity || null,
            nut.measurement?.trim() || null
          ]
        );
        insertedNutrition.push(nutritionResult.rows[0]);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    return {
      id: newRecipe.recipeid,
      title: newRecipe.recipetitle,
      description: newRecipe.description,
      videoUrl: newRecipe.videourl,
      price: parseFloat(newRecipe.price),
      difficulty: newRecipe.difficulty,
      cookingTime: newRecipe.cookingtime,
      servings: newRecipe.servings,
      category: newRecipe.category,
      createdAt: newRecipe.createdat,
      ingredients: insertedIngredients.map(ing => ({
        id: ing.recipeingredientid,
        label: ing.label,
        quantity: ing.quantity ? parseFloat(ing.quantity) : null,
        measurement: ing.measurement
      })),
      instructions: insertedInstructions
        .sort((a, b) => a.step - b.step)
        .map(inst => ({
          id: inst.recipeinstructionid,
          step: inst.step,
          content: inst.content
        })),
      nutrition: insertedNutrition.map(nut => ({
        id: nut.nutritionid,
        type: nut.type,
        quantity: nut.quantity ? parseFloat(nut.quantity) : null,
        measurement: nut.measurement
      }))
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update a recipe (admin only)
 * @param {number} recipeId - Recipe ID to update
 * @param {Object} recipeData - Updated recipe data
 * @param {string} recipeData.title - Recipe title
 * @param {string} recipeData.description - Recipe description
 * @param {string} recipeData.videoUrl - Video URL (optional)
 * @param {number} recipeData.price - Recipe price
 * @param {string} recipeData.difficulty - Difficulty level (easy, medium, hard)
 * @param {number} recipeData.cookingTime - Cooking time in minutes
 * @param {number} recipeData.servings - Number of servings
 * @param {string} recipeData.category - Recipe category
 * @param {Array} recipeData.ingredients - Array of ingredients {label, quantity, measurement}
 * @param {Array} recipeData.instructions - Array of instructions {step, content}
 * @param {Array} recipeData.nutrition - Optional array of nutrition {type, quantity, measurement}
 * @returns {Promise<Object>} Updated recipe data
 * @throws {Error} If validation fails or recipe not found
 */
async function updateRecipe(recipeId, recipeData) {
  const client = await pool.connect();
  
  try {
    const {
      title,
      description,
      videoUrl,
      price,
      difficulty,
      cookingTime,
      servings,
      category,
      ingredients,
      instructions,
      nutrition = []
    } = recipeData;

    // Check if recipe exists
    const recipeCheck = await client.query(
      'SELECT recipeid FROM Recipe WHERE recipeid = $1',
      [recipeId]
    );

    if (recipeCheck.rows.length === 0) {
      throw new Error('Recipe not found');
    }

    // Validation (same as create)
    if (!title || title.trim().length < 3) {
      throw new Error('Recipe title must be at least 3 characters long');
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      throw new Error('At least one ingredient is required');
    }

    if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
      throw new Error('At least one instruction is required');
    }

    if (price === undefined || price === null || price < 0) {
      throw new Error('Price is required and must be 0 or greater');
    }

    if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
      throw new Error('Difficulty must be one of: easy, medium, hard');
    }

    if (!cookingTime || cookingTime < 1) {
      throw new Error('Cooking time is required and must be at least 1 minute');
    }

    if (!servings || servings < 1) {
      throw new Error('Servings is required and must be at least 1');
    }

    if (!category || category.trim().length === 0) {
      throw new Error('Category is required');
    }

    // Validate ingredients
    for (let i = 0; i < ingredients.length; i++) {
      const ingredient = ingredients[i];
      if (!ingredient.label || ingredient.label.trim().length === 0) {
        throw new Error(`Ingredient ${i + 1} must have a label`);
      }
      if (ingredient.quantity !== undefined && (isNaN(ingredient.quantity) || ingredient.quantity < 0)) {
        throw new Error(`Ingredient ${i + 1} quantity must be a positive number`);
      }
    }

    // Validate instructions
    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];
      if (!instruction.content || instruction.content.trim().length < 10) {
        throw new Error(`Instruction ${i + 1} must be at least 10 characters long`);
      }
      if (!instruction.step || isNaN(instruction.step) || instruction.step < 1) {
        throw new Error(`Instruction ${i + 1} must have a valid step number`);
      }
    }

    // Validate nutrition if provided
    if (nutrition && nutrition.length > 0) {
      for (let i = 0; i < nutrition.length; i++) {
        const nut = nutrition[i];
        if (!nut.type || nut.type.trim().length === 0) {
          throw new Error(`Nutrition ${i + 1} must have a type`);
        }
        if (nut.quantity !== undefined && (isNaN(nut.quantity) || nut.quantity < 0)) {
          throw new Error(`Nutrition ${i + 1} quantity must be a positive number`);
        }
      }
    }

    // Start transaction
    await client.query('BEGIN');

    // Update recipe
    await client.query(
      `UPDATE Recipe 
       SET recipetitle = $1, description = $2, videourl = $3, price = $4, difficulty = $5, 
           cookingtime = $6, servings = $7, category = $8, updatedat = CURRENT_TIMESTAMP
       WHERE recipeid = $9`,
      [
        title.trim(),
        description?.trim() || null,
        videoUrl?.trim() || null,
        price,
        difficulty.toLowerCase(),
        cookingTime,
        servings,
        category.trim(),
        recipeId
      ]
    );

    // Delete existing ingredients, instructions, and nutrition
    await client.query('DELETE FROM Recipe_Ingredient WHERE recipeid = $1', [recipeId]);
    await client.query('DELETE FROM Recipe_Instruction WHERE recipeid = $1', [recipeId]);
    await client.query('DELETE FROM Nutrition WHERE recipeid = $1', [recipeId]);

    // Insert new ingredients
    const insertedIngredients = [];
    for (const ingredient of ingredients) {
      const ingredientResult = await client.query(
        `INSERT INTO Recipe_Ingredient (recipeid, label, quantity, measurement) 
         VALUES ($1, $2, $3, $4) 
         RETURNING recipeingredientid, label, quantity, measurement`,
        [
          recipeId,
          ingredient.label.trim(),
          ingredient.quantity || null,
          ingredient.measurement?.trim() || null
        ]
      );
      insertedIngredients.push(ingredientResult.rows[0]);
    }

    // Insert new instructions
    const insertedInstructions = [];
    for (const instruction of instructions) {
      const instructionResult = await client.query(
        `INSERT INTO Recipe_Instruction (recipeid, step, content) 
         VALUES ($1, $2, $3) 
         RETURNING recipeinstructionid, step, content`,
        [recipeId, instruction.step, instruction.content.trim()]
      );
      insertedInstructions.push(instructionResult.rows[0]);
    }

    // Insert new nutrition if provided
    const insertedNutrition = [];
    if (nutrition && nutrition.length > 0) {
      for (const nut of nutrition) {
        const nutritionResult = await client.query(
          `INSERT INTO Nutrition (recipeid, type, quantity, measurement) 
           VALUES ($1, $2, $3, $4) 
           RETURNING nutritionid, type, quantity, measurement`,
          [
            recipeId,
            nut.type.trim(),
            nut.quantity || null,
            nut.measurement?.trim() || null
          ]
        );
        insertedNutrition.push(nutritionResult.rows[0]);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    // Get updated recipe with rating info
    const updatedRecipe = await client.query(
      `SELECT 
        r.recipeid, r.recipetitle, r.description, r.videourl, r.price, r.difficulty, 
        r.cookingtime, r.servings, r.category, r.createdat, r.updatedat,
        COALESCE(ROUND(AVG(rt.ratingscore)::numeric, 2), 0) as rating,
        COUNT(DISTINCT rt.ratingid) as totalratings
      FROM Recipe r
      LEFT JOIN Rating rt ON r.recipeid = rt.recipeid
      WHERE r.recipeid = $1
      GROUP BY r.recipeid, r.recipetitle, r.description, r.videourl, r.price, r.difficulty,
        r.cookingtime, r.servings, r.category, r.createdat, r.updatedat`,
      [recipeId]
    );

    return {
      id: updatedRecipe.rows[0].recipeid,
      title: updatedRecipe.rows[0].recipetitle,
      description: updatedRecipe.rows[0].description,
      videoUrl: updatedRecipe.rows[0].videourl,
      price: parseFloat(updatedRecipe.rows[0].price),
      difficulty: updatedRecipe.rows[0].difficulty,
      cookingTime: updatedRecipe.rows[0].cookingtime,
      servings: updatedRecipe.rows[0].servings,
      category: updatedRecipe.rows[0].category,
      rating: parseFloat(updatedRecipe.rows[0].rating),
      totalRatings: parseInt(updatedRecipe.rows[0].totalratings),
      createdAt: updatedRecipe.rows[0].createdat,
      updatedAt: updatedRecipe.rows[0].updatedat,
      ingredients: insertedIngredients.map(ing => ({
        id: ing.recipeingredientid,
        label: ing.label,
        quantity: ing.quantity ? parseFloat(ing.quantity) : null,
        measurement: ing.measurement
      })),
      instructions: insertedInstructions
        .sort((a, b) => a.step - b.step)
        .map(inst => ({
          id: inst.recipeinstructionid,
          step: inst.step,
          content: inst.content
        })),
      nutrition: insertedNutrition.map(nut => ({
        id: nut.nutritionid,
        type: nut.type,
        quantity: nut.quantity ? parseFloat(nut.quantity) : null,
        measurement: nut.measurement
      }))
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete a recipe (admin only)
 * @param {number} recipeId - Recipe ID to delete
 * @returns {Promise<Object>} Deletion result with recipe title
 * @throws {Error} If recipe not found
 */
async function deleteRecipe(recipeId) {
  const client = await pool.connect();
  
  try {
    // Check if recipe exists
    const recipeCheck = await client.query(
      'SELECT recipetitle FROM Recipe WHERE recipeid = $1',
      [recipeId]
    );

    if (recipeCheck.rows.length === 0) {
      throw new Error('Recipe not found');
    }

    const recipeTitle = recipeCheck.rows[0].recipetitle;

    // Start transaction
    await client.query('BEGIN');

    // Delete recipe (CASCADE will handle related records: ingredients, instructions, nutrition, etc.)
    await client.query('DELETE FROM Recipe WHERE recipeid = $1', [recipeId]);

    // Commit transaction
    await client.query('COMMIT');

    return {
      recipeId,
      title: recipeTitle
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get recipes overview (public access)
 * @param {Object} options - Query options
 * @param {string} options.search - Search by title or category
 * @param {string} options.difficulty - Filter by difficulty (easy, medium, hard)
 * @param {string} options.cookingTime - Filter by cooking time range (<30, 30-60, 60-120, >120)
 * @param {string} options.sortBy - Sort by (price, newest, rating, popular)
 * @param {boolean} options.myRecipes - Filter to show only purchased recipes (requires userId)
 * @param {number} options.userId - User ID for myRecipes filter (optional)
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @returns {Promise<Object>} Recipes overview with pagination
 * @throws {Error} If myRecipes is true but userId is not provided
 */
async function getRecipesOverview(options = {}) {
  const {
    search,
    difficulty,
    cookingTime,
    sortBy = 'newest',
    myRecipes = false,
    userId = null,
    page = 1,
    limit = 20
  } = options;

  // Validate myRecipes filter
  if (myRecipes && !userId) {
    throw new Error('Authentication required to filter your purchased recipes');
  }

  let query = `
    SELECT 
      r.recipeid as id,
      r.recipetitle as title,
      r.description,
      r.videothumbnail,
      r.price,
      r.difficulty,
      r.cookingtime as "cookingTime",
      r.servings,
      r.category,
      r.viewcount as "viewCount",
      r.purchasecount as "purchaseCount",
      COALESCE(ROUND(AVG(rt.ratingscore)::numeric, 2), 0) as rating,
      COUNT(DISTINCT rt.ratingid) as "totalRatings"
    FROM Recipe r
    LEFT JOIN Rating rt ON r.recipeid = rt.recipeid
    WHERE r.isforsale = true
  `;

  const queryParams = [];
  let paramIndex = 1;
  
  // Filter by purchased recipes if myRecipes is true
  if (myRecipes && userId) {
    query += ` AND r.recipeid IN (SELECT recipeid FROM Purchase WHERE userid = $${paramIndex})`;
    queryParams.push(userId);
    paramIndex++;
  }

  // Search by title or category
  if (search) {
    query += ` AND (
      LOWER(r.recipetitle) LIKE LOWER($${paramIndex}) 
      OR LOWER(r.category) LIKE LOWER($${paramIndex})
    )`;
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  // Filter by difficulty
  if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
    query += ` AND LOWER(r.difficulty) = LOWER($${paramIndex})`;
    queryParams.push(difficulty);
    paramIndex++;
  }

  // Filter by cooking time
  if (cookingTime) {
    switch (cookingTime) {
      case '<30':
        query += ` AND r.cookingtime < $${paramIndex}`;
        queryParams.push(30);
        break;
      case '30-60':
        query += ` AND r.cookingtime >= $${paramIndex} AND r.cookingtime <= $${paramIndex + 1}`;
        queryParams.push(30, 60);
        paramIndex++;
        break;
      case '60-120':
        query += ` AND r.cookingtime > $${paramIndex} AND r.cookingtime <= $${paramIndex + 1}`;
        queryParams.push(60, 120);
        paramIndex++;
        break;
      case '>120':
        query += ` AND r.cookingtime > $${paramIndex}`;
        queryParams.push(120);
        break;
    }
    paramIndex++;
  }

  // Group by for aggregation
  query += ` GROUP BY r.recipeid, r.recipetitle, r.description, r.videothumbnail, r.price, 
    r.difficulty, r.cookingtime, r.servings, r.category, r.viewcount, r.purchasecount`;

  // Sorting
  switch (sortBy) {
    case 'price':
      query += ` ORDER BY r.price ASC, r.createdat DESC`;
      break;
    case 'newest':
      query += ` ORDER BY r.createdat DESC`;
      break;
    case 'rating':
      query += ` ORDER BY rating DESC, r.createdat DESC`;
      break;
    case 'popular':
      query += ` ORDER BY r.purchasecount DESC, r.viewcount DESC`;
      break;
    default:
      query += ` ORDER BY r.createdat DESC`;
  }

  // Pagination
  const offset = (page - 1) * limit;
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  queryParams.push(limit, offset);

  // Get total count for pagination
  let countQuery = `
    SELECT COUNT(DISTINCT r.recipeid) as total
    FROM Recipe r
    WHERE r.isforsale = true
  `;
  const countParams = [];
  let countParamIndex = 1;
  
  // Filter by purchased recipes if myRecipes is true
  if (myRecipes && userId) {
    countQuery += ` AND r.recipeid IN (SELECT recipeid FROM Purchase WHERE userid = $${countParamIndex})`;
    countParams.push(userId);
    countParamIndex++;
  }

  if (search) {
    countQuery += ` AND (
      LOWER(r.recipetitle) LIKE LOWER($${countParamIndex}) 
      OR LOWER(r.category) LIKE LOWER($${countParamIndex})
    )`;
    countParams.push(`%${search}%`);
    countParamIndex++;
  }

  if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
    countQuery += ` AND LOWER(r.difficulty) = LOWER($${countParamIndex})`;
    countParams.push(difficulty);
    countParamIndex++;
  }

  if (cookingTime) {
    switch (cookingTime) {
      case '<30':
        countQuery += ` AND r.cookingtime < $${countParamIndex}`;
        countParams.push(30);
        break;
      case '30-60':
        countQuery += ` AND r.cookingtime >= $${countParamIndex} AND r.cookingtime <= $${countParamIndex + 1}`;
        countParams.push(30, 60);
        countParamIndex++;
        break;
      case '60-120':
        countQuery += ` AND r.cookingtime > $${countParamIndex} AND r.cookingtime <= $${countParamIndex + 1}`;
        countParams.push(60, 120);
        countParamIndex++;
        break;
      case '>120':
        countQuery += ` AND r.cookingtime > $${countParamIndex}`;
        countParams.push(120);
        break;
    }
    countParamIndex++;
  }

  const [recipesResult, countResult] = await Promise.all([
    pool.query(query, queryParams),
    pool.query(countQuery, countParams)
  ]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    recipes: recipesResult.rows.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      videoThumbnail: recipe.videothumbnail,
      price: parseFloat(recipe.price),
      difficulty: recipe.difficulty,
      cookingTime: recipe.cookingTime,
      servings: recipe.servings,
      category: recipe.category,
      viewCount: recipe.viewCount,
      purchaseCount: recipe.purchaseCount,
      rating: parseFloat(recipe.rating),
      totalRatings: parseInt(recipe.totalRatings)
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages
    }
  };
}

/**
 * Get recipe detail (admin or purchased users only)
 * @param {number} recipeId - Recipe ID
 * @param {number} userId - User ID (null for unauthenticated)
 * @param {string} userRole - User role (null for unauthenticated)
 * @returns {Promise<Object>} Full recipe details
 * @throws {Error} If recipe not found or access denied
 */
async function getRecipeDetail(recipeId, userId = null, userRole = null) {
  const client = await pool.connect();
  
  try {
    // Check if recipe exists
    const recipeResult = await client.query(
      `SELECT 
        r.recipeid, r.recipetitle, r.description, r.videourl, r.videothumbnail,
        r.price, r.difficulty, r.cookingtime, r.servings, r.category,
        r.viewcount, r.purchasecount, r.createdat, r.updatedat,
        COALESCE(ROUND(AVG(rt.ratingscore)::numeric, 2), 0) as rating,
        COUNT(DISTINCT rt.ratingid) as totalratings
      FROM Recipe r
      LEFT JOIN Rating rt ON r.recipeid = rt.recipeid
      WHERE r.recipeid = $1
      GROUP BY r.recipeid, r.recipetitle, r.description, r.videourl, r.videothumbnail,
        r.price, r.difficulty, r.cookingtime, r.servings, r.category,
        r.viewcount, r.purchasecount, r.createdat, r.updatedat`,
      [recipeId]
    );

    if (recipeResult.rows.length === 0) {
      throw new Error('Recipe not found');
    }

    const recipe = recipeResult.rows[0];

    // Check access: admin or purchased user
    if (userRole !== 'admin' && userId) {
      const purchaseCheck = await client.query(
        'SELECT purchaseid FROM Purchase WHERE userid = $1 AND recipeid = $2',
        [userId, recipeId]
      );

      if (purchaseCheck.rows.length === 0) {
        throw new Error('Access denied. You must purchase this recipe to view details.');
      }
    } else if (!userId) {
      throw new Error('Access denied. Authentication required to view recipe details.');
    }

    // Increment view count
    await client.query(
      'UPDATE Recipe SET viewcount = viewcount + 1 WHERE recipeid = $1',
      [recipeId]
    );

    // Get ingredients
    const ingredientsResult = await client.query(
      `SELECT recipeingredientid as id, label, quantity, measurement
       FROM Recipe_Ingredient
       WHERE recipeid = $1
       ORDER BY recipeingredientid`,
      [recipeId]
    );

    // Get instructions
    const instructionsResult = await client.query(
      `SELECT recipeinstructionid as id, step, content
       FROM Recipe_Instruction
       WHERE recipeid = $1
       ORDER BY step ASC`,
      [recipeId]
    );

    // Get nutrition
    const nutritionResult = await client.query(
      `SELECT nutritionid as id, type, quantity, measurement
       FROM Nutrition
       WHERE recipeid = $1
       ORDER BY nutritionid`,
      [recipeId]
    );

    return {
      id: recipe.recipeid,
      title: recipe.recipetitle,
      description: recipe.description,
      videoUrl: recipe.videourl,
      videoThumbnail: recipe.videothumbnail,
      price: parseFloat(recipe.price),
      difficulty: recipe.difficulty,
      cookingTime: recipe.cookingtime,
      servings: recipe.servings,
      category: recipe.category,
      viewCount: recipe.viewcount + 1, // Already incremented
      purchaseCount: recipe.purchasecount,
      rating: parseFloat(recipe.rating),
      totalRatings: parseInt(recipe.totalratings),
      createdAt: recipe.createdat,
      updatedAt: recipe.updatedat,
      ingredients: ingredientsResult.rows.map(ing => ({
        id: ing.id,
        label: ing.label,
        quantity: ing.quantity ? parseFloat(ing.quantity) : null,
        measurement: ing.measurement
      })),
      instructions: instructionsResult.rows.map(inst => ({
        id: inst.id,
        step: inst.step,
        content: inst.content
      })),
      nutrition: nutritionResult.rows.map(nut => ({
        id: nut.id,
        type: nut.type,
        quantity: nut.quantity ? parseFloat(nut.quantity) : null,
        measurement: nut.measurement
      }))
    };

  } finally {
    client.release();
  }
}

/**
 * Verify user owns recipe (purchased)
 * @param {number} recipeId - Recipe ID
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if user has purchased the recipe
 */
async function verifyRecipeOwnership(recipeId, userId) {
  const result = await pool.query(
    'SELECT purchaseid FROM Purchase WHERE userid = $1 AND recipeid = $2',
    [userId, recipeId]
  );

  return result.rows.length > 0;
}

module.exports = {
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipesOverview,
  getRecipeDetail,
  verifyRecipeOwnership
};

