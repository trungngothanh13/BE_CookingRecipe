/**
 * @swagger
 * /api/cart:
 *   post:
 *     tags:
 *       - Cart
 *     summary: Add a recipe to cart
 *     description: Add a recipe to the user's shopping cart. Prevents adding recipes already owned or already in cart.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipeId
 *             properties:
 *               recipeId:
 *                 type: integer
 *                 description: Recipe ID to add to cart
 *                 example: 1
 *           example:
 *             recipeId: 1
 *     responses:
 *       201:
 *         description: Recipe added to cart successfully
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
 *                   example: "Recipe added to cart successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       example: 2
 *                     recipeId:
 *                       type: integer
 *                       example: 1
 *                     recipeTitle:
 *                       type: string
 *                       example: "Spaghetti Carbonara"
 *                     price:
 *                       type: number
 *                       format: float
 *                       example: 9.99
 *                     addedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Recipe not found, already in cart, or already owned
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 *
 *   get:
 *     tags:
 *       - Cart
 *     summary: Get user's cart
 *     description: Retrieve the user's shopping cart with all items and total amount
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
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
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           recipeId:
 *                             type: integer
 *                             example: 1
 *                           title:
 *                             type: string
 *                             example: "Spaghetti Carbonara"
 *                           videoThumbnail:
 *                             type: string
 *                             nullable: true
 *                           price:
 *                             type: number
 *                             format: float
 *                             example: 9.99
 *                           difficulty:
 *                             type: string
 *                             enum: [easy, medium, hard]
 *                           cookingTime:
 *                             type: integer
 *                             example: 20
 *                           category:
 *                             type: string
 *                             example: "Italian"
 *                           addedAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: number
 *                       format: float
 *                       example: 19.98
 *                     itemCount:
 *                       type: integer
 *                       example: 2
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 *
 * /api/cart/{recipeId}:
 *   delete:
 *     tags:
 *       - Cart
 *     summary: Remove a recipe from cart
 *     description: Remove a specific recipe from the user's shopping cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Recipe ID to remove from cart
 *         example: 1
 *     responses:
 *       200:
 *         description: Recipe removed from cart successfully
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
 *                   example: "Recipe removed from cart successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cartId:
 *                       type: integer
 *                       example: 1
 *                     recipeId:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Item not found in cart
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */

