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
