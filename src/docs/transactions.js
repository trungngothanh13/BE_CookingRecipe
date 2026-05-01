/**
 * @swagger
 * /api/transactions:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create order from cart
 *     description: Creates an order from current cart items and clears the cart.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Cart is empty
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 *
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get current user's orders
 *     description: Returns the authenticated user's orders. Optional filter by status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 *
 * /api/transactions/all:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get all orders (admin)
 *     description: Admin endpoint for listing all orders with pagination/filtering.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 *
 * /api/transactions/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get one order detail
 *     description: Users can view their own order, admins can view any order.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order detail retrieved successfully
 *       400:
 *         description: Invalid order id
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 *
 * /api/transactions/{id}/payment:
 *   put:
 *     tags:
 *       - Orders
 *     summary: Submit payment proof for an order
 *     description: Uploads payment proof image and payment method.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *               paymentProof:
 *                 type: string
 *                 format: binary
 *             required:
 *               - paymentMethod
 *               - paymentProof
 *     responses:
 *       200:
 *         description: Payment proof submitted successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 *
 * /api/transactions/{id}/verify:
 *   put:
 *     tags:
 *       - Orders
 *     summary: Verify order payment (admin)
 *     description: Marks order verified and grants course access to purchaser.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order verified successfully
 *       400:
 *         description: Order cannot be verified
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 *
 * /api/transactions/{id}/reject:
 *   put:
 *     tags:
 *       - Orders
 *     summary: Reject order payment (admin)
 *     description: Marks order rejected.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order rejected successfully
 *       400:
 *         description: Order cannot be rejected
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
