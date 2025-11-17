const pool = require('../config/database');

/**
 * Create a transaction from user's cart
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Created transaction with recipes
 * @throws {Error} If cart is empty or validation fails
 */
async function createTransaction(userId) {
  const client = await pool.connect();
  
  try {
    // Get cart items with current prices
    const cartResult = await client.query(
      `SELECT 
        c.recipeid,
        r.recipetitle,
        r.price
      FROM Cart c
      JOIN Recipe r ON c.recipeid = r.recipeid
      WHERE c.userid = $1 AND r.isforsale = true`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate total
    const total = cartResult.rows.reduce((sum, item) => sum + parseFloat(item.price), 0);

    // Start transaction
    await client.query('BEGIN');

    // Create transaction
    const transactionResult = await client.query(
      `INSERT INTO Transaction (userid, totalamount, status)
       VALUES ($1, $2, 'pending')
       RETURNING transactionid, userid, totalamount, status, createdat`,
      [userId, total]
    );

    const transaction = transactionResult.rows[0];
    const transactionId = transaction.transactionid;

    // Create Transaction_Recipe entries
    const transactionRecipes = [];
    for (const item of cartResult.rows) {
      const trResult = await client.query(
        `INSERT INTO Transaction_Recipe (transactionid, recipeid, price)
         VALUES ($1, $2, $3)
         RETURNING transactionid, recipeid, price`,
        [transactionId, item.recipeid, item.price]
      );
      transactionRecipes.push({
        recipeId: trResult.rows[0].recipeid,
        recipeTitle: item.recipetitle,
        price: parseFloat(trResult.rows[0].price)
      });
    }

    // Clear cart
    await client.query(
      'DELETE FROM Cart WHERE userid = $1',
      [userId]
    );

    // Commit transaction
    await client.query('COMMIT');

    return {
      id: transaction.transactionid,
      userId: transaction.userid,
      totalAmount: parseFloat(transaction.totalamount),
      status: transaction.status,
      createdAt: transaction.createdat,
      recipes: transactionRecipes,
      itemCount: transactionRecipes.length
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Submit payment proof for a transaction
 * @param {number} transactionId - Transaction ID
 * @param {number} userId - User ID (to verify ownership)
 * @param {string} paymentMethod - Payment method (e.g., 'bank_transfer', 'paypal', etc.)
 * @param {string} paymentProof - Payment proof URL or text
 * @returns {Promise<Object>} Updated transaction
 * @throws {Error} If transaction not found, not owned by user, or already verified
 */
async function submitPayment(transactionId, userId, paymentMethod, paymentProof) {
  const client = await pool.connect();
  
  try {
    // Check if transaction exists and belongs to user
    const transactionCheck = await client.query(
      'SELECT transactionid, status FROM Transaction WHERE transactionid = $1 AND userid = $2',
      [transactionId, userId]
    );

    if (transactionCheck.rows.length === 0) {
      throw new Error('Transaction not found or you do not have permission to update it');
    }

    const transaction = transactionCheck.rows[0];

    if (transaction.status !== 'pending') {
      throw new Error(`Cannot submit payment for transaction with status: ${transaction.status}`);
    }

    // Validation
    if (!paymentMethod || paymentMethod.trim().length === 0) {
      throw new Error('Payment method is required');
    }

    if (!paymentProof || paymentProof.trim().length === 0) {
      throw new Error('Payment proof is required');
    }

    // Update transaction
    const result = await client.query(
      `UPDATE Transaction 
       SET paymentmethod = $1, paymentproof = $2
       WHERE transactionid = $3
       RETURNING transactionid, userid, totalamount, paymentmethod, paymentproof, status, createdat`,
      [paymentMethod.trim(), paymentProof.trim(), transactionId]
    );

    return {
      id: result.rows[0].transactionid,
      userId: result.rows[0].userid,
      totalAmount: parseFloat(result.rows[0].totalamount),
      paymentMethod: result.rows[0].paymentmethod,
      paymentProof: result.rows[0].paymentproof,
      status: result.rows[0].status,
      createdAt: result.rows[0].createdat
    };

  } finally {
    client.release();
  }
}

/**
 * Get user's transactions
 * @param {number} userId - User ID
 * @param {string} status - Optional: filter by status (pending, verified, rejected)
 * @returns {Promise<Array>} List of transactions
 */
async function getUserTransactions(userId, status = null) {
  let query = `
    SELECT 
      t.transactionid as id,
      t.userid as "userId",
      t.totalamount as "totalAmount",
      t.paymentmethod as "paymentMethod",
      t.paymentproof as "paymentProof",
      t.status,
      t.adminnotes as "adminNotes",
      t.createdat as "createdAt",
      t.verifiedat as "verifiedAt",
      t.verifiedby as "verifiedBy",
      COUNT(tr.recipeid) as "recipeCount"
    FROM Transaction t
    LEFT JOIN Transaction_Recipe tr ON t.transactionid = tr.transactionid
    WHERE t.userid = $1
  `;
  
  const params = [userId];
  
  if (status) {
    query += ' AND t.status = $2';
    params.push(status);
  }
  
  query += `
    GROUP BY t.transactionid, t.userid, t.totalamount, t.paymentmethod, t.paymentproof,
             t.status, t.adminnotes, t.createdat, t.verifiedat, t.verifiedby
    ORDER BY t.createdat DESC
  `;

  const result = await pool.query(query, params);

  return result.rows.map(transaction => ({
    id: transaction.id,
    userId: transaction.userId,
    totalAmount: parseFloat(transaction.totalAmount),
    paymentMethod: transaction.paymentMethod,
    paymentProof: transaction.paymentProof,
    status: transaction.status,
    adminNotes: transaction.adminNotes,
    createdAt: transaction.createdAt,
    verifiedAt: transaction.verifiedAt,
    verifiedBy: transaction.verifiedBy,
    recipeCount: parseInt(transaction.recipeCount)
  }));
}

/**
 * Get all transactions (admin only)
 * @param {Object} options - Filter options
 * @param {string} options.status - Filter by status
 * @param {number} options.userId - Filter by user ID
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @returns {Promise<Object>} Transactions with pagination
 */
async function getAllTransactions(options = {}) {
  const {
    status = null,
    userId = null,
    page = 1,
    limit = 20
  } = options;

  let query = `
    SELECT 
      t.transactionid as id,
      t.userid as "userId",
      u.username,
      t.totalamount as "totalAmount",
      t.paymentmethod as "paymentMethod",
      t.paymentproof as "paymentProof",
      t.status,
      t.createdat as "createdAt",
      t.verifiedat as "verifiedAt",
      COUNT(tr.recipeid) as "recipeCount"
    FROM Transaction t
    LEFT JOIN "User" u ON t.userid = u.userid
    LEFT JOIN Transaction_Recipe tr ON t.transactionid = tr.transactionid
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (status) {
    query += ` AND t.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (userId) {
    query += ` AND t.userid = $${paramIndex}`;
    params.push(userId);
    paramIndex++;
  }

  query += `
    GROUP BY t.transactionid, t.userid, u.username, t.totalamount, 
             t.paymentmethod, t.paymentproof, t.status, t.createdat, t.verifiedat
    ORDER BY t.createdat DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, (page - 1) * limit);

  // Count query
  let countQuery = 'SELECT COUNT(DISTINCT transactionid) as total FROM Transaction WHERE 1=1';
  const countParams = [];
  let countParamIndex = 1;

  if (status) {
    countQuery += ` AND status = $${countParamIndex}`;
    countParams.push(status);
    countParamIndex++;
  }

  if (userId) {
    countQuery += ` AND userid = $${countParamIndex}`;
    countParams.push(userId);
    countParamIndex++;
  }

  const [transactionsResult, countResult] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, countParams)
  ]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    transactions: transactionsResult.rows.map(t => ({
      id: t.id,
      userId: t.userId,
      username: t.username,
      totalAmount: parseFloat(t.totalAmount),
      paymentMethod: t.paymentMethod,
      paymentProof: t.paymentProof,
      status: t.status,
      createdAt: t.createdAt,
      verifiedAt: t.verifiedAt,
      recipeCount: parseInt(t.recipeCount)
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
 * Verify a transaction (admin only)
 * Creates Purchase entries and updates Recipe.PurchaseCount
 * @param {number} transactionId - Transaction ID
 * @param {number} adminId - Admin user ID
 * @param {string} adminNotes - Optional admin notes
 * @returns {Promise<Object>} Verification result
 * @throws {Error} If transaction not found, already verified, or verification fails
 */
async function verifyTransaction(transactionId, adminId, adminNotes = null) {
  const client = await pool.connect();
  
  try {
    // Check if transaction exists and is pending
    const transactionCheck = await client.query(
      'SELECT transactionid, userid, status FROM Transaction WHERE transactionid = $1',
      [transactionId]
    );

    if (transactionCheck.rows.length === 0) {
      throw new Error('Transaction not found');
    }

    const transaction = transactionCheck.rows[0];

    if (transaction.status === 'verified') {
      throw new Error('Transaction is already verified');
    }

    if (transaction.status === 'rejected') {
      throw new Error('Cannot verify a rejected transaction');
    }

    // Get recipes in transaction
    const recipesResult = await client.query(
      'SELECT recipeid, price FROM Transaction_Recipe WHERE transactionid = $1',
      [transactionId]
    );

    if (recipesResult.rows.length === 0) {
      throw new Error('Transaction has no recipes');
    }

    // Start transaction
    await client.query('BEGIN');

    // Update transaction status
    await client.query(
      `UPDATE Transaction 
       SET status = 'verified', 
           verifiedat = CURRENT_TIMESTAMP,
           verifiedby = $1,
           adminnotes = COALESCE($2, adminnotes)
       WHERE transactionid = $3`,
      [adminId, adminNotes, transactionId]
    );

    // Create Purchase entries and update Recipe.PurchaseCount
    const purchaseIds = [];
    for (const recipe of recipesResult.rows) {
      // Check if purchase already exists (shouldn't happen, but safety check)
      const existingPurchase = await client.query(
        'SELECT purchaseid FROM Purchase WHERE userid = $1 AND recipeid = $2',
        [transaction.userid, recipe.recipeid]
      );

      if (existingPurchase.rows.length === 0) {
        // Create purchase entry
        const purchaseResult = await client.query(
          `INSERT INTO Purchase (userid, recipeid, price)
           VALUES ($1, $2, $3)
           ON CONFLICT (userid, recipeid) DO NOTHING
           RETURNING purchaseid`,
          [transaction.userid, recipe.recipeid, recipe.price]
        );

        if (purchaseResult.rows.length > 0) {
          purchaseIds.push(purchaseResult.rows[0].purchaseid);
          
          // Update Recipe.PurchaseCount
          await client.query(
            'UPDATE Recipe SET purchasecount = purchasecount + 1 WHERE recipeid = $1',
            [recipe.recipeid]
          );
        }
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    return {
      transactionId,
      status: 'verified',
      purchaseCount: purchaseIds.length,
      purchaseIds
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Reject a transaction (admin only)
 * @param {number} transactionId - Transaction ID
 * @param {number} adminId - Admin user ID
 * @param {string} adminNotes - Admin notes explaining rejection
 * @returns {Promise<Object>} Rejection result
 * @throws {Error} If transaction not found or already processed
 */
async function rejectTransaction(transactionId, adminId, adminNotes) {
  const client = await pool.connect();
  
  try {
    // Check if transaction exists and is pending
    const transactionCheck = await client.query(
      'SELECT transactionid, status FROM Transaction WHERE transactionid = $1',
      [transactionId]
    );

    if (transactionCheck.rows.length === 0) {
      throw new Error('Transaction not found');
    }

    const transaction = transactionCheck.rows[0];

    if (transaction.status === 'verified') {
      throw new Error('Cannot reject a verified transaction');
    }

    if (transaction.status === 'rejected') {
      throw new Error('Transaction is already rejected');
    }

    if (!adminNotes || adminNotes.trim().length === 0) {
      throw new Error('Admin notes are required when rejecting a transaction');
    }

    // Update transaction status
    const result = await client.query(
      `UPDATE Transaction 
       SET status = 'rejected',
           verifiedby = $1,
           adminnotes = $2
       WHERE transactionid = $3
       RETURNING transactionid, status, adminnotes`,
      [adminId, adminNotes.trim(), transactionId]
    );

    return {
      transactionId: result.rows[0].transactionid,
      status: result.rows[0].status,
      adminNotes: result.rows[0].adminnotes
    };

  } finally {
    client.release();
  }
}

module.exports = {
  createTransaction,
  submitPayment,
  getUserTransactions,
  getAllTransactions,
  verifyTransaction,
  rejectTransaction
};

