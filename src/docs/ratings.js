/**
 * @swagger
 * components:
 *   schemas:
 *     Rating:
 *       type: object
 *       required:
 *         - ratingScore
 *       properties:
 *         ratingScore:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating score from 1 to 5
 *         comment:
 *           type: string
 *           description: Optional comment/review
 */

/**
 * @swagger
 * /api/ratings/recipe/{recipeId}:
 *   post:
 *     tags:
 *       - Ratings
 *     summary: Create or update a rating for a recipe
 *     description: Rate a recipe (only users who have purchased the recipe can rate). If rating exists, it will be updated.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Recipe ID to rate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Rating'
 *           example:
 *             ratingScore: 5
 *             comment: "Amazing recipe! Very easy to follow and delicious results."
 *     responses:
 *       200:
 *         description: Rating created/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Rating submitted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     recipeId:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     ratingScore:
 *                       type: integer
 *                     comment:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Must purchase recipe before rating
 *       404:
 *         description: Recipe not found
 */

/**
 * @swagger
 * /api/ratings/recipe/{recipeId}:
 *   get:
 *     tags:
 *       - Ratings
 *     summary: Get all ratings for a recipe
 *     description: Get all ratings and reviews for a specific recipe (public access)
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Recipe ID
 *     responses:
 *       200:
 *         description: Ratings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     average:
 *                       type: number
 *                       example: 4.5
 *                     total:
 *                       type: integer
 *                       example: 10
 *                     ratings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           recipeId:
 *                             type: integer
 *                           userId:
 *                             type: integer
 *                           username:
 *                             type: string
 *                           ratingScore:
 *                             type: integer
 *                           comment:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Recipe not found
 */

/**
 * @swagger
 * /api/ratings/my-rating/{recipeId}:
 *   get:
 *     tags:
 *       - Ratings
 *     summary: Get current user's rating for a recipe
 *     description: Get the authenticated user's rating for a specific recipe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Recipe ID
 *     responses:
 *       200:
 *         description: User rating retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: integer
 *                     recipeId:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     ratingScore:
 *                       type: integer
 *                     comment:
 *                       type: string
 *       401:
 *         description: Authentication required
 */

/**
 * @swagger
 * /api/ratings/{ratingId}:
 *   delete:
 *     tags:
 *       - Ratings
 *     summary: Delete a rating
 *     description: Delete your own rating for a recipe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ratingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rating ID to delete
 *     responses:
 *       200:
 *         description: Rating deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to delete this rating
 *       404:
 *         description: Rating not found
 */