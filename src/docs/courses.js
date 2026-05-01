/**
 * @swagger
 * /api/courses:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Get courses overview (Public)
 *     description: Get a list of courses with optional search and sorting.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by course title or category
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, newest, rating, popular]
 *           default: newest
 *         description: Sort order
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
 *         description: Courses overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     courses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           thumbnail:
 *                             type: string
 *                           price:
 *                             type: number
 *                           difficulty:
 *                             type: string
 *                           duration:
 *                             type: integer
 *                           moduleCount:
 *                             type: integer
 *                           rating:
 *                             type: number
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
 */

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Get course overview detail (Public)
 *     description: Get a course overview with modules and lessons.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     course:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                         description:
 *                           type: string
 *                         thumbnail:
 *                           type: string
 *                         price:
 *                           type: number
 *                         difficulty:
 *                           type: string
 *                         duration:
 *                           type: integer
 *                         moduleCount:
 *                           type: integer
 *                         category:
 *                           type: string
 *                         viewCount:
 *                           type: integer
 *                         purchaseCount:
 *                           type: integer
 *                         rating:
 *                           type: number
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                     modules:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           lessons:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 title:
 *                                   type: string
 *                                 description:
 *                                   type: string
 *                                 contentType:
 *                                   type: string
 *                                 durationMinutes:
 *                                   type: integer
 *                                 updatedAt:
 *                                   type: string
 *                                   format: date-time
 *       404:
 *         description: Course not found
 */

/**
 * @swagger
 * /api/courses/{id}/learn:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Get course learning detail (Purchased users only)
 *     description: Returns modules, lessons, content, and progress for a purchased course.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Learning content retrieved successfully
 *       403:
 *         description: User has not purchased this course
 *       404:
 *         description: Course not found
 */

/**
 * @swagger
 * /api/courses/{courseId}/lessons/{lessonId}/progress:
 *   put:
 *     tags:
 *       - Courses
 *     summary: Update lesson completion state (Non-assignment lessons)
 *     description: Marks article/video lessons as completed or not completed and returns updated course learning detail.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isCompleted:
 *                 type: boolean
 *             required:
 *               - isCompleted
 *     responses:
 *       200:
 *         description: Lesson progress updated successfully
 *       400:
 *         description: Invalid payload or assignment lesson update attempted
 *       403:
 *         description: User has not purchased this course
 *       404:
 *         description: Lesson not found
 */

/**
 * @swagger
 * /api/courses/{courseId}/lessons/{lessonId}/assignment/submit:
 *   post:
 *     tags:
 *       - Courses
 *     summary: Submit assignment answers
 *     description: Evaluates assignment answers, stores score, determines pass by LessonContent passing score, and returns updated learning detail.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: integer
 *             required:
 *               - answers
 *     responses:
 *       200:
 *         description: Assignment submitted successfully
 *       400:
 *         description: Invalid request or non-assignment lesson
 *       403:
 *         description: User has not purchased this course
 *       404:
 *         description: Lesson or assignment content not found
 */
