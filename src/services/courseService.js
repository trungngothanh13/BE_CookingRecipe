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
      c.createdat as "createdAt",
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
      createdAt: course.createdAt,
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

async function assertCoursePurchase(userId, courseId) {
  const purchaseResult = await pool.query(
    `SELECT accessid
    FROM CourseAccess
    WHERE userid = $1 AND courseid = $2
    LIMIT 1`,
    [userId, courseId]
  );

  if (purchaseResult.rows.length === 0) {
    throw new Error('Course access denied');
  }
}

async function hasCourseAccess(userId, courseId) {
  const result = await pool.query(
    'SELECT 1 FROM CourseAccess WHERE userid = $1 AND courseid = $2 LIMIT 1',
    [userId, courseId]
  );
  return result.rows.length > 0;
}

async function getCourseLearningDetail(courseId, userId) {
  await assertCoursePurchase(userId, courseId);

  const courseResult = await pool.query(
    `SELECT
      c.courseid as id,
      c.coursetitle as title,
      c.description,
      c.thumbnail,
      c.difficulty,
      c.duration,
      c.modulecount as "moduleCount"
    FROM Course c
    WHERE c.courseid = $1`,
    [courseId]
  );

  if (courseResult.rows.length === 0) {
    throw new Error('Course not found');
  }

  const lessonsResult = await pool.query(
    `SELECT
      m.moduleid as "moduleId",
      m.moduletitle as "moduleTitle",
      m.description as "moduleDescription",
      m.moduleorder as "moduleOrder",
      l.lessonid as id,
      l.lessontitle as title,
      l.description,
      l.lessonorder as "lessonOrder",
      l.contenttype as "contentType",
      l.durationminutes as "durationMinutes",
      lc.articletext as "articleText",
      lc.videourl as "videoUrl",
      lc.videoduration as "videoDuration",
      lc.assignmentquestions as "assignmentQuestions",
      lc.passingscore as "passingScore",
      COALESCE(sp.iscompleted, false) as "isCompleted",
      sp.score as score
    FROM Module m
    LEFT JOIN Lesson l ON l.moduleid = m.moduleid
    LEFT JOIN LessonContent lc ON lc.lessonid = l.lessonid
    LEFT JOIN StudentProgress sp ON sp.lessonid = l.lessonid AND sp.userid = $2
    WHERE m.courseid = $1
    ORDER BY m.moduleorder ASC, l.lessonorder ASC`,
    [courseId, userId]
  );

  const modulesMap = new Map();
  let completedLessons = 0;
  let totalLessons = 0;
  let totalProgressScore = 0;

  for (const row of lessonsResult.rows) {
    if (!modulesMap.has(row.moduleId)) {
      modulesMap.set(row.moduleId, {
        id: row.moduleId,
        title: row.moduleTitle,
        description: row.moduleDescription,
        order: row.moduleOrder,
        lessons: []
      });
    }

    if (row.id) {
      const contentType = (row.contentType || '').toLowerCase();
      const assignmentPassingScore = row.passingScore || 70;
      const assignmentScore = row.score === null || row.score === undefined
        ? 0
        : Number(row.score);
      const isAssignmentPassed = contentType === 'assignment' && assignmentScore > assignmentPassingScore;
      const lessonScore = contentType === 'assignment'
        ? assignmentScore
        : (row.isCompleted ? 100 : 0);
      const isLessonCompleted = contentType === 'assignment'
        ? isAssignmentPassed
        : row.isCompleted;

      totalLessons += 1;
      totalProgressScore += lessonScore;
      if (isLessonCompleted) completedLessons += 1;
      modulesMap.get(row.moduleId).lessons.push({
        id: row.id,
        title: row.title,
        description: row.description,
        order: row.lessonOrder,
        contentType: row.contentType,
        durationMinutes: row.durationMinutes,
        isCompleted: isLessonCompleted,
        score: contentType === 'assignment' ? assignmentScore : null,
        content: {
          articleText: row.articleText,
          videoUrl: row.videoUrl,
          videoDuration: row.videoDuration,
          assignmentQuestions: row.assignmentQuestions || [],
          passingScore: row.passingScore || 70
        }
      });
    }
  }

  const progressPercent = totalLessons === 0
    ? 0
    : Math.round(totalProgressScore / totalLessons);

  return {
    course: courseResult.rows[0],
    modules: Array.from(modulesMap.values()),
    progress: {
      completedLessons,
      totalLessons,
      percent: progressPercent
    }
  };
}

