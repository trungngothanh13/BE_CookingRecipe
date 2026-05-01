const pool = require('../config/database');

function mapCartCourseRow(row) {
  const d = Number(row.durationminutes ?? 0);
  const lc =
    typeof row.lesson_count === 'string'
      ? parseInt(row.lesson_count, 10)
      : Number(row.lesson_count ?? 0);

  const priceRaw = parseFloat(row.price ?? 0);
  const discountedRaw = parseFloat(row.discountedprice ?? row.price ?? 0);

  return {
    itemId: row.cartid,
    cartId: row.cartid,
    courseId: row.courseid,
    instructorName: row.instructorname ?? null,
    title: row.title,
    thumbnail: row.thumbnail,
    difficultyLevel: row.difficultylevel,
    lessonCount: lc,
    estimatedDurationMinutes: Number.isFinite(d) ? d : 0,
    price: Number.isFinite(priceRaw) ? priceRaw : 0,
    discountedPrice: Number.isFinite(discountedRaw) ? discountedRaw : priceRaw,
    discountedprice: Number.isFinite(discountedRaw) ? discountedRaw : priceRaw,
    instructorId: row.instructoruserid,
    creatorId: row.instructoruserid,
  };
}

async function getCartCourses(userId) {
  try {
    const result = await pool.query(
      `SELECT c.cartid AS cartid, c.courseid AS courseid, co.coursetitle AS title, co.thumbnail AS thumbnail,
              co.price AS price, co.price AS discountedprice,
              co.difficulty AS difficultylevel, co.duration AS durationminutes,
              (SELECT COUNT(*)::int FROM Lesson l
               INNER JOIN Module m ON m.moduleid = l.moduleid
               WHERE m.courseid = co.courseid) AS lesson_count,
              NULL::text AS instructorname, NULL::int AS instructoruserid
       FROM CartItem c
       INNER JOIN course co ON c.courseid = co.courseid
       WHERE c.userid = $1`,
      [userId]
    );

    const coursesWithDetails = [];
    result.rows.forEach((row) => {
      coursesWithDetails.push(mapCartCourseRow(row));
    });

    let totalPrice = 0;
    coursesWithDetails.forEach((course) => {
      totalPrice += course.discountedPrice ?? course.price ?? 0;
    });

    return {
      success: true,
      courses: coursesWithDetails,
      totalPrice,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: error.message };
  }
}

async function addCourseToCart(userId, courseId) {
  try {
    if (!courseId) {
      return { success: false, message: 'Course ID required' };
    }

    const courseCheck = await pool.query(
      'SELECT accessid FROM CourseAccess WHERE userid = $1 AND courseid = $2',
      [userId, courseId]
    );
    if (courseCheck.rows.length > 0) {
      return {
        success: false,
        message: 'Already purchased.',
      };
    }

    const dup = await pool.query(
      'SELECT 1 FROM CartItem WHERE userid = $1 AND courseid = $2 LIMIT 1',
      [userId, courseId]
    );
    if (dup.rows.length > 0) {
      const cart = await getCartCourses(userId);
      return { success: false, alreadyInCart: true, cart: cart.courses ?? [] };
    }

    await pool.query('INSERT INTO CartItem (userid, courseid) VALUES ($1, $2)', [userId, courseId]);
    const cart = await getCartCourses(userId);
    return {
      success: true,
      message: 'Course added to cart!',
      cart: cart.courses,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: error.message };
  }
}

async function removeCourseFromCart(userId, courseId = null, cartRowId = null) {
  try {
    let result;

    if (cartRowId) {
      result = await pool.query('DELETE FROM CartItem WHERE cartid = $1 AND userid = $2 RETURNING *', [cartRowId, userId]);
    } else if (courseId !== null && courseId !== undefined) {
      result = await pool.query(
        `DELETE FROM CartItem WHERE userid = $1 AND cartid IN (
           SELECT MIN(c.cartid)
           FROM CartItem c
           WHERE c.courseid = $2 AND c.userid = $1
         ) RETURNING *`,
        [userId, courseId]
      );
      if ((result.rows || []).length === 0) {
        await pool.query('DELETE FROM CartItem WHERE userid = $1 AND courseid = $2 RETURNING *', [userId, courseId]);
      }
    } else {
      return { success: false, message: 'Course ID required' };
    }

    const cart = await getCartCourses(userId);
    return {
      success: true,
      message: 'Course deleted from cart',
      deletedCount: Array.isArray(result?.rows) ? result.rows.length : 0,
      cart: cart.courses ?? [],
      totalPrice: cart.totalPrice,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: error.message };
  }
}

async function clearCart(userId) {
  await pool.query('DELETE FROM CartItem WHERE userid = $1', [userId]);
  const cart = await getCartCourses(userId);
  return {
    success: true,
    message: 'cart cleared!',
    deletedCount: 0,
    cart: [],
    totalPrice: 0,
  };
}

module.exports = {
  clearCart,
  getCartCourses,
  addCourseToCart,
  removeCourseFromCart,
};
