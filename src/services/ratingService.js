const pool = require('../config/database');

/**
 * Create or update a rating for a recipe (only purchasers can rate)
 * @param {number} userId - User ID rating the recipe
 * @param {number} recipeId - Recipe ID being rated
 * @param {number} ratingScore - Rating score (1-5)
 * @param {string} comment - Optional comment
 * @returns {Promise<Object>} Rating data
 * @throws {Error} If user hasn't purchased the recipe or validation fails
 */
async function createOrUpdateRating(userId, recipeId, ratingScore, comment = null) {
  const client = await pool.connect();
  
  try {
    // Validate rating score
    if (!ratingScore || isNaN(ratingScore) || ratingScore < 1 || ratingScore > 5) {
      throw new Error('Rating score must be between 1 and 5');
    }

    // Check if user has purchased the recipe
    const purchaseCheck = await client.query(
      'SELECT purchaseid FROM Purchase WHERE userid = $1 AND recipeid = $2',
      [userId, recipeId]
    );

    if (purchaseCheck.rows.length === 0) {
      throw new Error('You must purchase this recipe before rating it');
    }

    // Check if recipe exists
    const recipeCheck = await client.query(
      'SELECT recipeid FROM Recipe WHERE recipeid = $1',
      [recipeId]
    );

    if (recipeCheck.rows.length === 0) {
      throw new Error('Recipe not found');
    }

    // Start transaction
    await client.query('BEGIN');

    // Check if rating already exists
    const existingRating = await client.query(
      'SELECT ratingid FROM Rating WHERE userid = $1 AND recipeid = $2',
      [userId, recipeId]
    );

    let ratingResult;
    if (existingRating.rows.length > 0) {
      // Update existing rating
      ratingResult = await client.query(
        `UPDATE Rating 
         SET ratingscore = $1, comment = $2, updatedat = CURRENT_TIMESTAMP
         WHERE userid = $3 AND recipeid = $4
         RETURNING ratingid, recipeid, userid, ratingscore, comment, createdat, updatedat`,
        [ratingScore, comment?.trim() || null, userId, recipeId]
      );
    } else {
      // Create new rating
      ratingResult = await client.query(
        `INSERT INTO Rating (recipeid, userid, ratingscore, comment) 
         VALUES ($1, $2, $3, $4)
         RETURNING ratingid, recipeid, userid, ratingscore, comment, createdat, updatedat`,
        [recipeId, userId, ratingScore, comment?.trim() || null]
      );
    }

    // Commit transaction
    await client.query('COMMIT');

    const rating = ratingResult.rows[0];

    return {
      id: rating.ratingid,
      recipeId: rating.recipeid,
      userId: rating.userid,
      ratingScore: rating.ratingscore,
      comment: rating.comment,
      createdAt: rating.createdat,
      updatedAt: rating.updatedat
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all ratings for a recipe
 * @param {number} recipeId - Recipe ID
 * @returns {Promise<Object>} Ratings data with average and list
 */
async function getRecipeRatings(recipeId) {
  try {
    // Check if recipe exists
    const recipeCheck = await pool.query(
      'SELECT recipeid FROM Recipe WHERE recipeid = $1',
      [recipeId]
    );

    if (recipeCheck.rows.length === 0) {
      throw new Error('Recipe not found');
    }

    // Get ratings with user info
    const ratingsResult = await pool.query(
      `SELECT 
        r.ratingid as id,
        r.recipeid as "recipeId",
        r.userid as "userId",
        u.username,
        r.ratingscore as "ratingScore",
        r.comment,
        r.createdat as "createdAt",
        r.updatedat as "updatedAt"
      FROM Rating r
      JOIN "User" u ON r.userid = u.userid
      WHERE r.recipeid = $1
      ORDER BY r.createdat DESC`,
      [recipeId]
    );

    // Calculate average rating
    const avgResult = await pool.query(
      `SELECT 
        COALESCE(ROUND(AVG(ratingscore)::numeric, 2), 0) as average,
        COUNT(*) as total
      FROM Rating
      WHERE recipeid = $1`,
      [recipeId]
    );

    return {
      average: parseFloat(avgResult.rows[0].average),
      total: parseInt(avgResult.rows[0].total),
      ratings: ratingsResult.rows.map(rating => ({
        id: rating.id,
        recipeId: rating.recipeId,
        userId: rating.userId,
        username: rating.username,
        ratingScore: rating.ratingScore,
        comment: rating.comment,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt
      }))
    };

  } catch (error) {
    throw error;
  }
}

/**
 * Delete a rating (user can delete their own rating)
 * @param {number} ratingId - Rating ID
 * @param {number} userId - User ID requesting deletion
 * @returns {Promise<Object>} Deletion result
 * @throws {Error} If rating not found or user doesn't own it
 */
async function deleteRating(ratingId, userId) {
  const client = await pool.connect();
  
  try {
    // Check if rating exists and belongs to user
    const ratingCheck = await client.query(
      'SELECT ratingid, recipeid FROM Rating WHERE ratingid = $1 AND userid = $2',
      [ratingId, userId]
    );

    if (ratingCheck.rows.length === 0) {
      throw new Error('Rating not found or you do not have permission to delete it');
    }

    // Start transaction
    await client.query('BEGIN');

    // Delete rating
    await client.query('DELETE FROM Rating WHERE ratingid = $1', [ratingId]);

    // Commit transaction
    await client.query('COMMIT');

    return {
      ratingId,
      recipeId: ratingCheck.rows[0].recipeid
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createOrUpdateRating,
  getRecipeRatings,
  deleteRating
};

