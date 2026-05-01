/**
 * @swagger
 * /api/cart:
 *   post:
 *     tags:
 *       - Cart
 *     summary: Add a course to cart
 *     description: Add a course to the authenticated user's cart.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseId:
 *                 type: integer
 *                 example: 3
 *             required:
 *               - courseId
 *     responses:
 *       201:
 *         description: Course added to cart successfully
 *       400:
 *         description: Invalid payload or add-to-cart rejected
 *       401:
 *         description: Authentication required
 *       409:
 *         description: Course already purchased
 *       500:
 *         description: Server error
 *
 *   get:
 *     tags:
 *       - Cart
 *     summary: Get authenticated user's cart
 *     description: Returns cart items, total price, and item count.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 *
 * /api/cart/{courseId}:
 *   delete:
 *     tags:
 *       - Cart
 *     summary: Remove a course from cart
 *     description: Remove one course item from the authenticated user's cart.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID to remove
 *     responses:
 *       200:
 *         description: Course removed from cart successfully
 *       400:
 *         description: Invalid course id or removal failure
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
