const pool = require('../config/database');

function normalizeOrderItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const courseId = Number(item.courseId ?? item.courseid ?? item.recipeId ?? 0);
      const price = parseFloat(item.price ?? 0);
      if (!courseId || Number.isNaN(price)) return null;
      const thumbnail = item.thumbnail ?? item.videoThumbnail ?? null;
      return {
        courseId,
        recipeId: courseId,
        title: item.title ?? '',
        thumbnail,
        videoThumbnail: thumbnail,
        price,
      };
    })
    .filter(Boolean);
}

async function createTransaction(userId) {
  const client = await pool.connect();
  try {
    const cartResult = await client.query(
      `SELECT c.courseid, co.coursetitle, co.price, co.thumbnail
       FROM CartItem c
       INNER JOIN Course co ON c.courseid = co.courseid
       WHERE c.userid = $1`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      throw new Error('Cart is empty');
    }

    const items = cartResult.rows.map((row) => ({
      courseId: row.courseid,
      title: row.coursetitle,
      thumbnail: row.thumbnail,
      price: parseFloat(row.price),
    }));
    const total = items.reduce((sum, item) => sum + item.price, 0);

    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO "Order" (userid, totalamount, items, status)
       VALUES ($1, $2, $3::jsonb, 'pending')
       RETURNING orderid as id, userid as "userId", totalamount as "totalAmount", status, createdat as "createdAt"`,
      [userId, total, JSON.stringify(items)]
    );
    await client.query('DELETE FROM CartItem WHERE userid = $1', [userId]);
    await client.query('COMMIT');

    const order = result.rows[0];
    const normalized = normalizeOrderItems(items);
    return {
      id: order.id,
      userId: order.userId,
      totalAmount: parseFloat(order.totalAmount),
      status: order.status,
      createdAt: order.createdAt,
      courses: normalized,
      recipes: normalized,
      itemCount: normalized.length,
      courseCount: normalized.length,
      recipeCount: normalized.length,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function submitPayment(transactionId, userId, paymentMethod, paymentProof) {
  const client = await pool.connect();
  try {
    const check = await client.query(
      'SELECT orderid, status FROM "Order" WHERE orderid = $1 AND userid = $2',
      [transactionId, userId]
    );
    if (check.rows.length === 0) {
      throw new Error('Transaction not found or you do not have permission to update it');
    }
    if (check.rows[0].status !== 'pending') {
      throw new Error(`Cannot submit payment for transaction with status: ${check.rows[0].status}`);
    }
    if (!paymentMethod || paymentMethod.trim().length === 0) {
      throw new Error('Payment method is required');
    }
    if (!paymentProof || paymentProof.trim().length === 0) {
      throw new Error('Payment proof is required');
    }

    const result = await client.query(
      `UPDATE "Order"
       SET paymentmethod = $1, paymentproof = $2
       WHERE orderid = $3
       RETURNING orderid as id, userid as "userId", totalamount as "totalAmount",
                 paymentmethod as "paymentMethod", paymentproof as "paymentProof",
                 status, createdat as "createdAt"`,
      [paymentMethod.trim(), paymentProof.trim(), transactionId]
    );

    return {
      id: result.rows[0].id,
      userId: result.rows[0].userId,
      totalAmount: parseFloat(result.rows[0].totalAmount),
      paymentMethod: result.rows[0].paymentMethod,
      paymentProof: result.rows[0].paymentProof,
      status: result.rows[0].status,
      createdAt: result.rows[0].createdAt,
    };
  } finally {
    client.release();
  }
}

function shapeOrderRow(row) {
  const items = normalizeOrderItems(row.items);
  return {
    id: row.id,
    userId: row.userId,
    totalAmount: parseFloat(row.totalAmount),
    paymentMethod: row.paymentMethod,
    paymentProof: row.paymentProof,
    status: row.status,
    adminNotes: row.adminNotes,
    createdAt: row.createdAt,
    verifiedAt: row.verifiedAt,
    verifiedBy: row.verifiedBy,
    courseCount: items.length,
    recipeCount: items.length,
    courses: items,
    recipes: items,
  };
}

async function getUserTransactions(userId, status = null) {
  let query = `
    SELECT orderid as id, userid as "userId", totalamount as "totalAmount", items,
           paymentmethod as "paymentMethod", paymentproof as "paymentProof", status,
           adminnotes as "adminNotes", createdat as "createdAt",
           verifiedat as "verifiedAt", verifiedby as "verifiedBy"
    FROM "Order"
    WHERE userid = $1`;
  const params = [userId];
  if (status) {
    query += ' AND status = $2';
    params.push(status);
  }
  query += ' ORDER BY createdat DESC';

  const result = await pool.query(query, params);
  return result.rows.map(shapeOrderRow);
}

async function getAllTransactions(options = {}) {
  const { status = null, userId = null, page = 1, limit = 20 } = options;
  let query = `
    SELECT o.orderid as id, o.userid as "userId", u.username,
           o.totalamount as "totalAmount", o.items,
           o.paymentmethod as "paymentMethod", o.paymentproof as "paymentProof",
           o.status, o.createdat as "createdAt", o.verifiedat as "verifiedAt"
    FROM "Order" o
    LEFT JOIN "User" u ON o.userid = u.userid
    WHERE 1=1`;
  const params = [];
  let idx = 1;
  if (status) {
    query += ` AND o.status = $${idx++}`;
    params.push(status);
  }
  if (userId) {
    query += ` AND o.userid = $${idx++}`;
    params.push(userId);
  }
  query += ` ORDER BY o.createdat DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(limit, (page - 1) * limit);

  let countQuery = 'SELECT COUNT(*)::int as total FROM "Order" WHERE 1=1';
  const countParams = [];
  let cidx = 1;
  if (status) {
    countQuery += ` AND status = $${cidx++}`;
    countParams.push(status);
  }
  if (userId) {
    countQuery += ` AND userid = $${cidx++}`;
    countParams.push(userId);
  }

  const [rowsResult, countResult] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, countParams),
  ]);
  const total = Number(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    transactions: rowsResult.rows.map((row) => {
      const shaped = shapeOrderRow(row);
      return {
        id: shaped.id,
        userId: shaped.userId,
        username: row.username,
        totalAmount: shaped.totalAmount,
        paymentMethod: shaped.paymentMethod,
        paymentProof: shaped.paymentProof,
        status: shaped.status,
        createdAt: shaped.createdAt,
        verifiedAt: shaped.verifiedAt,
        courseCount: shaped.courseCount,
        recipeCount: shaped.recipeCount,
      };
    }),
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages,
    },
  };
}

