const pool = require('../config/database');

/**
 * Add a recipe to user's cart
 * @param {number} userId - User ID
 * @param {number} recipeId - Recipe ID to add
 * @returns {Promise<Object>} Cart item data
 * @throws {Error} If recipe not found, already in cart, or not for sale
 */
async function addToCart(userId, recipeId) {
  const client = await pool.connect();
  
  try {
    // Check if recipe exists and is for sale
    const recipeCheck = await client.query(
      'SELECT recipeid, recipetitle, price, isforsale FROM Recipe WHERE recipeid = $1',
      [recipeId]
    );

    if (recipeCheck.rows.length === 0) {
      throw new Error('Recipe not found');
    }

    const recipe = recipeCheck.rows[0];

    if (!recipe.isforsale) {
      throw new Error('Recipe is not available for purchase');
    }

    // Check if already in cart
    const existingCart = await client.query(
      'SELECT cartid FROM Cart WHERE userid = $1 AND recipeid = $2',
      [userId, recipeId]
    );

    if (existingCart.rows.length > 0) {
      throw new Error('Recipe is already in your cart');
    }

    // Check if user already owns this recipe
    const purchaseCheck = await client.query(
      'SELECT purchaseid FROM Purchase WHERE userid = $1 AND recipeid = $2',
      [userId, recipeId]
    );

    if (purchaseCheck.rows.length > 0) {
      throw new Error('You already own this recipe');
    }

    // Add to cart
    const result = await client.query(
      'INSERT INTO Cart (userid, recipeid) VALUES ($1, $2) RETURNING cartid, userid, recipeid, addedat',
      [userId, recipeId]
    );

    return {
      id: result.rows[0].cartid,
      userId: result.rows[0].userid,
      recipeId: result.rows[0].recipeid,
      recipeTitle: recipe.recipetitle,
      price: parseFloat(recipe.price),
      addedAt: result.rows[0].addedat
    };

  } finally {
    client.release();
  }
}

/**
 * Remove a recipe from user's cart
 * @param {number} userId - User ID
 * @param {number} recipeId - Recipe ID to remove
 * @returns {Promise<Object>} Deletion result
 * @throws {Error} If item not found in cart
 */
async function removeFromCart(userId, recipeId) {
  const result = await pool.query(
    'DELETE FROM Cart WHERE userid = $1 AND recipeid = $2 RETURNING cartid',
    [userId, recipeId]
  );

  if (result.rows.length === 0) {
    throw new Error('Item not found in cart');
  }

  return {
    cartId: result.rows[0].cartid,
    recipeId
  };
}

/**
 * Get user's cart with recipe details and total
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Cart data with items and total
 */
async function getCart(userId) {
  const result = await pool.query(
    `SELECT 
      c.cartid as id,
      c.recipeid as "recipeId",
      r.recipetitle as title,
      r.videothumbnail as "videoThumbnail",
      r.price,
      r.difficulty,
      r.cookingtime as "cookingTime",
      r.category,
      c.addedat as "addedAt"
    FROM Cart c
    JOIN Recipe r ON c.recipeid = r.recipeid
    WHERE c.userid = $1 AND r.isforsale = true
    ORDER BY c.addedat DESC`,
    [userId]
  );

  const items = result.rows.map(item => ({
    id: item.id,
    recipeId: item.recipeId,
    title: item.title,
    videoThumbnail: item.videoThumbnail,
    price: parseFloat(item.price),
    difficulty: item.difficulty,
    cookingTime: item.cookingTime,
    category: item.category,
    addedAt: item.addedAt
  }));

  const total = items.reduce((sum, item) => sum + item.price, 0);

  return {
    items,
    total: parseFloat(total.toFixed(2)),
    itemCount: items.length
  };
}

/**
 * Clear user's cart (after transaction creation)
 * @param {number} userId - User ID
 * @param {Array<number>} recipeIds - Optional: specific recipe IDs to remove (if not provided, clears all)
 * @returns {Promise<number>} Number of items removed
 */
async function clearCart(userId, recipeIds = null) {
  let result;
  
  if (recipeIds && recipeIds.length > 0) {
    // Remove specific recipes
    result = await pool.query(
      'DELETE FROM Cart WHERE userid = $1 AND recipeid = ANY($2::int[])',
      [userId, recipeIds]
    );
  } else {
    // Clear entire cart
    result = await pool.query(
      'DELETE FROM Cart WHERE userid = $1',
      [userId]
    );
  }

  return result.rowCount;
}

module.exports = {
  addToCart,
  removeFromCart,
  getCart,
  clearCart
};

