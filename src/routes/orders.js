const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('./auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         orderId:
 *           type: integer
 *           description: Order ID
 *         userId:
 *           type: integer
 *           description: User ID who made the order
 *         totalAmount:
 *           type: number
 *           format: float
 *           description: Total amount in USD
 *         status:
 *           type: string
 *           enum: [pending, paid, cancelled, refunded]
 *           description: Order status
 *         paymentMethod:
 *           type: string
 *           description: Payment method used
 *         paymentIntentId:
 *           type: string
 *           description: Payment provider transaction ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Order creation date
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *     OrderItem:
 *       type: object
 *       properties:
 *         orderItemId:
 *           type: integer
 *           description: Order item ID
 *         recipeId:
 *           type: integer
 *           description: Recipe ID
 *         price:
 *           type: number
 *           format: float
 *           description: Price at time of purchase
 *         quantity:
 *           type: integer
 *           description: Quantity ordered
 *         recipe:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *               description: Recipe title
 *             youtubeVideoId:
 *               type: string
 *               description: YouTube video ID
 *             videoThumbnail:
 *               type: string
 *               description: Video thumbnail URL
 *     NewOrder:
 *       type: object
 *       required:
 *         - items
 *       properties:
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - recipeId
 *               - quantity
 *             properties:
 *               recipeId:
 *                 type: integer
 *                 description: Recipe ID to purchase
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity to purchase
 *         paymentMethod:
 *           type: string
 *           description: Payment method (stripe, paypal, etc.)
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     description: Create a new order for purchasing recipes (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewOrder'
 *           example:
 *             items:
 *               - recipeId: 1
 *                 quantity: 1
 *               - recipeId: 2
 *                 quantity: 2
 *             paymentMethod: "stripe"
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *                   example: "Order created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
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
    const { items, paymentMethod = 'stripe' } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.recipeId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have recipeId and quantity >= 1'
        });
      }

      // Get recipe details and price
      const recipeResult = await client.query(
        'SELECT recipeid, recipetitle, price, isforsale FROM Recipe WHERE recipeid = $1',
        [item.recipeId]
      );

      if (recipeResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Recipe with ID ${item.recipeId} not found`
        });
      }

      const recipe = recipeResult.rows[0];
      
      if (!recipe.isforsale) {
        return res.status(400).json({
          success: false,
          message: `Recipe "${recipe.recipetitle}" is not available for purchase`
        });
      }

      const itemTotal = recipe.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        recipeId: item.recipeId,
        quantity: item.quantity,
        price: recipe.price,
        title: recipe.recipetitle
      });
    }

    // Start transaction
    await client.query('BEGIN');

    // Create order
    const orderResult = await client.query(
      `INSERT INTO Orders (userid, totalamount, paymentmethod, status) 
       VALUES ($1, $2, $3, 'pending') 
       RETURNING orderid, userid, totalamount, status, paymentmethod, createdat`,
      [userId, totalAmount, paymentMethod]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO OrderItems (orderid, recipeid, price, quantity) 
         VALUES ($1, $2, $3, $4)`,
        [order.orderid, item.recipeId, item.price, item.quantity]
      );
    }

    // Commit transaction
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.orderid,
        userId: order.userid,
        totalAmount: parseFloat(order.totalamount),
        status: order.status,
        paymentMethod: order.paymentmethod,
        createdAt: order.createdat,
        items: validatedItems
      }
    });

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user's orders
 *     description: Retrieve all orders for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                     $ref: '#/components/schemas/Order'
 *                 count:
 *                   type: integer
 *                   example: 3
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const ordersQuery = `
      SELECT 
        o.orderid as orderId,
        o.userid as userId,
        o.totalamount as totalAmount,
        o.status,
        o.paymentmethod as paymentMethod,
        o.paymentintentid as paymentIntentId,
        o.createdat as createdAt,
        o.updatedat as updatedAt
      FROM Orders o
      WHERE o.userid = $1
      ORDER BY o.createdat DESC
    `;

    const ordersResult = await pool.query(ordersQuery, [userId]);
    const orders = ordersResult.rows;

    // Get order items for each order
    for (const order of orders) {
      const itemsQuery = `
        SELECT 
          oi.orderitemid as orderItemId,
          oi.recipeid as recipeId,
          oi.price,
          oi.quantity,
          r.recipetitle as title,
          r.youtubevideoid as youtubeVideoId,
          r.videothumbnail as videoThumbnail
        FROM OrderItems oi
        JOIN Recipe r ON oi.recipeid = r.recipeid
        WHERE oi.orderid = $1
        ORDER BY oi.createdat
      `;

      const itemsResult = await pool.query(itemsQuery, [order.orderid]);
      order.items = itemsResult.rows;
    }

    res.json({
      success: true,
      data: orders,
      count: orders.length
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/orders/{id}/complete:
 *   post:
 *     summary: Complete an order
 *     description: Mark an order as paid and grant access to purchased recipes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *                 description: Payment provider transaction ID
 *                 example: "pi_1234567890"
 *     responses:
 *       200:
 *         description: Order completed successfully
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
 *                   example: "Order completed successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:id/complete', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const orderId = parseInt(req.params.id);
    const { paymentIntentId } = req.body;
    const userId = req.user.userId;

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Check if order exists and belongs to user
    const orderCheck = await client.query(
      'SELECT orderid, userid, status FROM Orders WHERE orderid = $1',
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (orderCheck.rows[0].userid !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only complete your own orders'
      });
    }

    if (orderCheck.rows[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in pending status'
      });
    }

    // Start transaction
    await client.query('BEGIN');

    // Update order status
    await client.query(
      `UPDATE Orders 
       SET status = 'paid', paymentintentid = $1, updatedat = CURRENT_TIMESTAMP
       WHERE orderid = $2`,
      [paymentIntentId, orderId]
    );

    // Get order items
    const itemsResult = await client.query(
      'SELECT recipeid FROM OrderItems WHERE orderid = $1',
      [orderId]
    );

    // Grant access to purchased recipes
    for (const item of itemsResult.rows) {
      // Check if user already has access
      const existingPurchase = await client.query(
        'SELECT purchaseid FROM UserPurchases WHERE userid = $1 AND recipeid = $2',
        [userId, item.recipeid]
      );

      if (existingPurchase.rows.length === 0) {
        // Grant access
        await client.query(
          `INSERT INTO UserPurchases (userid, recipeid, orderid) 
           VALUES ($1, $2, $3)`,
          [userId, item.recipeid, orderId]
        );

        // Update purchase count
        await client.query(
          'UPDATE Recipe SET purchasecount = purchasecount + 1 WHERE recipeid = $1',
          [item.recipeid]
        );
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Order completed successfully'
    });

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Complete order error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to complete order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/orders/purchases:
 *   get:
 *     summary: Get user's purchased recipes
 *     description: Retrieve all recipes that the user has purchased
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchased recipes retrieved successfully
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
 *                       recipeId:
 *                         type: integer
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: "Spaghetti Carbonara"
 *                       youtubeVideoId:
 *                         type: string
 *                         example: "dQw4w9WgXcQ"
 *                       videoThumbnail:
 *                         type: string
 *                         example: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
 *                       purchaseDate:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T14:30:00Z"
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.get('/purchases', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = `
      SELECT 
        r.recipeid as recipeId,
        r.recipetitle as title,
        r.youtubevideoid as youtubeVideoId,
        r.videothumbnail as videoThumbnail,
        r.description,
        r.duration as cookingTime,
        r.difficulty,
        r.servings,
        r.category,
        up.purchasedate as purchaseDate
      FROM UserPurchases up
      JOIN Recipe r ON up.recipeid = r.recipeid
      WHERE up.userid = $1
      ORDER BY up.purchasedate DESC
    `;

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchased recipes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