async function verifyTransaction(transactionId, adminId, adminNotes = null) {
  const client = await pool.connect();
  try {
    const check = await client.query(
      'SELECT orderid, userid, status, items FROM "Order" WHERE orderid = $1',
      [transactionId]
    );
    if (check.rows.length === 0) throw new Error('Transaction not found');

    const order = check.rows[0];
    if (order.status === 'verified') throw new Error('Transaction is already verified');
    if (order.status === 'rejected') throw new Error('Cannot verify a rejected transaction');

    const items = normalizeOrderItems(order.items);
    if (items.length === 0) throw new Error('Transaction has no courses');

    await client.query('BEGIN');
    await client.query(
      `UPDATE "Order"
       SET status = 'verified', verifiedat = CURRENT_TIMESTAMP, verifiedby = $1,
           adminnotes = COALESCE($2, adminnotes)
       WHERE orderid = $3`,
      [adminId, adminNotes, transactionId]
    );

    const accessIds = [];
    for (const item of items) {
      const existing = await client.query(
        'SELECT accessid FROM CourseAccess WHERE userid = $1 AND courseid = $2',
        [order.userid, item.courseId]
      );
      if (existing.rows.length > 0) continue;

      const created = await client.query(
        `INSERT INTO CourseAccess (userid, courseid, price)
         VALUES ($1, $2, $3)
         ON CONFLICT (userid, courseid) DO NOTHING
         RETURNING accessid`,
        [order.userid, item.courseId, item.price]
      );
      if (created.rows.length > 0) {
        accessIds.push(created.rows[0].accessid);
        await client.query(
          'UPDATE Course SET purchasecount = COALESCE(purchasecount, 0) + 1 WHERE courseid = $1',
          [item.courseId]
        );
      }
    }

    await client.query('COMMIT');
    return {
      transactionId,
      status: 'verified',
      purchaseCount: accessIds.length,
      purchaseIds: accessIds,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function rejectTransaction(transactionId, adminId, adminNotes) {
  const client = await pool.connect();
  try {
    const check = await client.query(
      'SELECT orderid, status FROM "Order" WHERE orderid = $1',
      [transactionId]
    );
    if (check.rows.length === 0) throw new Error('Transaction not found');
    if (check.rows[0].status === 'verified') throw new Error('Cannot reject a verified transaction');
    if (check.rows[0].status === 'rejected') throw new Error('Transaction is already rejected');
    if (!adminNotes || adminNotes.trim().length === 0) {
      throw new Error('Admin notes are required when rejecting a transaction');
    }

    const result = await client.query(
      `UPDATE "Order"
       SET status = 'rejected', verifiedby = $1, adminnotes = $2
       WHERE orderid = $3
       RETURNING orderid as "transactionId", status, adminnotes as "adminNotes"`,
      [adminId, adminNotes.trim(), transactionId]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function getTransactionById(transactionId, userId, userRole) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT orderid as id, userid as "userId", totalamount as "totalAmount", items,
              paymentmethod as "paymentMethod", paymentproof as "paymentProof",
              status, adminnotes as "adminNotes", createdat as "createdAt",
              verifiedat as "verifiedAt", verifiedby as "verifiedBy"
       FROM "Order"
       WHERE orderid = $1`,
      [transactionId]
    );
    if (result.rows.length === 0) throw new Error('Transaction not found');

    const row = result.rows[0];
    if (userRole !== 'admin' && row.userId !== userId) {
      throw new Error('Access denied. You do not have permission to view this transaction.');
    }
    return shapeOrderRow(row);
  } finally {
    client.release();
  }
}

module.exports = {
  createTransaction,
  submitPayment,
  getUserTransactions,
  getAllTransactions,
  getTransactionById,
  verifyTransaction,
  rejectTransaction,
};
