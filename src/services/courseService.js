const pool = require('../config/database');

/**
 * Get courses overview (public access)
 * @param {Object} options - Query options
 * @param {string} options.search - Search by title or category
 * @param {string} options.sortBy - Sort by (price, newest, rating, popular)
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @returns {Promise<Object>} Courses overview with pagination
 */
async function getCoursesOverview(options = {}) {
  const {
    search,
    sortBy = 'newest',
    page = 1,
    limit = 20
  } = options;

  let query = `
    SELECT 
      c.courseid as id,
      c.coursetitle as title,
      c.description,
      c.thumbnail as thumbnail,
      c.price,
      c.difficulty,
      c.duration,
      COALESCE(module_counts.modulecount, 0) as "moduleCount",
      COALESCE(course_ratings.rating, c.averagerating, 0) as rating
    FROM Course c
    LEFT JOIN (
      SELECT courseid, COUNT(*) as modulecount
      FROM Module
      GROUP BY courseid
    ) module_counts ON module_counts.courseid = c.courseid
    LEFT JOIN (
      SELECT courseid, ROUND(AVG(ratingscore)::numeric, 2) as rating
      FROM CourseReview
      GROUP BY courseid
    ) course_ratings ON course_ratings.courseid = c.courseid
    WHERE 1=1
  `;

  const queryParams = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (
      LOWER(c.coursetitle) LIKE LOWER($${paramIndex})
      OR LOWER(c.category) LIKE LOWER($${paramIndex})
    )`;
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  switch (sortBy) {
    case 'price':
      query += ' ORDER BY c.price ASC, c.createdat DESC';
      break;
    case 'rating':
      query += ' ORDER BY rating DESC, c.createdat DESC';
      break;
    case 'popular':
      query += ' ORDER BY c.purchasecount DESC, c.viewcount DESC';
      break;
    case 'newest':
    default:
      query += ' ORDER BY c.createdat DESC';
      break;
  }

  const offset = (page - 1) * limit;
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  queryParams.push(limit, offset);

  let countQuery = `
    SELECT COUNT(*) as total
    FROM Course c
    WHERE 1=1
  `;

  const countParams = [];
  let countParamIndex = 1;

  if (search) {
    countQuery += ` AND (
      LOWER(c.coursetitle) LIKE LOWER($${countParamIndex})
      OR LOWER(c.category) LIKE LOWER($${countParamIndex})
    )`;
    countParams.push(`%${search}%`);
    countParamIndex++;
  }

  const [coursesResult, countResult] = await Promise.all([
    pool.query(query, queryParams),
    pool.query(countQuery, countParams)
  ]);

  const total = parseInt(countResult.rows[0].total, 10);
  const totalPages = Math.ceil(total / limit);

  return {
    courses: coursesResult.rows.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      price: parseFloat(course.price),
      difficulty: course.difficulty,
      duration: course.duration,
      moduleCount: parseInt(course.moduleCount, 10),
      rating: parseFloat(course.rating)
    })),
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages
    }
  };
}

/**
 * Get course overview detail (public access)
 * @param {number} courseId - Course ID
 * @returns {Promise<Object>} Course detail with modules and lessons
 */
async function getCourseOverviewDetail(courseId) {
  const courseResult = await pool.query(
    `SELECT
      courseid as id,
      coursetitle as title,
      description,
      thumbnail,
      price,
      difficulty,
      duration,
      modulecount as "moduleCount",
      category,
      viewcount as "viewCount",
      purchasecount as "purchaseCount",
      averagerating as rating,
      updatedat as "updatedAt"
    FROM Course
    WHERE courseid = $1`,
    [courseId]
  );

  if (courseResult.rows.length === 0) {
    throw new Error('Course not found');
  }

  const modulesResult = await pool.query(
    `SELECT
      moduleid as id,
      moduletitle as title,
      description,
      moduleorder as "order",
      updatedat as "updatedAt"
    FROM Module
    WHERE courseid = $1
    ORDER BY moduleorder ASC`,
    [courseId]
  );

  const moduleIds = modulesResult.rows.map((row) => row.id);

  let lessonsByModule = {};
  if (moduleIds.length > 0) {
    const lessonsResult = await pool.query(
      `SELECT
        lessonid as id,
        moduleid as "moduleId",
        lessontitle as title,
        description,
        lessonorder as "order",
        contenttype as "contentType",
        durationminutes as "durationMinutes",
        updatedat as "updatedAt"
      FROM Lesson
      WHERE moduleid = ANY($1::int[])
      ORDER BY moduleid ASC, lessonorder ASC`,
      [moduleIds]
    );

    lessonsByModule = lessonsResult.rows.reduce((acc, lesson) => {
      if (!acc[lesson.moduleId]) {
        acc[lesson.moduleId] = [];
      }
      acc[lesson.moduleId].push(lesson);
      return acc;
    }, {});
  }

  const modules = modulesResult.rows.map((module) => ({
    id: module.id,
    title: module.title,
    description: module.description,
    order: module.order,
    updatedAt: module.updatedAt,
    lessons: lessonsByModule[module.id] || []
  }));

  const courseRow = courseResult.rows[0];

  return {
    course: {
      ...courseRow,
      price: parseFloat(courseRow.price),
      rating: courseRow.rating !== null ? parseFloat(courseRow.rating) : null
    },
    modules
  };
}

module.exports = {
  getCoursesOverview,
  getCourseOverviewDetail
};