async function findLessonForCourse(courseId, lessonId) {
  const lessonResult = await pool.query(
    `SELECT
      l.lessonid as id,
      l.contenttype as "contentType"
    FROM Lesson l
    JOIN Module m ON m.moduleid = l.moduleid
    WHERE l.lessonid = $1 AND m.courseid = $2
    LIMIT 1`,
    [lessonId, courseId]
  );

  if (lessonResult.rows.length === 0) {
    throw new Error('Lesson not found');
  }

  return lessonResult.rows[0];
}

async function markLessonProgress(userId, courseId, lessonId, isCompleted) {
  await assertCoursePurchase(userId, courseId);

  const lesson = await findLessonForCourse(courseId, lessonId);
  if ((lesson.contentType || '').toLowerCase() === 'assignment') {
    throw new Error('Assignment progress must be updated from assignment submission');
  }

  await pool.query(
    `INSERT INTO StudentProgress (userid, lessonid, iscompleted, completedat, updatedat)
    VALUES ($1, $2, $3, CASE WHEN $3 THEN NOW() ELSE NULL END, NOW())
    ON CONFLICT (userid, lessonid)
    DO UPDATE SET
      iscompleted = EXCLUDED.iscompleted,
      completedat = CASE WHEN EXCLUDED.iscompleted THEN NOW() ELSE NULL END,
      updatedat = NOW()`,
    [userId, lessonId, isCompleted]
  );

  return getCourseLearningDetail(courseId, userId);
}

async function submitAssignment(userId, courseId, lessonId, answers = []) {
  await assertCoursePurchase(userId, courseId);

  const lesson = await findLessonForCourse(courseId, lessonId);
  if ((lesson.contentType || '').toLowerCase() !== 'assignment') {
    throw new Error('Lesson is not an assignment');
  }

  const contentResult = await pool.query(
    `SELECT assignmentquestions as "assignmentQuestions", passingscore as "passingScore"
    FROM LessonContent
    WHERE lessonid = $1
    LIMIT 1`,
    [lessonId]
  );

  if (contentResult.rows.length === 0) {
    throw new Error('Assignment content not found');
  }

  const assignment = contentResult.rows[0];
  const questions = Array.isArray(assignment.assignmentQuestions) ? assignment.assignmentQuestions : [];
  const passingScore = assignment.passingScore || 70;

  if (questions.length === 0) {
    throw new Error('Assignment has no questions');
  }

  let correctAnswers = 0;
  questions.forEach((question, idx) => {
    if (Number(answers[idx]) === Number(question.correct)) {
      correctAnswers += 1;
    }
  });

  const score = Math.round((correctAnswers / questions.length) * 100);
  const passed = score >= passingScore;

  await pool.query(
    `INSERT INTO StudentProgress (userid, lessonid, iscompleted, completedat, score, updatedat)
    VALUES ($1, $2, $3, CASE WHEN $3 THEN NOW() ELSE NULL END, $4, NOW())
    ON CONFLICT (userid, lessonid)
    DO UPDATE SET
      iscompleted = EXCLUDED.iscompleted,
      completedat = CASE WHEN EXCLUDED.iscompleted THEN NOW() ELSE NULL END,
      score = EXCLUDED.score,
      updatedat = NOW()`,
    [userId, lessonId, passed, score]
  );

  return {
    score,
    passed,
    passingScore,
    learning: await getCourseLearningDetail(courseId, userId)
  };
}

async function getPurchasedCourseIds(userId) {
  const result = await pool.query(
    'SELECT courseid FROM CourseAccess WHERE userid = $1 ORDER BY courseid ASC',
    [userId]
  );
  return result.rows.map((row) => Number(row.courseid));
}

function normalizeDifficulty(value) {
  const normalized = String(value || 'beginner').toLowerCase();
  if (['beginner', 'intermediate', 'advanced'].includes(normalized)) {
    return normalized;
  }
  return 'beginner';
}

function normalizeContentType(value) {
  const normalized = String(value || 'article').toLowerCase();
  if (['article', 'video', 'assignment'].includes(normalized)) {
    return normalized;
  }
  return 'article';
}

function validateCoursePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload');
  }
  if (!payload.title || typeof payload.title !== 'string' || !payload.title.trim()) {
    throw new Error('Course title is required');
  }
  const modules = Array.isArray(payload.modules) ? payload.modules : [];
  modules.forEach((module, moduleIndex) => {
    if (!module.title || typeof module.title !== 'string' || !module.title.trim()) {
      throw new Error(`Module title is required at index ${moduleIndex}`);
    }
    const lessons = Array.isArray(module.lessons) ? module.lessons : [];
    lessons.forEach((lesson, lessonIndex) => {
      if (!lesson.title || typeof lesson.title !== 'string' || !lesson.title.trim()) {
        throw new Error(`Lesson title is required at module ${moduleIndex}, lesson ${lessonIndex}`);
      }
    });
  });
}

async function getAdminCourseDetail(courseId) {
  const courseResult = await pool.query(
    `SELECT
      courseid as id,
      coursetitle as title,
      description,
      thumbnail,
      price,
      difficulty,
      duration,
      category,
      modulecount as "moduleCount",
      viewcount as "viewCount",
      purchasecount as "purchaseCount",
      averagerating as rating,
      createdat as "createdAt",
      updatedat as "updatedAt"
    FROM Course
    WHERE courseid = $1`,
    [courseId]
  );
  if (courseResult.rows.length === 0) throw new Error('Course not found');

  const modulesResult = await pool.query(
    `SELECT
      m.moduleid as id,
      m.moduletitle as title,
      m.description,
      m.moduleorder as "order",
      m.updatedat as "updatedAt",
      l.lessonid as "lessonId",
      l.lessontitle as "lessonTitle",
      l.description as "lessonDescription",
      l.lessonorder as "lessonOrder",
      l.contenttype as "contentType",
      l.durationminutes as "durationMinutes",
      lc.articletext as "articleText",
      lc.videourl as "videoUrl",
      lc.videoduration as "videoDuration",
      lc.assignmentquestions as "assignmentQuestions",
      lc.passingscore as "passingScore"
    FROM Module m
    LEFT JOIN Lesson l ON l.moduleid = m.moduleid
    LEFT JOIN LessonContent lc ON lc.lessonid = l.lessonid
    WHERE m.courseid = $1
    ORDER BY m.moduleorder ASC, l.lessonorder ASC`,
    [courseId]
  );

  const modulesMap = new Map();
  for (const row of modulesResult.rows) {
    if (!modulesMap.has(row.id)) {
      modulesMap.set(row.id, {
        id: row.id,
        title: row.title,
        description: row.description,
        order: row.order,
        updatedAt: row.updatedAt,
        lessons: []
      });
    }
    if (row.lessonId) {
      modulesMap.get(row.id).lessons.push({
        id: row.lessonId,
        title: row.lessonTitle,
        description: row.lessonDescription,
        order: row.lessonOrder,
        contentType: row.contentType,
        durationMinutes: row.durationMinutes,
        content: {
          articleText: row.articleText,
          videoUrl: row.videoUrl,
          videoDuration: row.videoDuration,
          assignmentQuestions: row.assignmentQuestions || [],
          passingScore: row.passingScore || 70
        }
      });
    }
  }

  return {
    course: {
      ...courseResult.rows[0],
      price: parseFloat(courseResult.rows[0].price),
      rating: parseFloat(courseResult.rows[0].rating || 0)
    },
    modules: Array.from(modulesMap.values())
  };
}

async function createOrReplaceCourse(courseId, payload) {
  validateCoursePayload(payload);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let currentCourseId = courseId;
    const modules = Array.isArray(payload.modules) ? payload.modules : [];
    const explicitDuration = Number(payload.duration ?? 0);
    const computedDuration = modules.reduce((sum, module) => {
      const lessons = Array.isArray(module.lessons) ? module.lessons : [];
      return sum + lessons.reduce((acc, lesson) => acc + Number(lesson.durationMinutes || 0), 0);
    }, 0);
    const duration = explicitDuration > 0 ? explicitDuration : computedDuration;

    if (currentCourseId) {
      const exists = await client.query('SELECT courseid FROM Course WHERE courseid = $1', [currentCourseId]);
      if (exists.rows.length === 0) throw new Error('Course not found');

      await client.query(
        `UPDATE Course
         SET coursetitle = $1,
             description = $2,
             thumbnail = $3,
             price = $4,
             difficulty = $5,
             duration = $6,
             modulecount = $7,
             category = $8,
             updatedat = NOW()
         WHERE courseid = $9`,
        [
          payload.title.trim(),
          payload.description || null,
          payload.thumbnail || null,
          Number(payload.price || 0),
          normalizeDifficulty(payload.difficulty),
          duration,
          modules.length,
          payload.category || null,
          currentCourseId
        ]
      );

      await client.query('DELETE FROM Module WHERE courseid = $1', [currentCourseId]);
    } else {
      const insertResult = await client.query(
        `INSERT INTO Course (coursetitle, description, thumbnail, price, difficulty, duration, modulecount, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING courseid`,
        [
          payload.title.trim(),
          payload.description || null,
          payload.thumbnail || null,
          Number(payload.price || 0),
          normalizeDifficulty(payload.difficulty),
          duration,
          modules.length,
          payload.category || null
        ]
      );
      currentCourseId = insertResult.rows[0].courseid;
    }

    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex += 1) {
      const module = modules[moduleIndex];
      const moduleOrder = Number(module.order || moduleIndex + 1);
      const moduleResult = await client.query(
        `INSERT INTO Module (courseid, moduletitle, description, moduleorder)
         VALUES ($1, $2, $3, $4)
         RETURNING moduleid`,
        [currentCourseId, module.title.trim(), module.description || null, moduleOrder]
      );
      const moduleId = moduleResult.rows[0].moduleid;
      const lessons = Array.isArray(module.lessons) ? module.lessons : [];

      for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex += 1) {
        const lesson = lessons[lessonIndex];
        const contentType = normalizeContentType(lesson.contentType);
        const lessonOrder = Number(lesson.order || lessonIndex + 1);
        const lessonResult = await client.query(
          `INSERT INTO Lesson (moduleid, lessontitle, description, lessonorder, contenttype, durationminutes)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING lessonid`,
          [
            moduleId,
            lesson.title.trim(),
            lesson.description || null,
            lessonOrder,
            contentType,
            Number(lesson.durationMinutes || 0)
          ]
        );
        const lessonId = lessonResult.rows[0].lessonid;
        const content = lesson.content || {};

        await client.query(
          `INSERT INTO LessonContent (lessonid, contenttype, articletext, videourl, videoduration, assignmentquestions, passingscore)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            lessonId,
            contentType,
            contentType === 'article' ? (content.articleText || '') : null,
            contentType === 'video' ? (content.videoUrl || '') : null,
            contentType === 'video' ? Number(content.videoDuration || 0) : null,
            contentType === 'assignment' ? JSON.stringify(content.assignmentQuestions || []) : null,
            contentType === 'assignment' ? Number(content.passingScore || 70) : 70
          ]
        );
      }
    }

    await client.query('COMMIT');
    return getAdminCourseDetail(currentCourseId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function createCourse(payload) {
  return createOrReplaceCourse(null, payload);
}

async function updateCourse(courseId, payload) {
  return createOrReplaceCourse(courseId, payload);
}

async function deleteCourse(courseId) {
  const result = await pool.query('DELETE FROM Course WHERE courseid = $1 RETURNING courseid', [courseId]);
  if (result.rows.length === 0) throw new Error('Course not found');
  return { id: courseId };
}

async function getCourseReviews(courseId, currentUserId = null) {
  const courseExists = await pool.query('SELECT courseid FROM Course WHERE courseid = $1', [courseId]);
  if (courseExists.rows.length === 0) throw new Error('Course not found');

  const reviewsResult = await pool.query(
    `SELECT
      cr.reviewid as id,
      cr.userid as "userId",
      u.username,
      cr.ratingscore as rating,
      cr.reviewtext as comment,
      cr.createdat as "createdAt",
      cr.updatedat as "updatedAt"
    FROM CourseReview cr
    INNER JOIN "User" u ON u.userid = cr.userid
    WHERE cr.courseid = $1
    ORDER BY cr.updatedat DESC`,
    [courseId]
  );

  const summaryResult = await pool.query(
    `SELECT
      COALESCE(ROUND(AVG(ratingscore)::numeric, 2), 0) as rating,
      COUNT(*)::int as count
    FROM CourseReview
    WHERE courseid = $1`,
    [courseId]
  );

  const canReview = currentUserId ? await hasCourseAccess(currentUserId, courseId) : false;
  const myReview = currentUserId
    ? reviewsResult.rows.find((row) => Number(row.userId) === Number(currentUserId)) || null
    : null;

  return {
    summary: {
      rating: parseFloat(summaryResult.rows[0].rating || 0),
      count: Number(summaryResult.rows[0].count || 0)
    },
    canReview,
    myReview,
    reviews: reviewsResult.rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      username: row.username,
      rating: Number(row.rating),
      comment: row.comment || '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }))
  };
}

async function upsertCourseReview(userId, courseId, rating, comment = '') {
  const courseExists = await pool.query('SELECT courseid FROM Course WHERE courseid = $1', [courseId]);
  if (courseExists.rows.length === 0) throw new Error('Course not found');

  const canReview = await hasCourseAccess(userId, courseId);
  if (!canReview) throw new Error('Course access denied');

  const score = Number(rating);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error('Rating must be an integer from 1 to 5');
  }

  const reviewResult = await pool.query(
    `INSERT INTO CourseReview (courseid, userid, ratingscore, reviewtext, createdat, updatedat)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (courseid, userid)
     DO UPDATE SET
       ratingscore = EXCLUDED.ratingscore,
       reviewtext = EXCLUDED.reviewtext,
       updatedat = NOW()
     RETURNING
       reviewid as id,
       userid as "userId",
       ratingscore as rating,
       reviewtext as comment,
       createdat as "createdAt",
       updatedat as "updatedAt"`,
    [courseId, userId, score, String(comment || '').trim()]
  );

  await pool.query(
    `UPDATE Course
     SET averagerating = COALESCE((SELECT ROUND(AVG(ratingscore)::numeric, 2) FROM CourseReview WHERE courseid = $1), 0)
     WHERE courseid = $1`,
    [courseId]
  );

  return reviewResult.rows[0];
}

async function deleteCourseReview(userId, courseId) {
  const result = await pool.query(
    'DELETE FROM CourseReview WHERE courseid = $1 AND userid = $2 RETURNING reviewid',
    [courseId, userId]
  );
  if (result.rows.length === 0) throw new Error('Review not found');

  await pool.query(
    `UPDATE Course
     SET averagerating = COALESCE((SELECT ROUND(AVG(ratingscore)::numeric, 2) FROM CourseReview WHERE courseid = $1), 0)
     WHERE courseid = $1`,
    [courseId]
  );
}

module.exports = {
  getCoursesOverview,
  getCourseOverviewDetail,
  getCourseLearningDetail,
  markLessonProgress,
  submitAssignment,
  getPurchasedCourseIds,
  getAdminCourseDetail,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseReviews,
  upsertCourseReview,
  deleteCourseReview
};
