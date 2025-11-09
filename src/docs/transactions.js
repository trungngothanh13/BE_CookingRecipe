/**
 * @swagger
 * /api/transactions:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Create a transaction from cart
 *     description: Creates a new transaction from items in the user's cart. Creates Transaction and Transaction_Recipe entries, then clears the cart.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Transaction created successfully
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
 *                   example: "Transaction created successfully. Please submit payment proof."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       example: 2
 *                     totalAmount:
 *                       type: number
 *                       format: float
 *                       example: 19.98
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     recipes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           recipeId:
 *                             type: integer
 *                           recipeTitle:
 *                             type: string
 *                           price:
 *                             type: number
 *                     itemCount:
 *                       type: integer
 *       400:
 *         description: Cart is empty
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 *
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get user's transactions
 *     description: Retrieve all transactions for the authenticated user, optionally filtered by status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *         description: Filter by transaction status
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       userId:
 *                         type: integer
 *                       totalAmount:
 *                         type: number
 *                       paymentMethod:
 *                         type: string
 *                       paymentProof:
 *                         type: string
 *                       status:
 *                         type: string
 *                       adminNotes:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       verifiedAt:
 *                         type: string
 *                       verifiedBy:
 *                         type: integer
 *                       recipeCount:
 *                         type: integer
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 *
 * /api/transactions/all:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get all transactions (admin only)
 *     description: Retrieve all transactions with pagination and filtering options. Admin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 *
 * /api/transactions/{id}:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get transaction details
 *     description: Get detailed information about a specific transaction including all recipes. Users can only view their own transactions unless they are admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
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
 *                     id:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                     paymentMethod:
 *                       type: string
 *                     paymentProof:
 *                       type: string
 *                     status:
 *                       type: string
 *                     adminNotes:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                     verifiedAt:
 *                       type: string
 *                     verifiedBy:
 *                       type: integer
 *                     recipes:
 *                       type: array
 *                       items:
 *                         type: object
 *       403:
 *         description: Access denied
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 *
 * /api/transactions/{id}/payment:
 *   put:
 *     tags:
 *       - Transactions
 *     summary: Submit payment proof for a transaction
 *     description: Submit payment method and proof image for a pending transaction. Transaction must be in 'pending' status. The payment proof must be an image file (e.g., screenshot of bank transfer, payment receipt).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *               - paymentProof
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method (e.g., Bank Transfer, Paypal)
 *                 example: "Bank Transfer"
 *               paymentProof:
 *                 type: string
 *                 format: binary
 *                 description: "Payment proof image file (max 5MB). Accepted formats: jpg, jpeg, png, gif, webp"
 *           example:
 *             paymentMethod: "bank_transfer"
 *             paymentProof: "(binary file data)"
 *     responses:
 *       200:
 *         description: Payment proof submitted successfully
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
 *                   example: "Payment proof submitted successfully. Waiting for admin verification."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                     paymentMethod:
 *                       type: string
 *                     paymentProof:
 *                       type: string
 *                       description: URL of uploaded payment proof image
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     createdAt:
 *                       type: string
 *       400:
 *         description: Invalid input, missing file, or transaction already processed
 *       403:
 *         description: Access denied
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 *
 * /api/transactions/{id}/verify:
 *   put:
 *     tags:
 *       - Transactions
 *     summary: Verify a transaction (admin only)
 *     description: Verify a pending transaction. This creates Purchase entries for all recipes in the transaction and updates Recipe.PurchaseCount. Admin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *         example: 1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminNotes:
 *                 type: string
 *                 description: Optional admin notes
 *                 example: "Payment verified successfully"
 *           example:
 *             adminNotes: "Payment verified successfully"
 *     responses:
 *       200:
 *         description: Transaction verified successfully
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
 *                   example: "Transaction verified successfully. Purchase entries created."
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: "verified"
 *                     purchaseCount:
 *                       type: integer
 *                     purchaseIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *       400:
 *         description: Transaction already processed or invalid
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 *
 * /api/transactions/{id}/reject:
 *   put:
 *     tags:
 *       - Transactions
 *     summary: Reject a transaction (admin only)
 *     description: Reject a pending transaction. Admin notes are required to explain the rejection. Admin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminNotes
 *             properties:
 *               adminNotes:
 *                 type: string
 *                 description: Admin notes explaining rejection
 *                 example: "Payment proof is unclear or invalid"
 *           example:
 *             adminNotes: "Payment proof is unclear or invalid"
 *     responses:
 *       200:
 *         description: Transaction rejected successfully
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
 *                   example: "Transaction rejected successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: "rejected"
 *                     adminNotes:
 *                       type: string
 *       400:
 *         description: Invalid input or transaction already processed
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */

